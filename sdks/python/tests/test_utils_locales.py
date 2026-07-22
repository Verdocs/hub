"""Country data and lookups (verdocs.utils.locales).

The table quirks asserted here (duplicate Martinique, "+1" resolving to
American Samoa, the Puerto Rico bug) are ported behavior; if one of these
tests starts failing, the js-sdk and this port have drifted apart.
"""

from __future__ import annotations

import pytest

from verdocs.utils import (
    COUNTRIES,
    Country,
    get_country_by_code,
    get_matching_country,
    get_plus_one_country,
    is_american_samoa,
    is_canada,
    is_dominican_republic,
    is_french_guiana,
    is_guadeloupe,
    is_martinique,
    is_mayotte,
    is_puerto_rico,
)


def test_table_matches_js_sdk():
    assert len(COUNTRIES) == 236
    assert COUNTRIES[0] == Country(code="+7 840", name="Abkhazia", value="+7")
    assert COUNTRIES[-1] == Country(code="+263", name="Zimbabwe", value="+263")


def test_table_keeps_js_quirks_verbatim():
    # Martinique is listed twice, Saint Pierre has no "+", and the Reunion
    # entry carries the same escaped e-acute as the js-sdk source.
    assert sum(1 for c in COUNTRIES if c.name == "Martinique") == 2
    assert Country(code="508", name="Saint Pierre and Miquelon", value="508") in COUNTRIES
    assert any(c.name == "Mayotte or R\u00e9union" for c in COUNTRIES)
    assert Country(code="+77", name="Kazakhstan", value="+7") in COUNTRIES


def test_get_country_by_code_exact_match():
    country = get_country_by_code("+44")
    assert country is not None
    assert country.name == "United Kingdom"


def test_get_country_by_code_shared_code_returns_first_row():
    # "+1" is shared by 25 rows; table order makes American Samoa win, so the
    # United States is never returned for "+1". Ported behavior.
    country = get_country_by_code("+1")
    assert country is not None
    assert country.name == "American Samoa"


@pytest.mark.parametrize(
    ("code", "name"),
    [
        ("+5941234", "French Guiana"),
        ("+5901234", "Guadeloupe"),
        ("+5961234", "Martinique"),
        ("+2621234", "Mayotte or R\u00e9union"),
    ],
)
def test_get_country_by_code_french_territory_fallbacks(code: str, name: str):
    country = get_country_by_code(code)
    assert country is not None
    assert country.name == name


def test_get_country_by_code_unknown():
    assert get_country_by_code("nope") is None
    assert get_country_by_code("+999") is None


def test_prefix_helpers():
    assert is_french_guiana("+594123")
    assert not is_french_guiana("+593123")
    assert is_guadeloupe("+590123")
    assert is_martinique("+596123")
    assert is_mayotte("+262123")
    assert not is_mayotte("+261123")
    # Shorter than the prefix window is fine; slicing just yields the whole string.
    assert not is_mayotte("+26")


def test_get_plus_one_country():
    samoa = get_plus_one_country("+16845551212")
    assert samoa == Country(code="+1", name="American Samoa", value="+1")
    assert get_plus_one_country("+12425551212") == Country(code="+1", name="Bahamas", value="+1")
    # The bare "+1" arm produces an empty-named entry, as in the js-sdk switch.
    assert get_plus_one_country("+1") == Country(code="+1", name="", value="+1")
    # Five-character prefixes that name no territory produce nothing, even
    # though "+1999..." is still a NANP-shaped number.
    assert get_plus_one_country("+19995551212") is None
    assert get_plus_one_country("") is None


def test_is_canada():
    assert is_canada("+14035551212")
    assert is_canada("+16475551212")
    assert not is_canada("+12125551212")
    assert not is_canada("+1")


def test_is_american_samoa():
    assert is_american_samoa("+16845551212")
    assert not is_american_samoa("+16855551212")


def test_is_dominican_republic():
    assert is_dominican_republic("+18095551212")
    assert is_dominican_republic("+18295551212")
    assert is_dominican_republic("+18495551212")
    assert not is_dominican_republic("+18085551212")


def test_is_puerto_rico_ported_bug():
    # The js-sdk compares against "+" twice, so real PR prefixes never match.
    # Kept verbatim; these pins document the bug.
    assert is_puerto_rico("+")
    assert not is_puerto_rico("+17875551212")
    assert not is_puerto_rico("+19395551212")


def test_get_matching_country_counts_rows():
    # Returns a count, not a country (the js-sdk marks it "need to finish").
    assert get_matching_country("+445551212", 3) == 1
    assert get_matching_country("+15551212", 2) == 25
    # Duplicate Martinique rows both count.
    assert get_matching_country("+5965551212", 4) == 2
    assert get_matching_country("+9995551212", 4) == 0
