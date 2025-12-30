# Quest Keeper AI - Knowledge Base Document

## Quick Reference

| Property | Value |
|----------|-------|
| **Repository** | https://github.com/Mnehmos/mnehmos.quest-keeper.game |
| **Primary Language** | TypeScript |
| **Project Type** | Desktop Game Application |
| **Status** | Active |
| **Last Updated** | 2025-12-29 |

## Overview

Quest Keeper AI is a desktop RPG companion that combines an AI-powered Dungeon Master with a visual game engine and mechanical grounding system. The application bridges the gap between narrative-focused AI tools (like AI Dungeon) and mechanics-focused platforms (like D&D Beyond) by providing rich AI storytelling backed by persistent, verifiable game state. Players experience D&D 5e-style gameplay where an LLM narrates and drives the story while a unified MCP server (rpg-mcp) with 145+ tools enforces game rules, tracks character progression, manages combat encounters, and maintains world state in SQLite.

## Architecture

### System Design

Quest Keeper AI uses a three-tier architecture:

1. **Frontend Layer (Tauri + React)**: Desktop application built with Tauri 2.x, providing a dual-pane interface with a chat terminal on the left and tabbed viewport on the right. The viewport displays 3D battlemaps (React Three Fiber), 2D world maps (Canvas API), character sheets, inventory, spellbooks, and quest journals.

2. **MCP Communication Layer**: The frontend communicates with a sidecar MCP server (rpg-mcp) via JSON-RPC 2.0 over stdio. The MCP client manager (`mcpClient.ts`) spawns the server binary, manages tool calls with timeout handling, and processes responses.

3. **Backend Layer (rpg-mcp server)**: A unified MCP server providing 145+ tools across 11 domains (characters, items, combat, spells, quests, world, party, NPCs, secrets, strategy). All game state is persisted in SQLite with automatic migrations.

4. **LLM Integration Layer**: Supports multiple providers (Anthropic Claude, OpenAI GPT, Google Gemini, OpenRouter) with a seven-layer context architecture that dynamically builds system prompts from static identity/rules layers and dynamic world/party/narrative/scene/secrets layers.

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| App Entry | React app initialization, MCP startup, store initialization | `src/App.tsx` |
| Main Entry | React DOM rendering | `src/main.tsx` |
| MCP Client | JSON-RPC client for rpg-mcp server, sidecar management | `src/services/mcpClient.ts` |
| LLM Service | Multi-provider LLM abstraction, tool call orchestration | `src/services/llm/LLMService.ts` |
| Context Builder | Seven-layer system prompt assembly | `src/services/llm/contextBuilder.ts` |
| Chat Store | Message history, streaming state, tool call results | `src/stores/chatStore.ts` |
| Game State Store | Character data, inventory, quests sync | `src/stores/gameStateStore.ts` |
| Combat Store | Encounter state, initiative, battlefield sync | `src/stores/combatStore.ts` |
| Party Store | Multi-character party management, formations | `src/stores/partyStore.ts` |
| Settings Store | API keys, provider selection, theme, context layers | `src/stores/settingsStore.ts` |
| Layout | Split-pane UI with terminal and viewport | `src/components/layout/AppLayout.tsx` |
| Viewport | Tabbed interface for map, sheet, inventory, spellbook, NPCs | `src/components/viewport/` |
| Battlemap | 3D combat visualization with Three.js | `src/components/viewport/BattlemapView.tsx` |
| World Map | 2D procedural world rendering with biomes, POIs, regions | `src/components/viewport/WorldMapView.tsx` |
| Combat HUD | Turn order, party status, quick actions, rest/loot panels | `src/components/hud/` |
| Tauri Config | Desktop app configuration, sidecar binaries | `src-tauri/tauri.conf.json` |

### Data Flow

```
User Input (Chat)
  → LLM Service (builds context from 7 layers)
  → LLM Provider (Anthropic/OpenAI/Gemini/OpenRouter)
  → Tool Calls → MCP Client (JSON-RPC)
  → rpg-mcp Server (validates, executes)
  → SQLite Database (persists state)
  → MCP Response → LLM Service (formats)
  → Chat Store (updates messages)
  → Game State Sync (polls DB via get_character_full, get_encounter_state)
  → Zustand Stores (gameState, combat, party, npcs)
  → React Components (re-render UI)

User Interaction (3D Battlemap Click)
  → Local Tool Call (move_character, attack)
  → Same MCP flow as above

Session Persistence
  → Zustand Middleware (localStorage)
  → Persists: chat history, settings, active character, session state
  → On reload: hydrates stores, reconnects MCP
```

## API Surface

### Public Interfaces

The application exposes its functionality through MCP tools provided by the rpg-mcp server. The LLM or user can invoke these tools to modify game state.

#### Domain: Characters (5 tools)

##### Tool: `create_character`
- **Purpose**: Create a new D&D 5e character with full stat block
- **Parameters**:
  - `name` (string): Character name
  - `race` (string): D&D race (e.g., "human", "elf", "dwarf")
  - `class_name` (string): D&D class (e.g., "fighter", "wizard", "rogue")
  - `level` (number): Starting level (1-20)
  - `abilities` (object): STR/DEX/CON/INT/WIS/CHA scores
  - `alignment` (string, optional): Alignment (e.g., "lawful good")
- **Returns**: Character object with id, stats, HP, AC, proficiencies

##### Tool: `get_character_full`
- **Purpose**: Retrieve complete character data including inventory, spells, conditions
- **Parameters**:
  - `character_id` (string): Character UUID
- **Returns**: Full character object with equipped items, active conditions, spell slots

#### Domain: Combat (8 tools)

##### Tool: `create_encounter`
- **Purpose**: Initialize a new combat encounter with creatures
- **Parameters**:
  - `name` (string): Encounter name
  - `creatures` (array): Array of creature definitions with preset_id, count, position
  - `environment` (string, optional): Terrain type
- **Returns**: Encounter object with initiative order, battlefield grid

##### Tool: `execute_combat_action`
- **Purpose**: Execute a combat action (attack, spell, move, etc.)
- **Parameters**:
  - `encounter_id` (string): Active encounter UUID
  - `action_type` (string): "attack", "cast_spell", "move", "dodge", "dash", "help"
  - `actor_id` (string): Acting creature UUID
  - `target_id` (string, optional): Target creature UUID for attacks
  - `position` (object, optional): {x, y, z} for movement
- **Returns**: Action result with damage rolls, hit/miss, status changes

#### Domain: World (12 tools)

##### Tool: `generate_world`
- **Purpose**: Generate a procedural world with biomes, regions, POIs
- **Parameters**:
  - `name` (string): World name
  - `seed` (number, optional): Random seed for reproducibility
  - `size` (number, optional): World dimensions (default 512)
- **Returns**: World object with id, regions, biome map, heightmap

##### Tool: `get_world_tiles`
- **Purpose**: Fetch world map data for rendering
- **Parameters**:
  - `world_id` (string): World UUID
  - `x_start` (number): Starting X coordinate
  - `y_start` (number): Starting Y coordinate
  - `width` (number): Tile width
  - `height` (number): Tile height
- **Returns**: 2D array of tiles with biome, elevation, temperature, moisture

#### Domain: Quests (8 tools)

##### Tool: `assign_quest`
- **Purpose**: Add a quest to a character's quest log
- **Parameters**:
  - `character_id` (string): Character UUID
  - `title` (string): Quest title
  - `description` (string): Quest description
  - `objectives` (array): Array of objective objects with description, target_count
  - `rewards` (object, optional): {xp, gold, items}
- **Returns**: Quest object with id, status, progress tracking

##### Tool: `update_objective`
- **Purpose**: Update quest objective progress
- **Parameters**:
  - `quest_id` (string): Quest UUID
  - `objective_index` (number): Zero-based objective index
  - `current_count` (number): Progress amount
- **Returns**: Updated quest object

#### Domain: Spells (15+ tools)

##### Tool: `cast_spell`
- **Purpose**: Cast a spell with slot consumption and concentration tracking
- **Parameters**:
  - `character_id` (string): Caster UUID
  - `spell_name` (string): Spell name from D&D 5e SRD
  - `spell_level` (number): Spell slot level to use (1-9)
  - `target_id` (string, optional): Target creature UUID
- **Returns**: Spell result with damage, effects, concentration status

#### Domain: Party (17 tools)

##### Tool: `create_party`
- **Purpose**: Create a new adventuring party
- **Parameters**:
  - `name` (string): Party name
  - `member_ids` (array): Array of character UUIDs
- **Returns**: Party object with id, formation, share percentages

##### Tool: `party_move`
- **Purpose**: Move entire party on world map
- **Parameters**:
  - `party_id` (string): Party UUID
  - `destination` (object): {x, y} world coordinates
- **Returns**: Movement result with travel time, encounters

### Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `ANTHROPIC_API_KEY` | string | - | API key for Claude models (stored in localStorage) |
| `OPENAI_API_KEY` | string | - | API key for GPT models (stored in localStorage) |
| `GOOGLE_AI_API_KEY` | string | - | API key for Gemini models (stored in localStorage) |
| `OPENROUTER_API_KEY` | string | - | API key for OpenRouter models (stored in localStorage) |
| `selectedProvider` | string | "anthropic" | Active LLM provider |
| `selectedModel` | string | "claude-opus-4-5" | Active LLM model |
| `questkeeper_prompt_layer1` | string | (bundled) | AI DM identity prompt (runtime-editable) |
| `questkeeper_prompt_layer2` | string | (bundled) | Game system rules prompt (runtime-editable) |
| `questkeeper_playtest_mode` | boolean | false | Enable playtest mode with debugging tools |

## Usage Examples

### Basic Usage: Character Creation and Quest Assignment

```typescript
// Import LLM service and send a natural language command
import { llmService } from './services/llm/LLMService';

// User types in chat: "Create a human fighter named Valeros with 16 STR"
// LLM service processes this and calls:
const response = await mcpManager.gameStateClient.callTool('create_character', {
  name: 'Valeros',
  race: 'human',
  class_name: 'fighter',
  level: 1,
  abilities: {
    strength: 16,
    dexterity: 14,
    constitution: 14,
    intelligence: 10,
    wisdom: 12,
    charisma: 8
  }
});

// Character created with UUID, stats, HP (1d10 + CON mod)
const characterId = response.result.id;

// Assign a quest
await mcpManager.gameStateClient.callTool('assign_quest', {
  character_id: characterId,
  title: 'Rescue the Village',
  description: 'Goblins have kidnapped the blacksmith. Rescue him!',
  objectives: [
    { description: 'Defeat goblin raiders', target_count: 5 },
    { description: 'Find the blacksmith', target_count: 1 }
  ],
  rewards: { xp: 300, gold: 50 }
});
```

### Advanced Pattern: Combat Encounter with Spell Casting

```typescript
// Create an encounter from preset templates
const encounter = await mcpManager.gameStateClient.callTool('create_encounter', {
  name: 'Goblin Ambush',
  creatures: [
    { preset_id: 'goblin', count: 3, position: { x: 5, y: 5, z: 0 } },
    { preset_id: 'goblin_boss', count: 1, position: { x: 10, y: 5, z: 0 } }
  ],
  environment: 'forest'
});

const encounterId = encounter.result.id;

// Player's wizard casts fireball
const spellResult = await mcpManager.gameStateClient.callTool('cast_spell', {
  character_id: wizardId,
  spell_name: 'fireball',
  spell_level: 3,
  target_area: { x: 7, y: 5, radius: 20 } // 20ft radius
});

// Execute combat action: wizard's turn
const actionResult = await mcpManager.gameStateClient.callTool('execute_combat_action', {
  encounter_id: encounterId,
  action_type: 'cast_spell',
  actor_id: wizardId,
  spell_result: spellResult.result
});

// Advance turn after action
await mcpManager.gameStateClient.callTool('advance_turn', {
  encounter_id: encounterId
});

// Sync combat state to UI
import { useCombatStore } from './stores/combatStore';
await useCombatStore.getState().syncCombatState();
```

### Advanced Pattern: Seven-Layer Context Building

```typescript
// Build system prompt with all 7 context layers
import { buildSystemPrompt } from './services/llm/contextBuilder';

const systemPrompt = await buildSystemPrompt({
  worldId: currentWorldId,
  characterId: activeCharacterId,
  partyId: activePartyId,
  encounterId: activeCombatId,
  verbosity: 'standard'
});

// systemPrompt now contains:
// - Layer 1: AI DM Core Identity (~400 tokens)
// - Layer 2: Game System Rules (~800 tokens)
// - Layer 3: World State Snapshot (~600 tokens) - from get_world_state
// - Layer 4: Party & Character Context (~1200 tokens) - from get_character_full
// - Layer 5: Narrative Memory (~800 tokens) - from recent chat history
// - Layer 6: Scene Context (~1000 tokens) - from get_encounter_state if in combat
// - Layer 7: DM Secrets (~300 tokens) - from get_active_secrets
// Total: ~5100 tokens

// Send to LLM with user message
const response = await llmService.sendMessage([
  { role: 'system', content: systemPrompt },
  { role: 'user', content: 'I want to search for traps in this room' }
]);
```

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @tauri-apps/api | ^2 | Tauri native APIs for desktop integration |
| @tauri-apps/plugin-fs | ^2.4.4 | File system access for MCP data directory |
| @tauri-apps/plugin-shell | ^2.3.3 | Spawn MCP server sidecar process |
| @react-three/fiber | ^9.4.2 | React renderer for Three.js (3D battlemap) |
| @react-three/drei | ^10.7.7 | Three.js helpers (cameras, controls, loaders) |
| react | ^19.0.0 | UI library |
| react-dom | ^19.0.0 | React DOM renderer |
| react-markdown | ^10.1.0 | Markdown rendering for AI responses |
| rehype-highlight | ^7.0.2 | Syntax highlighting for code blocks |
| remark-gfm | ^4.0.1 | GitHub-flavored markdown support |
| three | ^0.181.2 | 3D graphics library for battlemap |
| uuid | ^13.0.0 | UUID generation for entities |
| zod | ^3.25.76 | Schema validation for MCP responses |
| zustand | ^5.0.8 | State management with persistence |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @tauri-apps/cli | ^2 | Tauri CLI for building desktop app |
| @vitejs/plugin-react | ^4.3.4 | Vite plugin for React Fast Refresh |
| @types/react | ^19.0.0 | TypeScript types for React |
| @types/react-dom | ^19.0.0 | TypeScript types for React DOM |
| @types/three | ^0.181.0 | TypeScript types for Three.js |
| @types/uuid | ^10.0.0 | TypeScript types for uuid |
| @testing-library/react | ^16.1.0 | React component testing utilities |
| @testing-library/jest-dom | ^6.6.3 | Jest DOM matchers |
| vitest | ^2.1.8 | Unit testing framework |
| @vitest/ui | ^2.1.8 | Vitest UI for test visualization |
| @vitest/coverage-v8 | ^2.1.8 | Code coverage reporting |
| tailwindcss | ^3.4.18 | Utility-first CSS framework |
| autoprefixer | ^10.4.22 | PostCSS plugin for vendor prefixes |
| typescript | ^5.8.3 | TypeScript compiler |
| vite | ^7.0.4 | Build tool and dev server |

## Integration Points

### Works With

| Project | Integration Type | Description |
|---------|-----------------|-------------|
| mnehmos.rpg.mcp | Dependency | Backend MCP server providing 145+ game tools. Quest Keeper bundles rpg-mcp as a sidecar binary and communicates via JSON-RPC 2.0 over stdio. |

### External Services

| Service | Purpose | Required |
|---------|---------|----------|
| Anthropic API | Claude models (Opus 4.5, Sonnet 4.5, 3.5) for AI DM | Yes (one provider) |
| OpenAI API | GPT-4, GPT-4o, GPT-4 Turbo for AI DM | Yes (one provider) |
| Google AI API | Gemini Pro, Gemini Flash for AI DM | Yes (one provider) |
| OpenRouter API | 100+ models from various providers | Yes (one provider) |

Note: At least one LLM provider API key is required for the application to function. Users configure API keys in the settings panel.

## Development Guide

### Prerequisites

- Node.js 20 or higher
- npm (bundled with Node.js)
- Rust toolchain (install from https://rustup.rs/)
- Tauri prerequisites for Windows (WebView2, Visual Studio Build Tools)
  - Full guide: https://tauri.app/v2/guides/getting-started/prerequisites

### Setup

```bash
# Clone the repository
git clone https://github.com/Mnehmos/mnehmos.quest-keeper.game
cd mnehmos.quest-keeper.game

# Install dependencies
npm install

# Verify rpg-mcp sidecar binary exists
# Should be present at: src-tauri/binaries/rpg-mcp-server-x86_64-pc-windows-msvc.exe
# If missing, build from https://github.com/Mnehmos/mnehmos.rpg.mcp
```

### Running Locally

```bash
# Development mode (full Tauri app with MCP sidecar)
npm run tauri dev

# Web-only mode (limited functionality, no MCP tools)
# Useful for UI development without Tauri overhead
npm run dev
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Building

```bash
# Production build (creates installer in src-tauri/target/release/bundle/)
npm run tauri build

# Output files:
# - src-tauri/target/release/bundle/nsis/Quest Keeper AI_0.1.1_x64-setup.exe
# - src-tauri/target/release/bundle/msi/Quest Keeper AI_0.1.1_x64_en-US.msi
```

### Creating a Release

Releases are automated via GitHub Actions:

```bash
# Tag a version
git tag v0.2.0
git push origin v0.2.0

# GitHub Actions workflow builds Windows installer and creates draft release
```

## Maintenance Notes

### Known Issues

1. **OpenRouter free models skip tool calls** - Free tier models on OpenRouter may not support function calling. Use paid models or switch to Anthropic/OpenAI for full functionality.

2. **Long sessions can exceed context window** - Sessions with 100+ messages may exceed LLM context limits. Token budget tracking is implemented but context condensing is planned for future release.

3. **rpg-mcp binary must be pre-built** - The sidecar binary at `src-tauri/binaries/rpg-mcp-server-x86_64-pc-windows-msvc.exe` must be present before building. This binary is committed to the repository, but fresh forks must build it separately from the rpg-mcp repository.

4. **Windows-only builds currently supported** - Tauri configuration targets Windows (NSIS, MSI). macOS and Linux builds require additional sidecar binaries and bundle configurations.

### Future Considerations

1. **OSRS-style progression system** - Planned feature for skill-based XP curves, quest prerequisites, achievement tracking, and faction reputation (Phase 3 in roadmap).

2. **Context condensing for very long sessions** - Automatic summarization of old messages to maintain context window limits while preserving key narrative beats (Phase 5).

3. **Batch generation workflow automation** - YAML-based workflow definitions for generating NPCs, encounters, and locations in bulk (Phase 6).

4. **Export sessions to Markdown/PDF** - Planned feature to export chat history and game state snapshots for archival and sharing (Phase 5).

5. **Click-to-move token interaction** - Direct manipulation of 3D battlemap tokens for movement and targeting (Phase 4, partially complete).

6. **Combat log panel** - Dedicated UI panel for combat action history with damage rolls, saving throws, and condition changes (Phase 4).

### Code Quality

| Metric | Status |
|--------|--------|
| Tests | Partial - core stores have unit tests (partyStore, hudStore, combatHUD), coverage ~30% |
| Linting | ESLint with TypeScript rules (configured via package.json) |
| Type Safety | TypeScript strict mode enabled (tsconfig.json) |
| Documentation | Comprehensive docs in docs/ directory (PROJECT_VISION.md, DEVELOPMENT_PLAN.md, TASK_MAP.md), inline JSDoc for complex functions |

---

## Appendix: File Structure

```
mnehmos.quest-keeper.game/
├── src/
│   ├── App.tsx                    # Main app component, MCP initialization
│   ├── main.tsx                   # React DOM entry point
│   ├── components/
│   │   ├── layout/               # AppLayout, split-pane structure
│   │   ├── terminal/             # Chat interface, sidebar, tool inspector
│   │   ├── viewport/             # BattlemapView, WorldMapView, CharacterSheet
│   │   ├── hud/                  # CombatHUD, quick actions, rest/loot panels
│   │   ├── character/            # SpellBookView, ConcentrationIndicator
│   │   ├── npc/                  # NPC memory, relationship cards
│   │   ├── chat/                 # StreamingMessage, ToolCallDisplay
│   │   └── common/               # Reusable UI components
│   ├── services/
│   │   ├── mcpClient.ts          # JSON-RPC MCP client, sidecar management
│   │   ├── llm/
│   │   │   ├── LLMService.ts     # Multi-provider LLM orchestration
│   │   │   ├── contextBuilder.ts # Seven-layer context assembly
│   │   │   ├── providers/        # OpenAIProvider, AnthropicProvider, GeminiProvider
│   │   │   └── context/          # Markdown context layer templates
│   │   ├── toolRegistry.ts       # Local tool definitions
│   │   ├── eventPoller.ts        # Autonomous event polling (secrets, conditions)
│   │   └── watchdog.ts           # MCP connection health monitoring
│   ├── stores/
│   │   ├── chatStore.ts          # Message history, streaming state
│   │   ├── gameStateStore.ts     # Character, inventory, quests
│   │   ├── combatStore.ts        # Encounter state, initiative, battlefield
│   │   ├── partyStore.ts         # Party members, formations
│   │   ├── sessionStore.ts       # Campaign state, session persistence
│   │   ├── settingsStore.ts      # API keys, provider, theme, context layers
│   │   ├── npcStore.ts           # NPC memory, relationships
│   │   ├── notesStore.ts         # Player notes, tags
│   │   ├── hudStore.ts           # Combat HUD visibility, selected tokens
│   │   └── uiStore.ts            # Modal state, UI flags
│   ├── context/
│   │   └── ThemeContext.tsx      # Theme provider (terminal, fantasy, modern)
│   └── utils/
│       ├── mcpUtils.ts           # MCP response parsing, state extraction
│       ├── toolResponseFormatter.ts # Tool result formatting
│       └── eventBus.ts           # Event-driven updates for stores
├── src-tauri/
│   ├── binaries/
│   │   └── rpg-mcp-server-x86_64-pc-windows-msvc.exe  # MCP sidecar
│   ├── icons/                    # App icons for Windows
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri app configuration
├── docs/
│   ├── PROJECT_VISION.md         # Product vision, target personas, design principles
│   ├── DEVELOPMENT_PLAN.md       # Strategic roadmap, phases, priorities
│   ├── TASK_MAP.md               # Detailed task breakdown with dependencies
│   └── architecture/             # Architecture decision records
├── scripts/
│   ├── prepare-mcp.js            # Pre-build script to copy MCP binary
│   └── dev-server.js             # Auto-restart dev server
├── package.json                  # NPM dependencies and scripts
├── tsconfig.json                 # TypeScript configuration (strict mode)
├── vite.config.ts                # Vite build configuration
├── vitest.config.ts              # Vitest test configuration
├── tailwind.config.js            # Tailwind CSS theming
├── README.md                     # User-facing documentation
└── PROJECT_KNOWLEDGE.md          # This document
```

---

*Generated by Project Review Orchestrator | 2025-12-29*
*Source: https://github.com/Mnehmos/mnehmos.quest-keeper.game*
