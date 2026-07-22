using Verdocs.Helpers;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>
/// Covers the Validators helper (Templates/Validators.ts plus Envelopes/Fields.ts in the
/// js-sdk), including the regex quirks the port keeps on purpose: the unanchored phone
/// pattern, the loosely anchored date pattern, and the empty string counting as a valid tag.
/// </summary>
public sealed class ValidatorsTests
{
    private static EnvelopeField MakeField(
        string type,
        string? value = null,
        string? validator = null,
        string? group = null,
        bool? required = null,
        string name = "field-1") => new()
    {
        EnvelopeId = "env-1",
        DocumentId = "doc-1",
        Name = name,
        RoleName = "Signer1",
        Type = type,
        Value = value,
        Validator = validator,
        Group = group,
        Required = required,
        Page = 1,
    };

    private static Role MakeRole(string name) => new()
    {
        TemplateId = "tpl-1",
        Name = name,
        Type = "signer",
        Sequence = 1,
        Order = 1,
    };

    // ------------------------------------------------------------------
    // isValidInput / getValidators
    // ------------------------------------------------------------------

    [Theory]
    [InlineData("test@example.com", true)]
    [InlineData("a.b@sub.example.co", true)]
    [InlineData("not-an-email", false)]
    [InlineData("", false)]
    public void IsValidInput_Email_MatchesJsSdk(string value, bool expected)
    {
        Assert.Equal(expected, Validators.IsValidInput(value, "email"));
    }

    [Theory]
    [InlineData("5551234567", true)]
    [InlineData("+15551234567", true)]
    [InlineData("(555) 123-4567", true)]
    [InlineData("abc", false)]
    [InlineData("", false)]
    public void IsValidInput_Phone_MatchesJsSdk(string value, bool expected)
    {
        Assert.Equal(expected, Validators.IsValidInput(value, "phone"));
    }

    [Fact]
    public void IsValidInput_PhoneEmbeddedInText_Matches_JsSdkQuirk()
    {
        // The js-sdk pattern is unanchored, so any value containing a phone number passes.
        Assert.True(Validators.IsValidInput("call 5551234567 now", "phone"));
    }

    [Theory]
    [InlineData("https://verdocs.com", true)]
    [InlineData("http://example.com/path?q=1", true)]
    [InlineData("example.com", false)]
    [InlineData("ftp://example.com", false)]
    public void IsValidInput_Url_MatchesJsSdk(string value, bool expected)
    {
        Assert.Equal(expected, Validators.IsValidInput(value, "url"));
    }

    [Theory]
    [InlineData("12345", true)]
    [InlineData("SW1A 1AA", true)]
    [InlineData("ab", false)]
    [InlineData("12345678901", false)]
    public void IsValidInput_PostalCode_MatchesJsSdk(string value, bool expected)
    {
        Assert.Equal(expected, Validators.IsValidInput(value, "postal_code"));
    }

    [Theory]
    [InlineData("12345", true)]
    [InlineData("12a", false)]
    [InlineData("", false)]
    public void IsValidInput_Number_MatchesJsSdk(string value, bool expected)
    {
        Assert.Equal(expected, Validators.IsValidInput(value, "number"));
    }

    [Theory]
    [InlineData("2024-01-15", true)]
    [InlineData("01/15/2024", true)]
    [InlineData("2024/01/15", true)]
    [InlineData("2024-1-5", false)]
    public void IsValidInput_Date_MatchesJsSdk(string value, bool expected)
    {
        Assert.Equal(expected, Validators.IsValidInput(value, "date"));
    }

    [Fact]
    public void IsValidInput_DateWithSurroundingGarbage_Matches_JsSdkQuirk()
    {
        // The js-sdk alternation binds loosely: the first alternative is anchored only at the
        // start and the second only at the end.
        Assert.True(Validators.IsValidInput("2024-01-15garbage", "date"));
        Assert.True(Validators.IsValidInput("garbage01/15/2024", "date"));
    }

    [Fact]
    public void IsValidInput_UnknownValidator_ReturnsFalse()
    {
        Assert.False(Validators.IsValidInput("12345", "ssn"));
    }

    [Fact]
    public void GetValidators_ReturnsJsSdkNamesInOrder()
    {
        Assert.Equal(["email", "phone", "url", "postal_code", "number", "date"], Validators.GetValidators());
    }

    // ------------------------------------------------------------------
    // isValidEmail / isValidPhone / isValidRoleName / isValidTag
    // ------------------------------------------------------------------

    [Fact]
    public void IsValidEmail_ValidAddress_ReturnsTrue()
    {
        Assert.True(Validators.IsValidEmail("paige.turner@example.com"));
    }

    [Theory]
    [InlineData("nope")]
    [InlineData("")]
    [InlineData(null)]
    public void IsValidEmail_InvalidNullOrEmpty_ReturnsFalse(string? email)
    {
        Assert.False(Validators.IsValidEmail(email));
    }

    [Fact]
    public void IsValidPhone_ValidNumber_ReturnsTrue()
    {
        Assert.True(Validators.IsValidPhone("(555) 123-4567"));
    }

    [Theory]
    [InlineData("abc")]
    [InlineData("")]
    [InlineData(null)]
    public void IsValidPhone_InvalidNullOrEmpty_ReturnsFalse(string? phone)
    {
        Assert.False(Validators.IsValidPhone(phone));
    }

    [Fact]
    public void IsValidRoleName_ExistingRole_ReturnsTrue()
    {
        Assert.True(Validators.IsValidRoleName("Signer1", [MakeRole("Signer1"), MakeRole("Signer2")]));
    }

    [Fact]
    public void IsValidRoleName_UnknownRoleOrEmptyList_ReturnsFalse()
    {
        Assert.False(Validators.IsValidRoleName("Signer3", [MakeRole("Signer1")]));
        Assert.False(Validators.IsValidRoleName("Signer1", []));
    }

    [Theory]
    [InlineData("my-tag")]
    [InlineData("UPPER-9")]
    public void IsValidTag_WellFormedTag_ReturnsTrue(string value)
    {
        Assert.True(Validators.IsValidTag(value, []));
    }

    [Fact]
    public void IsValidTag_ExistingTagWithInvalidCharacters_ReturnsTrue()
    {
        Assert.True(Validators.IsValidTag("spaced tag", ["spaced tag"]));
    }

    [Fact]
    public void IsValidTag_MalformedUnknownTag_ReturnsFalse()
    {
        Assert.False(Validators.IsValidTag("spaced tag", ["other"]));
        Assert.False(Validators.IsValidTag(new string('a', 33), []));
    }

    [Fact]
    public void IsValidTag_EmptyString_ReturnsTrue_JsSdkQuirk()
    {
        // {0,32} in the js-sdk pattern means the empty string counts as a well-formed tag.
        Assert.True(Validators.IsValidTag("", []));
    }

    // ------------------------------------------------------------------
    // isFieldFilled
    // ------------------------------------------------------------------

    [Theory]
    [InlineData("hello", true)]
    [InlineData("   ", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void IsFieldFilled_TextboxWithoutValidator_RequiresNonBlankText(string? value, bool expected)
    {
        var field = MakeField(FieldType.Textbox, value);
        Assert.Equal(expected, Validators.IsFieldFilled(field, [field]));
    }

    [Theory]
    [InlineData("test@example.com", true)]
    [InlineData("not-an-email", false)]
    [InlineData("", false)]
    public void IsFieldFilled_TextboxWithEmailValidator_ChecksFormat(string value, bool expected)
    {
        var field = MakeField(FieldType.Textbox, value, validator: "email");
        Assert.Equal(expected, Validators.IsFieldFilled(field, [field]));
    }

    [Theory]
    [InlineData("5551234567", true)]
    [InlineData("abc", false)]
    public void IsFieldFilled_TextboxWithPhoneValidator_ChecksFormat(string value, bool expected)
    {
        var field = MakeField(FieldType.Textbox, value, validator: "phone");
        Assert.Equal(expected, Validators.IsFieldFilled(field, [field]));
    }

    [Fact]
    public void IsFieldFilled_TextareaBehavesLikeTextbox()
    {
        var filled = MakeField(FieldType.Textarea, "hello");
        var blank = MakeField(FieldType.Textarea, "   ");

        Assert.True(Validators.IsFieldFilled(filled, [filled]));
        Assert.False(Validators.IsFieldFilled(blank, [blank]));
    }

    [Theory]
    [InlineData("signed", true)]
    [InlineData("yes", false)]
    [InlineData(null, false)]
    public void IsFieldFilled_Signature_OnlySignedCounts(string? value, bool expected)
    {
        var field = MakeField(FieldType.Signature, value);
        Assert.Equal(expected, Validators.IsFieldFilled(field, [field]));
    }

    [Theory]
    [InlineData("initialed", true)]
    [InlineData("signed", false)]
    [InlineData(null, false)]
    public void IsFieldFilled_Initial_OnlyInitialedCounts(string? value, bool expected)
    {
        var field = MakeField(FieldType.Initial, value);
        Assert.Equal(expected, Validators.IsFieldFilled(field, [field]));
    }

    [Fact]
    public void IsFieldFilled_Timestamp_AlwaysFilled()
    {
        // Timestamp fields get automatically filled when the envelope is submitted.
        var field = MakeField(FieldType.Timestamp);
        Assert.True(Validators.IsFieldFilled(field, [field]));
    }

    [Theory]
    [InlineData("2024-01-15", true)]
    [InlineData("whatever", true)]
    [InlineData(null, false)]
    public void IsFieldFilled_Date_AnyNonEmptyValueCounts(string? value, bool expected)
    {
        var field = MakeField(FieldType.Date, value);
        Assert.Equal(expected, Validators.IsFieldFilled(field, [field]));
    }

    [Theory]
    [InlineData("attached", true)]
    [InlineData("pending", false)]
    [InlineData(null, false)]
    public void IsFieldFilled_Attachment_OnlyAttachedCounts(string? value, bool expected)
    {
        var field = MakeField(FieldType.Attachment, value);
        Assert.Equal(expected, Validators.IsFieldFilled(field, [field]));
    }

    [Theory]
    [InlineData("Option A", true)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void IsFieldFilled_Dropdown_NonEmptySelectionCounts(string? value, bool expected)
    {
        var field = MakeField(FieldType.Dropdown, value);
        Assert.Equal(expected, Validators.IsFieldFilled(field, [field]));
    }

    [Theory]
    [InlineData("true", true)]
    [InlineData("false", false)]
    [InlineData(null, false)]
    public void IsFieldFilled_Checkbox_OnlyTrueCounts(string? value, bool expected)
    {
        var field = MakeField(FieldType.Checkbox, value);
        Assert.Equal(expected, Validators.IsFieldFilled(field, [field]));
    }

    [Fact]
    public void IsFieldFilled_RadioWithoutGroup_OwnValueCounts()
    {
        var selected = MakeField(FieldType.Radio, "true");
        var unselected = MakeField(FieldType.Radio, "false");

        Assert.True(Validators.IsFieldFilled(selected, [selected]));
        Assert.False(Validators.IsFieldFilled(unselected, [unselected]));
    }

    [Fact]
    public void IsFieldFilled_RadioWithGroup_AnySelectionInGroupCounts()
    {
        var mine = MakeField(FieldType.Radio, "false", group: "color", name: "radio-1");
        var sibling = MakeField(FieldType.Radio, "true", group: "color", name: "radio-2");
        var otherGroup = MakeField(FieldType.Radio, "true", group: "size", name: "radio-3");

        // A sibling selection fills every field in the group.
        Assert.True(Validators.IsFieldFilled(mine, [mine, sibling, otherGroup]));

        // A selection in a different group does not.
        Assert.False(Validators.IsFieldFilled(mine, [mine, otherGroup]));
    }

    [Fact]
    public void IsFieldFilled_UnknownType_ReturnsFalse()
    {
        var field = MakeField(FieldType.Payment, "paid");
        Assert.False(Validators.IsFieldFilled(field, [field]));
    }

    // ------------------------------------------------------------------
    // isFieldValid
    // ------------------------------------------------------------------

    [Fact]
    public void IsFieldValid_RequiredUnfilled_ReturnsFalse()
    {
        var field = MakeField(FieldType.Textbox, "", required: true);
        Assert.False(Validators.IsFieldValid(field, [field]));
    }

    [Fact]
    public void IsFieldValid_RequiredFilled_ReturnsTrue()
    {
        var field = MakeField(FieldType.Textbox, "hello", required: true);
        Assert.True(Validators.IsFieldValid(field, [field]));
    }

    [Fact]
    public void IsFieldValid_OptionalUnfilled_ReturnsTrue()
    {
        var optional = MakeField(FieldType.Textbox, "", required: false);
        var unspecified = MakeField(FieldType.Textbox, "");

        Assert.True(Validators.IsFieldValid(optional, [optional]));
        Assert.True(Validators.IsFieldValid(unspecified, [unspecified]));
    }
}
