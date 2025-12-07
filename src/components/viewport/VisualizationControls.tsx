import React from 'react';
import { useCombatStore } from '../../stores/combatStore';

export const VisualizationControls: React.FC = () => {
  const showLineOfSight = useCombatStore(state => state.showLineOfSight);
  const measureMode = useCombatStore(state => state.measureMode);
  const setShowLineOfSight = useCombatStore(state => state.setShowLineOfSight);
  const setMeasureMode = useCombatStore(state => state.setMeasureMode);

  return (
    <div style={{
      position: 'absolute',
      bottom: '80px', // Above the entity controls
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '10px',
      borderRadius: '8px',
      pointerEvents: 'auto',
      zIndex: 1000,
      border: '1px solid #333',
      boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
    }}>
      <button
        onClick={() => setShowLineOfSight(!showLineOfSight)}
        style={{
          background: showLineOfSight ? 'rgba(0, 255, 65, 0.2)' : '#222',
          color: showLineOfSight ? '#00ff41' : '#ccc',
          border: `1px solid ${showLineOfSight ? '#00ff41' : '#555'}`,
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s'
        }}
      >
        <span>👁️</span> Line of Sight
      </button>
      <button
        onClick={() => setMeasureMode(!measureMode)}
        style={{
          background: measureMode ? 'rgba(0, 255, 65, 0.2)' : '#222',
          color: measureMode ? '#00ff41' : '#ccc',
          border: `1px solid ${measureMode ? '#00ff41' : '#555'}`,
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s'
        }}
      >
        <span>📏</span> Measure Distance
      </button>

      {measureMode && (
        <div style={{
          color: '#aaa',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          borderLeft: '1px solid #555',
          paddingLeft: '10px',
          fontStyle: 'italic'
        }}>
          Click two points to measure
        </div>
      )}
    </div>
  );
};
