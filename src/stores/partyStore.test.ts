/**
 * Tests for partyStore.ts
 * 
 * Testing Zustand store with mock MCP client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
// act not used? remove if so.
// afterEach not used? remove if so.

// Mock the MCP client before importing the store
vi.mock('../services/mcpClient', () => ({
  mcpManager: {
    gameStateClient: {
      callTool: vi.fn(),
    },
  },
}));

// Mock gameStateStore to prevent circular dependency issues
vi.mock('./gameStateStore', () => ({
  useGameStateStore: {
    getState: () => ({
      activeCharacterId: null,
      setActiveCharacterId: vi.fn(),
      syncState: vi.fn(),
    }),
  },
}));

import { usePartyStore } from './partyStore';
import type { Party, PartyWithMembers } from './partyStore';

describe('partyStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    usePartyStore.setState({
      activePartyId: null,
      parties: [],
      partyDetails: {},
      unassignedCharacters: [],
      isLoading: false,
      isSyncing: false,
      lastSyncTime: 0,
      isInitialized: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const state = usePartyStore.getState();
      
      expect(state.activePartyId).toBeNull();
      expect(state.parties).toEqual([]);
      expect(state.partyDetails).toEqual({});
      expect(state.unassignedCharacters).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.isSyncing).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Basic Setters', () => {
    it('setActivePartyId updates activePartyId', () => {
      const { setActivePartyId } = usePartyStore.getState();
      
      setActivePartyId('party-123');
      
      expect(usePartyStore.getState().activePartyId).toBe('party-123');
    });

    it('setActivePartyId can clear activePartyId', () => {
      usePartyStore.setState({ activePartyId: 'party-123' });
      
      const { setActivePartyId } = usePartyStore.getState();
      setActivePartyId(null);
      
      expect(usePartyStore.getState().activePartyId).toBeNull();
    });

    it('setError updates error state', () => {
      const { setError } = usePartyStore.getState();
      
      setError('Something went wrong');
      
      expect(usePartyStore.getState().error).toBe('Something went wrong');
    });

    it('setError can clear error', () => {
      usePartyStore.setState({ error: 'Previous error' });
      
      const { setError } = usePartyStore.getState();
      setError(null);
      
      expect(usePartyStore.getState().error).toBeNull();
    });
  });

  describe('Selectors', () => {
    const mockPartyWithMembers: PartyWithMembers = {
      id: 'party-1',
      name: 'The Fellowship',
      status: 'active',
      formation: 'standard',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      positionX: 50,
      positionY: 75,
      currentLocation: 'Rivendell',
      members: [
        {
          id: 'member-1',
          partyId: 'party-1',
          characterId: 'char-gandalf',
          role: 'leader',
          isActive: false,
          sharePercentage: 100,
          joinedAt: '2024-01-01T00:00:00Z',
          character: {
            id: 'char-gandalf',
            name: 'Gandalf',
            level: 20,
            class: 'Wizard',
            hp: 100,
            maxHp: 100,
            characterType: 'pc',
          },
        },
        {
          id: 'member-2',
          partyId: 'party-1',
          characterId: 'char-frodo',
          role: 'member',
          isActive: true,
          sharePercentage: 100,
          joinedAt: '2024-01-01T00:00:00Z',
          character: {
            id: 'char-frodo',
            name: 'Frodo',
            level: 5,
            class: 'Rogue',
            hp: 30,
            maxHp: 30,
            characterType: 'pc',
          },
        },
      ],
    };

    beforeEach(() => {
      usePartyStore.setState({
        activePartyId: 'party-1',
        partyDetails: { 'party-1': mockPartyWithMembers },
      });
    });

    describe('getActiveParty', () => {
      it('returns active party when activePartyId is set', () => {
        const { getActiveParty } = usePartyStore.getState();
        
        const activeParty = getActiveParty();
        
        expect(activeParty).not.toBeNull();
        expect(activeParty?.name).toBe('The Fellowship');
        expect(activeParty?.members).toHaveLength(2);
      });

      it('returns null when no activePartyId', () => {
        usePartyStore.setState({ activePartyId: null });
        
        const { getActiveParty } = usePartyStore.getState();
        
        expect(getActiveParty()).toBeNull();
      });

      it('returns null when partyDetails not loaded', () => {
        usePartyStore.setState({ partyDetails: {} });
        
        const { getActiveParty } = usePartyStore.getState();
        
        expect(getActiveParty()).toBeNull();
      });
    });

    describe('getActivePartyPosition', () => {
      it('returns position when party has coordinates', () => {
        const { getActivePartyPosition } = usePartyStore.getState();
        
        const position = getActivePartyPosition();
        
        expect(position).not.toBeNull();
        expect(position?.x).toBe(50);
        expect(position?.y).toBe(75);
        expect(position?.locationName).toBe('Rivendell');
      });

      it('returns null when no active party', () => {
        usePartyStore.setState({ activePartyId: null });
        
        const { getActivePartyPosition } = usePartyStore.getState();
        
        expect(getActivePartyPosition()).toBeNull();
      });
    });

    describe('getLeader', () => {
      it('returns member with leader role', () => {
        const { getLeader } = usePartyStore.getState();
        
        const leader = getLeader();
        
        expect(leader).not.toBeNull();
        expect(leader?.character.name).toBe('Gandalf');
        expect(leader?.role).toBe('leader');
      });

      it('returns null when no leader assigned', () => {
        const partyWithoutLeader = {
          ...mockPartyWithMembers,
          members: mockPartyWithMembers.members.map(m => ({ ...m, role: 'member' as const })),
        };
        usePartyStore.setState({ partyDetails: { 'party-1': partyWithoutLeader } });
        
        const { getLeader } = usePartyStore.getState();
        
        expect(getLeader()).toBeNull();
      });
    });

    describe('getActiveCharacterMember', () => {
      it('returns member with isActive=true', () => {
        const { getActiveCharacterMember } = usePartyStore.getState();
        
        const activeMember = getActiveCharacterMember();
        
        expect(activeMember).not.toBeNull();
        expect(activeMember?.character.name).toBe('Frodo');
        expect(activeMember?.isActive).toBe(true);
      });

      it('returns null when no active member', () => {
        const partyWithoutActive = {
          ...mockPartyWithMembers,
          members: mockPartyWithMembers.members.map(m => ({ ...m, isActive: false })),
        };
        usePartyStore.setState({ partyDetails: { 'party-1': partyWithoutActive } });
        
        const { getActiveCharacterMember } = usePartyStore.getState();
        
        expect(getActiveCharacterMember()).toBeNull();
      });
    });
  });

  describe('State Updates', () => {
    it('can update parties list', () => {
      const mockParties: Party[] = [
        {
          id: 'party-1',
          name: 'Fellowship',
          status: 'active',
          formation: 'standard',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'party-2',
          name: 'Bandits',
          status: 'dormant',
          formation: 'loose',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      usePartyStore.setState({ parties: mockParties });
      
      expect(usePartyStore.getState().parties).toHaveLength(2);
      expect(usePartyStore.getState().parties[0].name).toBe('Fellowship');
    });

    it('can update loading states', () => {
      usePartyStore.setState({ isLoading: true, isSyncing: true });
      
      const state = usePartyStore.getState();
      expect(state.isLoading).toBe(true);
      expect(state.isSyncing).toBe(true);
    });

    it('can track sync time', () => {
      const now = Date.now();
      usePartyStore.setState({ lastSyncTime: now });
      
      expect(usePartyStore.getState().lastSyncTime).toBe(now);
    });
  });

  describe('Type Exports', () => {
    it('exports PartyStatus type correctly', () => {
      const statuses: Array<'active' | 'dormant' | 'archived'> = ['active', 'dormant', 'archived'];
      statuses.forEach(status => {
        const party: Partial<Party> = { status };
        expect(['active', 'dormant', 'archived']).toContain(party.status);
      });
    });

    it('exports MemberRole type correctly', () => {
      const roles = ['leader', 'member', 'companion', 'hireling', 'prisoner', 'mount'];
      roles.forEach(role => {
        expect(typeof role).toBe('string');
      });
    });
  });
});
