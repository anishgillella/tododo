import { useEffect } from 'react';
import { bridge } from '../game/PhaserBridge';
import { useVillageStore } from '../stores/villageStore';
import { usePlayerStore } from '../stores/playerStore';

export function useGameBridge() {
  const openOverlay = useVillageStore((s) => s.openOverlay);
  const activeOverlay = useVillageStore((s) => s.activeOverlay);
  const setNearbyBuilding = usePlayerStore((s) => s.setNearbyBuilding);
  const setNearbyNpc = usePlayerStore((s) => s.setNearbyNpc);

  // Phaser → React: player enters building
  useEffect(() => {
    const onEnter = (route: Parameters<typeof openOverlay>[0]) => {
      openOverlay(route);
    };
    bridge.on('player:enterBuilding', onEnter);
    return () => { bridge.off('player:enterBuilding', onEnter); };
  }, [openOverlay]);

  // Phaser → React: player near building
  useEffect(() => {
    const onNear = (name: string | null) => {
      setNearbyBuilding(name);
    };
    bridge.on('player:nearBuilding', onNear);
    return () => { bridge.off('player:nearBuilding', onNear); };
  }, [setNearbyBuilding]);

  // Phaser → React: player near NPC
  useEffect(() => {
    const onNearNpc = (npcId: string | null) => {
      setNearbyNpc(npcId);
    };
    bridge.on('player:nearNpc', onNearNpc);
    return () => { bridge.off('player:nearNpc', onNearNpc); };
  }, [setNearbyNpc]);

  // React → Phaser: overlay state
  useEffect(() => {
    if (activeOverlay) {
      bridge.emit('overlay:opened');
    } else {
      bridge.emit('overlay:closed');
    }
  }, [activeOverlay]);
}
