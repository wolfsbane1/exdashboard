import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardFullscreen, setDashboardFullscreen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setDashboardFullscreen(document.fullscreenElement === mainRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleDashboardFullscreen = async () => {
    if (!mainRef.current) return;

    try {
      if (document.fullscreenElement === mainRef.current) {
        await document.exitFullscreen();
        return;
      }

      await mainRef.current.requestFullscreen();
    } catch (error) {
      console.error('Unable to toggle dashboard fullscreen', error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Fixed Left Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Fixed Top Header */}
        <Header />

        {/* Scrollable Content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <div className="sticky top-0 z-30 mb-3 flex justify-end">
            <button
              type="button"
              onClick={toggleDashboardFullscreen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white/95 text-gray-500 shadow-sm backdrop-blur transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              aria-label={dashboardFullscreen ? 'Exit dashboard fullscreen' : 'Maximize dashboard'}
              title={dashboardFullscreen ? 'Exit dashboard fullscreen' : 'Maximize dashboard'}
            >
              {dashboardFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
