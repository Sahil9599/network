import React from 'react';
import {
  Network,
  Sun,
  Moon,
  ShieldCheck,
  Layers,
  Terminal,
  Key,
  Radio,
} from 'lucide-react';
import { ActiveToolTab, UserProfile } from '../types';

interface NavbarProps {
  activeTab: ActiveToolTab;
  setActiveTab: (tab: ActiveToolTab) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  systemStatus: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  user,
  onOpenAuth,
  systemStatus,
}) => {
  const navItems: { id: ActiveToolTab; label: string; icon: React.ReactNode }[] = [
    { id: 'cisco-sim', label: 'Cisco Packet Tracer Lab', icon: <Terminal className="w-4 h-4" /> },
    { id: 'subnet', label: 'Subnet Calc & Classes', icon: <Network className="w-4 h-4" /> },
    { id: 'device-scanner', label: 'Network Device Scanner (IP & MAC)', icon: <Radio className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Dashboard Overview', icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-400 bg-clip-text text-transparent">
                    NetScope
                  </span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    PRO
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
                  Network Engineering & Diagnostic Suite
                </div>
              </div>
            </button>
          </div>

          {/* Right Utility Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Live Telemetry Ping indicator */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Backend Core:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{systemStatus}</span>
            </div>

            {/* Dark Mode Switcher */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle Dark/Light Mode"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* OAuth Session / User Account */}
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50 dark:bg-slate-900 transition-all text-left group"
              title="Manage OAuth 2.0 Session & Security"
            >
              {user ? (
                <>
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-blue-400"
                  />
                  <div className="hidden md:block">
                    <div className="text-xs font-semibold leading-tight text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                      {user.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                      OAuth 2.0
                    </div>
                  </div>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 ml-0.5" />
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <Key className="w-3.5 h-3.5 text-blue-500" />
                  <span>OAuth 2.0</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-100 dark:border-slate-900/60 text-xs font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
