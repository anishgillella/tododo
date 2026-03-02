import Phaser from 'phaser';
import { TILE_SIZE, MAP_COLS, MAP_ROWS, MAP_PX_W, MAP_PX_H } from '../constants';
import { Player } from '../entities/Player';
import { Building, type BuildingConfig } from '../entities/Building';
import { NpcCharacter, type NpcConfig } from '../entities/NpcCharacter';
import { Tree } from '../entities/Tree';
import { Decoration } from '../entities/Decoration';
import { PlayerController } from '../systems/PlayerController';
import { ProximitySystem } from '../systems/ProximitySystem';
import { AmbientAnimations } from '../systems/AmbientAnimations';
import { WeatherRenderer } from '../systems/WeatherRenderer';
import { bridge } from '../PhaserBridge';
import type { OverlayRoute } from '../../stores/villageStore';

const T = TILE_SIZE;

const BUILDINGS: BuildingConfig[] = [
  { name: 'Guild Hall', route: '/command-deck' as OverlayRoute, texture: 'building-guild', x: 30 * T, y: 24 * T },
  { name: 'Twilight Hearth', route: '/tavern' as OverlayRoute, texture: 'building-tavern', x: 18 * T, y: 30 * T },
  { name: 'Training Yard', route: '/training-grounds' as OverlayRoute, texture: 'building-training', x: 42 * T, y: 30 * T },
  { name: "Blacksmith's Forge", route: '/forge' as OverlayRoute, texture: 'building-forge', x: 21 * T, y: 18 * T },
  { name: "Chronicler's Tower", route: '/daily-recap' as OverlayRoute, texture: 'building-chronicler', x: 39 * T, y: 18 * T },
  { name: "Elder's Study", route: '/settings' as OverlayRoute, texture: 'building-elder', x: 45 * T, y: 24 * T },
  { name: 'Rift Gate', route: '/rift-gate' as OverlayRoute, texture: 'building-rift', x: 30 * T, y: 12 * T },
];

const NPC_CONFIGS: NpcConfig[] = [
  { id: 'axiom', name: 'AXIOM', texture: 'npc-axiom', x: 33 * T, y: 25 * T, wanderRadius: 40 },
  { id: 'kael', name: 'Kael', texture: 'npc-kael', x: 43 * T, y: 31 * T, wanderRadius: 50 },
  { id: 'mira', name: 'Mira', texture: 'npc-mira', x: 19 * T, y: 31 * T, wanderRadius: 40 },
  { id: 'the-hollow', name: 'The Hollow', texture: 'npc-hollow', x: 30 * T, y: 13 * T, wanderRadius: 30, visible: false },
];

const TREE_POSITIONS: [number, number][] = [
  [6, 7], [12, 5], [48, 6], [54, 8],
  [4, 22], [56, 22], [7, 45], [53, 45],
  [12, 52], [48, 52], [22, 54], [38, 54],
  [4, 38], [56, 38], [9, 15], [51, 15],
  [15, 9], [45, 9], [3, 30], [57, 30],
  [10, 40], [50, 40], [25, 7], [35, 7],
  [8, 50], [52, 50], [20, 48], [40, 48],
];

// Water pond area (expanded)
const WATER_X1 = 24;
const WATER_X2 = 35;
const WATER_Y1 = 42;
const WATER_Y2 = 47;

export class VillageScene extends Phaser.Scene {
  private player!: Player;
  private controller!: PlayerController;
  private proximity!: ProximitySystem;
  private ambient!: AmbientAnimations;
  private weather!: WeatherRenderer;
  private buildings: Building[] = [];
  private npcs: NpcCharacter[] = [];
  private waterTiles: Phaser.GameObjects.Image[] = [];
  private waterFrameIndex = 0;

  constructor() {
    super({ key: 'Village' });
  }

  create(): void {
    // Build tilemap
    this.buildTilemap();

    // Create buildings
    for (const config of BUILDINGS) {
      const building = new Building(this, config);
      this.buildings.push(building);
    }

    // Create NPCs
    for (const config of NPC_CONFIGS) {
      const npc = new NpcCharacter(this, config);
      this.npcs.push(npc);
    }

    // Create trees
    for (const [tx, ty] of TREE_POSITIONS) {
      new Tree(this, tx * T, ty * T);
    }

    // Scatter decorations
    this.scatterDecorations();

    // Create player at village center
    this.player = new Player(this, 30 * T, 33 * T);

    // Collision: player vs building bodies
    const buildingBodies = this.buildings.map((b) => b.collisionBody);
    for (const body of buildingBodies) {
      this.physics.add.collider(this.player, body);
    }

    // World bounds
    this.physics.world.setBounds(0, 0, MAP_PX_W, MAP_PX_H);
    this.player.setCollideWorldBounds(true);

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(60, 45);
    this.cameras.main.setBounds(0, 0, MAP_PX_W, MAP_PX_H);

    // Systems
    this.controller = new PlayerController(this, this.player);
    this.proximity = new ProximitySystem(this, this.player, this.buildings, this.npcs);
    this.ambient = new AmbientAnimations(this);
    this.weather = new WeatherRenderer(this);

    // Add smoke to tavern and forge chimneys
    const tavern = this.buildings.find((b) => b.buildingName === 'Twilight Hearth');
    const forge = this.buildings.find((b) => b.buildingName === "Blacksmith's Forge");
    if (tavern) this.ambient.addSmoke(tavern.x + 20, tavern.y - 120);
    if (forge) this.ambient.addSmoke(forge.x + 20, forge.y - 120);

    // Water shimmer at pond
    this.ambient.addWaterShimmer(WATER_X1 * T, WATER_Y1 * T, (WATER_X2 - WATER_X1 + 1) * T, (WATER_Y2 - WATER_Y1 + 1) * T);

    // Floating dust globally
    this.ambient.addFloatingDust();

    // Fireflies near pond
    this.ambient.addFireflies(WATER_X1 * T, WATER_Y1 * T, (WATER_X2 - WATER_X1 + 1) * T, (WATER_Y2 - WATER_Y1 + 1) * T);

    // Leaf particles near tree clusters
    this.ambient.addLeafParticles(10 * T, 8 * T, 12 * T, 12 * T);
    this.ambient.addLeafParticles(45 * T, 8 * T, 12 * T, 12 * T);

    // Water animation timer
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        this.waterFrameIndex = (this.waterFrameIndex + 1) % 3;
        for (const tile of this.waterTiles) {
          tile.setTexture(`tile-water-${this.waterFrameIndex}`);
        }
      },
    });

    // Bridge: pause/resume on overlay
    bridge.on('overlay:opened', () => {
      this.controller.setEnabled(false);
    });
    bridge.on('overlay:closed', () => {
      this.controller.setEnabled(true);
    });

    // Bridge: combat
    bridge.on('combat:start', () => {
      this.scene.pause();
      this.scene.launch('Combat');
    });
  }

  update(_time: number, _delta: number): void {
    this.controller.update();
    this.proximity.update();
  }

  private buildTilemap(): void {
    for (let y = 0; y < MAP_ROWS; y++) {
      for (let x = 0; x < MAP_COLS; x++) {
        const px = x * T;
        const py = y * T;

        // Water pond area
        if (x >= WATER_X1 && x <= WATER_X2 && y >= WATER_Y1 && y <= WATER_Y2) {
          // Check if this is a shore tile
          const shoreDir = this.getShoreDirection(x, y);
          if (shoreDir) {
            this.add.image(px, py, `tile-shore-${shoreDir}`).setOrigin(0).setDepth(0);
          } else {
            const waterTile = this.add.image(px, py, 'tile-water-0').setOrigin(0).setDepth(0);
            this.waterTiles.push(waterTile);
          }
          continue;
        }

        // Paths
        if (this.isPath(x, y)) {
          const tileKey = this.getPathTileKey(x, y);
          this.add.image(px, py, tileKey).setOrigin(0).setDepth(0);
          continue;
        }

        // Grass variants
        const grassVariant = this.getGrassVariant(x, y);
        this.add.image(px, py, `tile-grass-${grassVariant}`).setOrigin(0).setDepth(0);
      }
    }
  }

  private getShoreDirection(x: number, y: number): string | null {
    // Shore tiles are at the edges of the water area
    const isTop = y === WATER_Y1;
    const isBottom = y === WATER_Y2;
    const isLeft = x === WATER_X1;
    const isRight = x === WATER_X2;

    if (isTop && !isLeft && !isRight) return 'n';
    if (isBottom && !isLeft && !isRight) return 's';
    if (isLeft && !isTop && !isBottom) return 'w';
    if (isRight && !isTop && !isBottom) return 'e';
    // Corners treated as water
    return null;
  }

  private getPathTileKey(x: number, y: number): string {
    const n = this.isPath(x, y - 1);
    const s = this.isPath(x, y + 1);
    const e = this.isPath(x + 1, y);
    const w = this.isPath(x - 1, y);

    // Check if surrounded on all sides
    if (n && s && e && w) return 'tile-path-center';

    // Edge tiles: path on one side, grass on opposite
    if (!n && s && e && w) return 'tile-path-n';
    if (n && !s && e && w) return 'tile-path-s';
    if (n && s && !e && w) return 'tile-path-e';
    if (n && s && e && !w) return 'tile-path-w';

    // Corner tiles
    if (!n && !w && s && e) return 'tile-path-nw';
    if (!n && !e && s && w) return 'tile-path-ne';
    if (!s && !w && n && e) return 'tile-path-sw';
    if (!s && !e && n && w) return 'tile-path-se';

    return 'tile-path-center';
  }

  private getGrassVariant(x: number, y: number): number {
    // Deterministic pseudo-random based on position
    const hash = ((x * 7919 + y * 6271) & 0xffff) % 100;
    if (hash < 50) return 0; // 50% base grass
    if (hash < 65) return 1; // 15% flowers
    if (hash < 78) return 2; // 13% clover
    if (hash < 90) return 3; // 12% tall grass
    return 4; // 10% yellow-ish
  }

  private isPath(x: number, y: number): boolean {
    // Horizontal main road: y=28-30, from x=15 to x=45
    if (y >= 28 && y <= 30 && x >= 15 && x <= 45) return true;
    // Vertical main road: x=29-31, from y=12 to y=36
    if (x >= 29 && x <= 31 && y >= 12 && y <= 36) return true;

    // Side paths to buildings (scaled positions)
    // To forge (21, 18)
    if (x >= 21 && x <= 29 && y >= 21 && y <= 23) return true;
    // To chronicler (39, 18)
    if (x >= 31 && x <= 39 && y >= 21 && y <= 23) return true;
    // To tavern (18, 30)
    if (x >= 15 && x <= 20 && y >= 28 && y <= 30) return true;
    // To training (42, 30)
    if (x >= 40 && x <= 45 && y >= 28 && y <= 30) return true;
    // To elder (45, 24)
    if (x >= 43 && x <= 45 && y >= 24 && y <= 28) return true;
    // Path to pond
    if (x >= 29 && x <= 31 && y >= 36 && y <= 42) return true;

    return false;
  }

  private isWater(x: number, y: number): boolean {
    return x >= WATER_X1 && x <= WATER_X2 && y >= WATER_Y1 && y <= WATER_Y2;
  }

  private scatterDecorations(): void {
    const decoTypes = ['deco-bush', 'deco-barrel', 'deco-crate', 'deco-flower-bed'];

    // Place decorations on grass tiles, avoiding paths, water, and buildings
    for (let i = 0; i < 40; i++) {
      const tx = Phaser.Math.Between(2, MAP_COLS - 3);
      const ty = Phaser.Math.Between(2, MAP_ROWS - 3);

      if (this.isPath(tx, ty) || this.isWater(tx, ty)) continue;
      if (this.isBuildingArea(tx, ty)) continue;

      const decoKey = decoTypes[Phaser.Math.Between(0, decoTypes.length - 1)];
      new Decoration(this, tx * T, ty * T, decoKey);
    }

    // Place some signposts near paths
    const signPositions: [number, number][] = [[16, 27], [44, 27], [28, 13]];
    for (const [sx, sy] of signPositions) {
      new Decoration(this, sx * T, sy * T, 'deco-signpost');
    }

    // Place well near center
    new Decoration(this, 34 * T, 34 * T, 'deco-well');

    // Fences near training yard
    for (let fx = 40; fx <= 44; fx += 2) {
      new Decoration(this, fx * T, 33 * T, 'deco-fence-h');
    }

    // Scatter rocks and mushrooms
    for (let i = 0; i < 25; i++) {
      const tx = Phaser.Math.Between(1, MAP_COLS - 2);
      const ty = Phaser.Math.Between(1, MAP_ROWS - 2);
      if (this.isPath(tx, ty) || this.isWater(tx, ty)) continue;
      const key = Math.random() > 0.6 ? 'deco-mushroom' : 'deco-rock-small';
      const sprite = this.add.image(tx * T + Phaser.Math.Between(0, T), ty * T + Phaser.Math.Between(0, T), key)
        .setOrigin(0.5, 1)
        .setDepth(1);
      sprite.setScale(Phaser.Math.FloatBetween(0.8, 1.2));
    }
  }

  private isBuildingArea(tx: number, ty: number): boolean {
    for (const b of BUILDINGS) {
      const bx = b.x / T;
      const by = b.y / T;
      if (Math.abs(tx - bx) < 5 && Math.abs(ty - by) < 5) return true;
    }
    return false;
  }
}
