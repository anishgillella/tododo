import { COLORS, darken, lighten } from './colorPalette';
import { CREATURE_SIZE } from '../constants';

export function generateCreatures(scene: Phaser.Scene): void {
  const S = CREATURE_SIZE;

  function makeCreature(
    key: string,
    draw: (g: Phaser.GameObjects.Graphics) => void,
  ) {
    const g = scene.add.graphics();
    draw(g);
    g.generateTexture(key, S, S);
    g.destroy();
  }

  // ── Wolf ───────────────────────────────────────────────────────────
  makeCreature('creature-wolf', (g) => {
    // Bushy tail
    g.fillStyle(COLORS.wolfDark);
    g.fillRect(50, 20, 6, 5);
    g.fillRect(54, 18, 6, 4);
    g.fillRect(58, 15, 4, 5);
    g.fillStyle(COLORS.wolfGrey);
    g.fillRect(59, 16, 3, 3); // grey tip

    // Main body
    g.fillStyle(COLORS.wolfGrey);
    g.fillRect(12, 22, 40, 16); // torso
    g.fillRect(14, 20, 36, 2); // upper body

    // Dark spine ridge
    g.fillStyle(COLORS.wolfDark);
    g.fillRect(14, 20, 36, 4);

    // Light underbelly
    g.fillStyle(COLORS.wolfLight);
    g.fillRect(16, 34, 32, 4);

    // Head
    g.fillStyle(COLORS.wolfGrey);
    g.fillRect(4, 18, 14, 14); // head block
    g.fillRect(0, 24, 6, 6); // snout

    // Ears
    g.fillStyle(COLORS.wolfGrey);
    g.fillRect(5, 12, 5, 7);
    g.fillRect(13, 12, 5, 7);
    // Inner ear color
    g.fillStyle(COLORS.wolfDark);
    g.fillRect(6, 13, 3, 5);
    g.fillRect(14, 13, 3, 5);

    // Eyes – menacing red
    g.fillStyle(0xff2222);
    g.fillRect(5, 22, 3, 2);
    g.fillRect(11, 22, 3, 2);

    // Fangs – small white triangles at snout
    g.fillStyle(COLORS.wolfFang);
    g.fillRect(1, 30, 2, 3);
    g.fillRect(4, 30, 2, 3);
    g.fillRect(1, 31, 1, 2);
    g.fillRect(5, 31, 1, 2);

    // 4 legs
    g.fillStyle(COLORS.wolfGrey);
    g.fillRect(14, 38, 6, 12); // front-left
    g.fillRect(24, 38, 6, 12); // front-right
    g.fillRect(36, 38, 6, 12); // back-left
    g.fillRect(46, 38, 6, 12); // back-right

    // Dark lower legs
    g.fillStyle(COLORS.wolfDark);
    g.fillRect(14, 46, 6, 4); // paw
    g.fillRect(24, 46, 6, 4);
    g.fillRect(36, 46, 6, 4);
    g.fillRect(46, 46, 6, 4);

    // Paw detail – lighter toe marks
    g.fillStyle(COLORS.wolfLight);
    g.fillRect(15, 49, 2, 1);
    g.fillRect(25, 49, 2, 1);
    g.fillRect(37, 49, 2, 1);
    g.fillRect(47, 49, 2, 1);

    // Fur texture – short diagonal strokes across body
    g.fillStyle(COLORS.wolfDark);
    for (let i = 0; i < 20; i++) {
      const fx = 14 + ((i * 7 + 3) % 38);
      const fy = 22 + ((i * 5 + 2) % 14);
      g.fillRect(fx, fy, 2, 1);
      g.fillRect(fx + 1, fy + 1, 1, 1);
    }
    g.fillStyle(COLORS.wolfLight);
    for (let i = 0; i < 12; i++) {
      const fx = 16 + ((i * 9 + 5) % 32);
      const fy = 24 + ((i * 3 + 1) % 10);
      g.fillRect(fx, fy, 1, 2);
    }
  });

  // ── Spider ─────────────────────────────────────────────────────────
  makeCreature('creature-spider', (g) => {
    // Legs – 8 legs, 4 per side, each with 2 segments and knee bend
    const legColor = COLORS.spiderBlack;
    const stripeColor = COLORS.spiderStripe;

    // Left legs (4)
    // Leg 1 (front-left)
    g.fillStyle(legColor);
    g.fillRect(12, 22, 2, 8); // upper segment going down-left
    g.fillRect(4, 28, 10, 2); // lower segment going out
    g.fillStyle(stripeColor);
    g.fillRect(8, 28, 3, 2); // stripe

    // Leg 2
    g.fillStyle(legColor);
    g.fillRect(10, 28, 2, 8);
    g.fillRect(2, 34, 10, 2);
    g.fillStyle(stripeColor);
    g.fillRect(5, 34, 3, 2);

    // Leg 3
    g.fillStyle(legColor);
    g.fillRect(10, 34, 2, 8);
    g.fillRect(2, 40, 10, 2);
    g.fillStyle(stripeColor);
    g.fillRect(5, 40, 3, 2);

    // Leg 4 (back-left)
    g.fillStyle(legColor);
    g.fillRect(14, 38, 2, 8);
    g.fillRect(6, 44, 10, 2);
    g.fillStyle(stripeColor);
    g.fillRect(8, 44, 3, 2);

    // Right legs (4)
    // Leg 5 (front-right)
    g.fillStyle(legColor);
    g.fillRect(48, 22, 2, 8);
    g.fillRect(50, 28, 10, 2);
    g.fillStyle(stripeColor);
    g.fillRect(53, 28, 3, 2);

    // Leg 6
    g.fillStyle(legColor);
    g.fillRect(50, 28, 2, 8);
    g.fillRect(52, 34, 10, 2);
    g.fillStyle(stripeColor);
    g.fillRect(56, 34, 3, 2);

    // Leg 7
    g.fillStyle(legColor);
    g.fillRect(50, 34, 2, 8);
    g.fillRect(52, 40, 10, 2);
    g.fillStyle(stripeColor);
    g.fillRect(56, 40, 3, 2);

    // Leg 8 (back-right)
    g.fillStyle(legColor);
    g.fillRect(46, 38, 2, 8);
    g.fillRect(48, 44, 10, 2);
    g.fillStyle(stripeColor);
    g.fillRect(51, 44, 3, 2);

    // Abdomen – large oval approximation ~20x16
    g.fillStyle(COLORS.spiderBlack);
    g.fillRect(22, 30, 20, 16); // core
    g.fillRect(20, 32, 24, 12); // wider middle
    g.fillRect(24, 28, 16, 2); // top rounding
    g.fillRect(24, 46, 16, 2); // bottom rounding

    // Hourglass / chevron pattern on abdomen
    g.fillStyle(COLORS.spiderStripe);
    g.fillRect(30, 32, 4, 2); // top of chevron
    g.fillRect(29, 34, 2, 2);
    g.fillRect(33, 34, 2, 2);
    g.fillRect(28, 36, 2, 2);
    g.fillRect(34, 36, 2, 2);
    g.fillRect(29, 38, 2, 2);
    g.fillRect(33, 38, 2, 2);
    g.fillRect(30, 40, 4, 2); // bottom of chevron

    // Cephalothorax – smaller oval in front ~14x12
    g.fillStyle(COLORS.spiderBlack);
    g.fillRect(25, 18, 14, 12); // core
    g.fillRect(23, 20, 18, 8); // wider
    g.fillRect(27, 16, 10, 3); // top rounding

    // Eye cluster – 8 small red dots
    g.fillStyle(COLORS.spiderRed);
    g.fillRect(28, 18, 2, 2); // row 1
    g.fillRect(34, 18, 2, 2);
    g.fillRect(30, 20, 2, 2); // row 2
    g.fillRect(32, 20, 2, 2);
    g.fillRect(27, 21, 2, 1); // row 3 outer
    g.fillRect(35, 21, 2, 1);
    g.fillRect(29, 22, 2, 1); // row 4
    g.fillRect(33, 22, 2, 1);

    // Chelicerae / fangs
    g.fillStyle(COLORS.spiderRed);
    g.fillRect(29, 16, 2, 3);
    g.fillRect(33, 16, 2, 3);
    g.fillRect(29, 14, 1, 2);
    g.fillRect(34, 14, 1, 2);
  });

  // ── Wraith ─────────────────────────────────────────────────────────
  makeCreature('creature-wraith', (g) => {
    // Main robe body – wider at bottom
    g.fillStyle(COLORS.wraithBlue);
    g.fillRect(20, 14, 24, 8); // upper robe
    g.fillRect(18, 22, 28, 10); // middle
    g.fillRect(14, 32, 36, 10); // lower – wider
    g.fillRect(12, 42, 40, 8); // bottom – widest

    // Ragged / jagged hem edges
    g.fillStyle(COLORS.wraithBlue);
    g.fillRect(10, 50, 6, 4);
    g.fillRect(18, 52, 5, 5);
    g.fillRect(26, 50, 4, 6);
    g.fillRect(32, 52, 6, 4);
    g.fillRect(40, 50, 5, 5);
    g.fillRect(48, 51, 4, 3);
    // Additional jagged bits
    g.fillRect(14, 51, 3, 5);
    g.fillRect(22, 53, 3, 4);
    g.fillRect(36, 53, 3, 5);
    g.fillRect(44, 52, 3, 4);

    // Hood – darker area on top
    g.fillStyle(COLORS.wraithDark);
    g.fillRect(22, 6, 20, 12);
    g.fillRect(24, 4, 16, 4); // top of hood
    g.fillRect(26, 2, 12, 4); // peak
    g.fillRect(28, 0, 8, 3); // pointed tip

    // Darker hood interior
    g.fillStyle(darken(COLORS.wraithDark, 0.3));
    g.fillRect(26, 8, 12, 8);

    // Glowing eyes inside hood
    g.fillStyle(0xffffff);
    g.fillRect(27, 10, 3, 3);
    g.fillRect(34, 10, 3, 3);

    // Spectral arms – semi-transparent (pixel gaps)
    g.fillStyle(COLORS.wraithGlow);
    // Left arm
    g.fillRect(10, 22, 8, 3);
    g.fillRect(6, 24, 6, 3);
    g.fillRect(4, 26, 4, 3);
    g.fillRect(8, 25, 2, 2);
    g.fillRect(12, 23, 2, 1);
    // finger-like wisps
    g.fillRect(2, 27, 2, 2);
    g.fillRect(4, 29, 1, 2);

    // Right arm
    g.fillRect(46, 22, 8, 3);
    g.fillRect(52, 24, 6, 3);
    g.fillRect(56, 26, 4, 3);
    g.fillRect(50, 25, 2, 2);
    g.fillRect(48, 23, 2, 1);
    // finger-like wisps
    g.fillRect(60, 27, 2, 2);
    g.fillRect(59, 29, 1, 2);

    // Ethereal wisps – scattered glow pixels around edges
    g.fillStyle(COLORS.wraithGlow);
    const wispPositions = [
      [11, 48], [16, 55], [25, 57], [38, 56], [46, 54], [50, 48],
      [8, 30], [56, 30], [13, 38], [50, 40], [20, 58], [42, 58],
      [6, 20], [57, 20], [30, 58], [10, 44], [52, 44],
    ];
    for (const [wx, wy] of wispPositions) {
      g.fillRect(wx, wy, 2, 1);
    }
    // Single-pixel wisps
    const tinyWisps = [
      [9, 46], [53, 46], [15, 57], [47, 55], [3, 28], [60, 25],
      [19, 59], [43, 59], [32, 59],
    ];
    for (const [wx, wy] of tinyWisps) {
      g.fillRect(wx, wy, 1, 1);
    }
  });

  // ── Golem ──────────────────────────────────────────────────────────
  makeCreature('creature-golem', (g) => {
    // Thick legs – stubby, heavy
    g.fillStyle(COLORS.golemBrown);
    g.fillRect(14, 52, 12, 10); // left leg
    g.fillRect(38, 52, 12, 10); // right leg
    g.fillStyle(COLORS.golemGrey);
    g.fillRect(14, 58, 12, 4); // left foot stone
    g.fillRect(38, 58, 12, 4); // right foot stone

    // Large blocky body ~30x32
    g.fillStyle(COLORS.golemBrown);
    g.fillRect(10, 20, 44, 34); // main torso

    // Rocky surface patches – golemGrey
    g.fillStyle(COLORS.golemGrey);
    g.fillRect(14, 24, 6, 5);
    g.fillRect(28, 22, 8, 4);
    g.fillRect(42, 28, 6, 6);
    g.fillRect(12, 36, 5, 6);
    g.fillRect(34, 40, 7, 5);
    g.fillRect(20, 44, 6, 4);
    g.fillRect(44, 44, 5, 4);
    g.fillRect(18, 30, 4, 3);
    g.fillRect(38, 32, 5, 4);

    // Head – smaller rectangular on top ~18x14
    g.fillStyle(COLORS.golemBrown);
    g.fillRect(18, 6, 28, 16);
    g.fillStyle(COLORS.golemGrey);
    g.fillRect(20, 8, 8, 4); // stone patch on head
    g.fillRect(34, 10, 6, 4);

    // Eyes – golemRune colored 3x3 each
    g.fillStyle(COLORS.golemRune);
    g.fillRect(24, 12, 3, 3);
    g.fillRect(37, 12, 3, 3);

    // Thick arms hanging at sides ~8px wide
    g.fillStyle(COLORS.golemBrown);
    g.fillRect(0, 22, 10, 28); // left arm
    g.fillRect(54, 22, 10, 28); // right arm
    g.fillStyle(COLORS.golemGrey);
    g.fillRect(2, 26, 6, 5); // stone on left arm
    g.fillRect(56, 32, 6, 5); // stone on right arm
    // Fists
    g.fillStyle(COLORS.golemBrown);
    g.fillRect(0, 48, 10, 6);
    g.fillRect(54, 48, 10, 6);

    // Rune marks – glowing dots/lines on chest and arms
    g.fillStyle(COLORS.golemRune);
    // Chest runes
    g.fillRect(26, 28, 2, 6); // vertical line
    g.fillRect(36, 28, 2, 6);
    g.fillRect(28, 30, 8, 2); // horizontal connector
    g.fillRect(30, 36, 4, 2); // lower rune dot
    // Arm runes
    g.fillRect(3, 34, 4, 2); // left arm
    g.fillRect(57, 38, 4, 2); // right arm

    // Subtle rune glow – lighter shade around rune marks
    g.fillStyle(lighten(COLORS.golemRune, 0.3));
    g.fillRect(25, 27, 1, 1);
    g.fillRect(28, 27, 1, 1);
    g.fillRect(35, 27, 1, 1);
    g.fillRect(38, 27, 1, 1);
    g.fillRect(31, 38, 2, 1);
  });

  // ── Dragon ─────────────────────────────────────────────────────────
  makeCreature('creature-dragon', (g) => {
    // Tail extending from rear, tapering
    g.fillStyle(COLORS.dragonRed);
    g.fillRect(48, 30, 6, 6);
    g.fillRect(52, 32, 6, 4);
    g.fillRect(56, 33, 5, 3);
    g.fillRect(59, 34, 4, 2);
    g.fillRect(61, 35, 2, 1);

    // Wings – bat-like, dragonWing colored
    g.fillStyle(COLORS.dragonWing);
    // Left wing
    g.fillRect(8, 4, 14, 3); // top edge
    g.fillRect(4, 7, 12, 3); // upper membrane
    g.fillRect(2, 10, 14, 4); // middle membrane
    g.fillRect(6, 14, 10, 3); // lower membrane
    // Right wing
    g.fillRect(36, 4, 14, 3);
    g.fillRect(42, 7, 12, 3);
    g.fillRect(42, 10, 14, 4);
    g.fillRect(42, 14, 10, 3);

    // Wing veins – thin darker lines
    g.fillStyle(darken(COLORS.dragonWing, 0.3));
    g.fillRect(10, 5, 1, 12); // left wing vein 1
    g.fillRect(6, 8, 1, 9); // left wing vein 2
    g.fillRect(14, 5, 1, 10); // left wing vein 3
    g.fillRect(44, 5, 1, 12); // right wing vein 1
    g.fillRect(48, 5, 1, 12); // right wing vein 2
    g.fillRect(52, 8, 1, 6); // right wing vein 3

    // Main body – elongated
    g.fillStyle(COLORS.dragonRed);
    g.fillRect(14, 18, 36, 18); // torso
    g.fillRect(16, 16, 32, 4); // upper body

    // Belly – scaled pattern with dragonGold/dragonScale
    for (let row = 0; row < 5; row++) {
      const by = 26 + row * 2;
      g.fillStyle(row % 2 === 0 ? COLORS.dragonGold : COLORS.dragonScale);
      g.fillRect(20, by, 24, 2);
    }

    // Head – angular
    g.fillStyle(COLORS.dragonRed);
    g.fillRect(2, 18, 16, 14); // head block
    g.fillRect(0, 22, 4, 6); // snout extension

    // Horns – two triangular protrusions
    g.fillStyle(COLORS.dragonGold);
    g.fillRect(4, 12, 3, 6);
    g.fillRect(5, 10, 2, 3);
    g.fillRect(6, 8, 1, 3);
    g.fillRect(12, 12, 3, 6);
    g.fillRect(13, 10, 2, 3);
    g.fillRect(14, 8, 1, 3);

    // Eyes – yellow
    g.fillStyle(0xffff00);
    g.fillRect(4, 22, 3, 2);
    g.fillRect(11, 22, 3, 2);

    // Fire-glow mouth
    g.fillStyle(0xff6600);
    g.fillRect(0, 26, 4, 3);
    g.fillStyle(0xff8800);
    g.fillRect(0, 27, 3, 1);

    // 2 visible legs with clawed feet
    g.fillStyle(COLORS.dragonRed);
    g.fillRect(18, 36, 8, 14); // front leg
    g.fillRect(38, 36, 8, 14); // back leg
    // Darker lower legs
    g.fillStyle(darken(COLORS.dragonRed, 0.2));
    g.fillRect(18, 46, 8, 4);
    g.fillRect(38, 46, 8, 4);
    // Claws
    g.fillStyle(COLORS.dragonGold);
    g.fillRect(17, 49, 2, 2);
    g.fillRect(21, 50, 2, 2);
    g.fillRect(25, 49, 2, 2);
    g.fillRect(37, 49, 2, 2);
    g.fillRect(41, 50, 2, 2);
    g.fillRect(45, 49, 2, 2);
  });

  // ── Shadow ─────────────────────────────────────────────────────────
  makeCreature('creature-shadow', (g) => {
    // Amorphous mass – multiple overlapping shapes
    g.fillStyle(COLORS.shadowDark);
    g.fillRect(12, 12, 40, 32); // main mass
    g.fillRect(8, 16, 48, 24); // wider middle
    g.fillRect(16, 8, 32, 8); // upper blob
    g.fillRect(10, 40, 44, 8); // lower blob
    g.fillRect(6, 20, 6, 16); // left bump
    g.fillRect(52, 20, 6, 16); // right bump

    // Additional darkened overlapping shapes
    g.fillStyle(darken(COLORS.shadowDark, 0.3));
    g.fillRect(18, 14, 28, 28);
    g.fillRect(14, 18, 36, 24);

    // Void center – darker than dark
    g.fillStyle(COLORS.shadowVoid);
    g.fillRect(22, 18, 20, 18);
    g.fillRect(20, 20, 24, 14);
    g.fillRect(24, 16, 16, 4);

    // Eyes – bright glowing, 4x3 each
    g.fillStyle(0xff0044);
    g.fillRect(24, 24, 4, 3);
    g.fillRect(36, 24, 4, 3);
    // Eye glow
    g.fillStyle(lighten(0xff0044, 0.4));
    g.fillRect(25, 25, 2, 1);
    g.fillRect(37, 25, 2, 1);

    // Reaching tendrils – 5 extending outward, thinning at tips
    g.fillStyle(COLORS.shadowDark);
    // Tendril 1 – upper-left
    g.fillRect(10, 10, 6, 4);
    g.fillRect(6, 8, 5, 3);
    g.fillRect(2, 6, 4, 2);
    g.fillRect(0, 5, 2, 1);

    // Tendril 2 – upper-right
    g.fillRect(48, 10, 6, 4);
    g.fillRect(53, 8, 5, 3);
    g.fillRect(58, 6, 4, 2);
    g.fillRect(62, 5, 2, 1);

    // Tendril 3 – lower-left
    g.fillRect(8, 42, 6, 4);
    g.fillRect(4, 46, 5, 3);
    g.fillRect(2, 49, 3, 2);
    g.fillRect(0, 51, 2, 1);

    // Tendril 4 – lower-right
    g.fillRect(50, 42, 6, 4);
    g.fillRect(55, 46, 5, 3);
    g.fillRect(59, 49, 3, 2);
    g.fillRect(62, 51, 2, 1);

    // Tendril 5 – downward center
    g.fillRect(28, 46, 8, 4);
    g.fillRect(30, 50, 4, 4);
    g.fillRect(31, 54, 2, 3);
    g.fillRect(31, 57, 1, 2);

    // Energy wisps – scattered shadowPurple pixels around edges
    g.fillStyle(COLORS.shadowPurple);
    const shadowWisps = [
      [6, 14, 2, 2], [56, 14, 2, 2], [4, 32, 2, 2], [58, 32, 2, 2],
      [14, 46, 2, 1], [48, 46, 2, 1], [12, 8, 2, 1], [50, 8, 2, 1],
      [20, 48, 1, 1], [42, 48, 1, 1], [8, 26, 1, 1], [54, 26, 1, 1],
      [16, 6, 1, 1], [46, 6, 1, 1], [26, 48, 1, 1], [38, 48, 1, 1],
      [34, 46, 2, 1], [3, 24, 1, 1], [60, 24, 1, 1],
    ];
    for (const [sx, sy, sw, sh] of shadowWisps) {
      g.fillRect(sx, sy, sw, sh);
    }
  });

  // ── Elemental ──────────────────────────────────────────────────────
  makeCreature('creature-elemental', (g) => {
    // Outer shell – elementalBlue vortex-like shape
    g.fillStyle(COLORS.elementalBlue);
    g.fillRect(16, 12, 32, 32); // main body
    g.fillRect(12, 16, 40, 24); // wider middle
    g.fillRect(20, 8, 24, 6); // upper
    g.fillRect(20, 42, 24, 6); // lower

    // Vortex edges – slightly different shades for swirl effect
    g.fillStyle(darken(COLORS.elementalBlue, 0.15));
    g.fillRect(14, 18, 4, 8);
    g.fillRect(46, 30, 4, 8);
    g.fillRect(22, 10, 8, 3);
    g.fillRect(34, 43, 8, 3);
    g.fillStyle(lighten(COLORS.elementalBlue, 0.2));
    g.fillRect(46, 18, 4, 8);
    g.fillRect(14, 30, 4, 8);
    g.fillRect(34, 10, 8, 3);
    g.fillRect(22, 43, 8, 3);

    // Energy core – swirling circular center ~16x16
    g.fillStyle(COLORS.elementalWhite);
    g.fillRect(24, 20, 16, 16); // core center
    g.fillRect(22, 22, 20, 12); // wider
    g.fillRect(26, 18, 12, 2); // top round
    g.fillRect(26, 36, 12, 2); // bottom round

    // Swirl effect in core
    g.fillStyle(lighten(COLORS.elementalBlue, 0.5));
    g.fillRect(26, 22, 3, 2);
    g.fillRect(28, 24, 3, 2);
    g.fillRect(30, 26, 4, 2);
    g.fillRect(34, 28, 3, 2);
    g.fillRect(36, 30, 3, 2);
    g.fillRect(33, 32, 3, 2);

    // Eyes – white within the core
    g.fillStyle(0xffffff);
    g.fillRect(27, 26, 3, 3);
    g.fillRect(36, 26, 3, 3);

    // Orbiting debris – 5 small golemGrey squares at various positions
    g.fillStyle(COLORS.golemGrey);
    g.fillRect(4, 22, 4, 4); // far left
    g.fillRect(56, 18, 4, 4); // far right
    g.fillRect(28, 2, 4, 4); // top
    g.fillRect(8, 42, 4, 4); // bottom-left
    g.fillRect(52, 40, 4, 4); // bottom-right

    // Darker shading on debris
    g.fillStyle(darken(COLORS.golemGrey, 0.2));
    g.fillRect(5, 24, 2, 2);
    g.fillRect(57, 20, 2, 2);
    g.fillRect(29, 4, 2, 2);
    g.fillRect(9, 44, 2, 2);
    g.fillRect(53, 42, 2, 2);

    // Electrical arcs – thin 1px lines connecting core to debris
    g.fillStyle(COLORS.elementalArc);
    // Arc to far-left debris
    for (let i = 0; i < 8; i++) {
      g.fillRect(8 + i * 2, 23 + (i % 3 === 0 ? -1 : 0), 2, 1);
    }
    // Arc to far-right debris
    for (let i = 0; i < 8; i++) {
      g.fillRect(42 + i * 2, 21 + (i % 3 === 0 ? 1 : 0), 2, 1);
    }
    // Arc to top debris
    for (let i = 0; i < 6; i++) {
      g.fillRect(30 + (i % 2 === 0 ? -1 : 1), 6 + i * 2, 1, 2);
    }
    // Arc to bottom-left debris
    for (let i = 0; i < 5; i++) {
      g.fillRect(12 + i * 2, 38 + i, 1, 2);
    }
    // Arc to bottom-right debris
    for (let i = 0; i < 5; i++) {
      g.fillRect(50 - i * 2, 38 + i, 1, 2);
    }

    // Floating base – tapered energy trail at the bottom
    g.fillStyle(COLORS.elementalBlue);
    g.fillRect(22, 46, 20, 3);
    g.fillRect(26, 49, 12, 3);
    g.fillRect(28, 52, 8, 2);
    g.fillRect(30, 54, 4, 2);
    g.fillStyle(lighten(COLORS.elementalBlue, 0.3));
    g.fillRect(30, 56, 4, 2);
    g.fillRect(31, 58, 2, 2);
    // Fading trail wisps
    g.fillStyle(COLORS.elementalArc);
    g.fillRect(24, 48, 2, 1);
    g.fillRect(38, 48, 2, 1);
    g.fillRect(27, 51, 1, 1);
    g.fillRect(36, 51, 1, 1);
  });
}
