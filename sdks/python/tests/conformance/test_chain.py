"""The canonical create-to-cancel lifecycle from fixtures.json, run live against beta.

fixtures.json declares the seven chain steps; each SDK lane implements them
natively as one ordered test with state flowing forward (the fixtures stay
declarative, there is no cross-language DSL). The wire shapes follow
sdks/WIRE-NOTES.md: the template create is multipart with the file under a
part named "documents", the role rides in a follow-up call because multipart
text parts cannot carry it, and the field rides in a follow-up call because
the create-time fields array is validated but never persisted server-side.
The envelope's sole recipient is the test account itself so no mail leaves
the tenant, and the chain ends with a cancel so nothing stays actionable.
The template and envelope are left behind on purpose: beta etiquette
tolerates a handful of records per run.
"""

from __future__ import annotations

import uuid

import pytest

from verdocs import (
    EnvelopeCreateFromTemplateParams,
    EnvelopeCreateRecipientFromTemplate,
    EnvelopeListParams,
    FieldCreateParams,
    RoleCreateParams,
    TemplateCreateParams,
)

pytestmark = pytest.mark.conformance

_ROLE_NAME = "Recipient 1"
_FIELD_NAME = "recipient-1-signature"


def minimal_pdf() -> bytes:
    """Build one blank US Letter page by hand so the lane needs no PDF library.

    The xref offsets are computed as the objects are appended, which is the
    only fussy part of a hand-rolled PDF; everything else is boilerplate the
    server's pipeline (page count, page sizes, tag scan) accepts.
    """
    stream = b"q Q"
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> /Contents 4 0 R >>",
        f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets: list[int] = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{number} 0 obj\n".encode() + body + b"\nendobj\n"
    xref_at = len(out)
    out += f"xref\n0 {len(objects) + 1}\n".encode()
    out += b"0000000000 65535 f \n"
    for offset in offsets:
        out += f"{offset:010d} 00000 n \n".encode()
    out += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_at}\n%%EOF\n".encode()
    return bytes(out)


def test_canonical_chain(conformance_env, sdk_endpoint, raw_client, normalize, sdk_dump):
    """Template to canceled envelope, asserting each chain step's invariant along the way."""
    name = f"SDK Conformance Chain {uuid.uuid4().hex}"

    # chain-create-template
    template = sdk_endpoint.templates.create(
        TemplateCreateParams(name=name),
        files=[("sdk-conformance-chain.pdf", minimal_pdf(), "application/pdf")],
    )
    uuid.UUID(template.id)  # raises if beta hands back something that is not a real id
    assert template.name == name
    assert template.documents is not None and len(template.documents) == 1
    document = template.documents[0]
    assert document.pages == 1

    # chain-add-role
    role = sdk_endpoint.template_roles.create(template.id, RoleCreateParams(name=_ROLE_NAME, type="signer"))
    assert role.template_id == template.id
    assert role.name == _ROLE_NAME

    # chain-add-field
    field = sdk_endpoint.template_fields.create(
        template.id,
        FieldCreateParams(
            document_id=document.id,
            name=_FIELD_NAME,
            role_name=_ROLE_NAME,
            type="signature",
            page=0,
            x=72,
            y=72,
        ),
    )
    assert field.template_id == template.id
    assert field.document_id == document.id
    assert field.role_name == _ROLE_NAME
    assert field.type == "signature"

    # Re-read the template to prove the role and field actually attached;
    # trusting the create responses alone would miss a write that vanished.
    attached = sdk_endpoint.templates.get(template.id)
    assert [entry.name for entry in attached.roles or []] == [_ROLE_NAME]
    assert [(entry.name, entry.role_name) for entry in attached.fields or []] == [(_FIELD_NAME, _ROLE_NAME)]

    # chain-create-envelope: the email key is required on every recipient, and
    # pointing it at the test account keeps the invite inside the tenant.
    envelope = sdk_endpoint.envelopes.create(
        EnvelopeCreateFromTemplateParams(
            template_id=template.id,
            recipients=[
                EnvelopeCreateRecipientFromTemplate(
                    role_name=_ROLE_NAME,
                    first_name="Conformance",
                    last_name="Chain",
                    email=conformance_env.email,
                )
            ],
        )
    )
    uuid.UUID(envelope.id)
    assert envelope.template_id == template.id
    assert envelope.status == "pending"
    recipients = envelope.recipients or []
    assert [entry.role_name for entry in recipients] == [_ROLE_NAME]
    assert recipients[0].email.lower() == conformance_env.email.lower()

    # chain-get-envelope: the SDK read equals the raw read under the same
    # normalization the fixture cases use.
    raw = raw_client.get(f"/v2/envelopes/{envelope.id}", headers={"Authorization": f"Bearer {sdk_endpoint.token}"})
    assert raw.status_code == 200
    fetched = sdk_endpoint.envelopes.get(envelope.id)
    assert fetched.id == envelope.id
    assert normalize(sdk_dump(fetched)) == normalize(raw.json())

    # chain-list-envelopes: filtering by the chain's own template pins the
    # assertion to the record this run created, so the step stays
    # deterministic no matter how many records the demo account accumulates.
    page = sdk_endpoint.envelopes.list(EnvelopeListParams(template_id=template.id, rows=10, page=0))
    assert envelope.id in [entry.id for entry in page.envelopes]

    # chain-cancel-envelope, then read back to prove the status stuck.
    canceled = sdk_endpoint.envelopes.cancel(envelope.id)
    assert canceled.id == envelope.id
    assert canceled.status == "canceled"
    assert sdk_endpoint.envelopes.get(envelope.id).status == "canceled"

    # The records stay behind on purpose; print the ids so a run log
    # identifies them later.
    print(f"chain template id: {template.id}")
    print(f"chain envelope id: {envelope.id}")
