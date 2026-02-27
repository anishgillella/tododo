import { motion } from 'framer-motion';
import { useVillageStore } from '../../stores/villageStore';

const SECTIONS = [
  {
    title: 'The Village',
    content:
      'Welcome to Drifthollow, a fantasy village perched at the edge of a magical rift. Walk around with WASD or click/tap to move. Approach buildings and press E to enter. Each building serves a different purpose in your quest to push back The Hollow.',
  },
  {
    title: 'Buildings',
    content:
      'Guild Hall — Create and manage your quests (tasks). Twilight Hearth — Talk to the village NPCs. Training Yard — Level up your skills. Blacksmith\'s Forge — Craft and equip items. Chronicler\'s Tower — Review your daily recaps. Elder\'s Study — Adjust settings.',
  },
  {
    title: 'Quests & Habits',
    content:
      'Quests are one-time tasks you need to complete. Each has a difficulty from Trivial to Epic, which determines XP and gold rewards. Habits are daily recurring tasks — complete them every day to build streaks. The longer your streak, the bigger the bonus.',
  },
  {
    title: 'Streaks & Combos',
    content:
      'Complete tasks on consecutive days to build your streak. Higher streak tiers (Spark, Flame, Blaze, Inferno, Eternal Fire) grant XP multipliers and visual effects. Complete multiple tasks quickly to build combos for bonus rewards. Miss a day and your streak breaks — unless you have a streak shield.',
  },
  {
    title: 'The Hollow',
    content:
      'Incomplete tasks and broken promises feed The Hollow — a dark force that grows stronger with your debt. As debt increases, the village darkens, rain falls, and The Hollow\'s whispers grow louder. Complete your quests to push it back. Ignore them and face a boss fight.',
  },
  {
    title: 'Characters',
    content:
      'AXIOM — The sarcastic sentinel AI who monitors the village wards. Kael — Your cocky rival who\'s always trying to one-up you. Mira — The warm tavern keeper who offers wisdom and encouragement. The Hollow — The manifestation of neglect itself. Talk to them at the Twilight Hearth or approach them in the village.',
  },
  {
    title: 'Controls',
    content:
      'WASD / Arrow Keys — Move your character. Click/Tap ground — Move to that location. E — Enter building or talk to NPC when nearby. Escape — Close current overlay. Mouse drag — Rotate camera. Scroll — Zoom in/out.',
  },
];

export function HowToPlayModal() {
  const setShowHowToPlay = useVillageStore((s) => s.setShowHowToPlay);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 px-4"
      onClick={() => setShowHowToPlay(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[80vh] overflow-hidden rounded-xl border border-steel bg-void-light"
      >
        {/* Header */}
        <div className="border-b border-steel bg-arcane/10 px-6 py-4">
          <h2 className="font-display text-lg tracking-widest text-arcane-light uppercase">
            How to Play
          </h2>
          <p className="mt-1 font-mono text-[10px] text-steel-light">
            // The Drifter&apos;s Field Guide to Drifthollow
          </p>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[60vh] px-6 py-4 space-y-5">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="font-display text-sm tracking-wider text-parchment uppercase mb-1.5">
                {section.title}
              </h3>
              <p className="text-xs leading-relaxed text-ash">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-steel px-6 py-4">
          <button
            onClick={() => setShowHowToPlay(false)}
            className="w-full rounded-lg border border-arcane bg-arcane/10 px-6 py-2.5 font-mono text-xs uppercase tracking-wider text-arcane-light transition-colors hover:bg-arcane/20"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
