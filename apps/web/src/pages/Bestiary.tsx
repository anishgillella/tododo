import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { CREATURES } from '@tododo/shared';

interface BestiaryEntry {
  creatureId: string;
  timesDefeated: number;
  timesLost: number;
  firstEncountered: string;
  lastEncountered: string;
}

export default function Bestiary() {
  const { data, isLoading } = useQuery({
    queryKey: ['bestiary'],
    queryFn: () => api.get<{ bestiary: BestiaryEntry[] }>('/api/game/bestiary'),
  });

  const entries = data?.bestiary ?? [];
  const entryMap = new Map(entries.map((e) => [e.creatureId, e]));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-parchment mb-6">Bestiary</h1>

      {isLoading && (
        <div className="text-gray-400 text-sm">Loading...</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {CREATURES.map((creature) => {
          const entry = entryMap.get(creature.id);
          const discovered = !!entry;

          return (
            <div
              key={creature.id}
              className={`rounded-xl border p-4 transition-all ${
                discovered
                  ? 'border-purple-500/40 bg-purple-900/20'
                  : 'border-gray-700/30 bg-gray-900/20 opacity-50'
              }`}
            >
              <div className="text-center mb-2">
                <div className="text-3xl">
                  {discovered ? getCreatureEmoji(creature.shape) : '???'}
                </div>
              </div>
              <div className="text-center">
                <div className={`font-bold text-sm ${discovered ? 'text-parchment' : 'text-gray-600'}`}>
                  {discovered ? creature.name : '???'}
                </div>
                {discovered && (
                  <>
                    <div className="text-xs text-gray-400 mt-1">
                      {creature.description}
                    </div>
                    <div className="flex justify-center gap-4 mt-2 text-xs">
                      <span className="text-green-400">W: {entry!.timesDefeated}</span>
                      <span className="text-red-400">L: {entry!.timesLost}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Lv {creature.minLevel}-{creature.maxLevel}
                    </div>
                  </>
                )}
              </div>
              {creature.isRare && discovered && (
                <div className="mt-2 text-center">
                  <span className="text-[10px] bg-yellow-600/30 text-yellow-300 px-2 py-0.5 rounded-full">
                    RARE
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getCreatureEmoji(shape: string): string {
  switch (shape) {
    case 'wolf': return '\uD83D\uDC3A';
    case 'spider': return '\uD83D\uDD77\uFE0F';
    case 'wraith': return '\uD83D\uDC7B';
    case 'golem': return '\uD83E\uDDBE';
    case 'dragon': return '\uD83D\uDC09';
    case 'shadow': return '\uD83C\uDF11';
    case 'elemental': return '\uD83D\uDD25';
    default: return '\u2753';
  }
}
