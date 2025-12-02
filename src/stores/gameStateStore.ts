import { create } from 'zustand';
import { dnd5eItems } from '../data/dnd5eItems';
import { parseMcpResponse, executeBatchToolCalls, debounce } from '../utils/mcpUtils';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  type: string;
  weight?: number;
  value?: number;
  equipped?: boolean;
}

export interface EnvironmentState {
  time_of_day?: string | any;
  weather?: string | any;
  temperature?: string | any;
  season?: string | any;
  date?: string | any;
  moon_phase?: string | any;
  lighting?: string | any;
  sunrise?: string | any;
  sunset?: string | any;
  forecast?: string | any;
  wind?: string | any;
  visibility?: string | any;
  atmospheric_pressure?: string | any;
  hazards?: string[];
  [key: string]: any;
}

export interface WorldState {
  location: string;
  time: string;
  weather: string;
  date: string;
  environment?: EnvironmentState;
  npcs?: { [key: string]: any };
  events?: { [key: string]: any };
  lastUpdated?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  author: 'player' | 'ai';
  timestamp: number;
}

export interface QuestObjective {
  id: string;
  description: string;
  type?: string;
  target?: string;
  current: number;
  required: number;
  completed: boolean;
  progress?: string;
}

export interface Quest {
  id: string;
  title: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  questGiver?: string;
  objectives: QuestObjective[];
  rewards: {
    experience?: number;
    gold?: number;
    items?: string[];
  };
  prerequisites?: string[];
}

export interface CharacterStats {
  id?: string;
  name: string;
  level: number;
  class: string;
  hp: { current: number; max: number };
  xp: { current: number; max: number };
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  equipment: {
    armor: string;
    weapons: string[];
    other: string[];
  };
}

interface GameState {
  inventory: InventoryItem[];
  worlds: any[];
  world: WorldState;
  notes: Note[];
  quests: Quest[];
  activeCharacter: CharacterStats | null;
  activeCharacterId: string | null;
  activeWorldId: string | null;
  party: CharacterStats[];
  isSyncing: boolean;
  lastSyncTime: number;

  setInventory: (items: InventoryItem[]) => void;
  setWorldState: (state: WorldState) => void;
  setNotes: (notes: Note[]) => void;
  setQuests: (quests: Quest[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
  setActiveCharacter: (char: CharacterStats | null) => void;
  setActiveCharacterId: (id: string | null) => void;
  setActiveWorldId: (id: string | null) => void;
  syncState: (force?: boolean) => Promise<void>;
}

/**
 * Parse rpg-mcp character JSON into CharacterStats format
 */
function parseCharacterFromJson(char: any): CharacterStats | null {
  try {
    if (!char || !char.name) return null;

    const level = char.level || 1;
    const xpForNextLevel = level * 1000;

    return {
      id: char.id,
      name: char.name,
      level: level,
      class: char.class || 'Adventurer',
      hp: {
        current: char.hp || 0,
        max: char.maxHp || char.hp || 0
      },
      xp: {
        current: char.experience || 0,
        max: xpForNextLevel
      },
      stats: {
        str: char.stats?.str || 10,
        dex: char.stats?.dex || 10,
        con: char.stats?.con || 10,
        int: char.stats?.int || 10,
        wis: char.stats?.wis || 10,
        cha: char.stats?.cha || 10
      },
      equipment: {
        armor: 'None',
        weapons: [],
        other: []
      }
    };
  } catch (error) {
    console.error('[parseCharacterFromJson] Failed to parse character:', error);
    return null;
  }
}

/**
 * Parse inventory data from rpg-mcp response
 */
function parseInventoryFromJson(inventoryData: any): InventoryItem[] {
  const items: InventoryItem[] = [];
  
  if (!inventoryData?.items || !Array.isArray(inventoryData.items)) {
    return items;
  }

  inventoryData.items.forEach((item: any, index: number) => {
    const fullItem = item.item || item; // handle detailed inventory format
    // Look up item details in reference database
    const itemName = fullItem.name || item.name || item.itemId || '';
    const refItemKey = Object.keys(dnd5eItems).find(
      k => k.toLowerCase() === itemName.toLowerCase()
    );
    const refItem = refItemKey ? dnd5eItems[refItemKey] : null;

    items.push({
      id: fullItem.id || item.id || item.itemId || `item-${index}`,
      name: refItem?.name || itemName || 'Unknown Item',
      description: refItem?.description || fullItem.description || '',
      quantity: item.quantity || 1,
      type: refItem?.type || fullItem.type || item.type || 'misc',
      weight: refItem?.weight || fullItem.weight || item.weight,
      value: refItem ? parseFloat(refItem.value?.replace(/[^0-9.]/g, '') || '0') : (fullItem.value ?? item.value),
      equipped: item.equipped || fullItem.equipped || false
    });
  });

  return items;
}

/**
 * Parse quest data from rpg-mcp response
 * Handles both new full quest format and legacy UUID-only format
 */
function parseQuestsFromResponse(questData: any): Quest[] {
  const quests: Quest[] = [];

  if (!questData) return quests;

  // New format: quests array with full data
  const questList = questData.quests || [];
  
  if (Array.isArray(questList)) {
    questList.forEach((quest: any, index: number) => {
      if (typeof quest === 'string') {
        // Legacy format - just a quest ID (shouldn't happen with new backend)
        quests.push({
          id: quest,
          title: `Quest ${quest.slice(0, 8)}...`,
          name: `Quest ${quest.slice(0, 8)}...`,
          description: 'Quest details unavailable',
          status: 'active',
          objectives: [],
          rewards: {}
        });
      } else if (quest && typeof quest === 'object') {
        // New format - full quest object
        const objectives: QuestObjective[] = (quest.objectives || []).map((obj: any) => ({
          id: obj.id || `obj-${index}`,
          description: obj.description || 'Unknown objective',
          type: obj.type,
          target: obj.target,
          current: obj.current || 0,
          required: obj.required || 1,
          completed: obj.completed || false,
          progress: obj.progress || `${obj.current || 0}/${obj.required || 1}`
        }));

        quests.push({
          id: quest.id || `quest-${index}`,
          title: quest.title || quest.name || 'Untitled Quest',
          name: quest.name || quest.title || 'Untitled Quest',
          description: quest.description || '',
          status: quest.status || 'active',
          questGiver: quest.questGiver || quest.giver,
          objectives,
          rewards: {
            experience: quest.rewards?.experience || 0,
            gold: quest.rewards?.gold || 0,
            items: quest.rewards?.items || []
          },
          prerequisites: quest.prerequisites || []
        });
      }
    });
  }

  // Also check for legacy activeQuests/completedQuests/failedQuests arrays
  ['activeQuests', 'completedQuests', 'failedQuests'].forEach(key => {
    const status = key === 'activeQuests' ? 'active' : key === 'completedQuests' ? 'completed' : 'failed';
    const legacyList = questData[key];
    
    if (Array.isArray(legacyList)) {
      legacyList.forEach((questId: string) => {
        // Only add if not already in quests array
        if (!quests.find(q => q.id === questId)) {
          quests.push({
            id: questId,
            title: `Quest ${questId.slice(0, 8)}...`,
            name: `Quest ${questId.slice(0, 8)}...`,
            description: 'Quest details unavailable (legacy format)',
            status: status as 'active' | 'completed' | 'failed',
            objectives: [],
            rewards: {}
          });
        }
      });
    }
  });

  return quests;
}

function parseWorldFromResponse(worldData: any): WorldState {
  if (!worldData) {
    return {
      location: 'Unknown',
      time: 'Unknown',
      weather: 'Unknown',
      date: 'Unknown',
      environment: {},
      npcs: {},
      events: {}
    };
  }

  return {
    location: worldData.name || worldData.location || 'Unknown',
    time: worldData.time || 'Unknown',
    weather: worldData.weather || 'Unknown',
    date: worldData.date || worldData.createdAt || 'Unknown',
    environment: worldData.environment || {},
    npcs: worldData.npcs || {},
    events: worldData.events || {},
    lastUpdated: worldData.updatedAt || new Date().toISOString()
  };
}

/**
 * Convert quests to notes for backward compatibility with Notes UI
 */
function questsToNotes(quests: Quest[]): Note[] {
  return quests.map(quest => {
    // Build content with objectives
    let content = quest.description;
    
    if (quest.objectives.length > 0) {
      content += '\n\n**Objectives:**\n';
      quest.objectives.forEach(obj => {
        const checkbox = obj.completed ? '✓' : '○';
        content += `${checkbox} ${obj.description} (${obj.progress || `${obj.current}/${obj.required}`})\n`;
      });
    }
    
    if (quest.rewards && (quest.rewards.experience || quest.rewards.gold || (quest.rewards.items && quest.rewards.items.length > 0))) {
      content += '\n**Rewards:**\n';
      if (quest.rewards.experience) content += `• ${quest.rewards.experience} XP\n`;
      if (quest.rewards.gold) content += `• ${quest.rewards.gold} gold\n`;
      if (quest.rewards.items?.length) content += `• Items: ${quest.rewards.items.join(', ')}\n`;
    }

    return {
      id: `quest-${quest.id}`,
      title: `${quest.status === 'completed' ? '✅' : quest.status === 'failed' ? '❌' : '📜'} ${quest.title}`,
      content,
      author: 'ai' as const,
      timestamp: Date.now()
    };
  });
}

export const useGameStateStore = create<GameState>((set, get) => ({
  inventory: [],
  worlds: [],
  world: {
    time: 'Unknown',
    location: 'Unknown',
    weather: 'Unknown',
    date: 'Unknown',
    environment: {},
    npcs: {},
    events: {}
  },
  notes: [],
  quests: [],
  activeCharacter: null,
  activeCharacterId: null,
  activeWorldId: null,
  party: [],
  isSyncing: false,
  lastSyncTime: 0,

  setInventory: (items) => set({ inventory: items }),
  setWorldState: (state) => set({ world: state }),
  setNotes: (notes) => set({ notes }),
  setQuests: (quests) => set({ quests }),
  setActiveCharacter: (char) => set({ activeCharacter: char }),
  setActiveCharacterId: (id) => set((state) => ({
    activeCharacterId: id,
    activeCharacter: state.party.find((c) => c.id === id) || state.activeCharacter
  })),
  setActiveWorldId: (id) => set({ activeWorldId: id }),

  addNote: (note) => set((state) => ({
    notes: [note, ...state.notes]
  })),

  updateNote: (id, content) => set((state) => ({
    notes: state.notes.map(n => n.id === id ? { ...n, content, timestamp: Date.now() } : n)
  })),

  deleteNote: (id) => set((state) => ({
    notes: state.notes.filter(n => n.id !== id)
  })),

  syncState: async (force = false) => {
    const { isSyncing, lastSyncTime, activeCharacterId: storedActiveCharId, activeWorldId: storedWorldId } = get();
    
    // Prevent concurrent syncs and rate limit to max once per 2 seconds unless forced
    if (isSyncing) {
      console.log('[GameStateStore] Sync already in progress, skipping');
      return;
    }
    
    const now = Date.now();
    if (!force && now - lastSyncTime < 2000) {
      console.log('[GameStateStore] Rate limited, skipping sync');
      return;
    }

    set({ isSyncing: true, lastSyncTime: now });

    try {
      const { mcpManager } = await import('../services/mcpClient');

      // Active character ID (string UUID in rpg-mcp)
      let activeCharId: string | null = storedActiveCharId || null;
      let activeWorldId: string | null = storedWorldId || null;

      // ============================================
      // 1. Fetch Characters from rpg-mcp
      // ============================================
      try {
        console.log('[GameStateStore] Listing characters...');

        const listResult = await mcpManager.gameStateClient.callTool('list_characters', {});
        console.log('[GameStateStore] Raw list_characters result:', listResult);

        // Parse using utility - handles both MCP wrapper and direct JSON
        const listData = parseMcpResponse<{ characters: any[]; count: number }>(
          listResult, 
          { characters: [], count: 0 }
        );
        
        console.log('[GameStateStore] Parsed characters data:', listData);
        console.log('[GameStateStore] Found', listData.count || listData.characters?.length || 0, 'characters');

        const characters = listData.characters || [];

        if (characters.length > 0) {
          // Parse all characters
          const allCharacters: CharacterStats[] = [];
          
          for (const char of characters) {
            const charData = parseCharacterFromJson(char);
            if (charData) {
              allCharacters.push(charData);
            }
          }

          console.log('[GameStateStore] Loaded', allCharacters.length, 'valid characters');

          if (allCharacters.length > 0) {
            // Use existing active character if still valid, otherwise use first
            const currentActiveId = activeCharId;
            const stillExists = currentActiveId && allCharacters.find(c => c.id === currentActiveId);
            const chosen = stillExists ? allCharacters.find(c => c.id === currentActiveId)! : allCharacters[0];
            
            set({
              activeCharacter: chosen,
              activeCharacterId: chosen.id || null,
              party: allCharacters
            });
            activeCharId = chosen.id || null;
          } else {
            set({ party: [], activeCharacter: null, activeCharacterId: null });
            activeCharId = null;
          }
        } else {
          console.log('[GameStateStore] No characters found in database');
          set({ party: [], activeCharacter: null, activeCharacterId: null });
          activeCharId = null;
        }
      } catch (e) {
        console.warn('[GameStateStore] Failed to fetch character list:', e);
      }

      if (activeCharId) {
        console.log('[GameStateStore] Syncing data for character ID:', activeCharId);

        // ============================================
        // 2. Batch fetch inventory and quests in parallel
        // ============================================
        const batchResults = await executeBatchToolCalls(mcpManager.gameStateClient, [
          { name: 'get_inventory_detailed', args: { characterId: activeCharId } },
          { name: 'get_quest_log', args: { characterId: activeCharId } }
        ]);

        // Process inventory result
        const inventoryResult = batchResults.find(r => r.name === 'get_inventory_detailed');
        if (inventoryResult && !inventoryResult.error) {
          const inventoryData = parseMcpResponse<any>(inventoryResult.result, null);
          
          if (inventoryData) {
            const items = parseInventoryFromJson(inventoryData);
            console.log('[GameStateStore] Parsed', items.length, 'inventory items');
            
            set((state) => {
              // Update equipment from inventory if available
              let newActiveCharacter = state.activeCharacter;
              
              if (newActiveCharacter) {
                let armor = newActiveCharacter.equipment?.armor || 'None';
                let weapons: string[] = newActiveCharacter.equipment?.weapons || [];
                let other: string[] = newActiveCharacter.equipment?.other || [];

                if (inventoryData.equipment) {
                  const equipment = inventoryData.equipment;
                  armor = equipment.armor || armor;
                  weapons = [equipment.mainhand, equipment.offhand].filter(Boolean);
                  other = [equipment.head, equipment.feet, equipment.accessory].filter(Boolean);
                } else {
                  const equippedItems = items.filter(i => i.equipped);
                  const armorItem = equippedItems.find(i => (i.type || '').toLowerCase() === 'armor');
                  const weaponItems = equippedItems.filter(i => (i.type || '').toLowerCase() === 'weapon');
                  if (armorItem) armor = armorItem.name;
                  if (weaponItems.length > 0) weapons = weaponItems.map(w => w.name);
                }

                newActiveCharacter = {
                  ...newActiveCharacter,
                  equipment: { armor, weapons, other }
                };
              }
              
              return {
                inventory: items,
                activeCharacter: newActiveCharacter
              };
            });
          }
        } else if (inventoryResult?.error) {
          console.warn('[GameStateStore] Inventory fetch error:', inventoryResult.error);
        }

        // Process quest result
        const questResult = batchResults.find(r => r.name === 'get_quest_log');
        if (questResult && !questResult.error) {
          const questData = parseMcpResponse<any>(questResult.result, null);
          
          if (questData) {
            const quests = parseQuestsFromResponse(questData);
            console.log('[GameStateStore] Parsed', quests.length, 'quests');
            
            // Convert quests to notes for UI display
            const questNotes = questsToNotes(quests);
            
            set({ 
              quests,
              notes: questNotes
            });
          }
        } else if (questResult?.error) {
          console.warn('[GameStateStore] Quest fetch error:', questResult.error);
        }
      } else {
        console.log('[GameStateStore] No active character ID, skipping inventory/quest sync');
        set({ inventory: [], quests: [], notes: [] });
      }

      // ============================================
      // 3. Fetch Worlds and active world state
      // ============================================
      try {
        const worldsResult = await mcpManager.gameStateClient.callTool('list_worlds', {});
        const worldsData = parseMcpResponse<any>(worldsResult, { worlds: [], count: 0 });
        const worlds = worldsData.worlds || [];
        set({ worlds });

        if (worlds.length > 0) {
          const existingWorld = activeWorldId && worlds.find((w: any) => w.id === activeWorldId);
          const chosenWorld = existingWorld || worlds[0];
          activeWorldId = chosenWorld.id || null;
          set({ activeWorldId });

          // Fetch detailed world info
          let worldDetails: any = null;
          try {
            worldDetails = await mcpManager.gameStateClient.callTool('get_world', { id: chosenWorld.id });
          } catch (err) {
            console.warn('[GameStateStore] get_world failed, trying get_world_state', err);
            try {
              worldDetails = await mcpManager.gameStateClient.callTool('get_world_state', { worldId: chosenWorld.id });
            } catch (err2) {
              console.warn('[GameStateStore] get_world_state failed:', err2);
            }
          }

          if (worldDetails) {
            const parsedWorld = parseWorldFromResponse(parseMcpResponse<any>(worldDetails, worldDetails));
            set({ world: parsedWorld });
          } else {
            set({ world: parseWorldFromResponse(chosenWorld) });
          }
        } else {
          set({ world: parseWorldFromResponse(null), activeWorldId: null });
        }
      } catch (e) {
        console.warn('[GameStateStore] Failed to fetch worlds:', e);
      }

      console.log('[GameStateStore] Sync complete');

    } catch (error) {
      console.error('[GameStateStore] Error syncing game state:', error);
    } finally {
      set({ isSyncing: false });
    }
  }
}));

// Export debounced sync for use in components
export const debouncedSyncState = debounce(() => {
  useGameStateStore.getState().syncState();
}, 1000);
