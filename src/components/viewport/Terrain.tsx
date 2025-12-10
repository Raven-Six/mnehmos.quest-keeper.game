import React, { useMemo, memo } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import { useCombatStore, type TerrainFeature } from '../../stores/combatStore';
import { TerrainTooltip } from './TerrainTooltip';

interface TerrainProps {
  feature: TerrainFeature;
}

interface WallGroupProps {
  features: TerrainFeature[];
}

// Optimization: Cached geometry calculation helpers
function getWallGeometry(walls: TerrainFeature[]) {
  if (walls.length === 0) return null;

  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  const positionsY = walls[0].position.y;
  const height = walls[0].dimensions.height;

  // Single pass bounds calculation
  for (const w of walls) {
    const halfWidth = w.dimensions.width / 2;
    const halfDepth = w.dimensions.depth / 2;
    minX = Math.min(minX, w.position.x - halfWidth);
    maxX = Math.max(maxX, w.position.x + halfWidth);
    minZ = Math.min(minZ, w.position.z - halfDepth);
    maxZ = Math.max(maxZ, w.position.z + halfDepth);
  }

  const width = maxX - minX;
  const depth = maxZ - minZ;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  return {
    position: [centerX + 0.5, positionsY, centerZ + 0.5] as [number, number, number],
    args: [width, height, depth] as [number, number, number],
    center: { x: centerX, y: positionsY, z: centerZ },
    dimensions: { width, height, depth }
  };
}

// Individual Terrain Component (Memoized)
const SingleTerrain = memo(({ feature }: TerrainProps) => {
  const { dimensions, position, color, type } = feature;
  
  // Selectors optimised to avoid re-renders
  const measureMode = useCombatStore((s) => s.measureMode);
  const selectedTerrainId = useCombatStore((s) => s.selectedTerrainId);
  const selectTerrain = useCombatStore((s) => s.selectTerrain);
  const setCursorPosition = useCombatStore((s) => s.setCursorPosition);
  
  // Action dispatchers (stable)
  const setMeasureStart = useCombatStore((s) => s.setMeasureStart);
  const setMeasureEnd = useCombatStore((s) => s.setMeasureEnd);
  const setClickedTileCoord = useCombatStore((s) => s.setClickedTileCoord);
  const clickedTileCoord = useCombatStore((s) => s.clickedTileCoord);
  const measureStart = useCombatStore((s) => s.measureStart);
  const measureEnd = useCombatStore((s) => s.measureEnd);

  const isSelected = selectedTerrainId === feature.id;

  const handlePointerMove = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const vizX = Math.floor(e.point.x);
    const vizZ = Math.floor(e.point.z);
    setCursorPosition({ x: vizX, y: vizZ });
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const vizX = Math.floor(e.point.x);
    const vizZ = Math.floor(e.point.z);
    const mcpX = vizX + 10;
    const mcpZ = vizZ + 10;

    if (measureMode) {
      if (!measureStart) {
        setMeasureStart({ x: vizX, y: vizZ }); 
      } else if (!measureEnd) {
        setMeasureEnd({ x: vizX, y: vizZ });
      } else {
        setMeasureStart({ x: vizX, y: vizZ });
        setMeasureEnd(null);
      }
    } else {
      selectTerrain(isSelected ? null : feature.id);
      if (clickedTileCoord && clickedTileCoord.x === mcpX && clickedTileCoord.y === mcpZ) {
        setClickedTileCoord(null);
      } else {
        setClickedTileCoord({ x: mcpX, y: mcpZ });
      }
    }
  };

  const getMaterialProps = () => {
    switch (type) {
      case 'water': return { roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.6 };
      case 'difficult': return { roughness: 0.9, metalness: 0.0, transparent: true, opacity: feature.opacity ?? 0.7 };
      case 'obstacle': return { roughness: 0.8, metalness: 0.2, transparent: false, opacity: 1.0 };
      case 'elevation': case 'floor': return { roughness: 0.6, metalness: 0.1, transparent: true, opacity: feature.opacity ?? 0.5 };
      case 'ceiling': return { roughness: 0.4, metalness: 0.2, transparent: true, opacity: feature.opacity ?? 0.3 };
      case 'prop': return { roughness: 0.6, metalness: 0.1, transparent: false, opacity: 1.0, emissive: color, emissiveIntensity: 0.5 };
      default: return { roughness: 0.7, metalness: 0.1, transparent: false, opacity: 1.0 };
    }
  };

  const matProps = getMaterialProps();

  return (
    <group onClick={handleClick} onPointerMove={handlePointerMove}>
      <mesh position={[position.x + 0.5, position.y, position.z + 0.5]} castShadow receiveShadow>
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
        <meshStandardMaterial 
          color={color}
          {...matProps}
        />
        {(type === 'obstacle' || type === 'prop') && (
          <Edges color="#1a1a1a" linewidth={1.5} />
        )}
      </mesh>
      {isSelected && (
        <group position={[position.x, position.y + dimensions.height / 2 + 0.5, position.z]}>
          <TerrainTooltip feature={feature} />
        </group>
      )}
    </group>
  );
});

// Merged Wall Group Component
const WallGroup = memo(({ features }: WallGroupProps) => {
  const geom = useMemo(() => getWallGeometry(features), [features]);
  // Use the first feature for shared properties like color
  const representative = features[0];
  const selectedTerrainId = useCombatStore((s) => s.selectedTerrainId);
  const selectTerrain = useCombatStore((s) => s.selectTerrain);
  
  // Check if ANY part of the wall is selected (by ID)
  // Or just use the representative ID for selection of the whole block?
  // Current logic selects individual IDs. Let's support selecting the group via the representative.
  const isSelected = selectedTerrainId === representative.id;

  if (!geom) return null;

  return (
    <group 
      onClick={(e) => {
        e.stopPropagation();
        selectTerrain(isSelected ? null : representative.id);
      }}
    >
      <mesh position={geom.position} castShadow receiveShadow>
        <boxGeometry args={geom.args} />
        <meshStandardMaterial 
          color={representative.color}
          roughness={0.8}
          metalness={0.3}
        />
        <Edges color="#1a1a1a" linewidth={1.5} />
      </mesh>
      {isSelected && (
        <group position={[geom.center.x, geom.center.y + geom.dimensions.height / 2 + 0.5, geom.center.z]}>
          <TerrainTooltip feature={representative} />
        </group>
      )}
    </group>
  );
});

// Main Layer Component
export const TerrainLayer: React.FC = () => {
  const terrain = useCombatStore((state) => state.terrain);

  // Separate walls from other terrain for optimization
  const { walls, others } = useMemo(() => {
    const walls: TerrainFeature[] = [];
    const others: TerrainFeature[] = [];
    terrain.forEach(t => t.type === 'wall' ? walls.push(t) : others.push(t));
    return { walls, others };
  }, [terrain]);

  // Group connected walls (Optimized: Linear pass with spatial map instead of O(N^2))
  const wallGroups = useMemo(() => {
    if (walls.length === 0) return [];

    const groups: TerrainFeature[][] = [];
    const visited = new Set<string>();
    
    // Spatial grid for fast adjacency lookup
    const spatialMap = new Map<string, TerrainFeature>();
    walls.forEach(w => spatialMap.set(`${Math.round(w.position.x)},${Math.round(w.position.z)},${Math.round(w.position.y)}`, w));

    const getNeighbors = (t: TerrainFeature) => {
      const neighbors: TerrainFeature[] = [];
      const x = Math.round(t.position.x);
      const z = Math.round(t.position.z);
      const y = Math.round(t.position.y);

      // Check cardinal directions
      const keys = [
        `${x+1},${z},${y}`,
        `${x-1},${z},${y}`,
        `${x},${z+1},${y}`,
        `${x},${z-1},${y}`
      ];

      keys.forEach(k => {
        const n = spatialMap.get(k);
        if (n) neighbors.push(n);
      });
      return neighbors;
    };

    for (const wall of walls) {
      if (visited.has(wall.id)) continue;

      const group: TerrainFeature[] = [];
      const queue = [wall];
      visited.add(wall.id);

      while (queue.length > 0) {
        const current = queue.shift()!;
        group.push(current);

        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor.id)) {
            visited.add(neighbor.id);
            queue.push(neighbor);
          }
        }
      }
      groups.push(group);
    }
    return groups;
  }, [walls]);

  return (
    <>
      {/* Render optimized wall groups */}
      {wallGroups.map((group) => (
        <WallGroup key={`wall-group-${group[0].id}`} features={group} />
      ))}
      
      {/* Render individual non-wall terrain */}
      {others.map((feature) => (
        <SingleTerrain key={feature.id} feature={feature} />
      ))}
    </>
  );
};
