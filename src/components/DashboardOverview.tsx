import React from 'react';
import { ActiveToolTab, UserProfile } from '../types';
import { jsPDF } from 'jspdf';
import { exportCsvFile } from '../utils/reportExporter';
import { CISCO_PRACTICE_LABS } from '../utils/ciscoLabs';
import {
  Network,
  Terminal,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  Download,
  Award,
  BookOpen,
  Sparkles,
  Cpu,
  Radio,
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
  // Export Executive PDF Audit Report focusing on Cisco & Subnetting Suite
  const handleExportExecutiveReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Dark header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('NETSCOPE PRO // CISCO LABS & SUBNETTING SUITE', 14, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${new Date().toUTCString()} | Engineer: ${user?.name || 'Lead NetOps'}`, 14, 25);
    doc.text(`RFC 1878 Subnetting Standard | Cisco IOS CLI Engine Verified`, 14, 31);

    let y = 48;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Cisco Packet Tracer Lab Modules', 14, y);
    y += 8;

    const labRows = [
      ['Lab 1: Basic Router & Switch Setup', 'CLI Hostname, FastEthernet IP & No Shutdown', 'Beginner'],
      ['Lab 2: Static Route & Inter-VLAN', 'Next-hop routing and 802.1Q subinterfaces', 'Intermediate'],
      ['Lab 3: OSPF Single-Area & Enterprise', 'Area 0 adjacency, wildcard masks, and DR/BDR', 'CCNA Pro'],
      ['Lab 4: Access Control Lists (ACL)', 'Standard & Extended traffic filtering rules', 'CCNA Pro'],
    ];

    doc.setFontSize(8.5);
    for (const [k, v, diff] of labRows) {
      doc.setFont('helvetica', 'bold');
      doc.text(k, 18, y);
      doc.setFont('helvetica', 'normal');
      doc.text(v, 90, y);
      doc.setFont('helvetica', 'bold');
      doc.text(diff, 170, y);
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
    doc.save(`NetScope_Cisco_Subnet_Report_${Date.now()}.pdf`);
  };

  const handleExportCsv = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Core Status', systemStatus],
      ['Cisco Labs Available', `${CISCO_PRACTICE_LABS.length} Hands-on Scenarios`],
      ['IPv4 Global Address Space', '4,294,967,296 addresses'],
      ['Active Engineer', user?.name || 'Lead Architect'],
      ['RFC 1878 Subnetting Engine', 'Full CIDR /0 to /32 & IPv6 /128'],
      ['Cisco IOS CLI Emulator', 'User, Privileged EXEC, Config & Config-if Modes'],
    ];
    exportCsvFile(`NetScope_Engineering_Summary_${Date.now()}`, rows);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Welcome & Executive Summary Bar */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
              CCNA & Network Engineering Suite
            </span>
            <span className="text-xs text-slate-300 font-mono">
              RFC 1878 Compliant
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Cisco Packet Tracer Labs & Subnet Architecture
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Hands-on Cisco IOS terminal emulator with interactive network topologies, packet animation, and comprehensive IPv4/IPv6 CIDR subnet calculator with Classes A through E allocation matrices.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportExecutiveReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-md transition-all transform hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export PDF Report</span>
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
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Cisco Practice Labs</span>
            <Terminal className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-2">
            {CISCO_PRACTICE_LABS.length} Labs
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Beginner to CCNA Pro levels</span>
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

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Cisco IOS CLI Modes</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-2">
            4 Modes
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono mt-1">
            User &gt;, Priv #, Conf (config)#, Interface
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">CIDR Mask Breakdown</span>
            <Layers className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-2">
            /0 to /32
          </div>
          <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono mt-1">
            VLSM & FLSM Subdivisions
          </div>
        </div>
      </div>

      {/* Two Core Featured Tools Launchpad */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            Core Engineering Tools
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Interactive & Offline-Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Cisco Packet Tracer Lab Card */}
          <div className="p-6 rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 flex flex-col justify-between hover:shadow-lg transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                  <Terminal className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Interactive Simulator
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Cisco Packet Tracer Lab
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Real-time Cisco IOS command-line interpreter, graphical network canvas, packet transit animations, step-by-step CCNA practice challenges, and automated config verification.
                </p>
              </div>

              <div className="space-y-1.5 pt-2 text-xs font-mono text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Router &amp; Switch IOS configuration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>ICMP Ping &amp; ARP packet trace simulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>VLANs, Subinterfaces, and Static Routing</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('cisco-sim')}
              className="mt-6 w-full py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform transform active:scale-95"
            >
              <span>Launch Cisco Simulator</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Subnet Calculator & Classes Card */}
          <div className="p-6 rounded-2xl border-2 border-blue-500/30 dark:border-blue-500/20 bg-gradient-to-br from-blue-50/50 via-white to-slate-50 dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900 flex flex-col justify-between hover:shadow-lg transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
                  <Network className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  RFC 1878 Standard
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Subnet Calculator &amp; Classes
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Comprehensive IPv4/IPv6 CIDR calculator with interactive bitmask matrix, VLSM subnet subdivisions, binary octet breakdown, and complete Classes A through E address distribution.
                </p>
              </div>

              <div className="space-y-1.5 pt-2 text-xs font-mono text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Class A, B, C, D (Multicast), E (Reserved)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Netmask, Wildcard, Network &amp; Broadcast IP</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>IPv6 /128 Prefix, Short &amp; Expanded notation</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('subnet')}
              className="mt-6 w-full py-3 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-transform transform active:scale-95"
            >
              <span>Launch Subnet Calculator</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Network Device Scanner Card */}
          <div className="p-6 rounded-2xl border-2 border-cyan-500/30 dark:border-cyan-500/20 bg-gradient-to-br from-cyan-50/50 via-white to-slate-50 dark:from-cyan-950/20 dark:via-slate-900 dark:to-slate-900 flex flex-col justify-between hover:shadow-lg transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-600/20 group-hover:scale-105 transition-transform">
                  <Radio className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  ARP &amp; MAC Discovery
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  Network Device Scanner
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Real-time network subnet &amp; ARP discovery. Discover all live devices, view their exact IP and MAC hardware addresses, resolve IEEE OUI manufacturers, and run live ping tests.
                </p>
              </div>

              <div className="space-y-1.5 pt-2 text-xs font-mono text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Full Subnet &amp; ARP Cache Table Scanning</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />
                  <span>IP, MAC (Standard &amp; Cisco), OUI Vendors</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Live Ping Diagnostics &amp; Wake-on-LAN (WOL)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('device-scanner')}
              className="mt-6 w-full py-3 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 transition-transform transform active:scale-95"
            >
              <span>Launch Device Scanner</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Class Space Allocation Breakdown & CCNA Practice Lab Overview */}
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

        {/* Cisco CCNA Practice Labs List Panel */}
        <div className="lg:col-span-5 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              Cisco CCNA Practice Scenarios
            </h2>
            <button
              onClick={() => setActiveTab('cisco-sim')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Open Labs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {CISCO_PRACTICE_LABS.slice(0, 4).map((lab) => (
              <div
                key={lab.id}
                onClick={() => setActiveTab('cisco-sim')}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between hover:border-emerald-400 dark:hover:border-emerald-600 cursor-pointer transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {lab.title}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{lab.topologySummary}</div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold ${
                      lab.difficulty === 'Beginner'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : lab.difficulty === 'Intermediate'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {lab.difficulty}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-mono text-slate-500">
            <span>Certification Target:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Cisco CCNA 200-301
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
