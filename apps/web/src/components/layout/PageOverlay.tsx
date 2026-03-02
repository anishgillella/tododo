import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVillageStore, type OverlayRoute } from '../../stores/villageStore';
import { OverlayHeader } from './OverlayHeader';
import { CommandDeck } from '../../pages/CommandDeck';
import { Tavern } from '../../pages/Tavern';
import { TrainingGrounds } from '../../pages/TrainingGrounds';
import { Forge } from '../../pages/Forge';
import { RiftGate } from '../../pages/RiftGate';
import { DailyRecap } from '../../pages/DailyRecap';
import Bestiary from '../../pages/Bestiary';
import Achievements from '../../pages/Achievements';
import { Settings } from '../../pages/Settings';

const PAGE_COMPONENTS: Record<Exclude<OverlayRoute, null>, React.FC> = {
  '/command-deck': CommandDeck,
  '/tavern': Tavern,
  '/training-grounds': TrainingGrounds,
  '/forge': Forge,
  '/rift-gate': RiftGate,
  '/daily-recap': DailyRecap,
  '/bestiary': Bestiary,
  '/achievements': Achievements,
  '/settings': Settings,
};

const BUILDING_COLORS: Record<string, string> = {
  '/command-deck': '#7c3aed',
  '/tavern': '#f59e0b',
  '/training-grounds': '#10b981',
  '/forge': '#f59e0b',
  '/rift-gate': '#ef4444',
  '/daily-recap': '#06b6d4',
  '/bestiary': '#8B5CF6',
  '/achievements': '#F59E0B',
  '/settings': '#3a3a52',
};

export function PageOverlay() {
  const activeOverlay = useVillageStore((s) => s.activeOverlay);
  const closeOverlay = useVillageStore((s) => s.closeOverlay);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeOverlay) {
        closeOverlay();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeOverlay, closeOverlay]);

  const PageComponent = activeOverlay ? PAGE_COMPONENTS[activeOverlay] : null;
  const buildingColor = activeOverlay ? BUILDING_COLORS[activeOverlay] ?? '#7c3aed' : '#7c3aed';

  return (
    <AnimatePresence>
      {activeOverlay && PageComponent && (
        <motion.div
          ref={overlayRef}
          className="page-overlay"
          initial={{ y: '100%', scale: 0.95, opacity: 0.8 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: '100%', scale: 0.95, opacity: 0.8 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        >
          {/* Building-themed top border gradient */}
          <div
            className="h-1 w-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${buildingColor}, transparent)`,
            }}
          />
          <OverlayHeader />
          <div className="flex-1 overflow-y-auto">
            <PageComponent />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
