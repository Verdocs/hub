# Verdocs C# SDK Quickstart

A single console app showing the shortest path from "I have a PDF" to "somebody signed it": the
integration authenticates as itself, sends the PDF out for signature with no template involved,
grabs an in-person signing link, then cancels so a test run leaves nothing live behind.

Everything lives in [Program.cs](Program.cs). The only dependency is the `Verdocs.Sdk` package.

## Setup

```bash
cp .env.example .env
```

Get an API key: log in (or register) at https://app.verdocs.com, go to **Settings > API Keys**, and
create a key with global admin access enabled. Creating the key gives you a client ID and secret.
Put those in `.env` as `VERDOCS_CLIENT_ID` and `VERDOCS_CLIENT_SECRET`.

`PDF_PATH` defaults to the blank one-pager bundled at `docs/sample-pdfs/blank.pdf`. Point it at
anything you like; relative paths resolve from this directory.

### Verdocs.Sdk is not on NuGet.org yet

The csproj references `Verdocs.Sdk` the way it will once the package ships, so until then you have
to pack the SDK from this repo into the local feed that [nuget.config](nuget.config) points at:

```bash
dotnet pack ../../sdks/csharp/src/Verdocs.Sdk -o local-packages
```

Delete `nuget.config` once the package is published and the reference resolves from NuGet.org with
no other changes.

## Run it

```bash
dotnet run
```

Expected output, four lines:

```
Organization: Your Company (b221d09d-...)
Envelope: Quickstart Envelope (3c0a7112-...)
In-person signing link: https://verdocs.com/sign/3c0a7112-.../Recipient/...
Canceled: canceled
```

## What it does, in order

1. Loads `.env` and stops with a usage message if anything required is missing.
2. Authenticates with the `client_credentials` grant. No user logs in; the API key *is* the identity.
3. Prints the organization the token belongs to. The token carries the org ID but not its name, so
   the name costs one lookup.
4. Creates an envelope directly from the PDF: one signer and one required signature field on page 1.
   Field coordinates are PDF points from the bottom-left of the page.
5. Prints the envelope ID, which is the thing a real integration would store.
6. Gets an in-person signing link, for handing your device to the signer instead of emailing them.
7. Cancels the envelope, which is terminal.
