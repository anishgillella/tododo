import { Html } from '@react-three/drei';

interface FloatingLabelProps {
  text: string;
  visible: boolean;
  position?: [number, number, number];
}

export function FloatingLabel({ text, visible, position = [0, 0, 0] }: FloatingLabelProps) {
  if (!visible) return null;

  return (
    <Html position={position} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
      <div className="rounded-lg border border-steel bg-void-light/95 px-3 py-1.5 backdrop-blur-sm">
        <span className="font-display text-xs tracking-wider text-parchment whitespace-nowrap">
          {text}
        </span>
      </div>
    </Html>
  );
}
