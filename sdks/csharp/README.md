# Verdocs C# SDK

.NET client for the Verdocs REST API. `VerdocsEndpoint` exposes the same resource groups as the JavaScript and Python SDKs.

Install:

```bash
dotnet add package Verdocs.Sdk
```

Targets .NET 10. No third-party dependencies.

API reference: https://developers.verdocs.com

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

## Sessions

One endpoint carries one session. For a user session and a signing session at the same time, create two `VerdocsEndpoint` instances and call `SetToken` on each with the appropriate token.

`VerdocsEndpoint.Default` is a lazily created shared instance if you prefer a singleton. Pass your own `HttpClient` (from `IHttpClientFactory`, for example) via the constructor; the SDK will not dispose a client you provide.

## Layout

Resource properties on `VerdocsEndpoint` mirror the API:

`Templates`, `TemplateDocuments`, `TemplateRoles`, `TemplateFields`, `Envelopes`, `Recipients`, `Signatures`, `Initials`, `Organizations`, `Members`, `Groups`, `Invitations`, `Contacts`, `ApiKeys`, `Brands`, `Webhooks`, `NotificationTemplates`, `Users`, `Profiles`, `Auth`

Models are sealed records with snake_case JSON serialization. Undocumented fields from the server are preserved in `AdditionalData` so round-trips stay lossless.

Pure helpers (permissions, validators, colors, dates, token parsing) live in `Verdocs.Helpers` and `Verdocs.Utils`.

## Errors

API failures throw typed exceptions derived from `VerdocsException`, with status code and response body attached.

## Quick-start

`apps/quickstart-csharp` in the source repo is a console app: API key auth, create envelope from
PDF, signing link, cancel.
