"""Country calling-code data and lookups (js-sdk: Utils/Locales.ts).

The table and its quirks port verbatim from the js-sdk: Martinique appears
twice, Saint Pierre and Miquelon has no "+" prefix, Kazakhstan's display code
is "+77" with dial value "+7", and the accented Reunion entry keeps the same
escape the js-sdk source carries. Fixing any of it here would desync the two
SDKs, so we do not.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Country:
    """One COUNTRIES entry (js-sdk ICountry)."""

    # Display code as shown in pickers; unique per row apart from the shared "+1".
    code: str
    name: str
    # The dial prefix actually prepended to numbers.
    value: str


COUNTRIES: tuple[Country, ...] = (
    Country(code="+7 840", name="Abkhazia", value="+7"),
    Country(code="+93", name="Afghanistan", value="+93"),
    Country(code="+355", name="Albania", value="+355"),
    Country(code="+213", name="Algeria", value="+213"),
    Country(code="+1", name="American Samoa", value="+1"),
    Country(code="+376", name="Andorra", value="+376"),
    Country(code="+244", name="Angola", value="+244"),
    Country(code="+1", name="Anguilla", value="+1"),
    Country(code="+1", name="Antigua and Barbuda", value="+1"),
    Country(code="+54", name="Argentina", value="+54"),
    Country(code="+374", name="Armenia", value="+374"),
    Country(code="+297", name="Aruba", value="+297"),
    Country(code="+247", name="Ascension", value="+247"),
    Country(code="+61", name="Australia", value="+61"),
    Country(code="+672", name="Australian External Territories", value="+672"),
    Country(code="+43", name="Austria", value="+43"),
    Country(code="+994", name="Azerbaijan", value="+994"),
    Country(code="+1", name="Bahamas", value="+1"),
    Country(code="+973", name="Bahrain", value="+973"),
    Country(code="+880", name="Bangladesh", value="+880"),
    Country(code="+1", name="Barbados", value="+1"),
    Country(code="+1", name="Barbuda", value="+1"),
    Country(code="+375", name="Belarus", value="+375"),
    Country(code="+32", name="Belgium", value="+32"),
    Country(code="+501", name="Belize", value="+501"),
    Country(code="+229", name="Benin", value="+229"),
    Country(code="+1", name="Bermuda", value="+1"),
    Country(code="+975", name="Bhutan", value="+975"),
    Country(code="+591", name="Bolivia", value="+591"),
    Country(code="+387", name="Bosnia and Herzegovina", value="+387"),
    Country(code="+267", name="Botswana", value="+267"),
    Country(code="+55", name="Brazil", value="+55"),
    Country(code="+246", name="British Indian Ocean Territory", value="+246"),
    Country(code="+1", name="British Virgin Islands", value="+1"),
    Country(code="+673", name="Brunei", value="+673"),
    Country(code="+359", name="Bulgaria", value="+359"),
    Country(code="+226", name="Burkina Faso", value="+226"),
    Country(code="+257", name="Burundi", value="+257"),
    Country(code="+855", name="Cambodia", value="+855"),
    Country(code="+237", name="Cameroon", value="+237"),
    Country(code="+1", name="Canada", value="+1"),
    Country(code="+238", name="Cape Verde", value="+238"),
    Country(code="+1", name="Cayman Islands", value="+1"),
    Country(code="+236", name="Central African Republic", value="+236"),
    Country(code="+235", name="Chad", value="+235"),
    Country(code="+56", name="Chile", value="+56"),
    Country(code="+86", name="China", value="+86"),
    Country(code="+61", name="Christmas Island", value="+61"),
    Country(code="+61", name="Cocos-Keeling Islands", value="+61"),
    Country(code="+57", name="Colombia", value="+57"),
    Country(code="+269", name="Comoros", value="+269"),
    Country(code="+242", name="Congo", value="+242"),
    Country(code="+243", name="Congo, Dem. Rep. of (Zaire)", value="+243"),
    Country(code="+682", name="Cook Islands", value="+682"),
    Country(code="+506", name="Costa Rica", value="+506"),
    Country(code="+385", name="Croatia", value="+385"),
    Country(code="+53", name="Cuba", value="+53"),
    Country(code="+599", name="Curacao", value="+599"),
    Country(code="+537", name="Cyprus", value="+537"),
    Country(code="+420", name="Czech Republic", value="+420"),
    Country(code="+45", name="Denmark", value="+45"),
    Country(code="+246", name="Diego Garcia", value="+246"),
    Country(code="+253", name="Djibouti", value="+253"),
    Country(code="+1", name="Dominica", value="+1"),
    Country(code="+1", name="Dominican Republic", value="+1"),
    Country(code="+670", name="East Timor", value="+670"),
    Country(code="+56", name="Easter Island", value="+56"),
    Country(code="+593", name="Ecuador", value="+593"),
    Country(code="+20", name="Egypt", value="+20"),
    Country(code="+503", name="El Salvador", value="+503"),
    Country(code="+240", name="Equatorial Guinea", value="+240"),
    Country(code="+291", name="Eritrea", value="+291"),
    Country(code="+372", name="Estonia", value="+372"),
    Country(code="+251", name="Ethiopia", value="+251"),
    Country(code="+500", name="Falkland Islands", value="+500"),
    Country(code="+298", name="Faroe Islands", value="+298"),
    Country(code="+679", name="Fiji", value="+679"),
    Country(code="+358", name="Finland", value="+358"),
    Country(code="+33", name="France", value="+33"),
    Country(code="+596", name="Martinique", value="+596"),
    Country(code="+594", name="French Guiana", value="+594"),
    Country(code="+689", name="French Polynesia", value="+689"),
    Country(code="+241", name="Gabon", value="+241"),
    Country(code="+220", name="Gambia", value="+220"),
    Country(code="+995", name="Georgia", value="+995"),
    Country(code="+49", name="Germany", value="+49"),
    Country(code="+233", name="Ghana", value="+233"),
    Country(code="+350", name="Gibraltar", value="+350"),
    Country(code="+30", name="Greece", value="+30"),
    Country(code="+299", name="Greenland", value="+299"),
    Country(code="+1", name="Grenada", value="+1"),
    Country(code="+590", name="Guadeloupe", value="+590"),
    Country(code="+1", name="Guam", value="+1"),
    Country(code="+502", name="Guatemala", value="+502"),
    Country(code="+224", name="Guinea", value="+224"),
    Country(code="+245", name="Guinea-Bissau", value="+245"),
    Country(code="+595", name="Guyana", value="+595"),
    Country(code="+509", name="Haiti", value="+509"),
    Country(code="+504", name="Honduras", value="+504"),
    Country(code="+852", name="Hong Kong SAR China", value="+852"),
    Country(code="+36", name="Hungary", value="+36"),
    Country(code="+354", name="Iceland", value="+354"),
    Country(code="+91", name="India", value="+91"),
    Country(code="+62", name="Indonesia", value="+62"),
    Country(code="+98", name="Iran", value="+98"),
    Country(code="+964", name="Iraq", value="+964"),
    Country(code="+353", name="Ireland", value="+353"),
    Country(code="+972", name="Israel", value="+972"),
    Country(code="+39", name="Italy", value="+39"),
    Country(code="+225", name="Ivory Coast", value="+225"),
    Country(code="+1", name="Jamaica", value="+1"),
    Country(code="+81", name="Japan", value="+81"),
    Country(code="+962", name="Jordan", value="+962"),
    Country(code="+77", name="Kazakhstan", value="+7"),
    Country(code="+254", name="Kenya", value="+254"),
    Country(code="+686", name="Kiribati", value="+686"),
    Country(code="+965", name="Kuwait", value="+965"),
    Country(code="+996", name="Kyrgyzstan", value="+996"),
    Country(code="+856", name="Laos", value="+856"),
    Country(code="+371", name="Latvia", value="+371"),
    Country(code="+961", name="Lebanon", value="+961"),
    Country(code="+266", name="Lesotho", value="+266"),
    Country(code="+231", name="Liberia", value="+231"),
    Country(code="+218", name="Libya", value="+218"),
    Country(code="+423", name="Liechtenstein", value="+423"),
    Country(code="+370", name="Lithuania", value="+370"),
    Country(code="+352", name="Luxembourg", value="+352"),
    Country(code="+853", name="Macau SAR China", value="+853"),
    Country(code="+389", name="Macedonia", value="+389"),
    Country(code="+261", name="Madagascar", value="+261"),
    Country(code="+265", name="Malawi", value="+265"),
    Country(code="+60", name="Malaysia", value="+60"),
    Country(code="+960", name="Maldives", value="+960"),
    Country(code="+223", name="Mali", value="+223"),
    Country(code="+356", name="Malta", value="+356"),
    Country(code="+692", name="Marshall Islands", value="+692"),
    Country(code="+596", name="Martinique", value="+596"),
    Country(code="+222", name="Mauritania", value="+222"),
    Country(code="+230", name="Mauritius", value="+230"),
    Country(code="+262", name="Mayotte or R\u00e9union", value="+262"),
    Country(code="+52", name="Mexico", value="+52"),
    Country(code="+691", name="Micronesia", value="+691"),
    Country(code="+1", name="Midway Island", value="+1"),
    Country(code="+373", name="Moldova", value="+373"),
    Country(code="+377", name="Monaco", value="+377"),
    Country(code="+976", name="Mongolia", value="+976"),
    Country(code="+382", name="Montenegro", value="+382"),
    Country(code="+1", name="Montserrat", value="+1"),
    Country(code="+212", name="Morocco", value="+212"),
    Country(code="+95", name="Myanmar", value="+95"),
    Country(code="+264", name="Namibia", value="+264"),
    Country(code="+674", name="Nauru", value="+674"),
    Country(code="+977", name="Nepal", value="+977"),
    Country(code="+31", name="Netherlands", value="+31"),
    Country(code="+599", name="Netherlands Antilles", value="+599"),
    Country(code="+1", name="Nevis", value="+1"),
    Country(code="+687", name="New Caledonia", value="+687"),
    Country(code="+64", name="New Zealand", value="+64"),
    Country(code="+505", name="Nicaragua", value="+505"),
    Country(code="+227", name="Niger", value="+227"),
    Country(code="+234", name="Nigeria", value="+234"),
    Country(code="+683", name="Niue", value="+683"),
    Country(code="+672", name="Norfolk Island", value="+672"),
    Country(code="+850", name="North Korea", value="+850"),
    Country(code="+1", name="Northern Mariana Islands", value="+1"),
    Country(code="+47", name="Norway", value="+47"),
    Country(code="+968", name="Oman", value="+968"),
    Country(code="+92", name="Pakistan", value="+92"),
    Country(code="+680", name="Palau", value="+680"),
    Country(code="+970", name="Palestinian Territory", value="+970"),
    Country(code="+507", name="Panama", value="+507"),
    Country(code="+675", name="Papua New Guinea", value="+675"),
    Country(code="+595", name="Paraguay", value="+595"),
    Country(code="+51", name="Peru", value="+51"),
    Country(code="+63", name="Philippines", value="+63"),
    Country(code="+48", name="Poland", value="+48"),
    Country(code="+351", name="Portugal", value="+351"),
    Country(code="+1", name="Puerto Rico", value="+1"),
    Country(code="+974", name="Qatar", value="+974"),
    Country(code="+40", name="Romania", value="+40"),
    Country(code="+7", name="Russia", value="+7"),
    Country(code="+250", name="Rwanda", value="+250"),
    Country(code="508", name="Saint Pierre and Miquelon", value="508"),
    Country(code="+685", name="Samoa", value="+685"),
    Country(code="+378", name="San Marino", value="+378"),
    Country(code="+966", name="Saudi Arabia", value="+966"),
    Country(code="+221", name="Senegal", value="+221"),
    Country(code="+381", name="Serbia", value="+381"),
    Country(code="+248", name="Seychelles", value="+248"),
    Country(code="+232", name="Sierra Leone", value="+232"),
    Country(code="+65", name="Singapore", value="+65"),
    Country(code="+421", name="Slovakia", value="+421"),
    Country(code="+386", name="Slovenia", value="+386"),
    Country(code="+677", name="Solomon Islands", value="+677"),
    Country(code="+27", name="South Africa", value="+27"),
    Country(code="+500", name="South Georgia and the South Sandwich Islands", value="+500"),
    Country(code="+82", name="South Korea", value="+82"),
    Country(code="+34", name="Spain", value="+34"),
    Country(code="+94", name="Sri Lanka", value="+94"),
    Country(code="+249", name="Sudan", value="+249"),
    Country(code="+597", name="Suriname", value="+597"),
    Country(code="+268", name="Swaziland", value="+268"),
    Country(code="+46", name="Sweden", value="+46"),
    Country(code="+41", name="Switzerland", value="+41"),
    Country(code="+963", name="Syria", value="+963"),
    Country(code="+886", name="Taiwan", value="+886"),
    Country(code="+992", name="Tajikistan", value="+992"),
    Country(code="+255", name="Tanzania", value="+255"),
    Country(code="+66", name="Thailand", value="+66"),
    Country(code="+670", name="Timor Leste", value="+670"),
    Country(code="+228", name="Togo", value="+228"),
    Country(code="+690", name="Tokelau", value="+690"),
    Country(code="+676", name="Tonga", value="+676"),
    Country(code="+1", name="Trinidad and Tobago", value="+1"),
    Country(code="+216", name="Tunisia", value="+216"),
    Country(code="+90", name="Turkey", value="+90"),
    Country(code="+993", name="Turkmenistan", value="+993"),
    Country(code="+1", name="Turks and Caicos Islands", value="+1"),
    Country(code="+688", name="Tuvalu", value="+688"),
    Country(code="+1", name="U.S. Virgin Islands", value="+1"),
    Country(code="+256", name="Uganda", value="+256"),
    Country(code="+380", name="Ukraine", value="+380"),
    Country(code="+971", name="United Arab Emirates", value="+971"),
    Country(code="+44", name="United Kingdom", value="+44"),
    Country(code="+1", name="United States", value="+1"),
    Country(code="+598", name="Uruguay", value="+598"),
    Country(code="+998", name="Uzbekistan", value="+998"),
    Country(code="+678", name="Vanuatu", value="+678"),
    Country(code="+58", name="Venezuela", value="+58"),
    Country(code="+84", name="Vietnam", value="+84"),
    Country(code="+1", name="Wake Island", value="+1"),
    Country(code="+681", name="Wallis and Futuna", value="+681"),
    Country(code="+967", name="Yemen", value="+967"),
    Country(code="+260", name="Zambia", value="+260"),
    Country(code="+255", name="Zanzibar", value="+255"),
    Country(code="+263", name="Zimbabwe", value="+263"),
)

# North American Numbering Plan territories distinguishable by their first
# five characters; "" marks the bare "+1" prefix with no specific territory.
_PLUS_ONE_PREFIXES = {
    "+1684": "American Samoa",
    "+1264": "Anguilla",
    "+1268": "Antigua and Barbuda",
    "+1242": "Bahamas",
    "+1246": "Barbados",
    "+1441": "Bermuda",
    "+1284": "British Virgin Islands",
    "+1": "",
}

# Ported verbatim, duplicates included ("867" three times, "902" and "782"
# twice); membership tests do not care and the data should mirror the js-sdk.
_CANADIAN_AREA_CODES = (
    "403",
    "587",
    "780",
    "825",
    "604",
    "250",
    "778",
    "236",
    "204",
    "431",
    "506",
    "709",
    "867",
    "782",
    "902",
    "867",
    "548",
    "705",
    "365",
    "613",
    "807",
    "226",
    "289",
    "437",
    "519",
    "647",
    "905",
    "249",
    "343",
    "416",
    "902",
    "782",
    "450",
    "418",
    "579",
    "873",
    "367",
    "514",
    "581",
    "819",
    "438",
    "639",
    "306",
    "867",
)


def get_country_by_code(code: str) -> Country | None:
    """Find the country for a display code, e.g. "+44".

    Falls back to prefix matching for the French overseas territories whose
    codes are stored with extra digits. Codes shared by several countries
    return the first table entry ("+1" returns American Samoa, never the
    United States); use get_plus_one_country() to tell NANP territories apart.

    Args:
        code: The display code to look up.

    Returns:
        The matching Country, or None.
    """
    for country in COUNTRIES:
        if country.code == code:
            return country

    if is_french_guiana(code):
        return Country(code="+594", name="French Guiana", value="+594")
    if is_guadeloupe(code):
        return Country(code="+590", name="Guadeloupe", value="+590")
    if is_martinique(code):
        return Country(code="+596", name="Martinique", value="+596")
    if is_mayotte(code):
        return Country(code="+262", name="Mayotte or R\u00e9union", value="+262")

    return None


def is_french_guiana(code: str) -> bool:
    """Whether the code starts with French Guiana's +594 prefix."""
    return code[:4] == "+594"


def is_guadeloupe(code: str) -> bool:
    """Whether the code starts with Guadeloupe's +590 prefix."""
    return code[:4] == "+590"


def is_martinique(code: str) -> bool:
    """Whether the code starts with Martinique's +596 prefix."""
    return code[:4] == "+596"


def is_mayotte(code: str) -> bool:
    """Whether the code starts with the Mayotte/Reunion +262 prefix."""
    return code[:4] == "+262"


def get_plus_one_country(code: str) -> Country | None:
    """Resolve a "+1" NANP code to its territory by area-code prefix.

    Args:
        code: The phone code; the first five characters decide the match, so
            the literal "+1" (nothing after it) yields a Country with an
            empty name.

    Returns:
        The matching Country, or None for unrecognized prefixes.
    """
    name = _PLUS_ONE_PREFIXES.get(code[:5])
    if name is None:
        return None
    return Country(code="+1", name=name, value="+1")


def is_canada(code: str) -> bool:
    """Whether a "+1" code carries a Canadian area code."""
    prefix = code[:5]
    return any("+1" + area == prefix for area in _CANADIAN_AREA_CODES)


def is_american_samoa(code: str) -> bool:
    """Whether the code starts with American Samoa's +1684 prefix."""
    return code[:5] == "+1684"


def is_dominican_republic(code: str) -> bool:
    """Whether the code starts with a Dominican Republic prefix (+1809/+1829/+1849)."""
    return code[:5] == "+1809" or code[:5] == "+1829" or code[:5] == "+1849"


def is_puerto_rico(code: str) -> bool:
    """Whether the code is Puerto Rico's. Ported js-sdk bug: only "+" matches.

    The js-sdk compares against "+" twice where the real prefixes are +1787
    and +1939, so this returns True only for the literal string "+". Kept
    as-is per the true-up policy of porting quirks rather than fixing them.
    """
    return code[:5] == "+"


def get_matching_country(code: str, substrings: int) -> int:
    """Count the table entries whose code equals the first `substrings` characters.

    The js-sdk marks this one "need to finish": despite the name it returns a
    count, not a country, and duplicate rows count twice. Ported as-is.

    Args:
        code: The phone code to match.
        substrings: How many leading characters to compare (clamped at zero,
            like the JS substring bound).

    Returns:
        How many COUNTRIES rows carry exactly that code prefix.
    """
    to_match = code[: max(0, substrings)]
    return sum(1 for country in COUNTRIES if country.code == to_match)
