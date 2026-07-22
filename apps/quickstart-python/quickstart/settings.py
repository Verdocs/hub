"""Django settings for the Verdocs Python SDK quickstart.

Deliberately minimal: this app has no database models and no user auth of its
own (Verdocs handles that), so INSTALLED_APPS and MIDDLEWARE only include what
runserver and the JSON views actually need.
"""

from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "insecure-quickstart-key-do-not-use-in-production")

DEBUG = os.environ.get("DJANGO_DEBUG", "true").lower() == "true"

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

INSTALLED_APPS = [
    "django.contrib.staticfiles",
    "insurance",
]

MIDDLEWARE = [
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "quickstart.urls"

TEMPLATES = []

WSGI_APPLICATION = "quickstart.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

STATIC_URL = "static/"

# Verdocs SDK configuration, read once here so the views stay simple.
VERDOCS_BASE_URL = os.environ.get("VERDOCS_BASE_URL", "https://api.verdocs.com")
# ID of the template create_policy() copies to issue a policy. Its recipient
# role must be named VERDOCS_POLICY_ROLE_NAME below.
VERDOCS_TEMPLATE_ID = os.environ.get("VERDOCS_TEMPLATE_ID", "")
VERDOCS_POLICY_ROLE_NAME = os.environ.get("VERDOCS_POLICY_ROLE_NAME", "Policyholder")
