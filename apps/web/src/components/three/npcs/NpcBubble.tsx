import { Html } from '@react-three/drei';

interface NpcBubbleProps {
  name: string;
  text: string;
  visible: boolean;
}

export function NpcBubble({ name, text, visible }: NpcBubbleProps) {
  if (!visible) return null;

  return (
    <Html position={[0, 2.5, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
      <div className="w-48 rounded-lg border border-steel bg-void-light/95 p-2.5 shadow-lg backdrop-blur-sm">
        <div className="mb-1 font-display text-[10px] tracking-wider text-arcane-light uppercase">
          {name}
        </div>
        <p className="text-[11px] leading-relaxed text-ash italic">
          &quot;{text}&quot;
        </p>
      </div>
    </Html>
  );
}
