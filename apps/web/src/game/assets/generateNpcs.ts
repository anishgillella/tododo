import { COLORS, darken, lighten } from './colorPalette';
import { NPC_W, NPC_H } from '../constants';

export function generateNpcs(scene: Phaser.Scene): void {
  const W = NPC_W;
  const H = NPC_H;

  // ─────────────────────────────────────────────
  // 1. AXIOM — Floating crystal entity
  // ─────────────────────────────────────────────
  const gA = scene.add.graphics();

  const axCx = W / 2; // 24
  const axCy = H / 2; // 32

  // Faint glow halo around crystal (low-alpha aura)
  gA.fillStyle(0x88aaff, 0.12);
  gA.beginPath();
  gA.moveTo(axCx, axCy - 26);
  gA.lineTo(axCx + 18, axCy);
  gA.lineTo(axCx, axCy + 26);
  gA.lineTo(axCx - 18, axCy);
  gA.closePath();
  gA.fillPath();

  gA.fillStyle(0x88aaff, 0.08);
  gA.beginPath();
  gA.moveTo(axCx, axCy - 30);
  gA.lineTo(axCx + 22, axCy);
  gA.lineTo(axCx, axCy + 30);
  gA.lineTo(axCx - 22, axCy);
  gA.closePath();
  gA.fillPath();

  // Outer diamond / crystal facets
  gA.fillStyle(0x88aaff);
  gA.beginPath();
  gA.moveTo(axCx, axCy - 20); // top
  gA.lineTo(axCx + 12, axCy); // right
  gA.lineTo(axCx, axCy + 20); // bottom
  gA.lineTo(axCx - 12, axCy); // left
  gA.closePath();
  gA.fillPath();

  // Darker edge lines on facets (left facet shadow)
  gA.fillStyle(darken(0x88aaff, 0.3));
  gA.beginPath();
  gA.moveTo(axCx, axCy - 20);
  gA.lineTo(axCx - 12, axCy);
  gA.lineTo(axCx - 10, axCy);
  gA.lineTo(axCx, axCy - 17);
  gA.closePath();
  gA.fillPath();

  // Right facet darker edge
  gA.fillStyle(darken(0x88aaff, 0.2));
  gA.beginPath();
  gA.moveTo(axCx, axCy + 20);
  gA.lineTo(axCx + 12, axCy);
  gA.lineTo(axCx + 10, axCy);
  gA.lineTo(axCx, axCy + 17);
  gA.closePath();
  gA.fillPath();

  // Bottom facet edge
  gA.fillStyle(darken(0x88aaff, 0.25));
  gA.beginPath();
  gA.moveTo(axCx, axCy + 20);
  gA.lineTo(axCx - 12, axCy);
  gA.lineTo(axCx - 10, axCy);
  gA.lineTo(axCx, axCy + 17);
  gA.closePath();
  gA.fillPath();

  // Inner facet glow
  gA.fillStyle(0xccddff);
  gA.beginPath();
  gA.moveTo(axCx, axCy - 12);
  gA.lineTo(axCx + 7, axCy);
  gA.lineTo(axCx, axCy + 12);
  gA.lineTo(axCx - 7, axCy);
  gA.closePath();
  gA.fillPath();

  // Bright inner core highlight
  gA.fillStyle(0xeef4ff, 0.6);
  gA.beginPath();
  gA.moveTo(axCx, axCy - 6);
  gA.lineTo(axCx + 3, axCy);
  gA.lineTo(axCx, axCy + 6);
  gA.lineTo(axCx - 3, axCy);
  gA.closePath();
  gA.fillPath();

  // Central "eye" — dark blue rectangle with lighter pupil
  gA.fillStyle(0x222266);
  gA.fillRect(axCx - 3, axCy - 2, 6, 4);
  // Pupil highlight
  gA.fillStyle(0x6688cc);
  gA.fillRect(axCx - 1, axCy - 1, 2, 2);
  gA.fillStyle(0xaaccff);
  gA.fillRect(axCx, axCy - 1, 1, 1);

  // Sparkle dots scattered around the crystal edges
  gA.fillStyle(0xffffff);
  gA.fillRect(axCx + 10, axCy - 8, 1, 1);
  gA.fillRect(axCx - 9, axCy + 5, 1, 1);
  gA.fillRect(axCx + 6, axCy + 14, 1, 1);
  gA.fillRect(axCx - 5, axCy - 14, 1, 1);
  gA.fillRect(axCx + 2, axCy - 18, 1, 1);

  gA.generateTexture('npc-axiom', W, H);
  gA.destroy();

  // ─────────────────────────────────────────────
  // 2. KAEL — Cocky red-clad rival
  // ─────────────────────────────────────────────
  const gK = scene.add.graphics();

  const kCx = W / 2; // 24

  // --- Sword on back (drawn first so body overlaps it) ---
  // Blade
  gK.fillStyle(COLORS.metal);
  gK.fillRect(kCx + 8, 6, 2, 20);
  // Blade shine edge
  gK.fillStyle(COLORS.metalShine);
  gK.fillRect(kCx + 8, 6, 1, 18);
  // Blade dark edge
  gK.fillStyle(COLORS.metalDark);
  gK.fillRect(kCx + 10, 6, 1, 20);
  // Crossguard
  gK.fillStyle(COLORS.metalDark);
  gK.fillRect(kCx + 5, 24, 8, 2);
  // Hilt / grip
  gK.fillStyle(COLORS.wood);
  gK.fillRect(kCx + 8, 26, 2, 5);
  // Pommel
  gK.fillStyle(COLORS.metalDark);
  gK.fillRect(kCx + 7, 31, 4, 2);

  // --- Boots ---
  // Left boot
  gK.fillStyle(COLORS.boots);
  gK.fillRect(kCx - 8, 54, 6, 8);
  gK.fillStyle(COLORS.bootsDark);
  gK.fillRect(kCx - 8, 60, 6, 2); // sole
  gK.fillRect(kCx - 8, 54, 1, 8); // outer edge
  // Right boot (slightly wider stance)
  gK.fillStyle(COLORS.boots);
  gK.fillRect(kCx + 3, 54, 6, 8);
  gK.fillStyle(COLORS.bootsDark);
  gK.fillRect(kCx + 3, 60, 6, 2); // sole
  gK.fillRect(kCx + 8, 54, 1, 8); // outer edge

  // --- Legs / trousers (visible between tunic and boots) ---
  gK.fillStyle(darken(COLORS.clothRed, 0.3));
  gK.fillRect(kCx - 7, 48, 5, 6);
  gK.fillRect(kCx + 3, 48, 5, 6);

  // --- Red coat / tunic body ---
  gK.fillStyle(COLORS.clothRed);
  gK.fillRect(kCx - 9, 24, 18, 24);
  // Tunic shadow edges
  gK.fillStyle(COLORS.clothRedDark);
  gK.fillRect(kCx - 9, 24, 2, 24); // left edge
  gK.fillRect(kCx + 7, 24, 2, 24); // right edge
  gK.fillRect(kCx - 9, 44, 18, 4); // bottom hem shadow

  // Tunic center line detail
  gK.fillStyle(COLORS.clothRedDark);
  gK.fillRect(kCx - 1, 26, 2, 20);

  // --- Belt ---
  gK.fillStyle(COLORS.belt);
  gK.fillRect(kCx - 9, 38, 18, 3);
  // Belt buckle (metal)
  gK.fillStyle(COLORS.metal);
  gK.fillRect(kCx - 2, 38, 4, 3);
  gK.fillStyle(COLORS.metalShine);
  gK.fillRect(kCx - 1, 39, 2, 1);

  // --- Arms (skin + red sleeves) ---
  // Left arm — sleeve
  gK.fillStyle(COLORS.clothRed);
  gK.fillRect(kCx - 14, 24, 5, 10);
  gK.fillStyle(COLORS.clothRedDark);
  gK.fillRect(kCx - 14, 24, 1, 10); // outer shadow
  // Left arm — skin (forearm)
  gK.fillStyle(COLORS.skin);
  gK.fillRect(kCx - 14, 34, 5, 6);
  gK.fillStyle(COLORS.skinDark);
  gK.fillRect(kCx - 14, 34, 1, 6);
  // Left hand
  gK.fillStyle(COLORS.skin);
  gK.fillRect(kCx - 13, 40, 4, 3);

  // Right arm — sleeve
  gK.fillStyle(COLORS.clothRed);
  gK.fillRect(kCx + 9, 24, 5, 10);
  gK.fillStyle(COLORS.clothRedDark);
  gK.fillRect(kCx + 13, 24, 1, 10); // outer shadow
  // Right arm — skin (forearm)
  gK.fillStyle(COLORS.skin);
  gK.fillRect(kCx + 9, 34, 5, 6);
  gK.fillStyle(COLORS.skinDark);
  gK.fillRect(kCx + 13, 34, 1, 6);
  // Right hand
  gK.fillStyle(COLORS.skin);
  gK.fillRect(kCx + 9, 40, 4, 3);

  // --- Collar ---
  gK.fillStyle(COLORS.collar);
  gK.fillRect(kCx - 5, 22, 10, 3);
  gK.fillStyle(darken(COLORS.collar, 0.15));
  gK.fillRect(kCx - 1, 22, 2, 3);

  // --- Neck ---
  gK.fillStyle(COLORS.skin);
  gK.fillRect(kCx - 3, 20, 6, 4);

  // --- Head (skin) ---
  gK.fillStyle(COLORS.skin);
  gK.fillRect(kCx - 6, 10, 12, 12);
  // Jawline shadow
  gK.fillStyle(COLORS.skinDark);
  gK.fillRect(kCx - 6, 20, 12, 1);
  gK.fillRect(kCx - 6, 10, 1, 12);
  gK.fillRect(kCx + 5, 10, 1, 12);

  // --- Spiky red hair ---
  gK.fillStyle(COLORS.hairRed);
  // Base hair
  gK.fillRect(kCx - 7, 8, 14, 5);
  // Spike 1 (center)
  gK.beginPath();
  gK.moveTo(kCx - 1, 8);
  gK.lineTo(kCx + 1, 1);
  gK.lineTo(kCx + 3, 8);
  gK.closePath();
  gK.fillPath();
  // Spike 2 (left)
  gK.beginPath();
  gK.moveTo(kCx - 5, 8);
  gK.lineTo(kCx - 6, 2);
  gK.lineTo(kCx - 2, 8);
  gK.closePath();
  gK.fillPath();
  // Spike 3 (right)
  gK.beginPath();
  gK.moveTo(kCx + 3, 8);
  gK.lineTo(kCx + 7, 3);
  gK.lineTo(kCx + 7, 8);
  gK.closePath();
  gK.fillPath();
  // Spike 4 (far left)
  gK.beginPath();
  gK.moveTo(kCx - 7, 9);
  gK.lineTo(kCx - 9, 4);
  gK.lineTo(kCx - 5, 9);
  gK.closePath();
  gK.fillPath();
  // Spike 5 (far right)
  gK.beginPath();
  gK.moveTo(kCx + 5, 9);
  gK.lineTo(kCx + 10, 5);
  gK.lineTo(kCx + 7, 9);
  gK.closePath();
  gK.fillPath();
  // Hair highlight streaks
  gK.fillStyle(lighten(COLORS.hairRed, 0.3));
  gK.fillRect(kCx - 3, 8, 1, 3);
  gK.fillRect(kCx + 4, 8, 1, 3);

  // --- Eyes (expressive, 2x2 dark with white highlight) ---
  // Left eye
  gK.fillStyle(0x222222);
  gK.fillRect(kCx - 4, 14, 2, 2);
  gK.fillStyle(0xffffff);
  gK.fillRect(kCx - 4, 14, 1, 1);
  // Right eye
  gK.fillStyle(0x222222);
  gK.fillRect(kCx + 2, 14, 2, 2);
  gK.fillStyle(0xffffff);
  gK.fillRect(kCx + 2, 14, 1, 1);

  // Eyebrows (determined look)
  gK.fillStyle(darken(COLORS.hairRed, 0.3));
  gK.fillRect(kCx - 5, 13, 3, 1);
  gK.fillRect(kCx + 2, 13, 3, 1);

  // --- Smirk (offset to one side) ---
  gK.fillStyle(0x884444);
  gK.fillRect(kCx, 18, 3, 1);
  gK.fillStyle(darken(0x884444, 0.2));
  gK.fillRect(kCx + 3, 17, 1, 1); // raised corner

  // Nose hint
  gK.fillStyle(COLORS.skinDark);
  gK.fillRect(kCx - 1, 16, 2, 1);

  gK.generateTexture('npc-kael', W, H);
  gK.destroy();

  // ─────────────────────────────────────────────
  // 3. MIRA — Green-robed keeper
  // ─────────────────────────────────────────────
  const gM = scene.add.graphics();

  const mCx = W / 2; // 24

  // --- Staff (drawn first, behind body) ---
  // Wooden shaft
  gM.fillStyle(COLORS.wood);
  gM.fillRect(mCx - 14, 4, 2, 58);
  // Wood grain detail
  gM.fillStyle(darken(COLORS.wood, 0.2));
  gM.fillRect(mCx - 14, 4, 1, 58);
  gM.fillStyle(lighten(COLORS.wood, 0.15));
  gM.fillRect(mCx - 13, 10, 1, 8);
  gM.fillRect(mCx - 13, 26, 1, 10);
  gM.fillRect(mCx - 13, 44, 1, 6);

  // Staff orb at top (glowing green circle)
  gM.fillStyle(0x44aa66);
  gM.fillRect(mCx - 17, 0, 8, 8);
  // Rounded corners (cut outer pixels)
  gM.fillStyle(0x000000, 0);
  // Approximate circle by layering
  gM.fillStyle(0x44aa66);
  gM.fillRect(mCx - 16, 1, 6, 6);
  gM.fillRect(mCx - 17, 2, 8, 4);
  gM.fillRect(mCx - 15, 0, 4, 8);
  // Orb center highlight
  gM.fillStyle(0x88ff88);
  gM.fillRect(mCx - 15, 2, 3, 3);
  // Orb shine
  gM.fillStyle(0xccffcc);
  gM.fillRect(mCx - 15, 2, 1, 1);
  // Orb glow aura
  gM.fillStyle(0x88ff88, 0.15);
  gM.fillRect(mCx - 19, 0, 12, 10);

  // --- Flowing green robes (full length) ---
  gM.fillStyle(COLORS.clothGreen);
  // Robe body — slightly flared at bottom
  gM.fillRect(mCx - 8, 26, 16, 32);
  // Flared bottom edges
  gM.fillRect(mCx - 10, 50, 20, 8);
  // Upper robe
  gM.fillRect(mCx - 7, 22, 14, 6);

  // Robe dark edges / shadow
  gM.fillStyle(COLORS.clothGreenDark);
  gM.fillRect(mCx - 8, 26, 2, 30); // left edge
  gM.fillRect(mCx + 6, 26, 2, 30); // right edge
  gM.fillRect(mCx - 10, 50, 2, 8); // left flare edge
  gM.fillRect(mCx + 8, 50, 2, 8); // right flare edge
  // Bottom hem line
  gM.fillRect(mCx - 10, 56, 20, 2);

  // Center highlight stripe
  gM.fillStyle(COLORS.clothGreenLight);
  gM.fillRect(mCx - 1, 24, 2, 32);

  // Robe fold lines
  gM.fillStyle(darken(COLORS.clothGreen, 0.15));
  gM.fillRect(mCx - 5, 30, 1, 24);
  gM.fillRect(mCx + 4, 30, 1, 24);

  // --- Feet/boots peeking from under robe ---
  gM.fillStyle(COLORS.boots);
  gM.fillRect(mCx - 6, 58, 5, 4);
  gM.fillRect(mCx + 1, 58, 5, 4);
  gM.fillStyle(COLORS.bootsDark);
  gM.fillRect(mCx - 6, 61, 5, 1);
  gM.fillRect(mCx + 1, 61, 5, 1);

  // --- Neck ---
  gM.fillStyle(COLORS.skin);
  gM.fillRect(mCx - 2, 20, 5, 4);

  // --- Collar detail ---
  gM.fillStyle(COLORS.clothGreenDark);
  gM.fillRect(mCx - 5, 22, 10, 2);

  // --- Head (skin) ---
  gM.fillStyle(COLORS.skin);
  gM.fillRect(mCx - 5, 10, 10, 11);
  // Soft jawline
  gM.fillStyle(COLORS.skinDark);
  gM.fillRect(mCx - 5, 10, 1, 11);
  gM.fillRect(mCx + 4, 10, 1, 11);

  // --- Long blonde hair flowing past shoulders ---
  gM.fillStyle(COLORS.hairBlonde);
  // Top of hair
  gM.fillRect(mCx - 6, 7, 12, 5);
  // Hair sides flowing down past shoulders
  gM.fillRect(mCx - 7, 10, 3, 18); // left side hair
  gM.fillRect(mCx + 5, 10, 3, 18); // right side hair
  // Hair framing face
  gM.fillRect(mCx - 6, 10, 2, 8);
  gM.fillRect(mCx + 4, 10, 2, 8);
  // Hair highlight
  gM.fillStyle(lighten(COLORS.hairBlonde, 0.3));
  gM.fillRect(mCx - 3, 7, 3, 3);
  gM.fillRect(mCx - 7, 12, 1, 6);
  gM.fillRect(mCx + 7, 12, 1, 6);

  // --- Green eyes ---
  gM.fillStyle(0x226622);
  gM.fillRect(mCx - 3, 14, 2, 2);
  gM.fillRect(mCx + 2, 14, 2, 2);
  // Eye highlights
  gM.fillStyle(0x44cc44);
  gM.fillRect(mCx - 3, 14, 1, 1);
  gM.fillRect(mCx + 2, 14, 1, 1);

  // --- Warm smile ---
  gM.fillStyle(0x884444);
  gM.fillRect(mCx - 2, 18, 4, 1);
  // Smile ends slightly upturned
  gM.fillStyle(0x884444);
  gM.fillRect(mCx - 3, 17, 1, 1);
  gM.fillRect(mCx + 2, 17, 1, 1);

  // Nose hint
  gM.fillStyle(COLORS.skinDark);
  gM.fillRect(mCx - 1, 16, 2, 1);

  // --- Hands gripping staff (skin color) ---
  gM.fillStyle(COLORS.skin);
  gM.fillRect(mCx - 15, 26, 3, 4); // upper hand
  gM.fillRect(mCx - 15, 34, 3, 4); // lower hand
  // Arm/sleeve reaching to staff
  gM.fillStyle(COLORS.clothGreen);
  gM.fillRect(mCx - 12, 27, 4, 3);
  gM.fillRect(mCx - 12, 35, 4, 3);

  // Right arm (resting at side)
  gM.fillStyle(COLORS.clothGreen);
  gM.fillRect(mCx + 8, 24, 4, 10);
  gM.fillStyle(COLORS.skin);
  gM.fillRect(mCx + 8, 34, 4, 4);
  gM.fillStyle(COLORS.skin);
  gM.fillRect(mCx + 9, 38, 3, 3);

  gM.generateTexture('npc-mira', W, H);
  gM.destroy();

  // ─────────────────────────────────────────────
  // 4. THE HOLLOW — Dark shadowy mass
  // ─────────────────────────────────────────────
  const gH = scene.add.graphics();

  const hCx = W / 2; // 24

  // --- Amorphous shadow body (wider at top, tapering) ---
  gH.fillStyle(COLORS.shadowDark);
  // Upper mass (widest)
  gH.fillRect(hCx - 14, 6, 28, 8);
  gH.fillRect(hCx - 16, 10, 32, 6);
  gH.fillRect(hCx - 18, 14, 36, 10);
  // Mid body (narrowing)
  gH.fillRect(hCx - 16, 24, 32, 8);
  gH.fillRect(hCx - 14, 30, 28, 6);
  gH.fillRect(hCx - 12, 34, 24, 4);
  // Upper shoulders/head mass
  gH.fillRect(hCx - 10, 4, 20, 4);
  gH.fillRect(hCx - 6, 2, 12, 4);

  // --- Tendrils reaching downward (3-4 ragged appendages) ---
  // Tendril 1 (left)
  gH.fillStyle(COLORS.shadowDark);
  gH.fillRect(hCx - 12, 38, 4, 10);
  gH.fillRect(hCx - 13, 42, 3, 8);
  gH.fillRect(hCx - 14, 48, 2, 8);
  gH.fillRect(hCx - 15, 54, 2, 6);
  // Ragged left edge
  gH.fillRect(hCx - 16, 46, 1, 4);
  gH.fillRect(hCx - 14, 52, 1, 3);

  // Tendril 2 (center-left)
  gH.fillRect(hCx - 5, 38, 4, 12);
  gH.fillRect(hCx - 4, 48, 3, 10);
  gH.fillRect(hCx - 3, 56, 2, 6);

  // Tendril 3 (center-right)
  gH.fillRect(hCx + 2, 38, 4, 10);
  gH.fillRect(hCx + 3, 46, 3, 10);
  gH.fillRect(hCx + 4, 54, 2, 8);

  // Tendril 4 (right)
  gH.fillRect(hCx + 9, 38, 4, 8);
  gH.fillRect(hCx + 10, 44, 3, 8);
  gH.fillRect(hCx + 11, 50, 3, 6);
  gH.fillRect(hCx + 12, 54, 2, 6);
  // Ragged right edge
  gH.fillRect(hCx + 14, 48, 1, 4);

  // Side tendrils (extending outward)
  gH.fillRect(hCx - 20, 16, 4, 6);
  gH.fillRect(hCx - 22, 18, 3, 4);
  gH.fillRect(hCx + 16, 16, 4, 6);
  gH.fillRect(hCx + 19, 18, 3, 4);

  // --- shadowVoid at center core ---
  gH.fillStyle(COLORS.shadowVoid);
  gH.fillRect(hCx - 6, 16, 12, 10);
  gH.fillRect(hCx - 4, 14, 8, 14);
  gH.fillRect(hCx - 3, 26, 6, 4);

  // --- Purple energy veins running through body ---
  gH.fillStyle(COLORS.shadowPurple);
  // Vertical veins
  gH.fillRect(hCx - 10, 8, 1, 28);
  gH.fillRect(hCx + 9, 10, 1, 24);
  gH.fillRect(hCx - 3, 6, 1, 20);
  gH.fillRect(hCx + 3, 8, 1, 18);
  // Horizontal veins
  gH.fillRect(hCx - 14, 12, 8, 1);
  gH.fillRect(hCx + 6, 14, 8, 1);
  gH.fillRect(hCx - 12, 22, 6, 1);
  gH.fillRect(hCx + 6, 24, 6, 1);
  // Diagonal vein fragments
  gH.fillRect(hCx - 8, 28, 1, 1);
  gH.fillRect(hCx - 7, 29, 1, 1);
  gH.fillRect(hCx - 6, 30, 1, 1);
  gH.fillRect(hCx + 7, 28, 1, 1);
  gH.fillRect(hCx + 8, 29, 1, 1);
  gH.fillRect(hCx + 9, 30, 1, 1);
  // Vein through tendrils
  gH.fillRect(hCx - 11, 42, 1, 8);
  gH.fillRect(hCx - 3, 50, 1, 6);
  gH.fillRect(hCx + 4, 48, 1, 6);
  gH.fillRect(hCx + 11, 46, 1, 6);

  // --- Piercing red eyes (4x3 each with bright center) ---
  // Left eye
  gH.fillStyle(0xff2222);
  gH.fillRect(hCx - 8, 14, 4, 3);
  // Left eye bright center
  gH.fillStyle(0xff8888);
  gH.fillRect(hCx - 7, 15, 1, 1);
  // Left eye white-hot core
  gH.fillStyle(0xffcccc);
  gH.fillRect(hCx - 6, 15, 1, 1);

  // Right eye
  gH.fillStyle(0xff2222);
  gH.fillRect(hCx + 4, 14, 4, 3);
  // Right eye bright center
  gH.fillStyle(0xff8888);
  gH.fillRect(hCx + 6, 15, 1, 1);
  // Right eye white-hot core
  gH.fillStyle(0xffcccc);
  gH.fillRect(hCx + 7, 15, 1, 1);

  // Eye glow emanation
  gH.fillStyle(0xff2222, 0.25);
  gH.fillRect(hCx - 9, 13, 6, 5);
  gH.fillRect(hCx + 3, 13, 6, 5);

  // --- Wisps / energy dissipation pixels scattered around edges ---
  gH.fillStyle(COLORS.shadowPurple);
  gH.fillRect(hCx - 18, 12, 1, 1);
  gH.fillRect(hCx + 18, 14, 1, 1);
  gH.fillRect(hCx - 20, 20, 1, 1);
  gH.fillRect(hCx + 20, 20, 1, 1);
  gH.fillRect(hCx - 16, 8, 1, 1);
  gH.fillRect(hCx + 16, 10, 1, 1);
  gH.fillRect(hCx - 6, 0, 1, 1);
  gH.fillRect(hCx + 5, 1, 1, 1);
  gH.fillRect(hCx - 15, 56, 1, 1);
  gH.fillRect(hCx + 14, 54, 1, 1);
  gH.fillRect(hCx, 60, 1, 1);
  gH.fillRect(hCx - 22, 22, 1, 1);

  // Additional faint wisps at low alpha
  gH.fillStyle(COLORS.shadowPurple, 0.4);
  gH.fillRect(hCx - 20, 14, 2, 1);
  gH.fillRect(hCx + 19, 16, 2, 1);
  gH.fillRect(hCx - 4, 62, 2, 1);
  gH.fillRect(hCx + 6, 60, 2, 1);

  gH.generateTexture('npc-hollow', W, H);
  gH.destroy();
}
