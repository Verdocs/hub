// Structural check for the sdk-sync pipeline's "docs-sync" job: for every operation
// the generation agent says it touched, confirm every non-skipped/non-frozen language
// actually produced a merged doc entry (packages/js-sdk/unified-sdks.json) with a
// runnable example. This is deliberately not a second LLM pass: unified-sdks.json is
// already the join-by-sdkOperation output of generate-sdks.ts + unify-sdks.ts, so
// "does every expected language have a variant with an example" is a plain structural
// read, not a judgment call.
import fs from "node:fs";
import path from "node:path";

const SUMMARY_PATH = path.resolve(process.env.SDK_SYNC_SUMMARY_PATH ?? "sync-summary.json");
const UNIFIED_PATH = path.resolve(
  process.env.SDK_SYNC_UNIFIED_PATH ?? "packages/js-sdk/unified-sdks.json",
);
const RESULTS_PATH = path.resolve(
  process.env.SDK_SYNC_DOCS_RESULTS_PATH ?? "docs-parity-results.json",
);

const SKIPPED_DISPOSITIONS = new Set(["skipped", "frozen"]);

const readJson = (filePath, fallback) => {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const checkSymbol = (symbol, operationsById) => {
  const operation = operationsById.get(symbol.sdkOperation);
  const failures = [];

  if (!operation) {
    failures.push(
      `no merged doc entry for sdkOperation "${symbol.sdkOperation}" in unified-sdks.json (did generate-sdk-docs / unify-sdks run for every language?)`,
    );
    return failures;
  }

  const variantsByLanguage = new Map(operation.variants.map((v) => [v.language, v]));

  for (const [language, disposition] of Object.entries(symbol.dispositions ?? {})) {
    if (SKIPPED_DISPOSITIONS.has(disposition)) {
      continue;
    }

    const variant = variantsByLanguage.get(language);
    if (!variant) {
      failures.push(
        `"${symbol.sdkOperation}" is disposition "${disposition}" for ${language} but has no ${language} variant in unified-sdks.json`,
      );
      continue;
    }

    if (!variant.example?.code?.trim()) {
      failures.push(
        `"${symbol.sdkOperation}" (${language}) has no example code block in its generated doc entry`,
      );
    }
  }

  return failures;
};

const main = () => {
  const summary = readJson(SUMMARY_PATH, null);

  if (!summary || !Array.isArray(summary.symbols) || summary.symbols.length === 0) {
    const results = { checked: 0, passed: 0, failed: [] };
    fs.writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`);
    console.log("No symbols in sync-summary.json; nothing to check.");
    return;
  }

  const unified = readJson(UNIFIED_PATH, { operations: [] });
  const operationsById = new Map(unified.operations.map((op) => [op.operationId, op]));

  const failed = [];
  for (const symbol of summary.symbols) {
    const failures = checkSymbol(symbol, operationsById);
    if (failures.length > 0) {
      failed.push({ sdkOperation: symbol.sdkOperation, jsSdkSymbol: symbol.jsSdkSymbol, reasons: failures });
    }
  }

  const results = {
    checked: summary.symbols.length,
    passed: summary.symbols.length - failed.length,
    failed,
  };

  fs.writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`);
  console.log(
    `doc parity: ${results.passed}/${results.checked} operations passed` +
      (failed.length > 0 ? `, ${failed.length} flagged` : ""),
  );
};

main();
