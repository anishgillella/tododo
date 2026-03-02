import Phaser from 'phaser';

export class Decoration extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y);

    // Shadow ellipse beneath
    const shadow = scene.add.ellipse(0, 2, 14, 6, 0x000000, 0.2);
    this.add(shadow);

    // Sprite
    const sprite = scene.add.sprite(0, 0, texture).setOrigin(0.5, 1);
    this.add(sprite);

    scene.add.existing(this);
    this.setDepth(y);
  }
}
