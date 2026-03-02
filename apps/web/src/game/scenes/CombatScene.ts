import Phaser from 'phaser';
import { CombatPlayer } from '../combat/CombatPlayer';
import { CombatCreature } from '../combat/CombatCreature';
import { CombatEffects } from '../combat/CombatEffects';
import { bridge } from '../PhaserBridge';

export class CombatScene extends Phaser.Scene {
  private combatPlayer!: CombatPlayer;
  private combatCreature!: CombatCreature;
  private effects!: CombatEffects;
  private currentCreatureId: string = 'wolf';

  constructor() {
    super({ key: 'Combat' });
  }

  init(data?: { creatureId?: string }): void {
    if (data?.creatureId) {
      this.currentCreatureId = data.creatureId;
    }
  }

  create(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Layered background: sky gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1410, 0x1a1410, 0x2a2218, 0x2a2218, 1);
    bg.fillRect(0, 0, w, h);
    bg.setDepth(-2);

    // Ground plane with stone patches
    const ground = this.add.graphics();
    const groundY = h * 0.79;
    ground.fillStyle(0x3a3228);
    ground.fillRect(0, groundY, w, h - groundY);
    // Scattered stone patches
    for (let i = 0; i < 8; i++) {
      const sx = Phaser.Math.Between(20, w - 20);
      const sy = Phaser.Math.Between(Math.floor(groundY + 10), h - 10);
      ground.fillStyle(Phaser.Math.Between(0, 1) ? 0x4a4238 : 0x2a2218);
      ground.fillRect(sx, sy, Phaser.Math.Between(10, 30), Phaser.Math.Between(6, 14));
    }
    ground.lineStyle(2, 0x5c4a38);
    ground.lineBetween(0, groundY, w, groundY);
    ground.setDepth(-1);

    // Arena border
    const border = this.add.graphics();
    border.lineStyle(1, 0x8b5e3c, 0.3);
    border.strokeRect(20, 20, w - 40, h - 40);
    border.setDepth(0);

    // Atmospheric dust from ground
    const dustEmitter = this.add.particles(w / 2, groundY, 'fx-dust', {
      speed: { min: 3, max: 10 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.3, end: 0 },
      lifespan: 4000,
      frequency: 600,
      quantity: 1,
      emitZone: new Phaser.GameObjects.Particles.Zones.RandomZone(
        new Phaser.Geom.Rectangle(-w / 2, 0, w, 1) as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      ),
    });
    dustEmitter.setDepth(2);

    // Torch fire emitters on arena sides
    this.addTorch(w * 0.08, groundY - 20);
    this.addTorch(w * 0.92, groundY - 20);

    // Player on left (camera-relative)
    const playerX = w * 0.25;
    const playerY = groundY;
    this.combatPlayer = new CombatPlayer(this, playerX, playerY);

    // Creature on right (camera-relative)
    const creatureX = w * 0.75;
    const creatureY = groundY;
    this.combatCreature = new CombatCreature(this, creatureX, creatureY, this.currentCreatureId);

    // Effects system
    this.effects = new CombatEffects(this);

    // VS text
    this.add.text(w / 2, h * 0.42, 'VS', {
      fontSize: '24px',
      color: '#8B5E3C',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.3).setDepth(50);

    // Bridge listeners
    bridge.on('combat:action', (action: string, data?: unknown) => {
      this.handleAction(action, data as Record<string, unknown> | undefined);
    });

    bridge.on('combat:end', (result: string) => {
      this.handleCombatEnd(result);
    });

    // Handle resize
    this.scale.on('resize', () => {
      // Combat scene is short-lived, so we just accept initial layout
    });

    // Notify React that combat scene is ready
    bridge.emit('combat:started');
  }

  private addTorch(x: number, y: number): void {
    // Torch stand
    const stand = this.add.rectangle(x, y + 20, 4, 40, 0x5c4a38);
    stand.setDepth(1);

    // Fire particles
    this.add.particles(x, y, 'fx-fire', {
      speed: { min: 10, max: 30 },
      angle: { min: 255, max: 285 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 600,
      frequency: 80,
      quantity: 1,
    }).setDepth(10);
  }

  private handleAction(action: string, data?: Record<string, unknown>): void {
    switch (action) {
      case 'player-attack': {
        const damage = (data?.damage as number) ?? 10;
        const isCrit = (data?.isCrit as boolean) ?? false;
        this.combatPlayer.playAttack(() => {
          this.effects.showSlash(this.combatCreature.x, this.combatCreature.y - 40);
          this.effects.showDamageNumber(
            this.combatCreature.x,
            this.combatCreature.y - 60,
            damage,
            isCrit,
          );
          this.combatCreature.playHit();
          if (isCrit) this.effects.screenFlash(0xffdd44);
          // Screen shake on hit
          this.cameras.main.shake(150, 0.005);
        });
        break;
      }

      case 'enemy-attack': {
        const damage = (data?.damage as number) ?? 8;
        const isCrit = (data?.isCrit as boolean) ?? false;
        this.combatCreature.playAttack(() => {
          this.effects.showSlash(this.combatPlayer.x, this.combatPlayer.y - 40);
          this.effects.showDamageNumber(
            this.combatPlayer.x,
            this.combatPlayer.y - 60,
            damage,
            isCrit,
          );
          this.combatPlayer.playHit();
          if (isCrit) this.effects.screenFlash(0xff4444);
          // Screen shake on hit
          this.cameras.main.shake(200, 0.008);
        });
        break;
      }

      case 'player-heal': {
        const amount = (data?.healing as number) ?? 15;
        this.effects.showHeal(this.combatPlayer.x, this.combatPlayer.y - 40);
        this.effects.showHealNumber(this.combatPlayer.x, this.combatPlayer.y - 60, amount);
        break;
      }

      case 'player-defend': {
        this.effects.showShield(this.combatPlayer.x, this.combatPlayer.y - 20);
        break;
      }

      case 'enemy-defend': {
        this.effects.showShield(this.combatCreature.x, this.combatCreature.y - 20);
        break;
      }
    }
  }

  private handleCombatEnd(result: string): void {
    if (result === 'victory') {
      this.combatCreature.playDeath();
      this.time.delayedCall(1200, () => {
        this.fadeOutAndReturn();
      });
    } else if (result === 'defeat') {
      this.combatPlayer.playDeath();
      this.effects.screenFlash(0xff0000);
      this.time.delayedCall(1200, () => {
        this.fadeOutAndReturn();
      });
    } else {
      // fled
      this.fadeOutAndReturn();
    }
  }

  private fadeOutAndReturn(): void {
    this.cameras.main.fadeOut(500, 26, 20, 16);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      bridge.emit('combat:ended');
      this.scene.stop();
      this.scene.resume('Village');
    });
  }
}
