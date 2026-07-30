# C# SDK Standards

This document is binding for the C# SDK (`src/Verdocs.Sdk` and `tests/Verdocs.Sdk.Tests`), starting with the seed build. It exists so reviewers cite a rule number instead of re-litigating style. Leadership has fixed the big decisions: package id `Verdocs.Sdk`, root namespace `Verdocs`, a Task-based async API, System.Text.Json, a `VerdocsEndpoint` client mirroring the JS SDK, hand-written types until generation lands, and xunit tests. Publishing was off the table through the seed and true-up phases and opened up with the 1.0.0 release on 2026-07-29; rule 3 has the current terms. Targeting was verified against the official .NET support policy on 2026-07-10: .NET 8 is LTS (supported through November 10, 2026), .NET 10 is LTS (released November 11, 2025, supported through November 14, 2028), and .NET 9 is STS. The SDK shipped 1.0.0 on net10.0 only; rule 2 has the reasoning and the conditions for adding net8.0 back.

## Binding rules

1. The package id is `Verdocs.Sdk` and the root namespace is `Verdocs`. Models may live under `Verdocs.Models`; don't invent namespaces deeper than the folders imply.
2. Target `<TargetFramework>net10.0</TargetFramework>`, and never add an STS target. The library multi-targeted net8.0 and net10.0 through the seed and true-up phases, and net8.0 came out for the 1.0.0 release: only the .NET 10 runtime is on the build machine, so the net8.0 output had compiled everywhere and executed nowhere, and Chad's call on 2026-07-29 was to ship only what has genuinely been tested. Adding a target framework back is additive and does not break existing consumers, so if a .NET 8 shop turns up, restore net8.0 in a patch, with a runtime in CI to actually exercise it. .NET 8 leaves support in November 2026 either way.
3. The package publishes to NuGet.org as `Verdocs.Sdk`, starting with 1.0.0 on 2026-07-29. The csproj carries the pack metadata (PackageId, Version, Description, license expression, README, symbols). Publishing still happens only when instructed, and a version number is never reused: NuGet refuses a re-push of one that exists, unlisting a version does not free the number, and every bump means editing `<Version>` in the csproj.
4. Library code lives in `src/Verdocs.Sdk`, tests in `tests/Verdocs.Sdk.Tests`. Settings both projects share (nullable, analyzers, warnings policy) live in one `Directory.Build.props` so they can't drift.
5. `VerdocsEndpoint` is the client. It carries the base URL, timeout, client id, and the authorization context for exactly one session, which is either a user session or a signing session (`SessionType.User` / `SessionType.Signing`, an enum, not a string). Apps run two endpoints concurrently when they need both, same as the JS SDK.
6. Provide public constructors plus a lazily created `VerdocsEndpoint.Default` static instance, mirroring the JS SDK's `getDefault()`. Nothing inside the SDK silently assumes `Default`; whatever operates on an endpoint is handed one.
7. The constructor accepts an optional `HttpClient` so IHttpClientFactory users can hand one in. The endpoint never disposes or mutates a caller-supplied client (no touching `BaseAddress` or `DefaultRequestHeaders`); auth and client-id headers go on each `HttpRequestMessage`. Given no client, it creates its own over a `SocketsHttpHandler` with `PooledConnectionLifetime` set, per the HttpClient guidelines, and disposes it in `Dispose()`. Dispose what you created, never what you were given.
8. Every public method that performs I/O is async, returns `Task` or `Task<T>`, and ends in `Async`, per TAP. No sync variants, no `.Result` or `.Wait()`, no `async void`.
9. Every public async method takes `CancellationToken cancellationToken = default` as its last parameter, no exceptions. Azure's guidelines mandate the same, and it's far cheaper to add now than to retrofit.
10. Await with `ConfigureAwait(false)` throughout the library (analyzer CA2007). The SDK never needs the caller's context and shouldn't hold it hostage.
11. Serialization is System.Text.Json, nothing else. All serializer configuration lives on one internal shared `JsonSerializerOptions`; when we adopt source generation, the `JsonSerializerContext` slots into that one place.
12. Models are sealed records with init-only properties. Octokit.net and Stripe.net use mutable classes, but those choices date to netstandard2.0 and pre-STJ serializers; on net8.0+, records are less code to hand-write, immutable, and value-equal, which the tests get for free. Use a class only when a model genuinely needs inheritance or mutation, with a comment saying why.
13. The wire format is snake_case. Set `PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower` (built into .NET 8 and later, verified) on the shared options rather than attributing every property. `[JsonPropertyName]` is only for names the policy can't derive; it overrides the policy by design.
14. Hand-written model types cover exactly what the wrapped endpoints return. They're accepted as throwaway until type generation lands, so no speculative fields and no gold-plating.
15. A failed API call throws `VerdocsApiException`, derived from `VerdocsException`, carrying the `HttpStatusCode` and the raw response body. Callers catch `VerdocsException` for anything SDK-shaped. Add subtypes only when a caller needs to catch that case programmatically, which is the Azure SDK bar.
16. No exceptions for control flow. Usage errors (bad arguments, wrong state) throw ArgumentException-family or InvalidOperationException synchronously; everything else surfaces on the returned task, per TAP.
17. `<Nullable>enable</Nullable>` and `<ImplicitUsings>enable</ImplicitUsings>` in every project, tests included. Leave `LangVersion` at the SDK default, which on net10.0 is C# 14.
18. File-scoped namespaces only, one public type per file, filename matching the type.
19. Every public member gets XML doc comments: `<summary>` always, `<param>` and `<returns>` where they exist. `<GenerateDocumentationFile>true</GenerateDocumentationFile>` turns missing docs into CS1591 warnings, which CI turns into errors. Prose follows `docs/standards/comments.md`.
20. Naming follows the Framework Design Guidelines: PascalCase for types and public members, camelCase for parameters, no Hungarian prefixes, and only universally understood abbreviations (Http, Json, Id).
21. Tests use xunit v3 (the `xunit.v3` package; v2 is maintenance-only). `[Fact]` for single cases, `[Theory]` with `[InlineData]` or `[MemberData]` for parameterized ones.
22. Test names read `Method_Scenario_ExpectedOutcome`, e.g. `SetToken_ExpiredToken_ClearsSession`.
23. No test interdependence: xunit creates a fresh test-class instance per test and runs collections in parallel, so never rely on execution order or shared mutable state. Expensive immutable setup goes in an `IClassFixture<T>`.
24. .NET analyzers on: `<EnableNETAnalyzers>true</EnableNETAnalyzers>` with `<AnalysisLevel>latest</AnalysisLevel>`. CI builds with `-warnaserror`; local builds may warn so iteration stays fast, CI does not.

## VerdocsEndpoint

The reference for behavior is `packages/js-sdk/src/VerdocsEndpoint.ts`. The concept to preserve: an endpoint is one connection-plus-authorization context, a user session and a signing session are distinct, and both can be live at once in different endpoint instances (an authenticated user signing an envelope, for instance). `SetToken` stores the JWT and applies it per request; `ClearSession` drops it. The browser-specific pieces (localStorage persistence, origin sniffing) don't carry over; .NET callers own token persistence.

## Testing

Unit tests never touch the network. `VerdocsEndpoint` accepting an injected `HttpClient` is also the test seam: hand it a client over a fake `HttpMessageHandler` and assert on the captured requests and canned responses. Serialization tests round-trip the hand-written models against captured API JSON so the snake_case mapping stays honest.

## Sources

Consulted 2026-07-10:

- https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core verified the LTS picture: .NET 8 LTS through 2026-11-10, .NET 10 LTS through 2028-11-14, .NET 9 STS (purpose paragraph, rule 2).
- https://learn.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap informed rules 8, 9, and 16: Async suffix, the cancellationToken convention, usage errors throw synchronously.
- https://azure.github.io/azure-sdk/dotnet_introduction.html informed rules 5-9 and 15: client shape, optional CancellationToken on every service method, don't multiply exception types, target current LTS.
- https://learn.microsoft.com/en-us/dotnet/fundamentals/networking/http/httpclient-guidelines informed rule 7: client lifetime, PooledConnectionLifetime, factory-created clients.
- https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/customize-properties verified rule 13: JsonNamingPolicy.SnakeCaseLower exists in .NET 8+, and [JsonPropertyName] overrides the policy.
- https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/source-generation informed rule 11: JsonSerializerContext and why the options stay in one place.
- https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/naming-guidelines informed rule 20: the conventions apply to all publicly exposed APIs.
- https://learn.microsoft.com/en-us/nuget/create-packages/package-authoring-best-practices informed rule 3: id, metadata, and license conventions for a pack-ready csproj.
- https://xunit.net/ confirmed xunit v3 (`xunit.v3`) is the current line and v2 is maintenance-only (rule 21).
- https://xunit.net/docs/shared-context informed rule 23: fresh class instance per test, IClassFixture for shared context.
- https://github.com/octokit/octokit.net and https://github.com/stripe/stripe-dotnet surveyed for client and model shape: both accept caller HTTP plumbing, both use classes for legacy reasons (rules 7 and 12).
