import { COLORS } from './colorPalette';

export function generateDecorations(scene: Phaser.Scene): void {
  // Bush (20x16)
  const gBush = scene.add.graphics();
  gBush.fillStyle(0x2d8b30);
  gBush.fillCircle(10, 10, 8);
  gBush.fillStyle(0x3aa040);
  gBush.fillCircle(6, 12, 6);
  gBush.fillCircle(14, 12, 6);
  gBush.fillStyle(0x4ab850);
  gBush.fillCircle(10, 8, 5);
  // Highlight dots
  gBush.fillStyle(0x5cc860);
  gBush.fillRect(7, 6, 2, 1);
  gBush.fillRect(12, 7, 2, 1);
  gBush.generateTexture('deco-bush', 20, 16);
  gBush.destroy();

  // Horizontal fence (32x16)
  const gFenceH = scene.add.graphics();
  gFenceH.fillStyle(COLORS.wood);
  // Posts
  gFenceH.fillRect(2, 4, 4, 12);
  gFenceH.fillRect(26, 4, 4, 12);
  // Rails
  gFenceH.fillRect(2, 6, 28, 3);
  gFenceH.fillRect(2, 12, 28, 2);
  // Highlight
  gFenceH.fillStyle(COLORS.woodLight);
  gFenceH.fillRect(2, 6, 28, 1);
  gFenceH.fillRect(2, 12, 28, 1);
  // Dark edges
  gFenceH.fillStyle(COLORS.woodDark);
  gFenceH.fillRect(2, 9, 28, 1);
  gFenceH.generateTexture('deco-fence-h', 32, 16);
  gFenceH.destroy();

  // Vertical fence (16x32)
  const gFenceV = scene.add.graphics();
  gFenceV.fillStyle(COLORS.wood);
  // Posts
  gFenceV.fillRect(4, 2, 8, 4);
  gFenceV.fillRect(4, 26, 8, 4);
  // Rails
  gFenceV.fillRect(5, 2, 3, 28);
  gFenceV.fillRect(10, 2, 2, 28);
  // Highlight
  gFenceV.fillStyle(COLORS.woodLight);
  gFenceV.fillRect(5, 2, 1, 28);
  gFenceV.fillRect(10, 2, 1, 28);
  gFenceV.fillStyle(COLORS.woodDark);
  gFenceV.fillRect(8, 2, 1, 28);
  gFenceV.generateTexture('deco-fence-v', 16, 32);
  gFenceV.destroy();

  // Well (24x32)
  const gWell = scene.add.graphics();
  // Stone base
  gWell.fillStyle(COLORS.stoneDark);
  gWell.fillRect(2, 16, 20, 14);
  gWell.fillStyle(COLORS.stone);
  gWell.fillRect(4, 18, 16, 10);
  // Dark center (water hole)
  gWell.fillStyle(COLORS.waterDark);
  gWell.fillRect(8, 20, 8, 6);
  // Roof frame
  gWell.fillStyle(COLORS.wood);
  gWell.fillRect(3, 14, 2, 4);
  gWell.fillRect(19, 14, 2, 4);
  // Roof
  gWell.fillStyle(COLORS.shingleBrown);
  gWell.fillRect(0, 8, 24, 6);
  gWell.fillStyle(COLORS.shingleDark);
  gWell.fillRect(0, 8, 24, 2);
  // Roof peak
  gWell.fillRect(8, 4, 8, 4);
  // Crossbar
  gWell.fillStyle(COLORS.wood);
  gWell.fillRect(3, 10, 18, 2);
  // Rope
  gWell.fillStyle(COLORS.dirt);
  gWell.fillRect(11, 12, 1, 10);
  // Bucket hint
  gWell.fillStyle(COLORS.metalDark);
  gWell.fillRect(10, 22, 3, 3);
  gWell.generateTexture('deco-well', 24, 32);
  gWell.destroy();

  // Signpost (16x32)
  const gSign = scene.add.graphics();
  // Pole
  gSign.fillStyle(COLORS.wood);
  gSign.fillRect(6, 8, 4, 24);
  gSign.fillStyle(COLORS.woodDark);
  gSign.fillRect(6, 8, 1, 24);
  // Sign board
  gSign.fillStyle(COLORS.woodLight);
  gSign.fillRect(0, 4, 16, 10);
  gSign.fillStyle(COLORS.woodDark);
  gSign.fillRect(0, 4, 16, 1);
  gSign.fillRect(0, 13, 16, 1);
  gSign.fillRect(0, 4, 1, 10);
  gSign.fillRect(15, 4, 1, 10);
  // Arrow shape on sign
  gSign.fillStyle(COLORS.uiText);
  gSign.fillRect(3, 7, 8, 2);
  gSign.fillRect(9, 6, 2, 1);
  gSign.fillRect(9, 9, 2, 1);
  gSign.generateTexture('deco-signpost', 16, 32);
  gSign.destroy();

  // Barrel (12x16)
  const gBarrel = scene.add.graphics();
  gBarrel.fillStyle(COLORS.wood);
  gBarrel.fillRect(1, 2, 10, 12);
  gBarrel.fillStyle(COLORS.woodDark);
  gBarrel.fillRect(1, 2, 10, 1);
  gBarrel.fillRect(1, 13, 10, 1);
  gBarrel.fillRect(1, 2, 1, 12);
  gBarrel.fillRect(10, 2, 1, 12);
  // Metal bands
  gBarrel.fillStyle(COLORS.metalDark);
  gBarrel.fillRect(0, 4, 12, 1);
  gBarrel.fillRect(0, 10, 12, 1);
  // Wood plank lines
  gBarrel.fillStyle(COLORS.woodDark);
  gBarrel.fillRect(4, 2, 1, 12);
  gBarrel.fillRect(8, 2, 1, 12);
  // Top
  gBarrel.fillStyle(COLORS.woodLight);
  gBarrel.fillRect(2, 1, 8, 2);
  gBarrel.generateTexture('deco-barrel', 12, 16);
  gBarrel.destroy();

  // Crate (14x14)
  const gCrate = scene.add.graphics();
  gCrate.fillStyle(COLORS.wood);
  gCrate.fillRect(1, 1, 12, 12);
  gCrate.fillStyle(COLORS.woodDark);
  gCrate.fillRect(1, 1, 12, 1);
  gCrate.fillRect(1, 12, 12, 1);
  gCrate.fillRect(1, 1, 1, 12);
  gCrate.fillRect(12, 1, 1, 12);
  // Cross planks
  gCrate.fillRect(1, 6, 12, 1);
  gCrate.fillRect(6, 1, 1, 12);
  // Nail dots
  gCrate.fillStyle(COLORS.metalDark);
  gCrate.fillRect(3, 3, 1, 1);
  gCrate.fillRect(10, 3, 1, 1);
  gCrate.fillRect(3, 10, 1, 1);
  gCrate.fillRect(10, 10, 1, 1);
  gCrate.generateTexture('deco-crate', 14, 14);
  gCrate.destroy();

  // Flower bed (32x12)
  const gFlowerBed = scene.add.graphics();
  gFlowerBed.fillStyle(COLORS.dirtDark);
  gFlowerBed.fillRect(0, 4, 32, 8);
  gFlowerBed.fillStyle(COLORS.dirt);
  gFlowerBed.fillRect(1, 5, 30, 6);
  // Flowers
  const flowerColors = [COLORS.flowerRed, COLORS.flowerYellow, COLORS.flowerWhite, COLORS.flowerPurple];
  for (let i = 0; i < 6; i++) {
    const fx = 3 + i * 5;
    gFlowerBed.fillStyle(COLORS.cloverGreen);
    gFlowerBed.fillRect(fx, 5, 1, 3); // stem
    gFlowerBed.fillStyle(flowerColors[i % flowerColors.length]);
    gFlowerBed.fillRect(fx - 1, 3, 3, 2); // petals
    gFlowerBed.fillStyle(COLORS.flowerYellow);
    gFlowerBed.fillRect(fx, 3, 1, 1); // center
  }
  gFlowerBed.generateTexture('deco-flower-bed', 32, 12);
  gFlowerBed.destroy();
}
