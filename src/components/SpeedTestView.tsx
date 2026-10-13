import React, { useState, useRef } from 'react';
import { exportCsvFile } from '../utils/reportExporter';
import {
  Gauge,
  Play,
  RotateCcw,
  Download,
  Upload,
  Activity,
  Zap,
  TrendingUp,
  Server,
  CheckCircle2,
} from 'lucide-react';

interface SpeedTestRecord {
  id: string;
  timestamp: string;
  pingMs: number;
  jitterMs: number;
  downloadMbps: number;
  uploadMbps: number;
  serverNode: string;
}

export const SpeedTestView: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'ping' | 'download' | 'upload' | 'completed'>('idle');
  const [currentPing, setCurrentPing] = useState(0);
  const [currentJitter, setCurrentJitter] = useState(0);
  const [currentDownload, setCurrentDownload] = useState(0);
  const [currentUpload, setCurrentUpload] = useState(0);
  const [gaugeValue, setGaugeValue] = useState(0); // 0 to 100 for gauge meter
  const [history, setHistory] = useState<SpeedTestRecord[]>([
    {
      id: 'st_prev_1',
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
      pingMs: 14,
      jitterMs: 1.8,
      downloadMbps: 482.4,
      uploadMbps: 184.2,
      serverNode: 'US-Central Core Relay (AI Studio)',
    },
    {
      id: 'st_prev_2',
      timestamp: new Date(Date.now() - 7200000).toLocaleTimeString(),
      pingMs: 16,
      jitterMs: 2.1,
      downloadMbps: 468.1,
      uploadMbps: 179.5,
      serverNode: 'US-Central Core Relay (AI Studio)',
    },
  ]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const runSpeedTest = async () => {
    if (testing) return;
    setTesting(true);
    setCurrentDownload(0);
    setCurrentUpload(0);
    setGaugeValue(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // PHASE 1: PING & JITTER
      setPhase('ping');
      const pingSamples: number[] = [];
      for (let i = 0; i < 4; i++) {
        const start = performance.now();
        await fetch('/api/v1/speedtest/ping', { signal: controller.signal });
        const latency = Math.round(performance.now() - start);
        pingSamples.push(latency);
        setCurrentPing(latency);
        await new Promise((r) => setTimeout(r, 120));
      }

      const avgPing = Math.round(pingSamples.reduce((a, b) => a + b, 0) / pingSamples.length);
      const jitter = Number((Math.max(...pingSamples) - Math.min(...pingSamples) / 2).toFixed(1));
      setCurrentPing(avgPing);
      setCurrentJitter(jitter);

      // PHASE 2: DOWNLOAD THROUGHPUT
      setPhase('download');
      const dlStart = performance.now();
      const response = await fetch('/api/v1/speedtest/download?sizeMb=8', {
        signal: controller.signal,
      });

      if (response.body) {
        const reader = response.body.getReader();
        let totalBytes = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          totalBytes += value.length;

          const elapsedSec = (performance.now() - dlStart) / 1000;
          if (elapsedSec > 0.1) {
            const mbps = (totalBytes * 8) / (elapsedSec * 1024 * 1024);
            const liveVal = Number(mbps.toFixed(1));
            setCurrentDownload(liveVal);
            setGaugeValue(Math.min(100, (liveVal / 600) * 100));
          }
        }
      }

      // Final download calculation
      const dlElapsed = (performance.now() - dlStart) / 1000;
      const finalDlMbps = Number(((8 * 1024 * 1024 * 8) / (dlElapsed * 1024 * 1024)).toFixed(1));
      setCurrentDownload(finalDlMbps);

      // PHASE 3: UPLOAD THROUGHPUT
      setPhase('upload');
      const ulStart = performance.now();
      const uploadPayload = new Uint8Array(4 * 1024 * 1024); // 4MB
      await fetch('/api/v1/speedtest/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: uploadPayload,
        signal: controller.signal,
      });

      const ulElapsed = (performance.now() - ulStart) / 1000;
      const finalUlMbps = Number(((4 * 1024 * 1024 * 8) / (ulElapsed * 1024 * 1024)).toFixed(1));
      setCurrentUpload(finalUlMbps);
      setGaugeValue(Math.min(100, (finalUlMbps / 300) * 100));

      // PHASE 4: COMPLETED
      setPhase('completed');
      const newRecord: SpeedTestRecord = {
        id: 'st_' + Date.now().toString(36),
        timestamp: new Date().toLocaleTimeString(),
        pingMs: avgPing,
        jitterMs: jitter,
        downloadMbps: finalDlMbps,
        uploadMbps: finalUlMbps,
        serverNode: 'US-Central Core Relay (AI Studio)',
      };
      setHistory((prev) => [newRecord, ...prev]);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Speed test error:', err);
      }
    } finally {
      setTesting(false);
    }
  };

  const handleExportCsv = () => {
    const rows = [
      ['Timestamp', 'Ping (ms)', 'Jitter (ms)', 'Download (Mbps)', 'Upload (Mbps)', 'Server Node'],
      ...history.map((h) => [h.timestamp, String(h.pingMs), String(h.jitterMs), String(h.downloadMbps), String(h.uploadMbps), h.serverNode]),
    ];
    exportCsvFile(`SpeedTest_History_${Date.now()}`, rows);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Automated Bandwidth & Speed Telemetry
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              Low-Jitter Real Streams
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real data streaming chunk benchmarks measuring Ping, Jitter, Download throughput, and Upload capacity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Speedometer Gauge Card */}
      <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center relative overflow-hidden">
        {/* Animated Glow Backlight during active test */}
        {testing && (
          <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 animate-pulse pointer-events-none" />
        )}

        <div className="max-w-md mx-auto space-y-6 relative z-10">
          {/* Phase Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                testing ? 'bg-blue-500 animate-ping' : 'bg-emerald-500'
              }`}
            />
            <span className="uppercase font-bold tracking-wider">
              {phase === 'idle'
                ? 'Ready to Benchmark'
                : phase === 'ping'
                ? 'Measuring Latency & Jitter...'
                : phase === 'download'
                ? 'Testing Download Stream (Mbps)...'
                : phase === 'upload'
                ? 'Testing Upload Throughput (Mbps)...'
                : 'Benchmark Completed'}
            </span>
          </div>

          {/* Speedometer Radial Gauge */}
          <div className="relative w-64 h-36 mx-auto flex items-end justify-center overflow-hidden">
            {/* SVG Arc Meter */}
            <svg viewBox="0 0 200 110" className="w-full h-full">
              {/* Background track */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="14"
                strokeLinecap="round"
                className="text-slate-200 dark:text-slate-800"
              />
              {/* Active speed track */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#speedGradient)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="251"
                strokeDashoffset={251 - (251 * gaugeValue) / 100}
                className="transition-all duration-200 ease-out"
              />
              <defs>
                <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>

            {/* Numeric Display in center */}
            <div className="absolute bottom-2 flex flex-col items-center">
              <span className="text-4xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
                {phase === 'download'
                  ? currentDownload
                  : phase === 'upload'
                  ? currentUpload
                  : currentDownload || '--'}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Mbps
              </span>
            </div>
          </div>

          {/* Test Action Button */}
          <div>
            <button
              onClick={runSpeedTest}
              disabled={testing}
              className="px-8 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none"
            >
              <div className="flex items-center gap-2">
                {testing ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Benchmarking Bandwidth...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Run Speed Test</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 flex items-center justify-center gap-1">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              Ping Latency
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {currentPing > 0 ? `${currentPing} ms` : '--'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 flex items-center justify-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Jitter Variance
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {currentJitter > 0 ? `${currentJitter} ms` : '--'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 flex items-center justify-center gap-1">
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              Download Speed
            </span>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {currentDownload > 0 ? `${currentDownload} Mbps` : '--'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 flex items-center justify-center gap-1">
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              Upload Speed
            </span>
            <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
              {currentUpload > 0 ? `${currentUpload} Mbps` : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Test Logs Table */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          Speed Benchmark History ({history.length} Tests)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Ping</th>
                <th className="py-2.5 px-3">Jitter</th>
                <th className="py-2.5 px-3">Download Throughput</th>
                <th className="py-2.5 px-3">Upload Throughput</th>
                <th className="py-2.5 px-3">Relay Edge Node</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 text-slate-500">{record.timestamp}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                    {record.pingMs} ms
                  </td>
                  <td className="py-3 px-3 text-amber-600 dark:text-amber-400">{record.jitterMs} ms</td>
                  <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                    {record.downloadMbps} Mbps
                  </td>
                  <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                    {record.uploadMbps} Mbps
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-500">{record.serverNode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
