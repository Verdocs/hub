# Verdocs Python Quickstart

Console script with the same flow as the Node quickstart: API key auth, envelope from a PDF, in-person signing link, cancel.

All logic is in [`main.py`](main.py). Depends on `verdocs` only. Environment loading is a few lines of stdlib, so there is no python-dotenv.

For a web-app version of the same pattern, see [`quickstart-python-server`](../quickstart-python-server/README.md).

## Setup

Python 3.10+. On macOS, check `python3 --version` first, because the system Python is often 3.9, which is too old.

```bash
python3 -m venv .venv
.venv/bin/python -m pip install verdocs
cp .env.example .env
```

API key at https://app.verdocs.com -> **Settings -> API Keys** (global admin). Set `VERDOCS_CLIENT_ID` and `VERDOCS_CLIENT_SECRET` in `.env`.

`PDF_PATH` defaults to [`docs/sample-pdfs/blank.pdf`](../../docs/sample-pdfs/blank.pdf).

If `pip install verdocs` is not available yet, install from a clone of this repo:

```bash
.venv/bin/python -m pip install -e ../../sdks/python
```

## Run

```bash
.venv/bin/python main.py
```

Expected output:

```
Organization: Your Company (b221d09d-...)
Envelope: Quickstart Envelope (3c0a7112-...)
In-person signing link: https://verdocs.com/sign/3c0a7112-.../Recipient/...
Canceled: canceled
```

## What happens

Same seven steps as the Node quickstart: load env, `client_credentials` auth, org lookup, direct envelope create, print ID, in-person link, cancel.

Package docs: [`sdks/python/README.md`](../../sdks/python/README.md)
