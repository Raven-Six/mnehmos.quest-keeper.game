import React from 'react';
import { useGameStateStore } from '../../stores/gameStateStore';
import { useHudStore } from '../../stores/hudStore';
import { useChatStore } from '../../stores/chatStore';

/**
 * Slide-out Inventory Drawer.
 * Connects to `gameStateStore.inventory`.
 * Clicking an item likely prepares "I use [Item]" in chat.
 */
export const InventoryDrawer: React.FC = () => {
  const isOpen = useHudStore(s => s.isInventoryOpen);
  const toggleInventory = useHudStore(s => s.toggleInventory);
  
  const inventory = useGameStateStore(s => s.inventory);
  const activeCharacter = useGameStateStore(s => s.activeCharacter);
  
  const setInput = useChatStore(s => s.setInput); // Assuming we want to populate chat input (need check if this exists in store or just component)
  // Actually chat input state is local to ChatInput.tsx typically.
  // We might need a global "intent" store or just let the user type active items.
  // For now, we'll just display.

  if (!isOpen) return null;

  return (
    <div className="w-80 h-full bg-black/90 border-l border-white/20 backdrop-blur-xl p-6 pointer-events-auto animate-slide-in-right overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-lg font-mono text-white">Inventory</h2>
         <button 
           onClick={toggleInventory}
           className="text-white/50 hover:text-white"
         >
           Close
         </button>
      </div>
      
      {!activeCharacter ? (
        <div className="text-white/40 italic">No character selected.</div>
      ) : (
        <div className="space-y-4">
           {/* Equipment Section (Mockup) */}
           <div className="mb-4">
             <h3 className="text-xs uppercase text-indigo-400 mb-2 font-bold">Equipped</h3>
             {/* We can pull this from activeCharacter.equipment */}
             <div className="grid grid-cols-2 gap-2 text-sm text-white/80">
                <div className="p-2 bg-white/5 rounded">
                  <div className="text-[10px] text-white/40">Main Hand</div>
                  {activeCharacter.equipment?.weapons?.[0] || 'Empty'}
                </div>
                <div className="p-2 bg-white/5 rounded">
                    <div className="text-[10px] text-white/40">Armor</div>
                    {activeCharacter.equipment?.armor || 'None'}
                </div>
             </div>
           </div>

           {/* Items List */}
           <h3 className="text-xs uppercase text-indigo-400 mb-2 font-bold">Backpack</h3>
           {inventory.length === 0 ? (
             <div className="text-center py-8 text-white/20 border border-dashed border-white/10 rounded">
               Empty Backpack
             </div>
           ) : (
             <ul className="space-y-1">
               {inventory.map((item, i) => (
                 <li 
                   key={item.id || i}
                   onClick={() => console.log('Clicked item', item.name)}
                   className="flex justify-between items-center p-2 rounded bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
                 >
                   <span className="text-sm text-gray-200">{item.name}</span>
                   <div className="flex items-center gap-2">
                     <span className="text-xs text-indigo-300 font-mono">x{item.quantity}</span>
                   </div>
                   
                   {/* Hover Tooltip/Action could go here */}
                 </li>
               ))}
             </ul>
           )}
        </div>
      )}
    </div>
  );
};
