using System.Net;
using System.Text;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests.Conformance;

/// <summary>
/// The canonical create-to-cancel lifecycle from packages/conformance/fixtures.json, run live
/// against beta as one ordered fact with state flowing forward (the fixtures stay declarative;
/// there is no cross-language DSL). Wire shapes follow sdks/WIRE-NOTES.md: the template create
/// is multipart with the file under a part named "documents", the role rides in a follow-up
/// call because multipart text parts cannot carry it, and the field rides in a follow-up call
/// because the create-time fields array is validated but never persisted server-side. The
/// envelope's sole recipient is the test account itself so no mail leaves the tenant, and the
/// chain ends with a cancel so nothing stays actionable. The template and the canceled
/// envelope are left behind on purpose; beta etiquette tolerates a handful of records per run.
/// Shares the "conformance" collection with ConformanceTests so these writes never land
/// between a case's raw call and its SDK call.
/// </summary>
[Collection("conformance")]
public sealed class ChainTests
{
    private const string RoleName = "Recipient 1";
    private const string FieldName = "recipient-1-signature";

    private readonly ITestOutputHelper _output;

    public ChainTests(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public async Task CanonicalChain_TemplateToCanceledEnvelope()
    {
        var context = await ConformanceContext.GetSharedAsync();
        var cancellationToken = TestContext.Current.CancellationToken;
        var name = "SDK Conformance Chain " + Guid.NewGuid().ToString("N");

        // chain-create-template
        var template = await context.Sdk.Templates.CreateAsync(
            new CreateTemplateRequest { Name = name },
            [
                new TemplateFileUpload
                {
                    Content = new MemoryStream(MinimalPdf()),
                    FileName = "sdk-conformance-chain.pdf",
                    ContentType = "application/pdf",
                },
            ],
            cancellationToken);
        _output.WriteLine("chain template id: " + template.Id);
        Assert.True(Guid.TryParse(template.Id, out _), "Beta handed back a template id that is not a UUID.");
        Assert.Equal(name, template.Name);
        var document = Assert.Single(template.Documents ?? []);
        Assert.Equal(1, document.Pages);

        // chain-add-role
        var role = await context.Sdk.TemplateRoles.CreateAsync(
            template.Id,
            new CreateRoleRequest { Name = RoleName, Type = RecipientType.Signer },
            cancellationToken);
        Assert.Equal(template.Id, role.TemplateId);
        Assert.Equal(RoleName, role.Name);

        // chain-add-field
        var field = await context.Sdk.TemplateFields.CreateAsync(
            template.Id,
            new CreateFieldRequest
            {
                Name = FieldName,
                RoleName = RoleName,
                DocumentId = document.Id,
                Type = FieldType.Signature,
                Page = 0,
                X = 72,
                Y = 72,
            },
            cancellationToken);
        Assert.Equal(template.Id, field.TemplateId);
        Assert.Equal(document.Id, field.DocumentId);
        Assert.Equal(RoleName, field.RoleName);
        Assert.Equal(FieldType.Signature, field.Type);

        // Re-read the template to prove the role and field actually attached; trusting the
        // create responses alone would miss a write that vanished.
        var attached = await context.Sdk.Templates.GetAsync(template.Id, cancellationToken);
        Assert.Equal([RoleName], (attached.Roles ?? []).Select(entry => entry.Name));
        Assert.Equal([(FieldName, RoleName)], (attached.Fields ?? []).Select(entry => (entry.Name, entry.RoleName)));

        // chain-create-envelope: the email key is required on every recipient, and pointing it
        // at the test account keeps the invite inside the tenant.
        var envelope = await context.Sdk.Envelopes.CreateAsync(
            new CreateEnvelopeRequest
            {
                TemplateId = template.Id,
                Recipients =
                [
                    new CreateEnvelopeRecipient
                    {
                        RoleName = RoleName,
                        FirstName = "Conformance",
                        LastName = "Chain",
                        Email = context.Settings.Email,
                    },
                ],
                NoContact = true,
            },
            cancellationToken);
        _output.WriteLine("chain envelope id: " + envelope.Id);
        Assert.True(Guid.TryParse(envelope.Id, out _), "Beta handed back an envelope id that is not a UUID.");
        Assert.Equal(template.Id, envelope.TemplateId);
        Assert.Equal(EnvelopeStatus.Pending, envelope.Status);
        var recipient = Assert.Single(envelope.Recipients ?? []);
        Assert.Equal(RoleName, recipient.RoleName);
        Assert.Equal(context.Settings.Email, recipient.Email, ignoreCase: true);

        try
        {
            // chain-get-envelope: the SDK read equals the raw read under the same
            // normalization the fixture cases use.
            var (status, rawBody) = await context.RawGetAsync("/v2/envelopes/" + Uri.EscapeDataString(envelope.Id));
            Assert.Equal(HttpStatusCode.OK, status);
            var fetched = await context.Sdk.Envelopes.GetAsync(envelope.Id, cancellationToken);
            Assert.Equal(envelope.Id, fetched.Id);
            Assert.Equal(ConformanceJson.NormalizeText(rawBody), ConformanceJson.NormalizeValue(fetched));

            // chain-list-envelopes: filtering by the chain's own template pins the assertion
            // to the record this run created, so the step stays deterministic no matter how
            // many records the demo account accumulates.
            var page = await context.Sdk.Envelopes.ListAsync(
                new ListEnvelopesOptions { TemplateId = template.Id, Rows = 10, Page = 0 },
                cancellationToken);
            Assert.Contains(envelope.Id, page.Envelopes.Select(entry => entry.Id));
        }
        catch
        {
            // A failed step must not leave an actionable envelope on beta, so cancel best
            // effort and let the original failure surface.
            try
            {
                await context.Sdk.Envelopes.CancelAsync(envelope.Id, cancellationToken);
            }
            catch (VerdocsException)
            {
                // Beta tolerates the leftover; the original failure matters more.
            }

            throw;
        }

        // chain-cancel-envelope, then read back to prove the status stuck.
        var canceled = await context.Sdk.Envelopes.CancelAsync(envelope.Id, cancellationToken);
        Assert.Equal(envelope.Id, canceled.Id);
        Assert.Equal(EnvelopeStatus.Canceled, canceled.Status);
        var after = await context.Sdk.Envelopes.GetAsync(envelope.Id, cancellationToken);
        Assert.Equal(EnvelopeStatus.Canceled, after.Status);
    }

    // Builds one blank US Letter page by hand so the lane needs no PDF library. The xref
    // offsets are computed as the objects are appended, which is the only fussy part of a
    // hand-rolled PDF; everything else is boilerplate the server's pipeline (page count, page
    // sizes, tag scan) accepts. All content is ASCII, so byte offsets equal character counts.
    private static byte[] MinimalPdf()
    {
        const string contents = "q Q";
        string[] objects =
        [
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> /Contents 4 0 R >>",
            FormattableString.Invariant($"<< /Length {contents.Length} >>\nstream\n{contents}\nendstream"),
        ];

        using var output = new MemoryStream();
        void Append(string text) => output.Write(Encoding.ASCII.GetBytes(text));

        Append("%PDF-1.4\n");
        var offsets = new List<long>();
        for (var number = 1; number <= objects.Length; number++)
        {
            offsets.Add(output.Length);
            Append(FormattableString.Invariant($"{number} 0 obj\n{objects[number - 1]}\nendobj\n"));
        }

        var xrefAt = output.Length;
        Append(FormattableString.Invariant($"xref\n0 {objects.Length + 1}\n"));
        Append("0000000000 65535 f \n");
        foreach (var offset in offsets)
        {
            Append(FormattableString.Invariant($"{offset:0000000000} 00000 n \n"));
        }

        Append(FormattableString.Invariant($"trailer\n<< /Size {objects.Length + 1} /Root 1 0 R >>\nstartxref\n{xrefAt}\n%%EOF\n"));
        return output.ToArray();
    }
}
