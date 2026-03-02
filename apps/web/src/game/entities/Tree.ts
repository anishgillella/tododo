import Phaser from 'phaser';

const TREE_TEXTURES = ['tree', 'tree-2', 'tree-3'];

export class Tree extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, variant?: number) {
    super(scene, x, y);

    // Shadow ellipse
    const shadow = scene.add.ellipse(0, 4, 32, 12, 0x000000, 0.2);
    this.add(shadow);

    // Pick texture variant
    const texKey = TREE_TEXTURES[variant ?? Phaser.Math.Between(0, TREE_TEXTURES.length - 1)];
    const sprite = scene.add.sprite(0, 0, texKey).setOrigin(0.5, 1);
    this.add(sprite);

    scene.add.existing(this);
    this.setDepth(y);

    // Subtle sway
    scene.tweens.add({
      targets: sprite,
      angle: { from: -1.5, to: 1.5 },
      duration: Phaser.Math.Between(2000, 4000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: Phaser.Math.Between(0, 2000),
    });
  }
}
