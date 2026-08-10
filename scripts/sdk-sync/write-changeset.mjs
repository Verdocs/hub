// Authors a changeset non-interactively for the sdk-sync pipeline's "changelog" job,
// from the generation agent's sync-summary.json. `changeset add` is interactive and
// has no scriptable equivalent, but the file format it produces is a plain markdown
// file with YAML-ish frontmatter (see .changeset/*.md for hand-written examples), so
// we just write one directly.
import fs from "node:fs";
import path from "node:path";

const SUMMARY_PATH = path.resolve(process.env.SDK_SYNC_SUMMARY_PATH ?? "sync-summary.json");
const CHANGESET_DIR = path.resolve(process.env.SDK_SYNC_CHANGESET_DIR ?? ".changeset");

const readJson = (filePath, fallback) => {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const main = () => {
  const summary = readJson(SUMMARY_PATH, null);
  const headSha = process.env.SDK_SYNC_HEAD_SHA ?? summary?.pushSha ?? "unknown";
  const shortSha = headSha.slice(0, 12);

  if (!summary) {
    console.log("No sync-summary.json found; skipping changeset.");
    return;
  }

  const bumps = Object.entries(summary.changesetBumps ?? {}).filter(
    ([, level]) => level && level !== "none",
  );

  if (bumps.length === 0) {
    console.log("No package needs a version bump per sync-summary.json; skipping changeset.");
    return;
  }

  const frontmatter = bumps.map(([name, level]) => `"${name}": ${level}`).join("\n");
  const body = (summary.summary ?? "Ported js-sdk changes into the other language SDKs.").trim();

  const content = `---\n${frontmatter}\n---\n\n${body}\n`;

  fs.mkdirSync(CHANGESET_DIR, { recursive: true });
  const filePath = path.join(CHANGESET_DIR, `sdk-sync-${shortSha}.md`);
  fs.writeFileSync(filePath, content);

  console.log(`Wrote ${filePath} bumping ${bumps.map(([name, level]) => `${name} (${level})`).join(", ")}`);
};

main();
