/**
 * EVENT POLLER SERVICE
 * 
 * Polls the MCP server for unread events every 10 seconds.
 * Makes NPCs and the world appear to act autonomously.
 */

import { mcpManager } from './mcpClient';
import { useChatStore } from '../stores/chatStore';

export type EventType = 
  | 'npc_action' 
  | 'combat_update' 
  | 'world_change' 
  | 'quest_update'
  | 'time_passage'
  | 'environmental'
  | 'system';

export interface GameEvent {
  id: number;
  eventType: EventType;
  payload: Record<string, any>;
  sourceType?: string;
  sourceId?: string;
  priority?: number;
  createdAt?: string;
}

class EventPollerService {
  private timer: ReturnType<typeof setInterval> | null = null;
  private interval: number = 10000; // 10 seconds
  private isPolling = false;
  private enabled = true;

  /**
   * Start polling for events
   */
  start(): void {
    if (this.timer) return; // Already running
    
    console.log('[EventPoller] Starting with interval:', this.interval, 'ms');
    this.timer = setInterval(() => this.poll(), this.interval);
    
    // Initial poll after a short delay
    setTimeout(() => this.poll(), 2000);
  }

  /**
   * Stop polling
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[EventPoller] Stopped');
    }
  }

  /**
   * Enable/disable polling (useful during intensive operations)
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.timer) {
      this.stop();
    } else if (enabled && !this.timer) {
      this.start();
    }
  }

  /**
   * Set polling interval in milliseconds
   */
  setInterval(ms: number): void {
    this.interval = Math.max(3000, Math.min(60000, ms)); // 3s-60s bounds
    if (this.timer) {
      this.stop();
      this.start();
    }
  }

  /**
   * Poll for events and dispatch to stores
   */
  async poll(): Promise<void> {
    if (!this.enabled || this.isPolling) return;
    
    try {
      this.isPolling = true;
      
      // Use mcpManager directly
      if (!mcpManager.isReady()) return;
      
      const result = await mcpManager.gameStateClient.callTool('poll_events', { limit: 20 });
      
      if (result?.content?.[0]?.text) {
        const data = JSON.parse(result.content[0].text);
        const events: GameEvent[] = data.events || [];
        
        if (events.length > 0) {
          console.log(`[EventPoller] Received ${events.length} events`);
          events.forEach(event => this.dispatch(event));
        }
      }
    } catch (error: any) {
      // Silently ignore connection errors during polling
      if (!error.message?.includes('not connected')) {
        console.warn('[EventPoller] Error polling events:', error.message);
      }
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Dispatch an event to the appropriate store/handler
   */
  private dispatch(event: GameEvent): void {
    const { eventType, payload } = event;
    
    // Format for chat display
    const formatEventMessage = (): string | null => {
      switch (eventType) {
        case 'npc_action':
          return `🎭 **${payload.npcName || 'NPC'}**: ${payload.action || payload.message || JSON.stringify(payload)}`;
        
        case 'combat_update':
          return `⚔️ ${payload.message || JSON.stringify(payload)}`;
        
        case 'world_change':
          return `🌍 ${payload.description || payload.message || JSON.stringify(payload)}`;
        
        case 'quest_update':
          return `📜 **Quest Update**: ${payload.questName || ''} - ${payload.update || payload.message || JSON.stringify(payload)}`;
        
        case 'time_passage':
          return `🕐 ${payload.description || `Time passes... (${payload.amount || '?'})`}`;
        
        case 'environmental':
          return `🌿 ${payload.description || payload.message || JSON.stringify(payload)}`;
        
        case 'system':
          return `💻 ${payload.message || JSON.stringify(payload)}`;
        
        default:
          return null;
      }
    };

    const messageContent = formatEventMessage();
    if (messageContent) {
      // Add to chat as a system event message
      useChatStore.getState().addMessage({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        sender: 'system',
        content: messageContent,
        timestamp: Date.now(),
        type: 'info',
        isEvent: true
      });
    }
  }
}

// Singleton instance
export const eventPoller = new EventPollerService();
