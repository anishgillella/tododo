import { motion } from 'framer-motion';

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-void">
      {/* Logo / App name */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <h1 className="font-display text-4xl font-bold tracking-[0.3em] text-arcane-light uppercase">
          Tododo
        </h1>
        <p className="mt-2 font-mono text-xs tracking-wider text-ash">
          The Adventurer&apos;s Chronicle
        </p>
      </motion.div>

      {/* Animated loading pulse */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mt-10 flex items-center gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-arcane"
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>

      {/* System tag */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-8 font-mono text-[10px] text-steel-light"
      >
        [AWAKENING DRIFTHOLLOW...]
      </motion.p>
    </div>
  );
}
