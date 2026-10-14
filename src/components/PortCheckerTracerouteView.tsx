import React, { useState } from 'react';
import { PortCheckResult, TracerouteHop } from '../types';
import { exportCsvFile } from '../utils/reportExporter';
import {
  Radio,
  Navigation,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Server,
  Layers,
  ArrowRight,
  Shield,
  Activity,
} from 'lucide-react';

export const PortCheckerTracerouteView: React.FC = () => {
  const [subTab, setSubTab] = useState<'ports' | 'traceroute'>('ports');

  // Port Checker States
  const [portHost, setPortHost] = useState('1.1.1.1');
  const [selectedPortPreset, setSelectedPortPreset] = useState<'web' | 'db' | 'mail' | 'remote' | 'custom'>('web');
  const [customPortsInput, setCustomPortsInput] = useState('80, 443, 8080, 8443');
  const [portResults, setPortResults] = useState<PortCheckResult[]>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [portError, setPortError] = useState<string | null>(null);

  // Traceroute States
  const [traceTarget, setTraceTarget] = useState('8.8.8.8');
  const [traceHops, setTraceHops] = useState<TracerouteHop[]>([]);
  const [loadingTrace, setLoadingTrace] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [traceSummary, setTraceSummary] = useState<{ destinationIp: string; averageRttMs: number } | null>(null);

  const getPortsForPreset = () => {
    switch (selectedPortPreset) {
      case 'web':
        return [80, 443, 8080, 8443];
      case 'db':
        return [3306, 5432, 6379, 27017, 1433];
      case 'mail':
        return [25, 465, 587, 993, 995, 110, 143];
      case 'remote':
        return [22, 3389, 21, 53, 23];
      case 'custom':
        return customPortsInput
          .split(',')
          .map((p) => parseInt(p.trim(), 10))
          .filter((p) => !isNaN(p) && p >= 1 && p <= 65535);
      default:
        return [80, 443];
    }
  };

  const executePortScan = async (overrideHost?: string) => {
    const target = overrideHost || portHost;
    if (!target) return;
    setLoadingPorts(true);
    setPortError(null);
    const ports = getPortsForPreset();
    try {
      const res = await fetch('/api/v1/port-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: target, ports }),
      });
      if (!res.ok) throw new Error(`Probe failed with status ${res.status}`);
      const data = await res.json();
      if (data.results) {
        setPortResults(data.results);
      } else {
        throw new Error(data.error || 'No results returned');
      }
    } catch (err: any) {
      setPortError(err.message || 'Port probe connection timed out');
    } finally {
      setLoadingPorts(false);
    }
  };

  const executeTraceroute = async (overrideTarget?: string) => {
    const target = overrideTarget || traceTarget;
    if (!target) return;
    setLoadingTrace(true);
    setTraceError(null);
    try {
      const res = await fetch('/api/v1/traceroute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      if (!res.ok) throw new Error(`Traceroute failed with status ${res.status}`);
      const data = await res.json();
      if (data.hops) {
        setTraceHops(data.hops);
        setTraceSummary({
          destinationIp: data.destinationIp,
          averageRttMs: data.averageRttMs,
        });
      } else {
        throw new Error(data.error || 'Failed to map route hops');
      }
    } catch (err: any) {
      setTraceError(err.message || 'Traceroute packet path timeout');
    } finally {
      setLoadingTrace(false);
    }
  };

  // Auto-run initial diagnostic probes on mount
  React.useEffect(() => {
    executePortScan('1.1.1.1');
    executeTraceroute('8.8.8.8');
  }, []);

  const handleExportPortsCsv = () => {
    const rows = [
      ['Port Number', 'Service Name', 'State', 'Latency (ms)'],
      ...portResults.map((r) => [String(r.port), r.service, r.state.toUpperCase(), String(r.latencyMs)]),
    ];
    exportCsvFile(`Port_Scan_${portHost}`, rows);
  };

  const handleExportTraceCsv = () => {
    const rows = [
      ['Hop #', 'IP Address', 'Hostname', 'Location', 'ASN', 'RTT 1 (ms)', 'RTT 2 (ms)', 'RTT 3 (ms)'],
      ...traceHops.map((h) => [String(h.hop), h.ip, h.hostname, h.location, h.asn, String(h.rtt1), String(h.rtt2), String(h.rtt3)]),
    ];
    exportCsvFile(`Traceroute_${traceTarget}`, rows);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              TCP Port Checker & Traceroute Hop Analysis
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              Transport & Routing
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real TCP socket handshake probing and hop-by-hop packet route latency progression.
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setSubTab('ports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              subTab === 'ports'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>TCP Port Scanner</span>
          </button>
          <button
            onClick={() => setSubTab('traceroute')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              subTab === 'traceroute'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Hop Traceroute</span>
          </button>
        </div>
      </div>

      {subTab === 'ports' ? (
        /* PORT SCANNER SUB-TAB */
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Target Hostname or IP Address
                </label>
                <input
                  type="text"
                  value={portHost}
                  onChange={(e) => setPortHost(e.target.value)}
                  placeholder="e.g. 1.1.1.1, example.com"
                  className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-4 flex items-end">
                <button
                  onClick={() => executePortScan()}
                  disabled={loadingPorts}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {loadingPorts ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Probe TCP Ports</span>
                </button>
              </div>
            </div>

            {/* Presets Segmented Buttons */}
            <div>
              <div className="text-[11px] font-medium text-slate-500 mb-2">Service Port Presets:</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'web', label: 'Web Services (80, 443, 8080, 8443)' },
                  { id: 'db', label: 'Databases (3306, 5432, 6379, 27017)' },
                  { id: 'mail', label: 'Mail Infrastructure (25, 465, 587, 993)' },
                  { id: 'remote', label: 'Remote Access / DevOps (22, 3389, 21, 53)' },
                  { id: 'custom', label: 'Custom Ports...' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPortPreset(preset.id as any)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                      selectedPortPreset === preset.id
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold border border-blue-300 dark:border-blue-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedPortPreset === 'custom' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Custom Comma-Separated Ports
                </label>
                <input
                  type="text"
                  value={customPortsInput}
                  onChange={(e) => setCustomPortsInput(e.target.value)}
                  placeholder="22, 80, 443, 3000, 8080"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}
          </div>

          {/* Port Error Alert */}
          {portError && (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{portError}</span>
              </div>
              <button
                onClick={() => executePortScan()}
                className="px-3 py-1 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded font-medium hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
              >
                Retry Probe
              </button>
            </div>
          )}

          {/* Port Results Table */}
          {portResults.length > 0 && (
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Port Probe Results for {portHost}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {portResults.filter((r) => r.state === 'open').length} Open / {portResults.length} Total Ports Tested
                  </div>
                </div>
                <button
                  onClick={handleExportPortsCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold">
                      <th className="py-2.5 px-3">Port</th>
                      <th className="py-2.5 px-3">Service Name</th>
                      <th className="py-2.5 px-3">State</th>
                      <th className="py-2.5 px-3">Handshake Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {portResults.map((r) => (
                      <tr key={r.port} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                          {r.port}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{r.service}</td>
                        <td className="py-3 px-3">
                          {r.state === 'open' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              OPEN
                            </span>
                          ) : r.state === 'closed' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                              CLOSED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                              FILTERED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {r.latencyMs > 0 ? `${r.latencyMs} ms` : 'Timed out'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TRACEROUTE SUB-TAB */
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Traceroute Target Domain or IP
                </label>
                <input
                  type="text"
                  value={traceTarget}
                  onChange={(e) => setTraceTarget(e.target.value)}
                  placeholder="e.g. 8.8.8.8 or github.com"
                  className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-4 flex items-end">
                <button
                  onClick={() => executeTraceroute()}
                  disabled={loadingTrace}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {loadingTrace ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  <span>Trace Network Route</span>
                </button>
              </div>
            </div>
          </div>

          {/* Traceroute Error Alert */}
          {traceError && (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{traceError}</span>
              </div>
              <button
                onClick={() => executeTraceroute()}
                className="px-3 py-1 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded font-medium hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
              >
                Retry Trace
              </button>
            </div>
          )}

          {traceHops.length > 0 && (
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Route Path to {traceTarget} ({traceSummary?.destinationIp})
                  </h3>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Total Transit Hops: {traceHops.length} · Average RTT: {traceSummary?.averageRttMs} ms
                  </div>
                </div>
                <button
                  onClick={handleExportTraceCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Hop Path Visualizer */}
              <div className="space-y-3 font-mono text-xs">
                {traceHops.map((hop, idx) => (
                  <div
                    key={hop.hop}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                        {hop.hop}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {hop.ip}
                        </div>
                        <div className="text-[11px] text-slate-500 font-sans">
                          {hop.hostname} · {hop.location}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
                        {hop.asn}
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>{hop.rtt1}ms</span>
                        <span className="text-slate-400 text-[10px]">/</span>
                        <span>{hop.rtt2}ms</span>
                        <span className="text-slate-400 text-[10px]">/</span>
                        <span>{hop.rtt3}ms</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
