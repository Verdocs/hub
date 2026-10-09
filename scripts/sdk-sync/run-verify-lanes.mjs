// Runs every Python/C# lint/build/test/conformance lane for the sdk-sync pipeline's
// "verify" job and records pass/fail per lane, rather than letting any single
// failing lane stop the job. The pipeline opens its PR either way (flagged when
// something failed here) so a partial port is never silently invisible.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const RESULTS_PATH = path.resolve(process.env.SDK_SYNC_VERIFY_RESULTS_PATH ?? "verify-results.json");

const CONFORMANCE_ENV = {
  VERDOCS_API_BASE: process.env.VERDOCS_API_BASE,
  VERDOCS_TEST_EMAIL: process.env.VERDOCS_TEST_EMAIL,
  VERDOCS_TEST_PASSWORD: process.env.VERDOCS_TEST_PASSWORD,
};

const LANES = [
  { name: "python-lint", command: "pnpm", args: ["--filter", "@verdocs/python-sdk", "run", "lint"] },
  { name: "python-typecheck", command: "pnpm", args: ["--filter", "@verdocs/python-sdk", "run", "typecheck"] },
  { name: "python-test", command: "pnpm", args: ["--filter", "@verdocs/python-sdk", "run", "test"] },
  {
    name: "python-conformance",
    command: "pnpm",
    args: ["--filter", "@verdocs/python-sdk", "run", "conformance"],
    env: CONFORMANCE_ENV,
    skipIfMissingEnv: true,
  },
  { name: "csharp-build", command: "pnpm", args: ["--filter", "@verdocs/csharp-sdk", "run", "build"] },
  { name: "csharp-test", command: "pnpm", args: ["--filter", "@verdocs/csharp-sdk", "run", "test"] },
  {
    name: "csharp-conformance",
    command: "pnpm",
    args: ["--filter", "@verdocs/csharp-sdk", "run", "conformance"],
    env: { ...CONFORMANCE_ENV, VERDOCS_CONFORMANCE: "1" },
    skipIfMissingEnv: true,
  },
];

const hasConformanceEnv = () =>
  Boolean(CONFORMANCE_ENV.VERDOCS_API_BASE && CONFORMANCE_ENV.VERDOCS_TEST_EMAIL && CONFORMANCE_ENV.VERDOCS_TEST_PASSWORD);

const runLane = (lane) => {
  if (lane.skipIfMissingEnv && !hasConformanceEnv()) {
    console.log(`skipping ${lane.name}: no VERDOCS_CONFORMANCE_* secrets configured yet`);
    return { name: lane.name, ok: null, skipped: true };
  }

  console.log(`--- ${lane.name} ---`);
  const result = spawnSync(lane.command, lane.args, {
    stdio: "inherit",
    env: { ...process.env, ...(lane.env ?? {}) },
  });

  return { name: lane.name, ok: result.status === 0, exitCode: result.status };
};

const main = () => {
  const results = LANES.map(runLane);

  fs.writeFileSync(RESULTS_PATH, `${JSON.stringify({ lanes: results }, null, 2)}\n`);

  const failed = results.filter((r) => r.ok === false);
  console.log(
    `verify: ${results.filter((r) => r.ok === true).length}/${results.length} lanes passed` +
      (failed.length > 0 ? `, failed: ${failed.map((r) => r.name).join(", ")}` : ""),
  );
};

main();
