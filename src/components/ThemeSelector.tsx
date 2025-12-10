import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const baseButtonClasses = "relative p-3 rounded border text-left transition-all duration-200";
  const activeClasses = "border-terminal-green-bright ring-1 ring-terminal-green-bright bg-terminal-green/10";
  const inactiveClasses = "border-terminal-green-dim hover:border-terminal-green/50 bg-terminal-dim";

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-terminal-green">VISUAL THEME</label>
      <div className="grid grid-cols-3 gap-3">
        {/* Terminal Option */}
        <button
          onClick={() => setTheme('terminal')}
          className={`${baseButtonClasses} ${theme === 'terminal' ? activeClasses : inactiveClasses}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💻</span>
            <span className="font-bold text-sm text-terminal-green">Terminal</span>
          </div>
          <div className="h-2 w-full bg-[#0a0a0a] border border-[#00ff41] rounded-sm mb-1 overflow-hidden">
             <div className="h-full w-1/2 bg-[#1a1a1a]"></div>
          </div>
        </button>

        {/* Fantasy Option */}
        <button
          onClick={() => setTheme('fantasy')}
          className={`${baseButtonClasses} ${theme === 'fantasy' ? activeClasses : inactiveClasses}`}
        >
           <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📜</span>
            <span className="font-bold text-sm text-terminal-green">Fantasy</span>
          </div>
          <div className="h-2 w-full bg-[#f0e6d2] border border-[#2c241b] rounded-sm mb-1 overflow-hidden">
             <div className="h-full w-1/2 bg-[#e6dcc8]"></div>
          </div>
        </button>

        {/* Light Option */}
        <button
          onClick={() => setTheme('light')}
          className={`${baseButtonClasses} ${theme === 'light' ? activeClasses : inactiveClasses}`}
        >
           <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">☀️</span>
            <span className="font-bold text-sm text-terminal-green">Light</span>
          </div>
          <div className="h-2 w-full bg-[#faf8f6] border border-[#da7756] rounded-sm mb-1 overflow-hidden">
             <div className="h-full w-1/2 bg-[#f0efeb]"></div>
          </div>
        </button>
      </div>
      <p className="text-xs text-terminal-green-dim">
        Select the visual style for the interface.
      </p>
    </div>
  );
};
