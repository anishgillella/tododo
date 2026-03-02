import Phaser from 'phaser';
import { bridge } from '../PhaserBridge';

const TIME_TINTS: Record<string, number> = {
  morning: 0xffeecc,
  midday: 0xffffff,
  evening: 0xffaa77,
  night: 0x6688bb,
};

const TIME_ALPHAS: Record<string, number> = {
  morning: 0.08,
  midday: 0,
  evening: 0.15,
  night: 0.35,
};

export class WeatherRenderer {
  private scene: Phaser.Scene;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private vignette: Phaser.GameObjects.Image | null = null;
  private rainEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Fullscreen tint overlay (MULTIPLY blend for time-of-day)
    this.createOverlay();

    // Vignette
    this.addVignette();

    // Handle RESIZE
    scene.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.handleResize(gameSize.width, gameSize.height);
    });

    // Listen for weather updates from React
    bridge.on('weather:update', (timeOfDay: string, _condition: string) => {
      this.setTimeOfDay(timeOfDay);
    });
  }

  private createOverlay(): void {
    const cam = this.scene.cameras.main;
    this.overlay = this.scene.add.rectangle(
      cam.width / 2, cam.height / 2,
      cam.width, cam.height,
      TIME_TINTS.midday, 0,
    );
    this.overlay.setScrollFactor(0);
    this.overlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.overlay.setDepth(1500);
  }

  private addVignette(): void {
    if (!this.scene.textures.exists('fx-vignette')) return;
    const cam = this.scene.cameras.main;
    this.vignette = this.scene.add.image(cam.width / 2, cam.height / 2, 'fx-vignette');
    this.vignette.setDisplaySize(cam.width, cam.height);
    this.vignette.setScrollFactor(0);
    this.vignette.setDepth(1501);
    this.vignette.setAlpha(0.6);
  }

  private handleResize(width: number, height: number): void {
    if (this.overlay) {
      this.overlay.setPosition(width / 2, height / 2);
      this.overlay.setSize(width, height);
    }
    if (this.vignette) {
      this.vignette.setPosition(width / 2, height / 2);
      this.vignette.setDisplaySize(width, height);
    }
  }

  setTimeOfDay(time: string): void {
    const tint = TIME_TINTS[time] ?? TIME_TINTS.midday;
    const alpha = TIME_ALPHAS[time] ?? 0;
    if (this.overlay) {
      this.overlay.setFillStyle(tint, alpha);
    }
  }

  startRain(): void {
    if (this.rainEmitter) return;
    const cam = this.scene.cameras.main;
    const particles = this.scene.add.particles(cam.width / 2, 0, 'fx-damage-dot', {
      speed: { min: 150, max: 250 },
      angle: { min: 85, max: 95 },
      scale: { start: 0.3, end: 0.1 },
      alpha: { start: 0.4, end: 0 },
      lifespan: 1000,
      frequency: 40,
      quantity: 3,
      emitZone: new Phaser.GameObjects.Particles.Zones.RandomZone(
        new Phaser.Geom.Rectangle(-cam.width / 2, 0, cam.width, 1) as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      ),
    });
    particles.setScrollFactor(0);
    particles.setDepth(2000);
  }

  stopRain(): void {
    // handled by particle emitter stop
  }
}
