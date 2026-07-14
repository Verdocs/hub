using Verdocs.Models;

namespace Verdocs.Utils;

/// <summary>
/// Country calling-code data and lookups (js-sdk: Utils/Locales.ts). The table and its quirks
/// port verbatim from the js-sdk: Martinique appears twice, Saint Pierre and Miquelon has no
/// "+" prefix, Kazakhstan's display code is "+77" with dial value "+7", and the accented
/// Reunion entry keeps the same escape the js-sdk source carries. Fixing any of it here would
/// desync the SDKs, so we do not.
/// </summary>
public static class Locales
{
    /// <summary>The country calling-code table, in the js-sdk's order.</summary>
    public static IReadOnlyList<Country> Countries { get; } =
    [
        new("+7 840", "Abkhazia", "+7"),
        new("+93", "Afghanistan", "+93"),
        new("+355", "Albania", "+355"),
        new("+213", "Algeria", "+213"),
        new("+1", "American Samoa", "+1"),
        new("+376", "Andorra", "+376"),
        new("+244", "Angola", "+244"),
        new("+1", "Anguilla", "+1"),
        new("+1", "Antigua and Barbuda", "+1"),
        new("+54", "Argentina", "+54"),
        new("+374", "Armenia", "+374"),
        new("+297", "Aruba", "+297"),
        new("+247", "Ascension", "+247"),
        new("+61", "Australia", "+61"),
        new("+672", "Australian External Territories", "+672"),
        new("+43", "Austria", "+43"),
        new("+994", "Azerbaijan", "+994"),
        new("+1", "Bahamas", "+1"),
        new("+973", "Bahrain", "+973"),
        new("+880", "Bangladesh", "+880"),
        new("+1", "Barbados", "+1"),
        new("+1", "Barbuda", "+1"),
        new("+375", "Belarus", "+375"),
        new("+32", "Belgium", "+32"),
        new("+501", "Belize", "+501"),
        new("+229", "Benin", "+229"),
        new("+1", "Bermuda", "+1"),
        new("+975", "Bhutan", "+975"),
        new("+591", "Bolivia", "+591"),
        new("+387", "Bosnia and Herzegovina", "+387"),
        new("+267", "Botswana", "+267"),
        new("+55", "Brazil", "+55"),
        new("+246", "British Indian Ocean Territory", "+246"),
        new("+1", "British Virgin Islands", "+1"),
        new("+673", "Brunei", "+673"),
        new("+359", "Bulgaria", "+359"),
        new("+226", "Burkina Faso", "+226"),
        new("+257", "Burundi", "+257"),
        new("+855", "Cambodia", "+855"),
        new("+237", "Cameroon", "+237"),
        new("+1", "Canada", "+1"),
        new("+238", "Cape Verde", "+238"),
        new("+1", "Cayman Islands", "+1"),
        new("+236", "Central African Republic", "+236"),
        new("+235", "Chad", "+235"),
        new("+56", "Chile", "+56"),
        new("+86", "China", "+86"),
        new("+61", "Christmas Island", "+61"),
        new("+61", "Cocos-Keeling Islands", "+61"),
        new("+57", "Colombia", "+57"),
        new("+269", "Comoros", "+269"),
        new("+242", "Congo", "+242"),
        new("+243", "Congo, Dem. Rep. of (Zaire)", "+243"),
        new("+682", "Cook Islands", "+682"),
        new("+506", "Costa Rica", "+506"),
        new("+385", "Croatia", "+385"),
        new("+53", "Cuba", "+53"),
        new("+599", "Curacao", "+599"),
        new("+537", "Cyprus", "+537"),
        new("+420", "Czech Republic", "+420"),
        new("+45", "Denmark", "+45"),
        new("+246", "Diego Garcia", "+246"),
        new("+253", "Djibouti", "+253"),
        new("+1", "Dominica", "+1"),
        new("+1", "Dominican Republic", "+1"),
        new("+670", "East Timor", "+670"),
        new("+56", "Easter Island", "+56"),
        new("+593", "Ecuador", "+593"),
        new("+20", "Egypt", "+20"),
        new("+503", "El Salvador", "+503"),
        new("+240", "Equatorial Guinea", "+240"),
        new("+291", "Eritrea", "+291"),
        new("+372", "Estonia", "+372"),
        new("+251", "Ethiopia", "+251"),
        new("+500", "Falkland Islands", "+500"),
        new("+298", "Faroe Islands", "+298"),
        new("+679", "Fiji", "+679"),
        new("+358", "Finland", "+358"),
        new("+33", "France", "+33"),
        new("+596", "Martinique", "+596"),
        new("+594", "French Guiana", "+594"),
        new("+689", "French Polynesia", "+689"),
        new("+241", "Gabon", "+241"),
        new("+220", "Gambia", "+220"),
        new("+995", "Georgia", "+995"),
        new("+49", "Germany", "+49"),
        new("+233", "Ghana", "+233"),
        new("+350", "Gibraltar", "+350"),
        new("+30", "Greece", "+30"),
        new("+299", "Greenland", "+299"),
        new("+1", "Grenada", "+1"),
        new("+590", "Guadeloupe", "+590"),
        new("+1", "Guam", "+1"),
        new("+502", "Guatemala", "+502"),
        new("+224", "Guinea", "+224"),
        new("+245", "Guinea-Bissau", "+245"),
        new("+595", "Guyana", "+595"),
        new("+509", "Haiti", "+509"),
        new("+504", "Honduras", "+504"),
        new("+852", "Hong Kong SAR China", "+852"),
        new("+36", "Hungary", "+36"),
        new("+354", "Iceland", "+354"),
        new("+91", "India", "+91"),
        new("+62", "Indonesia", "+62"),
        new("+98", "Iran", "+98"),
        new("+964", "Iraq", "+964"),
        new("+353", "Ireland", "+353"),
        new("+972", "Israel", "+972"),
        new("+39", "Italy", "+39"),
        new("+225", "Ivory Coast", "+225"),
        new("+1", "Jamaica", "+1"),
        new("+81", "Japan", "+81"),
        new("+962", "Jordan", "+962"),
        new("+77", "Kazakhstan", "+7"),
        new("+254", "Kenya", "+254"),
        new("+686", "Kiribati", "+686"),
        new("+965", "Kuwait", "+965"),
        new("+996", "Kyrgyzstan", "+996"),
        new("+856", "Laos", "+856"),
        new("+371", "Latvia", "+371"),
        new("+961", "Lebanon", "+961"),
        new("+266", "Lesotho", "+266"),
        new("+231", "Liberia", "+231"),
        new("+218", "Libya", "+218"),
        new("+423", "Liechtenstein", "+423"),
        new("+370", "Lithuania", "+370"),
        new("+352", "Luxembourg", "+352"),
        new("+853", "Macau SAR China", "+853"),
        new("+389", "Macedonia", "+389"),
        new("+261", "Madagascar", "+261"),
        new("+265", "Malawi", "+265"),
        new("+60", "Malaysia", "+60"),
        new("+960", "Maldives", "+960"),
        new("+223", "Mali", "+223"),
        new("+356", "Malta", "+356"),
        new("+692", "Marshall Islands", "+692"),
        new("+596", "Martinique", "+596"),
        new("+222", "Mauritania", "+222"),
        new("+230", "Mauritius", "+230"),
        new("+262", "Mayotte or R\u00e9union", "+262"),
        new("+52", "Mexico", "+52"),
        new("+691", "Micronesia", "+691"),
        new("+1", "Midway Island", "+1"),
        new("+373", "Moldova", "+373"),
        new("+377", "Monaco", "+377"),
        new("+976", "Mongolia", "+976"),
        new("+382", "Montenegro", "+382"),
        new("+1", "Montserrat", "+1"),
        new("+212", "Morocco", "+212"),
        new("+95", "Myanmar", "+95"),
        new("+264", "Namibia", "+264"),
        new("+674", "Nauru", "+674"),
        new("+977", "Nepal", "+977"),
        new("+31", "Netherlands", "+31"),
        new("+599", "Netherlands Antilles", "+599"),
        new("+1", "Nevis", "+1"),
        new("+687", "New Caledonia", "+687"),
        new("+64", "New Zealand", "+64"),
        new("+505", "Nicaragua", "+505"),
        new("+227", "Niger", "+227"),
        new("+234", "Nigeria", "+234"),
        new("+683", "Niue", "+683"),
        new("+672", "Norfolk Island", "+672"),
        new("+850", "North Korea", "+850"),
        new("+1", "Northern Mariana Islands", "+1"),
        new("+47", "Norway", "+47"),
        new("+968", "Oman", "+968"),
        new("+92", "Pakistan", "+92"),
        new("+680", "Palau", "+680"),
        new("+970", "Palestinian Territory", "+970"),
        new("+507", "Panama", "+507"),
        new("+675", "Papua New Guinea", "+675"),
        new("+595", "Paraguay", "+595"),
        new("+51", "Peru", "+51"),
        new("+63", "Philippines", "+63"),
        new("+48", "Poland", "+48"),
        new("+351", "Portugal", "+351"),
        new("+1", "Puerto Rico", "+1"),
        new("+974", "Qatar", "+974"),
        new("+40", "Romania", "+40"),
        new("+7", "Russia", "+7"),
        new("+250", "Rwanda", "+250"),
        new("508", "Saint Pierre and Miquelon", "508"),
        new("+685", "Samoa", "+685"),
        new("+378", "San Marino", "+378"),
        new("+966", "Saudi Arabia", "+966"),
        new("+221", "Senegal", "+221"),
        new("+381", "Serbia", "+381"),
        new("+248", "Seychelles", "+248"),
        new("+232", "Sierra Leone", "+232"),
        new("+65", "Singapore", "+65"),
        new("+421", "Slovakia", "+421"),
        new("+386", "Slovenia", "+386"),
        new("+677", "Solomon Islands", "+677"),
        new("+27", "South Africa", "+27"),
        new("+500", "South Georgia and the South Sandwich Islands", "+500"),
        new("+82", "South Korea", "+82"),
        new("+34", "Spain", "+34"),
        new("+94", "Sri Lanka", "+94"),
        new("+249", "Sudan", "+249"),
        new("+597", "Suriname", "+597"),
        new("+268", "Swaziland", "+268"),
        new("+46", "Sweden", "+46"),
        new("+41", "Switzerland", "+41"),
        new("+963", "Syria", "+963"),
        new("+886", "Taiwan", "+886"),
        new("+992", "Tajikistan", "+992"),
        new("+255", "Tanzania", "+255"),
        new("+66", "Thailand", "+66"),
        new("+670", "Timor Leste", "+670"),
        new("+228", "Togo", "+228"),
        new("+690", "Tokelau", "+690"),
        new("+676", "Tonga", "+676"),
        new("+1", "Trinidad and Tobago", "+1"),
        new("+216", "Tunisia", "+216"),
        new("+90", "Turkey", "+90"),
        new("+993", "Turkmenistan", "+993"),
        new("+1", "Turks and Caicos Islands", "+1"),
        new("+688", "Tuvalu", "+688"),
        new("+1", "U.S. Virgin Islands", "+1"),
        new("+256", "Uganda", "+256"),
        new("+380", "Ukraine", "+380"),
        new("+971", "United Arab Emirates", "+971"),
        new("+44", "United Kingdom", "+44"),
        new("+1", "United States", "+1"),
        new("+598", "Uruguay", "+598"),
        new("+998", "Uzbekistan", "+998"),
        new("+678", "Vanuatu", "+678"),
        new("+58", "Venezuela", "+58"),
        new("+84", "Vietnam", "+84"),
        new("+1", "Wake Island", "+1"),
        new("+681", "Wallis and Futuna", "+681"),
        new("+967", "Yemen", "+967"),
        new("+260", "Zambia", "+260"),
        new("+255", "Zanzibar", "+255"),
        new("+263", "Zimbabwe", "+263"),
    ];

    // Ported verbatim, duplicates included ("867" three times, "902" and "782" twice);
    // membership tests do not care and the data should mirror the js-sdk.
    private static readonly string[] CanadianAreaCodes =
    [
        "403", "587", "780", "825", "604", "250", "778", "236", "204", "431",
        "506", "709", "867", "782", "902", "867", "548", "705", "365", "613",
        "807", "226", "289", "437", "519", "647", "905", "249", "343", "416",
        "902", "782", "450", "418", "579", "873", "367", "514", "581", "819",
        "438", "639", "306", "867",
    ];

    /// <summary>
    /// Finds the country for a display code, e.g. "+44". Falls back to prefix matching for
    /// the French overseas territories whose codes are stored with extra digits. Codes shared
    /// by several countries return the first table entry ("+1" returns American Samoa, never
    /// the United States); use <see cref="GetPlusOneCountry"/> to tell NANP territories apart.
    /// </summary>
    /// <param name="code">The display code to look up.</param>
    /// <returns>The matching country, or null.</returns>
    public static Country? GetCountryByCode(string code)
    {
        ArgumentNullException.ThrowIfNull(code);

        foreach (var country in Countries)
        {
            if (country.Code == code)
            {
                return country;
            }
        }

        if (IsFrenchGuiana(code))
        {
            return new Country("+594", "French Guiana", "+594");
        }

        if (IsGuadeloupe(code))
        {
            return new Country("+590", "Guadeloupe", "+590");
        }

        if (IsMartinique(code))
        {
            return new Country("+596", "Martinique", "+596");
        }

        if (IsMayotte(code))
        {
            return new Country("+262", "Mayotte or R\u00e9union", "+262");
        }

        return null;
    }

    /// <summary>Whether the code starts with French Guiana's +594 prefix.</summary>
    /// <param name="code">The phone code to check.</param>
    /// <returns>True when the prefix matches.</returns>
    public static bool IsFrenchGuiana(string code)
    {
        ArgumentNullException.ThrowIfNull(code);
        return Prefix(code, 4) == "+594";
    }

    /// <summary>Whether the code starts with Guadeloupe's +590 prefix.</summary>
    /// <param name="code">The phone code to check.</param>
    /// <returns>True when the prefix matches.</returns>
    public static bool IsGuadeloupe(string code)
    {
        ArgumentNullException.ThrowIfNull(code);
        return Prefix(code, 4) == "+590";
    }

    /// <summary>Whether the code starts with Martinique's +596 prefix.</summary>
    /// <param name="code">The phone code to check.</param>
    /// <returns>True when the prefix matches.</returns>
    public static bool IsMartinique(string code)
    {
        ArgumentNullException.ThrowIfNull(code);
        return Prefix(code, 4) == "+596";
    }

    /// <summary>Whether the code starts with the Mayotte/Reunion +262 prefix.</summary>
    /// <param name="code">The phone code to check.</param>
    /// <returns>True when the prefix matches.</returns>
    public static bool IsMayotte(string code)
    {
        ArgumentNullException.ThrowIfNull(code);
        return Prefix(code, 4) == "+262";
    }

    /// <summary>
    /// Resolves a "+1" NANP code to its territory by area-code prefix. The first five
    /// characters decide the match, so the literal "+1" (nothing after it) yields a country
    /// with an empty name, as in the js-sdk switch.
    /// </summary>
    /// <param name="code">The phone code to resolve.</param>
    /// <returns>The matching country, or null for unrecognized prefixes.</returns>
    public static Country? GetPlusOneCountry(string code)
    {
        ArgumentNullException.ThrowIfNull(code);

        return Prefix(code, 5) switch
        {
            "+1684" => new Country("+1", "American Samoa", "+1"),
            "+1264" => new Country("+1", "Anguilla", "+1"),
            "+1268" => new Country("+1", "Antigua and Barbuda", "+1"),
            "+1242" => new Country("+1", "Bahamas", "+1"),
            "+1246" => new Country("+1", "Barbados", "+1"),
            "+1441" => new Country("+1", "Bermuda", "+1"),
            "+1284" => new Country("+1", "British Virgin Islands", "+1"),
            "+1" => new Country("+1", "", "+1"),
            _ => null,
        };
    }

    /// <summary>Whether a "+1" code carries a Canadian area code.</summary>
    /// <param name="code">The phone code to check.</param>
    /// <returns>True when the area code is Canadian.</returns>
    public static bool IsCanada(string code)
    {
        ArgumentNullException.ThrowIfNull(code);

        var areaCode = Prefix(code, 5);
        foreach (var area in CanadianAreaCodes)
        {
            if ("+1" + area == areaCode)
            {
                return true;
            }
        }

        return false;
    }

    /// <summary>Whether the code starts with American Samoa's +1684 prefix.</summary>
    /// <param name="code">The phone code to check.</param>
    /// <returns>True when the prefix matches.</returns>
    public static bool IsAmericanSamoa(string code)
    {
        ArgumentNullException.ThrowIfNull(code);
        return Prefix(code, 5) == "+1684";
    }

    /// <summary>Whether the code starts with a Dominican Republic prefix (+1809/+1829/+1849).</summary>
    /// <param name="code">The phone code to check.</param>
    /// <returns>True when the prefix matches.</returns>
    public static bool IsDominicanRepublic(string code)
    {
        ArgumentNullException.ThrowIfNull(code);

        var prefix = Prefix(code, 5);
        return prefix == "+1809" || prefix == "+1829" || prefix == "+1849";
    }

    /// <summary>
    /// Whether the code is Puerto Rico's. Ported js-sdk bug: the js compares against "+"
    /// twice where the real prefixes are +1787 and +1939, so this returns true only for the
    /// literal string "+". Kept as-is per the true-up policy of porting quirks rather than
    /// fixing them.
    /// </summary>
    /// <param name="code">The phone code to check.</param>
    /// <returns>True only for the literal string "+".</returns>
    public static bool IsPuertoRico(string code)
    {
        ArgumentNullException.ThrowIfNull(code);
        return Prefix(code, 5) == "+";
    }

    /// <summary>
    /// Counts the table entries whose code equals the first <paramref name="substrings"/>
    /// characters of the input. The js-sdk marks this one "need to finish": despite the name
    /// it returns a count, not a country, and duplicate rows count twice. Ported as-is.
    /// </summary>
    /// <param name="code">The phone code to match.</param>
    /// <param name="substrings">How many leading characters to compare (negative counts as zero, like the JS substring bound).</param>
    /// <returns>How many <see cref="Countries"/> rows carry exactly that code prefix.</returns>
    public static int GetMatchingCountry(string code, int substrings)
    {
        ArgumentNullException.ThrowIfNull(code);

        var toMatch = Prefix(code, Math.Max(0, substrings));
        var count = 0;
        foreach (var country in Countries)
        {
            if (country.Code == toMatch)
            {
                count++;
            }
        }

        return count;
    }

    // JS substring clamps to the string length; C# Substring throws, so every prefix
    // comparison goes through this instead.
    private static string Prefix(string code, int length)
    {
        return code.Length <= length ? code : code[..length];
    }
}
