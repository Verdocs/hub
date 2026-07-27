# Wire notes: upload and download endpoints

Resolved wire shapes for every file-upload (multipart) and binary-download endpoint in the js-sdk
public surface, taken from the API handler source, not from doc comments. The js-sdk's doc comments
have drifted in several places; where the two disagree, the handler code below is the authority.

Sources (read 2026-07-13):

- Handlers: platform/apps/api/src (paths below are relative to that root).
- Callers: hub/packages/js-sdk/src (paths prefixed js-sdk/).

All paths are served under the `/v2` prefix, which the API strips before routing (src/index.ts:29-43).
The server parses multipart bodies with multer 2.x, disk storage, one `fileSize` limit per router
file. JSON bodies are capped at 15 MB by body-parser (src/index.ts:48), which is the real ceiling for
base64 `data` documents. Multer text fields always arrive as strings and the zod schemas do not
coerce, so any schema field typed number/boolean/array can only be sent via JSON. Multer reads each
part's declared Content-Type into `file.mimetype`; the server trusts that declaration for its mime
checks, so ports must set part content types correctly.

Auth vocabulary used below (lib/Guards.ts:33-107):

- user: `requireUser`, a user session with a verified email (API-key sessions qualify).
- user or signing: `requireSignerOrSession`, any valid session of either type.
- signing: `requireSigner`, a signing session only.

## Summary

| Endpoint | Encoding | File part(s) | Returns |
| --- | --- | --- | --- |
| POST /v2/templates | multipart or JSON | documents (repeatable) | template (deep, sanitized) |
| POST /v2/template-documents | multipart | file (single), plus template_id text part | template document row |
| GET /v2/template-documents/:document_id | query `type` | none | metadata JSON, raw bytes, or URL string |
| DELETE /v2/template-documents/:document_id | none | none | template (deep) |
| GET /v2/template-documents/page-image/:document_id/:variant/:page | none | none | signed URL string |
| POST /v2/envelopes | JSON only | none (multer registered but ignored) | envelope (deep, sanitized) |
| POST /v2/envelopes/bulk | JSON | none | {created_ids: string[]} |
| GET /v2/envelope-documents/:document_id | query `type`, `combined` | none | metadata JSON, raw bytes, or URL string |
| GET /v2/envelope-documents/page-image/:document_id/:variant/:page | none | none | signed URL string |
| GET /v2/envelopes/zip/:envelope_ids | none | none | raw ZIP bytes (attachment) |
| PATCH /v2/profiles/:id | multipart or JSON | picture | profile row (with organization) |
| POST /v2/profiles/signatures | multipart | signature (single) | signature row |
| POST /v2/profiles/initials | multipart | initial (single) | initial row |
| PATCH /v2/organizations/:id | multipart or JSON | logo, thumbnail | organization row (with groups, entitlements) |
| PATCH /v2/organizations/:orgId/brands/:id | multipart or JSON | logo, thumbnail | brand row |
| PUT /v2/envelopes/:envelope_id/recipients/:role_name/fields/:field_name | multipart (attachment fields) or JSON (all others) | document (single) | envelope field row |

## Template create

POST /v2/templates. Auth: user. Handler: endpoints/Templates.ts:199-217. Multer:
`uploadHandler.array('documents')`, dest tmpdir, fileSize 25 MB per file
(endpoints/Templates.ts:43-45). Body schema: CreateTemplateRequestSchema
(validations/Templates.ts:9-31).

Two encodings work:

1. JSON. Send the schema fields directly. `documents` is an array where each entry needs one of
   `data` (base64 string, raw or data: URI, lib/PDF.ts:946-966), `uri` (server downloads it, no
   auth headers sent), or `file` (unusable via JSON; only the multipart path can populate it).
   Entries may also carry `name` and `mime`. The 15 MB JSON body cap applies, so base64 payloads
   top out around 10-11 MB of raw file data.
2. multipart/form-data. One or more file parts all named `documents`. The handler replaces whatever
   the body said about documents with `req.files` mapped to `{file}` entries
   (endpoints/Templates.ts:204-206). Text parts are parsed by the same zod schema, so only
   string-typed fields survive: `name`, `description`, `visibility`, `sender`. Number fields
   (initial_reminder, followup_reminders, max_reminder_days) and array fields (roles, fields)
   fail validation as multipart text because zod does not coerce. Multer expands bracket notation
   (`roles[0][name]`) into nested objects, but leaf values are still strings, so CreateRoleSchema's
   `sequence`/`order` numbers fail anyway. The rule for ports: multipart carries files plus plain
   string fields only; roles and fields go in a JSON create or in follow-up calls.

Accepted file types: `application/pdf` and
`application/vnd.openxmlformats-officedocument.wordprocessingml.document`. Anything else is a 400
with "unsupported type" (modules/TemplateDocuments.ts:131-159, 162-189). DOCX is converted to PDF
server-side and the original is retained. The check runs against the declared part Content-Type.

Field entries in the request are validated but never created: the creation block is commented out
(modules/Templates.ts:83-94). They only feed the initial `is_sendable` computation and the search
key. Roles ARE created (modules/Templates.ts:79-81). Ports that want fields must create them after
the fact via POST /v2/fields/:template_id (endpoints/Fields.ts:13) and roles can also be added via
POST /v2/roles/:template_id (endpoints/Roles.ts:13). Text tags ({{...}}) inside uploaded documents
create roles and fields automatically when the org's pipeline settings allow
(modules/TemplateDocuments.ts:272-409).

`is_personal` and `is_public` are not in the server schema and zod strips unknown keys, so the
deprecated flags the js-sdk still sends are ignored. `visibility` ('private' | 'shared' | 'public',
default 'private') is the only control. Reminder fields are milliseconds, min 1 day, max 30 days.

Response: the deep template (documents, fields, roles), owner-sanitized, which strips only
`search_key` for owners (modules/Templates.ts:259-263). This matches js-sdk's ITemplate.

js-sdk caller notes (js-sdk/Templates/Templates.ts:181-246): the multipart branch appends `roles`
and `fields` arrays raw into FormData, which serializes to "[object Object]" and draws a 400 from
the server schema, and it never sends `visibility` (not in ALLOWED_CREATE_FIELDS). The JSON branch
sends everything and is correct except that inline fields silently do nothing (see above).

## Template document create

POST /v2/template-documents. Auth: user, and the caller must be able to edit the template.
Handler: endpoints/TemplateDocuments.ts:78-107. Multer: `uploadHandler.single('file')`, fileSize
25 MB (endpoints/TemplateDocuments.ts:11).

Parts:

- `file`: exactly one file part with this name. Required; missing file is a 400 "File is required".
  Extra file parts under other names make multer error out (single() rejects unexpected files).
- `template_id`: text part, must be a UUID (PostTemplateDocumentSchema,
  validations/TemplateDocuments.ts:28-30). All other text parts are ignored.

Same PDF/DOCX mime gate as template create. The document name is taken from the uploaded file's
original filename; there is no name override part (modules/TemplateDocuments.ts:125-160).

Response: the created template document row alone (`result.document`,
endpoints/TemplateDocuments.ts:103-106), not the containing template. Matches js-sdk's
ITemplateDocument type.

The js-sdk caller (js-sdk/Templates/TemplateDocuments.ts:25-45) posts to /v2/template-documents with
exactly these parts and is correct on the wire; only its @api doc tag still claims
POST /v2/templates/:template_id/documents (the known drift, confirmed).

## Template document fetch and links

GET /v2/template-documents/:document_id. Auth: user. Handler:
endpoints/TemplateDocuments.ts:19-76. Behavior switches on the `type` query param
(GetTemplateDocumentSchema, validations/TemplateDocuments.ts:40-42):

- no type: the document metadata. The handler sends `JSON.stringify(templateDocument)` as a string,
  so the Content-Type header is text/html while the body is JSON text. Parse the body as JSON
  regardless of the header.
- type=file: raw bytes, Content-Type set to the document's stored mime. This is the binary
  download; there is no redirect.
- type=download: a signed Cloudfront URL as a bare string body (attachment disposition, 1 hour
  expiry). Not JSON-quoted; read it as text.
- type=preview: same, with inline disposition.

The signed URLs come from integrations/Cloudfront.ts:30-37 and point at the docs CDN with a
response-content-disposition query; clients GET them directly with no auth header.

GET /v2/template-documents/page-image/:document_id/:variant/:page. Handler:
endpoints/TemplateDocuments.ts:139-150. Path params validated by
GetTemplateDocumentPageImageSchema (validations/TemplateDocuments.ts:34-38): variant is
'original' | 'tagged', page is the literal string 'thumb' or a number 0-1000. Returns a signed
Cloudfront preview URL as a bare string. There is currently NO auth guard on this route (the guard
is a TODO comment in the handler), so any caller with the document ID gets a link. 'thumb' is the
supported way to get a thumbnail; the js-sdk getTemplateDocumentThumbnail function targets a route
that does not exist (see drift list).

DELETE /v2/template-documents/:document_id. Auth: user with edit rights. Returns the remaining deep
template, not a status string (endpoints/TemplateDocuments.ts:109-137).

## Envelope create (JSON shape)

POST /v2/envelopes. Auth: user. Handler: endpoints/Envelopes.ts:296-336. The route registers
`uploadHandler.array('documents')` (endpoints/Envelopes.ts:12) but the handler never reads
`req.files`, and createEnvelopeWithoutTemplate rejects any document entry that is not `uri` or
`data` ("Invalid document type", modules/Envelopes.ts:349-359). Envelope creation is therefore
JSON-only on the wire; file-part uploads are silently dropped. This resolves the ambiguity that
stalled the C# seed: do not build a multipart envelope create.

Request schema (CreateEnvelopeRequestSchema, validations/Envelopes.ts:9-41):

- template_id: string, optional. When present the envelope is built from the template and the
  `documents` array is ignored.
- name: string, required when template_id is absent (refine), otherwise defaults to the template
  name.
- description, sender_name, sender_email: optional strings.
- no_contact: boolean, default false.
- expires_at: optional date, must be more than 24 hours out. Only the no-template path stores it
  (modules/Envelopes.ts:315-331); createEnvelopeFromTemplate does not write expires_at.
- environment: '' | 'beta', nullish.
- visibility: 'private' | 'shared', default 'private'.
- initial_reminder / followup_reminders: number in milliseconds, 0 to 30 days, or null. (Template
  create uses min 1 day; envelope create allows 0 to mean off.)
- max_reminder_days: number 1-90, default 14.
- data: any, optional.
- recipients: required array, see below.
- documents: optional array of {data | uri, name?, mime?} entries, required when template_id is
  absent (refine). Same base64/URI semantics as template documents, same 15 MB body cap.
- fields: optional array (CreateEnvelopeFieldSchema, validations/Fields.ts:45-73). Each entry
  needs role_name plus exactly one of name or alias; document_id here is a numeric index and
  drags type/page/x/y along as required when present. In the template path these act as
  prepared-field overrides matched by name (modules/Envelopes.ts:242-276).
- timezone, locale: optional strings.

Recipient entries (CreateRecipientSchema, validations/Recipients.ts:15-43):

- role_name, first_name, last_name: required strings. With a template, every template role must
  have a matching recipient by role_name (modules/Envelopes.ts:167-172).
- email: required KEY (zod.string(), not optional). Phone-only recipients must still send
  `"email": ""`; the refine then requires phone to be set.
- type: 'signer' | 'cc' | 'approver', optional.
- phone, full_name, message, passcode, phone_auth, address, city, state, zip, dob, ssn_last_4:
  optional/nullish strings.
- sequence, order: optional numbers. delegator, name_locked: optional booleans, default false.
- auth_methods: optional array of 'kba' | 'passcode' | 'email' | 'sms' | 'id'. Passcode auth
  requires a 4+ character passcode.
- Refine quirk: a recipient with ALL of address, city, state, zip, and dob populated is rejected
  ("At least one KBA-related field must be left blank").
- Duplicate recipient emails within one envelope are rejected by the handler
  (endpoints/Envelopes.ts:301-304).

Response: the deep envelope (documents, fields, recipients), owner-sanitized. In the template path
each recipient also carries an `in_app_key` access key added post-create
(modules/Envelopes.ts:285-288).

POST /v2/envelopes/bulk (endpoints/Envelopes.ts:258-294) is JSON, requires template_id plus an
`entries` array of {name?, description?, recipients, fields?, data?}, and returns
`{created_ids: string[]}` only.

## Envelope document fetch and links

GET /v2/envelope-documents/:document_id. Auth: user or signing; then the caller's profile must be
in the envelope's org and be the creator or a recipient (global admins bypass the last check).
Handler: endpoints/EnvelopeDocuments.ts:56-141. Query schema allows type
'file' | 'download' | 'preview' | 'base64' plus boolean `combined`
(validations/EnvelopeDocuments.ts:9-12).

- no type: metadata via JSON.stringify, same text/html header caveat as template documents.
- type=file: raw bytes with the document's mime. For attachment-type documents this serves the
  filled variant; for anything else it serves the certificate.
- type=download: signed Cloudfront URL string, attachment disposition, 1 hour. With
  `combined=true` it swaps to the merged all-documents-plus-certificate PDF that shares the
  certificate document's id (endpoints/EnvelopeDocuments.ts:116-127). Older envelopes may lack the
  combined object.
- type=preview: signed URL string, inline disposition.
- type=base64: accepted by the schema but there is no case for it in the handler switch, so it
  falls through to the metadata response. Do not port it.

Signed and certificate variants are generated asynchronously after finalize; callers should poll
the envelope until the certificate document's `signed` flag is true rather than expecting an error
(comment block at endpoints/EnvelopeDocuments.ts:96-100).

GET /v2/envelope-documents/page-image/:document_id/:variant/:page. Auth: user or signing; signing
sessions are additionally blocked until all recipient auth methods are complete
(endpoints/EnvelopeDocuments.ts:14-48). Variant is 'original' | 'filled' | 'certificate', page is
'thumb' or 0-1000 (validations/EnvelopeDocuments.ts:3-7). Returns a signed preview URL string.

GET /v2/envelopes/zip/:envelope_ids. Auth: user or signing; for each comma-separated envelope id
the caller must be the envelope owner or one of its recipients (endpoints/Envelopes.ts:161-256).
Returns the ZIP as raw bytes via res.download: Content-Disposition attachment with a generated
filename, Content-Type application/octet-stream (the temp file has no extension, so Express cannot
infer application/zip). The archive contains filled PDFs, the certificate, the combined PDF when
present, and signer attachments under an attachments/ folder. The js-sdk caller
(js-sdk/Envelopes/Envelopes.ts:360-362) returns the whole axios response rather than r.data, unlike
every other function; ports should just return bytes.

## Envelope field attachment upload

PUT /v2/envelopes/:envelope_id/recipients/:role_name/fields/:field_name. Auth: user or signing,
plus requireValidSigner for the role. Handler: endpoints/Recipients.ts:127-202. Multer:
`uploadHandler.single('document')`, fileSize 25 MB (endpoints/Recipients.ts:11).

The same route serves all field types:

- attachment fields: multipart. One file part named `document`. Any declared mime is accepted; the
  only gate is an antivirus scan that rejects definitively infected files and fails open when the
  scanner is unavailable (modules/Fields.ts:56-105). Removing an attachment is the same PUT with no
  file part.
- signature / initial fields: JSON body {value: "<signature or initial block UUID>"}.
- checkbox, radio, textbox, date, dropdown, textarea: JSON body {value: string}. Checkboxes and
  radios send the STRING "true"/"false"; the server deliberately does not coerce
  (validations/Recipients.ts:86-91).
- timestamp and payment fields reject direct writes.

The body schema requires the `value` key in every request, including multipart ones
(UpdateRecipientFieldSchema: value is zod.string().nullable() with no .optional()). The js-sdk
upload helper appends `value=""` alongside the file and parses fine, but its delete helper sends a
completely empty FormData (js-sdk/Envelopes/Envelopes.ts:277-284), and an empty body fails the
schema. Ports should send a single text part `value=""` with no file part to remove an attachment,
and should verify the removal path against beta before shipping (probe below).

Response: the updated envelope field row. The js-sdk types the upload/delete helpers as
IEnvelopeFieldSettings, but the server returns the full field (endpoints/Recipients.ts:200).

## Profile photo

PATCH /v2/profiles/:id. Auth: user; only the caller's own profile accepts a photo. Handler:
endpoints/Profiles.ts:138-193. Multer: `uploadHandler.any()`, fileSize 10 MB
(endpoints/Profiles.ts:12).

File part name: `picture`. Files under any other name are accepted by multer (any()) but ignored
by the handler. No mime or image validation is performed; the declared mimetype is stored with the
S3 object (lib/S3.ts:165-183). Text parts ride along and are parsed by UserUpdateProfileSchema
(validations/Profiles.ts:41-49), which is strict: only first_name, last_name, phone, picture,
timezone, locale are allowed, all strings, and unknown keys are a 400 rather than ignored.

Response: the updated profile row including its organization. The `picture` value in the response
is a public CDN URL. js-sdk caller: js-sdk/Users/Profiles.ts:148-160 (its @api tag says
"PATCH /v2/templates/:template_id", a copy-paste error; the code is right).

## Signature and initial blocks

POST /v2/profiles/signatures and POST /v2/profiles/initials. Auth: user or signing (guest signer
profiles are auto-created). Handlers: endpoints/Profiles.ts:229-264 and 266-301. Multer:
`single('signature')` and `single('initial')`, 10 MB.

Exactly one file part, named `signature` or `initial` respectively. Missing file is a 400. No mime
or image validation today (TODO comments in the handlers). No other parts are read.

Response: the created signature/initial row {id, profile_id, url, ...}. The `url` value is the S3
object key (users/<profile_id>/signatures/<id>), not a fetchable URL; there is no v2 GET endpoint
for the image. The id is what gets written into signature/initial fields via the field-update PUT.
js-sdk callers match (js-sdk/Envelopes/Signatures.ts:19-26, js-sdk/Envelopes/Initials.ts:19-26).

## Organization logo and thumbnail

PATCH /v2/organizations/:id. Auth: admin of that org. Handler: endpoints/Organizations.ts:238-291.
Multer: `uploadHandler.any()`, 10 MB (endpoints/Organizations.ts:11).

File part names: `logo` (stored to full_logo_url) and `thumbnail` (stored to thumbnail_url). Both
may be sent in one request; other file names are ignored. No mime validation. Text parts are parsed
by UpdateOrganizationSchema (validations/Organizations.ts:29-52), which is strict; every field is a
string except `data` (object) and `deletion_protected` (boolean), so those two can only be updated
via JSON. The body parse happens before file handling, so a bad text part fails the whole request
including the upload.

Response: the updated organization row including groups and entitlements. js-sdk callers send
file-only FormData (js-sdk/Organizations/Organizations.ts:252-293) and match.

## Brand logo and thumbnail

PATCH /v2/organizations/:orgId/brands/:id. Auth: admin of that org. Handler:
endpoints/Brands.ts:78-104. Multer: `uploadHandler.any()`, 10 MB (endpoints/Brands.ts:16).

Same shape as organizations: file parts `logo` and `thumbnail`, no mime validation, text parts
parsed by UpdateBrandSchema first. Response: the updated brand row. js-sdk callers match
(js-sdk/Organizations/Brands.ts:66-107).

## Doc-vs-code drift found (beyond the known template-documents path)

js-sdk functions that target routes that do not exist in the API. Port policy for these symbols
matches `sdks/API-PARITY.md` and `packages/conformance/fixtures.json`: C# and Python carry
code-faithful stubs with doc comments explaining the breakage, and conformance excludes them.
Use the working equivalents below in new code; do not treat the js-sdk wire paths as live.

- getTemplateDocumentFile (js-sdk/Templates/TemplateDocuments.ts:119-122) GETs
  /v2/templates/:templateId/documents/:documentId?file=true. No such route; 404. The working call
  is GET /v2/template-documents/:documentId?type=file, which downloadTemplateDocument in the same
  file already does. Ports stub the js-sdk function for surface parity; use download instead.
- getTemplateDocumentThumbnail (js-sdk/Templates/TemplateDocuments.ts:129-132) GETs the same dead
  route with ?thumbnail=true. The working equivalent is the page-image route with page='thumb'.
  Ports stub the js-sdk function; use getTemplateDocumentPageDisplayUri with page='thumb' instead.
- createTemplateFromSharepoint (js-sdk/Templates/Templates.ts:301-307) POSTs
  /v2/templates/from-sharepoint. No handler anywhere in the API. Ports stub it with a doc comment;
  excluded from conformance.
- The whole js-sdk KBA module (js-sdk/Envelopes/KBA.ts:81-129: /v2/kba/:envelope_id/:role_name,
  /v2/kba/pin, /v2/kba/identity, /v2/kba/response) has no server routes. KBA actually runs through
  POST /v2/sign/verify with auth_method 'kba' (endpoints/Sign.ts:54-297, JSON only). Ports stub the
  module for js-sdk surface parity; real KBA flows through recipient verify_signer. Excluded from
  conformance.
- toggleTemplateStar (js-sdk/Templates/Templates.ts:367-370) POSTs /v2/templates/:id/stars/toggle.
  The server route is GET /templates/:template_id/star (endpoints/Templates.ts:305), and that
  handler parses TemplateOperationSchema out of the GET body, which requires action='duplicate',
  so even the server route rejects a bare GET. Broken on both sides; ports stub it with a doc
  comment and exclude it from conformance. The TS lane can opt in to a curl/SDK equivalence check
  with VERDOCS_STAR_TOGGLE=1 when debugging an API fix.

Wrong-target and wrong-type drift:

- getTemplateDocumentPreviewLink (js-sdk/Templates/TemplateDocuments.ts:109-112) fetches
  /v2/envelope-documents/:id?type=preview for a TEMPLATE document. Correct path is
  /v2/template-documents/:id?type=preview.
- deleteTemplateDocument's doc tag claims a string result; server returns the deep template.
- deleteEnvelopeFieldAttachment sends an empty FormData, which the server schema rejects because
  `value` is required (see field attachment section).
- uploadEnvelopeFieldAttachment/deleteEnvelopeFieldAttachment are typed IEnvelopeFieldSettings;
  the server returns the full envelope field row.
- createTemplate's multipart branch: roles/fields serialize to "[object Object]" (400), visibility
  is never sent, is_personal/is_public are sent but ignored by the server schema.
- createTemplate doc comments describe reminders in seconds; the server validates milliseconds.
- updateProfilePhoto's @api tag points at /v2/templates/:template_id.
- getEnvelopeDocumentPageDisplayUri's @api tag misspells the path (envelope-documnets) and omits
  the 'certificate' variant that both the code and the server support.

Server-side quirks worth knowing (not js-sdk bugs):

- POST /v2/envelopes registers a multer array('documents') middleware that nothing consumes.
- GET /v2/template-documents/page-image/... has no auth guard today.
- POST /v2/templates accepts a `fields` array but creates no field rows from it.
- The metadata responses of GET /v2/template-documents/:id and GET /v2/envelope-documents/:id are
  JSON text sent with a text/html Content-Type.

## Ambiguities and safe beta probes (do not run against production)

1. Attachment removal: the handler treats "no file part" as remove
   (endpoints/Recipients.ts:159-165) but the body schema still demands `value`. Probe: on a beta
   envelope with an attachment field, PUT multipart with only a text part value="" and confirm the
   field clears; then PUT a truly empty multipart body and confirm it 400s. That settles the exact
   shape ports should emit.
2. Multipart template create with text fields: we read the zod behavior as strings-only with
   unknown keys stripped, but bracket-notation expansion through multer's append-field is untested
   here. Probe: POST /v2/templates multipart with name, visibility=shared, and two PDFs under
   `documents`, and confirm the response visibility; do not attempt roles/fields in the form.
3. Oversize behavior: multer's LIMIT_FILE_SIZE surfaces through the generic error middleware and we
   did not trace the resulting status code. Probe with a 26 MB PDF against POST
   /v2/template-documents on beta if the ports need to map that error precisely.
