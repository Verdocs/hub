using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The fields for <see cref="Resources.Clickwrap.AcceptAsync"/> and <see cref="Resources.Clickwrap.DeclineAsync"/>.</summary>
public sealed record ClickwrapSessionOutcomeRequest
{
    /// <summary>component for the embedded component, hosted for the Verdocs hosted page; see <see cref="ClickwrapSurface"/>.</summary>
    public required string Surface { get; init; }

    /// <summary>Each checkbox label and the button label, as rendered.</summary>
    public required ClickwrapLabels Labels { get; init; }

    /// <summary>The rendered terms as one self-contained HTML document, up to 2 MB. Its text must contain each version's text.</summary>
    public required string Presentation { get; init; }

    /// <summary>How far the person scrolled, from 0 to 1.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? ScrollDepth { get; init; }

    /// <summary>The browser window the terms were shown in.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ClickwrapViewport? Viewport { get; init; }

    /// <summary>The person's locale, such as en-US.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Locale { get; init; }

    /// <summary>The person's IANA timezone, such as America/Denver.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Timezone { get; init; }
}
