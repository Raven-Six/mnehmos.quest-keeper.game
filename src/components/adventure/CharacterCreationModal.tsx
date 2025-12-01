import React, { useState } from 'react';
import { mcpManager } from '../../services/mcpClient';
import { useGameStateStore } from '../../stores/gameStateStore';

interface CharacterCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [charClass, setCharClass] = useState('Fighter');
    const [level, setLevel] = useState(1);
    const [loading, setLoading] = useState(false);
    const syncState = useGameStateStore((state) => state.syncState);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const levelNum = Number(level);
            console.log('[CharacterCreationModal] Creating character:', {
                name,
                class: charClass,
                level: levelNum,
                levelType: typeof levelNum
            });

            const result = await mcpManager.gameStateClient.callTool('create_character', {
                name,
                class: charClass,
                level: levelNum,
            });

            console.log('[CharacterCreationModal] Character creation result:', result);

            // Extract character ID from result
            let characterId: number | null = null;
            if (result?.content?.[0]?.text) {
                const idMatch = result.content[0].text.match(/ID:\s*(\d+)/);
                if (idMatch) {
                    characterId = parseInt(idMatch[1]);
                    console.log('[CharacterCreationModal] Extracted character ID:', characterId);
                }
            }

            // Workaround: Backend ignores level parameter, so update it manually
            if (characterId && levelNum > 1) {
                console.log('[CharacterCreationModal] Updating character level to:', levelNum);
                await mcpManager.gameStateClient.callTool('update_character', {
                    character_id: characterId,
                    level: levelNum,
                });
                console.log('[CharacterCreationModal] Level updated successfully');
            }

            // Refresh character list
            console.log('[CharacterCreationModal] Syncing state...');
            await syncState();
            console.log('[CharacterCreationModal] State synced successfully');

            alert(`✅ ${name} created successfully!`);

            setName('');
            setCharClass('Fighter');
            setLevel(1);
            onClose();
        } catch (error) {
            console.error('[CharacterCreationModal] Error creating character:', error);
            alert('❌ Failed to create character: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-terminal-black border-2 border-terminal-green rounded-lg p-6 w-full max-w-md shadow-[0_0_30px_rgba(0,255,0,0.3)]">
                <h2 className="text-2xl font-bold text-terminal-green mb-4">⚔️ CREATE CHARACTER</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-terminal-green mb-1">NAME</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black border border-terminal-green text-terminal-green px-3 py-2 rounded focus:outline-none focus:border-terminal-green-bright"
                            placeholder="Enter character name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-terminal-green mb-1">CLASS</label>
                        <select
                            value={charClass}
                            onChange={(e) => setCharClass(e.target.value)}
                            className="w-full bg-black border border-terminal-green text-terminal-green px-3 py-2 rounded focus:outline-none focus:border-terminal-green-bright"
                        >
                            <option value="Fighter">Fighter</option>
                            <option value="Wizard">Wizard</option>
                            <option value="Rogue">Rogue</option>
                            <option value="Cleric">Cleric</option>
                            <option value="Ranger">Ranger</option>
                            <option value="Paladin">Paladin</option>
                            <option value="Barbarian">Barbarian</option>
                            <option value="Druid">Druid</option>
                            <option value="Bard">Bard</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-terminal-green mb-1">
                            LEVEL: <span className="text-terminal-green-bright">{level}</span>
                        </label>
                        <input
                            type="range"
                            value={level}
                            onChange={(e) => setLevel(parseInt(e.target.value))}
                            min="1"
                            max="20"
                            className="w-full h-2 bg-terminal-green/20 rounded-lg appearance-none cursor-pointer accent-terminal-green"
                        />
                        <div className="flex justify-between text-xs text-terminal-green/60 mt-1">
                            <span>1</span>
                            <span>10</span>
                            <span>20</span>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-terminal-green text-black px-4 py-2 rounded font-bold hover:bg-terminal-green-bright transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-terminal-amber/20 border border-terminal-amber text-terminal-amber px-4 py-2 rounded hover:bg-terminal-amber/30 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
