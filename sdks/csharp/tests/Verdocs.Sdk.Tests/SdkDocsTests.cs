using System.Text.Json;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Guards the committed sdk-docs.json Auth operation set.</summary>
public sealed class SdkDocsTests
{
    private static readonly HashSet<string> ExpectedAuthOperations =
    [
        "auth.authenticate",
        "auth.changePassword",
        "auth.getMyUser",
        "auth.getOAuth2AuthorizeUrl",
        "auth.refreshToken",
        "auth.resendVerification",
        "auth.resetPassword",
        "auth.verifyEmail",
    ];

    private static readonly HashSet<string> ExpectedTemplateOperations =
    [
        "template.createTemplate",
    ];

    [Fact]
    public void SdkDocsJson_ContainsAuthOperations()
    {
        var path = FindSdkDocsPath();
        Assert.True(File.Exists(path), $"Missing {path}. Run docs/generate-sdk-docs.sh to regenerate it.");

        using var document = JsonDocument.Parse(File.ReadAllText(path));
        var root = document.RootElement;

        Assert.Equal("csharp", root.GetProperty("language").GetString());
        Assert.Equal("Verdocs.Sdk", root.GetProperty("package").GetString());

        var authSymbols = root.GetProperty("groups").GetProperty("auth").GetProperty("symbols");
        var actualAuth = authSymbols.EnumerateObject().Select(property => property.Name).ToHashSet(StringComparer.Ordinal);
        Assert.Equal(ExpectedAuthOperations, actualAuth);

        var authenticate = authSymbols.GetProperty("auth.authenticate");
        Assert.Equal("function", authenticate.GetProperty("kind").GetString());
        Assert.Equal("Endpoints", authenticate.GetProperty("page").GetString());
        Assert.Equal("csharp", authenticate.GetProperty("examples")[0].GetProperty("language").GetString());
        Assert.Contains("PasswordGrantRequest", authenticate.GetProperty("examples")[0].GetProperty("code").GetString(), StringComparison.Ordinal);

        var templateSymbols = root.GetProperty("groups").GetProperty("template").GetProperty("symbols");
        var actualTemplate = templateSymbols.EnumerateObject().Select(property => property.Name).ToHashSet(StringComparer.Ordinal);
        Assert.Equal(ExpectedTemplateOperations, actualTemplate);

        var createTemplate = templateSymbols.GetProperty("template.createTemplate");
        Assert.True(createTemplate.GetProperty("gettingStarted").GetBoolean());
        Assert.Equal("Endpoints", createTemplate.GetProperty("page").GetString());
        Assert.Equal("csharp", createTemplate.GetProperty("examples")[0].GetProperty("language").GetString());
        Assert.Contains("TemplateCreateParams", createTemplate.GetProperty("examples")[0].GetProperty("code").GetString(), StringComparison.Ordinal);
    }

    private static string FindSdkDocsPath()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            var candidate = Path.Combine(dir.FullName, "sdk-docs.json");
            if (File.Exists(candidate) || File.Exists(Path.Combine(dir.FullName, "Verdocs.Sdk.sln")))
            {
                return Path.Combine(dir.FullName, "sdk-docs.json");
            }

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate sdks/csharp.");
    }
}
