import { COLORS, darken, lighten } from './colorPalette';

export function generateTileset(scene: Phaser.Scene): void {
  const S = 32;

  // ── Helper: draw grass base with scattered dark detail pixels ──────────
  function drawGrassBase(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(COLORS.grass);
    g.fillRect(0, 0, S, S);

    // Scattered 1-2px darker shade patches for texture
    const darkSpots = [
      [3, 4], [7, 2], [11, 8], [5, 12], [13, 14], [2, 9], [9, 6],
      [14, 3], [20, 5], [25, 10], [18, 18], [28, 22], [6, 24],
      [22, 28], [16, 15], [30, 7], [1, 20], [27, 3], [10, 27],
      [23, 16], [15, 22], [4, 17], [19, 9], [29, 14],
    ];
    g.fillStyle(COLORS.grassDark);
    for (const [x, y] of darkSpots) {
      g.fillRect(x, y, 1, 1);
    }

    // A few 2px patches for slightly larger variation
    const patchSpots = [
      [8, 14], [21, 4], [26, 20], [12, 26],
    ];
    for (const [x, y] of patchSpots) {
      g.fillRect(x, y, 2, 1);
    }

    // Subtle light accent pixels
    g.fillStyle(COLORS.grassLight);
    const lightSpots = [
      [5, 7], [17, 11], [24, 25], [10, 20], [29, 2],
    ];
    for (const [x, y] of lightSpots) {
      g.fillRect(x, y, 1, 1);
    }
  }

  // ── Helper: draw cobblestone brick pattern ─────────────────────────────
  function drawCobblestone(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    oy: number,
    w: number,
    h: number,
  ): void {
    // Fill mortar background first
    g.fillStyle(COLORS.mortar);
    g.fillRect(ox, oy, w, h);

    const brickW = 8;
    const brickH = 6;
    const mortarGap = 1;
    const stepX = brickW + mortarGap;
    const stepY = brickH + mortarGap;

    // Deterministic "random" brick color variation
    const brickColors = [
      COLORS.cobble, COLORS.cobble, COLORS.cobble,
      COLORS.cobbleLight, COLORS.cobbleDark, COLORS.cobble,
      COLORS.cobbleDark, COLORS.cobble, COLORS.cobbleLight,
      COLORS.cobble, COLORS.cobble, COLORS.cobbleDark,
    ];
    let colorIdx = 0;

    for (let row = 0; row * stepY + oy < oy + h; row++) {
      const offsetX = row % 2 === 1 ? Math.floor(stepX / 2) : 0;
      for (let col = -1; col * stepX + offsetX + ox < ox + w + stepX; col++) {
        const bx = ox + col * stepX + offsetX;
        const by = oy + row * stepY;

        // Clip to the target area
        const clippedX = Math.max(bx, ox);
        const clippedY = Math.max(by, oy);
        const clippedR = Math.min(bx + brickW, ox + w);
        const clippedB = Math.min(by + brickH, oy + h);
        const cw = clippedR - clippedX;
        const ch = clippedB - clippedY;
        if (cw <= 0 || ch <= 0) continue;

        g.fillStyle(brickColors[colorIdx % brickColors.length]);
        g.fillRect(clippedX, clippedY, cw, ch);
        colorIdx++;
      }
    }
  }

  // ── Helper: draw a wavy line for shores ────────────────────────────────
  function drawWavyLine(
    g: Phaser.GameObjects.Graphics,
    baseY: number,
    color: number,
    amplitude: number,
    thickness: number,
  ): void {
    g.fillStyle(color);
    for (let x = 0; x < S; x++) {
      const waveOffset = Math.round(
        Math.sin((x / S) * Math.PI * 2 + 0.5) * amplitude,
      );
      g.fillRect(x, baseY + waveOffset, 1, thickness);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 1. GRASS VARIANTS (tile-grass-0 through tile-grass-4)
  // ═══════════════════════════════════════════════════════════════════════

  // Variant 0: Base grass with darker shade patches and blade strokes
  {
    const g = scene.add.graphics();
    drawGrassBase(g);

    // A few blade strokes (short vertical lines in grassDark)
    g.fillStyle(COLORS.grassDark);
    g.fillRect(6, 3, 1, 3);
    g.fillRect(18, 10, 1, 3);
    g.fillRect(25, 20, 1, 3);
    g.fillRect(12, 24, 1, 2);

    // Slightly larger dark patches
    g.fillStyle(darken(COLORS.grass, 0.15));
    g.fillRect(14, 6, 3, 2);
    g.fillRect(4, 18, 2, 3);
    g.fillRect(26, 12, 3, 2);

    g.generateTexture('tile-grass-0', S, S);
    g.destroy();
  }

  // Variant 1: Grass with small flowers (red/yellow/white dots)
  {
    const g = scene.add.graphics();
    drawGrassBase(g);

    // Flower 1 – red
    g.fillStyle(COLORS.flowerRed);
    g.fillRect(7, 8, 2, 2);
    g.fillStyle(darken(COLORS.flowerRed, 0.2));
    g.fillRect(7, 9, 1, 1);

    // Flower 2 – yellow
    g.fillStyle(COLORS.flowerYellow);
    g.fillRect(20, 5, 2, 2);
    g.fillStyle(darken(COLORS.flowerYellow, 0.15));
    g.fillRect(21, 6, 1, 1);

    // Flower 3 – white
    g.fillStyle(COLORS.flowerWhite);
    g.fillRect(14, 22, 2, 2);

    // Flower 4 – purple
    g.fillStyle(COLORS.flowerPurple);
    g.fillRect(26, 17, 2, 2);
    g.fillStyle(lighten(COLORS.flowerPurple, 0.3));
    g.fillRect(26, 17, 1, 1);

    // Small green stems under flowers
    g.fillStyle(COLORS.grassDark);
    g.fillRect(7, 10, 1, 2);
    g.fillRect(20, 7, 1, 2);
    g.fillRect(14, 24, 1, 1);
    g.fillRect(26, 19, 1, 1);

    g.generateTexture('tile-grass-1', S, S);
    g.destroy();
  }

  // Variant 2: Grass with clover patches
  {
    const g = scene.add.graphics();
    drawGrassBase(g);

    // Draw clover clusters – each clover is 3 dots in a triangle shape
    const clovers = [
      [6, 10], [18, 6], [25, 22], [10, 26], [22, 14],
    ];
    g.fillStyle(COLORS.cloverGreen);
    for (const [cx, cy] of clovers) {
      // Three-leaf pattern
      g.fillRect(cx, cy - 1, 2, 1);  // top leaf
      g.fillRect(cx - 1, cy + 1, 2, 1);  // bottom-left leaf
      g.fillRect(cx + 1, cy + 1, 2, 1);  // bottom-right leaf
    }
    // Darker center for depth
    g.fillStyle(darken(COLORS.cloverGreen, 0.25));
    for (const [cx, cy] of clovers) {
      g.fillRect(cx, cy, 1, 1);
    }

    g.generateTexture('tile-grass-2', S, S);
    g.destroy();
  }

  // Variant 3: Grass with tall grass tufts
  {
    const g = scene.add.graphics();
    drawGrassBase(g);

    // Tall grass tufts – vertical lines 3-4px tall
    const tufts = [
      [5, 8, 4], [8, 7, 3], [6, 9, 3],    // cluster 1
      [19, 14, 4], [21, 15, 3], [20, 13, 4], // cluster 2
      [27, 6, 3], [29, 5, 4], [28, 7, 3],   // cluster 3
      [12, 24, 4], [14, 23, 3], [13, 25, 3], // cluster 4
    ];
    g.fillStyle(COLORS.tallGrass);
    for (const [x, y, h] of tufts) {
      g.fillRect(x, y - h, 1, h);
    }

    // Slightly lighter tips
    g.fillStyle(lighten(COLORS.tallGrass, 0.2));
    for (const [x, y, h] of tufts) {
      g.fillRect(x, y - h, 1, 1);
    }

    g.generateTexture('tile-grass-3', S, S);
    g.destroy();
  }

  // Variant 4: Lighter grass with grassYellow patches
  {
    const g = scene.add.graphics();
    // Start with lighter base
    g.fillStyle(COLORS.grassLight);
    g.fillRect(0, 0, S, S);

    // Scatter some normal grass pixels for variety
    g.fillStyle(COLORS.grass);
    const normalSpots = [
      [2, 5], [8, 3], [14, 9], [20, 1], [26, 7],
      [4, 15], [10, 19], [16, 25], [22, 21], [28, 27],
      [6, 29], [12, 11], [18, 17], [24, 13], [30, 23],
    ];
    for (const [x, y] of normalSpots) {
      g.fillRect(x, y, 1, 1);
    }

    // Yellow patches
    g.fillStyle(COLORS.grassYellow);
    g.fillRect(3, 6, 4, 3);
    g.fillRect(18, 2, 5, 3);
    g.fillRect(10, 20, 4, 4);
    g.fillRect(24, 24, 5, 3);
    g.fillRect(26, 10, 3, 3);

    // Dark detail for contrast
    g.fillStyle(COLORS.grassDark);
    const darkDetails = [
      [7, 10], [15, 5], [23, 18], [29, 4], [1, 22],
      [11, 28], [19, 14], [27, 30],
    ];
    for (const [x, y] of darkDetails) {
      g.fillRect(x, y, 1, 1);
    }

    g.generateTexture('tile-grass-4', S, S);
    g.destroy();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 2. PATH AUTO-TILES (9 tiles for cobblestone paths)
  // ═══════════════════════════════════════════════════════════════════════

  // Helper: blend grass edge onto one side of a cobblestone tile
  function drawGrassEdge(
    g: Phaser.GameObjects.Graphics,
    side: 'n' | 's' | 'e' | 'w',
    edgeDepth: number,
  ): void {
    // Grass fill on the edge
    g.fillStyle(COLORS.grass);
    switch (side) {
      case 'n':
        g.fillRect(0, 0, S, edgeDepth);
        break;
      case 's':
        g.fillRect(0, S - edgeDepth, S, edgeDepth);
        break;
      case 'e':
        g.fillRect(S - edgeDepth, 0, edgeDepth, S);
        break;
      case 'w':
        g.fillRect(0, 0, edgeDepth, S);
        break;
    }

    // Add a few dark grass pixels on the edge for texture
    g.fillStyle(COLORS.grassDark);
    switch (side) {
      case 'n':
        g.fillRect(4, 1, 1, 1); g.fillRect(12, 2, 1, 1);
        g.fillRect(20, 0, 1, 1); g.fillRect(27, 1, 1, 1);
        break;
      case 's':
        g.fillRect(3, S - 2, 1, 1); g.fillRect(11, S - 1, 1, 1);
        g.fillRect(22, S - 2, 1, 1); g.fillRect(28, S - 1, 1, 1);
        break;
      case 'e':
        g.fillRect(S - 2, 3, 1, 1); g.fillRect(S - 1, 10, 1, 1);
        g.fillRect(S - 2, 19, 1, 1); g.fillRect(S - 1, 27, 1, 1);
        break;
      case 'w':
        g.fillRect(1, 5, 1, 1); g.fillRect(0, 14, 1, 1);
        g.fillRect(1, 22, 1, 1); g.fillRect(0, 29, 1, 1);
        break;
    }

    // Transition pixels along the border (mortar-toned for a rough edge)
    g.fillStyle(darken(COLORS.grass, 0.1));
    switch (side) {
      case 'n':
        for (let x = 0; x < S; x += 3) g.fillRect(x, edgeDepth, 2, 1);
        break;
      case 's':
        for (let x = 1; x < S; x += 3) g.fillRect(x, S - edgeDepth - 1, 2, 1);
        break;
      case 'e':
        for (let y = 0; y < S; y += 3) g.fillRect(S - edgeDepth - 1, y, 1, 2);
        break;
      case 'w':
        for (let y = 1; y < S; y += 3) g.fillRect(edgeDepth, y, 1, 2);
        break;
    }
  }

  const edgeDepth = 6;

  // Center: full cobblestone
  {
    const g = scene.add.graphics();
    drawCobblestone(g, 0, 0, S, S);
    g.generateTexture('tile-path-center', S, S);
    g.destroy();
  }

  // Edge tiles: cobblestone with grass blending on one side
  const edgeSides: Array<{ key: string; side: 'n' | 's' | 'e' | 'w' }> = [
    { key: 'tile-path-n', side: 'n' },
    { key: 'tile-path-s', side: 's' },
    { key: 'tile-path-e', side: 'e' },
    { key: 'tile-path-w', side: 'w' },
  ];
  for (const { key, side } of edgeSides) {
    const g = scene.add.graphics();
    drawCobblestone(g, 0, 0, S, S);
    drawGrassEdge(g, side, edgeDepth);
    g.generateTexture(key, S, S);
    g.destroy();
  }

  // Corner tiles: cobblestone with grass blending on two adjacent sides
  const corners: Array<{
    key: string;
    sides: ['n' | 's' | 'e' | 'w', 'n' | 's' | 'e' | 'w'];
  }> = [
    { key: 'tile-path-ne', sides: ['n', 'e'] },
    { key: 'tile-path-nw', sides: ['n', 'w'] },
    { key: 'tile-path-se', sides: ['s', 'e'] },
    { key: 'tile-path-sw', sides: ['s', 'w'] },
  ];
  for (const { key, sides } of corners) {
    const g = scene.add.graphics();
    drawCobblestone(g, 0, 0, S, S);
    drawGrassEdge(g, sides[0], edgeDepth);
    drawGrassEdge(g, sides[1], edgeDepth);

    // Fill the corner intersection with grass as well
    g.fillStyle(COLORS.grass);
    const cornerX =
      sides.includes('w') ? 0 : sides.includes('e') ? S - edgeDepth : 0;
    const cornerY =
      sides.includes('n') ? 0 : sides.includes('s') ? S - edgeDepth : 0;
    g.fillRect(cornerX, cornerY, edgeDepth, edgeDepth);

    g.generateTexture(key, S, S);
    g.destroy();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 3. WATER ANIMATION FRAMES (tile-water-0 through tile-water-2)
  // ═══════════════════════════════════════════════════════════════════════

  for (let frame = 0; frame < 3; frame++) {
    const g = scene.add.graphics();

    // Base water fill
    g.fillStyle(COLORS.water);
    g.fillRect(0, 0, S, S);

    // Shifting highlight streaks (2-3px wide, positions shift per frame)
    const streakOffset = frame * 4;
    g.fillStyle(COLORS.waterLight);

    // Streak 1
    const s1y = (6 + streakOffset) % S;
    g.fillRect(2, s1y, 8, 2);
    g.fillRect(3, s1y + 1, 6, 1);

    // Streak 2
    const s2y = (16 + streakOffset) % S;
    g.fillRect(14, s2y, 10, 2);
    g.fillRect(15, s2y + 1, 8, 1);

    // Streak 3
    const s3y = (26 + streakOffset) % S;
    g.fillRect(6, s3y, 7, 2);
    g.fillRect(22, (s3y + 3) % S, 6, 1);

    // Additional subtle highlights that shift
    g.fillStyle(lighten(COLORS.water, 0.15));
    const h1x = (5 + frame * 6) % S;
    const h2x = (20 + frame * 5) % S;
    g.fillRect(h1x, (12 + streakOffset) % S, 3, 1);
    g.fillRect(h2x, (22 + streakOffset) % S, 4, 1);

    // Dark depth spots
    g.fillStyle(COLORS.waterDark);
    g.fillRect((4 + frame * 3) % S, (10 + frame * 2) % S, 2, 2);
    g.fillRect((18 + frame * 4) % S, (24 + frame * 3) % S, 2, 2);
    g.fillRect((28 + frame * 2) % S, (4 + frame * 5) % S, 1, 1);

    // Deep water accents
    g.fillStyle(COLORS.waterDeep);
    g.fillRect((8 + frame * 7) % S, (20 + frame * 4) % S, 2, 1);
    g.fillRect((24 + frame * 3) % S, (14 + frame * 6) % S, 1, 2);

    g.generateTexture(`tile-water-${frame}`, S, S);
    g.destroy();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. SHORE TILES (tile-shore-n, -s, -e, -w)
  // ═══════════════════════════════════════════════════════════════════════

  // Shore North: water at bottom, grass at top, wavy sand line between
  {
    const g = scene.add.graphics();
    // Bottom half: water
    g.fillStyle(COLORS.water);
    g.fillRect(0, 0, S, S);
    // Top half: grass
    g.fillStyle(COLORS.grass);
    g.fillRect(0, 0, S, 14);

    // Wavy shoreline band
    drawWavyLine(g, 13, COLORS.shoreSand, 2, 3);
    drawWavyLine(g, 14, COLORS.shoreSand, 2, 2);

    // Wet sand transition
    drawWavyLine(g, 16, COLORS.shoreWet, 1, 1);

    // Grass detail pixels
    g.fillStyle(COLORS.grassDark);
    g.fillRect(4, 3, 1, 1); g.fillRect(12, 6, 1, 1);
    g.fillRect(22, 2, 1, 1); g.fillRect(28, 8, 1, 1);

    // Water detail pixels
    g.fillStyle(COLORS.waterLight);
    g.fillRect(6, 22, 3, 1); g.fillRect(18, 26, 4, 1);

    g.generateTexture('tile-shore-n', S, S);
    g.destroy();
  }

  // Shore South: water at top, grass at bottom
  {
    const g = scene.add.graphics();
    g.fillStyle(COLORS.water);
    g.fillRect(0, 0, S, S);
    g.fillStyle(COLORS.grass);
    g.fillRect(0, 18, S, 14);

    drawWavyLine(g, 16, COLORS.shoreSand, 2, 3);
    drawWavyLine(g, 15, COLORS.shoreSand, 2, 2);
    drawWavyLine(g, 14, COLORS.shoreWet, 1, 1);

    g.fillStyle(COLORS.grassDark);
    g.fillRect(5, 24, 1, 1); g.fillRect(15, 22, 1, 1);
    g.fillRect(25, 26, 1, 1);

    g.fillStyle(COLORS.waterLight);
    g.fillRect(8, 4, 3, 1); g.fillRect(20, 8, 4, 1);

    g.generateTexture('tile-shore-s', S, S);
    g.destroy();
  }

  // Shore East: water at left, grass at right
  {
    const g = scene.add.graphics();
    g.fillStyle(COLORS.water);
    g.fillRect(0, 0, S, S);
    g.fillStyle(COLORS.grass);
    g.fillRect(18, 0, 14, S);

    // Vertical wavy shoreline
    g.fillStyle(COLORS.shoreSand);
    for (let y = 0; y < S; y++) {
      const waveOffset = Math.round(Math.sin((y / S) * Math.PI * 2 + 0.5) * 2);
      g.fillRect(16 + waveOffset, y, 3, 1);
    }
    g.fillStyle(COLORS.shoreWet);
    for (let y = 0; y < S; y++) {
      const waveOffset = Math.round(Math.sin((y / S) * Math.PI * 2 + 0.5) * 2);
      g.fillRect(14 + waveOffset, y, 1, 1);
    }

    g.fillStyle(COLORS.grassDark);
    g.fillRect(24, 5, 1, 1); g.fillRect(22, 15, 1, 1);
    g.fillRect(28, 25, 1, 1);

    g.fillStyle(COLORS.waterLight);
    g.fillRect(4, 8, 1, 3); g.fillRect(8, 20, 1, 4);

    g.generateTexture('tile-shore-e', S, S);
    g.destroy();
  }

  // Shore West: water at right, grass at left
  {
    const g = scene.add.graphics();
    g.fillStyle(COLORS.water);
    g.fillRect(0, 0, S, S);
    g.fillStyle(COLORS.grass);
    g.fillRect(0, 0, 14, S);

    // Vertical wavy shoreline
    g.fillStyle(COLORS.shoreSand);
    for (let y = 0; y < S; y++) {
      const waveOffset = Math.round(Math.sin((y / S) * Math.PI * 2 + 0.3) * 2);
      g.fillRect(13 + waveOffset, y, 3, 1);
    }
    g.fillStyle(COLORS.shoreWet);
    for (let y = 0; y < S; y++) {
      const waveOffset = Math.round(Math.sin((y / S) * Math.PI * 2 + 0.3) * 2);
      g.fillRect(16 + waveOffset, y, 1, 1);
    }

    g.fillStyle(COLORS.grassDark);
    g.fillRect(3, 4, 1, 1); g.fillRect(8, 18, 1, 1);
    g.fillRect(5, 28, 1, 1);

    g.fillStyle(COLORS.waterLight);
    g.fillRect(22, 6, 1, 3); g.fillRect(26, 22, 1, 4);

    g.generateTexture('tile-shore-w', S, S);
    g.destroy();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. DECORATIVE GROUND SPRITES
  // ═══════════════════════════════════════════════════════════════════════

  // deco-rock-small (8x8): small grey rock
  {
    const g = scene.add.graphics();

    // Rock body
    g.fillStyle(COLORS.stone);
    g.fillRect(2, 3, 4, 4);
    g.fillRect(1, 4, 6, 2);
    g.fillRect(3, 2, 2, 1);

    // Dark edge / shadow
    g.fillStyle(COLORS.stoneDark);
    g.fillRect(1, 6, 6, 1);
    g.fillRect(6, 4, 1, 2);
    g.fillRect(2, 7, 3, 1);

    // Light highlight
    g.fillStyle(lighten(COLORS.stone, 0.2));
    g.fillRect(3, 2, 1, 1);
    g.fillRect(2, 3, 2, 1);

    g.generateTexture('deco-rock-small', 8, 8);
    g.destroy();
  }

  // deco-mushroom (8x10): tiny mushroom with red cap, white dots, brown stem
  {
    const g = scene.add.graphics();

    // Stem (brown)
    g.fillStyle(COLORS.dirt);
    g.fillRect(3, 6, 2, 3);
    g.fillStyle(COLORS.dirtDark);
    g.fillRect(4, 7, 1, 2);

    // Stem base
    g.fillStyle(darken(COLORS.dirt, 0.15));
    g.fillRect(2, 9, 4, 1);

    // Cap (red dome)
    g.fillStyle(COLORS.flowerRed);
    g.fillRect(1, 3, 6, 3);
    g.fillRect(2, 2, 4, 1);
    g.fillRect(3, 1, 2, 1);

    // Cap shadow
    g.fillStyle(darken(COLORS.flowerRed, 0.2));
    g.fillRect(1, 5, 6, 1);
    g.fillRect(5, 3, 2, 2);

    // White dots on cap
    g.fillStyle(COLORS.flowerWhite);
    g.fillRect(2, 2, 1, 1);
    g.fillRect(5, 3, 1, 1);
    g.fillRect(3, 4, 1, 1);

    g.generateTexture('deco-mushroom', 8, 10);
    g.destroy();
  }

  // deco-fallen-leaf (6x6): small brown/orange leaf shape
  {
    const g = scene.add.graphics();

    // Leaf body (brownish orange)
    const leafColor = 0xbb8833;
    const leafDark = darken(leafColor, 0.25);
    const leafLight = lighten(leafColor, 0.15);

    g.fillStyle(leafColor);
    g.fillRect(1, 2, 4, 2);
    g.fillRect(2, 1, 3, 1);
    g.fillRect(2, 4, 2, 1);

    // Darker edge
    g.fillStyle(leafDark);
    g.fillRect(0, 3, 1, 1);
    g.fillRect(5, 1, 1, 1);
    g.fillRect(4, 4, 1, 1);

    // Vein / lighter center
    g.fillStyle(leafLight);
    g.fillRect(2, 2, 2, 1);

    // Stem tip
    g.fillStyle(darken(leafColor, 0.3));
    g.fillRect(1, 5, 1, 1);

    g.generateTexture('deco-fallen-leaf', 6, 6);
    g.destroy();
  }
}
