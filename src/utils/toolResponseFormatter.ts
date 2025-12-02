/**
 * Format MCP tool responses into beautiful markdown
 */

interface Character {
    id: string;
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    ac: number;
    stats?: {
        str: number;
        dex: number;
        con: number;
        int: number;
        wis: number;
        cha: number;
    };
    behavior?: string;
}

interface InventoryItem {
    itemId: string;
    quantity: number;
    equipped: boolean;
}

interface Item {
    id: string;
    name: string;
    type: string;
    description?: string;
    value?: number;
    weight?: number;
}

/**
 * Format a list of characters into a beautiful markdown table
 */
export function formatCharacterList(data: any): string {
    if (!data.characters || data.characters.length === 0) {
        return '> No characters found in the database.';
    }

    const characters: Character[] = data.characters;
    
    let markdown = `## 🎭 Characters (${data.count})\n\n`;
    
    characters.forEach((char, index) => {
        const statLine = char.stats 
            ? `💪 **STR** ${char.stats.str} | 🏃 **DEX** ${char.stats.dex} | ❤️ **CON** ${char.stats.con} | 🧠 **INT** ${char.stats.int} | 🦉 **WIS** ${char.stats.wis} | 💬 **CHA** ${char.stats.cha}`
            : '';

        markdown += `### ${index + 1}. ${char.name}\n\n`;
        markdown += `**Level ${char.level}** | `;
        markdown += `HP: \`${char.hp}/${char.maxHp}\` | `;
        markdown += `AC: \`${char.ac}\`\n\n`;
        
        if (statLine) {
            markdown += `${statLine}\n\n`;
        }
        
        if (char.behavior) {
            markdown += `> *${char.behavior}*\n\n`;
        }
        
        markdown += `---\n\n`;
    });

    return markdown;
}

/**
 * Format a single character into detailed markdown
 */
export function formatCharacter(char: Character): string {
    let markdown = `## 🎭 ${char.name}\n\n`;
    
    markdown += `**Level ${char.level}** | `;
    markdown += `HP: \`${char.hp}/${char.maxHp}\` | `;
    markdown += `AC: \`${char.ac}\`\n\n`;
    
    if (char.stats) {
        markdown += `### 📊 Ability Scores\n\n`;
        markdown += `| Ability | Score | Modifier |\n`;
        markdown += `|---------|-------|----------|\n`;
        markdown += `| 💪 Strength | ${char.stats.str} | ${formatModifier(char.stats.str)} |\n`;
        markdown += `| 🏃 Dexterity | ${char.stats.dex} | ${formatModifier(char.stats.dex)} |\n`;
        markdown += `| ❤️ Constitution | ${char.stats.con} | ${formatModifier(char.stats.con)} |\n`;
        markdown += `| 🧠 Intelligence | ${char.stats.int} | ${formatModifier(char.stats.int)} |\n`;
        markdown += `| 🦉 Wisdom | ${char.stats.wis} | ${formatModifier(char.stats.wis)} |\n`;
        markdown += `| 💬 Charisma | ${char.stats.cha} | ${formatModifier(char.stats.cha)} |\n\n`;
    }
    
    if (char.behavior) {
        markdown += `### 📖 Behavior\n\n`;
        markdown += `> ${char.behavior}\n\n`;
    }

    return markdown;
}

/**
 * Format inventory into beautiful markdown
 * If itemIds are provided, will attempt to look up names from a local cache
 */
export function formatInventory(data: any, itemCache?: Map<string, Item>): string {
    if (!data.items || data.items.length === 0) {
        return '> 🎒 Inventory is empty.';
    }

    const items: InventoryItem[] = data.items;
    const capacity = data.capacity || 100;
    const usedSlots = items.reduce((sum, item) => sum + item.quantity, 0);

    let markdown = `## 🎒 Inventory (${usedSlots}/${capacity})\n\n`;

    // Group items by equipped status
    const equippedItems = items.filter(item => item.equipped);
    const unequippedItems = items.filter(item => !item.equipped);

    if (equippedItems.length > 0) {
        markdown += `### ⚔️ Equipped\n\n`;
        equippedItems.forEach(item => {
            const detail = itemCache?.get(item.itemId);
            const name = detail?.name || guessItemName(item.itemId);
            const icon = getItemIcon(detail?.type || 'misc');
            
            markdown += `- ${icon} **${name}**`;
            if (item.quantity > 1) markdown += ` ×${item.quantity}`;
            if (detail?.description) markdown += `\n  > *${detail.description}*`;
            markdown += `\n`;
        });
        markdown += `\n`;
    }

    if (unequippedItems.length > 0) {
        markdown += `### 📦 Unequipped\n\n`;
        unequippedItems.forEach(item => {
            const detail = itemCache?.get(item.itemId);
            const name = detail?.name || guessItemName(item.itemId);
            const icon = getItemIcon(detail?.type || 'misc');
            
            markdown += `- ${icon} **${name}**`;
            if (item.quantity > 1) markdown += ` ×${item.quantity}`;
            if (detail?.description) markdown += `\n  > *${detail.description}*`;
            markdown += `\n`;
        });
        markdown += `\n`;
    }

    // Currency
    if (data.currency) {
        const { gold = 0, silver = 0, copper = 0 } = data.currency;
        if (gold > 0 || silver > 0 || copper > 0) {
            markdown += `### 💰 Currency\n\n`;
            if (gold > 0) markdown += `- 🟡 **${gold}** gold\n`;
            if (silver > 0) markdown += `- ⚪ **${silver}** silver\n`;
            if (copper > 0) markdown += `- 🟤 **${copper}** copper\n`;
        }
    }

    return markdown;
}

/**
 * Format quest log into markdown
 */
export function formatQuestLog(data: any): string {
    if (!data.quests || data.quests.length === 0) {
        return '> 📜 No active quests.';
    }

    let markdown = `## 📜 Quest Log\n\n`;

    data.quests.forEach((quest: any, index: number) => {
        const statusIcon = quest.status === 'completed' ? '✅' : quest.status === 'failed' ? '❌' : '🔄';
        
        markdown += `### ${statusIcon} ${quest.title || 'Untitled Quest'}\n\n`;
        
        if (quest.description) {
            markdown += `${quest.description}\n\n`;
        }

        if (quest.objectives && quest.objectives.length > 0) {
            markdown += `**Objectives:**\n\n`;
            quest.objectives.forEach((obj: any) => {
                const done = obj.completed || obj.current >= obj.required;
                const checkbox = done ? '[x]' : '[ ]';
                const progress = obj.required ? ` (${obj.current}/${obj.required})` : '';
                markdown += `- ${checkbox} ${obj.description}${progress}\n`;
            });
            markdown += `\n`;
        }

        if (quest.rewards) {
            markdown += `**Rewards:**\n`;
            if (quest.rewards.experience) markdown += `- 🌟 ${quest.rewards.experience} XP\n`;
            if (quest.rewards.gold) markdown += `- 💰 ${quest.rewards.gold} gold\n`;
            if (quest.rewards.items && quest.rewards.items.length > 0) {
                markdown += `- 🎁 Items: ${quest.rewards.items.join(', ')}\n`;
            }
            markdown += `\n`;
        }

        markdown += `---\n\n`;
    });

    return markdown;
}

/**
 * Format encounter/combat state
 */
export function formatEncounter(data: any): string {
    if (!data) {
        return '> ⚔️ No active encounter.';
    }

    let markdown = `## ⚔️ Combat Encounter\n\n`;
    
    markdown += `**Round:** ${data.round || 1}\n\n`;

    if (data.participants && data.participants.length > 0) {
        markdown += `### 🎯 Initiative Order\n\n`;
        
        const sorted = [...data.participants].sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
        
        sorted.forEach((p: any, index: number) => {
            const isCurrent = p.id === data.currentTurn;
            const marker = isCurrent ? '👉 ' : '　 ';
            const statusIcon = p.hp <= 0 ? '💀' : p.hp < p.maxHp / 2 ? '🩹' : '💚';
            
            markdown += `${marker}**${index + 1}.** ${p.name} ${statusIcon}\n`;
            markdown += `　　Initiative: \`${p.initiative || 0}\` | HP: \`${p.hp}/${p.maxHp}\``;
            
            if (p.conditions && p.conditions.length > 0) {
                markdown += ` | 🎭 ${p.conditions.join(', ')}`;
            }
            
            markdown += `\n\n`;
        });
    }

    return markdown;
}

/**
 * Auto-detect response type and format accordingly
 */
export function formatToolResponse(toolName: string, response: any): string {
    try {
        // Parse if string
        const data = typeof response === 'string' ? JSON.parse(response) : response;
        
        // Extract from MCP wrapper if present
        const actualData = data.content?.[0]?.text 
            ? JSON.parse(data.content[0].text)
            : data;

        // Detect and format based on tool name or data structure
        if (toolName === 'list_characters' || actualData.characters) {
            return formatCharacterList(actualData);
        }
        
        if (toolName === 'get_character' && actualData.name) {
            return formatCharacter(actualData);
        }
        
        if (toolName === 'get_inventory' || actualData.items) {
            return formatInventory(actualData);
        }
        
        if (toolName === 'get_quest_log' || actualData.quests) {
            return formatQuestLog(actualData);
        }
        
        if (toolName === 'get_encounter_state' || actualData.participants) {
            return formatEncounter(actualData);
        }

        // Fallback: pretty-print JSON
        return `\`\`\`json\n${JSON.stringify(actualData, null, 2)}\n\`\`\``;
        
    } catch (e) {
        // If parsing fails, return as-is
        return typeof response === 'string' ? response : JSON.stringify(response, null, 2);
    }
}

/**
 * Helper: Calculate D&D ability modifier
 */
function formatModifier(score: number): string {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Helper: Get emoji icon for item type
 */
function getItemIcon(type: string): string {
    const icons: Record<string, string> = {
        weapon: '⚔️',
        armor: '🛡️',
        consumable: '🧪',
        quest: '📜',
        artifact: '💎',
        tool: '🔧',
        misc: '📦',
    };
    return icons[type.toLowerCase()] || '📦';
}

/**
 * Helper: Guess item name from UUID (used when item details aren't available)
 */
function guessItemName(itemId: string): string {
    // Known LOTR items by UUID prefix (from the Fellowship setup)
    const knownItems: Record<string, string> = {
        '46575824': '💍 The One Ring',
        '6d0b75e2': '🗡️ Sting',
        '7d83ac9a': '🛡️ Mithril Coat',
    };

    const prefix = itemId.substring(0, 8);
    if (knownItems[prefix]) {
        return knownItems[prefix];
    }

    return `Item ${prefix}`;
}
