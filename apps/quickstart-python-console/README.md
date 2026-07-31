# Verdocs Python SDK Quickstart (console)

A single console script showing the shortest path from "I have a PDF" to "somebody signed it": the
integration authenticates as itself, sends the PDF out for signature with no template involved,
grabs an in-person signing link, then cancels so a test run leaves nothing live behind.

Everything lives in [main.py](main.py). The only dependency is the `verdocs` package; env loading is
a dozen lines of standard library, so there is no python-dotenv to install.

If you want the same flow inside a web app instead of a script, see
[quickstart-python](../quickstart-python), which does it in Django.

## Setup

Needs Python 3.10 or newer. macOS ships an older `python3` by default (3.9, whose bundled pip also
predates the editable-install support this quickstart needs) — check `python3 --version` first and
point the venv at a newer interpreter (e.g. `python3.12`) if it's below 3.10.

```bash
python3 -m venv .venv
.venv/bin/python -m pip install verdocs
cp .env.example .env
```

Get an API key: log in (or register) at https://app.verdocs.com, go to **Settings > API Keys**, and
create a key with global admin access enabled. Creating the key gives you a client ID and secret.
Put those in `.env` as `VERDOCS_CLIENT_ID` and `VERDOCS_CLIENT_SECRET`.

`PDF_PATH` defaults to the blank one-pager bundled at `docs/sample-pdfs/blank.pdf`. Point it at
anything you like; relative paths resolve from this directory.

### verdocs is not on PyPI yet

`pip install verdocs` will not find anything until the package ships. Until then, install the SDK
from this repo instead:

```bash
.venv/bin/python -m pip install -e ../../sdks/python
```

## Run it

```bash
.venv/bin/python main.py
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
