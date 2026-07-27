# True-Up Porting Map

The coordination contract for the C#/Python true-up port agents. Scope and policy live in `sdks/API-PARITY.md`, `sdks/WIRE-NOTES.md`, and `packages/conformance/fixtures.json`; this file settles names and file ownership so twelve agents produce one coherent SDK per language. The language standards (`docs/standards/csharp.md`, `python.md`) and `comments.md` remain binding.

## Resource namespace map

One resource group per js-sdk source file that contains API stubs. Python properties are snake_case on both endpoint classes (sync class / Async twin); C# resources live in src/Verdocs.Sdk/Resources/ (namespace Verdocs.Resources) and hang off VerdocsEndpoint as get-only properties.

| js-sdk file | Python namespace | C# resource |
| --- | --- | --- |
| Users/Auth.ts (except getMyUser) | endpoint.auth | endpoint.Auth |
| Users/Auth.ts getMyUser | endpoint.users | endpoint.Users |
| Users/Notifications.ts | endpoint.users (notifications method) | endpoint.Users (GetNotificationsAsync) |
| Users/Profiles.ts | endpoint.profiles | endpoint.Profiles |
| Templates/Templates.ts | endpoint.templates | endpoint.Templates |
| Templates/TemplateDocuments.ts | endpoint.template_documents | endpoint.TemplateDocuments |
| Templates/Roles.ts | endpoint.template_roles | endpoint.TemplateRoles |
| Templates/Fields.ts | endpoint.template_fields | endpoint.TemplateFields |
| Envelopes/Envelopes.ts | endpoint.envelopes | endpoint.Envelopes |
| Envelopes/Recipients.ts | endpoint.recipients | endpoint.Recipients |
| Envelopes/KBA.ts | endpoint.kba | endpoint.Kba |
| Envelopes/Signatures.ts | endpoint.signatures | endpoint.Signatures |
| Envelopes/Initials.ts | endpoint.initials | endpoint.Initials |
| Organizations/Organizations.ts | endpoint.organizations | endpoint.Organizations |
| Organizations/Members.ts | endpoint.members | endpoint.Members |
| Organizations/Groups.ts | endpoint.groups | endpoint.Groups |
| Organizations/Invitations.ts | endpoint.invitations | endpoint.Invitations |
| Organizations/Contacts.ts | endpoint.contacts | endpoint.Contacts |
| Organizations/ApiKeys.ts | endpoint.api_keys | endpoint.ApiKeys |
| Organizations/Brands.ts | endpoint.brands | endpoint.Brands |
| Organizations/Webhooks.ts | endpoint.webhooks | endpoint.Webhooks |
| Organizations/Notifications.ts | endpoint.notification_templates | endpoint.NotificationTemplates |

## Method naming

Drop the object noun the namespace already carries and use CRUD verbs: js-sdk getEnvelopes becomes envelopes.list / Envelopes.ListAsync, createOrganizationMember becomes members.create / Members.CreateAsync, getOrganizationInvitation becomes invitations.get / Invitations.GetAsync. Non-CRUD names keep their verb phrase minus the noun: toggleTemplateStar becomes templates.toggle_star / Templates.ToggleStarAsync, getInPersonLink becomes recipients.get_in_person_link / Recipients.GetInPersonLinkAsync. C# async methods always end Async and take CancellationToken last. When in doubt, mirror what reads naturally at the call site and record the exact mapping in your parity drop.

## Helper (pure logic) mapping

| js-sdk file | Python module | C# static class |
| --- | --- | --- |
| Envelopes/Permissions.ts | verdocs.permissions | Verdocs.Helpers.EnvelopePermissions |
| Templates/Permissions.ts + Templates/Actions.ts | verdocs.permissions | Verdocs.Helpers.TemplatePermissions |
| Sessions/Permissions.ts | verdocs.permissions | Verdocs.Helpers.SessionPermissions |
| Templates/Validators.ts + Envelopes/Fields.ts | verdocs.validators | Verdocs.Helpers.Validators |
| Utils/Colors.ts | verdocs.utils.colors | Verdocs.Utils.Colors |
| Utils/DateTime.ts | verdocs.utils.dates | Verdocs.Utils.Dates |
| Utils/Entitlements.ts | verdocs.utils.entitlements | Verdocs.Utils.Entitlements |
| Utils/Fields.ts | verdocs.utils.fields | Verdocs.Utils.FieldUtils |
| Utils/Files.ts | verdocs.utils.files (adapted; see policy) | Verdocs.Utils.FileUtils (adapted; see policy) |
| Utils/Locales.ts | verdocs.utils.locales | Verdocs.Utils.Locales |
| Utils/Primitives.ts | verdocs.utils.primitives | Verdocs.Utils.Primitives |
| Utils/Strings.ts | verdocs.utils.strings | Verdocs.Utils.Strings |
| Utils/Token.ts | verdocs.utils.token (delegating to _token where it already exists) | Verdocs.Utils.Token (delegating to TokenParser where it already exists) |

Browser-bound pieces (Files.ts blob and DOM helpers, Utils/Fields.ts blobToBase64) adapt to native equivalents (bytes/base64 in Python, byte[]/Stream in C#) or are skipped with a reason in the parity drop. React-only helpers (useCanAccessEnvelope in Envelopes/Permissions.ts) are skipped with reason "React hook".

## Models layout

- Python: src/verdocs/models/ package. base.py (BaseTypes unions as Literal aliases), lists.py (Lists constants), core.py (Models.ts shared wire models), then one file per module for its Types.ts request/response shapes: envelopes.py, templates.py, organizations.py, users.py, sessions.py, utils.py. Wire models use ConfigDict(extra="allow") so undocumented server fields are captured (settled; overrides python.md rule 12's default).
- C#: src/Verdocs.Sdk/Models/, one sealed record per file, SnakeCaseLower policy, [JsonExtensionData] on wire models. js-sdk unions become string properties plus a static Values class where callers need the constants (adapted; C# has no union types and unknown enum values must not break deserialization). Request-side option enums that already exist in the seed stay.
- page_sizes stays loosely typed in both languages until the wire contract settles (weekend finding 4).

## File ownership

Port agents write only their slice's files plus their parity drop (sdks/parity/incoming/<slice>.json). The coordinator owns: endpoint resource wiring (VerdocsEndpoint properties, Python endpoint __init__ assignments), all barrels (models/__init__.py, resources/__init__.py, package __init__.py exports), fixtures.json, API-PARITY.md, dispositions.json, and this file. Agents create their resource/model/helper/test files and list the wiring they need in their report; the coordinator wires and gates after every merge.

Wire truth is js-sdk CODE, never its doc comments; where the code is ambiguous (multipart), sdks/WIRE-NOTES.md is the authority (derived from the platform api handlers). The star toggle ports as a stub with a doc comment that the deployed API returns 400 (retirement pending) and is excluded from conformance.
