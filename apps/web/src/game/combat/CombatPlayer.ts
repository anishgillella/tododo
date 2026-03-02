import Phaser from 'phaser';

export class CombatPlayer extends Phaser.GameObjects.Sprite {
  private shadow: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-sheet', 0);
    scene.add.existing(this);
    this.setScale(3);
    this.setOrigin(0.5, 1);

    // Shadow ellipse
    this.shadow = scene.add.ellipse(x, y + 4, 48, 16, 0x000000, 0.3);
    this.shadow.setDepth(49);
    this.setDepth(50);

    // Idle bob
    scene.tweens.add({
      targets: this,
      y: y - 4,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  playAttack(onComplete?: () => void): void {
    const startX = this.x;
    this.scene.tweens.add({
      targets: this,
      x: startX + 80,
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
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 2,
    });
  }

  playDeath(): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y + 20,
      duration: 800,
      ease: 'Power2',
    });
    this.scene.tweens.add({
      targets: this.shadow,
      alpha: 0,
      duration: 800,
    });
  }
}
