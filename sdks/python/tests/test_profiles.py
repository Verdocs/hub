"""Profiles resource: happy paths and error paths, sync and async.

Covers list, current, create (signup), switch, update, update_photo, and
delete.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from verdocs import AuthenticateResponse, AuthenticationError, NotFoundError, Profile
from verdocs.models.users import CreateProfileRequest, UpdateProfileRequest

PROFILES_URL = "/v2/profiles"

SIGNUP = {
    "email": "a@b.com",
    "password": "secret!A1",
    "first_name": "First",
    "last_name": "Last",
    "org_name": "NEW ORG",
}

LOGGED_OUT = {"status": "OK", "message": "Your last profile has been deleted. You are now logged out."}


def test_current_returns_the_current_profile(endpoint, payloads, respx_mock, base_url):
    entries = [
        payloads.profile(id="profile-other", organization_id="org-other", current=False),
        payloads.profile(),
    ]
    respx_mock.get(f"{base_url}{PROFILES_URL}").respond(200, json=entries)

    profile = endpoint.profiles.current()

    assert isinstance(profile, Profile)
    assert profile.id == "profile-1234"
    assert profile.current is True


def test_current_returns_none_when_nothing_is_current(endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{PROFILES_URL}").respond(200, json=[payloads.profile(current=False)])

    assert endpoint.profiles.current() is None


def test_current_unauthenticated_raises(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{PROFILES_URL}").respond(401, json={"error": "unauthorized"})

    with pytest.raises(AuthenticationError):
        endpoint.profiles.current()


async def test_async_current_returns_the_current_profile(async_endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{PROFILES_URL}").respond(200, json=[payloads.profile()])

    profile = await async_endpoint.profiles.current()

    assert isinstance(profile, Profile)
    assert profile.current is True


async def test_async_current_unauthenticated_raises(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{PROFILES_URL}").respond(401, json={"error": "unauthorized"})

    with pytest.raises(AuthenticationError):
        await async_endpoint.profiles.current()


def test_list_returns_every_profile(endpoint, payloads, respx_mock, base_url):
    entries = [
        payloads.profile(),
        payloads.profile(id="profile-other", organization_id="org-other", current=False),
    ]
    respx_mock.get(f"{base_url}{PROFILES_URL}").respond(200, json=entries)

    profiles = endpoint.profiles.list()

    assert [profile.id for profile in profiles] == ["profile-1234", "profile-other"]
    assert all(isinstance(profile, Profile) for profile in profiles)


async def test_async_list_returns_every_profile(async_endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{PROFILES_URL}").respond(200, json=[payloads.profile()])

    profiles = await async_endpoint.profiles.list()

    assert len(profiles) == 1
    assert profiles[0].current is True


def test_create_signup_sends_only_set_fields(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{PROFILES_URL}").respond(200, json=payloads.auth())

    tokens = endpoint.profiles.create(CreateProfileRequest(**SIGNUP))

    assert isinstance(tokens, AuthenticateResponse)
    # phone/timezone/locale were never set, so they stay off the wire.
    assert payloads.request_json(route) == SIGNUP


def test_create_keeps_explicit_none_off_the_wire(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{PROFILES_URL}").respond(200, json=payloads.auth())

    endpoint.profiles.create(CreateProfileRequest(**SIGNUP, phone=None, timezone="America/New_York"))

    # The deployed signup schema is strict and takes optional strings, not
    # nulls, so an explicit None must not be sent.
    assert payloads.request_json(route) == {**SIGNUP, "timezone": "America/New_York"}


async def test_async_create_signup(async_endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{PROFILES_URL}").respond(200, json=payloads.auth())

    tokens = await async_endpoint.profiles.create(CreateProfileRequest(**SIGNUP))

    assert isinstance(tokens, AuthenticateResponse)
    assert payloads.request_json(route)["org_name"] == "NEW ORG"


def test_switch_posts_no_body_and_returns_tokens(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{PROFILES_URL}/profile-other/switch").respond(200, json=payloads.auth())

    tokens = endpoint.profiles.switch("profile-other")

    # The tokens are returned, not applied; the caller calls set_token.
    assert isinstance(tokens, AuthenticateResponse)
    assert route.calls.last.request.content == b""


def test_switch_unknown_profile_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{PROFILES_URL}/nope/switch").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        endpoint.profiles.switch("nope")


async def test_async_switch_returns_tokens(async_endpoint, payloads, respx_mock, base_url):
    respx_mock.post(f"{base_url}{PROFILES_URL}/profile-other/switch").respond(200, json=payloads.auth())

    tokens = await async_endpoint.profiles.switch("profile-other")

    assert isinstance(tokens, AuthenticateResponse)


def test_update_patches_only_set_fields(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{PROFILES_URL}/profile-1234").respond(
        200, json=payloads.profile(first_name="Updated")
    )

    profile = endpoint.profiles.update("profile-1234", UpdateProfileRequest(first_name="Updated"))

    assert isinstance(profile, Profile)
    assert profile.first_name == "Updated"
    assert payloads.request_json(route) == {"first_name": "Updated"}


def test_update_serializes_admin_permissions_and_roles(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{PROFILES_URL}/profile-other").respond(200, json=payloads.profile())

    endpoint.profiles.update(
        "profile-other",
        UpdateProfileRequest(permissions=["envelope:create", "template:member:read"], roles=["member"]),
    )

    assert payloads.request_json(route) == {
        "permissions": ["envelope:create", "template:member:read"],
        "roles": ["member"],
    }


def test_update_rejects_unknown_permission_names():
    # The permission vocabulary is typed, so typos die before the wire.
    with pytest.raises(ValidationError):
        UpdateProfileRequest(permissions=["envelope:launch"])


async def test_async_update_patches_only_set_fields(async_endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{PROFILES_URL}/profile-1234").respond(200, json=payloads.profile())

    await async_endpoint.profiles.update("profile-1234", UpdateProfileRequest(locale="en-US"))

    assert payloads.request_json(route) == {"locale": "en-US"}


def test_update_photo_uploads_bytes_as_the_picture_part(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{PROFILES_URL}/profile-1234").respond(
        200, json=payloads.profile(picture="https://cdn.test/photo.png")
    )

    profile = endpoint.profiles.update_photo("profile-1234", b"\x89PNG fake bytes")

    assert isinstance(profile, Profile)
    assert profile.picture == "https://cdn.test/photo.png"
    request = route.calls.last.request
    assert request.headers["content-type"].startswith("multipart/form-data")
    assert b'name="picture"' in request.content
    assert b"\x89PNG fake bytes" in request.content


def test_update_photo_reads_a_path_and_guesses_the_content_type(endpoint, payloads, respx_mock, base_url, tmp_path):
    route = respx_mock.patch(f"{base_url}{PROFILES_URL}/profile-1234").respond(200, json=payloads.profile())
    photo = tmp_path / "avatar.png"
    photo.write_bytes(b"\x89PNG fake bytes")

    endpoint.profiles.update_photo("profile-1234", str(photo))

    content = route.calls.last.request.content
    # The server stores the declared part content type, so the guessed mime
    # and original filename both matter.
    assert b'filename="avatar.png"' in content
    assert b"Content-Type: image/png" in content
    assert b"\x89PNG fake bytes" in content


def test_update_photo_passes_tuples_through_to_httpx(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{PROFILES_URL}/profile-1234").respond(200, json=payloads.profile())

    endpoint.profiles.update_photo("profile-1234", ("me.jpeg", b"jpeg bytes", "image/jpeg"))

    content = route.calls.last.request.content
    assert b'filename="me.jpeg"' in content
    assert b"Content-Type: image/jpeg" in content


def test_update_photo_error_maps_to_api_error(endpoint, respx_mock, base_url):
    respx_mock.patch(f"{base_url}{PROFILES_URL}/profile-1234").respond(401, json={"error": "unauthorized"})

    with pytest.raises(AuthenticationError):
        endpoint.profiles.update_photo("profile-1234", b"bytes")


async def test_async_update_photo_uploads_bytes(async_endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{PROFILES_URL}/profile-1234").respond(200, json=payloads.profile())

    profile = await async_endpoint.profiles.update_photo("profile-1234", b"\x89PNG fake bytes")

    assert isinstance(profile, Profile)
    assert b'name="picture"' in route.calls.last.request.content


def test_delete_current_profile_returns_next_tokens(endpoint, payloads, respx_mock, base_url):
    respx_mock.delete(f"{base_url}{PROFILES_URL}/profile-1234").respond(200, json=payloads.auth())

    tokens = endpoint.profiles.delete("profile-1234")

    assert isinstance(tokens, AuthenticateResponse)


def test_delete_last_profile_returns_none(endpoint, respx_mock, base_url):
    respx_mock.delete(f"{base_url}{PROFILES_URL}/profile-1234").respond(200, json=LOGGED_OUT)

    # The logged-out status payload maps to None: no session is left.
    assert endpoint.profiles.delete("profile-1234") is None


async def test_async_delete_current_profile_returns_next_tokens(async_endpoint, payloads, respx_mock, base_url):
    respx_mock.delete(f"{base_url}{PROFILES_URL}/profile-1234").respond(200, json=payloads.auth())

    tokens = await async_endpoint.profiles.delete("profile-1234")

    assert isinstance(tokens, AuthenticateResponse)
