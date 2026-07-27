using System.Text;
using Verdocs.Models;

namespace Verdocs.Utils;

/// <summary>Name and sequence primitives (js-sdk: Utils/Primitives.ts).</summary>
public static class Primitives
{
    /// <summary>
    /// Returns a list of consecutive integers, e.g. [start, start + 1, ...]. Frequently
    /// useful in rendering when there is no source list to iterate.
    /// </summary>
    /// <param name="start">The first value.</param>
    /// <param name="count">How many values to produce.</param>
    /// <returns>A list of <paramref name="count"/> integers beginning at <paramref name="start"/>.</returns>
    /// <sdkOperation>primitive.integerSequence</sdkOperation>
    /// <sdkGroup>Primitive</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static IReadOnlyList<int> IntegerSequence(int start, int count)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(count);

        var values = new int[count];
        for (var i = 0; i < count; i++)
        {
            values[i] = start + i;
        }

        return values;
    }

    /// <summary>
    /// Formats a profile-like record's full name, capitalized. The js-sdk takes a structural
    /// source object; pass the record's name fields directly, e.g.
    /// FormatFullName(profile.FirstName, profile.LastName).
    /// </summary>
    /// <param name="firstName">The first name; null is treated as empty.</param>
    /// <param name="lastName">The last name; null is treated as empty.</param>
    /// <returns>
    /// "First Last", trimmed, so a single known name comes back alone and no names at all
    /// come back as "".
    /// </returns>
    /// <sdkOperation>primitive.formatFullName</sdkOperation>
    /// <sdkGroup>Primitive</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static string FormatFullName(string? firstName, string? lastName)
    {
        return (Strings.Capitalize(firstName ?? string.Empty) + " " + Strings.Capitalize(lastName ?? string.Empty)).Trim();
    }

    /// <summary>
    /// Formats a profile's initials, e.g. "T U", with "--" for no profile.
    /// </summary>
    /// <param name="profile">
    /// The profile to read. The js-sdk assumes both names are present; a missing one is
    /// treated as empty here rather than throwing.
    /// </param>
    /// <returns>The space-separated uppercase initials, or "--" when there is no profile to read.</returns>
    /// <sdkOperation>primitive.formatInitials</sdkOperation>
    /// <sdkGroup>Primitive</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static string FormatInitials(Profile? profile)
    {
        if (profile is null)
        {
            return "--";
        }

        var first = Strings.Capitalize(profile.FirstName ?? string.Empty);
        var last = Strings.Capitalize(profile.LastName ?? string.Empty);
        return (first.Length > 0 ? first[..1] : string.Empty) + " " + (last.Length > 0 ? last[..1] : string.Empty);
    }

    /// <summary>
    /// Generates suggested initials for a full name, e.g. "John Doe" yields "JD". Splits on
    /// single spaces and keeps each word's first character unchanged, matching the js-sdk
    /// (which does not uppercase here).
    /// </summary>
    /// <param name="name">The full name.</param>
    /// <returns>The concatenated first characters.</returns>
    /// <sdkOperation>primitive.fullNameToInitials</sdkOperation>
    /// <sdkGroup>Primitive</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static string FullNameToInitials(string name)
    {
        ArgumentNullException.ThrowIfNull(name);

        // A repeated space yields an empty word, which contributes nothing (in js, undefined
        // joins as "").
        var initials = new StringBuilder();
        foreach (var word in name.Split(' '))
        {
            if (word.Length > 0)
            {
                initials.Append(word[0]);
            }
        }

        return initials.ToString();
    }
}
