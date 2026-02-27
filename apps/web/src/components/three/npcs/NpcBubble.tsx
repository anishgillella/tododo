import { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useNpcBubbleStore } from '../../../stores/npcBubbleStore';

interface NpcBubbleProps {
  name: string;
  text: string;
  visible: boolean;
  characterKey?: string;
}

export function NpcBubble({ name, text, visible, characterKey }: NpcBubbleProps) {
  const proactiveBubble = useNpcBubbleStore((s) => characterKey ? s.bubbles[characterKey] : null);
  const [showProactive, setShowProactive] = useState(false);

  // Proactive bubble timer — show 8s, hide 30-60s, repeat
  useEffect(() => {
    if (!proactiveBubble || visible) return;

    let timeout: ReturnType<typeof setTimeout>;
    const cycle = () => {
      setShowProactive(true);
      timeout = setTimeout(() => {
        setShowProactive(false);
        timeout = setTimeout(cycle, 30000 + Math.random() * 30000);
      }, 8000);
    };
    timeout = setTimeout(cycle, 5000 + Math.random() * 10000);
    return () => clearTimeout(timeout);
  }, [proactiveBubble, visible]);

  const displayText = visible ? text : (showProactive && proactiveBubble) ? proactiveBubble : null;
  if (!displayText) return null;

  return (
    <Html position={[0, 2.5, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
      <div className="w-48 rounded-lg border border-steel bg-void-light/95 p-2.5 shadow-lg backdrop-blur-sm animate-in fade-in duration-300">
        <div className="mb-1 font-display text-[10px] tracking-wider text-arcane-light uppercase">
          {name}
        </div>
        <p className="text-[11px] leading-relaxed text-ash italic">
          &quot;{displayText}&quot;
        </p>
      </div>
    </Html>
  );
}
