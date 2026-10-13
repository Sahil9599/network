import React, { useState, useMemo } from 'react';
import {
  calculateIPv4,
  calculateIPv6,
  generateSubnetSubdivisions,
  getCidrMasterTable,
  cidrToMask,
  maskToCidr,
  IPv4SubnetResult,
  IPv6SubnetResult,
  CLASSFUL_DATA,
} from '../utils/subnetCalculator';
import { exportSubnetReportPdf, exportCsvFile } from '../utils/reportExporter';
import {
  Network,
  Download,
  Copy,
  Check,
  Split,
  Table,
  Layers,
  Sparkles,
  Info,
  Hash,
  Shield,
  Zap,
} from 'lucide-react';

export const SubnetCalculatorView: React.FC = () => {
  const [calcMode, setCalcMode] = useState<'ipv4' | 'ipv6'>('ipv4');

  // IPv4 States
  const [ipv4Input, setIpv4Input] = useState('192.168.1.50');
  const [cidrInput, setCidrInput] = useState(24);
  const [targetSubdivideCidr, setTargetSubdivideCidr] = useState(26);

  // IPv6 States
  const [ipv6Input, setIpv6Input] = useState('2001:db8:acad:1::fe01');
  const [ipv6Prefix, setIpv6Prefix] = useState(64);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filterCidrText, setFilterCidrText] = useState('');

  // Calculate IPv4
  const ipv4Result: IPv4SubnetResult | null = useMemo(() => {
    try {
      const parts = ipv4Input.trim().split('.');
      if (parts.length === 4 && parts.every((p) => !isNaN(Number(p)) && Number(p) >= 0 && Number(p) <= 255)) {
        return calculateIPv4(ipv4Input, cidrInput);
      }
    } catch {
      // Fallback
    }
    return calculateIPv4('192.168.1.1', 24);
  }, [ipv4Input, cidrInput]);

  // Calculate IPv6
  const ipv6Result: IPv6SubnetResult = useMemo(() => {
    try {
      return calculateIPv6(ipv6Input, ipv6Prefix);
    } catch {
      return calculateIPv6('2001:db8::1', 64);
    }
  }, [ipv6Input, ipv6Prefix]);

  // VLSM Subdivisions
  const subdivisions = useMemo(() => {
    if (!ipv4Result) return [];
    return generateSubnetSubdivisions(
      ipv4Result.networkAddress,
      ipv4Result.cidr,
      Math.max(ipv4Result.cidr + 1, targetSubdivideCidr),
      32
    );
  }, [ipv4Result, targetSubdivideCidr]);

  // CIDR Master Reference Table
  const cidrTable = useMemo(() => {
    const list = getCidrMasterTable();
    if (!filterCidrText) return list;
    const q = filterCidrText.toLowerCase();
    return list.filter(
      (item) =>
        item.cidr.includes(q) ||
        item.mask.includes(q) ||
        item.classEquiv.toLowerCase().includes(q)
    );
  }, [filterCidrText]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleExportPdf = () => {
    exportSubnetReportPdf(ipv4Result, calcMode === 'ipv6' ? ipv6Result : null);
  };

  const handleExportCsv = () => {
    if (calcMode === 'ipv4' && ipv4Result) {
      const rows = [
        ['Parameter', 'Value'],
        ['IP Address', ipv4Result.ip],
        ['CIDR Prefix', `/${ipv4Result.cidr}`],
        ['Subnet Mask', ipv4Result.netmask],
        ['Wildcard Mask', ipv4Result.wildcardMask],
        ['Network Address', ipv4Result.networkAddress],
        ['Broadcast Address', ipv4Result.broadcastAddress],
        ['First Usable IP', ipv4Result.firstUsableIp],
        ['Last Usable IP', ipv4Result.lastUsableIp],
        ['Usable Hosts', String(ipv4Result.usableHosts)],
        ['Total Addresses', String(ipv4Result.totalAddresses)],
        ['IP Class', ipv4Result.ipClass],
        ['Class Networks', ipv4Result.classDetails.totalNetworks],
        ['Class Hosts per Net', ipv4Result.classDetails.hostsPerNetwork],
        ['Network Type', ipv4Result.addressType],
        ['In-Addr.arpa', ipv4Result.inAddrArpa],
      ];
      exportCsvFile(`Subnet_${ipv4Result.ip}_${ipv4Result.cidr}`, rows);
    } else {
      const rows = [
        ['Parameter', 'Value'],
        ['IPv6 Address', ipv6Result.ip],
        ['Compressed', ipv6Result.compressedIp],
        ['Expanded', ipv6Result.expandedIp],
        ['Prefix Length', `/${ipv6Result.cidr}`],
        ['Network Prefix', ipv6Result.networkPrefix],
        ['Total Addresses', ipv6Result.totalAddresses],
        ['Scope', ipv6Result.scopeType],
        ['RFC Standard', ipv6Result.rfcStandard],
      ];
      exportCsvFile(`IPv6_Subnet_${ipv6Result.compressedIp}`, rows);
    }
  };

  const applyPreset = (ip: string, cidr: number) => {
    setIpv4Input(ip);
    setCidrInput(cidr);
    setTargetSubdivideCidr(Math.min(32, cidr + 2));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Subnet Engineering & Class Architecture
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              RFC 1878 / RFC 4291
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual subnetting breakdown, classful host/network capacities, VLSM subdivision tree, and bitwise matrix.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* IPv4 / IPv6 Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCalcMode('ipv4')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                calcMode === 'ipv4'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              IPv4 Architecture
            </button>
            <button
              onClick={() => setCalcMode('ipv6')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                calcMode === 'ipv6'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              IPv6 Space (/128)
            </button>
          </div>

          {/* Export Report Buttons */}
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {calcMode === 'ipv4' ? (
        <>
          {/* IPv4 Inputs & Presets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-blue-500" />
                  Address & Subnet Mask Configuration
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                  {ipv4Result ? `/${ipv4Result.cidr} · ${ipv4Result.netmask}` : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-7">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={ipv4Input}
                    onChange={(e) => setIpv4Input(e.target.value)}
                    placeholder="e.g. 192.168.1.1"
                    className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Subnet Mask / CIDR
                  </label>
                  <select
                    value={cidrInput}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCidrInput(val);
                      setTargetSubdivideCidr(Math.min(32, val + 2));
                    }}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                  >
                    {Array.from({ length: 33 }, (_, i) => 32 - i).map((c) => (
                      <option key={c} value={c}>
                        /{c} - {cidrToMask(c)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CIDR Prefix Range Slider */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>Prefix Length: /{cidrInput}</span>
                  <span>
                    Usable Hosts: {ipv4Result?.usableHosts.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={cidrInput}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCidrInput(val);
                    setTargetSubdivideCidr(Math.min(32, val + 2));
                  }}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>/0 (Internet)</span>
                  <span>/8 (Class A)</span>
                  <span>/16 (Class B)</span>
                  <span>/24 (Class C)</span>
                  <span>/30 (P2P)</span>
                  <span>/32 (Host)</span>
                </div>
              </div>

              {/* Quick Preset Badges */}
              <div className="pt-2">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Quick Architecture Presets:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Private Class A (10.0.0.0/16)', ip: '10.0.0.1', cidr: 16 },
                    { label: 'Private Class B (172.16.0.0/12)', ip: '172.16.1.1', cidr: 12 },
                    { label: 'Home LAN (192.168.1.0/24)', ip: '192.168.1.50', cidr: 24 },
                    { label: 'AWS VPC Tier (10.0.0.0/20)', ip: '10.0.128.1', cidr: 20 },
                    { label: 'Carrier NAT (100.64.0.0/10)', ip: '100.64.1.1', cidr: 10 },
                    { label: 'P2P Link (10.254.0.0/30)', ip: '10.254.0.1', cidr: 30 },
                    { label: 'Google Public DNS (/32)', ip: '8.8.8.8', cidr: 32 },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyPreset(p.ip, p.cidr)}
                      className="px-2.5 py-1 text-[11px] rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Class Status Card */}
            {ipv4Result && (
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Class Architecture Match
                    </span>
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-600 text-white shadow-sm">
                      {ipv4Result.classDetails.name}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase font-mono">Standard Range</div>
                      <div className="text-sm font-semibold font-mono text-slate-900 dark:text-slate-100">
                        {ipv4Result.classDetails.range}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase font-mono">Total Network Blocks</div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {ipv4Result.classDetails.totalNetworks}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase font-mono">Capacity Per Network</div>
                      <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                        {ipv4Result.classDetails.hostsPerNetwork} hosts
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase font-mono">RFC / Purpose</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        {ipv4Result.classDetails.purpose}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Classification:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {ipv4Result.addressType}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Primary Results Metrics Grid */}
          {ipv4Result && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {[
                {
                  label: 'Network Address',
                  val: ipv4Result.networkAddress,
                  desc: 'Subnet ID (Base)',
                  key: 'net',
                },
                {
                  label: 'Broadcast Address',
                  val: ipv4Result.broadcastAddress,
                  desc: 'All host bits 1',
                  key: 'bcast',
                },
                {
                  label: 'Usable Host Range',
                  val: `${ipv4Result.firstUsableIp} - ${ipv4Result.lastUsableIp}`,
                  desc: `${ipv4Result.usableHosts.toLocaleString()} Assignable Hosts`,
                  key: 'range',
                },
                {
                  label: 'Subnet / Wildcard Mask',
                  val: `${ipv4Result.netmask}`,
                  desc: `Wildcard: ${ipv4Result.wildcardMask}`,
                  key: 'mask',
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative group hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {item.label}
                    </span>
                    <button
                      onClick={() => copyToClipboard(item.val, item.key)}
                      className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                      title="Copy value"
                    >
                      {copiedKey === item.key ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 truncate">
                    {item.val}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">{item.desc}</div>
                </div>
              ))}
            </div>
          )}

          {/* 32-bit Binary Bit Architecture Visualizer */}
          {ipv4Result && (
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    32-Bit Subnet Bit Architecture
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
                    <span>Network Bits: {ipv4Result.networkBitsCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                    <span>Host Bits: {ipv4Result.hostBitsCount}</span>
                  </div>
                </div>
              </div>

              {/* Bit Grid per octet */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                {ipv4Result.ipBinary.map((octetBits, octetIdx) => {
                  const octetVal = ipv4Result.ip.split('.')[octetIdx];
                  const maskOctetVal = ipv4Result.netmask.split('.')[octetIdx];
                  return (
                    <div
                      key={octetIdx}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                    >
                      <div className="flex justify-between text-[11px] text-slate-500 mb-2">
                        <span>Octet {octetIdx + 1} ({octetVal})</span>
                        <span>Mask: {maskOctetVal}</span>
                      </div>
                      <div className="grid grid-cols-8 gap-1">
                        {octetBits.split('').map((bit, bitIdx) => {
                          const globalBitIndex = octetIdx * 8 + bitIdx;
                          const isNetworkBit = globalBitIndex < ipv4Result.networkBitsCount;
                          return (
                            <div
                              key={bitIdx}
                              title={`Bit ${globalBitIndex + 1}: ${
                                isNetworkBit ? 'Network Bit' : 'Host Bit'
                              } (Value: ${bit})`}
                              className={`h-7 flex items-center justify-center text-xs font-bold rounded ${
                                isNetworkBit
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                              }`}
                            >
                              {bit}
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-[10px] text-center text-slate-400 mt-2">
                        {octetBits}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reverse DNS & Hex metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-slate-500">Hexadecimal Format:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {ipv4Result.hexIp}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-slate-500">Reverse DNS (PTR):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                    {ipv4Result.inAddrArpa}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CLASSFUL ARCHITECTURE BREAKDOWN (Explicit Class A, B, C, D, E Matrix) */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Table className="w-4 h-4 text-blue-500" />
                  Classful Network & Host Breakdown (Classes A, B, C, D, E)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Defines exactly how many network blocks and usable host allocations exist in each historic IPv4 address range.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold">
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Address Range</th>
                    <th className="py-2.5 px-3">Default Mask</th>
                    <th className="py-2.5 px-3">Leading Bits</th>
                    <th className="py-2.5 px-3">Total Networks</th>
                    <th className="py-2.5 px-3">Hosts Per Net</th>
                    <th className="py-2.5 px-3">RFC Description / Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {Object.entries(CLASSFUL_DATA).map(([key, c]) => {
                    const isSelected = ipv4Result?.ipClass === key;
                    return (
                      <tr
                        key={key}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            Class {key}
                          </span>
                        </td>
                        <td className="py-3 px-3">{c.range}</td>
                        <td className="py-3 px-3">
                          {c.defaultMask} {c.defaultCidr ? `(/${c.defaultCidr})` : ''}
                        </td>
                        <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400">
                          {c.leadingBits}
                        </td>
                        <td className="py-3 px-3">{c.totalNetworks}</td>
                        <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">
                          {c.hostsPerNetwork}
                        </td>
                        <td className="py-3 px-3 font-sans text-[11px] text-slate-500 dark:text-slate-400">
                          {c.purpose}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* VLSM Subnet Subdivision Tool */}
          {ipv4Result && (
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Split className="w-4 h-4 text-indigo-500" />
                    Subnet Subdivision / VLSM Allocation Table
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Divide base block {ipv4Result.networkAddress}/{ipv4Result.cidr} into smaller sub-allocations.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Divide into CIDR:</span>
                  <select
                    value={targetSubdivideCidr}
                    onChange={(e) => setTargetSubdivideCidr(Number(e.target.value))}
                    className="px-2.5 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {Array.from(
                      { length: Math.max(0, 32 - ipv4Result.cidr) },
                      (_, i) => ipv4Result.cidr + 1 + i
                    ).map((c) => (
                      <option key={c} value={c}>
                        /{c} ({Math.pow(2, c - ipv4Result.cidr)} subnets · {Math.max(0, Math.pow(2, 32 - c) - 2)} hosts each)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                    <tr className="text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Subnet CIDR</th>
                      <th className="py-2 px-3">Netmask</th>
                      <th className="py-2 px-3">Usable Host Range</th>
                      <th className="py-2 px-3">Broadcast</th>
                      <th className="py-2 px-3">Usable Hosts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {subdivisions.map((sub) => (
                      <tr
                        key={sub.index}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                      >
                        <td className="py-2 px-3 text-slate-400">{sub.index}</td>
                        <td className="py-2 px-3 font-semibold text-blue-600 dark:text-blue-400">
                          {sub.network}
                        </td>
                        <td className="py-2 px-3">{sub.netmask}</td>
                        <td className="py-2 px-3">
                          {sub.firstUsable} - {sub.lastUsable}
                        </td>
                        <td className="py-2 px-3">{sub.broadcast}</td>
                        <td className="py-2 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                          {sub.usableHosts.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CIDR Cheat Sheet Master Table */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-500" />
                  CIDR Quick Reference Master Table (/0 to /32)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Complete mask, wildcard, address counts, and class equivalence sheet.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search mask or CIDR..."
                value={filterCidrText}
                onChange={(e) => setFilterCidrText(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
              />
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                  <tr className="text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2 px-3">CIDR</th>
                    <th className="py-2 px-3">Subnet Mask</th>
                    <th className="py-2 px-3">Wildcard Mask</th>
                    <th className="py-2 px-3">Total Addresses</th>
                    <th className="py-2 px-3">Usable Hosts</th>
                    <th className="py-2 px-3">Class Equivalency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cidrTable.map((row) => (
                    <tr
                      key={row.cidr}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                    >
                      <td className="py-1.5 px-3 font-bold text-blue-600 dark:text-blue-400">
                        {row.cidr}
                      </td>
                      <td className="py-1.5 px-3">{row.mask}</td>
                      <td className="py-1.5 px-3 text-slate-400">{row.wildcard}</td>
                      <td className="py-1.5 px-3">{row.totalHosts}</td>
                      <td className="py-1.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        {row.usableHosts}
                      </td>
                      <td className="py-1.5 px-3 font-sans text-slate-500">{row.classEquiv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* IPv6 CALCULATOR MODE */
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-500" />
                IPv6 128-Bit Space Configuration
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                Prefix: /{ipv6Prefix}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  IPv6 Address
                </label>
                <input
                  type="text"
                  value={ipv6Input}
                  onChange={(e) => setIpv6Input(e.target.value)}
                  placeholder="2001:db8::1"
                  className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Prefix Length (0 - 128)
                </label>
                <input
                  type="number"
                  min="0"
                  max="128"
                  value={ipv6Prefix}
                  onChange={(e) => setIpv6Prefix(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Presets */}
            <div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
                Common IPv6 Presets:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Standard Host /64 (2001:db8:acad::1)', ip: '2001:db8:acad::1', p: 64 },
                  { label: 'Site Routing /48 (2001:db8:1234::)', ip: '2001:db8:1234::', p: 48 },
                  { label: 'ISP Allocation /32 (2001:db8::)', ip: '2001:db8::', p: 32 },
                  { label: 'Unique Local /48 (fd00:abcd:1234::1)', ip: 'fd00:abcd:1234::1', p: 48 },
                  { label: 'Link-Local (fe80::1)', ip: 'fe80::1', p: 10 },
                  { label: 'Loopback (::1)', ip: '::1', p: 128 },
                ].map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIpv6Input(p.ip);
                      setIpv6Prefix(p.p);
                    }}
                    className="px-2.5 py-1 text-[11px] rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* IPv6 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] text-slate-500">Routing Prefix Block</span>
              <div className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 truncate">
                {ipv6Result.networkPrefix}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Base Network Allocation</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] text-slate-500">Possible /64 Subnets</span>
              <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {ipv6Result.possible64Subnets}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Standard SLAAC blocks</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] text-slate-500">Address Scope</span>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                {ipv6Result.scopeType}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{ipv6Result.rfcStandard}</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] text-slate-500">Total Addresses</span>
              <div className="text-xs font-bold font-mono text-purple-600 dark:text-purple-400 mt-1 truncate">
                {ipv6Result.totalAddresses}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">2^{128 - ipv6Result.cidr} pool</div>
            </div>
          </div>

          {/* Formats Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold font-sans text-slate-900 dark:text-slate-100">
              IPv6 Address Representations
            </h3>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Compressed (RFC 5952)</div>
                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                  {ipv6Result.compressedIp}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Expanded (Full 8 Hextets)</div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5 break-all">
                  {ipv6Result.expandedIp}
                </div>
              </div>
            </div>

            {/* 8-Hextet Visualizer */}
            <div className="pt-2">
              <div className="text-[11px] font-sans font-medium text-slate-500 mb-2">
                Individual 16-Bit Hextet Decomposition:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {ipv6Result.hextets.map((h, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-center"
                  >
                    <div className="text-[10px] text-slate-400">Hextet {idx + 1}</div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{h}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
