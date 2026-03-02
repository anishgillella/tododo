import Phaser from 'phaser';

export interface NpcConfig {
  id: string;
  name: string;
  texture: string;
  x: number;
  y: number;
  wanderRadius?: number;
  visible?: boolean;
}

export class NpcCharacter extends Phaser.GameObjects.Container {
  npcId: string;
  npcName: string;
  private sprite: Phaser.GameObjects.Sprite;
  private nameText: Phaser.GameObjects.Text;
  private speechBubble: Phaser.GameObjects.Text;
  private shadow: Phaser.GameObjects.Ellipse;
  private wanderRadius: number;
  private homeX: number;
  private homeY: number;
  interactionZone: Phaser.GameObjects.Zone;

  constructor(scene: Phaser.Scene, config: NpcConfig) {
    super(scene, config.x, config.y);
    this.npcId = config.id;
    this.npcName = config.name;
    this.homeX = config.x;
    this.homeY = config.y;
    this.wanderRadius = (config.wanderRadius ?? 30) * 2; // doubled for larger map

    // Shadow ellipse
    this.shadow = scene.add.ellipse(config.x, config.y + 4, 24, 8, 0x000000, 0.2);
    this.shadow.setDepth(config.y - 1);

    // NPC sprite (48x64)
    this.sprite = scene.add.sprite(0, 0, config.texture).setOrigin(0.5, 1);
    this.add(this.sprite);

    // Name label
    this.nameText = scene.add
      .text(config.x, config.y - 68, config.name, {
        fontSize: '10px',
        color: '#B8A890',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(1000);

    // Speech bubble (hidden)
    this.speechBubble = scene.add
      .text(config.x, config.y - 84, '', {
        fontSize: '10px',
        color: '#F0E8D8',
        fontFamily: 'monospace',
        backgroundColor: '#2A2218EE',
        padding: { x: 6, y: 3 },
        wordWrap: { width: 200 },
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(1001);

    // Interaction zone (scaled)
    this.interactionZone = scene.add.zone(config.x, config.y, 100, 100);
    scene.physics.add.existing(this.interactionZone, true);

    scene.add.existing(this);
    this.setDepth(config.y);
    this.setVisible(config.visible !== false);
    this.nameText.setVisible(config.visible !== false);
    this.shadow.setVisible(config.visible !== false);

    // Start wandering
    this.startWander(scene);
  }

  private startWander(scene: Phaser.Scene): void {
    scene.time.addEvent({
      delay: Phaser.Math.Between(3000, 8000),
      callback: () => {
        if (!this.visible) return;
        const targetX =
          this.homeX +
          Phaser.Math.Between(-this.wanderRadius, this.wanderRadius);
        const targetY =
          this.homeY +
          Phaser.Math.Between(-this.wanderRadius, this.wanderRadius);

        scene.tweens.add({
          targets: this,
          x: targetX,
          y: targetY,
          duration: Phaser.Math.Between(1000, 2000),
          ease: 'Sine.easeInOut',
          onUpdate: () => {
            this.nameText.setPosition(this.x, this.y - 68);
            this.speechBubble.setPosition(this.x, this.y - 84);
            this.interactionZone.setPosition(this.x, this.y);
            this.shadow.setPosition(this.x, this.y + 4);
            this.shadow.setDepth(this.y - 1);
            this.setDepth(this.y);
          },
        });

        this.startWander(scene);
      },
      callbackScope: this,
    });
  }

  showSpeech(text: string, duration: number = 4000): void {
    this.speechBubble.setText(text);
    this.speechBubble.setVisible(true);
    this.scene.time.delayedCall(duration, () => {
      this.speechBubble.setVisible(false);
    });
  }

  setNpcVisible(visible: boolean): void {
    this.setVisible(visible);
    this.nameText.setVisible(visible);
    this.shadow.setVisible(visible);
    if (!visible) this.speechBubble.setVisible(false);
  }
}
