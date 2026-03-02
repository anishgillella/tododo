import Phaser from 'phaser';
import type { Player } from '../entities/Player';
import type { Building } from '../entities/Building';
import type { NpcCharacter } from '../entities/NpcCharacter';
import { bridge } from '../PhaserBridge';
import type { OverlayRoute } from '../../stores/villageStore';

export class ProximitySystem {
  private scene: Phaser.Scene;
  private player: Player;
  private buildings: Building[];
  private npcs: NpcCharacter[];
  private pressEText: Phaser.GameObjects.Text;
  private currentNearbyBuilding: string | null = null;
  private currentNearbyNpc: string | null = null;
  private eKey: Phaser.Input.Keyboard.Key;
  private interactionRange: number = 100;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    buildings: Building[],
    npcs: NpcCharacter[],
  ) {
    this.scene = scene;
    this.player = player;
    this.buildings = buildings;
    this.npcs = npcs;
    this.eKey = scene.input.keyboard!.addKey('E');

    // "Press E" text prompt
    this.pressEText = scene.add
      .text(0, 0, 'Press E', {
        fontSize: '7px',
        color: '#F0E8D8',
        fontFamily: 'monospace',
        backgroundColor: '#1A1410DD',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(999);
  }

  update(): void {
    let nearestBuilding: Building | null = null;
    let nearestBuildingDist = this.interactionRange;
    let nearestNpc: NpcCharacter | null = null;
    let nearestNpcDist = this.interactionRange;

    // Check buildings
    for (const building of this.buildings) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        building.x,
        building.y,
      );
      if (dist < nearestBuildingDist) {
        nearestBuildingDist = dist;
        nearestBuilding = building;
      }
    }

    // Check NPCs
    for (const npc of this.npcs) {
      if (!npc.visible) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npc.x,
        npc.y,
      );
      if (dist < nearestNpcDist) {
        nearestNpcDist = dist;
        nearestNpc = npc;
      }
    }

    // Determine what's closest
    const nearBuilding =
      nearestBuilding && nearestBuildingDist < nearestNpcDist;
    const nearNpc = nearestNpc && !nearBuilding;

    // Building proximity
    const newBuildingName = nearBuilding ? nearestBuilding!.buildingName : null;
    if (newBuildingName !== this.currentNearbyBuilding) {
      this.currentNearbyBuilding = newBuildingName;
      if (nearBuilding && nearestBuilding) {
        nearestBuilding.showLabel();
        bridge.emit(
          'player:nearBuilding',
          nearestBuilding.buildingName,
          nearestBuilding.route,
        );
      } else {
        this.buildings.forEach((b) => b.hideLabel());
        bridge.emit('player:nearBuilding', null, null);
      }
    }

    // NPC proximity
    const newNpcId = nearNpc ? nearestNpc!.npcId : null;
    if (newNpcId !== this.currentNearbyNpc) {
      this.currentNearbyNpc = newNpcId;
      bridge.emit('player:nearNpc', newNpcId);
    }

    // Show/hide Press E prompt
    if (nearBuilding && nearestBuilding) {
      this.pressEText.setPosition(nearestBuilding.x, nearestBuilding.y - 50);
      this.pressEText.setVisible(true);
    } else if (nearNpc && nearestNpc) {
      this.pressEText.setPosition(nearestNpc.x, nearestNpc.y - 50);
      this.pressEText.setVisible(true);
    } else {
      this.pressEText.setVisible(false);
    }

    // Handle E key press
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      if (nearBuilding && nearestBuilding) {
        bridge.emit(
          'player:enterBuilding',
          nearestBuilding.route as OverlayRoute,
        );
      } else if (nearNpc && nearestNpc) {
        bridge.emit('player:talkNpc', nearestNpc.npcId);
      }
    }
  }
}
