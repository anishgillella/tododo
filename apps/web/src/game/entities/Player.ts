import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  facing: string = 'down';
  private shadow: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-sheet', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Shadow ellipse beneath player
    this.shadow = scene.add.ellipse(x, y + 4, 28, 10, 0x000000, 0.25);
    this.shadow.setDepth(0);

    // Collision box at feet (scaled for 48x64 frames)
    this.body!.setSize(24, 16);
    this.body!.setOffset(12, 48);

    this.setDepth(y);
    this.play('player-idle-down');
  }

  walkInDirection(dir: string, speed: number = 160): void {
    this.facing = dir;
    const body = this.body as Phaser.Physics.Arcade.Body;

    switch (dir) {
      case 'left':
        body.setVelocity(-speed, 0);
        break;
      case 'right':
        body.setVelocity(speed, 0);
        break;
      case 'up':
        body.setVelocity(0, -speed);
        break;
      case 'down':
        body.setVelocity(0, speed);
        break;
    }

    this.play(`player-walk-${dir}`, true);
  }

  stopWalking(): void {
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.play(`player-idle-${this.facing}`, true);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    // Depth sort by Y position
    this.setDepth(this.y);
    // Keep shadow following
    this.shadow.setPosition(this.x, this.y + 4);
    this.shadow.setDepth(this.y - 1);
  }
}
