using System.Globalization;

namespace Verdocs.Utils;

/// <summary>Compact relative timestamps (js-sdk: Utils/DateTime.ts).</summary>
public static class Dates
{
    private const long Year = 365L * 24 * 60 * 60;

    // No month unit: the js-sdk comments it out, so weeks run all the way up to a year
    // (e.g. 30 days ago renders as "4W").
    private const long Week = 7L * 24 * 60 * 60;
    private const long Day = 24L * 60 * 60;
    private const long Hour = 60L * 60;
    private const long Minute = 60;

    /// <summary>
    /// Formats how long ago a moment was as a compact unit string, e.g. "5M". Units are S,
    /// M (minutes), H, D, W, and Y, matching the js-sdk output byte for byte.
    /// </summary>
    /// <param name="value">The moment to describe; null yields "".</param>
    /// <returns>
    /// The elapsed time as "&lt;n&gt;&lt;unit&gt;", or "" when there is nothing to format. A
    /// future moment comes out with a negative count, as in the js-sdk.
    /// </returns>
    /// <sdkOperation>dateTime.formatShortTimeAgo</sdkOperation>
    /// <sdkGroup>DateTime</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static string FormatShortTimeAgo(DateTimeOffset? value)
    {
        if (value is not { } moment)
        {
            return string.Empty;
        }

        var seconds = (long)Math.Floor((DateTimeOffset.UtcNow - moment).TotalSeconds);
        if (seconds >= Year)
        {
            return Format(seconds / Year, "Y");
        }

        if (seconds >= Week)
        {
            return Format(seconds / Week, "W");
        }

        if (seconds >= Day)
        {
            return Format(seconds / Day, "D");
        }

        if (seconds >= Hour)
        {
            return Format(seconds / Hour, "H");
        }

        if (seconds >= Minute)
        {
            return Format(seconds / Minute, "M");
        }

        return Format(seconds, "S");
    }

    /// <summary>
    /// Formats how long ago a moment was, parsing it from a date string first (typically
    /// ISO 8601, as the API sends). A string without a zone is read as local time, the same
    /// way JS reads zone-less date strings.
    /// </summary>
    /// <param name="value">The date string; null and unparseable strings yield "".</param>
    /// <returns>The elapsed time as "&lt;n&gt;&lt;unit&gt;", or "" when there is nothing to format.</returns>
    public static string FormatShortTimeAgo(string? value)
    {
        if (value is null)
        {
            return string.Empty;
        }

        // Adapted at the edge: the js-sdk builds an Invalid Date here and renders "NaNS".
        return DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var parsed)
            ? FormatShortTimeAgo(parsed)
            : string.Empty;
    }

    /// <summary>
    /// Formats how long ago a moment was, given as milliseconds since the Unix epoch (the
    /// number form the js-sdk accepts).
    /// </summary>
    /// <param name="epochMilliseconds">The moment, in milliseconds since 1970-01-01T00:00:00Z.</param>
    /// <returns>The elapsed time as "&lt;n&gt;&lt;unit&gt;".</returns>
    public static string FormatShortTimeAgo(long epochMilliseconds)
    {
        return FormatShortTimeAgo(DateTimeOffset.FromUnixTimeMilliseconds(epochMilliseconds));
    }

    private static string Format(long count, string unit)
    {
        return count.ToString(CultureInfo.InvariantCulture) + unit;
    }
}
