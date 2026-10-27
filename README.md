# Waypoint

A Chrome extension (Manifest V3) that replaces the new tab page with a workspace for developers: bookmarks, open pull requests, tickets, calendar, snippets, tab sessions and small dev tools in one keyboard-driven page.

It is built with React, TypeScript and Vite, and runs entirely in the browser. There is no backend: data lives in `chrome.storage`, and integrations call each service's API directly with tokens the user provides.

## Features

**Workspace**

- Overview dashboard with a configurable widget layout (open PRs, CI status, Jira/Linear issues, calendar, Slack, Notion, stand-up digest).
- Bookmarks backed by real Chrome bookmarks, with categories, tags, favorites, drag-and-drop ordering and environment labels (local/stage/production) that warn before opening production links.
- Workspace modes (Frontend, Backend, DevOps, Deep Work and others) that filter which categories and environments are shown. Custom modes are supported.

**Connectors**

- GitHub (personal access token): repositories, pull requests awaiting review, CI status, branch and PR templates. A background alarm polls for new review requests and shows a notification.
- Linear, Jira, Slack and Notion (API tokens).
- Google Calendar through `chrome.identity` OAuth (read-only scope).

**Tools**

- Command palette (`Cmd/Ctrl+K`) with fuzzy search (Fuse.js) over bookmarks, commands and snippets. It also opens as an overlay on any web page through a content script.
- Snippets with variables, saved tab sessions, duplicate-tab detection and bulk tab actions, focus timer, daily priorities and an activity log.
- API client (requests, environments with `{{variable}}` interpolation, history), sent through the service worker to avoid page CORS.
- Toolbox of offline utilities: JSON formatter, JWT decoder, Base64, URL encoding, hashing, UUIDs, timestamps, cron explainer, case converter, colour contrast and text diff.
- Radar: status of common developer services (Statuspage APIs) and latest versions of watched npm/PyPI packages.
- Saved SSH hosts and database connections with copyable commands.

## Stack

| Area          | Choice                                                                               |
| ------------- | ------------------------------------------------------------------------------------ |
| UI            | React 18, TypeScript (strict), Tailwind CSS, Framer Motion, Lucide icons             |
| State         | Zustand, one store per feature domain                                                |
| Drag and drop | dnd-kit                                                                              |
| Search        | Fuse.js                                                                              |
| Build         | Vite 6 with multiple entry points (new tab, palette, service worker, content script) |
| Monitoring    | Sentry (errors), PostHog (product analytics, session replay). Both are optional.     |
| Testing       | Vitest (unit), Playwright (end-to-end against the built extension)                   |
| Tooling       | ESLint, Prettier, Husky and lint-staged, GitHub Actions                              |

## Architecture

```
src/
  main.tsx, App.tsx      New tab entry: boots storage, stores and section routing
  palette.tsx            Command palette entry, loaded in an iframe by content.ts
  background.ts          Service worker: GitHub polling, notifications, fetch proxy
  content.ts             Injects the palette overlay on Cmd/Ctrl+K
  features/<name>/       One folder per feature (components plus a barrel index.ts)
  store/                 Zustand stores; each loads from and persists to storage
  services/              Storage wrapper and API clients (GitHub, Jira, Linear, ...)
  components/ui/         Small shared primitives (Button, Modal, Badge, ...)
  lib/                   Sentry and PostHog setup
```

Notes on the parts that are not obvious from the folder names:

- **Storage** (`src/services/storage.ts`) routes each key to `chrome.storage.sync` or `chrome.storage.local`. Small user configuration (settings, layouts, templates, snippets) syncs across the user's Chrome profiles; tokens, caches and large data stay local. Sync writes that exceed Chrome's quota fall back to local. Outside the extension (the Vite dev server) it falls back to `localStorage`.
- **Network calls** that would fail CORS from the new tab page go through the service worker (`FETCH` and `API_FETCH` messages). The worker only accepts these messages from the extension's own pages.
- **Integrations** are client-side only. Tokens are stored in `chrome.storage.local` on the user's device and are never synced.

## Getting started

Requirements: Node.js 22 and npm, Google Chrome.

```bash
npm ci
cp .env.example .env    # optional, see below
npm run build
```

Then open `chrome://extensions`, enable Developer mode, choose **Load unpacked** and select the `dist/` folder. Open a new tab.

`npm run dev` serves the UI at a local URL for fast iteration. Chrome-only APIs (tabs, bookmarks, identity) are unavailable there, and storage uses `localStorage`.

### Environment variables

All are optional. When a value is empty, that integration is disabled.

| Name                | Purpose                                        |
| ------------------- | ---------------------------------------------- |
| `VITE_SENTRY_DSN`   | Sentry error reporting                         |
| `VITE_POSTHOG_KEY`  | PostHog analytics and session replay           |
| `VITE_POSTHOG_HOST` | PostHog ingest host (defaults to the US cloud) |

These are read at build time and end up in the bundle, as is normal for client-side keys. Do not put server secrets here.

The Google OAuth client ID is set in `public/manifest.json` (`oauth2.client_id`). To use Google Calendar from your own build, create a Chrome extension OAuth client in Google Cloud for your extension ID and replace it.

## Scripts

| Command                           | What it does                                     |
| --------------------------------- | ------------------------------------------------ |
| `npm run dev`                     | Vite dev server                                  |
| `npm run build`                   | Typecheck, then build the extension into `dist/` |
| `npm run lint`                    | ESLint                                           |
| `npm run typecheck`               | `tsc -b`                                         |
| `npm run format` / `format:check` | Prettier on `src/` and `e2e/`                    |
| `npm test`                        | Vitest unit tests                                |
| `npm run test:e2e`                | Playwright tests (run `npm run build` first)     |

## Testing

- **Unit tests** (`src/**/*.test.ts`) cover the storage layer (sync/local routing, quota fallback, cloud sync toggling), the environments-to-bookmarks migration, the API client and the Radar pollers. They run in Node with a small in-memory fake of `chrome.storage`.
- **End-to-end tests** (`e2e/`) load the built extension into Chromium with Playwright and mock every external API. Tests are tagged `@P0`/`@P1` by priority (`npm run test:e2e:p0`).

CI (`.github/workflows/ci.yml`) runs lint, format check, typecheck, unit tests and the build on every push and pull request. The Playwright suite runs in a separate workflow.

## Permissions and data

| Permission                  | Used for                                            |
| --------------------------- | --------------------------------------------------- |
| `storage`                   | All user data                                       |
| `tabs`, `tabGroups`         | Tab manager, sessions, duplicate detection          |
| `bookmarks`                 | Bookmarks panel (reads and writes Chrome bookmarks) |
| `identity`                  | Google sign-in for Calendar                         |
| `alarms`, `notifications`   | Background polling for GitHub review requests       |
| `contextMenus`              | Context menu entries                                |
| Content script on all sites | The `Cmd/Ctrl+K` palette overlay                    |

Data leaves the device only in these cases: requests to the services you connect, Chrome sync for the synced keys (if you are signed in to Chrome and cloud sync is on), and Sentry/PostHog when they are configured at build time. Session replay masks all form inputs.

## Status and limitations

This is a working personal project, not a published Chrome Web Store listing.

- **Pro plan is a stub.** The upgrade flow and Lemon Squeezy checkout links are placeholders, and license activation only checks a key prefix locally. There is no real payment or license validation.
- **Content script on every page.** The palette overlay intercepts `Cmd/Ctrl+K` on all sites, which overrides sites that use the same shortcut.
- **Unit test coverage is limited** to the storage layer and services. Components are covered only by the Playwright suite.
- Some `react-hooks/exhaustive-deps` lint warnings remain on effects that call store actions.
- The main bundle is about 650 kB before gzip. It loads from disk, so this matters less than on the web, but feature panels are not yet code-split.
