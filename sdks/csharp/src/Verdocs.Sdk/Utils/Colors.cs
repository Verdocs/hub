using System.Globalization;

namespace Verdocs.Utils;

/// <summary>
/// Signer color helpers (js-sdk: Utils/Colors.ts). Field placements are tinted per recipient
/// role; these helpers pick the tint. The outputs must match the js-sdk byte for byte because
/// both SDKs feed the same rendering surfaces, so the JS number quirks (truncated modulo,
/// 32-bit hash wraparound, round-half-up) are reproduced deliberately below.
/// </summary>
public static class Colors
{
    private const string DefaultColor = "rgba(229, 115, 155, 0.3)";

    /// <summary>
    /// Converts an "rgba(r,g,b,a)" string to its hex equivalent, dropping alpha. The alpha
    /// channel is composited against white first, so the hex color is what the translucent
    /// tint actually looks like on a page.
    /// </summary>
    /// <param name="rgba">A CSS rgba() string, e.g. "rgba(255, 193, 7, 0.4)".</param>
    /// <returns>The lowercase hex color, e.g. "#ffe69c".</returns>
    public static string GetRgb(string rgba)
    {
        ArgumentNullException.ThrowIfNull(rgba);

        var numbers = rgba
            .Replace("rgba(", string.Empty, StringComparison.Ordinal)
            .Replace(")", string.Empty, StringComparison.Ordinal)
            .Split(',');
        var redIn = double.Parse(numbers[0], CultureInfo.InvariantCulture);
        var greenIn = double.Parse(numbers[1], CultureInfo.InvariantCulture);
        var blueIn = double.Parse(numbers[2], CultureInfo.InvariantCulture);
        var alphaIn = double.Parse(numbers[3], CultureInfo.InvariantCulture);

        var inverse = 1 - alphaIn;
        var red = JsRound((alphaIn * (redIn / 255) + inverse) * 255);
        var green = JsRound((alphaIn * (greenIn / 255) + inverse) * 255);
        var blue = JsRound((alphaIn * (blueIn / 255) + inverse) * 255);
        return "#" + RgbToHex(red) + RgbToHex(green) + RgbToHex(blue);
    }

    /// <summary>
    /// Returns the color code for a signer given its role index. Indexes cycle through ten
    /// colors; index 0 gets its own shade so the first signer stands out from every tenth one
    /// after it.
    /// </summary>
    /// <param name="roleIndex">Zero-based index of the role in the template's role list.</param>
    /// <returns>A CSS rgba() string.</returns>
    public static string GetRgba(int roleIndex)
    {
        // C# % truncates toward zero like JS, so a negative index matches no case and falls
        // to the default color. The ".4" spellings (no leading zero) are what the js-sdk
        // emits; keep them byte-exact.
        return (roleIndex % 10) switch
        {
            0 => roleIndex == 0 ? "rgba(255, 193, 7, 0.4)" : "rgba(134, 134, 134, 0.3)",
            1 => "rgba(156, 39, 176, .4)",
            2 => "rgba(33, 150, 243, .4)",
            3 => "rgba(220, 231, 117, 0.3)",
            4 => "rgba(121, 134, 203, 0.3)",
            5 => "rgba(77, 182, 172, 0.3)",
            6 => "rgba(255, 202, 165, 0.3)",
            7 => "rgba(2, 247, 190, 0.3)",
            8 => "rgba(255, 138, 101, 0.3)",
            9 => "rgba(82, 255, 79, 0.3)",
            _ => DefaultColor,
        };
    }

    /// <summary>
    /// Derives a stable color code from a role name. The color is not specified explicitly: a
    /// hash of the name picks it, so the same name always yields the same color. Matches the
    /// js-sdk hash (including its 32-bit shift wraparound) so every SDK tints a given role
    /// identically.
    /// </summary>
    /// <param name="name">
    /// The role name. Names ending in a digit get extra hash input so "Signer 1" and
    /// "Signer 2" land on visibly different colors.
    /// </param>
    /// <returns>A CSS rgba() string, or null for an empty name (the js-sdk returns undefined there).</returns>
    public static string? NameToRgba(string? name)
    {
        if (string.IsNullOrEmpty(name))
        {
            return null;
        }

        // Only ASCII digits count, mirroring JS parseInt on the last character.
        var text = name;
        var last = text[^1];
        if (char.IsAsciiDigit(last))
        {
            text += ((last - '0') * 99).ToString(CultureInfo.InvariantCulture);
        }

        // The JS hash: hash = charCodeAt(i) + ((hash << 5) - hash). The shift applies
        // ECMAScript ToInt32 to hash first (unchecked long-to-int keeps the low 32 bits, which
        // is the same wrap), while the add and subtract happen on the unwrapped value.
        long hash = 0;
        foreach (var ch in text)
        {
            var shifted = unchecked((int)hash) << 5;
            hash = ch + (shifted - hash);
        }

        hash = JsRound((double)hash / 1.3);

        // JS & converts both operands with ToInt32 before masking; the mask has the sign bit
        // clear, so the result is non-negative.
        var masked = unchecked((int)hash) & 0x00ffff08;

        var digits = masked.ToString("X", CultureInfo.InvariantCulture);
        var hex = "00000"[..(6 - digits.Length)] + digits;
        var red = int.Parse(hex.AsSpan(0, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture);
        var green = int.Parse(hex.AsSpan(2, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture);
        var blue = int.Parse(hex.AsSpan(4, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture);
        return FormattableString.Invariant($"rgba({red}, {green}, {blue}, 0.2)");
    }

    /// <summary>
    /// Picks a color code for a role name from whichever inputs are available. An explicit
    /// index wins, then the name's position in the roles list, and a name absent from the
    /// list falls back to the name hash.
    /// </summary>
    /// <param name="name">The role name to color.</param>
    /// <param name="roles">The template's role names, in order. May be null or empty.</param>
    /// <param name="index">
    /// Explicit role index. The js-sdk checks truthiness, so 0 falls through to the roles
    /// lookup; we keep that quirk.
    /// </param>
    /// <returns>A CSS rgba() string, or null when only an empty name is available.</returns>
    public static string? GetRoleColor(string? name, IReadOnlyList<string>? roles, int? index = null)
    {
        if (index is { } explicitIndex && explicitIndex != 0)
        {
            return GetRgba(explicitIndex);
        }

        if (roles is { Count: > 0 })
        {
            for (var i = 0; i < roles.Count; i++)
            {
                if (roles[i] == name)
                {
                    return GetRgba(i);
                }
            }
        }

        return NameToRgba(name);
    }

    // JS Math.round rounds half toward +infinity; Math.Round in .NET banks to even, so 144.5
    // would drift down to 144 and desync the ports.
    private static long JsRound(double value)
    {
        return (long)Math.Floor(value + 0.5);
    }

    private static string RgbToHex(long value)
    {
        var digits = value.ToString("x", CultureInfo.InvariantCulture);
        return digits.Length < 2 ? "0" + digits : digits;
    }
}
