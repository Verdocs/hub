# Workflow

Every step from a feature branch to a published release. Commands run from the `hub` root unless a step says otherwise. Changeset details (fixed groups, file format) are in [.changeset/README.md](../.changeset/README.md), and CI coverage is tracked in [CI.md](CI.md).

One-time setup on a new machine:

- Node 24+ and pnpm. The repo pins pnpm 10.34.4 via `packageManager`.
- .NET 10 SDK.
- `../platform` checked out next to `hub`.
- Python venv: `cd sdks/python && python3 -m venv .venv && .venv/bin/python -m pip install -e . --group dev`
- `gh auth login` and `npm login`.

1. `git checkout main && git pull`
2. `pnpm install`
   1. js-sdk `prepare`: `pnpm run build`
      1. `tsup`
3. `git checkout -b feat/reset-envelopes`
4. `@js-sdk/` is updated by our team, so that it matches our new/updated resources
5. `pnpm lint`
   1. `turbo run lint`: each package's `lint` script
      1. js-sdk: `eslint .`
      2. python: `ruff format --check src tests && ruff check src tests`
6. `pnpm typecheck`
   1. `turbo run typecheck`: each package's `typecheck` script
      1. js-sdk: `tsc --noEmit`
7. `pnpm test`
   1. `turbo run test`: builds each package's dependencies first, then its `test` script
      1. js-sdk: `vitest run`
      2. python: `.venv/bin/python -m pytest`
      3. csharp: `dotnet test tests/Verdocs.Sdk.Tests/Verdocs.Sdk.Tests.csproj --filter FullyQualifiedName!~Conformance`
8. `pnpm build`
   1. `turbo run build`: each package's `build` script
      1. js-sdk: `tsup`
      2. csharp: `dotnet build Verdocs.Sdk.sln`
9. `pnpm changeset:add`
   1. `changeset`: asks which packages changed and whether it's a patch, minor or major, then writes `.changeset/<name>.md`
10. `git add -A && git commit -m "Add envelope reset" && git push -u origin feat/reset-envelopes`
11. `gh pr create`
12. CI runs on the PR
    1. `ci.yml`: `pnpm install --frozen-lockfile`, then `turbo run lint typecheck test build` on changed packages, then `pnpm --filter @verdocs/collections check`
    2. `conformance.yml`: `pnpm --filter @verdocs/conformance run conformance` against the live API
13. Review and merge the PR.
14. `git checkout main && git pull`
15. `pnpm install`
16. `pnpm changeset:status`
    1. `changeset status`: shows which packages will bump, and by how much. If it lists a fixed group you aren't releasing, see "Fixed groups" in [.changeset/README.md](../.changeset/README.md) first.
17. `pnpm changeset:version`
    1. `changeset version`: bumps versions, writes the `CHANGELOG.md` entries, deletes the used `.changeset` files
    2. `node scripts/sync-sdk-versions.mjs`: copies the Python and C# `package.json` versions into `pyproject.toml`, `__init__.py` and `Verdocs.Sdk.csproj`
    3. `pnpm run generate:docs`
       1. `node scripts/clean-sdk-docs.mjs`: deletes the three `sdk-docs.json` files and `unified-sdks.json`
       2. `turbo run generate-sdk-docs --filter=!@verdocs/js-sdk`
          1. python: `./docs/generate-sdk-docs.sh`
             1. `.venv/bin/python docs/generate_sdk_docs.py`: writes `sdks/python/sdk-docs.json`
          2. csharp: `./docs/generate-sdk-docs.sh`
             1. `dotnet build src/Verdocs.Sdk/Verdocs.Sdk.csproj`
             2. `dotnet tool restore`
             3. `docfx metadata docs/docfx.json`
             4. `dotnet run --project docs/GenerateSdkDocs/GenerateSdkDocs.csproj`: writes `sdks/csharp/sdk-docs.json`
       3. `pnpm --filter @verdocs/js-sdk run docs`
          1. `pnpm run generate-openapi`
             1. `typedoc`: writes `docs.json`
             2. `tsx generated/openapi/generate-openapi.ts`: writes `openapi.json`
             3. `pnpm run copy-openapi`: copies `openapi.json` to `../platform/apps/dev-docs/app/`
          2. `pnpm run generate-sdk-docs`
             1. `tsx generated/sdks/generate-sdks.ts`: writes `packages/js-sdk/sdk-docs.json`
          3. `pnpm run unify-sdks`
             1. `tsx generated/sdks/unify-sdks.ts`: writes `unified-sdks.json`
             2. `pnpm run copy-unified-sdk`: copies `unified-sdks.json` to `../platform/apps/dev-docs/app/`

    If this fails after 17.1, fix the problem and run `pnpm generate:docs`. Don't run `pnpm changeset:version` again.
18. `git diff --stat` to check the versions, changelogs and docs.
19. `git checkout -b chore/version-packages && git add -A && git commit -m "chore: version packages" && git push -u origin chore/version-packages`
20. `gh pr create`, wait for CI, merge.
21. `git checkout main && git pull`
22. `pnpm release js-sdk` (dry run)
    1. `node scripts/release.mjs js-sdk`
       1. Checks `gh` and npm logins, that the version and tag aren't already published, and that `CHANGELOG.md` has a `## <version>` section
       2. `pnpm --filter @verdocs/js-sdk build`
          1. `tsup`
       3. `pnpm --filter @verdocs/js-sdk test`
          1. `vitest run`
       4. `pnpm publish --access public --dry-run --no-git-checks`
23. `pnpm release js-sdk --publish`
    1. `node scripts/release.mjs js-sdk --publish`
       1. Same checks as 22, plus you must be on `main` with a clean tree
       2. Build and test, same as 22
       3. `pnpm publish --access public`
       4. `git tag -a "@verdocs/js-sdk@<version>"`, then `git push origin "@verdocs/js-sdk@<version>"`, then `gh release create` using that version's `CHANGELOG.md` section as the notes
       5. `pnpm --filter @verdocs/js-sdk run docs`, same as 17.3.3
24. Repeat 22 and 23 for every other npm package whose version changed in 17: `react-sdk`, `angular-sdk`, `vue-sdk`, `wc-sdk`. Do these after js-sdk, because they depend on it. `conformance` and `storybook` are private and don't get released. None of the four UI SDKs is on npm yet, so their first publish is a team decision, not a routine step.
25. If the Python version changed: `pnpm release python`, then `TWINE_PASSWORD=<pypi token> pnpm release python --publish`. `verdocs` isn't on PyPI yet (see [sdks/python/README.md](../sdks/python/README.md)), so skip this until the PyPI account is ready.
    1. `node scripts/release.mjs python --publish`
       1. `pnpm --filter @verdocs/python-sdk lint`
       2. `pnpm --filter @verdocs/python-sdk test`
       3. `.venv/bin/python -m build`, then `twine check dist/*`, then `twine upload dist/*`
       4. Tag, push the tag, GitHub release
26. If the C# version changed: `pnpm release csharp`, then `NUGET_API_KEY=<key> pnpm release csharp --publish`
    1. `node scripts/release.mjs csharp --publish`
       1. `pnpm --filter @verdocs/csharp-sdk build`
          1. `dotnet build Verdocs.Sdk.sln`
       2. `pnpm --filter @verdocs/csharp-sdk test`
       3. `dotnet pack src/Verdocs.Sdk/Verdocs.Sdk.csproj -c Release -o out`, then `dotnet nuget push`
       4. Tag, push the tag, GitHub release
27. `cd ../platform`, then commit and push `apps/dev-docs/app/openapi.json` and `apps/dev-docs/app/unified-sdks.json`.
