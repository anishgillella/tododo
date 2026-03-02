import Phaser from 'phaser';
import type { Player } from '../entities/Player';

export class PlayerController {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private player: Player;
  private speed: number = 160;
  private enabled: boolean = true;

  constructor(scene: Phaser.Scene, player: Player) {
    this.player = player;
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: scene.input.keyboard!.addKey('W'),
      A: scene.input.keyboard!.addKey('A'),
      S: scene.input.keyboard!.addKey('S'),
      D: scene.input.keyboard!.addKey('D'),
    };
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.player.stopWalking();
    }
  }

  update(): void {
    if (!this.enabled) return;

    const left = this.cursors.left?.isDown || this.wasd.A.isDown;
    const right = this.cursors.right?.isDown || this.wasd.D.isDown;
    const up = this.cursors.up?.isDown || this.wasd.W.isDown;
    const down = this.cursors.down?.isDown || this.wasd.S.isDown;

    const body = this.player.body as Phaser.Physics.Arcade.Body;

    if (left || right || up || down) {
      let vx = 0;
      let vy = 0;

      if (left) vx -= 1;
      if (right) vx += 1;
      if (up) vy -= 1;
      if (down) vy += 1;

      // Normalize diagonal
      const len = Math.sqrt(vx * vx + vy * vy);
      if (len > 0) {
        vx = (vx / len) * this.speed;
        vy = (vy / len) * this.speed;
      }

      body.setVelocity(vx, vy);

      // Determine facing direction (prefer vertical for diagonal)
      if (Math.abs(vy) >= Math.abs(vx)) {
        this.player.facing = vy < 0 ? 'up' : 'down';
      } else {
        this.player.facing = vx < 0 ? 'left' : 'right';
      }

      this.player.play(`player-walk-${this.player.facing}`, true);
    } else {
      body.setVelocity(0, 0);
      this.player.play(`player-idle-${this.player.facing}`, true);
    }
  }
}
