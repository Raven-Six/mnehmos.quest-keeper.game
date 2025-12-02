# Sprint 1 Initialization Prompt

**Sprint Goal:** Fix the broken quest system so it returns full quest data instead of UUID-only responses

---

## Context

You are working on Quest Keeper AI, a Tauri desktop RPG that uses an MCP (Model Context Protocol) server for game state management. The current quest system has a critical bug: `get_quest_log` returns only UUIDs instead of full quest objects with names, descriptions, objectives, and rewards.

### Architecture Overview

```
Frontend (React/TypeScript)     MCP Server (rpg-mcp)           SQLite Database
┌─────────────────────────┐    ┌─────────────────────────┐    ┌──────────────┐
│ src/                    │    │ Backend repository at:  │    │ game.db      │
│ ├── services/           │───▶│ ../rpg-mcp/             │───▶│              │
│ │   └── mcpClient.ts    │    │ ├── src/repos/          │    │ Tables:      │
│ ├── utils/              │    │ │   └── quest.repo.ts   │    │ - quests     │
│ │   └── toolResponse    │    │ └── src/tools/          │    │ - quest_log  │
│ │       Formatter.ts    │    │     └── quest.tools.ts  │    │ - objectives │
│ └── stores/             │    └─────────────────────────┘    └──────────────┘
│     └── gameStateStore  │
└─────────────────────────┘
```

### Key Files to Modify

| Location | File | Purpose |
|----------|------|---------|
| rpg-mcp repo | `src/repos/quest.repo.ts` | Database queries for quests |
| rpg-mcp repo | `src/tools/quest.tools.ts` | MCP tool definitions |
| This repo | `src/utils/toolResponseFormatter.ts` | Formats tool responses for UI |

---

## Sprint 1 Tasks

### Phase 1: Quest Log Fix (P0)

#### Q-001: Modify `getQuestLog()` in quest.repo.ts
**Current behavior:** Returns array of quest IDs only
**Target behavior:** Returns full quest objects with joined data

```typescript
// Expected return shape
interface QuestLogEntry {
  quest_id: string;
  character_id: string;
  status: 'active' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  quest: {
    id: string;
    name: string;
    description: string;
    quest_giver?: string;
    location?: string;
    rewards: {
      xp?: number;
      gold?: number;
      items?: string[];
    };
  };
  objectives: Array<{
    id: string;
    description: string;
    target_count: number;
    current_count: number;
    completed: boolean;
  }>;
}
```

#### Q-002: Update `get_quest_log` tool
- Modify tool handler to use updated `getQuestLog()`
- Ensure response includes all nested data

#### Q-003: Add `getQuestById()` helper
- Simple lookup function for single quest with full data
- Used by other tools and for quest detail views

#### Q-004: Create `get_quest` tool
- New MCP tool for single quest lookup
- Input: `quest_id`
- Output: Full quest object with objectives and rewards

#### Q-005: Update `toolResponseFormatter.ts`
- Add formatting for new quest response structure
- Display quest names, progress bars, reward previews

#### Q-006: Test quest log display
- Verify frontend shows quest names (not UUIDs)
- Confirm objectives display with progress

---

### Phase 2: Objective Progress Tracking (P0)

#### Q-020: Add `updateObjectiveProgress()` in quest.repo.ts
```typescript
async function updateObjectiveProgress(
  objectiveId: string,
  currentCount: number
): Promise<Objective>
```

#### Q-021: Create `update_quest_objective` tool
- Input: `objective_id`, `progress` (number)
- Updates current_count for objective
- Returns updated objective state

#### Q-022: Create `complete_objective` tool
- Input: `objective_id`
- Sets current_count = target_count
- Marks objective as completed

#### Q-023: Auto-complete quest when all objectives done
- After any objective update, check if all objectives complete
- If yes, update quest status to 'completed'
- Return completion status in response

#### Q-024: Objective progress UI component
- Progress bars for each objective
- "3/10 goblins killed" format
- Visual feedback on completion

---

### Phase 3: Quest Rewards (P0)

#### Q-040: Implement `claim_quest_rewards` tool
- Input: `character_id`, `quest_id`
- Validates quest is completed and rewards unclaimed
- Distributes all rewards atomically

#### Q-041: Grant XP on reward claim
- Add XP to character's experience
- Check for level up
- Return new XP total and any level changes

#### Q-042: Grant gold on reward claim
- Add gold to character's currency
- Return new gold total

#### Q-043: Grant items on reward claim
- Add items to character's inventory
- Handle stack limits if applicable
- Return list of items granted

---

## Acceptance Criteria

### Quest Log
- [ ] `get_quest_log` returns objects with: name, description, objectives, rewards
- [ ] Frontend displays quest names instead of UUIDs
- [ ] Progress bars show objective completion

### Objective Tracking
- [ ] "Kill 3/10 goblins" updates correctly when progress changes
- [ ] Quest auto-completes when all objectives reach 100%
- [ ] UI reflects real-time objective progress

### Rewards
- [ ] Completing quest grants specified XP to character
- [ ] Completing quest grants specified gold to character
- [ ] Completing quest adds reward items to inventory
- [ ] Character stats visibly update after claiming rewards

---

## Implementation Notes

### Database Schema (Existing)
```sql
-- quests table
CREATE TABLE quests (
  id TEXT PRIMARY KEY,
  world_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  quest_giver TEXT,
  location TEXT,
  rewards_xp INTEGER,
  rewards_gold INTEGER,
  rewards_items TEXT -- JSON array
);

-- quest_log table (character's active/completed quests)
CREATE TABLE quest_log (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  started_at TEXT,
  completed_at TEXT
);

-- quest_objectives table
CREATE TABLE quest_objectives (
  id TEXT PRIMARY KEY,
  quest_id TEXT NOT NULL,
  description TEXT,
  target_count INTEGER DEFAULT 1,
  current_count INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0
);
```

### Testing Commands
After implementation, test with these prompts:
1. "Show me my quest log" → Should display quest names and progress
2. "Update goblin kill count to 5" → Should update objective
3. "Complete the goblin slayer quest" → Should grant rewards

---

## Getting Started

1. **Read the current implementation:**
   - `rpg-mcp/src/repos/quest.repo.ts`
   - `rpg-mcp/src/tools/quest.tools.ts`
   - `src/utils/toolResponseFormatter.ts`

2. **Understand the data flow:**
   - Frontend calls MCP tool via `mcpClient.ts`
   - Tool handler calls repo function
   - Repo queries SQLite and returns data
   - Tool formats response
   - Frontend formatter presents to UI

3. **Start with Q-001:**
   - Modify `getQuestLog()` to JOIN quest and objective tables
   - Test with direct MCP tool call
   - Proceed to Q-002 once data shape is correct

---

## Success Metrics

- No UUID-only responses in quest log
- All 13 tasks (Q-001 through Q-006, Q-020 through Q-024, Q-040 through Q-043) complete
- End-to-end flow: Create quest → Accept → Track progress → Complete → Claim rewards
