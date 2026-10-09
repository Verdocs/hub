// Builds the prompt for the sdk-sync generation agent (.github/workflows/sdk-sync.yml,
// "generate" job). Kept as plain code rather than an inline heredoc in the workflow
// so it's easy to read, test, and change without touching YAML.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const JS_SDK_PATHS = [
  "packages/js-sdk/src",
  "packages/js-sdk/generated/sdks",
  "packages/js-sdk/typedoc.json",
  "packages/js-sdk/tsdoc.json",
];

const AUTHORITY_DOCS = [
  {
    path: "sdks/WIRE-NOTES.md",
    note: "wire truth. js-sdk's own doc comments are known to drift from what the API actually does; this file is derived from reading the platform API handlers directly and overrides js-sdk comments whenever they disagree.",
  },
  {
    path: "sdks/PORTING-MAP.md",
    note: "naming, namespace, and file-ownership contract for both languages. Follow the resource/method naming rules exactly.",
  },
  {
    path: "docs/standards/csharp.md",
    note: "binding style and architecture rules for sdks/csharp.",
  },
  {
    path: "docs/standards/python.md",
    note: "binding style and architecture rules for sdks/python.",
  },
  {
    path: "docs/standards/comments.md",
    note: "binding for every comment and doc comment you write in this repo, in every language.",
  },
  {
    path: "packages/conformance/docs/multi-language-ci.md",
    note: "how to extend packages/conformance/fixtures.json and add a dispatch arm per language.",
  },
  {
    path: "sdks/API-PARITY.md",
    note: "current per-symbol disposition (ported/adapted/skipped/frozen) for every js-sdk export, generated from sdks/parity/dispositions.json.",
  },
];

const runGit = (args) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 });

const isNullSha = (sha) => !sha || /^0+$/.test(sha);

const resolveDiff = (baseSha, headSha) => {
  const paths = JS_SDK_PATHS;

  if (!isNullSha(baseSha)) {
    try {
      return runGit(["diff", "--unified=3", baseSha, headSha, "--", ...paths]);
    } catch (error) {
      console.warn(
        `git diff ${baseSha}..${headSha} failed (${error.message}), falling back to HEAD~1`,
      );
    }
  }

  return runGit(["diff", "--unified=3", "HEAD~1", headSha, "--", ...paths]);
};

const buildPrompt = ({ baseSha, headSha, diff }) => {
  const authorityList = AUTHORITY_DOCS.map(
    (doc) => `- \`${doc.path}\` - ${doc.note}`,
  ).join("\n");

  return `You are porting a js-sdk change into the Python and C# SDKs in this monorepo. js-sdk (\`packages/js-sdk\`) is the hand-maintained source of truth; \`sdks/python\` and \`sdks/csharp\` are agent-ported mirrors of it, coordinated by the docs below. You are standing in for the coordinator role described in \`sdks/PORTING-MAP.md\` for this run.

## What changed

Diff of \`${baseSha}..${headSha}\` restricted to js-sdk source, its generated-doc extractor, and its TSDoc/typedoc config:

\`\`\`diff
${diff.trim() || "(no textual diff resolved; read packages/js-sdk/src directly and compare against sdks/python and sdks/csharp to find drift)"}
\`\`\`

## Read first, in this order

${authorityList}

## Your job, in order

1. For every js-sdk symbol added, changed, or removed by this diff: port the equivalent change into \`sdks/python\` and \`sdks/csharp\`, following the namespace/naming map in \`sdks/PORTING-MAP.md\` exactly. A removed or deprecated js-sdk symbol should be removed or deprecated the same way in both languages, not silently left behind.
2. Update \`sdks/parity/dispositions.json\` for every symbol you touched (ported / adapted / skipped / frozen, with the same style of reasoning already in that file), then regenerate \`sdks/API-PARITY.md\` by running \`node sdks/parity/generate.mjs\` from the repo root.
3. For every new or changed operation, add or update a case in \`packages/conformance/fixtures.json\` and add the matching dispatch arm in each language's conformance runner, per \`packages/conformance/docs/multi-language-ci.md\`.
4. Write native doc comments (docstrings in Python, XML doc comments in C#) for everything you touched, carrying the same \`@sdkOperation\`/\`@sdkGroup\`/\`@sdkPage\` semantics as the js-sdk TSDoc and including a runnable example, per \`docs/standards/comments.md\`.
5. Run each language's own lint, build, and test commands yourself (\`pnpm --filter @verdocs/python-sdk run lint build test\`, \`pnpm --filter @verdocs/csharp-sdk run build test\`, adjusting for whichever actually apply) and iterate until they pass. If something can't be made to pass, say so plainly in the summary below rather than leaving it silently broken.
6. Finish by writing \`sync-summary.json\` at the repo root with this exact shape:

\`\`\`json
{
  "pushSha": "${headSha}",
  "symbols": [
    {
      "jsSdkSymbol": "<file>#<exportName>, matching a sdks/parity/dispositions.json key>",
      "sdkOperation": "<the @sdkOperation value for this symbol>",
      "change": "added | modified | removed",
      "dispositions": { "python": "ported | adapted | skipped | frozen", "csharp": "ported | adapted | skipped | frozen" }
    }
  ],
  "changesetBumps": { "@verdocs/python-sdk": "patch | minor | none", "@verdocs/csharp-sdk": "patch | minor | none" },
  "summary": "a few plain sentences, house voice per docs/standards/comments.md, describing what changed and why",
  "blockers": ["anything you could not resolve, described plainly enough that a human reviewer knows exactly what to check"]
}
\`\`\`

Do not invent a different shape for this file; the rest of the pipeline parses it exactly as specified. If nothing needed porting (the diff only touched things like comments or internal types with no cross-language surface), still write the file with empty \`symbols\`/\`blockers\` and say so in \`summary\`.`;
};

const main = () => {
  const baseSha = process.env.SDK_SYNC_BASE_SHA ?? "";
  const headSha = process.env.SDK_SYNC_HEAD_SHA ?? runGit(["rev-parse", "HEAD"]).trim();
  const outputPath = process.env.SDK_SYNC_PROMPT_PATH ?? "sdk-sync-prompt.md";

  const diff = resolveDiff(baseSha, headSha);
  const prompt = buildPrompt({ baseSha: baseSha || "HEAD~1", headSha, diff });

  fs.writeFileSync(path.resolve(outputPath), prompt);
  console.log(`Wrote sdk-sync prompt (${prompt.length} chars) to ${outputPath}`);
};

main();
