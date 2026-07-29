import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const sdkDir = "sdks";

const sdkPackagePaths = fs
  .readdirSync(sdkDir)
  .map((entry) => path.join(sdkDir, entry))
  .filter((entryPath) => fs.existsSync(path.join(entryPath, "package.json")));

const backendPackagePaths = [
  "packages/js-sdk",
  "packages/conformance",
  ...sdkPackagePaths,
];

const frontendPackagePaths = [
  "packages/angular-sdk",
  "packages/react-sdk",
  "packages/vue-sdk",
  "packages/wc-sdk",
];

const pathsByGroup = {
  BACKEND_SDK: backendPackagePaths,
  FRONTEND_SDK: frontendPackagePaths,
};

const readPackageJson = (relativePath) =>
  JSON.parse(
    fs.readFileSync(path.join(relativePath, "package.json"), {
      encoding: "utf8",
    }),
  );

const packageNamesByGroup = Object.fromEntries(
  Object.entries(pathsByGroup).map(([group, packagePaths]) => [
    group,
    new Set(packagePaths.map((p) => readPackageJson(p).name)),
  ]),
);

const versionByGroup = {
  BACKEND_SDK: readPackageJson(pathsByGroup.BACKEND_SDK[0]).version,
  FRONTEND_SDK: readPackageJson(pathsByGroup.FRONTEND_SDK[0]).version,
};

const changesetPath = ".changeset";

const parseChangesetFile = (fileData) => {
  const headerMatch = fileData.match(/^---\s*([\s\S]*?)\s*---/m);
  const headerBlock = headerMatch ? headerMatch[1] : "";
  const body = fileData.replace(/^---[\s\S]*?---\s*/, "").trim();

  const releases = [];
  for (const line of headerBlock.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const colon = trimmed.indexOf(":");
    if (colon === -1) continue;

    const name = trimmed
      .slice(0, colon)
      .trim()
      .replace(/^["']|["']$/g, "");
    const level = trimmed
      .slice(colon + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    releases.push({ name, level });
  }

  return { releases, body };
};

const changesetFiles = fs
  .readdirSync(changesetPath, { encoding: "utf8" })
  .filter((p) => p !== "README.md" && p.endsWith(".md"));

const parsedEntries = changesetFiles.map((file) =>
  parseChangesetFile(
    fs.readFileSync(path.join(changesetPath, file), { encoding: "utf-8" }),
  ),
);

const formatGroupName = (group) =>
  group
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const categoryTitles = {
  major: "### Major Changes",
  minor: "### Minor Changes",
  patch: "### Patch Changes",
};

const levelRank = { major: 3, minor: 2, patch: 1 };

const getEffectiveLevel = (packageName, groupPackageNames) => {
  let effectiveLevel = null;

  for (const { releases } of parsedEntries) {
    for (const release of releases) {
      if (release.name !== packageName || !groupPackageNames.has(packageName)) {
        continue;
      }

      if (
        effectiveLevel === null ||
        levelRank[release.level] > levelRank[effectiveLevel]
      ) {
        effectiveLevel = release.level;
      }
    }
  }

  return effectiveLevel;
};

const formatBullet = (packageNames, body) => {
  const label = packageNames.join(", ");
  const lines = body.split("\n").map((line) => line.trimEnd());

  if (lines.length === 1) {
    return `- ${label}: ${lines[0]}`;
  }

  return [`- ${label}:`, ...lines.map((line) => `  ${line}`)].join("\n");
};

const generateGroupedChangelogs = () => {
  for (const [group, packageNames] of Object.entries(packageNamesByGroup)) {
    const changesByCategory = { major: [], minor: [], patch: [] };

    /**
     * If one of our packages were to receive "minor" in changesetFiles[0], but "major" in changesetFiles[1],
     * we would resolve to THE HIGHEST level of the values (aka "major", in this example). We will still show
     * both body bullet points in the higher section. We do this to match changeset's semver bump functionality.
     */
    const effectiveLevelByPackage = Object.fromEntries(
      [...packageNames].map((packageName) => [
        packageName,
        getEffectiveLevel(packageName, packageNames),
      ]),
    );

    for (const { releases, body } of parsedEntries) {
      const packagesInEntry = [
        ...new Set(
          releases
            .filter((release) => packageNames.has(release.name))
            .map((release) => release.name),
        ),
      ];

      for (const packageName of packagesInEntry) {
        const effectiveLevel = effectiveLevelByPackage[packageName];
        changesByCategory[effectiveLevel].push(
          formatBullet([packageName], body),
        );
      }
    }

    const sections = [];
    for (const level of ["major", "minor", "patch"]) {
      if (changesByCategory[level].length > 0) {
        sections.push(
          categoryTitles[level],
          "",
          ...changesByCategory[level],
          "",
        );
      }
    }

    const content =
      [
        `# Verdocs Changelog - ${formatGroupName(group)}`,
        "",
        `## ${versionByGroup[group]}`,
        "",
        ...sections,
      ]
        .join("\n")
        .trimEnd() + "\n";

    fs.writeFileSync(`CHANGELOG_${group}.md`, content, { encoding: "utf-8" });
  }
};

/** @type {import('@changesets/types').GetReleaseLine} */
const getReleaseLine = async (changeset) => {
  const lines = changeset.summary.split("\n").map((line) => line.trimEnd());
  const [firstLine, ...rest] = lines;

  if (rest.length === 0) {
    return `- ${firstLine}`;
  }

  return [`- ${firstLine}`, ...rest.map((line) => `  ${line}`)].join("\n");
};

/** @type {import('@changesets/types').GetDependencyReleaseLine} */
const getDependencyReleaseLine = async (_changesets, dependenciesUpdated) => {
  if (dependenciesUpdated.length === 0) {
    return "";
  }

  const updated = dependenciesUpdated
    .map((dependency) => `${dependency.name}@${dependency.newVersion}`)
    .join(", ");

  return `- Updated dependencies: ${updated}`;
};

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  generateGroupedChangelogs();
}

export { getReleaseLine, getDependencyReleaseLine };
export default { getReleaseLine, getDependencyReleaseLine };
