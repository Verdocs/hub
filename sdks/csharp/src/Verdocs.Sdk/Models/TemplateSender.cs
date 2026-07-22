namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="Template.Sender"/>: who owns envelopes created from a template.
/// Properties stay typed as string so an unknown future value never breaks deserialization.
/// </summary>
public static class TemplateSender
{
    /// <summary>Envelopes belong to whoever creates them from the template.</summary>
    public const string EnvelopeCreator = "envelope_creator";

    /// <summary>Envelopes belong to the template's owner regardless of who creates them.</summary>
    public const string TemplateOwner = "template_owner";
}
