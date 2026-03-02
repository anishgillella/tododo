import { useVillageStore, type OverlayRoute } from '../../stores/villageStore';

const OVERLAY_TITLES: Record<Exclude<OverlayRoute, null>, string> = {
  '/command-deck': 'Guild Hall',
  '/tavern': 'Twilight Hearth',
  '/training-grounds': 'Training Yard',
  '/forge': "Blacksmith's Forge",
  '/rift-gate': 'Rift Gate',
  '/daily-recap': "Chronicler's Tower",
  '/bestiary': 'Bestiary',
  '/achievements': 'Achievements',
  '/settings': "Elder's Study",
};

export function OverlayHeader() {
  const activeOverlay = useVillageStore((s) => s.activeOverlay);
  const closeOverlay = useVillageStore((s) => s.closeOverlay);

  if (!activeOverlay) return null;

  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-steel bg-void-light/95 px-4 py-3 backdrop-blur-md">
      <button
        onClick={closeOverlay}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-steel text-ash transition-colors hover:border-arcane/50 hover:text-parchment"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="font-display text-sm tracking-wider text-parchment uppercase">
        {OVERLAY_TITLES[activeOverlay]}
      </span>
    </div>
  );
}
