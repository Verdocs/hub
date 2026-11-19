---
"@verdocs/js-sdk": minor
"@verdocs/python-sdk": minor
"@verdocs/csharp-sdk": minor
---

- New Clickwrap module for terms people accept with a checkbox: agreements, drafts, publishing, coverage, a person's status, acceptance sessions, headless outcomes, record lookup, and download links for certificates, replays, and evidence packages.
- The four session calls (get the session, report events, accept, decline) take the session token as an argument and send it on that request only, so they never replace the endpoint's own session.
- Python reaches it as `endpoint.clickwrap`, and C# as `endpoint.Clickwrap`.
