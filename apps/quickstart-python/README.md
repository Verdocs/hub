# Verdocs Python SDK Quickstart

A minimal Django app showing the intended integration pattern for the `verdocs` Python SDK: a mock
insurance company that authenticates as itself, then issues a policy (the bundled
[assets/i-9.pdf](assets/i-9.pdf), attached directly with no template) for the policyholder to sign.

## Setup

From this directory:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install verdocs
.venv/bin/python -m pip install -e . --group dev
```

Get an API key: log in (or register) at https://app.verdocs.com, go to **Settings > API Keys**,
and create a key with global admin access enabled. Creating the key generates a client ID and
client secret.

Copy `.env.example` to `.env` and set `VERDOCS_CLIENT_ID` / `VERDOCS_CLIENT_SECRET` to the client
ID and secret from that API key.

## Run it

```bash
set -a; source .env; set +a
.venv/bin/python manage.py runserver
```

## Try it

```bash
# 1. Authenticate the integration
curl -X POST http://127.0.0.1:8000/api/auth/login/

# 2. Issue a policy for signature, using the access_token from step 1
curl -X POST http://127.0.0.1:8000/api/policies/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"policy_name": "Auto Policy", "policyholder": {"first_name": "Paige", "last_name": "Turner", "email": "paige.turner@nomail.com"}}'
```

## What to look at

- [insurance/views.py](insurance/views.py): `login()` calls `endpoint.auth.authenticate`, `create_policy()` calls `endpoint.envelopes.create` with `EnvelopeCreateDirectParams`, attaching [assets/i-9.pdf](assets/i-9.pdf) as base64 document data (no template)
- [quickstart/settings.py](quickstart/settings.py): Verdocs config read once from the environment

## Tests

```bash
.venv/bin/python -m pytest
```

Tests stub the Verdocs API with respx and never touch the live network.
