# Verdocs Django Quickstart

Small Django app showing server-side use of the Python SDK: a mock insurer authenticates with an API key, then issues a policy (PDF attached directly, no template) for the policyholder to sign.

## Setup

Python 3.10+. Check `python3 --version` on macOS before creating the venv.

```bash
python3 -m venv .venv
.venv/bin/python -m pip install verdocs
.venv/bin/python -m pip install -e . --group dev
```

If `pip install verdocs` is not available yet:

```bash
.venv/bin/python -m pip install -e ../../sdks/python
```

API key at https://app.verdocs.com -> **Settings -> API Keys** (global admin). Copy `.env.example` to `.env` and set `VERDOCS_CLIENT_ID` / `VERDOCS_CLIENT_SECRET`.

## Run

```bash
set -a; source .env; set +a
.venv/bin/python manage.py runserver
```

## Try the API

```bash
# Authenticate the integration
curl -X POST http://127.0.0.1:8000/api/auth/login/

# Issue a policy (use the access_token from step 1)
curl -X POST http://127.0.0.1:8000/api/policies/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"policy_name": "Auto Policy", "policyholder": {"first_name": "Paige", "last_name": "Turner", "email": "paige.turner@nomail.com"}}'
```

## Files worth reading

| File | What it does |
| --- | --- |
| [`insurance/views.py`](insurance/views.py) | `login()` via `endpoint.auth.authenticate`; `create_policy()` via `endpoint.envelopes.create` with base64 PDF from [`assets/i-9.pdf`](assets/i-9.pdf) |
| [`quickstart/settings.py`](quickstart/settings.py) | Verdocs config from environment |

Package docs: [`sdks/python/README.md`](../../sdks/python/README.md)
