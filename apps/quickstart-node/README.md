# Verdocs Node Quickstart

Single Node script: authenticate with an API key, create an envelope from a PDF (no template), get an in-person signing link, cancel the envelope. Leaves nothing open on your account when it finishes.

All logic is in [`index.js`](index.js). Depends on `@verdocs/js-sdk` only. Environment variables load through Node's built-in `process.loadEnvFile()` — no dotenv package.

## Setup

```bash
npm install
cp .env.example .env
```

Create an API key at https://app.verdocs.com → **Settings → API Keys**. Enable global admin access. Put the client ID and secret in `.env` as `VERDOCS_CLIENT_ID` and `VERDOCS_CLIENT_SECRET`.

`PDF_PATH` defaults to [`docs/sample-pdfs/blank.pdf`](../../docs/sample-pdfs/blank.pdf). Relative paths resolve from this directory.

## Run

```bash
npm start
```

Expected output:

```
Organization: Your Company (b221d09d-...)
Envelope: Quickstart Envelope (3c0a7112-...)
In-person signing link: https://verdocs.com/sign/3c0a7112-.../Recipient/...
Canceled: canceled
```

## What happens

1. Load `.env`; exit with usage text if anything required is missing.
2. `client_credentials` grant — the API key is the identity; no user login.
3. Print the organization name (one lookup; the token only carries the org ID).
4. Create an envelope from the PDF with one signer and one signature field on page 1. Coordinates are PDF points from the bottom-left.
5. Print the envelope ID (what you would persist in a real integration).
6. Fetch an in-person signing link for handing a device to the signer.
7. Cancel the envelope.

Package docs: [`packages/js-sdk/README.md`](../../packages/js-sdk/README.md)
