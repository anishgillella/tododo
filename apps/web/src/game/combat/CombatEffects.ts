import Phaser from 'phaser';

export class CombatEffects {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  showSlash(x: number, y: number): void {
    const slash = this.scene.add.sprite(x, y, 'fx-slash')
      .setScale(3)
      .setAlpha(0.9)
      .setDepth(100);

    this.scene.tweens.add({
      targets: slash,
      angle: 90,
      alpha: 0,
      scale: 4,
      duration: 300,
      onComplete: () => slash.destroy(),
    });

    // Hit spark particle burst
    this.scene.add.particles(x, y, 'fx-fire', {
      speed: { min: 40, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 300,
      quantity: 6,
    }).setDepth(101);
  }

  showHeal(x: number, y: number): void {
    for (let i = 0; i < 5; i++) {
      const sparkle = this.scene.add.sprite(
        x + Phaser.Math.Between(-20, 20),
        y + Phaser.Math.Between(-20, 20),
        'fx-heal',
      ).setScale(2).setDepth(100);

      this.scene.tweens.add({
        targets: sparkle,
        y: sparkle.y - 40,
        alpha: 0,
        scale: 0,
        duration: 800,
        delay: i * 100,
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  showShield(x: number, y: number): void {
    const shield = this.scene.add.sprite(x, y - 20, 'fx-shield')
      .setScale(3)
      .setAlpha(0.7)
      .setDepth(100);

    this.scene.tweens.add({
      targets: shield,
      alpha: 0,
      scale: 4,
      duration: 600,
      onComplete: () => shield.destroy(),
    });
  }

  showDamageNumber(x: number, y: number, amount: number, isCrit: boolean = false): void {
    const text = this.scene.add.text(x, y, `-${amount}`, {
      fontSize: isCrit ? '28px' : '20px',
      color: isCrit ? '#FF4444' : '#FFFFFF',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true,
      },
    }).setOrigin(0.5).setDepth(200);

    // Bounce-in with Back.easeOut
    text.setScale(0);
    this.scene.tweens.add({
      targets: text,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: text,
          y: y - 50,
          alpha: 0,
          duration: 800,
          ease: 'Power2',
          onComplete: () => text.destroy(),
        });
      },
    });
  }

  showHealNumber(x: number, y: number, amount: number): void {
    const text = this.scene.add.text(x, y, `+${amount}`, {
      fontSize: '20px',
      color: '#66FF88',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true,
      },
    }).setOrigin(0.5).setDepth(200);

    text.setScale(0);
    this.scene.tweens.add({
      targets: text,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: text,
          y: y - 50,
          alpha: 0,
          duration: 800,
          ease: 'Power2',
          onComplete: () => text.destroy(),
        });
      },
    });
  }

  screenFlash(color: number = 0xffffff): void {
    const cam = this.scene.cameras.main;
    const flash = this.scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, color, 0.3)
      .setScrollFactor(0)
      .setDepth(500);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });
  }
}
