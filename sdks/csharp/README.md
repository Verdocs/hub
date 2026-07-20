# Verdocs C# SDK

The .NET client for the Verdocs e-signature platform. This is the seed build: it establishes
the client shape (`VerdocsEndpoint`), the error model, the serialization conventions, and the
conformance lane, with hand-written models covering the first few operations. The binding
rules live in `docs/standards/csharp.md` at the hub root; read that before changing anything
structural.

## Layout

- `src/Verdocs.Sdk`: the library. Package id `Verdocs.Sdk`, root namespace `Verdocs`,
  multi-targets net8.0 and net10.0. Pack-ready metadata is in place but nothing publishes to
  NuGet.org until instructed.
- `tests/Verdocs.Sdk.Tests`: xunit v3 tests, plus the live conformance lane.

A toolchain note: the library multi-targets net8.0 and net10.0, and building both works fine
with only the .NET 10 SDK installed. Running net8.0 binaries would need the .NET 8 runtime,
which this machine does not have, so the test project targets net10.0 only. That keeps
`dotnet test` runnable locally while the library still proves it compiles against the net8.0
surface.

## Building and testing

```bash
dotnet build                  # both TFMs
dotnet build -warnaserror     # what CI runs; must be clean
dotnet test                   # unit tests; the conformance lane self-skips
./docs/generate-sdk-docs.sh   # regenerate sdk-docs.json from XML docs via DocFX tooling
```

From the hub root, regenerate every language then unify:

```bash
pnpm generate:sdk-docs
```

Unit tests never touch the network. HTTP behavior is tested against a fake message handler,
and serialization tests round-trip each model from payloads shaped like real API responses.
`sdk-docs.json` at this package root is what `packages/js-sdk` unify loads for the C# variant.

## Conformance lane

The shared fixture cases in `packages/conformance/fixtures.json` run against live beta: each
covered endpoint is called with a raw HttpClient and with the SDK, volatile fields (tokens,
timestamps, expiries) are masked the same way `packages/conformance/src/support.ts` masks
them, and status plus normalized JSON must match deeply. The lane is skipped unless you opt
in:

```bash
VERDOCS_CONFORMANCE=1 dotnet test --filter "FullyQualifiedName~Conformance"
```

Credentials come from `VERDOCS_API_BASE`, `VERDOCS_TEST_EMAIL`, and `VERDOCS_TEST_PASSWORD`,
read from the environment first and then from the hub root `.env`. All cases are read-only
apart from the password grants themselves. The star-toggle case is frozen in fixtures.json
and intentionally not implemented here.

## Quickstart

```csharp
using Verdocs;
using Verdocs.Models;

using var endpoint = new VerdocsEndpoint();

var auth = await endpoint.AuthenticateAsync(new PasswordGrantRequest
{
    Username = "you@example.com",
    Password = "PASSWORD",
});
endpoint.SetToken(auth.AccessToken);

var page = await endpoint.GetTemplatesAsync(new GetTemplatesOptions { Rows = 10 });
foreach (var template in page.Templates)
{
    Console.WriteLine($"{template.Id} {template.Name}");
}
```

`VerdocsEndpoint.Default` provides a lazily created shared instance for apps that want one,
and the constructor takes an optional `HttpClient` for IHttpClientFactory users (the endpoint
never mutates or disposes a client it was given). An endpoint carries one session, user or
signing; create a second endpoint when you need both concurrently.

## What is covered so far

- Auth (mirrors js-sdk `Users/Auth.ts`): `AuthenticateAsync` (all OAuth2 grants),
  `GetOAuth2AuthorizeUrl`, `RefreshTokenAsync`, `ChangePasswordAsync`, `ResetPasswordAsync`,
  `ResendVerificationAsync`, `VerifyEmailAsync`, `GetMyUserAsync`.
- `GetCurrentProfileAsync`: GET /v2/profiles, returning the entry marked current.
- `GetTemplatesAsync`: GET /v2/templates with typed filter/sort/paging options.
- `GetTemplateAsync`: GET /v2/templates/:template_id, including roles, documents, and fields.

Template create, update, and delete are deliberately not in the seed: the js-sdk create path
mixes multipart uploads with three different document-attachment shapes, and we are not
locking in a C# surface for that until the wire contract is settled. List and get are enough
to prove the client shape. Models are hand-written and treated as throwaway until type
generation lands; unknown wire fields never throw, and each model carries them in
`AdditionalData` so payloads round-trip losslessly.
