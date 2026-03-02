import { COLORS } from './colorPalette';
import { CHAR_FRAME_W, CHAR_FRAME_H, CHAR_COLS } from '../constants';

export function generateCharacters(scene: Phaser.Scene): void {
  const FW = CHAR_FRAME_W; // 48
  const FH = CHAR_FRAME_H; // 64
  const COLS = CHAR_COLS; // 4: idle, walk-left-step, center-passing, walk-right-step
  const ROWS = 4; // down, left, right, up
  const totalW = FW * COLS; // 192
  const totalH = FH * ROWS; // 256

  const g = scene.add.graphics();

  // ---- Proportions ----
  const headW = 14;
  const headH = 14;
  const torsoW = 18;
  const torsoH = 18;
  const armW = 5;
  const armH = 12;
  const legW = 6;
  const legH = 12;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const ox = col * FW;
      const oy = row * FH;

      // Direction helpers
      const facingDown = row === 0;
      const facingLeft = row === 1;
      const facingRight = row === 2;
      const facingUp = row === 3;
      const facingSide = facingLeft || facingRight;

      // Walk offsets
      // col 0 = idle, col 1 = walk-left-step, col 2 = center-passing (bob), col 3 = walk-right-step
      const isWalkLeft = col === 1;
      const isWalkRight = col === 3;
      const isCenterPass = col === 2;
      const isIdle = col === 0;

      const legOffset = isWalkLeft ? -2 : isWalkRight ? 2 : 0;
      const armSwing = isWalkLeft ? 1 : isWalkRight ? -1 : 0;
      const bobY = isCenterPass ? -1 : 0;

      // ---- Centering ----
      const cx = Math.floor(FW / 2); // 24 - horizontal center
      const headX = ox + cx - Math.floor(headW / 2); // ox + 17
      const headY = oy + 6 + bobY;
      const torsoX = ox + cx - Math.floor(torsoW / 2); // ox + 15
      const torsoY = headY + headH; // below head
      const leftArmX = torsoX - armW; // left of torso
      const rightArmX = torsoX + torsoW; // right of torso
      const armY = torsoY + 1;
      const leftLegX = ox + cx - legW - 1;
      const rightLegX = ox + cx + 1;
      const legY = torsoY + torsoH;

      // ---- Side view adjustments ----
      const sideShift = facingLeft ? -2 : facingRight ? 2 : 0;

      // ======================================================
      // DRAW ORDER: legs, arms (back), torso, arms (front), head
      // ======================================================

      // ---- LEGS / BOOTS ----
      if (facingSide) {
        // Side view: legs overlap more, front/back distinction
        const frontLegX = ox + cx - Math.floor(legW / 2) + sideShift;
        const backLegX = ox + cx - Math.floor(legW / 2) + sideShift - (facingLeft ? 2 : -2);

        // Back leg (darker, drawn first)
        g.fillStyle(COLORS.bootsDark);
        g.fillRect(backLegX + legOffset, legY, legW, legH);

        // Front leg
        g.fillStyle(COLORS.boots);
        g.fillRect(frontLegX - legOffset, legY, legW, legH);
        // Dark inside edge
        g.fillStyle(COLORS.bootsDark);
        if (facingLeft) {
          g.fillRect(frontLegX - legOffset + legW - 1, legY, 1, legH);
        } else {
          g.fillRect(frontLegX - legOffset, legY, 1, legH);
        }
      } else {
        // Front/back view: two legs side by side
        // Left leg
        g.fillStyle(COLORS.boots);
        g.fillRect(leftLegX + legOffset, legY, legW, legH);
        // Inside edge shadow
        g.fillStyle(COLORS.bootsDark);
        g.fillRect(leftLegX + legOffset + legW - 1, legY, 1, legH);

        // Right leg
        g.fillStyle(COLORS.boots);
        g.fillRect(rightLegX - legOffset, legY, legW, legH);
        // Inside edge shadow
        g.fillStyle(COLORS.bootsDark);
        g.fillRect(rightLegX - legOffset, legY, 1, legH);
      }

      // ---- ARMS (back arm for side view) ----
      if (facingSide) {
        const backArmX = facingLeft
          ? torsoX + sideShift + torsoW - 2
          : torsoX + sideShift - armW + 2;
        // Back arm: sleeve top
        g.fillStyle(COLORS.clothBlueDark);
        g.fillRect(backArmX, armY + armSwing, armW, 4);
        // Back arm: skin
        g.fillStyle(COLORS.skinDark);
        g.fillRect(backArmX, armY + 4 + armSwing, armW, armH - 4);
      } else {
        // Front/back: left arm behind torso partially visible
        // Left arm sleeve
        g.fillStyle(COLORS.clothBlue);
        g.fillRect(leftArmX, armY - armSwing, armW, 4);
        g.fillStyle(COLORS.clothBlueDark);
        g.fillRect(leftArmX, armY - armSwing + 3, armW, 1); // cuff
        // Left arm skin
        g.fillStyle(COLORS.skin);
        g.fillRect(leftArmX, armY + 4 - armSwing, armW, armH - 4);
      }

      // ---- TORSO ----
      {
        const tx = torsoX + sideShift;

        // Main tunic body
        g.fillStyle(COLORS.clothBlue);
        g.fillRect(tx, torsoY, torsoW, torsoH);

        // Shadow on edges
        g.fillStyle(COLORS.clothBlueDark);
        g.fillRect(tx, torsoY, 2, torsoH); // left edge
        g.fillRect(tx + torsoW - 2, torsoY, 2, torsoH); // right edge

        // Highlight in center
        g.fillStyle(COLORS.clothBlueLight);
        g.fillRect(tx + Math.floor(torsoW / 2) - 2, torsoY + 2, 4, torsoH - 4);

        // Collar at neckline
        g.fillStyle(COLORS.collar);
        g.fillRect(tx + 3, torsoY, torsoW - 6, 2);

        // Belt strip across middle
        g.fillStyle(COLORS.belt);
        g.fillRect(tx, torsoY + Math.floor(torsoH / 2) - 1, torsoW, 3);

        // Belt buckle (metal)
        g.fillStyle(COLORS.metal);
        g.fillRect(tx + Math.floor(torsoW / 2) - 1, torsoY + Math.floor(torsoH / 2) - 1, 3, 3);
        g.fillStyle(COLORS.metalShine);
        g.fillRect(tx + Math.floor(torsoW / 2), torsoY + Math.floor(torsoH / 2), 1, 1);
      }

      // ---- ARMS (front arm / right arm for front/back) ----
      if (facingSide) {
        const frontArmX = facingLeft
          ? torsoX + sideShift - armW + 2
          : torsoX + sideShift + torsoW - 2;
        // Front arm sleeve
        g.fillStyle(COLORS.clothBlue);
        g.fillRect(frontArmX, armY - armSwing, armW, 4);
        g.fillStyle(COLORS.clothBlueDark);
        g.fillRect(frontArmX, armY - armSwing + 3, armW, 1); // cuff
        // Front arm skin
        g.fillStyle(COLORS.skin);
        g.fillRect(frontArmX, armY + 4 - armSwing, armW, armH - 4);
      } else {
        // Right arm (front layer)
        // Sleeve
        g.fillStyle(COLORS.clothBlue);
        g.fillRect(rightArmX, armY + armSwing, armW, 4);
        g.fillStyle(COLORS.clothBlueDark);
        g.fillRect(rightArmX, armY + armSwing + 3, armW, 1); // cuff
        // Skin
        g.fillStyle(COLORS.skin);
        g.fillRect(rightArmX, armY + 4 + armSwing, armW, armH - 4);
      }

      // ---- HEAD ----
      {
        const hx = headX + sideShift;
        const hy = headY;

        // Base head shape (skin oval approximated as rect with rounded corners)
        g.fillStyle(COLORS.skin);
        g.fillRect(hx + 1, hy, headW - 2, headH); // main
        g.fillRect(hx, hy + 1, headW, headH - 2); // wider middle
        // Lighter highlights on cheek area
        g.fillStyle(COLORS.skinLight);
        g.fillRect(hx + 2, hy + 5, 2, 3);

        if (facingDown) {
          // ---- FRONT FACE ----
          // Hair on top
          g.fillStyle(COLORS.hair);
          g.fillRect(hx, hy, headW, 5);
          g.fillRect(hx - 1, hy + 1, 1, 3); // side fringe left
          g.fillRect(hx + headW, hy + 1, 1, 3); // side fringe right
          // Hair highlight
          g.fillStyle(COLORS.hairHighlight);
          g.fillRect(hx + 3, hy + 1, headW - 6, 2);

          // Eyes: 2x2 dark with 1px white highlight
          const eyeY = hy + 7;
          const leftEyeX = hx + 3;
          const rightEyeX = hx + headW - 5;
          g.fillStyle(0x222222);
          g.fillRect(leftEyeX, eyeY, 2, 2);
          g.fillRect(rightEyeX, eyeY, 2, 2);
          // White highlight (top-left of each eye)
          g.fillStyle(0xffffff);
          g.fillRect(leftEyeX, eyeY, 1, 1);
          g.fillRect(rightEyeX, eyeY, 1, 1);

          // Mouth hint
          g.fillStyle(COLORS.skinDark);
          g.fillRect(hx + Math.floor(headW / 2) - 1, hy + 11, 3, 1);
        } else if (facingUp) {
          // ---- BACK VIEW ----
          // Hair covers most of the head from behind
          g.fillStyle(COLORS.hair);
          g.fillRect(hx - 1, hy, headW + 2, headH - 2);
          g.fillRect(hx, hy + headH - 2, headW, 2); // bottom edge
          // Hair highlight stripe
          g.fillStyle(COLORS.hairHighlight);
          g.fillRect(hx + Math.floor(headW / 2) - 1, hy + 1, 3, headH - 4);
          // No face features visible
        } else if (facingLeft) {
          // ---- LEFT SIDE VIEW ----
          // Hair
          g.fillStyle(COLORS.hair);
          g.fillRect(hx, hy, headW, 5);
          g.fillRect(hx + headW - 2, hy + 1, 3, 6); // hair on back of head
          // Highlight
          g.fillStyle(COLORS.hairHighlight);
          g.fillRect(hx + 2, hy + 1, 5, 2);

          // Single eye (on left side of face since facing left)
          const eyeX = hx + 2;
          const eyeY = hy + 7;
          g.fillStyle(0x222222);
          g.fillRect(eyeX, eyeY, 2, 2);
          g.fillStyle(0xffffff);
          g.fillRect(eyeX, eyeY, 1, 1);

          // Nose hint
          g.fillStyle(COLORS.skinDark);
          g.fillRect(hx, hy + 8, 1, 2);

          // Ear on right side
          g.fillStyle(COLORS.skinDark);
          g.fillRect(hx + headW, hy + 5, 2, 3);
        } else if (facingRight) {
          // ---- RIGHT SIDE VIEW ----
          // Hair
          g.fillStyle(COLORS.hair);
          g.fillRect(hx, hy, headW, 5);
          g.fillRect(hx - 1, hy + 1, 3, 6); // hair on back of head
          // Highlight
          g.fillStyle(COLORS.hairHighlight);
          g.fillRect(hx + headW - 7, hy + 1, 5, 2);

          // Single eye (on right side of face since facing right)
          const eyeX = hx + headW - 4;
          const eyeY = hy + 7;
          g.fillStyle(0x222222);
          g.fillRect(eyeX, eyeY, 2, 2);
          g.fillStyle(0xffffff);
          g.fillRect(eyeX, eyeY, 1, 1);

          // Nose hint
          g.fillStyle(COLORS.skinDark);
          g.fillRect(hx + headW - 1, hy + 8, 1, 2);

          // Ear on left side
          g.fillStyle(COLORS.skinDark);
          g.fillRect(hx - 2, hy + 5, 2, 3);
        }
      }
    }
  }

  g.generateTexture('player-sheet', totalW, totalH);
  g.destroy();

  // ---- Add individual frames to the texture ----
  const texture = scene.textures.get('player-sheet');
  texture.add('__BASE', 0, 0, 0, totalW, totalH);

  let frameIndex = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      texture.add(frameIndex, 0, col * FW, row * FH, FW, FH);
      frameIndex++;
    }
  }

  // ---- Create animations ----
  // Row mapping: down=row0, left=row1, right=row2, up=row3
  // Frame index = row * COLS + col
  const dirs = ['down', 'left', 'right', 'up'];
  dirs.forEach((dir, rowIdx) => {
    const base = rowIdx * COLS;

    // Idle: single frame from column 0
    scene.anims.create({
      key: `player-idle-${dir}`,
      frames: [{ key: 'player-sheet', frame: base + 0 }],
      frameRate: 1,
    });

    // Walk: 4-frame cycle [col1, col0, col3, col0] at frameRate 8, repeat forever
    scene.anims.create({
      key: `player-walk-${dir}`,
      frames: [
        { key: 'player-sheet', frame: base + 1 },
        { key: 'player-sheet', frame: base + 0 },
        { key: 'player-sheet', frame: base + 3 },
        { key: 'player-sheet', frame: base + 0 },
      ],
      frameRate: 8,
      repeat: -1,
    });
  });
}
