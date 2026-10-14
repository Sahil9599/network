/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveToolTab, UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { SubnetCalculatorView } from './components/SubnetCalculatorView';
import { CiscoSimulatorView } from './components/CiscoSimulatorView';
import { OAuthModal } from './components/OAuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveToolTab>('cisco-sim');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<string>('Online (24ms)');

  // Sync dark mode class with HTML document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load initial session and health check
  useEffect(() => {
    const initApp = async () => {
      try {
        const [sessionRes, healthRes] = await Promise.all([
          fetch('/api/v1/auth/session'),
          fetch('/api/v1/health'),
        ]);

        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.session) {
            setUser(sessionData.session);
          }
        }

        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setSystemStatus(`${healthData.status === 'operational' ? 'Online' : 'Degraded'}`);
        }
      } catch (err) {
        console.warn('Backend init check:', err);
      }
    };

    initApp();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans selection:bg-blue-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        systemStatus={systemStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ErrorBoundary fallbackTitle="View Recovery">
          {activeTab === 'cisco-sim' && <CiscoSimulatorView />}

          {activeTab === 'subnet' && <SubnetCalculatorView />}

          {activeTab === 'dashboard' && (
            <DashboardOverview
              setActiveTab={setActiveTab}
              user={user}
              systemStatus={systemStatus}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Engineering Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-slate-900 dark:text-white font-mono">
              NetScope PRO
            </span>
            <span>·</span>
            <span>Cisco Packet Tracer IOS Lab</span>
            <span>·</span>
            <span>RFC 1878 Subnetting & Classes</span>
            <span>·</span>
            <span>RFC 6749 OAuth 2.0</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>TLS 1.3 End-to-End</span>
            </span>
            <span>·</span>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Session Config
            </button>
          </div>
        </div>
      </footer>

      {/* OAuth 2.0 Management Modal */}
      <OAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        onUpdateSession={(newProfile) => {
          setUser(newProfile);
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}
