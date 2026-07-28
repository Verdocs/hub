import path from "node:path";
import fs from "node:fs";

const sdkPath = path.join("sdks");
const sdkPaths = fs
  .readdirSync(sdkPath)
  .filter((p) => !p.endsWith(".md"))
  .map((p) => `/${sdkPath}/${p}`);

const pathsByGroup = {
  BACKEND_SDK: ["packages/js-sdk", ...sdkPaths],
  FRONTEND_SDK: [
    "packages/angular-sdk",
    "packages/react-sdk",
    "packages/vue-sdk",
    "packages/wc-sdk",
  ],
};

const changesetPath = path.join(".changeset");
const backendPath = path.join(pathsByGroup["BACKEND_SDK"][0]);
const frontendPath = path.join(pathsByGroup["FRONTEND_SDK"][0]);
const changesetFiles = fs
  .readdirSync(changesetPath, { encoding: "utf8" })
  .filter((p) => p !== "README.md" && p.endsWith(".md"));
const backendPackage = JSON.parse(
  fs.readFileSync(`${backendPath}/package.json`, { encoding: "utf8" }),
);
const frontendPackage = JSON.parse(
  fs.readFileSync(`${frontendPath}/package.json`, {
    encoding: "utf8",
  }),
);

const changesByCategory = {
  major: [],
  minor: [],
  patch: [],
};

for (const file of changesetFiles) {
  const fileData = fs.readFileSync(`${changesetPath}/${file}`, {
    encoding: "utf-8",
  });
  console.log("Ze file data: ", fileData);
}

// console.log("Backend thing: ", { backendPath, backendPackage });
// console.log("Frontend thing: ", { frontendPath, frontendPackage });
console.log("Changeset things: ", { changesetPath, changesetFiles });
const groups = Object.keys(pathsByGroup);

for (const group of groups) {
  const normalizedGroupName = group
    .split("_")
    .map((g) => {
      const capital = g[0].toUpperCase();
      const remaining = g.split("").slice(1).join("").toLowerCase();
      return `${capital}${remaining}`;
    })
    .join(" ");

  const version =
    group === "BACKEND_SDK" ? backendPackage.version : frontendPackage.version;

  const majorChanges = !!version
    ? ["### Major Changes", ""].join("\n")
    : undefined;
  const minorChanges = !!version
    ? ["### Minor Changes", ""].join("\n")
    : undefined;
  const patchChanges = !!version
    ? ["### Patch Changes", ""].join("\n")
    : undefined;

  console.log("Patch changes? ", patchChanges);

  const content = [
    `# Verdocs Changelog - ${normalizedGroupName}`,
    "",
    `## ${version}`,
    "",
    majorChanges,
    minorChanges,
    patchChanges,
  ];

  const file = fs.writeFileSync(`CHANGELOG_${group}.md`, content.join("\n"), {
    encoding: "utf-8",
  });
}
