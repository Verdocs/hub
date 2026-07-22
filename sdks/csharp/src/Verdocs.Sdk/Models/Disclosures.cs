namespace Verdocs.Models;

/// <summary>Standard electronic-signing disclosure text.</summary>
public static class Disclosures
{
    /// <summary>
    /// The disclosures shown to recipients when the organization has not supplied an override.
    /// Overrides are applied at the organization level before creating an envelope. The value
    /// is an HTML fragment and is identical to the js-sdk's DEFAULT_DISCLOSURES export,
    /// leading newline included.
    /// </summary>
    public const string Default = @"
<ul>
  <li>
    Agree to use electronic records and signatures, and confirm you have read the
    <a href=""https://verdocs.com/en/electronic-record-signature-disclosure/"" target=""_blank"">
      Electronic Record and Signatures Disclosure</a>.</li>
  <li>
    Agree to Verdocs'
    <a href=""https://verdocs.com/en/eula"" target=""_blank"">
      End User License Agreement</a>
    and confirm you have read Verdocs'
    <a href=""https://verdocs.com/en/privacy-policy/"" target=""_blank"">
      Privacy Policy</a>.
  </li>
</ul>";
}
