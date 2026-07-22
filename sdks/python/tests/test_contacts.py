"""contacts resource: list/create/update/delete, sync and async.

Resources are constructed directly (Contacts(endpoint)) because endpoint
wiring for the Organizations namespaces belongs to the coordinator.
"""

from __future__ import annotations

import pytest

from verdocs import NotFoundError, Profile
from verdocs.models.organizations import ContactCreateParams, ContactUpdateParams
from verdocs.resources.contacts import AsyncContacts, Contacts

CONTACTS_URL = "/v2/organization-contacts"


def test_list_returns_profiles(endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{CONTACTS_URL}").respond(200, json=[payloads.profile(roles=["contact"])])

    contacts = Contacts(endpoint).list()

    assert len(contacts) == 1
    assert isinstance(contacts[0], Profile)
    assert contacts[0].roles == ["contact"]


def test_create_sends_only_set_fields(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{CONTACTS_URL}").respond(
        200, json=payloads.profile(roles=["contact"], email="c@example.com")
    )

    contact = Contacts(endpoint).create(ContactCreateParams(first_name="Con", last_name="Tact", email="c@example.com"))

    # phone was never set, so it stays off the wire (the schema is strict).
    assert payloads.request_json(route) == {"first_name": "Con", "last_name": "Tact", "email": "c@example.com"}
    assert contact.email == "c@example.com"


def test_update_sends_full_contact_details(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{CONTACTS_URL}/profile-1234").respond(
        200, json=payloads.profile(roles=["contact"], phone="+15550001111")
    )

    contact = Contacts(endpoint).update(
        "profile-1234",
        ContactUpdateParams(first_name="Con", last_name="Tact", email="c@example.com", phone="+15550001111"),
    )

    assert payloads.request_json(route) == {
        "first_name": "Con",
        "last_name": "Tact",
        "email": "c@example.com",
        "phone": "+15550001111",
    }
    assert contact.phone == "+15550001111"


def test_update_missing_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.patch(f"{base_url}{CONTACTS_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        Contacts(endpoint).update("nope", ContactUpdateParams(first_name="A", last_name="B", email="a@b.com"))


def test_delete_returns_none(endpoint, respx_mock, base_url):
    route = respx_mock.delete(f"{base_url}{CONTACTS_URL}/profile-1234").respond(200, json={"status": "OK"})

    assert Contacts(endpoint).delete("profile-1234") is None
    assert route.called


async def test_async_list_returns_profiles(async_endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{CONTACTS_URL}").respond(200, json=[payloads.profile(roles=["contact"])])

    contacts = await AsyncContacts(async_endpoint).list()

    assert contacts[0].roles == ["contact"]


async def test_async_create_update_delete_round_trip(async_endpoint, payloads, respx_mock, base_url):
    create_route = respx_mock.post(f"{base_url}{CONTACTS_URL}").respond(200, json=payloads.profile(roles=["contact"]))
    update_route = respx_mock.patch(f"{base_url}{CONTACTS_URL}/profile-1234").respond(
        200, json=payloads.profile(roles=["contact"], first_name="New")
    )
    delete_route = respx_mock.delete(f"{base_url}{CONTACTS_URL}/profile-1234").respond(200, json={"status": "OK"})

    contacts = AsyncContacts(async_endpoint)
    created = await contacts.create(ContactCreateParams(first_name="Con", last_name="Tact", email="c@example.com"))
    updated = await contacts.update(
        "profile-1234", ContactUpdateParams(first_name="New", last_name="Tact", email="c@example.com")
    )
    deleted = await contacts.delete("profile-1234")

    assert payloads.request_json(create_route) == {"first_name": "Con", "last_name": "Tact", "email": "c@example.com"}
    assert payloads.request_json(update_route) == {"first_name": "New", "last_name": "Tact", "email": "c@example.com"}
    assert isinstance(created, Profile)
    assert updated.first_name == "New"
    assert deleted is None
    assert delete_route.called
