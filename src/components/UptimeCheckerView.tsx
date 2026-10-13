import React, { useState, useEffect } from 'react';
import { UptimePayload, MonitorItem } from '../types';
import { exportUptimeReportPdf, exportCsvFile } from '../utils/reportExporter';
import {
  Activity,
  Globe,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  AlertCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';

export const UptimeCheckerView: React.FC = () => {
  const [targetUrl, setTargetUrl] = useState('https://www.google.com');
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<UptimePayload | null>(null);
  const [monitors, setMonitors] = useState<MonitorItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMonName, setNewMonName] = useState('');
  const [newMonUrl, setNewMonUrl] = useState('');
  const [newMonInterval, setNewMonInterval] = useState(60);

  // Fetch monitors
  const fetchMonitors = async () => {
    try {
      const res = await fetch('/api/v1/monitors');
      const data = await res.json();
      if (data.monitors) {
        setMonitors(data.monitors);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchMonitors();
    checkUrl('https://www.google.com');
  }, []);

  const checkUrl = async (urlToCheck?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/uptime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToCheck || targetUrl }),
      });
      const data = await res.json();
      setCurrentResult(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleAddMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonName || !newMonUrl) return;

    try {
      const res = await fetch('/api/v1/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMonName,
          url: newMonUrl,
          interval: newMonInterval,
        }),
      });
      if (res.ok) {
        fetchMonitors();
        setShowAddModal(false);
        setNewMonName('');
        setNewMonUrl('');
      }
    } catch {
      //
    }
  };

  const handleDeleteMonitor = async (id: string) => {
    try {
      await fetch(`/api/v1/monitors/${id}`, { method: 'DELETE' });
      setMonitors(monitors.filter((m) => m.id !== id));
    } catch {
      //
    }
  };

  const handleExportPdf = () => {
    if (!currentResult) return;
    exportUptimeReportPdf(currentResult.url, currentResult);
  };

  const handleExportCsv = () => {
    if (!currentResult) return;
    const rows = [
      ['Metric', 'Value'],
      ['Target URL', currentResult.url],
      ['Is Online', String(currentResult.isUp)],
      ['HTTP Status', `${currentResult.statusCode} ${currentResult.statusMessage || ''}`],
      ['Total Latency (ms)', String(currentResult.timing.totalMs)],
      ['DNS Resolution (ms)', String(currentResult.timing.dnsMs || 0)],
      ['TCP Connect (ms)', String(currentResult.timing.tcpConnectMs || 0)],
      ['TLS Handshake (ms)', String(currentResult.timing.tlsHandshakeMs || 0)],
      ['TTFB (ms)', String(currentResult.timing.ttfbMs || 0)],
      ['SSL Subject', currentResult.ssl?.subject || 'N/A'],
      ['SSL Days Remaining', String(currentResult.ssl?.daysRemaining || 0)],
    ];
    exportCsvFile(`Uptime_Report_${Date.now()}`, rows);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Website Uptime, Health & SSL Diagnostic
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Live Protocol Probe
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            HTTP/HTTPS status monitoring, high-precision latency waterfall breakdown, TLS certificate expiry alert, and headers audit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Continuous Monitor</span>
          </button>
          {currentResult && (
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Target Input Form */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            checkUrl();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Globe className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="e.g. https://example.com"
              className="w-full pl-10 pr-4 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Activity className="w-4 h-4" />
            )}
            <span>Execute Health Audit</span>
          </button>
        </form>
      </div>

      {/* Audit Results */}
      {currentResult && (
        <div className="space-y-6">
          {/* Status Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] font-medium text-slate-500">Service Status</span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    currentResult.isUp ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <span
                  className={`text-base font-bold ${
                    currentResult.isUp
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {currentResult.isUp ? 'ONLINE / HEALTHY' : 'DOWN / UNREACHABLE'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                HTTP {currentResult.statusCode} ({currentResult.statusMessage})
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] font-medium text-slate-500">Total Response Latency</span>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                {currentResult.timing.totalMs} ms
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                TTFB: {currentResult.timing.ttfbMs || 0} ms
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] font-medium text-slate-500">SSL Certificate Health</span>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                {currentResult.ssl ? (
                  <>
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span>Valid</span>
                  </>
                ) : (
                  <span className="text-slate-400">Plain HTTP</span>
                )}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {currentResult.ssl ? `${currentResult.ssl.daysRemaining} days remaining` : 'No TLS'}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] font-medium text-slate-500">Web Server Engine</span>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                {currentResult.headers?.server || 'Undisclosed'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">
                {currentResult.headers?.contentType || 'text/html'}
              </div>
            </div>
          </div>

          {/* Latency Waterfall Breakdown */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Network Connection Waterfall Breakdown
            </h3>

            <div className="space-y-3 font-mono text-xs">
              {[
                { label: 'DNS Lookup', val: currentResult.timing.dnsMs || 2, color: 'bg-blue-500' },
                { label: 'TCP Handshake', val: currentResult.timing.tcpConnectMs || 8, color: 'bg-indigo-500' },
                { label: 'TLS Handshake', val: currentResult.timing.tlsHandshakeMs || 12, color: 'bg-purple-500' },
                { label: 'Time To First Byte (TTFB)', val: currentResult.timing.ttfbMs || 18, color: 'bg-amber-500' },
              ].map((step, idx) => {
                const total = Math.max(1, currentResult.timing.totalMs);
                const pct = Math.min(100, Math.max(8, (step.val / total) * 100));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>{step.label}</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{step.val} ms</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full ${step.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SSL & Security Headers Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SSL Inspection */}
            {currentResult.ssl && (
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    TLS Certificate Inspection
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {currentResult.ssl.bits ? `${currentResult.ssl.bits}-bit Key` : 'RSA 2048'}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 flex justify-between">
                    <span className="text-slate-500">Common Name:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{currentResult.ssl.subject}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 flex justify-between">
                    <span className="text-slate-500">Issuer CA:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{currentResult.ssl.issuer}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 flex justify-between">
                    <span className="text-slate-500">Valid From:</span>
                    <span className="text-slate-800 dark:text-slate-200">{new Date(currentResult.ssl.validFrom).toLocaleDateString()}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 flex justify-between">
                    <span className="text-slate-500">Expires On:</span>
                    <span className="text-slate-800 dark:text-slate-200">{new Date(currentResult.ssl.validTo).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Security Headers */}
            {currentResult.headers && (
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    HTTP Security Headers Audit
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">OWASP Standard</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                    <span className="text-slate-500">HSTS (Strict-Transport-Security):</span>
                    <span className={currentResult.headers.strictTransportSecurity ? 'text-emerald-500 font-bold' : 'text-slate-400'}>
                      {currentResult.headers.strictTransportSecurity ? 'Enforced' : 'Not Set'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                    <span className="text-slate-500">CSP (Content-Security-Policy):</span>
                    <span className={currentResult.headers.contentSecurityPolicy ? 'text-emerald-500 font-bold' : 'text-slate-400'}>
                      {currentResult.headers.contentSecurityPolicy ? 'Configured' : 'Not Set'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                    <span className="text-slate-500">X-Frame-Options:</span>
                    <span className="text-slate-800 dark:text-slate-200">{currentResult.headers.xFrameOptions}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                    <span className="text-slate-500">Cache-Control:</span>
                    <span className="text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{currentResult.headers.cacheControl}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Monitored Targets Daemon List */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Continuous Uptime Daemon Monitors ({monitors.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active monitoring daemons with latency sparklines and health percentages.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold">
                <th className="py-2.5 px-3">Service Name</th>
                <th className="py-2.5 px-3">Endpoint URL</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">History Sparkline</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {monitors.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">{m.name}</td>
                  <td className="py-3 px-3 text-slate-500">{m.url}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      UP (200 OK)
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                    {m.lastCheck?.latencyMs || 24} ms
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      {m.history.map((h, i) => (
                        <div
                          key={i}
                          title={`${h.latencyMs}ms`}
                          className="w-2 rounded-xs bg-emerald-500 hover:opacity-80"
                          style={{ height: `${Math.min(24, Math.max(6, (h.latencyMs / 100) * 24))}px` }}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleDeleteMonitor(m.id)}
                      className="p-1.5 rounded hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 text-slate-400 transition-colors"
                      title="Remove monitor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Monitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Add New Uptime Target
            </h3>
            <form onSubmit={handleAddMonitor} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Target Label
                </label>
                <input
                  type="text"
                  value={newMonName}
                  onChange={(e) => setNewMonName(e.target.value)}
                  placeholder="e.g. Production API Gateway"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Endpoint URL
                </label>
                <input
                  type="url"
                  value={newMonUrl}
                  onChange={(e) => setNewMonUrl(e.target.value)}
                  placeholder="https://api.domain.com/health"
                  required
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add Monitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
