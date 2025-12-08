/**
 * Starting equipment for D&D 5e classes by level tier.
 * Maps class name to arrays of item IDs for starting gear.
 * 
 * Level tiers:
 * - Level 1-4: Basic starting gear
 * - Level 5-10: Upgraded gear  
 * - Level 11+: Advanced gear
 */

export interface StartingGear {
  weapons: string[];
  armor: string[];
  gear: string[];
  gold: number;
}

export interface ClassStartingGear {
  level1: StartingGear;
  level5: StartingGear;
  level11: StartingGear;
}

// Item IDs should match items in the dnd5eItems database or be created
export const CLASS_STARTING_GEAR: Record<string, ClassStartingGear> = {
  Fighter: {
    level1: {
      weapons: ['longsword', 'shield', 'handaxe'],
      armor: ['chain-mail'],
      gear: ['explorers-pack', 'javelin'],
      gold: 10
    },
    level5: {
      weapons: ['longsword+1', 'shield', 'longbow'],
      armor: ['plate-armor'],
      gear: ['explorers-pack', 'javelin', 'potion-of-healing'],
      gold: 50
    },
    level11: {
      weapons: ['longsword+2', 'shield+1', 'longbow+1'],
      armor: ['plate-armor+1'],
      gear: ['explorers-pack', 'potion-of-greater-healing', 'potion-of-healing'],
      gold: 200
    }
  },
  
  Wizard: {
    level1: {
      weapons: ['quarterstaff', 'dagger'],
      armor: [],
      gear: ['scholars-pack', 'spellbook', 'component-pouch'],
      gold: 15
    },
    level5: {
      weapons: ['quarterstaff', 'dagger+1'],
      armor: [],
      gear: ['scholars-pack', 'spellbook', 'pearl-of-power'],
      gold: 75
    },
    level11: {
      weapons: ['staff-of-power'],
      armor: ['robe-of-the-archmagi'],
      gear: ['spellbook', 'pearl-of-power'],
      gold: 300
    }
  },
  
  Rogue: {
    level1: {
      weapons: ['shortsword', 'shortbow', 'dagger'],
      armor: ['leather-armor'],
      gear: ['burglars-pack', 'thieves-tools'],
      gold: 15
    },
    level5: {
      weapons: ['shortsword+1', 'shortbow', 'dagger', 'dagger'],
      armor: ['studded-leather'],
      gear: ['burglars-pack', 'thieves-tools', 'potion-of-invisibility'],
      gold: 100
    },
    level11: {
      weapons: ['rapier+2', 'shortbow+1'],
      armor: ['studded-leather+1'],
      gear: ['thieves-tools', 'cloak-of-elvenkind', 'boots-of-elvenkind'],
      gold: 400
    }
  },
  
  Cleric: {
    level1: {
      weapons: ['mace', 'shield'],
      armor: ['scale-mail'],
      gear: ['priests-pack', 'holy-symbol'],
      gold: 15
    },
    level5: {
      weapons: ['mace+1', 'shield'],
      armor: ['half-plate'],
      gear: ['priests-pack', 'holy-symbol', 'potion-of-healing', 'potion-of-healing'],
      gold: 75
    },
    level11: {
      weapons: ['mace+2', 'shield+1'],
      armor: ['plate-armor'],
      gear: ['holy-symbol', 'staff-of-healing'],
      gold: 300
    }
  },
  
  Ranger: {
    level1: {
      weapons: ['longbow', 'shortsword', 'shortsword'],
      armor: ['leather-armor'],
      gear: ['explorers-pack', 'quiver'],
      gold: 10
    },
    level5: {
      weapons: ['longbow+1', 'shortsword', 'shortsword'],
      armor: ['studded-leather'],
      gear: ['explorers-pack', 'quiver', 'cloak-of-elvenkind'],
      gold: 75
    },
    level11: {
      weapons: ['oathbow', 'scimitar+1', 'scimitar+1'],
      armor: ['studded-leather+1'],
      gear: ['quiver', 'boots-of-elvenkind'],
      gold: 350
    }
  },
  
  Paladin: {
    level1: {
      weapons: ['longsword', 'shield'],
      armor: ['chain-mail'],
      gear: ['priests-pack', 'holy-symbol'],
      gold: 15
    },
    level5: {
      weapons: ['longsword+1', 'shield'],
      armor: ['plate-armor'],
      gear: ['priests-pack', 'holy-symbol', 'potion-of-healing'],
      gold: 75
    },
    level11: {
      weapons: ['holy-avenger'],
      armor: ['plate-armor+1'],
      gear: ['holy-symbol'],
      gold: 350
    }
  },
  
  Barbarian: {
    level1: {
      weapons: ['greataxe', 'handaxe', 'handaxe'],
      armor: [],
      gear: ['explorers-pack', 'javelin'],
      gold: 10
    },
    level5: {
      weapons: ['greataxe+1', 'handaxe', 'handaxe'],
      armor: [],
      gear: ['explorers-pack', 'potion-of-healing'],
      gold: 50
    },
    level11: {
      weapons: ['greataxe+2'],
      armor: ['belt-of-giant-strength'],
      gear: ['potion-of-greater-healing'],
      gold: 250
    }
  },
  
  Bard: {
    level1: {
      weapons: ['rapier', 'dagger'],
      armor: ['leather-armor'],
      gear: ['entertainers-pack', 'lute'],
      gold: 15
    },
    level5: {
      weapons: ['rapier+1', 'dagger'],
      armor: ['studded-leather'],
      gear: ['entertainers-pack', 'instrument-of-the-bards'],
      gold: 100
    },
    level11: {
      weapons: ['rapier+2'],
      armor: ['studded-leather+1'],
      gear: ['instrument-of-the-bards-canaith'],
      gold: 400
    }
  },
  
  Druid: {
    level1: {
      weapons: ['scimitar', 'quarterstaff'],
      armor: ['leather-armor', 'wooden-shield'],
      gear: ['explorers-pack', 'druidic-focus'],
      gold: 10
    },
    level5: {
      weapons: ['scimitar+1', 'quarterstaff'],
      armor: ['hide-armor+1'],
      gear: ['explorers-pack', 'staff-of-the-woodlands'],
      gold: 75
    },
    level11: {
      weapons: ['scimitar+2'],
      armor: [],
      gear: ['staff-of-the-woodlands'],
      gold: 300
    }
  },
  
  Monk: {
    level1: {
      weapons: ['shortsword', 'dart', 'dart', 'dart'],
      armor: [],
      gear: ['explorers-pack'],
      gold: 5
    },
    level5: {
      weapons: ['shortsword+1', 'dart', 'dart', 'dart'],
      armor: [],
      gear: ['explorers-pack', 'potion-of-healing'],
      gold: 50
    },
    level11: {
      weapons: ['shortsword+2'],
      armor: ['bracers-of-defense'],
      gear: ['cloak-of-protection'],
      gold: 200
    }
  },
  
  Sorcerer: {
    level1: {
      weapons: ['light-crossbow', 'dagger', 'dagger'],
      armor: [],
      gear: ['dungeoneers-pack', 'component-pouch'],
      gold: 15
    },
    level5: {
      weapons: ['light-crossbow', 'dagger+1'],
      armor: [],
      gear: ['dungeoneers-pack', 'component-pouch', 'wand-of-magic-missiles'],
      gold: 100
    },
    level11: {
      weapons: ['staff-of-fire'],
      armor: ['cloak-of-protection'],
      gear: ['component-pouch'],
      gold: 400
    }
  },
  
  Warlock: {
    level1: {
      weapons: ['light-crossbow', 'dagger'],
      armor: ['leather-armor'],
      gear: ['dungeoneers-pack', 'arcane-focus'],
      gold: 10
    },
    level5: {
      weapons: ['light-crossbow', 'dagger+1'],
      armor: ['studded-leather'],
      gear: ['dungeoneers-pack', 'rod-of-the-pact-keeper'],
      gold: 75
    },
    level11: {
      weapons: ['rod-of-the-pact-keeper+2'],
      armor: ['studded-leather+1'],
      gear: ['cloak-of-protection'],
      gold: 300
    }
  },
  
  Artificer: {
    level1: {
      weapons: ['light-crossbow', 'handaxe'],
      armor: ['studded-leather'],
      gear: ['dungeoneers-pack', 'thieves-tools', 'artisans-tools'],
      gold: 15
    },
    level5: {
      weapons: ['light-crossbow+1', 'handaxe'],
      armor: ['half-plate'],
      gear: ['dungeoneers-pack', 'thieves-tools', 'bag-of-holding'],
      gold: 100
    },
    level11: {
      weapons: ['light-crossbow+2'],
      armor: ['plate-armor'],
      gear: ['bag-of-holding', 'goggles-of-night'],
      gold: 350
    }
  }
};

/**
 * Get starting gear for a character based on class and level
 */
export function getStartingGear(className: string, level: number): StartingGear {
  const classGear = CLASS_STARTING_GEAR[className];
  
  if (!classGear) {
    // Default gear for unknown classes
    return {
      weapons: ['dagger'],
      armor: [],
      gear: ['explorers-pack'],
      gold: 10
    };
  }
  
  if (level >= 11) {
    return classGear.level11;
  } else if (level >= 5) {
    return classGear.level5;
  } else {
    return classGear.level1;
  }
}

/**
 * Get all item IDs from starting gear
 */
export function getStartingItemIds(gear: StartingGear): string[] {
  return [...gear.weapons, ...gear.armor, ...gear.gear];
}
