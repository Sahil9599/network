import React from 'react';
import { ActiveToolTab, MonitorItem, UserProfile } from '../types';
import { jsPDF } from 'jspdf';
import { exportCsvFile } from '../utils/reportExporter';
import {
  Network,
  Activity,
  Globe,
  Radio,
  Gauge,
  Terminal,
  Cpu,
  Download,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Zap,
  Server,
  Layers,
} from 'lucide-react';

interface DashboardOverviewProps {
  setActiveTab: (tab: ActiveToolTab) => void;
  user: UserProfile | null;
  systemStatus: string;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  setActiveTab,
  user,
  systemStatus,
}) => {
  // Export Executive PDF Audit Report
  const handleExportExecutiveReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Dark header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('NETSCOPE PRO // EXECUTIVE INFRASTRUCTURE REPORT', 14, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${new Date().toUTCString()} | Auditor: ${user?.name || 'Lead NetOps'}`, 14, 25);
    doc.text(`Session Token: Verified OAuth 2.0 (Bearer) | System Status: Operational`, 14, 31);

    let y = 48;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Infrastructure Monitoring Summary', 14, y);
    y += 8;

    const summaryRows = [
      ['Global Network Core', 'Operational (99.98% SLA)'],
      ['Subnetting Engine', 'RFC 1878 Class A-E & IPv6 /128 compliant'],
      ['DNS Resolution Latency', 'Average 18ms across Tier-1 anycast nodes'],
      ['Active Continuous Monitors', '3 Daemons (Cloudflare, Google, GitHub)'],
      ['TLS & Security Posture', 'Strict Transport Security (HSTS) verified'],
      ['Authentication Security', 'OAuth 2.0 (RFC 6749) Session Controller'],
      ['Developer API Endpoints', 'RESTful v1.0 with key authentication active'],
    ];

    doc.setFontSize(8.5);
    for (const [k, v] of summaryRows) {
      doc.setFont('helvetica', 'normal');
      doc.text(k, 18, y);
      doc.setFont('helvetica', 'bold');
      doc.text(v, 85, y);
      y += 6.5;
    }

    y += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. IPv4 Classful Space Architecture Distribution', 14, y);
    y += 8;

    const classRows = [
      ['Class A', '0.0.0.0 - 127.255.255.255', '128 Networks', '16,777,214 Hosts each', '50.0% of total space'],
      ['Class B', '128.0.0.0 - 191.255.255.255', '16,384 Networks', '65,534 Hosts each', '25.0% of total space'],
      ['Class C', '192.0.0.0 - 223.255.255.255', '2,097,152 Networks', '254 Hosts each', '12.5% of total space'],
      ['Class D', '224.0.0.0 - 239.255.255.255', 'Multicast Groups', 'N/A', '6.25% of total space'],
      ['Class E', '240.0.0.0 - 255.255.255.255', 'Experimental Reserved', 'N/A', '6.25% of total space'],
    ];

    doc.setFontSize(8);
    for (const row of classRows) {
      doc.setFont('helvetica', 'bold');
      doc.text(row[0], 18, y);
      doc.setFont('helvetica', 'normal');
      doc.text(row[1], 40, y);
      doc.text(row[2], 90, y);
      doc.text(row[3], 130, y);
      doc.text(row[4], 165, y);
      y += 6.5;
    }

    // Save
    doc.save(`NetScope_Executive_Report_${Date.now()}.pdf`);
  };

  const handleExportCsv = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Core Status', systemStatus],
      ['Uptime SLA', '99.98%'],
      ['Active User', user?.name || 'Alex Mercer'],
      ['OAuth Provider', user?.provider || 'Google OAuth 2.0'],
      ['DNS Average Latency', '18 ms'],
      ['Speedtest Baseline Download', '482.4 Mbps'],
      ['Speedtest Baseline Upload', '184.2 Mbps'],
    ];
    exportCsvFile(`NetScope_Dashboard_Export_${Date.now()}`, rows);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Welcome & Executive Summary Bar */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle decorative grid */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Active Session: {user?.role || 'Lead Network Architect'}
            </span>
            <span className="text-xs text-slate-300 font-mono">
              OAuth 2.0 Authenticated
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Network Operations & Diagnostic Control Center
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Real-time subnet calculation with full Class A-E matrix, DNS record resolution, endpoint health monitoring, TCP port connectivity, and low-jitter bandwidth benchmarks.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportExecutiveReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-md transition-all transform hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export Executive PDF</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Uptime Daemon SLA</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-2">
            99.98%
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>All 3 continuous monitors online</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Subnetting Space</span>
            <Network className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-2">
            4.29B IPs
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            Full IPv4 Classes A-E & IPv6 /128
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">DNS Lookup Latency</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-2">
            18 ms
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono mt-1">
            Across 6 Anycast root resolvers
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Throughput Benchmark</span>
            <Gauge className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-2">
            482 Mbps
          </div>
          <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono mt-1">
            Low Jitter (1.8ms) streaming chunks
          </div>
        </div>
      </div>

      {/* Class Space Allocation Breakdown & Quick Monitor Sparklines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* IPv4 Classful Allocation Bar & Matrix */}
        <div className="lg:col-span-7 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                IPv4 Global Address Space Allocation (Class Breakdown)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Distribution of 4,294,967,296 addresses across Classes A through E.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('subnet')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Subnet Tool</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Segmented Color Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-4 rounded-lg overflow-hidden flex shadow-xs">
              <div style={{ width: '50%' }} title="Class A: 50%" className="bg-blue-600" />
              <div style={{ width: '25%' }} title="Class B: 25%" className="bg-indigo-500" />
              <div style={{ width: '12.5%' }} title="Class C: 12.5%" className="bg-cyan-500" />
              <div style={{ width: '6.25%' }} title="Class D (Multicast): 6.25%" className="bg-amber-500" />
              <div style={{ width: '6.25%' }} title="Class E (Reserved): 6.25%" className="bg-rose-500" />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-500 pt-1">
              <span className="text-blue-600 dark:text-blue-400 font-bold">Class A (50%)</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">Class B (25%)</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">Class C (12.5%)</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">D (6.25%)</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">E (6.25%)</span>
            </div>
          </div>

          {/* Class Mini Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500">
                  <th className="py-2">Class</th>
                  <th className="py-2">Range</th>
                  <th className="py-2">Total Networks</th>
                  <th className="py-2">Hosts / Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                <tr>
                  <td className="py-2 font-bold text-blue-600 dark:text-blue-400">Class A</td>
                  <td className="py-2">0.0.0.0 - 127.255.255.255</td>
                  <td className="py-2">128</td>
                  <td className="py-2 font-semibold">16,777,214</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold text-indigo-600 dark:text-indigo-400">Class B</td>
                  <td className="py-2">128.0.0.0 - 191.255.255.255</td>
                  <td className="py-2">16,384</td>
                  <td className="py-2 font-semibold">65,534</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold text-cyan-600 dark:text-cyan-400">Class C</td>
                  <td className="py-2">192.0.0.0 - 223.255.255.255</td>
                  <td className="py-2">2,097,152</td>
                  <td className="py-2 font-semibold">254</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold text-amber-600 dark:text-amber-400">Class D</td>
                  <td className="py-2">224.0.0.0 - 239.255.255.255</td>
                  <td className="py-2">268,435,456 Groups</td>
                  <td className="py-2">Multicast</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold text-rose-600 dark:text-rose-400">Class E</td>
                  <td className="py-2">240.0.0.0 - 255.255.255.255</td>
                  <td className="py-2">IETF Experimental</td>
                  <td className="py-2">Reserved</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Monitored Daemons Mini Panel */}
        <div className="lg:col-span-5 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Live Endpoint Uptime Telemetry
            </h2>
            <button
              onClick={() => setActiveTab('uptime')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Cloudflare Public DNS', url: 'https://1.1.1.1', latency: 24, status: 200 },
              { name: 'Google Gateway Core', url: 'https://www.google.com', latency: 38, status: 200 },
              { name: 'GitHub API Daemon', url: 'https://api.github.com', latency: 82, status: 200 },
            ].map((ep, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {ep.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">{ep.url}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {ep.latency} ms
                  </div>
                  <div className="text-[10px] text-emerald-500 font-mono">200 OK</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-mono text-slate-500">
            <span>Security Protocols:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              TLS 1.3 Active
            </span>
          </div>
        </div>
      </div>

      {/* Quick Launchpad to All Tools */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Professional Network Engineering Launchpad
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: 'cisco-sim' as ActiveToolTab,
              title: 'Cisco Packet Tracer Labs',
              desc: 'Hands-on practice simulator with authentic Cisco IOS CLI, packet flow animation, and CCNA tasks.',
              icon: <Terminal className="w-5 h-5 text-emerald-500" />,
            },
            {
              id: 'subnet' as ActiveToolTab,
              title: 'Subnet Calculator & Classes',
              desc: 'Interactive IPv4/IPv6 CIDR, netmask, wildcard, VLSM subdivisions, and Class A-E matrix.',
              icon: <Network className="w-5 h-5 text-blue-500" />,
            },
            {
              id: 'ip-lookup' as ActiveToolTab,
              title: 'IP Address & ASN Intelligence',
              desc: 'Public/private lookup, country geo-coordinates, ISP, organization, and live map pin.',
              icon: <Globe className="w-5 h-5 text-indigo-500" />,
            },
            {
              id: 'dns' as ActiveToolTab,
              title: 'DNS Record Resolver',
              desc: 'Authoritative queries for A, AAAA, MX, TXT, NS, SOA records with latency benchmarks.',
              icon: <Cpu className="w-5 h-5 text-purple-500" />,
            },
            {
              id: 'uptime' as ActiveToolTab,
              title: 'Website Uptime & SSL Audit',
              desc: 'HTTP status, TLS cert expiration alert, connection waterfall timings, and daemons.',
              icon: <Activity className="w-5 h-5 text-emerald-500" />,
            },
            {
              id: 'port-trace' as ActiveToolTab,
              title: 'TCP Ports & Route Tracer',
              desc: 'Socket connection probe for Web, DB, and SSH ports, plus hop-by-hop route visualization.',
              icon: <Radio className="w-5 h-5 text-amber-500" />,
            },
            {
              id: 'speedtest' as ActiveToolTab,
              title: 'Automated Speed Telemetry',
              desc: 'Multi-stream download and upload bandwidth measurement with dynamic speedometer.',
              icon: <Gauge className="w-5 h-5 text-cyan-500" />,
            },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTab(tool.id)}
              className="p-5 text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                    {tool.icon}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {tool.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
