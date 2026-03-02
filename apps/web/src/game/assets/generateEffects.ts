import { COLORS } from './colorPalette';

export function generateEffects(scene: Phaser.Scene): void {
  // Slash arc (24x24)
  const gSlash = scene.add.graphics();
  gSlash.lineStyle(2, COLORS.slashWhite, 0.9);
  gSlash.beginPath();
  gSlash.arc(12, 12, 10, -Math.PI * 0.3, Math.PI * 0.3);
  gSlash.strokePath();
  gSlash.lineStyle(1, 0xffddaa, 0.6);
  gSlash.beginPath();
  gSlash.arc(12, 12, 8, -Math.PI * 0.2, Math.PI * 0.2);
  gSlash.strokePath();
  gSlash.generateTexture('fx-slash', 24, 24);
  gSlash.destroy();

  // Heal sparkle (16x16)
  const gHeal = scene.add.graphics();
  gHeal.fillStyle(COLORS.healGreen);
  gHeal.fillRect(7, 2, 2, 4);
  gHeal.fillRect(7, 10, 2, 4);
  gHeal.fillRect(2, 7, 4, 2);
  gHeal.fillRect(10, 7, 4, 2);
  gHeal.fillStyle(COLORS.healSparkle);
  gHeal.fillRect(7, 7, 2, 2);
  gHeal.generateTexture('fx-heal', 16, 16);
  gHeal.destroy();

  // Smoke particle (8x8)
  const gSmoke = scene.add.graphics();
  gSmoke.fillStyle(COLORS.smokeGrey);
  gSmoke.fillCircle(4, 4, 3);
  gSmoke.fillStyle(COLORS.smokeDark);
  gSmoke.fillCircle(4, 4, 2);
  gSmoke.generateTexture('fx-smoke', 8, 8);
  gSmoke.destroy();

  // Damage number background (8x8)
  const gDmg = scene.add.graphics();
  gDmg.fillStyle(COLORS.damageRed);
  gDmg.fillCircle(4, 4, 3);
  gDmg.generateTexture('fx-damage-dot', 8, 8);
  gDmg.destroy();

  // Shield effect (24x24)
  const gShield = scene.add.graphics();
  gShield.lineStyle(2, 0x4488ff, 0.8);
  gShield.strokeCircle(12, 12, 10);
  gShield.lineStyle(1, 0x88bbff, 0.5);
  gShield.strokeCircle(12, 12, 8);
  gShield.generateTexture('fx-shield', 24, 24);
  gShield.destroy();

  // Fire particle (8x8)
  const gFire = scene.add.graphics();
  gFire.fillStyle(COLORS.fireOrange);
  gFire.fillRect(2, 2, 4, 4);
  gFire.fillStyle(0xffcc00);
  gFire.fillRect(3, 3, 2, 2);
  gFire.generateTexture('fx-fire', 8, 8);
  gFire.destroy();

  // Press-E prompt sprite (48x16)
  const gPrompt = scene.add.graphics();
  gPrompt.fillStyle(0x1a1410);
  gPrompt.fillRoundedRect(0, 0, 48, 16, 3);
  gPrompt.lineStyle(1, 0x8b5e3c);
  gPrompt.strokeRoundedRect(0, 0, 48, 16, 3);
  gPrompt.generateTexture('ui-press-e', 48, 16);
  gPrompt.destroy();

  // Enhanced tree sprite (48x80) — multi-layered canopy
  const gTree = scene.add.graphics();
  // Trunk with bark texture
  gTree.fillStyle(COLORS.wood);
  gTree.fillRect(20, 48, 8, 32);
  // Bark dark side
  gTree.fillStyle(COLORS.woodDark);
  gTree.fillRect(20, 48, 3, 32);
  // Bark highlight
  gTree.fillStyle(COLORS.woodLight);
  gTree.fillRect(25, 50, 2, 28);
  // Branch stubs
  gTree.fillStyle(COLORS.wood);
  gTree.fillRect(16, 52, 4, 3);
  gTree.fillRect(28, 56, 4, 3);
  // Canopy layer 1 (darkest, back)
  gTree.fillStyle(0x1f6b22);
  gTree.fillCircle(24, 28, 20);
  // Canopy layer 2 (mid)
  gTree.fillStyle(0x2d8b30);
  gTree.fillCircle(20, 32, 16);
  gTree.fillCircle(28, 32, 16);
  // Canopy layer 3 (lightest, front)
  gTree.fillStyle(0x3aa040);
  gTree.fillCircle(24, 26, 14);
  gTree.fillCircle(16, 34, 10);
  gTree.fillCircle(32, 34, 10);
  // Highlight spots
  gTree.fillStyle(0x4ab850);
  gTree.fillCircle(22, 20, 6);
  gTree.fillCircle(30, 28, 5);
  // Light dapple
  gTree.fillStyle(0x5cc860);
  gTree.fillRect(18, 18, 2, 2);
  gTree.fillRect(28, 24, 2, 2);
  gTree.fillRect(22, 30, 2, 2);
  gTree.generateTexture('tree', 48, 80);
  gTree.destroy();

  // Tree variant 2 — slightly different shape
  const gTree2 = scene.add.graphics();
  gTree2.fillStyle(COLORS.wood);
  gTree2.fillRect(21, 50, 7, 30);
  gTree2.fillStyle(COLORS.woodDark);
  gTree2.fillRect(21, 50, 2, 30);
  gTree2.fillStyle(COLORS.woodLight);
  gTree2.fillRect(26, 52, 1, 26);
  // Canopy
  gTree2.fillStyle(0x1f6b22);
  gTree2.fillCircle(24, 30, 18);
  gTree2.fillStyle(0x2d8b30);
  gTree2.fillCircle(18, 28, 14);
  gTree2.fillCircle(30, 28, 14);
  gTree2.fillStyle(0x3aa040);
  gTree2.fillCircle(24, 24, 12);
  gTree2.fillStyle(0x4ab850);
  gTree2.fillCircle(20, 22, 5);
  gTree2.fillCircle(28, 22, 4);
  gTree2.generateTexture('tree-2', 48, 80);
  gTree2.destroy();

  // Tree variant 3 — taller/narrower
  const gTree3 = scene.add.graphics();
  gTree3.fillStyle(COLORS.wood);
  gTree3.fillRect(22, 46, 6, 34);
  gTree3.fillStyle(COLORS.woodDark);
  gTree3.fillRect(22, 46, 2, 34);
  // Conical canopy
  gTree3.fillStyle(0x1f6b22);
  gTree3.beginPath();
  gTree3.moveTo(24, 4);
  gTree3.lineTo(40, 48);
  gTree3.lineTo(8, 48);
  gTree3.closePath();
  gTree3.fillPath();
  gTree3.fillStyle(0x2d8b30);
  gTree3.beginPath();
  gTree3.moveTo(24, 10);
  gTree3.lineTo(36, 44);
  gTree3.lineTo(12, 44);
  gTree3.closePath();
  gTree3.fillPath();
  gTree3.fillStyle(0x3aa040);
  gTree3.beginPath();
  gTree3.moveTo(24, 16);
  gTree3.lineTo(32, 40);
  gTree3.lineTo(16, 40);
  gTree3.closePath();
  gTree3.fillPath();
  gTree3.generateTexture('tree-3', 48, 80);
  gTree3.destroy();

  // Dust mote (4x4)
  const gDust = scene.add.graphics();
  gDust.fillStyle(COLORS.dustMote);
  gDust.fillCircle(2, 2, 1.5);
  gDust.generateTexture('fx-dust', 4, 4);
  gDust.destroy();

  // Firefly (6x6)
  const gFirefly = scene.add.graphics();
  gFirefly.fillStyle(COLORS.fireflyGold);
  gFirefly.fillCircle(3, 3, 2);
  gFirefly.fillStyle(COLORS.fireflyGreen);
  gFirefly.fillCircle(3, 3, 1);
  gFirefly.generateTexture('fx-firefly', 6, 6);
  gFirefly.destroy();

  // Vignette overlay (64x64, will be scaled to screen)
  const gVignette = scene.add.graphics();
  const vSize = 64;
  // Radial gradient approximation with concentric rects at increasing alpha
  for (let i = 0; i < 16; i++) {
    const alpha = (i / 16) * 0.4;
    const inset = Math.floor((16 - i) * (vSize / 32));
    gVignette.fillStyle(0x000000, alpha);
    gVignette.fillRect(0, 0, vSize, inset); // top
    gVignette.fillRect(0, vSize - inset, vSize, inset); // bottom
    gVignette.fillRect(0, 0, inset, vSize); // left
    gVignette.fillRect(vSize - inset, 0, inset, vSize); // right
  }
  gVignette.generateTexture('fx-vignette', vSize, vSize);
  gVignette.destroy();

  // Leaf particle (8x8)
  const gLeaf = scene.add.graphics();
  gLeaf.fillStyle(COLORS.leafGreen);
  gLeaf.fillRect(2, 1, 4, 6);
  gLeaf.fillStyle(COLORS.leafBrown);
  gLeaf.fillRect(3, 1, 1, 6);
  gLeaf.fillRect(1, 3, 1, 2);
  gLeaf.fillRect(6, 2, 1, 2);
  gLeaf.generateTexture('fx-leaf', 8, 8);
  gLeaf.destroy();
}
