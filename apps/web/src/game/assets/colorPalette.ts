/** Darken a 0xRRGGBB color by a factor (0-1, where 0.2 = 20% darker) */
export function darken(color: number, amount: number): number {
  const r = Math.max(0, Math.floor(((color >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.floor(((color >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.floor((color & 0xff) * (1 - amount)));
  return (r << 16) | (g << 8) | b;
}

/** Lighten a 0xRRGGBB color by a factor (0-1, where 0.2 = 20% lighter) */
export function lighten(color: number, amount: number): number {
  const r = Math.min(255, Math.floor(((color >> 16) & 0xff) + (255 - ((color >> 16) & 0xff)) * amount));
  const g = Math.min(255, Math.floor(((color >> 8) & 0xff) + (255 - ((color >> 8) & 0xff)) * amount));
  const b = Math.min(255, Math.floor((color & 0xff) + (255 - (color & 0xff)) * amount));
  return (r << 16) | (g << 8) | b;
}

export const COLORS = {
  // Terrain
  grass: 0x7ec850,
  grassDark: 0x5ea030,
  grassLight: 0x96d868,
  grassYellow: 0xa8d848,
  grassClover: 0x4ea840,
  dirt: 0xc4a56a,
  dirtDark: 0x9e844a,
  stone: 0xb0a890,
  stoneDark: 0x8a8270,
  water: 0x5b8dd9,
  waterLight: 0x7badf9,
  waterDark: 0x3b6db9,
  waterDeep: 0x2a5ca8,
  sand: 0xe8d8a0,

  // Grass detail
  flowerRed: 0xe04040,
  flowerYellow: 0xf0d040,
  flowerWhite: 0xf0f0e8,
  flowerPurple: 0x9060c0,
  cloverGreen: 0x40a040,
  tallGrass: 0x68b848,

  // Path / cobblestone
  cobble: 0xb8a888,
  cobbleLight: 0xc8b898,
  cobbleDark: 0x988868,
  mortar: 0x807060,

  // Shore
  shoreSand: 0xd8c890,
  shoreWet: 0x90b8c8,

  // Buildings
  wood: 0x8b6b47,
  woodDark: 0x6b4b27,
  woodLight: 0xab8b67,
  woodPlank1: 0x9b7b57,
  woodPlank2: 0x7b5b37,
  thatch: 0xd4a843,
  thatchDark: 0xb48823,
  thatchLight: 0xe4c063,
  stoneWall: 0xa09880,
  stoneWallDark: 0x807860,
  stoneWallLight: 0xb8b098,
  stoneBrick: 0x908870,
  stoneBrickDark: 0x706850,
  doorWood: 0x5a3a20,
  doorFrame: 0x7a5a40,
  windowGlow: 0xffdd88,
  windowGlowDim: 0xcc9944,
  windowGlass: 0x88bbdd,
  shingleBrown: 0x8b5e3c,
  shingleDark: 0x6b3e1c,
  shingleLight: 0xab7e5c,
  bannerRed: 0xcc3333,
  bannerBlue: 0x3366aa,
  bannerGold: 0xddaa33,
  chimney: 0x666666,
  chimneyDark: 0x444444,

  // Characters
  skin: 0xf0c8a0,
  skinDark: 0xd0a880,
  skinLight: 0xf8d8b8,
  hair: 0x5a3a20,
  hairHighlight: 0x7a5a40,
  hairRed: 0xc04020,
  hairBlonde: 0xe8c060,
  clothBlue: 0x4466aa,
  clothBlueDark: 0x334488,
  clothBlueLight: 0x5588cc,
  clothRed: 0xcc4444,
  clothRedDark: 0xaa2222,
  clothGreen: 0x44aa66,
  clothGreenDark: 0x228844,
  clothGreenLight: 0x66cc88,
  clothPurple: 0x8844aa,
  clothPurpleDark: 0x662288,
  clothWhite: 0xdddddd,
  clothDark: 0x333344,
  boots: 0x5a3a20,
  bootsDark: 0x3a2010,
  belt: 0x6a4a30,
  metal: 0xaabbcc,
  metalDark: 0x667788,
  metalShine: 0xccddee,
  collar: 0xddddcc,

  // Creatures
  wolfGrey: 0x888899,
  wolfDark: 0x555566,
  wolfLight: 0xaaaabb,
  wolfFang: 0xeeeeee,
  spiderBlack: 0x222233,
  spiderRed: 0xcc2222,
  spiderStripe: 0x444455,
  wraithBlue: 0x6688cc,
  wraithGlow: 0x88aaff,
  wraithDark: 0x445588,
  golemBrown: 0x887755,
  golemGrey: 0x999999,
  golemRune: 0xffaa33,
  dragonRed: 0xcc3333,
  dragonGold: 0xddaa33,
  dragonWing: 0xaa2222,
  dragonScale: 0xee9933,
  shadowPurple: 0x442266,
  shadowDark: 0x110022,
  shadowVoid: 0x050010,
  elementalBlue: 0x3388dd,
  elementalWhite: 0xccddff,
  elementalArc: 0xaaccff,

  // Effects
  slashWhite: 0xffffff,
  healGreen: 0x66ff88,
  healSparkle: 0xaaffcc,
  fireOrange: 0xff8833,
  smokeGrey: 0x888888,
  smokeDark: 0x555555,
  damageRed: 0xff3333,
  dustMote: 0xd8d0b8,
  fireflyGold: 0xccdd44,
  fireflyGreen: 0x88cc44,
  torchGlow: 0xffaa44,
  leafGreen: 0x66aa44,
  leafBrown: 0x998844,

  // Night / atmosphere
  nightOverlay: 0x1a2244,
  vignetteBlack: 0x000000,

  // UI
  uiDark: 0x1a1410,
  uiBg: 0x2a2218,
  uiBorder: 0x5c4a38,
  uiText: 0xf0e8d8,
  uiAccent: 0x8b5e3c,
} as const;
