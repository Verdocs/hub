---
"@verdocs/js-sdk": minor
---

Removed the axios-retry dependency. The four envelope-document retrieval calls that opted into it now use a small internal helper that retries once on timeout (ECONNABORTED/ETIMEDOUT); everything else is unchanged. This also fixes the broken CJS entry (dist/index.js previously threw at import time under Node's CJS loader due to an axios-retry interop bug) and adds a package exports map (types/import/require) alongside the existing main/module fields. Dual CJS+ESM output is unchanged. Note for consumers doing deep imports of dist paths: the exports map now restricts entry points to the package root.
