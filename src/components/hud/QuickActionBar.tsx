import React from 'react';
import { useHudStore } from '../../stores/hudStore';

/**
 * Bottom action bar for quick intent buttons.
 * Example: "Inventory", "Status", "End Turn".
 */
export const QuickActionBar: React.FC = () => {
    const toggleInventory = useHudStore(s => s.toggleInventory);
    
    // Note: In a real implementation we would want a callback 
    // to inject text into the ChatInput, but for now we'll just handle UI toggles
    
    return (
        <div className="flex gap-2 p-2 bg-black/60 rounded-xl backdrop-blur-md border border-white/10">
            <ActionButton label="Inventory" icon="🎒" onClick={toggleInventory} />
            <ActionButton label="Melee Attack" icon="⚔️" onClick={() => {}} />
            <ActionButton label="Cast Spell" icon="🔮" onClick={() => {}} />
            <ActionButton label="End Turn" icon="⏳" onClick={() => {}} secondary />
        </div>
    );
};

interface ActionButtonProps {
    label: string;
    icon: string;
    onClick: () => void;
    secondary?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, icon, onClick, secondary }) => (
    <button 
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center
        w-20 h-16 rounded-lg transition-all
        ${secondary 
           ? 'bg-red-900/40 hover:bg-red-800/60 border border-red-500/30' 
           : 'bg-white/5 hover:bg-white/10 border border-white/10'}
        active:scale-95
      `}
    >
        <span className="text-2xl mb-1">{icon}</span>
        <span className="text-[10px] font-bold text-white/80 uppercase tracking-tight">{label}</span>
    </button>
);
