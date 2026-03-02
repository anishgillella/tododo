import Phaser from 'phaser';

const CREATURE_TEXTURES: Record<string, string> = {
  wolf: 'creature-wolf',
  spider: 'creature-spider',
  wraith: 'creature-wraith',
  golem: 'creature-golem',
  dragon: 'creature-dragon',
  shadow: 'creature-shadow',
  elemental: 'creature-elemental',
};

export class CombatCreature extends Phaser.GameObjects.Sprite {
  private shadow: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, x: number, y: number, creatureId: string) {
    const texture = CREATURE_TEXTURES[creatureId] ?? 'creature-wolf';
    super(scene, x, y, texture);
    scene.add.existing(this);
    this.setScale(2.5);
    this.setOrigin(0.5, 1);
    this.setFlipX(true); // Face left toward player

    // Shadow ellipse
    this.shadow = scene.add.ellipse(x, y + 4, 56, 18, 0x000000, 0.3);
    this.shadow.setDepth(49);
    this.setDepth(50);

    // Idle bob
    scene.tweens.add({
      targets: this,
      y: y - 4,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  playAttack(onComplete?: () => void): void {
    const startX = this.x;
    this.scene.tweens.add({
      targets: this,
      x: startX - 80,
      duration: 150,
      yoyo: true,
      ease: 'Power2',
      onYoyo: () => {
        onComplete?.();
      },
    });
  }

  playHit(): void {
    this.scene.tweens.add({
      targets: this,
      tint: 0xffffff,
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.clearTint();
      },
    });
  }

  playDeath(): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 600,
      ease: 'Power2',
    });
    this.scene.tweens.add({
      targets: this.shadow,
      alpha: 0,
      duration: 600,
    });
    // Victory sparkles
    this.scene.add.particles(this.x, this.y - 30, 'fx-heal', {
      speed: { min: 20, max: 60 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      quantity: 8,
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Circle(0, 0, 30),
      } as Phaser.Types.GameObjects.Particles.EmitZoneData,
    });
  }
}
