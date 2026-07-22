import { DEFAULT_BASE_URL, PRODUCTION_BASE_URL, type CollectionModel } from './model';
import { brunoBaseUrlNote } from './bruno';

// The generated-files notice is identical in both READMEs on purpose: whichever collection
// someone finds first, they get the same instructions for making changes.
const GENERATED_NOTICE = `## These files are generated

Everything in this folder is generated from \`packages/js-sdk/openapi.json\`. Do not edit these files by hand. To make a change, edit the generator in \`packages/collections\` (or the spec inputs in js-sdk) and run:

\`\`\`
pnpm --filter @verdocs/collections generate
\`\`\`

CI runs \`pnpm --filter @verdocs/collections check\` and fails if the committed output no longer matches what the generator produces.
`;

export function postmanReadme(model: CollectionModel): string {
  return `# ${model.title} Postman collection

\`verdocs-api.postman_collection.json\` is a Postman collection (Collection Format v2.1) covering every endpoint in the ${model.title}, grouped into folders by endpoint area.

## Import

In Postman, click Import and select \`verdocs-api.postman_collection.json\` (drag and drop works too).

## Set your token

The collection sends \`Authorization: Bearer {{access_token}}\` on every request via collection-level auth. Open the collection's Variables tab and set:

- \`access_token\`: your bearer token. Obtain one with the requests in the Authentication folder.
- \`base_url\`: defaults to the beta environment at ${DEFAULT_BASE_URL}. Point it at ${PRODUCTION_BASE_URL} for production.

Optional query parameters are listed on each request but disabled; enable the ones you need. Path parameters appear under Path Variables and must be filled in before sending. Request bodies are pre-filled with example JSON derived from the API schemas.

${GENERATED_NOTICE}`;
}

export function brunoReadme(model: CollectionModel): string {
  return `# ${model.title} Bruno collection

This folder is a [Bruno](https://www.usebruno.com/) collection in the .bru file format, covering every endpoint in the ${model.title}. Each endpoint area is a folder, and each request is one .bru file.

## Open

In Bruno, choose Open Collection and select this folder (\`collections/bruno\`).

## Set your token

Select the \`beta\` environment, then edit it and fill in the \`access_token\` secret variable with your bearer token. Obtain one with the requests in the Authentication folder. Bruno stores secret values locally, so your token never lands in these committed files.

Collection-level auth sends \`Authorization: Bearer {{access_token}}\` on every request; each request declares \`auth: inherit\`.

${brunoBaseUrlNote()}

Optional query parameters are present but unchecked. Path parameters live in each request's params and must be filled in before sending. Request bodies are pre-filled with example JSON derived from the API schemas.

${GENERATED_NOTICE}`;
}
