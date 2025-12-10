import React from 'react';
import { Html } from '@react-three/drei';
import { TerrainFeature } from '../../stores/combatStore';

interface TerrainTooltipProps {
  feature: TerrainFeature;
}

export const TerrainTooltip: React.FC<TerrainTooltipProps> = ({ feature }) => {
  const { type, dimensions, blocksMovement, coverType, label, description: _description } = feature;
  
  // Use label for named props (landmarks), fallback to type
  const displayName = label || type;

  return (
    <Html
      position={[0, 0, 0]}
      center
      style={{
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      <div 
        className="font-mono text-xs p-2 rounded min-w-[150px]"
        style={{ 
          backgroundColor: 'rgba(10, 10, 10, 0.95)', 
          border: '1px solid #eab308',
          color: '#fde047',
          boxShadow: '0 0 10px rgba(255,200,0,0.3)'
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: '1px solid rgba(234, 179, 8, 0.5)', paddingBottom: '4px', marginBottom: '8px' }}>
          <div className="font-bold text-sm uppercase" style={{ textShadow: '0 0 5px #fde047' }}>{displayName}</div>
          {label && <div className="text-[10px]" style={{ color: 'rgba(253, 224, 71, 0.6)' }}>{type}</div>}
        </div>

        {/* Properties Grid */}
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span style={{ color: 'rgba(253, 224, 71, 0.7)' }}>Size:</span>
            <span>{dimensions.width}×{dimensions.depth}×{dimensions.height} units</span>
          </div>
          
          {blocksMovement && (
            <div style={{ color: '#f87171' }}>
              🚫 Blocks Movement
            </div>
          )}
          
          {coverType && coverType !== 'none' && (
            <div style={{ color: '#60a5fa' }}>
              🛡️ {coverType} Cover
            </div>
          )}
        </div>
      </div>
    </Html>
  );
};
