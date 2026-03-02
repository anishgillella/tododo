import EventEmitter from 'eventemitter3';
import type { OverlayRoute } from '../stores/villageStore';

export interface BridgeEvents {
  // Phaser → React
  'player:position': (x: number, y: number) => void;
  'player:nearBuilding': (name: string | null, route: OverlayRoute | null) => void;
  'player:nearNpc': (npcId: string | null) => void;
  'player:enterBuilding': (route: OverlayRoute) => void;
  'player:talkNpc': (npcId: string) => void;
  'combat:started': () => void;
  'combat:ended': () => void;

  // React → Phaser
  'overlay:opened': () => void;
  'overlay:closed': () => void;
  'combat:start': (creatureId: string) => void;
  'combat:action': (action: string, data?: unknown) => void;
  'combat:end': (result: 'victory' | 'defeat' | 'fled') => void;
  'game:resize': () => void;
  'weather:update': (timeOfDay: string, condition: string) => void;
  'agent:update': (data: { level: number; debt: number; streakDays: number }) => void;
}

class PhaserBridge extends EventEmitter {
  private static instance: PhaserBridge;

  static getInstance(): PhaserBridge {
    if (!PhaserBridge.instance) {
      PhaserBridge.instance = new PhaserBridge();
    }
    return PhaserBridge.instance;
  }
}

export const bridge = PhaserBridge.getInstance();
