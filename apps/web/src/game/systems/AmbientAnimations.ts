import Phaser from 'phaser';

export class AmbientAnimations {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  addSmoke(x: number, y: number): void {
    const particles = this.scene.add.particles(x, y, 'fx-smoke', {
      speed: { min: 8, max: 20 },
      angle: { min: 255, max: 285 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 3000,
      frequency: 600,
      quantity: 1,
      gravityY: -5,
    });
    particles.setDepth(1000);
  }

  addWaterShimmer(x: number, y: number, width: number, height: number): void {
    const particles = this.scene.add.particles(x, y, 'fx-heal', {
      speed: { min: 1, max: 5 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.4, end: 0 },
      lifespan: 1500,
      frequency: 800,
      quantity: 1,
      emitZone: new Phaser.GameObjects.Particles.Zones.RandomZone(
        new Phaser.Geom.Rectangle(0, 0, width, height) as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      ),
    });
    particles.setDepth(5);
  }

  addFloatingDust(): void {
    const cam = this.scene.cameras.main;
    const particles = this.scene.add.particles(0, 0, 'fx-dust', {
      speed: { min: 2, max: 8 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0.2 },
      alpha: { start: 0.3, end: 0 },
      lifespan: 6000,
      frequency: 400,
      quantity: 1,
      emitZone: new Phaser.GameObjects.Particles.Zones.RandomZone(
        new Phaser.Geom.Rectangle(0, 0, cam.width, cam.height) as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      ),
    });
    particles.setScrollFactor(0);
    particles.setDepth(1500);
  }

  addFireflies(x: number, y: number, width: number, height: number): void {
    const particles = this.scene.add.particles(x, y, 'fx-firefly', {
      speed: { min: 3, max: 12 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0.2 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 4000,
      frequency: 1200,
      quantity: 1,
      emitZone: new Phaser.GameObjects.Particles.Zones.RandomZone(
        new Phaser.Geom.Rectangle(0, 0, width, height) as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      ),
    });
    particles.setDepth(1200);
  }

  addLeafParticles(x: number, y: number, width: number, height: number): void {
    const particles = this.scene.add.particles(x, y, 'fx-leaf', {
      speed: { min: 5, max: 15 },
      angle: { min: 80, max: 110 },
      scale: { start: 0.8, end: 0.3 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 5000,
      frequency: 2000,
      quantity: 1,
      rotate: { min: 0, max: 360 },
      emitZone: new Phaser.GameObjects.Particles.Zones.RandomZone(
        new Phaser.Geom.Rectangle(0, 0, width, height) as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      ),
    });
    particles.setDepth(1100);
  }
}
