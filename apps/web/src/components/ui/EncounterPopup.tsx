import { useStartCombat } from '../../hooks/useCombat';
import { useVillageStore } from '../../stores/villageStore';

interface EncounterPopupProps {
  creatureId: string;
  creatureName: string;
  creatureShape: string;
  sessionId: string;
  onFight: () => void;
  onFlee: () => void;
}

const SHAPE_ICONS: Record<string, string> = {
  wolf: '/\\__/\\',
  spider: '(o..o)',
  wraith: '~*~',
  golem: '[###]',
  dragon: '>=====>',
  shadow: '{{??}}',
  elemental: '<*>',
};

export function EncounterPopup({
  creatureId,
  creatureName,
  creatureShape,
  sessionId,
  onFight,
  onFlee,
}: EncounterPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-void-lighter border-2 border-red-500/40 rounded-2xl p-8 max-w-sm text-center shadow-2xl">
        <div className="text-6xl mb-4 font-mono text-red-400">
          {SHAPE_ICONS[creatureShape] ?? '(??)'}
        </div>
        <h2 className="text-xl font-bold text-red-300 mb-2">
          A {creatureName} appears!
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          A hostile creature blocks your path. Will you fight or flee?
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onFight}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-all"
          >
            Fight!
          </button>
          <button
            onClick={onFlee}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all"
          >
            Flee
          </button>
        </div>
      </div>
    </div>
  );
}
