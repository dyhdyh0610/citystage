import { useApp } from './context/AppContext';
import PhoneShell from './components/PhoneShell';
import Guidance from './components/Guidance';
import BEndConfig from './components/b-end/BEndConfig';
import TaskOrchestration from './components/b-end/TaskOrchestration';
import PublishConfirm from './components/b-end/PublishConfirm';
import CEndApp from './components/c-end/CEndApp';

function renderContent(phase: string) {
  switch (phase) {
    case 'b-config':
      return <BEndConfig />;
    case 'b-orchestrate':
      return <TaskOrchestration />;
    case 'b-publishing':
      return <PublishConfirm />;
    case 'c-app':
      return <CEndApp />;
    default:
      return <CEndApp />;
  }
}

export default function App() {
  const { state } = useApp();

  return (
    <div className="h-screen relative overflow-hidden flex flex-col bg-main">
      {/* Header — compact, no AI settings button. The AI is a
          server-side concern and is intentionally not exposed to
          end users. */}
      <header className="relative z-20 flex justify-between items-center px-6 py-1.5 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center gradient-primary"
          >
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div>
            <h1 className="font-bold text-ink-primary text-sm leading-none">CityStage</h1>
            <p className="text-[9px] text-ink-secondary mt-0.5 font-medium tracking-wide">城市共创剧场</p>
          </div>
        </div>
      </header>

      {/* Main content. renderContent picks the right page
          for the current phase — c-splash shows the splash,
          c-app shows the mall, b-* shows the B-end tool. */}
      <main className="relative z-10 flex-1 flex items-center justify-center min-h-0 py-1">
        <PhoneShell overlay={<Guidance />}>
          {renderContent(state.phase)}
        </PhoneShell>
      </main>
    </div>
  );
}
