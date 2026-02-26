import { Html } from '@react-three/drei';
import { useAgent } from '../../../hooks/useAgent';

export function ComboCounter3D() {
  const { data: agent } = useAgent();
  const combo = agent?.comboCount ?? 0;

  if (combo < 2) return null;

  const color =
    combo >= 10 ? '#fbbf24' :
    combo >= 5 ? '#f97316' :
    '#a78bfa';

  return (
    <Html position={[1.5, 3.5, 3]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
      <div className="flex flex-col items-center animate-fade-in">
        <span
          className="font-display text-2xl font-bold tracking-wider"
          style={{ color, textShadow: `0 0 10px ${color}` }}
        >
          x{combo}
        </span>
        <span className="font-display text-[9px] tracking-widest text-parchment/80 uppercase">
          combo
        </span>
      </div>
    </Html>
  );
}
