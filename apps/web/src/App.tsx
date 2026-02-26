import { Routes, Route, Navigate } from 'react-router-dom';
import { CommandDeck } from './pages/CommandDeck';
import { Tavern } from './pages/Tavern';
import { TrainingGrounds } from './pages/TrainingGrounds';
import { Forge } from './pages/Forge';
import { RiftGate } from './pages/RiftGate';
import { DailyRecap } from './pages/DailyRecap';
import { Settings } from './pages/Settings';
import { Onboarding } from './pages/Onboarding';
import { Layout } from './components/Layout';
import { WorldLayout } from './components/layout/WorldLayout';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { useAgent } from './hooks/useAgent';

/**
 * Redirect wrapper: sends fresh agents (level 1, 0 xp, 0 gold) to onboarding.
 * Non-fresh agents go to the 3D world.
 */
function HomeRedirect() {
  const { data: agent, isLoading } = useAgent();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Fresh state — user has never interacted
  if (agent && agent.level === 1 && agent.xp === 0 && agent.gold === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to="/world" replace />;
}

export function App() {
  return (
    <Routes>
      {/* Onboarding — outside the Layout shell */}
      <Route path="/onboarding" element={<Onboarding />} />

      {/* 3D Village World */}
      <Route path="/world" element={<WorldLayout />} />

      {/* Main app routes inside Layout (2D fallback) */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/command-deck" element={<CommandDeck />} />
        <Route path="/tavern" element={<Tavern />} />
        <Route path="/training-grounds" element={<TrainingGrounds />} />
        <Route path="/forge" element={<Forge />} />
        <Route path="/rift-gate" element={<RiftGate />} />
        <Route path="/daily-recap" element={<DailyRecap />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
