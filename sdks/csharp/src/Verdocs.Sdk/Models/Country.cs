namespace Verdocs.Models;

/// <summary>
/// One entry in the country calling-code table (the js-sdk's ICountry), used by
/// <see cref="Utils.Locales"/>. Not a wire model; the table is fixed data shared with the
/// other SDKs.
/// </summary>
/// <param name="Code">Display code shown in pickers; unique per row apart from the shared "+1".</param>
/// <param name="Name">The country or territory name.</param>
/// <param name="Value">The dial prefix actually prepended to numbers.</param>
public sealed record Country(string Code, string Name, string Value);
