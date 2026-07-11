namespace Verdocs.Sdk.Tests.Conformance;

/// <summary>
/// Loads VERDOCS_API_BASE, VERDOCS_TEST_EMAIL, and VERDOCS_TEST_PASSWORD. Real environment
/// variables win; anything missing falls back to the nearest .env above the test binary,
/// which in this repo is the gitignored hub/.env. Values are never logged or embedded in
/// assertion messages.
/// </summary>
internal static class ConformanceEnv
{
    internal static ConformanceSettings? TryLoad()
    {
        var fromFile = LoadNearestDotEnv();

        string? Get(string key)
        {
            var fromEnvironment = Environment.GetEnvironmentVariable(key);
            return !string.IsNullOrEmpty(fromEnvironment) ? fromEnvironment : fromFile.GetValueOrDefault(key);
        }

        var apiBase = Get("VERDOCS_API_BASE");
        var email = Get("VERDOCS_TEST_EMAIL");
        var password = Get("VERDOCS_TEST_PASSWORD");

        if (string.IsNullOrEmpty(apiBase) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
        {
            return null;
        }

        return new ConformanceSettings(apiBase, email, password);
    }

    private static Dictionary<string, string> LoadNearestDotEnv()
    {
        var values = new Dictionary<string, string>(StringComparer.Ordinal);

        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            var path = Path.Combine(directory.FullName, ".env");
            if (!File.Exists(path))
            {
                continue;
            }

            // Simple KEY=VALUE lines; comments and blanks skipped, optional surrounding quotes stripped.
            foreach (var line in File.ReadAllLines(path))
            {
                var trimmed = line.Trim();
                if (trimmed.Length == 0 || trimmed.StartsWith('#'))
                {
                    continue;
                }

                var separator = trimmed.IndexOf('=', StringComparison.Ordinal);
                if (separator <= 0)
                {
                    continue;
                }

                var key = trimmed[..separator].Trim();
                var value = trimmed[(separator + 1)..].Trim().Trim('"', '\'');
                values[key] = value;
            }

            break;
        }

        return values;
    }
}
