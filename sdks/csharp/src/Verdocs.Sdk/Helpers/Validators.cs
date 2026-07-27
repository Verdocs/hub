using System.Text.RegularExpressions;
using Verdocs.Models;

namespace Verdocs.Helpers;

/// <summary>
/// Field-input validators and field fill/validity checks, ported from the js-sdk's
/// Templates/Validators.ts and Envelopes/Fields.ts. Validators always check strings, because
/// that is all a user can enter in an input field, and they never throw; they just return
/// whether the value is valid.
/// </summary>
public static class Validators
{
    // The patterns are ported verbatim from the js-sdk. RegexOptions.ECMAScript keeps \d, \w,
    // \s, and \b at their ASCII JavaScript semantics so the SDKs agree on what validates.
    private static readonly Regex EmailRegex = new(
        @"^(([^<>()\[\]\\.,;:\s@""]+(\.[^<>()\[\]\\.,;:\s@""]+)*)|("".+""))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$",
        RegexOptions.ECMAScript);

    // @see https://www.regextester.com/1978. Unanchored like the js-sdk original, so a phone
    // number embedded anywhere in the value matches.
    private static readonly Regex PhoneRegex = new(
        @"((?:\+|00)[17](?: |\-)?|(?:\+|00)[1-9]\d{0,2}(?: |\-)?|(?:\+|00)1\-\d{3}(?: |\-)?)?(0\d|\([0-9]{3}\)|[1-9]{0,3})(?:((?: |\-)[0-9]{2}){4}|((?:[0-9]{2}){4})|((?: |\-)[0-9]{3}(?: |\-)[0-9]{4})|([0-9]{7}))",
        RegexOptions.ECMAScript);

    private static readonly Regex UrlRegex = new(
        @"https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)",
        RegexOptions.ECMAScript);

    private static readonly Regex PostalCodeRegex = new(
        @"^[A-Za-z0-9-\s]{3,10}$",
        RegexOptions.ECMAScript);

    private static readonly Regex NumberRegex = new(
        @"^\d+$",
        RegexOptions.ECMAScript);

    // The alternation binds loosely, like the js-sdk original: the first alternative is only
    // anchored at the start and the second only at the end, so trailing garbage after a
    // yyyy-mm-dd date (or leading garbage before a mm-dd-yyyy one) still matches.
    private static readonly Regex DateRegex = new(
        @"^(\d{4}[-\/]\d{2}[-\/]\d{2})|(\d{2}[-\/]\d{2}[-\/]\d{4})$",
        RegexOptions.ECMAScript);

    // {0,32} means the empty string is a valid tag, like the js-sdk original.
    private static readonly Regex TagRegex = new(
        @"^[a-zA-Z0-9-]{0,32}$",
        RegexOptions.ECMAScript);

    // Insertion-ordered to match the js-sdk's Object.keys(VALIDATORS) enumeration.
    private static readonly string[] ValidatorNames = ["email", "phone", "url", "postal_code", "number", "date"];

    private static readonly Dictionary<string, Regex> ValidatorsByName = new()
    {
        ["email"] = EmailRegex,
        ["phone"] = PhoneRegex,
        ["url"] = UrlRegex,
        ["postal_code"] = PostalCodeRegex,
        ["number"] = NumberRegex,
        ["date"] = DateRegex,
    };

    /// <summary>
    /// True when the value passes the named validator. Ports the js-sdk's isValidInput
    /// (Templates/Validators.ts). Unknown validator names always fail.
    /// </summary>
    /// <param name="value">The value to check.</param>
    /// <param name="validator">The validator name; see <see cref="GetValidators"/> for the known names.</param>
    /// <returns>True when the value is valid for the named validator.</returns>
    /// <sdkOperation>validator.isValidInput</sdkOperation>
    /// <sdkGroup>Validators</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool IsValidInput(string value, string validator) =>
        ValidatorsByName.TryGetValue(validator, out var regex) && regex.IsMatch(value);

    /// <summary>
    /// The available validator names for field inputs. Ports the js-sdk's getValidators
    /// (Templates/Validators.ts).
    /// </summary>
    /// <returns>The validator names, in the js-sdk's order.</returns>
    /// <sdkOperation>validator.getValidators</sdkOperation>
    /// <sdkGroup>Validators</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static IReadOnlyList<string> GetValidators() => ValidatorNames;

    /// <summary>
    /// True when the value is a well-formed email address. Ports the js-sdk's isValidEmail
    /// (Templates/Validators.ts). Null and empty values fail.
    /// </summary>
    /// <param name="email">The value to check, or null.</param>
    /// <returns>True when the value is a valid email address.</returns>
    /// <sdkOperation>validator.isValidEmail</sdkOperation>
    /// <sdkGroup>Validators</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool IsValidEmail(string? email) =>
        !string.IsNullOrEmpty(email) && EmailRegex.IsMatch(email);

    /// <summary>
    /// True when the value contains a plausible phone number. Ports the js-sdk's isValidPhone
    /// (Templates/Validators.ts). Null and empty values fail.
    /// </summary>
    /// <param name="phone">The value to check, or null.</param>
    /// <returns>True when the value contains a valid phone number.</returns>
    /// <sdkOperation>validator.isValidPhone</sdkOperation>
    /// <sdkGroup>Validators</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool IsValidPhone(string? phone) =>
        !string.IsNullOrEmpty(phone) && PhoneRegex.IsMatch(phone);

    /// <summary>
    /// True when the value names one of the given template roles. Ports the js-sdk's
    /// isValidRoleName (Templates/Validators.ts).
    /// </summary>
    /// <param name="value">The role name to look for.</param>
    /// <param name="roles">The template's roles.</param>
    /// <returns>True when a role with that exact name exists.</returns>
    /// <sdkOperation>validator.isValidRoleName</sdkOperation>
    /// <sdkGroup>Validators</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool IsValidRoleName(string value, IEnumerable<Role> roles) =>
        roles.Any(role => role.Name == value);

    /// <summary>
    /// True when the value is an acceptable tag: up to 32 letters, digits, or hyphens, or an
    /// exact match for an existing tag. Ports the js-sdk's isValidTag
    /// (Templates/Validators.ts), including its quirk that the empty string passes.
    /// </summary>
    /// <param name="value">The tag to check.</param>
    /// <param name="tags">The existing tags.</param>
    /// <returns>True when the tag is acceptable.</returns>
    /// <sdkOperation>validator.isValidTag</sdkOperation>
    /// <sdkGroup>Validators</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool IsValidTag(string value, IEnumerable<string> tags) =>
        TagRegex.IsMatch(value) || tags.Contains(value);

    /// <summary>
    /// True when the field has been filled in, per its type's rules: text fields must have a
    /// non-blank (and, with a validator set, valid) value, signature/initial/attachment
    /// fields must have been acted on, timestamps always count as filled, and grouped radio
    /// buttons count when any field in the group is selected. Ports the js-sdk's
    /// isFieldFilled (Envelopes/Fields.ts). Unknown field types are never filled.
    /// </summary>
    /// <param name="field">The field to check.</param>
    /// <param name="allRecipientFields">Every field assigned to the same recipient, used to resolve grouped fields.</param>
    /// <returns>True when the field counts as filled.</returns>
    /// <sdkOperation>envelope.isFieldFilled</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool IsFieldFilled(EnvelopeField field, IReadOnlyList<EnvelopeField> allRecipientFields)
    {
        // The js-sdk's destructuring default only fires for undefined, so a JSON-null value
        // takes a different path there in a couple of branches. C# cannot tell null from
        // missing, so both normalize to empty here.
        var value = field.Value ?? string.Empty;
        switch (field.Type)
        {
            case FieldType.Textarea:
            case FieldType.Textbox:
                return (field.Validator ?? string.Empty) switch
                {
                    "email" => value.Length > 0 && IsValidInput(value, "email"),
                    "phone" => value.Length > 0 && IsValidInput(value, "phone"),
                    _ => value.Trim().Length > 0,
                };

            case FieldType.Signature:
                return value == "signed";

            case FieldType.Initial:
                return value == "initialed";

            // Timestamp fields get automatically filled when the envelope is submitted.
            case FieldType.Timestamp:
                return true;

            case FieldType.Date:
                return value.Length > 0;

            case FieldType.Attachment:
                return value == "attached";

            case FieldType.Dropdown:
                return value.Length > 0;

            case FieldType.Checkbox:
                return value == "true";

            case FieldType.Radio:
                if (!string.IsNullOrEmpty(field.Group))
                {
                    return allRecipientFields
                        .Where(f => f.Group == field.Group)
                        .Any(f => f.Value == "true");
                }

                return field.Value == "true";

            default:
                return false;
        }
    }

    // TODO carried from the js-sdk: only let !required bypass validation when the field is
    // empty; today an optional field with an invalid value still passes.
    /// <summary>
    /// True when the field is valid to submit: optional fields always pass, required fields
    /// must be filled. Ports the js-sdk's isFieldValid (Envelopes/Fields.ts).
    /// </summary>
    /// <param name="field">The field to check.</param>
    /// <param name="allRecipientFields">Every field assigned to the same recipient, used to resolve grouped fields.</param>
    /// <returns>True when the field is valid.</returns>
    /// <sdkOperation>envelope.isFieldValid</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool IsFieldValid(EnvelopeField field, IReadOnlyList<EnvelopeField> allRecipientFields) =>
        field.Required != true || IsFieldFilled(field, allRecipientFields);
}
