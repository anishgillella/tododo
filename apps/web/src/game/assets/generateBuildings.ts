import { COLORS, darken, lighten } from './colorPalette';

export function generateBuildings(scene: Phaser.Scene): void {
  const W = 96;
  const H = 128;

  // ── Drawing helpers ────────────────────────────────────────────────

  /** Fill the wall area with horizontal wood planks and seam lines. */
  function drawWoodPlanks(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    // Base fill
    g.fillStyle(COLORS.wood);
    g.fillRect(x, y, w, h);

    const plankH = 10;
    const colors = [COLORS.woodPlank1, COLORS.woodPlank2];
    for (let row = 0; row * plankH < h; row++) {
      const py = y + row * plankH;
      const ph = Math.min(plankH, y + h - py);
      g.fillStyle(colors[row % 2]);
      g.fillRect(x, py, w, ph);
      // 1px seam between planks
      g.fillStyle(COLORS.woodDark);
      g.fillRect(x, py, w, 1);
    }

    // Left / right wall edges
    g.fillStyle(COLORS.woodDark);
    g.fillRect(x, y, 2, h);
    g.fillRect(x + w - 2, y, 2, h);
  }

  /** Fill the wall area with staggered stone bricks and mortar. */
  function drawStoneBricks(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    // Base fill
    g.fillStyle(COLORS.stoneWall);
    g.fillRect(x, y, w, h);

    const brickW = 16;
    const brickH = 10;
    const colors = [COLORS.stoneBrick, COLORS.stoneWallLight];

    for (let row = 0; row * brickH < h; row++) {
      const by = y + row * brickH;
      const bh = Math.min(brickH, y + h - by);
      const offset = (row % 2 === 1) ? brickW / 2 : 0;
      let ci = 0;
      for (let bx = x - offset; bx < x + w; bx += brickW) {
        const clippedX = Math.max(bx, x);
        const clippedW = Math.min(bx + brickW, x + w) - clippedX;
        if (clippedW <= 0) continue;
        g.fillStyle(colors[ci % 2]);
        g.fillRect(clippedX, by, clippedW, bh);
        // Mortar right edge
        g.fillStyle(COLORS.stoneBrickDark);
        if (bx + brickW <= x + w && bx + brickW >= x) {
          g.fillRect(bx + brickW - 1, by, 1, bh);
        }
        ci++;
      }
      // Mortar row line
      g.fillStyle(COLORS.stoneBrickDark);
      g.fillRect(x, by, w, 1);
    }

    // Left / right edges
    g.fillStyle(COLORS.stoneBrickDark);
    g.fillRect(x, y, 2, h);
    g.fillRect(x + w - 2, y, 2, h);
  }

  /** Draw a shingled / thatched triangular roof with layered rows. */
  function drawRoof(
    g: Phaser.GameObjects.Graphics,
    roofColor: number,
    roofH: number,
    isThatch: boolean,
  ) {
    const peakX = W / 2;
    const peakY = 4;
    const baseY = roofH + 4;
    const leftX = 2;
    const rightX = W - 2;

    // Solid roof fill
    g.fillStyle(roofColor);
    g.beginPath();
    g.moveTo(leftX, baseY);
    g.lineTo(peakX, peakY);
    g.lineTo(rightX, baseY);
    g.closePath();
    g.fillPath();

    // Outline
    g.lineStyle(1, darken(roofColor, 0.35));
    g.beginPath();
    g.moveTo(leftX, baseY);
    g.lineTo(peakX, peakY);
    g.lineTo(rightX, baseY);
    g.closePath();
    g.strokePath();

    // Shingle / thatch rows (scalloped layers)
    const rowH = isThatch ? 7 : 6;
    const darkShade = darken(roofColor, 0.2);
    const lightShade = lighten(roofColor, 0.15);

    for (let ry = peakY + rowH; ry < baseY; ry += rowH) {
      const t = (ry - peakY) / (baseY - peakY); // 0..1
      const halfW = (rightX - leftX) / 2 * t;
      const rowLeft = peakX - halfW;
      const rowRight = peakX + halfW;
      const rowWidth = rowRight - rowLeft;
      if (rowWidth < 4) continue;

      // Shadow line at bottom of each row
      g.fillStyle(darkShade);
      g.fillRect(Math.floor(rowLeft), ry, Math.ceil(rowWidth), 1);

      // Scallop bumps (light highlight dashes)
      const scallop = isThatch ? 8 : 6;
      for (let sx = Math.floor(rowLeft) + 2; sx < rowRight - 2; sx += scallop) {
        const sw = Math.min(scallop - 2, Math.floor(rowRight) - sx);
        if (sw <= 0) continue;
        g.fillStyle(lightShade);
        g.fillRect(sx, ry - 1, sw, 1);
      }
    }

    // Peak ornament dot
    g.fillStyle(lighten(roofColor, 0.3));
    g.fillRect(peakX - 1, peakY, 3, 3);
  }

  /** Draw a single window with frame, glass, cross pane, and glow halo. */
  function drawWindow(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    ww: number,
    wh: number,
  ) {
    // Warm glow halo (concentric rectangles behind window)
    const haloSizes = [
      { pad: 6, alpha: 0.08 },
      { pad: 3, alpha: 0.15 },
    ];
    for (const { pad, alpha } of haloSizes) {
      g.fillStyle(COLORS.windowGlow, alpha);
      g.fillRect(cx - pad, cy - pad, ww + pad * 2, wh + pad * 2);
    }

    // Frame
    g.fillStyle(COLORS.doorFrame);
    g.fillRect(cx - 2, cy - 2, ww + 4, wh + 4);

    // Glass
    g.fillStyle(COLORS.windowGlass);
    g.fillRect(cx, cy, ww, wh);

    // Cross pane dividers (1px)
    g.fillStyle(COLORS.doorFrame);
    g.fillRect(cx, cy + Math.floor(wh / 2), ww, 1);
    g.fillRect(cx + Math.floor(ww / 2), cy, 1, wh);
  }

  /** Draw the door at bottom center of wall. */
  function drawDoor(
    g: Phaser.GameObjects.Graphics,
    wallLeft: number,
    wallWidth: number,
  ) {
    const doorW = 14;
    const doorH = 22;
    const dx = wallLeft + Math.floor(wallWidth / 2) - Math.floor(doorW / 2);
    const dy = H - doorH;

    // Door frame
    g.fillStyle(COLORS.doorFrame);
    g.fillRect(dx - 2, dy - 2, doorW + 4, doorH + 2);

    // Door fill
    g.fillStyle(COLORS.doorWood);
    g.fillRect(dx, dy, doorW, doorH);

    // Plank line down the middle
    g.fillStyle(darken(COLORS.doorWood, 0.2));
    g.fillRect(dx + Math.floor(doorW / 2), dy, 1, doorH);

    // Handle dot (2x2) on the right side
    g.fillStyle(COLORS.metalDark);
    g.fillRect(dx + doorW - 4, dy + Math.floor(doorH / 2), 2, 2);

    // Stone step below door
    g.fillStyle(COLORS.stoneDark);
    g.fillRect(dx - 2, H - 2, doorW + 4, 2);
  }

  /** Draw a chimney rectangle on one side of the roof. */
  function drawChimney(
    g: Phaser.GameObjects.Graphics,
    roofH: number,
    side: 'left' | 'right',
  ) {
    const cw = 8;
    const ch = 16;
    const cx = side === 'left' ? 14 : W - 14 - cw;
    const cy = roofH - ch + 6;

    g.fillStyle(COLORS.chimney);
    g.fillRect(cx, cy, cw, ch);

    // Darker front face
    g.fillStyle(COLORS.chimneyDark);
    g.fillRect(cx, cy, cw, 2);
    g.fillRect(cx, cy, 2, ch);

    // Cap
    g.fillStyle(COLORS.chimney);
    g.fillRect(cx - 1, cy, cw + 2, 3);
  }

  /** Draw a small accent banner/sign below the roofline. */
  function drawBanner(
    g: Phaser.GameObjects.Graphics,
    accentColor: number,
    roofBaseY: number,
    wallLeft: number,
    wallWidth: number,
  ) {
    const bw = 12;
    const bh = 6;
    const bx = wallLeft + Math.floor(wallWidth / 2) - Math.floor(bw / 2);
    const by = roofBaseY + 2;

    // Hanging rod
    g.fillStyle(COLORS.metalDark);
    g.fillRect(bx, by, bw, 1);

    // Banner body
    g.fillStyle(accentColor);
    g.fillRect(bx + 1, by + 1, bw - 2, bh);

    // Subtle highlight stripe
    g.fillStyle(lighten(accentColor, 0.25));
    g.fillRect(bx + 2, by + 2, bw - 4, 1);
  }

  // ── Building generator ─────────────────────────────────────────────

  interface BuildingOpts {
    key: string;
    wallType: 'wood' | 'stone';
    roofColor: number;
    isThatchRoof: boolean;
    accentColor: number;
    hasChimney: boolean;
    chimneySide?: 'left' | 'right';
  }

  function makeBuilding(opts: BuildingOpts) {
    const {
      key,
      wallType,
      roofColor,
      isThatchRoof,
      accentColor,
      hasChimney,
      chimneySide = 'right',
    } = opts;

    const g = scene.add.graphics();
    const roofH = 48;
    const wallTop = roofH + 4;
    const wallH = H - wallTop;
    const wallLeft = 8;
    const wallWidth = W - 16;

    // 1. Walls
    if (wallType === 'wood') {
      drawWoodPlanks(g, wallLeft, wallTop, wallWidth, wallH);
    } else {
      drawStoneBricks(g, wallLeft, wallTop, wallWidth, wallH);
    }

    // 2. Roof
    drawRoof(g, roofColor, roofH, isThatchRoof);

    // 3. Chimney (drawn over roof)
    if (hasChimney) {
      drawChimney(g, roofH, chimneySide);
    }

    // 4. Windows — two, symmetric
    const winW = 10;
    const winH = 10;
    const winY = wallTop + 12;
    drawWindow(g, wallLeft + 8, winY, winW, winH);
    drawWindow(g, wallLeft + wallWidth - 8 - winW, winY, winW, winH);

    // 5. Door
    drawDoor(g, wallLeft, wallWidth);

    // 6. Banner / sign
    drawBanner(g, accentColor, wallTop, wallLeft, wallWidth);

    // 7. Accent strip along roofline
    g.fillStyle(accentColor, 0.6);
    g.fillRect(wallLeft, wallTop, wallWidth, 2);

    g.generateTexture(key, W, H);
    g.destroy();
  }

  // ── Generate the 6 standard buildings ──────────────────────────────

  // 1. Guild hall — stone + thatch, purple accent, chimney
  makeBuilding({
    key: 'building-guild',
    wallType: 'stone',
    roofColor: COLORS.thatch,
    isThatchRoof: true,
    accentColor: 0x7c3aed,
    hasChimney: true,
    chimneySide: 'right',
  });

  // 2. Tavern — wood + thatch, gold accent, chimney
  makeBuilding({
    key: 'building-tavern',
    wallType: 'wood',
    roofColor: COLORS.thatch,
    isThatchRoof: true,
    accentColor: 0xf59e0b,
    hasChimney: true,
    chimneySide: 'left',
  });

  // 3. Training grounds — wood + dark thatch, green accent
  makeBuilding({
    key: 'building-training',
    wallType: 'wood',
    roofColor: COLORS.thatchDark,
    isThatchRoof: true,
    accentColor: 0x10b981,
    hasChimney: false,
  });

  // 4. Forge — stone + stone roof, gold accent, chimney
  makeBuilding({
    key: 'building-forge',
    wallType: 'stone',
    roofColor: COLORS.stoneWallDark,
    isThatchRoof: false,
    accentColor: 0xf59e0b,
    hasChimney: true,
    chimneySide: 'right',
  });

  // 5. Chronicler — stone + thatch, cyan accent
  makeBuilding({
    key: 'building-chronicler',
    wallType: 'stone',
    roofColor: COLORS.thatch,
    isThatchRoof: true,
    accentColor: 0x06b6d4,
    hasChimney: false,
  });

  // 6. Elder hall — stone + dark stone roof, dark blue accent
  makeBuilding({
    key: 'building-elder',
    wallType: 'stone',
    roofColor: COLORS.stoneDark,
    isThatchRoof: false,
    accentColor: 0x3a3a52,
    hasChimney: false,
  });

  // ── 7. Rift Gate — special arch structure ──────────────────────────

  {
    const g = scene.add.graphics();
    const pillarW = 16;
    const pillarH = 80;
    const pillarTop = H - pillarH;
    const pillarLeftX = 8;
    const pillarRightX = W - 8 - pillarW;
    const archCenterX = W / 2;
    const archCenterY = pillarTop + 8;
    const archOuterR = (pillarRightX + pillarW - pillarLeftX) / 2;
    const archInnerR = archOuterR - pillarW;

    // --- Stone pillars ---
    // Left pillar
    g.fillStyle(COLORS.stoneDark);
    g.fillRect(pillarLeftX, pillarTop, pillarW, pillarH);
    // Left pillar highlight
    g.fillStyle(COLORS.stoneWall);
    g.fillRect(pillarLeftX + 2, pillarTop, pillarW - 4, pillarH);
    // Left pillar edge shadow
    g.fillStyle(COLORS.stoneBrickDark);
    g.fillRect(pillarLeftX, pillarTop, 2, pillarH);
    g.fillRect(pillarLeftX + pillarW - 2, pillarTop, 2, pillarH);

    // Right pillar
    g.fillStyle(COLORS.stoneDark);
    g.fillRect(pillarRightX, pillarTop, pillarW, pillarH);
    g.fillStyle(COLORS.stoneWall);
    g.fillRect(pillarRightX + 2, pillarTop, pillarW - 4, pillarH);
    g.fillStyle(COLORS.stoneBrickDark);
    g.fillRect(pillarRightX, pillarTop, 2, pillarH);
    g.fillRect(pillarRightX + pillarW - 2, pillarTop, 2, pillarH);

    // Horizontal brick lines on pillars
    for (let by = pillarTop + 10; by < H; by += 10) {
      g.fillStyle(COLORS.stoneBrickDark);
      g.fillRect(pillarLeftX, by, pillarW, 1);
      g.fillRect(pillarRightX, by, pillarW, 1);
    }

    // Pillar caps (top ledge)
    g.fillStyle(COLORS.stoneWallLight);
    g.fillRect(pillarLeftX - 2, pillarTop, pillarW + 4, 4);
    g.fillRect(pillarRightX - 2, pillarTop, pillarW + 4, 4);

    // --- Stone arch (semicircle) ---
    // Outer arch
    g.fillStyle(COLORS.stoneDark);
    g.beginPath();
    g.arc(archCenterX, archCenterY, archOuterR, Math.PI, 0, false);
    g.fillPath();

    // Inner arch cutout (portal opening)
    g.fillStyle(0x220000);
    g.beginPath();
    g.arc(archCenterX, archCenterY, archInnerR, Math.PI, 0, false);
    g.fillPath();

    // Arch highlight on outer edge
    g.lineStyle(2, COLORS.stoneWallLight);
    g.beginPath();
    g.arc(archCenterX, archCenterY, archOuterR - 1, Math.PI, 0, false);
    g.strokePath();

    // Arch inner stone edge
    g.lineStyle(1, COLORS.stoneBrickDark);
    g.beginPath();
    g.arc(archCenterX, archCenterY, archInnerR + 1, Math.PI, 0, false);
    g.strokePath();

    // Keystone at top of arch
    g.fillStyle(COLORS.stoneWallLight);
    g.fillRect(archCenterX - 4, archCenterY - archOuterR - 1, 8, 6);
    g.fillStyle(COLORS.stoneBrickDark);
    g.fillRect(archCenterX - 4, archCenterY - archOuterR + 4, 8, 1);

    // --- Inner portal area (rectangular portion below semicircle) ---
    const portalLeft = pillarLeftX + pillarW;
    const portalRight = pillarRightX;
    const portalWidth = portalRight - portalLeft;
    const portalTop = archCenterY;
    const portalBottom = H;

    // Dark background
    g.fillStyle(0x220000);
    g.fillRect(portalLeft, portalTop, portalWidth, portalBottom - portalTop);

    // Red inner glow — semicircle in upper portion
    g.fillStyle(0xef4444, 0.6);
    g.beginPath();
    g.arc(archCenterX, archCenterY, archInnerR - 3, Math.PI, 0, false);
    g.fillPath();

    // Red glow in rectangular body
    g.fillStyle(0xef4444, 0.4);
    g.fillRect(portalLeft + 3, portalTop, portalWidth - 6, portalBottom - portalTop);

    // Brighter core glow (smaller)
    g.fillStyle(0xef4444, 0.7);
    g.fillRect(
      portalLeft + Math.floor(portalWidth * 0.25),
      portalTop + 4,
      Math.floor(portalWidth * 0.5),
      portalBottom - portalTop - 8,
    );

    // Dark center vortex
    g.fillStyle(0x220000, 0.8);
    const vortexR = archInnerR * 0.45;
    g.beginPath();
    g.arc(archCenterX, archCenterY + 16, vortexR, 0, Math.PI * 2, false);
    g.fillPath();

    // --- Glowing rune marks on pillars ---
    const runeColor = 0xef4444;
    const runePositions = [
      // Left pillar runes
      { x: pillarLeftX + 6, y: pillarTop + 18 },
      { x: pillarLeftX + 4, y: pillarTop + 34 },
      { x: pillarLeftX + 8, y: pillarTop + 50 },
      { x: pillarLeftX + 5, y: pillarTop + 66 },
      // Right pillar runes
      { x: pillarRightX + 6, y: pillarTop + 18 },
      { x: pillarRightX + 8, y: pillarTop + 34 },
      { x: pillarRightX + 4, y: pillarTop + 50 },
      { x: pillarRightX + 7, y: pillarTop + 66 },
    ];

    for (const rune of runePositions) {
      // Glow halo
      g.fillStyle(runeColor, 0.15);
      g.fillRect(rune.x - 3, rune.y - 3, 8, 8);
      g.fillStyle(runeColor, 0.3);
      g.fillRect(rune.x - 1, rune.y - 1, 4, 4);
      // Bright core
      g.fillStyle(runeColor, 0.9);
      g.fillRect(rune.x, rune.y, 2, 2);
    }

    // Base stones at bottom of pillars
    g.fillStyle(COLORS.stoneWallLight);
    g.fillRect(pillarLeftX - 2, H - 4, pillarW + 4, 4);
    g.fillRect(pillarRightX - 2, H - 4, pillarW + 4, 4);

    g.generateTexture('building-rift', W, H);
    g.destroy();
  }
}
