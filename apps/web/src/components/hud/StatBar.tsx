import { motion } from 'framer-motion';

interface StatBarProps {
  value: number;
  max: number;
  color: 'arcane' | 'rift' | 'drift' | 'ember' | 'verdant';
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const colorMap: Record<StatBarProps['color'], string> = {
  arcane: 'bg-arcane',
  rift: 'bg-rift',
  drift: 'bg-drift',
  ember: 'bg-ember',
  verdant: 'bg-verdant',
};

const glowMap: Record<StatBarProps['color'], string> = {
  arcane: 'shadow-[0_0_8px_rgba(124,58,237,0.5)]',
  rift: 'shadow-[0_0_8px_rgba(239,68,68,0.5)]',
  drift: 'shadow-[0_0_8px_rgba(6,182,212,0.5)]',
  ember: 'shadow-[0_0_8px_rgba(245,158,11,0.5)]',
  verdant: 'shadow-[0_0_8px_rgba(16,185,129,0.5)]',
};

const sizeMap: Record<NonNullable<StatBarProps['size']>, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
};

export function StatBar({
  value,
  max,
  color,
  label,
  showValue = true,
  size = 'md',
}: StatBarProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const isHighValue = percent > 80;

  return (
    <div className="flex w-full flex-col gap-0.5">
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-ash">
              {label}
            </span>
          )}
          {showValue && (
            <span className="font-mono text-[10px] text-ash">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-steel ${sizeMap[size]}`}
      >
        <motion.div
          className={`h-full rounded-full ${colorMap[color]} ${
            isHighValue ? glowMap[color] : ''
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
