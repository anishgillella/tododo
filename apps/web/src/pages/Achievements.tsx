import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ACHIEVEMENTS, type AchievementCategory } from '@tododo/shared';
import { useState } from 'react';

interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: string;
}

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  productivity: 'Productivity',
  streaks: 'Streaks',
  combat: 'Combat',
  mastery: 'Mastery',
};

const TIER_COLORS: Record<string, string> = {
  bronze: 'border-amber-700/50 bg-amber-900/10',
  silver: 'border-gray-400/50 bg-gray-800/10',
  gold: 'border-yellow-500/50 bg-yellow-900/10',
  platinum: 'border-purple-400/50 bg-purple-900/10',
};

const TIER_GLOW: Record<string, string> = {
  bronze: '',
  silver: '',
  gold: 'shadow-yellow-500/20 shadow-lg',
  platinum: 'shadow-purple-500/30 shadow-lg',
};

const TIER_BADGE_COLORS: Record<string, string> = {
  bronze: 'bg-amber-700 text-white',
  silver: 'bg-gray-400 text-gray-900',
  gold: 'bg-yellow-500 text-yellow-900',
  platinum: 'bg-purple-400 text-purple-900',
};

export default function Achievements() {
  const [activeTab, setActiveTab] = useState<AchievementCategory>('productivity');

  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => api.get<{ achievements: UnlockedAchievement[] }>('/api/game/achievements'),
  });

  const unlockedIds = new Set((data?.achievements ?? []).map((a) => a.achievementId));
  const filtered = ACHIEVEMENTS.filter((a) => a.category === activeTab);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-parchment mb-4">Achievements</h1>

      <div className="text-sm text-gray-400 mb-4">
        {unlockedIds.size} / {ACHIEVEMENTS.length} unlocked
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6">
        {(Object.keys(CATEGORY_LABELS) as AchievementCategory[]).map((cat) => {
          const count = ACHIEVEMENTS.filter((a) => a.category === cat).length;
          const unlockedCount = ACHIEVEMENTS.filter(
            (a) => a.category === cat && unlockedIds.has(a.id),
          ).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {CATEGORY_LABELS[cat]} ({unlockedCount}/{count})
            </button>
          );
        })}
      </div>

      {isLoading && <div className="text-gray-400 text-sm">Loading...</div>}

      <div className="space-y-3">
        {filtered.map((achievement) => {
          const unlocked = unlockedIds.has(achievement.id);
          const tierColor = TIER_COLORS[achievement.tier] ?? '';
          const tierGlow = unlocked ? (TIER_GLOW[achievement.tier] ?? '') : '';
          const badgeColor = TIER_BADGE_COLORS[achievement.tier] ?? TIER_BADGE_COLORS.bronze;

          return (
            <div
              key={achievement.id}
              className={`rounded-xl border p-4 flex items-center gap-4 transition-all ${tierColor} ${tierGlow} ${
                !unlocked ? 'opacity-40' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                  unlocked ? badgeColor : 'bg-gray-700 text-gray-500'
                }`}
              >
                {unlocked ? achievement.tier[0].toUpperCase() : '?'}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-parchment">{achievement.name}</div>
                <div className="text-xs text-gray-400">{achievement.description}</div>
              </div>
              <div className="text-right text-xs">
                <div className="text-yellow-300">+{achievement.rewards.xp} XP</div>
                <div className="text-yellow-300">+{achievement.rewards.gold} Gold</div>
                {achievement.rewards.title && (
                  <div className="text-purple-300 italic">{achievement.rewards.title}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
