"""Pure-logic helpers ported from the js-sdk Utils module.

Each submodule mirrors one js-sdk source file (colors, dates, entitlements,
fields, files, locales, primitives, strings, token); this barrel re-exports
their public names so both import styles work:

    from verdocs.utils import get_rgb
    from verdocs.utils.colors import get_rgb
"""

from .colors import get_rgb, get_rgba, get_role_color, name_to_rgba
from .dates import format_short_time_ago
from .entitlements import collapse_entitlements
from .fields import bytes_to_base64, get_r_left, get_r_top, get_r_value, rescale
from .files import bytes_to_data_url
from .locales import (
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
from .primitives import format_full_name, format_initials, full_name_to_initials, integer_sequence
from .strings import capitalize, convert_to_e164, random_string
from .token import decode_access_token_body, decode_jwt_body

__all__ = [
    "COUNTRIES",
    "Country",
    "bytes_to_base64",
    "bytes_to_data_url",
    "capitalize",
    "collapse_entitlements",
    "convert_to_e164",
    "decode_access_token_body",
    "decode_jwt_body",
    "format_full_name",
    "format_initials",
    "format_short_time_ago",
    "full_name_to_initials",
    "get_country_by_code",
    "get_matching_country",
    "get_plus_one_country",
    "get_r_left",
    "get_r_top",
    "get_r_value",
    "get_rgb",
    "get_rgba",
    "get_role_color",
    "integer_sequence",
    "is_american_samoa",
    "is_canada",
    "is_dominican_republic",
    "is_french_guiana",
    "is_guadeloupe",
    "is_martinique",
    "is_mayotte",
    "is_puerto_rico",
    "name_to_rgba",
    "random_string",
    "rescale",
]
