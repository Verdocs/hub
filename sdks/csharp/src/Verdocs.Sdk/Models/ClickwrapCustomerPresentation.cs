using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>What was on screen, sent with a headless outcome. Up to 2 MB.</summary>
public sealed record ClickwrapCustomerPresentation
{
    /// <summary>html for a self-contained HTML document, png or jpeg for a screenshot.</summary>
    public required string Type { get; init; }

    /// <summary>The HTML itself, or the image as base64.</summary>
    public required string Content { get; init; }
}
