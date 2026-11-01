# AGENTS.md

GraphiQL 5 + React 19 + Vite app that doubles as a Chrome MV3 extension. The browser is the whole runtime: there is no app backend, only a dev mock GraphQL server.

## Commands

- `yarn install` — Yarn 1 (`yarn.lock` v1). CI uses Node 24 and `yarn install --frozen-lockfile`.
- `yarn dev` — Vite frontend only; the seeded endpoint is the public NASA API, not the local mock.
- `yarn dev:server` — standalone Apollo mock at `http://localhost:4000/graphql`.
  - Set `NODE_ENV=development` (e.g. `NODE_ENV=development yarn dev:server`) or the mock emits **no CORS headers** and the browser cannot call it. The bare script does not set it.
  - Add a server in the UI and select it; the mock is not auto-registered.
- `yarn build` — web build into `dist/`.
- `yarn build:extension` — extension build (`BUILD_AS_EXTENSION=true`); also copies `extension/manifest.json` and `extension/background.js`.
- `yarn start` — `vite preview` of the last build.
- No test, lint, or typecheck scripts, and `typescript`/`tsc` is not installed. `tsconfig.json` is `noEmit` and only includes `src`. Verify changes with `yarn build` (plus `yarn build:extension` when touching extension/build logic).

## Build and extension quirks

- `.github/workflows/release.yml` runs on `v*` tags: it overwrites `package.json` `version` from the tag, builds the extension, and zips `dist/`. It does **not** update `extension/manifest.json` — bump that version manually too.
- `vite.config.ts` post-processes `dist/index.html` in `closeBundle`: it removes the first `<script>` in `<head>` and writes its contents to `dist/monaco-workers.js`. The `<script src="/monaco-workers.js">` in `index.html` loads that generated file; `public/monaco-workers.js` serves the same thing in dev. Do not delete or reorder that tag.
- All asset/worker paths are absolute (`/assets/...`, `/monaco-workers.js`, `/monacoeditorwork/...`), so production must be served from the origin root. This is also what makes the `chrome-extension://` root work.
- `index.html` imports `/src/index.jsx`, but the file is `src/index.tsx`; Vite's `.jsx` → `.tsx` fallback handles it. Leave the reference as-is.
- `extension/background.js` is copied verbatim, not bundled: it opens `index.html` and installs `declarativeNetRequest` rules that add CORS headers for the extension origin. Extension permissions (`<all_urls>`, `storage`, `declarativeNetRequest`) are in `extension/manifest.json`.

## Architecture

- Entry: `src/index.tsx` → `src/components/App.tsx`, which mounts GraphiQL with `createFetcher()`, the explorer/history/tab-manager plugins, and custom `Topbar`/`Footer`.
- `src/fetcher.ts` handles every request: picks the selected server via `findCurrentServer()`, merges its custom headers plus a bearer token, POSTs with browser `fetch`, and records status in `STORE_STATUS`. There is no proxy layer.
- `src/auth-token-manager.ts` implements OAuth against Keycloak: `direct` (password grant), `servicea` (client credentials), and `standard` (authorization-code with full-page redirect and `?code=` exchange). Tokens are cached per server in localStorage. The mock server has no auth, so auth changes need a real IdP to test.
- `src/store.ts` is a small external store consumed through `useSyncExternalStore`. Persisted keys are `graphiql-extended:*` (servers, selected server, settings, tab tree); `STORE_STATUS` is memory-only. Create stores at module scope.
- GraphiQL's own tab state lives under `graphiql:tabState`, separate from the app's `graphiql-extended:tabs` tree. Export/import in `src/tools.ts` touches both; keep them in sync.
- `server/graphql-mock-server.ts` is a standalone dev tool, not imported by `src` and not typechecked (outside `tsconfig` include).

## Conventions

- Relative imports use explicit extensions: `./server.ts`, `./components/App.tsx` (enabled by `allowImportingTsExtensions`). Follow this.
- Styling is Bootstrap 5 classes plus colocated `.scss` files; dark theme is set on `<html>` in `index.html`.
- Server headers, OAuth passwords/client secrets, and tokens are stored in localStorage in plaintext, and exported config files include them. Avoid logging or committing these.
