/**
 * modelRegistry.ts
 * Central registry mapping modelTag identifiers to creature model metadata
 */

import { CreatureArchetype, CreatureSize } from './ProceduralCreature';

export interface ModelDefinition {
  baseArchetype: CreatureArchetype;
  defaultSize: CreatureSize;
  defaultColor: string;
  description: string;
}

/**
 * Registry of all 25 creature models
 * modelTag → model metadata
 */
export const MODEL_REGISTRY: Record<string, ModelDefinition> = {
  // ===== HUMANOIDS (6) =====
  knight: {
    baseArchetype: 'humanoid',
    defaultSize: 'Medium',
    defaultColor: '#c0c0c0',
    description: 'Armored warrior with helmet'
  },
  wizard: {
    baseArchetype: 'humanoid',
    defaultSize: 'Medium',
    defaultColor: '#4a148c',
    description: 'Robed figure with staff'
  },
  rogue: {
    baseArchetype: 'humanoid',
    defaultSize: 'Medium',
    defaultColor: '#37474f',
    description: 'Hooded, crouched figure'
  },
  cleric: {
    baseArchetype: 'humanoid',
    defaultSize: 'Medium',
    defaultColor: '#ffd700',
    description: 'Robed with religious symbol'
  },
  goblin: {
    baseArchetype: 'humanoid',
    defaultSize: 'Small',
    defaultColor: '#558b2f',
    description: 'Small hunched humanoid'
  },
  orc: {
    baseArchetype: 'humanoid',
    defaultSize: 'Medium',
    defaultColor: '#4e342e',
    description: 'Bulky tusked humanoid'
  },

  // ===== BEASTS (5) =====
  wolf: {
    baseArchetype: 'quadruped',
    defaultSize: 'Medium',
    defaultColor: '#616161',
    description: 'Four-legged canine'
  },
  bear: {
    baseArchetype: 'beast',
    defaultSize: 'Large',
    defaultColor: '#5d4037',
    description: 'Heavy bulky beast'
  },
  horse: {
    baseArchetype: 'quadruped',
    defaultSize: 'Large',
    defaultColor: '#8d6e63',
    description: 'Ridable mount'
  },
  boar: {
    baseArchetype: 'quadruped',
    defaultSize: 'Medium',
    defaultColor: '#6d4c41',
    description: 'Tusked quadruped'
  },
  giant_rat: {
    baseArchetype: 'quadruped',
    defaultSize: 'Small',
    defaultColor: '#795548',
    description: 'Oversized rodent'
  },

  // ===== MONSTERS (8) =====
  dragon: {
    baseArchetype: 'avian',
    defaultSize: 'Large',
    defaultColor: '#8b0000',
    description: 'Winged serpent with legs'
  },
  skeleton: {
    baseArchetype: 'humanoid',
    defaultSize: 'Medium',
    defaultColor: '#efebe9',
    description: 'Bony humanoid'
  },
  zombie: {
    baseArchetype: 'beast',
    defaultSize: 'Medium',
    defaultColor: '#4e6157',
    description: 'Shambling undead'
  },
  spider: {
    baseArchetype: 'arachnid',
    defaultSize: 'Large',
    defaultColor: '#1a1a1a',
    description: '8-legged arachnid'
  },
  slime: {
    baseArchetype: 'amorphous',
    defaultSize: 'Medium',
    defaultColor: '#00e676',
    description: 'Amorphous blob'
  },
  troll: {
    baseArchetype: 'beast',
    defaultSize: 'Large',
    defaultColor: '#33691e',
    description: 'Large hunched monster'
  },
  beholder: {
    baseArchetype: 'amorphous',
    defaultSize: 'Large',
    defaultColor: '#7b1fa2',
    description: 'Floating eye sphere'
  },
  mimic: {
    baseArchetype: 'amorphous',
    defaultSize: 'Medium',
    defaultColor: '#5d4037',
    description: 'Box with teeth'
  },

  // ===== ELEMENTALS (4) =====
  fire_elemental: {
    baseArchetype: 'amorphous',
    defaultSize: 'Large',
    defaultColor: '#ff5722',
    description: 'Flame humanoid'
  },
  water_elemental: {
    baseArchetype: 'amorphous',
    defaultSize: 'Large',
    defaultColor: '#03a9f4',
    description: 'Watery blob'
  },
  earth_elemental: {
    baseArchetype: 'beast',
    defaultSize: 'Large',
    defaultColor: '#795548',
    description: 'Rocky humanoid'
  },
  air_elemental: {
    baseArchetype: 'amorphous',
    defaultSize: 'Large',
    defaultColor: '#b3e5fc',
    description: 'Wispy vortex'
  },

  // ===== UNIQUE (2) =====
  treant: {
    baseArchetype: 'beast',
    defaultSize: 'Huge',
    defaultColor: '#33691e',
    description: 'Walking tree'
  },
  ghost: {
    baseArchetype: 'humanoid',
    defaultSize: 'Medium',
    defaultColor: '#e0e0e0',
    description: 'Translucent humanoid'
  }
};

/**
 * Get all available model tags
 */
export function getAvailableModelTags(): string[] {
  return Object.keys(MODEL_REGISTRY);
}

/**
 * Get model definition by tag, or undefined if not found
 */
export function getModelDefinition(modelTag: string): ModelDefinition | undefined {
  return MODEL_REGISTRY[modelTag.toLowerCase()];
}

/**
 * Infer model tag from creature name
 */
export function inferModelTagFromName(name: string): string | undefined {
  const lowerName = name.toLowerCase();
  
  // Direct matches
  for (const tag of Object.keys(MODEL_REGISTRY)) {
    if (lowerName.includes(tag.replace('_', ' ')) || lowerName.includes(tag)) {
      return tag;
    }
  }
  
  // Fuzzy matches for common variations
  const fuzzyMap: Record<string, string> = {
    'paladin': 'knight',
    'fighter': 'knight',
    'warrior': 'knight',
    'mage': 'wizard',
    'sorcerer': 'wizard',
    'warlock': 'wizard',
    'thief': 'rogue',
    'assassin': 'rogue',
    'priest': 'cleric',
    'monk': 'cleric',
    'hound': 'wolf',
    'dire wolf': 'wolf',
    'worg': 'wolf',
    'grizzly': 'bear',
    'owlbear': 'bear',
    'rat': 'giant_rat',
    'drake': 'dragon',
    'wyrm': 'dragon',
    'wyvern': 'dragon',
    'undead': 'zombie',
    'ghoul': 'zombie',
    'ooze': 'slime',
    'jelly': 'slime',
    'cube': 'slime',
    'pudding': 'slime',
    'ogre': 'troll',
    'ettin': 'troll',
    'chest': 'mimic',
    'specter': 'ghost',
    'wraith': 'ghost',
    'phantom': 'ghost',
    'spirit': 'ghost',
    'tree': 'treant',
    'ent': 'treant'
  };
  
  for (const [pattern, tag] of Object.entries(fuzzyMap)) {
    if (lowerName.includes(pattern)) {
      return tag;
    }
  }
  
  return undefined;
}
