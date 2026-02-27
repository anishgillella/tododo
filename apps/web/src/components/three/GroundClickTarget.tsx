import { usePlayerStore } from '../../stores/playerStore';
import type { ThreeEvent } from '@react-three/fiber';

/**
 * Invisible ground plane that handles click/tap-to-move.
 */
export function GroundClickTarget() {
  const setTargetPosition = usePlayerStore((s) => s.setTargetPosition);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const point = e.point;
    setTargetPosition([point.x, 0, point.z]);
  };

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.01, 0]}
      onClick={handleClick}
    >
      <planeGeometry args={[60, 60]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}
