import Phaser from 'phaser';
import type { OverlayRoute } from '../../stores/villageStore';

export interface BuildingConfig {
  name: string;
  route: OverlayRoute;
  texture: string;
  x: number;
  y: number;
}

export class Building extends Phaser.GameObjects.Container {
  buildingName: string;
  route: OverlayRoute;
  collisionBody: Phaser.Physics.Arcade.Sprite;
  interactionZone: Phaser.GameObjects.Zone;
  nameLabel: Phaser.GameObjects.Text;
  private sprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, config: BuildingConfig) {
    super(scene, config.x, config.y);
    this.buildingName = config.name;
    this.route = config.route;

    // Shadow blob behind building
    const shadow = scene.add.ellipse(config.x, config.y + 10, 80, 24, 0x000000, 0.2);
    shadow.setDepth(config.y - 1);

    // Building sprite (96x128)
    this.sprite = scene.add.sprite(0, 0, config.texture).setOrigin(0.5, 1);
    this.add(this.sprite);

    // Collision body (scaled for 96x128)
    this.collisionBody = scene.physics.add
      .sprite(config.x, config.y + 10, '__DEFAULT')
      .setVisible(false)
      .setImmovable(true);
    this.collisionBody.body!.setSize(80, 40);
    (this.collisionBody.body as Phaser.Physics.Arcade.Body).setOffset(-40, -20);

    // Interaction zone (scaled up)
    this.interactionZone = scene.add.zone(config.x, config.y, 160, 160);
    scene.physics.add.existing(this.interactionZone, true);

    // Name label (hidden by default)
    this.nameLabel = scene.add
      .text(config.x, config.y - 70, config.name, {
        fontSize: '12px',
        color: '#F0E8D8',
        fontFamily: 'monospace',
        backgroundColor: '#1A1410CC',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(1000);

    scene.add.existing(this);
    this.setDepth(config.y);
  }

  showLabel(): void {
    this.nameLabel.setVisible(true);
  }

  hideLabel(): void {
    this.nameLabel.setVisible(false);
  }
}
