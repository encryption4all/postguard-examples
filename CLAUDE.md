# CLAUDE.md

## Agent notes (migrated from the dobby memory repo)

## Overview
Example applications demonstrating PostGuard integration. No release automation; this is a demo/example repo.

## Sub-projects
- `pg-sveltekit/`: modern SvelteKit + `@e4a/pg-js` (high-level SDK), Vite, TypeScript, eslint.
- `pg-node/`: Node.js 22+ CLI using `@e4a/pg-js` from a server runtime. Two modes: `npm run send` (encrypt + upload + notify) and `npm run upload` (silent).
- `pg-dotnet/`: .NET example.
- `pg-manual/`: Webpack 5 + plain JS using `@e4a/pg-wasm` directly (low-level).

## CI / tests
There is no test suite (example/reference code only). Code snippets in docs.postguard.eu are sourced from this repo, see postguard-docs' CLAUDE.md for the source-link conventions and the consolidation-commit gotcha.

`.github/workflows/pr-title.yml` lints the PR title against Conventional Commits.

The `dobby-coder` GitHub App has no `workflows` permission, so any push touching `.github/workflows/` is rejected by the remote with "refusing to allow a GitHub App to create or update workflow". Agents must deliver workflow changes here as a patch for a human to apply.

Pending, remove this paragraph once it lands: two build workflows are written but not committed, for that reason. `ci.yml` is a PR gate that builds every sub-project from its lockfile; `sdk-canary.yml` is a weekly build against the latest published SDKs that opens an issue on failure. The YAML is in a comment on [#66](https://github.com/encryption4all/postguard-examples/pull/66).

Every sub-project builds reproducibly from a committed lockfile:

| Sub-project | Install from lockfile | Then |
| --- | --- | --- |
| `pg-manual` | `npm ci` | `npm run build && npm run check` |
| `pg-node` | `npm ci` | `npm run check` |
| `pg-sveltekit` | `npm ci` | `npm run build && npm run check && npm run lint` |
| `pg-dotnet` | `dotnet restore --locked-mode` | `dotnet build --no-restore` |

- `pg-node` has no bundler, so `npm run check` is its build equivalent: a `node --check` syntax pass over `index.mjs`, plus an ESM import of `src/encryption.mjs`. The import is the part that matters: it resolves `src/`'s named imports against the installed `@e4a/pg-js`, so a renamed or removed SDK export fails the check. Two things it does not cover. `index.mjs`'s own imports are never linked, because importing `index.mjs` would run the CLI, so renaming an export in `src/config.mjs` still passes the check and only fails at `node index.mjs`. And it says nothing about signature changes behind an unchanged export name.
- `pg-manual`'s `npm run check` is a second, tiny webpack build (`check/webpack.config.js`) run with `--fail-on-warnings`. It exists because the examples reach `@e4a/pg-wasm` through a dynamic `import()` and destructure at runtime, which webpack does not analyse: drop `seal` from the SDK and `npm run build` still compiles successfully with zero warnings. `--fail-on-warnings` on the real build does not close that, it only sees static imports. `check/sdk-exports.js` imports the same names statically so the analysis applies. Add a name there whenever an example destructures a new one.
- `pg-dotnet` restores with a lockfile (`packages.lock.json`, enabled by `RestorePackagesWithLockFile`). After changing any `PackageReference`, run `dotnet restore` and commit the regenerated `packages.lock.json` in the same commit, otherwise `--locked-mode` fails with `NU1004: the package reference ... has changed`.

## Known issues / intentional non-fixes
- `pg-manual/webpack.config.js` hardcodes `mode: 'development'` intentionally. This is an example app and does not need a production build; don't refile or propose a fix for the dev-only webpack mode.
- `pg-node`'s `send` (and `start`) npm script passes no flag, so `index.mjs` defaults to send-email mode; only `upload` passes `--upload-only`. There is no `--send` flag.
- Each sub-project has its own `.gitignore` (`pg-manual`'s was added later); the root `.gitignore` only covers `*.sln` and `.DS_Store`. When adding files to a subdir, stage explicit paths rather than `git add -A` if you're not sure a `.gitignore` exists there.

## pg-sveltekit build notes
- vite 8 + `@sveltejs/vite-plugin-svelte` 7 works once `vite-plugin-top-level-await` is dropped entirely: vite 8/rolldown passes top-level await through unchanged for modern browsers (Chrome 89+, Firefox 89+, Safari 15+), which is what `vite-plugin-wasm`'s WASM init relies on. Don't reintroduce `vite-plugin-top-level-await` unless pre-Chrome-89 support becomes a requirement, it still `require()`s rollup, which vite 8 no longer bundles, recreating the coupling that blocked the vite 8 upgrade in the first place.
- `vite.config.ts`'s `build.target` must stay pinned to `esnext`. vite 8/rolldown's default target would otherwise transform top-level await for older browsers, defeating `vite-plugin-wasm`.
- Build verification: `npm install && npm run build && npm run check` should be 0 errors / 0 warnings.
- Dependency override: `overrides.cookie: ^0.7.2`. The chain is `cookie <- @sveltejs/kit <- @sveltejs/adapter-auto`; the repo is already on the latest major of both, but the latest published `@sveltejs/kit` still pins `cookie ^0.6.0` (GHSA-pxg6-pf52-xh8x), so a normal `npm update` doesn't clear the audit. Drop the override once `@sveltejs/kit` ships a release pinning `cookie >= 0.7`. Don't run `npm audit fix --force` here, it tries to downgrade `@sveltejs/kit`. This override is scoped to `pg-sveltekit/` only.
- Staging Cryptify detection: both `pg-dotnet` and `pg-sveltekit` detect "this is staging Cryptify" by checking whether the configured Cryptify URL hostname contains the substring `staging` (case-insensitive), because staging Cryptify doesn't send notification emails and exposes no API/header signal for that. `pg-dotnet/Program.cs` uses `Uri.TryCreate` + `Host.Contains("staging", OrdinalIgnoreCase)`; `pg-sveltekit/src/lib/config.ts` exports `IS_CRYPTIFY_STAGING` the same way. If Cryptify ever exposes a real capability/header for this, swap the heuristic for the real signal, it's a workaround, not a desired pattern. The printed download URL follows the same heuristic (`staging.postguard.eu` on staging, `postguard.eu` otherwise), because files uploaded to staging Cryptify are only retrievable via the staging website; override it with `PG_DOWNLOAD_URL` (`pg-dotnet`) or `PUBLIC_DOWNLOAD_URL` (`pg-sveltekit`) if your deployment differs.

## pg-manual build notes
- `web-streams-polyfill` v4 renamed its `PolyfilledWritableStream` export to `WritableStream`. Webpack only warns on the missing v3 export ("export ... was not found"), it doesn't fail the build, so it's easy to ship a broken example silently. When grepping for known-breaking dependency changes, always re-read webpack's build output for "was not found" warnings. Fix: `import { WritableStream as PolyfilledWritableStream } from 'web-streams-polyfill'`.
- `@privacybydesign/yivi-{core,client,popup}` 0.2 to 1.x changed module shape: v0.2 was CJS (`module.exports = class Foo`) and worked under `import * as Foo from '...'` via webpack's CJS interop; v1.0 ships proper ESM with named exports, so `import * as` no longer gives a callable constructor. Switch to `import { YiviCore } from '@privacybydesign/yivi-core'` (same for `YiviClient`/`YiviPopup`); `yivi-css` stays a bare side-effect import. The `yivi.use(...)` plugin contract is unchanged, expect the named-import migration to be the only code change on future yivi majors.
- Bumping `webpack-dev-server` does NOT auto-refresh its already-locked transitive `ws` / `http-proxy-middleware` / `launch-editor` versions, even when the new wds's declared ranges already permit the CVE-fixed versions. After bumping `webpack-dev-server`, run `npm update ws http-proxy-middleware launch-editor` in `pg-manual` to pull the fixed versions in-range, then re-check `npm audit`. No `overrides` entry is needed for these three.
- Dependency override: `overrides.uuid: ^11.1.1`. The chain is `uuid <- sockjs <- webpack-dev-server`; sockjs's latest still pins `uuid ^8.3.2` (GHSA-w5hq-g745-h8pq), so no in-range fix exists. Use 11.1.1, not 12+: uuid 12+ ships ESM-only (`type: module`), while sockjs `require()`s it; 11.1.1 is the newest patched line with a CJS `main`. Remove the override if sockjs ever bumps its uuid pin, or if webpack-dev-server drops sockjs. Scoped to `pg-manual/` only, the other example dirs don't pull uuid.
- Build verification: `npm install && npm run build && npm run check` must be a clean compile with zero "export ... was not found" warnings.
