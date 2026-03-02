import Phaser from 'phaser';

/**
 * Creates an elliptical shadow blob beneath an entity.
 * Returns the shadow ellipse so it can be added to a container or scene.
 */
export function createShadow(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.Ellipse {
  const shadow = scene.add.ellipse(x, y, width, height, 0x000000, 0.25);
  shadow.setDepth(-1); // Below the entity when used standalone; depth is usually overridden
  return shadow;
}
