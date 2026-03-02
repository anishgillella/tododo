import { useEffect, useState } from 'react';

interface AchievementData {
  achievementId: string;
  name: string;
  tier: string;
  rewards: { xp: number; gold: number; title?: string };
}

interface AchievementPopupProps {
  achievement: AchievementData;
  onDismiss: () => void;
}

const TIER_COLORS: Record<string, string> = {
  bronze: 'border-amber-700 bg-amber-900/30 text-amber-300',
  silver: 'border-gray-400 bg-gray-800/30 text-gray-200',
  gold: 'border-yellow-500 bg-yellow-900/30 text-yellow-300',
  platinum: 'border-purple-400 bg-purple-900/30 text-purple-200',
};

const TIER_BADGES: Record<string, string> = {
  bronze: 'bg-amber-700',
  silver: 'bg-gray-400',
  gold: 'bg-yellow-500',
  platinum: 'bg-purple-400',
};

export function AchievementPopup({ achievement, onDismiss }: AchievementPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in
    requestAnimationFrame(() => setVisible(true));

    // Auto-dismiss after 4s
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const tierClass = TIER_COLORS[achievement.tier] ?? TIER_COLORS.bronze;
  const badgeClass = TIER_BADGES[achievement.tier] ?? TIER_BADGES.bronze;

  return (
    <div
      className={`fixed top-4 right-4 z-[60] transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`rounded-xl border-2 p-4 backdrop-blur-md shadow-lg max-w-xs ${tierClass}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${badgeClass}`}>
            <span className="text-white text-xs font-bold">
              {achievement.tier[0].toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-70">
              Achievement Unlocked
            </div>
            <div className="font-bold">{achievement.name}</div>
          </div>
        </div>
        <div className="mt-2 flex gap-3 text-xs">
          <span>+{achievement.rewards.xp} XP</span>
          <span>+{achievement.rewards.gold} Gold</span>
          {achievement.rewards.title && (
            <span className="italic">Title: {achievement.rewards.title}</span>
          )}
        </div>
      </div>
    </div>
  );
}
