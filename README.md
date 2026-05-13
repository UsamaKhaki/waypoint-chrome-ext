# DevFlow Workspace

> Developer productivity command center — Chrome Extension (Manifest V3)

A production-grade Chrome extension that replaces the default new tab with a powerful developer dashboard inspired by Linear, Raycast, Arc, and Notion.

---

## Features

- **⌘K Command Palette** — Raycast-style fuzzy search across bookmarks, environments, and commands
- **Smart Bookmarks** — Categorized links with drag-drop, inline editing, favorites, and search
- **Environment Switcher** — Local/Stage/Prod cards with health indicators and production warnings
- **GitHub Hub** — Repo shortcuts, branch templates, PR templates, quick GitHub links
- **Daily Focus Widget** — Priorities checklist, notes, and goals with auto-save
- **Workspace Modes** — 9 focus modes (Frontend, Backend, DevOps, Deep Work, etc.) that filter the UI
- **Tab Manager** — Duplicate detector, session save/restore, bulk tab actions
- **Keyboard-First Navigation** — Full shortcut system, chord shortcuts, zero mouse required
- **Pomodoro Timer** — Built-in focus timer with session tracking
- **Quick Notes** — Floating sticky notes accessible anywhere
- **Import/Export** — Back up and restore all your data
- **Dark Mode First** — Polished glassmorphism UI built for long sessions

---

## Tech Stack

| Layer       | Technology                             |
| ----------- | -------------------------------------- |
| Framework   | React 18.3.1 + TypeScript 5.6          |
| Build       | Vite 6.0                               |
| Styling     | TailwindCSS 3.4 + CSS Variables        |
| State       | Zustand 5.0                            |
| Animation   | Framer Motion 12                       |
| Drag & Drop | @dnd-kit/core 6 + @dnd-kit/sortable 10 |
| Search      | Fuse.js 7.3                            |
| Icons       | Lucide React 1.14                      |
| Extension   | Chrome Manifest V3                     |

---

## Project Structure

```
src/
├── components/ui/        # Reusable UI primitives (Button, Input, Badge, Modal, Kbd, Tooltip, Spinner)
├── features/
│   ├── bookmarks/        # Smart bookmark management (cards, sections, forms)
│   ├── command-palette/  # CMD+K command palette with Fuse.js fuzzy search
│   ├── environments/     # Environment switcher cards (local/stage/prod)
│   ├── focus-modes/      # Workspace mode selector and indicator
│   ├── github/           # GitHub productivity hub (repos, branches, PRs, quick links)
│   ├── tabs/             # Tab chaos reduction (duplicates, sessions, bulk actions)
│   └── widgets/          # Daily focus widget
├── hooks/                # useKeyboardShortcuts, useClickOutside, useLocalStorage
├── layouts/              # MainLayout, SidebarNav, TopBar
├── lib/                  # Shared utilities (cn helper)
├── services/             # Chrome storage wrapper with localStorage dev fallback
├── store/                # Zustand stores (bookmarks, environments, github, tabs, workspace, settings, commandPalette)
├── types/                # TypeScript interfaces
├── constants/            # App constants, workspace configs, keyboard shortcuts, storage keys
└── utils/                # Utility functions
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Google Chrome

### Development

```bash
# Install dependencies
npm install

# Start dev server (for UI previewing in the browser)
npm run dev

# Build the extension
npm run build

# Lint
npm run lint
```

### Load in Chrome

1. Run `npm run build` — this creates the `dist/` folder
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer Mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `dist/` folder
6. Open a new tab — DevFlow Workspace appears

### Development Tips

- The app uses `localStorage` as a fallback when `chrome.storage` is unavailable (i.e., in the Vite dev server). This lets you develop in the browser without loading the extension.
- After making changes, run `npm run build` and click the reload button on `chrome://extensions`.
- Husky + lint-staged are configured to auto-lint and auto-format on every commit.

---

## Keyboard Shortcuts

| Shortcut        | Action                        |
| --------------- | ----------------------------- |
| `⌘K` / `Ctrl+K` | Open Command Palette          |
| `/`             | Open Command Palette (search) |
| `⌘1`            | Bookmarks                     |
| `⌘2`            | Environments                  |
| `⌘3`            | GitHub Hub                    |
| `⌘4`            | Daily Focus                   |
| `⌘5`            | Tab Manager                   |
| `⌘6`            | Settings                      |
| `G → H`         | Go to GitHub Hub              |
| `G → P`         | Go to GitHub (Pull Requests)  |
| `E → L`         | Go to Local environment       |
| `E → S`         | Go to Stage environment       |
| `E → P`         | Go to Production environment  |
| `ESC`           | Close modal / palette         |
| `↑ ↓`           | Navigate palette results      |
| `↵`             | Execute selected command      |

---

## Workspace Modes

Switch modes via the mode selector in the top bar (or ⌘K → "mode"):

| Mode                  | Best For                                                     |
| --------------------- | ------------------------------------------------------------ |
| 🌐 Default            | Show everything                                              |
| 🎨 Frontend           | UI/CSS/design work — shows local, stage, design bookmarks    |
| ⚙️ Backend            | API/server development — shows all environments + monitoring |
| 🚀 DevOps             | Infrastructure & deployments — CI/CD, monitoring, prod       |
| 🐛 Debugging          | Troubleshooting & logs — monitoring + all environments       |
| 📋 Sprint Planning    | Tickets & project management — hides all environments        |
| 🔥 Production Support | Incident response — monitoring, prod/stage only              |
| 🤝 Meeting            | Collaboration mode — docs and company tools                  |
| 🧘 Deep Work          | Distraction-free focus — docs, local-dev, Pomodoro widget    |

---

## Bookmark Categories

Bookmarks are organized into 12 built-in categories:

`github` · `pull-requests` · `ci-cd` · `company-tools` · `monitoring` · `documentation` · `local-dev` · `stage` · `production` · `design` · `personal` · `custom`

Visible categories update automatically when you switch Workspace Modes.

---

## Data & Privacy

All data is stored locally using `chrome.storage.local`. Nothing is sent to any server. Use **Settings → Export Backup** to back up your data as JSON.

**Permissions used:**

| Permission  | Why                            |
| ----------- | ------------------------------ |
| `storage`   | Persist all user data locally  |
| `tabs`      | Read open tabs for Tab Manager |
| `bookmarks` | Access Chrome bookmark bar     |
| `tabGroups` | Create and manage tab groups   |

---

## Architecture Notes

- **Zustand stores** each own a feature domain and sync to `chrome.storage.local` on every mutation via the services layer.
- **Services layer** (`src/services/storage.ts`) abstracts chrome storage with a `localStorage` dev fallback so the app works in both the browser and the extension context.
- **Feature-based structure** — each feature is self-contained with its own components, hooks, and barrel `index.ts` export.
- **Workspace modes** filter visible sections at the store level via `config.visibleCategories` and `config.visibleEnvironments` defined in `src/constants/index.ts`.
- **Command palette** uses Fuse.js for real-time fuzzy search; results are capped at 8 items and recent commands are tracked (last 5).
- Architecture is prepared for future GitHub API, Jira, Slack, and cloud sync integrations.

---

## Build Output

```
dist/index.html                   ~0.47 kB
dist/assets/index-[hash].css     ~23 kB  (gzip: ~5 kB)
dist/assets/index-[hash].js     ~414 kB  (gzip: ~127 kB)
```

Build completes in under 2 seconds with zero TypeScript or import errors.
