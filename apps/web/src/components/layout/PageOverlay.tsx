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
import { Settings } from '../../pages/Settings';

const PAGE_COMPONENTS: Record<Exclude<OverlayRoute, null>, React.FC> = {
  '/command-deck': CommandDeck,
  '/tavern': Tavern,
  '/training-grounds': TrainingGrounds,
  '/forge': Forge,
  '/rift-gate': RiftGate,
  '/daily-recap': DailyRecap,
  '/settings': Settings,
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

  return (
    <AnimatePresence>
      {activeOverlay && PageComponent && (
        <motion.div
          ref={overlayRef}
          className="page-overlay"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          <OverlayHeader />
          <div className="flex-1 overflow-y-auto">
            <PageComponent />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
