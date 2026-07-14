
---

## Agent notes (migrated from the dobby memory repo)

## Overview
Example applications demonstrating PostGuard integration. No release automation; this is a demo/example repo.

## Sub-projects
- `pg-sveltekit/`: modern SvelteKit + `@e4a/pg-js` (high-level SDK), Vite, TypeScript, eslint.
- `pg-node/`: Node.js 22+ CLI using `@e4a/pg-js` from a server runtime. Two modes: `npm run send` (encrypt + upload + notify) and `npm run upload` (silent).
- `pg-dotnet/`: .NET example.
- `pg-manual/`: Webpack 5 + plain JS using `@e4a/pg-wasm` directly (low-level).

## CI / tests
Only a Conventional Commit PR-title check runs in CI; there's no build/test CI and no test suite (example/reference code only). Code snippets in docs.postguard.eu are sourced from this repo, see postguard-docs' CLAUDE.md for the source-link conventions and the consolidation-commit gotcha.

## Known issues / intentional non-fixes
- `pg-manual/webpack.config.js` hardcodes `mode: 'development'` intentionally. This is an example app and does not need a production build; don't refile or propose a fix for the dev-only webpack mode.
- `pg-node`'s `send` npm script passes a `--send` flag, but `index.mjs` only looks for `--upload-only`, so `--send` is silently ignored (known, unfixed).
- Each sub-project has its own `.gitignore` (`pg-manual`'s was added later); the root `.gitignore` only covers `*.sln` and `.DS_Store`. When adding files to a subdir, stage explicit paths rather than `git add -A` if you're not sure a `.gitignore` exists there.

## pg-sveltekit build notes
- vite 8 + `@sveltejs/vite-plugin-svelte` 7 works once `vite-plugin-top-level-await` is dropped entirely: vite 8/rolldown passes top-level await through unchanged for modern browsers (Chrome 89+, Firefox 89+, Safari 15+), which is what `vite-plugin-wasm`'s WASM init relies on. Don't reintroduce `vite-plugin-top-level-await` unless pre-Chrome-89 support becomes a requirement, it still `require()`s rollup, which vite 8 no longer bundles, recreating the coupling that blocked the vite 8 upgrade in the first place.
- `vite.config.ts`'s `build.target` must stay pinned to `esnext`. vite 8/rolldown's default target would otherwise transform top-level await for older browsers, defeating `vite-plugin-wasm`.
- Build verification: `npm install && npm run build && npm run check` should be 0 errors / 0 warnings.
- Dependency override: `overrides.cookie: ^0.7.2`. The chain is `cookie <- @sveltejs/kit <- @sveltejs/adapter-auto`; the repo is already on the latest major of both, but the latest published `@sveltejs/kit` still pins `cookie ^0.6.0` (GHSA-pxg6-pf52-xh8x), so a normal `npm update` doesn't clear the audit. Drop the override once `@sveltejs/kit` ships a release pinning `cookie >= 0.7`. Don't run `npm audit fix --force` here, it tries to downgrade `@sveltejs/kit`. This override is scoped to `pg-sveltekit/` only.
- Staging Cryptify detection: both `pg-dotnet` and `pg-sveltekit` detect "this is staging Cryptify" by checking whether the configured Cryptify URL hostname contains the substring `staging` (case-insensitive), because staging Cryptify doesn't send notification emails and exposes no API/header signal for that. `pg-dotnet/Program.cs` uses `Uri.TryCreate` + `Host.Contains("staging", OrdinalIgnoreCase)`; `pg-sveltekit/src/lib/config.ts` exports `IS_CRYPTIFY_STAGING` the same way. If Cryptify ever exposes a real capability/header for this, swap the heuristic for the real signal, it's a workaround, not a desired pattern. The printed download URL is hardcoded to the production domain even on staging.

## pg-manual build notes
- `web-streams-polyfill` v4 renamed its `PolyfilledWritableStream` export to `WritableStream`. Webpack only warns on the missing v3 export ("export ... was not found"), it doesn't fail the build, so it's easy to ship a broken example silently. When grepping for known-breaking dependency changes, always re-read webpack's build output for "was not found" warnings. Fix: `import { WritableStream as PolyfilledWritableStream } from 'web-streams-polyfill'`.
- `@privacybydesign/yivi-{core,client,popup}` 0.2 to 1.x changed module shape: v0.2 was CJS (`module.exports = class Foo`) and worked under `import * as Foo from '...'` via webpack's CJS interop; v1.0 ships proper ESM with named exports, so `import * as` no longer gives a callable constructor. Switch to `import { YiviCore } from '@privacybydesign/yivi-core'` (same for `YiviClient`/`YiviPopup`); `yivi-css` stays a bare side-effect import. The `yivi.use(...)` plugin contract is unchanged, expect the named-import migration to be the only code change on future yivi majors.
- Bumping `webpack-dev-server` does NOT auto-refresh its already-locked transitive `ws` / `http-proxy-middleware` / `launch-editor` versions, even when the new wds's declared ranges already permit the CVE-fixed versions. After bumping `webpack-dev-server`, run `npm update ws http-proxy-middleware launch-editor` in `pg-manual` to pull the fixed versions in-range, then re-check `npm audit`. No `overrides` entry is needed for these three.
- Dependency override: `overrides.uuid: ^11.1.1`. The chain is `uuid <- sockjs <- webpack-dev-server`; sockjs's latest still pins `uuid ^8.3.2` (GHSA-w5hq-g745-h8pq), so no in-range fix exists. Use 11.1.1, not 12+: uuid 12+ ships ESM-only (`type: module`), while sockjs `require()`s it; 11.1.1 is the newest patched line with a CJS `main`. Remove the override if sockjs ever bumps its uuid pin, or if webpack-dev-server drops sockjs. Scoped to `pg-manual/` only, the other example dirs don't pull uuid.
- Build verification: `npm install && npm run build` must be a clean compile with zero "export ... was not found" warnings.
