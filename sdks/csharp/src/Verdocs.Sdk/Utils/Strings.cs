using System.Security.Cryptography;
using System.Text;

namespace Verdocs.Utils;

/// <summary>String helpers (js-sdk: Utils/Strings.ts).</summary>
public static class Strings
{
    // The digits Math.random().toString(36) can produce; RandomString draws from the same
    // alphabet so its output is interchangeable with the js-sdk's.
    private const string Base36Alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";

    /// <summary>Returns the string with its first letter uppercased.</summary>
    /// <param name="value">The string to capitalize. May be empty.</param>
    /// <returns>The input with the first character uppercased, other characters untouched.</returns>
    public static string Capitalize(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        return value.Length == 0 ? value : char.ToUpperInvariant(value[0]) + value[1..];
    }

    /// <summary>
    /// Converts a phone-number-like string to E.164 format, assuming US numbers. A value
    /// already prefixed with "+" is only trimmed: the caller set a country code deliberately,
    /// so non-US numbers pass through untouched. Everything else has punctuation stripped,
    /// one leading zero removed, and "+1" prepended (the js-sdk assumes US for unprefixed
    /// input, and we keep that).
    ///
    /// <example>
    /// <code>
    /// Strings.ConvertToE164("(212) 555-1212"); // "+12125551212"
    /// Strings.ConvertToE164("+46766861004");   // "+46766861004"
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="input">The phone-number-like input; null is treated as empty.</param>
    /// <returns>The E.164 string, or the trimmed input when it was blank or "+"-prefixed.</returns>
    public static string ConvertToE164(string? input)
    {
        var trimmed = (input ?? string.Empty).Trim();
        if (trimmed.Length == 0 || trimmed.StartsWith('+'))
        {
            return trimmed;
        }

        var digits = new StringBuilder(trimmed.Length);
        foreach (var ch in trimmed)
        {
            if (char.IsAsciiDigit(ch))
            {
                digits.Append(ch);
            }
        }

        // One leading zero comes off after the punctuation strip because it may hide inside
        // it, e.g. "(05..." as well as "0(5...".
        var number = digits.ToString();
        if (number.StartsWith('0'))
        {
            number = number[1..];
        }

        return "+1" + number;
    }

    /// <summary>
    /// Generates a random lowercase-alphanumeric string of the given length. Adapted from
    /// the js-sdk, which slices Math.random().toString(36) and, due to an off-by-one in its
    /// substring bounds, actually returns length + 1 characters. We draw exactly
    /// <paramref name="length"/> characters from the same base36 alphabet using a
    /// cryptographic RNG (per the true-up handoff), so the output is also safe for more than
    /// DOM-id duty.
    /// </summary>
    /// <param name="length">Number of characters to generate.</param>
    /// <returns>A random string of exactly <paramref name="length"/> characters from [0-9a-z].</returns>
    public static string RandomString(int length)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(length);
        return RandomNumberGenerator.GetString(Base36Alphabet, length);
    }
}
