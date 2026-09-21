using System.Reflection;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Verdocs;

namespace Verdocs.Sdk.Docs;

/// <summary>
/// Reads Verdocs.Sdk XML documentation (the same contract DocFX metadata consumes) and
/// emits sdks/csharp/sdk-docs.json for the shared unify step.
/// </summary>
internal static class Program
{
    // The docs carry the package version so consumers can tell which release they describe.
    // It comes from the csproj, the single place the version is set.
    private static string ReadPackageVersion(string csharpRoot)
    {
        var csproj = Path.Combine(csharpRoot, "src", "Verdocs.Sdk", "Verdocs.Sdk.csproj");
        var match = Regex.Match(File.ReadAllText(csproj), "<Version>([^<]+)</Version>");
        return match.Success ? match.Groups[1].Value.Trim() : "0.0.0";
    }

    private static readonly HashSet<string> SdkPages = ["Endpoints", "Helpers"];

    // The operations we document live on the resource/helper/util classes, not on
    // VerdocsEndpoint itself (that type only exposes get-only properties to reach them).
    private static readonly string[] DocumentedNamespaces = ["Verdocs.Resources", "Verdocs.Helpers", "Verdocs.Utils"];

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static int Main(string[] args)
    {
        var csharpRoot = FindCsharpRoot();
        var xmlPath = ResolveXmlPath(csharpRoot, args);
        var outputPath = Path.Combine(csharpRoot, "sdk-docs.json");

        var docsByMember = LoadXmlDocs(xmlPath);
        var groups = new Dictionary<string, SdkGroup>(StringComparer.Ordinal);
        var assembly = typeof(VerdocsEndpoint).Assembly;

        var types = assembly.GetTypes()
            .Where(t => t.IsPublic && DocumentedNamespaces.Contains(t.Namespace))
            .OrderBy(t => t.FullName, StringComparer.Ordinal);

        const BindingFlags bindingFlags = BindingFlags.Public | BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static;

        foreach (var type in types)
        {
            foreach (var method in type.GetMethods(bindingFlags))
            {
                if (method.IsSpecialName)
                {
                    continue;
                }

                var memberName = ToXmlMemberName(method);
                if (!docsByMember.TryGetValue(memberName, out var docs) || string.IsNullOrEmpty(docs.SdkOperation))
                {
                    continue;
                }

                var groupName = string.IsNullOrEmpty(docs.SdkGroup) ? "Ungrouped" : docs.SdkGroup;
                var groupId = Slugify(groupName);
                var page = SdkPages.Contains(docs.SdkPage) ? docs.SdkPage : "Endpoints";

                var parameters = BuildParams(method, docs);
                var returnType = TypeDisplayName(method.ReturnType) + (IsNullableReference(method.ReturnParameter) ? "?" : "");
                var symbol = new SdkSymbol
                {
                    SdkOperation = docs.SdkOperation,
                    Kind = "function",
                    Name = method.Name,
                    Page = page,
                    GettingStarted = docs.GettingStarted,
                    Resource = "function",
                    Signature = BuildSignature(method.Name, parameters, returnType),
                    Summary = docs.Summary,
                    Params = parameters,
                    Returns = new SdkReturns { Type = returnType, Description = docs.ReturnsDescription },
                    Throws = docs.Throws,
                    Examples = docs.Examples,
                    Deprecated = method.GetCustomAttribute<ObsoleteAttribute>() is not null,
                };

                if (!groups.TryGetValue(groupId, out var group))
                {
                    group = new SdkGroup
                    {
                        Id = groupId,
                        Name = groupName,
                        Summary = "",
                        Symbols = new Dictionary<string, SdkSymbol>(StringComparer.Ordinal),
                    };
                    groups[groupId] = group;
                }

                group.Symbols[docs.SdkOperation] = symbol;
            }
        }

        var model = new SdkDocs
        {
            Language = "csharp",
            Package = "Verdocs.Sdk",
            Version = ReadPackageVersion(csharpRoot),
            Groups = groups,
        };

        var json = JsonSerializer.Serialize(model, JsonOptions) + "\n";
        // STJ camelCase turns SdkOperation into sdkOperation, which matches the shared model.
        File.WriteAllText(outputPath, json);

        var count = groups.Values.Sum(g => g.Symbols.Count);
        Console.WriteLine($"Wrote {Path.GetRelativePath(csharpRoot, outputPath)} with {count} symbols");
        return 0;
    }

    private static string FindCsharpRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "Verdocs.Sdk.sln")))
            {
                return dir.FullName;
            }

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate the sdks/csharp root (Verdocs.Sdk.sln).");
    }

    private static string ResolveXmlPath(string csharpRoot, string[] args)
    {
        if (args.Length > 0 && File.Exists(args[0]))
        {
            return args[0];
        }

        var candidates = new[]
        {
            Path.Combine(csharpRoot, "src", "Verdocs.Sdk", "bin", "Debug", "net10.0", "Verdocs.Sdk.xml"),
            Path.Combine(csharpRoot, "src", "Verdocs.Sdk", "bin", "Release", "net10.0", "Verdocs.Sdk.xml"),
            Path.Combine(csharpRoot, "src", "Verdocs.Sdk", "bin", "Debug", "net8.0", "Verdocs.Sdk.xml"),
            Path.Combine(csharpRoot, "src", "Verdocs.Sdk", "bin", "Release", "net8.0", "Verdocs.Sdk.xml"),
        };

        foreach (var candidate in candidates)
        {
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        throw new FileNotFoundException(
            "Verdocs.Sdk.xml not found. Run `dotnet build` first, or pass the XML path as an argument.");
    }

    private static Dictionary<string, XmlMemberDocs> LoadXmlDocs(string xmlPath)
    {
        var document = XDocument.Load(xmlPath);
        var result = new Dictionary<string, XmlMemberDocs>(StringComparer.Ordinal);

        foreach (var member in document.Root?.Element("members")?.Elements("member") ?? [])
        {
            var name = (string?)member.Attribute("name");
            if (string.IsNullOrEmpty(name) || !name.StartsWith("M:", StringComparison.Ordinal))
            {
                continue;
            }

            var summary = FirstParagraph(InnerText(member.Element("summary")));
            var returns = InnerText(member.Element("returns"));
            var sdkOperation = InnerText(member.Element("sdkOperation"));
            var sdkGroup = InnerText(member.Element("sdkGroup"));
            var sdkPage = InnerText(member.Element("sdkPage"));
            var gettingStarted = member.Element("sdkGettingStarted") is not null;

            var paramDocs = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (var param in member.Elements("param"))
            {
                var paramName = (string?)param.Attribute("name");
                if (!string.IsNullOrEmpty(paramName))
                {
                    paramDocs[paramName] = InnerText(param);
                }
            }

            var throws = new List<SdkThrow>();
            foreach (var exception in member.Elements("exception"))
            {
                var cref = (string?)exception.Attribute("cref") ?? "";
                throws.Add(new SdkThrow
                {
                    Type = CrefToTypeName(cref),
                    Description = InnerText(exception),
                });
            }

            var examples = new List<SdkExample>();
            foreach (var example in member.Descendants("example"))
            {
                var code = example.Element("code") is { } codeElement
                    ? NormalizeCode(codeElement.Value)
                    : NormalizeCode(example.Value);
                if (!string.IsNullOrWhiteSpace(code))
                {
                    examples.Add(new SdkExample { Language = "csharp", Code = code });
                }
            }

            result[name] = new XmlMemberDocs
            {
                Summary = summary,
                ReturnsDescription = returns,
                SdkOperation = sdkOperation,
                SdkGroup = sdkGroup,
                SdkPage = sdkPage,
                GettingStarted = gettingStarted,
                ParamDocs = paramDocs,
                Throws = throws,
                Examples = examples,
            };
        }

        return result;
    }

    private static string ToXmlMemberName(MethodInfo method)
    {
        var parameters = method.GetParameters();
        var typeName = method.DeclaringType!.FullName!.Replace('+', '.');
        if (parameters.Length == 0)
        {
            return $"M:{typeName}.{method.Name}";
        }

        var paramTypes = string.Join(",", parameters.Select(p => XmlTypeName(p.ParameterType)));
        return $"M:{typeName}.{method.Name}({paramTypes})";
    }

    private static string XmlTypeName(Type type)
    {
        if (type.IsByRef)
        {
            return XmlTypeName(type.GetElementType()!) + "@";
        }

        if (type.IsGenericType)
        {
            var definition = type.GetGenericTypeDefinition().FullName!;
            var tick = definition.IndexOf('`');
            var root = (tick >= 0 ? definition[..tick] : definition).Replace('+', '.');
            var args = string.Join(",", type.GetGenericArguments().Select(XmlTypeName));
            return $"{root}{{{args}}}";
        }

        return type.FullName!.Replace('+', '.');
    }

    private static List<SdkParam> BuildParams(MethodInfo method, XmlMemberDocs docs)
    {
        var result = new List<SdkParam>();
        foreach (var parameter in method.GetParameters())
        {
            var optional = parameter.HasDefaultValue || parameter.IsOptional;
            string? defaultValue = null;
            if (parameter.ParameterType == typeof(CancellationToken) && optional)
            {
                defaultValue = "default";
            }
            else if (parameter.HasDefaultValue)
            {
                defaultValue = parameter.DefaultValue is null ? "null" : Convert.ToString(parameter.DefaultValue);
            }

            result.Add(new SdkParam
            {
                Name = parameter.Name ?? "",
                Type = TypeDisplayName(parameter.ParameterType) + (IsNullableReference(parameter) ? "?" : ""),
                Description = docs.ParamDocs.GetValueOrDefault(parameter.Name ?? "", ""),
                Optional = optional,
                Default = defaultValue,
            });
        }

        return result;
    }

    private static string BuildSignature(string name, List<SdkParam> parameters, string returnType)
    {
        var rendered = parameters.Select(param =>
        {
            var optionalMarker = param.Optional && param.Default is null ? "?" : "";
            var defaultSuffix = param.Default is null ? "" : $" = {param.Default}";
            return $"{param.Type} {param.Name}{optionalMarker}{defaultSuffix}";
        });
        return $"{returnType} {name}({string.Join(", ", rendered)})";
    }

    private static readonly NullabilityInfoContext NullabilityContext = new();

    // Reference-type nullability (`string?`) is erased from Type at runtime; NullabilityInfoContext
    // reads the compiler-emitted attributes to recover it. Value types already carry their own
    // nullability via Nullable<T>, so this only matters for reference types.
    private static bool IsNullableReference(ParameterInfo parameter)
    {
        if (parameter.ParameterType.IsValueType)
        {
            return false;
        }

        return NullabilityContext.Create(parameter).ReadState == NullabilityState.Nullable;
    }

    private static string TypeDisplayName(Type type)
    {
        if (type == typeof(void))
        {
            return "void";
        }

        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(Task<>))
        {
            return "Task<" + TypeDisplayName(type.GetGenericArguments()[0]) + ">";
        }

        if (type == typeof(Task))
        {
            return "Task";
        }

        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(Nullable<>))
        {
            return TypeDisplayName(type.GetGenericArguments()[0]) + "?";
        }

        if (type.IsArray)
        {
            return TypeDisplayName(type.GetElementType()!) + "[]";
        }

        if (type.IsGenericType)
        {
            var name = type.Name;
            var tick = name.IndexOf('`');
            if (tick >= 0)
            {
                name = name[..tick];
            }

            var args = string.Join(", ", type.GetGenericArguments().Select(TypeDisplayName));
            return $"{name}<{args}>";
        }

        return type.Name switch
        {
            "String" => "string",
            "Int32" => "int",
            "Int64" => "long",
            "Boolean" => "bool",
            "Object" => "object",
            "Byte" => "byte",
            "Double" => "double",
            "Single" => "float",
            "Decimal" => "decimal",
            _ => type.Name,
        };
    }

    private static string CrefToTypeName(string cref)
    {
        if (string.IsNullOrEmpty(cref))
        {
            return "Exception";
        }

        var value = cref.StartsWith("T:", StringComparison.Ordinal) ? cref[2..] : cref;
        var lastDot = value.LastIndexOf('.');
        return lastDot >= 0 ? value[(lastDot + 1)..] : value;
    }

    private static string Slugify(string value)
    {
        var slug = Regex.Replace(value.Trim().ToLowerInvariant(), "[^a-z0-9]+", "-");
        return slug.Trim('-');
    }

    private static string InnerText(XElement? element)
    {
        if (element is null)
        {
            return "";
        }

        return string.Concat(element.Nodes().Select(node => node switch
        {
            XText text => text.Value,
            XElement child when child.Name.LocalName == "see" => SeeLabel(child),
            XElement child when child.Name.LocalName == "c" => child.Value,
            XElement child => InnerText(child),
            _ => "",
        })).Trim();
    }

    private static string SeeLabel(XElement see)
    {
        if ((string?)see.Attribute("langword") is { } langword)
        {
            return langword;
        }

        var cref = (string?)see.Attribute("cref");
        if (string.IsNullOrEmpty(cref))
        {
            return "";
        }

        // M:Namespace.Type.Method(args) -> Method; T:Namespace.Type -> Type
        if (cref.StartsWith("M:", StringComparison.Ordinal))
        {
            var withoutPrefix = cref[2..];
            var paren = withoutPrefix.IndexOf('(');
            var beforeParen = paren >= 0 ? withoutPrefix[..paren] : withoutPrefix;
            var lastDot = beforeParen.LastIndexOf('.');
            return lastDot >= 0 ? beforeParen[(lastDot + 1)..] : beforeParen;
        }

        return CrefToTypeName(cref);
    }

    private static string FirstParagraph(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return "";
        }

        var normalized = Regex.Replace(text, @"\s+", " ").Trim();
        var parts = Regex.Split(text.Trim(), @"\n\s*\n");
        if (parts.Length > 0 && !string.IsNullOrWhiteSpace(parts[0]))
        {
            return Regex.Replace(parts[0], @"\s+", " ").Trim();
        }

        return normalized;
    }

    private static string NormalizeCode(string code)
    {
        var lines = code.Replace("\r\n", "\n").Split('\n');
        var trimmed = lines.Select(line => line.TrimEnd()).ToList();
        while (trimmed.Count > 0 && string.IsNullOrWhiteSpace(trimmed[0]))
        {
            trimmed.RemoveAt(0);
        }

        while (trimmed.Count > 0 && string.IsNullOrWhiteSpace(trimmed[^1]))
        {
            trimmed.RemoveAt(trimmed.Count - 1);
        }

        if (trimmed.Count == 0)
        {
            return "";
        }

        var indent = trimmed
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .Select(line => line.TakeWhile(char.IsWhiteSpace).Count())
            .DefaultIfEmpty(0)
            .Min();

        return string.Join("\n", trimmed.Select(line =>
            line.Length <= indent ? line.TrimStart() : line[indent..]));
    }

    private sealed class XmlMemberDocs
    {
        public string Summary { get; init; } = "";
        public string ReturnsDescription { get; init; } = "";
        public string SdkOperation { get; init; } = "";
        public string SdkGroup { get; init; } = "";
        public string SdkPage { get; init; } = "";
        public bool GettingStarted { get; init; }
        public Dictionary<string, string> ParamDocs { get; init; } = new();
        public List<SdkThrow> Throws { get; init; } = [];
        public List<SdkExample> Examples { get; init; } = [];
    }

    private sealed class SdkDocs
    {
        public string Language { get; init; } = "";
        public string Package { get; init; } = "";
        public string Version { get; init; } = "";
        public Dictionary<string, SdkGroup> Groups { get; init; } = new();
    }

    private sealed class SdkGroup
    {
        public string Id { get; init; } = "";
        public string Name { get; init; } = "";
        public string Summary { get; init; } = "";
        public Dictionary<string, SdkSymbol> Symbols { get; init; } = new();
    }

    private sealed class SdkSymbol
    {
        public string SdkOperation { get; init; } = "";
        public string Kind { get; init; } = "";
        public string Name { get; init; } = "";
        public string Page { get; init; } = "";
        public bool GettingStarted { get; init; }
        public string Resource { get; init; } = "";
        public string Signature { get; init; } = "";
        public string Summary { get; init; } = "";
        public List<SdkParam> Params { get; init; } = [];
        public SdkReturns? Returns { get; init; }
        public List<SdkThrow> Throws { get; init; } = [];
        public List<SdkExample> Examples { get; init; } = [];
        public bool Deprecated { get; init; }
    }

    private sealed class SdkParam
    {
        public string Name { get; init; } = "";
        public string Type { get; init; } = "";
        public string Description { get; init; } = "";
        public bool Optional { get; init; }
        public string? Default { get; init; }
    }

    private sealed class SdkReturns
    {
        public string Type { get; init; } = "";
        public string Description { get; init; } = "";
    }

    private sealed class SdkThrow
    {
        public string Type { get; init; } = "";
        public string Description { get; init; } = "";
    }

    private sealed class SdkExample
    {
        public string Language { get; init; } = "";
        public string Code { get; init; } = "";
    }
}
