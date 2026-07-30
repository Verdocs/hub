# Verdocs C# SDK

The .NET client for the Verdocs e-signature platform, at full parity with the js-sdk public
surface. `VerdocsEndpoint` groups every operation onto resource properties (the same layout
as the Python SDK): Templates, TemplateDocuments, TemplateRoles, TemplateFields, Envelopes,
Recipients, Kba, Signatures, Initials, Organizations, Members, Groups, Invitations, Contacts,
ApiKeys, Brands, Webhooks, NotificationTemplates, Users, Profiles, and Auth. Pure-logic
helpers live in `Verdocs.Helpers` (permissions, validators) and `Verdocs.Utils` (colors,
dates, locales, primitives, strings, token, entitlements). Models are sealed records with
snake_case serialization that keep undocumented server fields via extension data.

API reference and guides: https://developers.verdocs.com

In the source repo, the symbol-by-symbol parity mapping lives in `sdks/API-PARITY.md` at the
hub root, the binding rules in `docs/standards/csharp.md`, and wire-truth notes for the tricky
endpoints in `sdks/WIRE-NOTES.md`.

## Install

```bash
dotnet add package Verdocs.Sdk
```

Targets net10.0, the current LTS line. No third-party dependencies.

## Layout

- `src/Verdocs.Sdk`: the library. Package id `Verdocs.Sdk`, root namespace `Verdocs`,
  targets net10.0.
- `tests/Verdocs.Sdk.Tests`: xunit v3 tests, plus the live conformance lane.

A targeting note: the library multi-targeted net8.0 and net10.0 up to the 1.0.0 release. Only
the .NET 10 runtime is installed on the build machine, so the net8.0 output compiled but never
ran against a real .NET 8 runtime, and 1.0.0 ships net10.0 only rather than shipping something
untested. Adding a target framework back is additive and breaks no existing consumer, so
net8.0 can return in a patch once there is a .NET 8 runtime in CI to exercise it. See
`docs/standards/csharp.md` rule 2.

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
read from the environment first and then from the hub root `.env`. The fixture cases are
read-only apart from the password grants; the canonical chain test additionally creates one
template and one envelope per run (the envelope ends canceled), per beta etiquette. The
frozen entries in fixtures.json (star toggle, the dead KBA and SharePoint endpoints) are
intentionally not implemented here.

## Quickstart

```csharp
using Verdocs;
using Verdocs.Models;

using var endpoint = new VerdocsEndpoint();

var auth = await endpoint.Auth.AuthenticateAsync(new AuthenticateRequest
{
    Username = "you@example.com",
    Password = "PASSWORD",
});
endpoint.SetToken(auth.AccessToken);

var page = await endpoint.Templates.ListAsync(new GetTemplatesOptions { Rows = 10 });
foreach (var template in page.Templates)
{
    Console.WriteLine($"{template.Id} {template.Name}");
}
```

`VerdocsEndpoint.Default` provides a lazily created shared instance for apps that want one,
and the constructor takes an optional `HttpClient` for IHttpClientFactory users (the endpoint
never mutates or disposes a client it was given). An endpoint carries one session, user or
signing; create a second endpoint when you need both concurrently.

## Coverage

Every js-sdk 6.10.0 public symbol is dispositioned in `sdks/API-PARITY.md`: API stubs port
onto the resource groups, pure-logic helpers onto `Verdocs.Helpers` and `Verdocs.Utils`, and
browser-only pieces are adapted to native equivalents or skipped with a reason. Multipart
uploads (template create, template documents, logos, signatures, field attachments) take
native Stream/byte inputs; binary downloads return `byte[]`; link endpoints return the URL
string the API actually sends. A few endpoints exist as stubs because the deployed API has
no working route behind them (the star toggle, the KBA module, SharePoint create); their doc
comments say so, and they are excluded from conformance. Models are hand-written and treated
as throwaway until type generation lands; unknown wire fields never throw, and each model
carries them in `AdditionalData` so payloads round-trip losslessly.
