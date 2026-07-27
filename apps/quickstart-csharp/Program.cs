using Verdocs;
using Verdocs.Models;

// The role name ties the recipient and the signature field together. It is an arbitrary label, but
// the two have to agree or the field will not belong to anyone.
const string roleName = "Recipient";

string[] required = ["VERDOCS_CLIENT_ID", "VERDOCS_CLIENT_SECRET", "PDF_PATH"];

var here = AppContext.BaseDirectory;
var projectDir = Path.GetFullPath(Path.Combine(here, "..", "..", ".."));
var envFile = Path.Combine(projectDir, ".env");

if (!File.Exists(envFile))
{
    Usage("No .env file found.");
}

LoadEnv(envFile);

var missing = required.Where(name => string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(name))).ToList();
if (missing.Count > 0)
{
    Usage($"Missing required settings: {string.Join(", ", missing)}.");
}

var pdfPath = Environment.GetEnvironmentVariable("PDF_PATH")!;
if (!Path.IsPathRooted(pdfPath))
{
    pdfPath = Path.GetFullPath(Path.Combine(projectDir, pdfPath));
}

if (!File.Exists(pdfPath))
{
    Usage($"Could not read the PDF at {pdfPath}.");
}

var pdfBase64 = Convert.ToBase64String(await File.ReadAllBytesAsync(pdfPath));

var baseUrl = Environment.GetEnvironmentVariable("VERDOCS_BASE_URL");
using var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions
{
    BaseUrl = string.IsNullOrWhiteSpace(baseUrl) ? "https://api.verdocs.com" : baseUrl,
});

// client_credentials authenticates the integration itself, so there is no user to log in and no
// refresh dance to manage. Access tokens are short lived, so ask for one per run rather than
// stashing it somewhere.
var auth = await endpoint.Auth.AuthenticateAsync(new ClientCredentialsRequest
{
    ClientId = Environment.GetEnvironmentVariable("VERDOCS_CLIENT_ID")!,
    ClientSecret = Environment.GetEnvironmentVariable("VERDOCS_CLIENT_SECRET")!,
});
endpoint.SetToken(auth.AccessToken);

// The token tells you which organization you are acting as. It carries the ID but not the name, so
// the name costs one lookup. If you are creating an envelope anyway, skip this: the create response
// below carries envelope.Organization.
var organizationId = endpoint.Session!.OrganizationId!;
var organization = await endpoint.Organizations.GetAsync(organizationId);
Console.WriteLine($"Organization: {organization.Name} ({organizationId})");

var envelope = await endpoint.Envelopes.CreateAsync(new CreateEnvelopeRequest
{
    Name = "Quickstart Envelope",
    Recipients =
    [
        new CreateEnvelopeRecipient
        {
            Type = "signer",
            RoleName = roleName,
            FirstName = Environment.GetEnvironmentVariable("SIGNER_FIRST_NAME") ?? "Test",
            LastName = Environment.GetEnvironmentVariable("SIGNER_LAST_NAME") ?? "User",
            Email = Environment.GetEnvironmentVariable("SIGNER_EMAIL") ?? "test+user@maildrop.cc",
        },
    ],
    // No template involved, so the PDF rides along as base64 on the create call.
    Documents =
    [
        new CreateEnvelopeDocument
        {
            Name = "quickstart.pdf",
            Mime = "application/pdf",
            Data = pdfBase64,
        },
    ],
    // DocumentId is the index into Documents above, not a UUID, and page numbering starts at 1.
    // Position is in PDF points from the bottom-left of the page, so a larger Y sits higher up.
    // Anything missing Type, RoleName, Name, DocumentId, Page, X, or Y is dropped server-side, and
    // you find out via a confusing "Envelope has no fields" error rather than a validation message.
    Fields =
    [
        new CreateEnvelopeField
        {
            DocumentId = 0,
            Name = "recipient-signature",
            RoleName = roleName,
            Type = "signature",
            Page = 1,
            X = 100,
            Y = 600,
            Width = 200,
            Height = 40,
            Required = true,
        },
    ],
});

// Most applications will want to database envelope.Id here, alongside whatever record prompted the
// signature request, so webhooks and status checks later have something to join against.
Console.WriteLine($"Envelope: {envelope.Name} ({envelope.Id})");

// In-person signing hands the device to the signer instead of emailing them. The link is single-use
// and short lived, so generate it at the moment you are ready to hand over.
var inPerson = await endpoint.Recipients.GetInPersonLinkAsync(envelope.Id, roleName);
Console.WriteLine($"In-person signing link: {inPerson.Link}");

// Cancel is terminal. Doing it here keeps the quickstart from leaving live signature requests
// behind; a real integration would only cancel when the underlying deal falls through.
var canceled = await endpoint.Envelopes.CancelAsync(envelope.Id);
Console.WriteLine($"Canceled: {canceled.Status}");

return;

// Reads KEY=VALUE lines without clobbering anything already in the environment.
static void LoadEnv(string path)
{
    foreach (var line in File.ReadAllLines(path))
    {
        var trimmed = line.Trim();
        if (trimmed.Length == 0 || trimmed.StartsWith('#') || !trimmed.Contains('='))
        {
            continue;
        }

        var split = trimmed.IndexOf('=');
        var key = trimmed[..split].Trim();
        var value = trimmed[(split + 1)..].Trim().Trim('"', '\'');
        if (Environment.GetEnvironmentVariable(key) is null)
        {
            Environment.SetEnvironmentVariable(key, value);
        }
    }
}

static void Usage(string problem)
{
    Console.Error.WriteLine($"""
        {problem}

        Copy .env.example to .env and fill in:

          VERDOCS_CLIENT_ID      client ID of a Verdocs API key
          VERDOCS_CLIENT_SECRET  the matching client secret
          PDF_PATH               path to the PDF you want signed

        Create an API key at https://app.verdocs.com under Settings > API Keys.
        """);
    Environment.Exit(1);
}
