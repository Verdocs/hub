# Verdocs C# Quickstart

Console app: API key auth, envelope from a PDF, in-person signing link, cancel. Same flow as the Node and Python console quickstarts.

All logic is in [`Program.cs`](Program.cs). Depends on `Verdocs.Sdk`.

## Setup

```bash
cp .env.example .env
```

API key at https://app.verdocs.com → **Settings → API Keys** (global admin). Set `VERDOCS_CLIENT_ID` and `VERDOCS_CLIENT_SECRET` in `.env`.

`PDF_PATH` defaults to [`docs/sample-pdfs/blank.pdf`](../../docs/sample-pdfs/blank.pdf).

## Run

```bash
dotnet run
```

Expected output:

```
Organization: Your Company (b221d09d-...)
Envelope: Quickstart Envelope (3c0a7112-...)
In-person signing link: https://verdocs.com/sign/3c0a7112-.../Recipient/...
Canceled: canceled
```

## What happens

Load env, `client_credentials` auth, org lookup, direct envelope create, print ID, in-person link, cancel.

Package docs: [`sdks/csharp/README.md`](../../sdks/csharp/README.md)
