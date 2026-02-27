import { Howl, Howler } from 'howler';
import { useAudioStore } from '../stores/audioStore';

type SfxName =
  | 'task-complete'
  | 'level-up'
  | 'gold-clink'
  | 'button-click'
  | 'combat-slash'
  | 'boss-growl';

type AmbientName =
  | 'ambient-village'
  | 'tavern-music'
  | 'forge-hammer'
  | 'rift-hum'
  | 'rain-loop';

const BASE_PATH = '/audio/';

// ── Lazy-loaded sound cache ──────────────────────────────────────────

const sfxCache = new Map<string, Howl>();
const ambientCache = new Map<string, Howl>();

function getSfx(name: SfxName): Howl {
  if (!sfxCache.has(name)) {
    sfxCache.set(
      name,
      new Howl({
        src: [`${BASE_PATH}${name}.mp3`],
        volume: 0.8,
        preload: false,
      }),
    );
  }
  return sfxCache.get(name)!;
}

function getAmbient(name: AmbientName): Howl {
  if (!ambientCache.has(name)) {
    ambientCache.set(
      name,
      new Howl({
        src: [`${BASE_PATH}${name}.mp3`],
        loop: true,
        volume: 0.3,
        preload: false,
      }),
    );
  }
  return ambientCache.get(name)!;
}

// ── Building → sound mapping ─────────────────────────────────────────

const BUILDING_SOUNDS: Record<string, AmbientName> = {
  '/tavern': 'tavern-music',
  '/forge': 'forge-hammer',
  '/rift-gate': 'rift-hum',
};

// ── Public API ───────────────────────────────────────────────────────

let currentAmbient: Howl | null = null;
let currentBuildingSound: Howl | null = null;

function getEffectiveVolume(type: 'music' | 'sfx'): number {
  const state = useAudioStore.getState();
  if (state.isMuted) return 0;
  const base = state.masterVolume;
  return base * (type === 'music' ? state.musicVolume : state.sfxVolume);
}

export const audioManager = {
  /** Start village ambient loop */
  playAmbient() {
    if (currentAmbient) return;
    currentAmbient = getAmbient('ambient-village');
    currentAmbient.volume(getEffectiveVolume('music'));
    currentAmbient.play();
  },

  /** Stop village ambient */
  stopAmbient() {
    if (currentAmbient) {
      currentAmbient.fade(currentAmbient.volume(), 0, 500);
      setTimeout(() => {
        currentAmbient?.stop();
        currentAmbient = null;
      }, 500);
    }
  },

  /** Play a building-specific sound loop */
  playBuildingSound(route: string) {
    const soundName = BUILDING_SOUNDS[route];
    if (!soundName) return;

    if (currentBuildingSound) {
      currentBuildingSound.fade(currentBuildingSound.volume(), 0, 300);
      setTimeout(() => currentBuildingSound?.stop(), 300);
    }

    currentBuildingSound = getAmbient(soundName);
    currentBuildingSound.volume(0);
    currentBuildingSound.play();
    currentBuildingSound.fade(0, getEffectiveVolume('music') * 0.5, 500);
  },

  /** Stop building sound */
  stopBuildingSound() {
    if (currentBuildingSound) {
      currentBuildingSound.fade(currentBuildingSound.volume(), 0, 500);
      setTimeout(() => {
        currentBuildingSound?.stop();
        currentBuildingSound = null;
      }, 500);
    }
  },

  /** Play a one-shot SFX */
  playSfx(name: SfxName) {
    const sound = getSfx(name);
    sound.volume(getEffectiveVolume('sfx'));
    sound.play();
  },

  /** Update all playing sounds' volumes */
  updateVolumes() {
    const musicVol = getEffectiveVolume('music');
    if (currentAmbient) currentAmbient.volume(musicVol);
    if (currentBuildingSound) currentBuildingSound.volume(musicVol * 0.5);
  },

  /** Mute/unmute all */
  setMuted(muted: boolean) {
    Howler.mute(muted);
  },
};
