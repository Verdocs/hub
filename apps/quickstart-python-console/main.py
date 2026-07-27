"""Console quickstart for the Verdocs Python SDK.

Authenticates as the integration itself, sends a PDF out for signature with no template involved,
grabs an in-person signing link, then cancels so the run leaves nothing live behind.
"""

from __future__ import annotations

import base64
import os
import sys
from pathlib import Path

from verdocs import (
    ClientCredentialsRequest,
    EnvelopeCreateDirectParams,
    EnvelopeCreateDocumentFromData,
    EnvelopeCreateFieldDirect,
    EnvelopeCreateRecipientDirect,
    VerdocsEndpoint,
)

REQUIRED = ("VERDOCS_CLIENT_ID", "VERDOCS_CLIENT_SECRET", "PDF_PATH")

# The role name ties the recipient and the signature field together. It is an arbitrary label, but
# the two have to agree or the field will not belong to anyone.
ROLE_NAME = "Recipient"

HERE = Path(__file__).resolve().parent


def usage(problem: str) -> None:
    print(
        f"""{problem}

Copy .env.example to .env and fill in:

  VERDOCS_CLIENT_ID      client ID of a Verdocs API key
  VERDOCS_CLIENT_SECRET  the matching client secret
  PDF_PATH               path to the PDF you want signed

Create an API key at https://app.verdocs.com under Settings > API Keys.""",
        file=sys.stderr,
    )
    sys.exit(1)


def load_env(path: Path) -> None:
    """Read KEY=VALUE lines without clobbering anything already in the environment."""
    for line in path.read_text().splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, _, value = stripped.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip("'\""))


def main() -> None:
    env_file = HERE / ".env"
    if not env_file.exists():
        usage("No .env file found.")
    load_env(env_file)

    missing = [name for name in REQUIRED if not os.environ.get(name)]
    if missing:
        usage(f"Missing required settings: {', '.join(missing)}.")

    pdf_path = Path(os.environ["PDF_PATH"])
    if not pdf_path.is_absolute():
        pdf_path = HERE / pdf_path
    try:
        pdf_base64 = base64.b64encode(pdf_path.read_bytes()).decode("ascii")
    except OSError:
        usage(f"Could not read the PDF at {pdf_path}.")

    base_url = os.environ.get("VERDOCS_BASE_URL") or "https://api.verdocs.com"
    with VerdocsEndpoint(base_url=base_url) as endpoint:
        # client_credentials authenticates the integration itself, so there is no user to log in and
        # no refresh dance to manage. Access tokens are short lived, so ask for one per run rather
        # than stashing it somewhere.
        tokens = endpoint.auth.authenticate(
            ClientCredentialsRequest(
                client_id=os.environ["VERDOCS_CLIENT_ID"],
                client_secret=os.environ["VERDOCS_CLIENT_SECRET"],
            )
        )
        endpoint.set_token(tokens.access_token)

        # The token tells you which organization you are acting as. It carries the ID but not the
        # name, so the name costs one lookup. If you are creating an envelope anyway, skip this:
        # the create response below carries envelope.organization.
        organization_id = endpoint.session.organization_id
        organization = endpoint.organizations.get(organization_id)
        print(f"Organization: {organization.name} ({organization_id})")

        envelope = endpoint.envelopes.create(
            EnvelopeCreateDirectParams(
                name="Quickstart Envelope",
                recipients=[
                    EnvelopeCreateRecipientDirect(
                        type="signer",
                        role_name=ROLE_NAME,
                        first_name=os.environ.get("SIGNER_FIRST_NAME") or "Test",
                        last_name=os.environ.get("SIGNER_LAST_NAME") or "User",
                        email=os.environ.get("SIGNER_EMAIL") or "test+user@maildrop.cc",
                    )
                ],
                # No template involved, so the PDF rides along as base64 on the create call.
                documents=[
                    EnvelopeCreateDocumentFromData(
                        name="quickstart.pdf",
                        mime="application/pdf",
                        data=pdf_base64,
                    )
                ],
                # document_id is the index into documents above, not a UUID, and page numbering
                # starts at 1. Position is in PDF points from the bottom-left of the page, so a
                # larger y sits higher up. Anything missing type, role_name, name, document_id,
                # page, x, or y is dropped server-side, and you find out via a confusing
                # "Envelope has no fields" error rather than a validation message.
                fields=[
                    EnvelopeCreateFieldDirect(
                        document_id=0,
                        name="recipient-signature",
                        role_name=ROLE_NAME,
                        type="signature",
                        page=1,
                        x=100,
                        y=600,
                        width=200,
                        height=40,
                        required=True,
                    )
                ],
            )
        )

        # Most applications will want to database envelope.id here, alongside whatever record
        # prompted the signature request, so webhooks and status checks later have something to
        # join against.
        print(f"Envelope: {envelope.name} ({envelope.id})")

        # In-person signing hands the device to the signer instead of emailing them. The link is
        # single-use and short lived, so generate it at the moment you are ready to hand over.
        in_person = endpoint.recipients.get_in_person_link(envelope.id, ROLE_NAME)
        print(f"In-person signing link: {in_person.link}")

        # Cancel is terminal. Doing it here keeps the quickstart from leaving live signature
        # requests behind; a real integration would only cancel when the deal falls through.
        canceled = endpoint.envelopes.cancel(envelope.id)
        print(f"Canceled: {canceled.status}")


if __name__ == "__main__":
    main()
