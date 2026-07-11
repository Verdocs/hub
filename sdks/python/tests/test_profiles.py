"""profiles.current: happy path and error path, sync and async."""

from __future__ import annotations

import pytest

from verdocs import AuthenticationError, Profile

PROFILES_URL = "/v2/profiles"


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
