# Quest Keeper AI

Quest Keeper AI is a Tauri desktop copilot for tabletop sessions. It pairs a terminal-style chat (LLM + MCP tool calls) with a 3D battlemap powered by React Three Fiber so you can sync characters, inventory, world state, and combat visuals from local MCP sidecar servers.

## Highlights
- Dual-pane UI: chat/terminal on the left, tabbed viewport on the right (3D battlemap, character sheet, inventory, world state, notes).
- LLM routing with tool-calls: OpenAI / Anthropic / Gemini / OpenRouter, configurable in the in-app Settings modal (stores API keys and system prompt locally).
- MCP integration: spawns bundled sidecar binaries (`rpg-game-state-server`, `rpg-combat-engine-server`) to fetch characters, inventory, world state, quests, and battlefield descriptions.
- 3D battlemap: grid with compass, terrain features, and tokens sized by creature category; renders parsed combat state from the combat server.
- Stateful React app using Zustand stores for chat sessions, settings, game data, and combat entities; markdown chat rendering with tool call inspector.

## Project Structure
- `src/` – React app (UI, stores, services, Three.js scene).
  - `components/layout` – main split layout.
  - `components/terminal` – chat history/input/sidebar + tool call display.
  - `components/viewport` – battlemap, terrain, tokens, character/world/inventory views.
  - `services/mcpClient.ts` – manages MCP sidecar processes and JSON-RPC calls.
  - `services/llm/` – provider adapters (OpenAI/OpenRouter, Anthropic, Gemini) and orchestration.
  - `stores/` – Zustand stores for chat, settings, game state, combat, UI tabs.
- `src-tauri/` – Tauri config and bundled binaries in `src-tauri/binaries/`.

## Prerequisites
- Node.js 20+ and npm.
- Rust toolchain + Tauri prerequisites for your OS (https://tauri.app/v2/guides/getting-started/prerequisites).
- The MCP sidecar binaries are already bundled under `src-tauri/binaries/`; rebuild/replace if you need updated servers.

## Setup
```bash
npm install
```

## Run
- Web (UI only, no Tauri APIs): `npm run dev`
- Desktop (full app + sidecars): `npm run tauri dev`

## Build
- Web bundle: `npm run build`
- Desktop bundle: `npm run tauri build`

## Usage Notes
- Configure API keys and preferred model in the Settings modal (`[CONFIG]` button in the terminal panel). Keys persist via local storage.
- OpenRouter free-tier models skip tool calls; select a non-free model if you need MCP tool execution.
- The chat supports `/test` to list MCP tools and verify sidecar connectivity.
- Game state sync polls every 5s: character sheet parsing, inventory, world state, and quests feed the UI views; combat sync pulls battlefield description to render entities/terrain.
