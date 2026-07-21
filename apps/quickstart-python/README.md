# Verdocs Python SDK Quickstart

A minimal Django app showing the intended integration pattern for the `verdocs` Python SDK: a mock
insurance company that logs an agent in, then issues a policy for the policyholder to sign.

## Setup

From this directory:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install verdocs
.venv/bin/python -m pip install -e . --group dev
```

Copy `.env.example` to `.env` and set `VERDOCS_TEMPLATE_ID` to a template ID from your Verdocs
account. That template needs a recipient role named "Policyholder", or set
`VERDOCS_POLICY_ROLE_NAME` to whatever role it actually has.

## Run it

```bash
set -a; source .env; set +a
.venv/bin/python manage.py runserver
```

## Try it

```bash
# 1. Log the agent in
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "agent@example.com", "password": "secret"}'

# 2. Issue a policy for signature, using the access_token from step 1
curl -X POST http://127.0.0.1:8000/api/policies/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"policy_name": "Auto Policy", "policyholder": {"first_name": "Paige", "last_name": "Turner", "email": "paige.turner@nomail.com"}}'
```

## What to look at

- [insurance/views.py](insurance/views.py): `login()` calls `endpoint.auth.authenticate`, `create_policy()` calls `endpoint.envelopes.create`
- [quickstart/settings.py](quickstart/settings.py): Verdocs config read once from the environment

## Tests

```bash
.venv/bin/python -m pytest
```

Tests stub the Verdocs API with respx and never touch the live network.
