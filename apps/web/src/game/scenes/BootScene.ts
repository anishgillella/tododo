import Phaser from 'phaser';
import { generateTileset } from '../assets/generateTileset';
import { generateBuildings } from '../assets/generateBuildings';
import { generateCharacters } from '../assets/generateCharacters';
import { generateNpcs } from '../assets/generateNpcs';
import { generateCreatures } from '../assets/generateCreatures';
import { generateEffects } from '../assets/generateEffects';
import { generateDecorations } from '../assets/generateDecorations';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create(): void {
    // Generate all procedural textures
    generateTileset(this);
    generateBuildings(this);
    generateCharacters(this);
    generateNpcs(this);
    generateCreatures(this);
    generateEffects(this);
    generateDecorations(this);

    // Start the village
    this.scene.start('Village');
  }
}
