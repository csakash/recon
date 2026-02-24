# Copilot Instructions — recon.

## What is recon.

A native Electron desktop app that acts as a dedicated testing browser with built-in recording and AI analysis. Users open a URL, record a session (capturing clicks, network, console, video, and voice), then AI agents analyze all streams in parallel and produce a structured bug report.

## Tech Stack

- **Shell**: Electron (embeds Chromium via `BrowserView`)
- **UI**: React + TypeScript, bundled with electron-vite
- **State**: Zustand
- **Styling**: Tailwind CSS with CSS variables for dark/light theming
- **Browser introspection**: Chrome DevTools Protocol via `webContents.debugger`
- **Video capture**: Electron `capturePage` / paint events → WebM
- **Audio capture**: Web Audio API + MediaRecorder → WebM/Opus
- **Transcription**: Whisper (API or local)
- **AI providers**: Anthropic / OpenAI APIs, or spawned local CLI agents (Claude Code, Copilot CLI)
- **Database**: SQLite via `better-sqlite3` for session metadata
- **Monospace font**: DM Mono; **UI font**: DM Sans

## Build & Run

```sh
npm install
npm run dev          # Start Electron in dev mode (electron-vite)
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

## Architecture

### Process Model

Electron's **main process** owns the application lifecycle, the `BrowserView` (the embedded test browser), all CDP sessions, video/audio encoding, file I/O, SQLite access, and AI agent orchestration. The **renderer process** is the React UI — it never touches the filesystem or CDP directly; everything goes through IPC.

### Window Layout (four regions)

| Region | Size | Purpose |
|---|---|---|
| Left sidebar | 240px fixed | Record button, mic toggle, session list |
| Center | flex | URL bar + embedded `BrowserView` (not part of React — it's a native layer positioned over a gap in the React layout) |
| Right panel | 340px fixed | Tabs: Network, Console, Interactions (all stream live during recording) |
| Bottom panel | 160–280px resizable | AI agent terminal (CLI-style input, markdown output) |

### BrowserView Positioning

The `BrowserView` is **not** a React component. The React app renders everything *around* a reserved gap; main process code positions the `BrowserView` to fill that gap. On window resize or panel resize, the main process must recalculate `BrowserView.setBounds()`.

### Recording — Five Parallel Capture Streams

When recording starts, all five streams run simultaneously:

1. **Interactions** — CDP-injected script captures clicks (with selector, text, coordinates), scrolls, key input, form changes, navigations. Saved to `interactions.json`.
2. **Network** — CDP Network domain captures every request/response with full timing breakdown. Saved to `network.json`.
3. **Console** — CDP Runtime + Log domains capture console calls and uncaught exceptions with stack traces. Saved to `console.json`.
4. **Video** — `capturePage` at 10–15 fps, encoded to `video.webm`. Captures only BrowserView content, no app chrome.
5. **Audio** — MediaRecorder in renderer, chunks streamed to main process incrementally. Saved as `audio.webm`.

### AI Analysis Pipeline

After recording stops, five specialized agents run **in parallel** (fire all API calls or CLI spawns simultaneously):

- Voice Transcript Analyzer (Whisper transcription → intent/sentiment extraction)
- Video Analyzer (keyframes at interaction timestamps + intervals → visual timeline)
- Network Analyzer (failed requests, timing anomalies, patterns)
- Console Analyzer (errors, stack traces, related error chains)
- Interaction Analyzer (workflow reconstruction, retries, wait times)

Once all five complete, a **Synthesizer Agent** combines their outputs into a single markdown bug report with: title, severity, executive summary, steps to reproduce, expected vs actual, root cause analysis with evidence citations (specific request URLs, console errors with file:line, video timestamps), user quotes, and suggested fix.

### Session Storage

All data is local. No cloud accounts.

```
~/.recon/sessions/{session-id}/
├── video.webm
├── audio.webm
├── transcript.txt
├── network.json
├── console.json
├── interactions.json
├── report.md
└── meta.json
```

Session metadata is also indexed in a SQLite database for fast listing/querying.

## Key Conventions

### IPC Boundary

The renderer never accesses Node APIs, the filesystem, CDP, or SQLite. All cross-boundary communication uses typed IPC channels. Define channel types in a shared location so both sides stay in sync.

### CDP Usage

Always attach debuggers via `webContents.debugger.attach('1.3')` and use `debugger.sendCommand` / `debugger.on('message')`. Enable domains explicitly (`Network.enable`, `Runtime.enable`, `Log.enable`). Detach cleanly when recording stops.

### State Management

Zustand stores live in the renderer. Session data flowing from main process (network events, console entries, interactions) arrives via IPC and is pushed into Zustand stores. Keep stores granular — separate stores for network, console, interactions, recording status, and session list.

### Theming

Dark theme is default. Colors use CSS variables, toggled by a class on the root element. Accent color: `#e05a33` (warm red-orange), used sparingly for record button, active states, recording indicator. Dark backgrounds: `#0c0c0e`, `#141416`, `#1a1a1e`. Light backgrounds: `#f5f5f0`, `#eeeee8`.

### Visual Design Rules

Tight borders, subtle separators, compact information density. No gradients, no purple, no pill buttons with shadows, no large border radii. Font sizes 10–13px for most content. The UI should feel like Linear meets Arc Browser meets a terminal.

### AI Provider Abstraction

AI calls go through an abstraction layer that supports two backends: direct API calls (Anthropic/OpenAI with streaming) and local CLI agent spawning. The user configures their preferred backend and API keys in settings. The agent orchestrator fires all parallel agents simultaneously and collects results as they complete.

### Build Order / Phasing

Each phase should produce something that works and can be tested:

1. Electron window + BrowserView + URL bar + four-panel layout
2. CDP integration: live network, console, interaction capture → right panel
3. Recording: video + audio capture, session persistence to disk + SQLite
4. AI pipeline: parallel agents → synthesizer → markdown report in terminal
5. Polish: themes, keyboard shortcuts, resizable panels, error handling, packaging
