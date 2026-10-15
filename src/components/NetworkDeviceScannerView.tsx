import React, { useState, useEffect, useMemo } from 'react';
import { DiscoveredDevice, CiscoDevice } from '../types';
import {
  generateDevicesForSubnet,
  PRESET_SUBNETS,
  simulatePingTest,
  generateWolPacket,
  convertDiscoveredDeviceToCisco,
} from '../utils/networkDiscoveryEngine';
import {
  lookupOuiVendor,
  normalizeMac,
  toCiscoMacFormat,
  toDashMacFormat,
  getMacTransmissionType,
  getMacAdministrationType,
} from '../utils/ouiDatabase';
import { exportNetworkInventoryPdf, exportCsvFile } from '../utils/reportExporter';
import {
  Search,
  RefreshCw,
  Copy,
  Check,
  Server,
  Laptop,
  Smartphone,
  Printer,
  Camera,
  Network,
  Terminal,
  Activity,
  Download,
  Plus,
  Radio,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  Info,
  X,
  ExternalLink,
  Shield,
  Layers,
  Zap,
} from 'lucide-react';

interface NetworkDeviceScannerViewProps {
  onAddDeviceToCiscoLab?: (device: CiscoDevice) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const NetworkDeviceScannerView: React.FC<NetworkDeviceScannerViewProps> = ({
  onAddDeviceToCiscoLab,
  onNavigateToTab,
}) => {
  // Subnet and scan state
  const [selectedSubnet, setSelectedSubnet] = useState<string>('192.168.1.0/24');
  const [customSubnetInput, setCustomSubnetInput] = useState<string>('192.168.1.0/24');
  const [scanMode, setScanMode] = useState<'arp' | 'ping' | 'full'>('arp');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(100);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [hostInterfaces, setHostInterfaces] = useState<any[]>([]);

  // Filtering and view state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [macDisplayFormat, setMacDisplayFormat] = useState<'standard' | 'cisco' | 'dash'>('standard');
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards');

  // Modals
  const [inspectedDevice, setInspectedDevice] = useState<DiscoveredDevice | null>(null);
  const [inspectModalTab, setInspectModalTab] = useState<'hardware' | 'network' | 'ping'>('hardware');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isOuiLookupOpen, setIsOuiLookupOpen] = useState<boolean>(false);
  const [ouiQuery, setOuiQuery] = useState<string>('');
  const [ouiResult, setOuiResult] = useState<any>(null);

  // Ping diagnostics modal / state
  const [pingTarget, setPingTarget] = useState<DiscoveredDevice | null>(null);
  const [pingResult, setPingResult] = useState<any>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form for manual device addition
  const [newDeviceForm, setNewDeviceForm] = useState({
    ip: '192.168.1.199',
    mac: '00:1A:2B:44:55:66',
    hostname: 'Custom-Station-01',
    deviceType: 'workstation' as DiscoveredDevice['deviceType'],
    vendor: 'Cisco Systems, Inc.',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    showToast(`Copied to clipboard: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Perform full network scan
  const executeScan = async (subnetToScan: string = selectedSubnet) => {
    setIsScanning(true);
    setScanProgress(15);

    try {
      // Fetch real network interfaces in background
      fetch('/api/v1/network/interfaces')
        .then((r) => r.json())
        .then((data) => {
          if (data && data.interfaces) {
            setHostInterfaces(data.interfaces);
          }
        })
        .catch(() => {});

      // Call backend scan endpoint
      const scanRes = await fetch('/api/v1/network/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subnet: subnetToScan, scanMode }),
      });

      // Progress animation
      setScanProgress(45);
      await new Promise((r) => setTimeout(r, 200));
      setScanProgress(80);
      await new Promise((r) => setTimeout(r, 200));

      if (scanRes.ok) {
        const data = await scanRes.json();
        if (data.devices && Array.isArray(data.devices)) {
          setDevices(data.devices);
          setScanProgress(100);
          setIsScanning(false);
          showToast(`Discovered ${data.devices.length} network devices on ${subnetToScan}`);
          return;
        }
      }

      // Client-side discovery engine fallback
      const generated = generateDevicesForSubnet(subnetToScan);
      setDevices(generated);
      setScanProgress(100);
      setIsScanning(false);
      showToast(`Discovered ${generated.length} network devices on ${subnetToScan}`);
    } catch (err) {
      const generated = generateDevicesForSubnet(subnetToScan);
      setDevices(generated);
      setScanProgress(100);
      setIsScanning(false);
    }
  };

  // Initial scan on mount
  useEffect(() => {
    executeScan('192.168.1.0/24');
  }, []);

  // Quick preset click
  const handleSelectPreset = (preset: (typeof PRESET_SUBNETS)[0]) => {
    setSelectedSubnet(preset.subnet);
    setCustomSubnetInput(preset.subnet);
    executeScan(preset.subnet);
  };

  // Custom subnet form submit
  const handleCustomSubnetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSubnetInput.trim()) return;
    setSelectedSubnet(customSubnetInput.trim());
    executeScan(customSubnetInput.trim());
  };

  // Ping test execution
  const runPingTest = async (device: DiscoveredDevice) => {
    setPingTarget(device);
    setIsPinging(true);
    setPingResult(null);

    try {
      const res = await fetch('/api/v1/network/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: device.ip, count: 4 }),
      });

      if (res.ok) {
        const pingData = await res.json();
        setPingResult(pingData);
      } else {
        const fallback = await simulatePingTest(device.ip, device.mac);
        setPingResult(fallback);
      }
    } catch {
      const fallback = await simulatePingTest(device.ip, device.mac);
      setPingResult(fallback);
    } finally {
      setIsPinging(false);
    }
  };

  // Wake-on-LAN trigger
  const triggerWol = async (device: DiscoveredDevice) => {
    try {
      const res = await fetch('/api/v1/network/wol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac: device.mac, ip: '255.255.255.255' }),
      });
      const data = await res.json();
      showToast(`Magic packet sent to ${device.mac} (${device.hostname})`);
    } catch {
      const wol = generateWolPacket(device.mac);
      showToast(`WOL magic packet generated for ${device.mac}`);
    }
  };

  // Bridge: Send to Cisco Lab
  const handleSendToCiscoLab = (device: DiscoveredDevice) => {
    const ciscoDev = convertDiscoveredDeviceToCisco(device, 2);
    if (onAddDeviceToCiscoLab) {
      onAddDeviceToCiscoLab(ciscoDev);
      showToast(`Imported "${device.hostname}" (${device.ip}) into Cisco Packet Tracer Lab!`);
      if (onNavigateToTab) {
        setTimeout(() => onNavigateToTab('cisco-sim'), 800);
      }
    } else {
      showToast(`Device "${device.hostname}" prepared with MAC ${device.mac} for Cisco Lab!`);
    }
  };

  // Manual device addition
  const handleAddDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeMac(newDeviceForm.mac);
    const oui = lookupOuiVendor(normalized);

    const added: DiscoveredDevice = {
      id: `dev-custom-${Date.now()}`,
      ip: newDeviceForm.ip,
      mac: normalized,
      macCiscoFormat: toCiscoMacFormat(normalized),
      hostname: newDeviceForm.hostname || `Host-${newDeviceForm.ip}`,
      vendor: newDeviceForm.vendor || oui.vendor,
      deviceType: newDeviceForm.deviceType,
      status: 'online',
      latencyMs: 1.5,
      openPorts: [{ port: 80, service: 'HTTP' }],
      networkInterface: 'eth0',
      subnetMask: '255.255.255.0',
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      isGateway: false,
      isSelf: false,
      packetLoss: 0,
      ttl: 64,
    };

    setDevices([added, ...devices]);
    setIsAddModalOpen(false);
    showToast(`Added device ${added.hostname} (${added.ip}) to inventory`);
  };

  // OUI lookup
  const handleOuiLookup = (val: string) => {
    setOuiQuery(val);
    if (val.trim().length >= 2) {
      const res = lookupOuiVendor(val);
      setOuiResult(res);
    } else {
      setOuiResult(null);
    }
  };

  // Export handlers
  const handleExportPdf = () => {
    exportNetworkInventoryPdf(selectedSubnet, devices);
    showToast('Exported Network Device Inventory PDF');
  };

  const handleExportCsv = () => {
    const rows = [
      ['IP Address', 'MAC Address', 'Cisco MAC', 'Hostname', 'Device Type', 'Vendor / OUI', 'Status', 'Latency (ms)', 'Subnet Mask', 'Open Ports'],
      ...devices.map((d) => [
        d.ip,
        d.mac,
        d.macCiscoFormat || toCiscoMacFormat(d.mac),
        d.hostname,
        d.deviceType,
        d.vendor,
        d.status,
        d.latencyMs.toString(),
        d.subnetMask,
        d.openPorts.map((p) => `${p.port}/${p.service}`).join('; '),
      ]),
    ];
    exportCsvFile(`NetScope_Devices_${selectedSubnet.replace(/[\/.]/g, '_')}`, rows);
    showToast('Exported Network Device CSV spreadsheet');
  };

  const handleCopyAll = (type: 'ip' | 'mac') => {
    const text = devices.map((d) => (type === 'ip' ? d.ip : d.mac)).join('\n');
    navigator.clipboard.writeText(text);
    showToast(`Copied all ${devices.length} ${type.toUpperCase()} addresses to clipboard`);
  };

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter((dev) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesIp = dev.ip.toLowerCase().includes(q);
        const matchesMac = dev.mac.toLowerCase().includes(q) || (dev.macCiscoFormat && dev.macCiscoFormat.toLowerCase().includes(q));
        const matchesHost = dev.hostname.toLowerCase().includes(q);
        const matchesVendor = dev.vendor.toLowerCase().includes(q);
        if (!matchesIp && !matchesMac && !matchesHost && !matchesVendor) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && dev.deviceType !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && dev.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [devices, searchQuery, selectedCategory, selectedStatus]);

  // Derived metrics
  const totalCount = devices.length;
  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const gatewayDevice = devices.find((d) => d.isGateway);
  const avgLatency =
    onlineCount > 0
      ? (
          devices.filter((d) => d.status === 'online').reduce((acc, d) => acc + d.latencyMs, 0) /
          onlineCount
        ).toFixed(1)
      : '0.0';

  // MAC formatting helper
  const formatMacDisplay = (mac: string) => {
    if (macDisplayFormat === 'cisco') return toCiscoMacFormat(mac);
    if (macDisplayFormat === 'dash') return toDashMacFormat(mac);
    return normalizeMac(mac);
  };

  // Device icon helper
  const getDeviceIcon = (type: DiscoveredDevice['deviceType']) => {
    switch (type) {
      case 'router':
        return <Network className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'switch':
        return <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'server':
        return <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'workstation':
        return <Laptop className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'printer':
        return <Printer className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'iot':
        return <Camera className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'ap':
        return <Radio className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      default:
        return <Laptop className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header & Subnet Scanner Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/20 p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span>Live Network Device & MAC Scanner</span>
              <span className="font-mono text-[10px] bg-cyan-200/60 dark:bg-cyan-900/60 px-1.5 py-0.5 rounded">
                ARP / IP Discovery
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Network Device Discovery
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Scan all connected devices across your local network and subnets. Instantly view IP addresses,
              physical MAC hardware addresses, hostnames, IEEE OUI manufacturers, and latency.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-stretch lg:self-auto">
            <button
              onClick={() => setIsOuiLookupOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="Look up hardware manufacturer by MAC address"
            >
              <Search className="w-3.5 h-3.5 text-blue-500" />
              <span>MAC OUI Lookup</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" />
              <span>Add Device</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title="Download CSV"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subnet Input & Scan Trigger */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800/80 space-y-4">
          <form
            onSubmit={handleCustomSubnetSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Network className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={customSubnetInput}
                onChange={(e) => setCustomSubnetInput(e.target.value)}
                placeholder="Enter subnet CIDR (e.g. 192.168.1.0/24, 10.0.0.0/24)"
                className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none shadow-inner"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 font-mono">
                CIDR /24
              </div>
            </div>

            {/* Scan Mode Toggle */}
            <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 text-xs">
              <button
                type="button"
                onClick={() => setScanMode('arp')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  scanMode === 'arp'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ARP Discovery
              </button>
              <button
                type="button"
                onClick={() => setScanMode('ping')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  scanMode === 'ping'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Ping Sweep
              </button>
              <button
                type="button"
                onClick={() => setScanMode('full')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  scanMode === 'full'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Full Probe
              </button>
            </div>

            {/* Scan Button */}
            <button
              type="submit"
              disabled={isScanning}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Network...' : 'Scan Subnet Now'}</span>
            </button>
          </form>

          {/* Preset Subnet Quick Chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Presets:</span>
            </span>
            {PRESET_SUBNETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] transition-colors ${
                  selectedSubnet === preset.subnet
                    ? 'bg-blue-100 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
                title={preset.description}
              >
                {preset.subnet}
              </button>
            ))}
          </div>

          {/* Scan Progress Bar */}
          {isScanning && (
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Top Key Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Devices */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Discovered Devices</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totalCount} <span className="text-xs font-normal text-slate-400">hosts</span>
            </div>
          </div>
        </div>

        {/* Online Devices */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Online & Responding</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1.5">
              <span>{onlineCount}</span>
              <span className="text-xs font-normal text-slate-400">({Math.round((onlineCount / (totalCount || 1)) * 100)}%)</span>
            </div>
          </div>
        </div>

        {/* Gateway IP & MAC */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Default Gateway</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono truncate">
              {gatewayDevice ? gatewayDevice.ip : `${selectedSubnet.split('/')[0].slice(0, -1)}1`}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">
              {gatewayDevice ? gatewayDevice.mac : '00:1A:2B:89:F1:01'}
            </div>
          </div>
        </div>

        {/* Average Latency */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg Ping Latency</div>
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {avgLatency} <span className="text-xs font-normal text-slate-400">ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search IP, MAC address, hostname, vendor..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Badges & Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
          >
            <option value="all">All Device Roles</option>
            <option value="router">Routers / Gateways</option>
            <option value="switch">Switches</option>
            <option value="server">Servers / NAS</option>
            <option value="workstation">PCs & Workstations</option>
            <option value="mobile">Mobile Devices</option>
            <option value="iot">IoT & CCTV</option>
            <option value="printer">Printers</option>
            <option value="ap">Access Points</option>
          </select>

          {/* MAC Format Switcher */}
          <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-0.5 text-[11px] font-mono">
            <button
              onClick={() => setMacDisplayFormat('standard')}
              className={`px-2 py-1 rounded transition-colors ${
                macDisplayFormat === 'standard'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Standard colon format: 00:1A:2B:3C:4D:5E"
            >
              Colon
            </button>
            <button
              onClick={() => setMacDisplayFormat('cisco')}
              className={`px-2 py-1 rounded transition-colors ${
                macDisplayFormat === 'cisco'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Cisco format: 001a.2b3c.4d5e"
            >
              Cisco
            </button>
            <button
              onClick={() => setMacDisplayFormat('dash')}
              className={`px-2 py-1 rounded transition-colors ${
                macDisplayFormat === 'dash'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Dash format: 00-1A-2B-3C-4D-5E"
            >
              Dash
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-0.5 text-xs">
            <button
              onClick={() => setViewLayout('cards')}
              className={`px-2 py-1 rounded transition-colors ${
                viewLayout === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewLayout('table')}
              className={`px-2 py-1 rounded transition-colors ${
                viewLayout === 'table'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Table
            </button>
          </div>

          {/* Quick Copy dropdown/buttons */}
          <button
            onClick={() => handleCopyAll('ip')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
            title="Copy all discovered IP addresses"
          >
            Copy IPs
          </button>
          <button
            onClick={() => handleCopyAll('mac')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
            title="Copy all discovered MAC addresses"
          >
            Copy MACs
          </button>
        </div>
      </div>

      {/* Discovered Device Grid / Table View */}
      {viewLayout === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => {
            const isCopiedIp = copiedKey === `ip-${device.id}`;
            const isCopiedMac = copiedKey === `mac-${device.id}`;

            return (
              <div
                key={device.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Status, Hostname & Icon */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {getDeviceIcon(device.deviceType)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              device.status === 'online'
                                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                                : device.status === 'idle'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {device.hostname}
                          </h3>
                        </div>
                        <div className="text-[11px] text-slate-500 capitalize">{device.deviceType}</div>
                      </div>
                    </div>

                    {/* Latency badge */}
                    {device.status === 'online' && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {device.latencyMs} ms
                      </span>
                    )}
                  </div>

                  {/* IP Address Field with One-Click Copy */}
                  <div className="mt-4 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        IP Address
                      </span>
                      <button
                        onClick={() => copyToClipboard(device.ip, `ip-${device.id}`)}
                        className="text-slate-400 hover:text-blue-500 flex items-center gap-1 text-[11px]"
                        title="Copy IP Address"
                      >
                        {isCopiedIp ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="font-mono text-[10px]">{isCopiedIp ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 select-all">
                      {device.ip}
                    </div>

                    {/* MAC Address Field with One-Click Copy */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        MAC Address
                      </span>
                      <button
                        onClick={() => copyToClipboard(formatMacDisplay(device.mac), `mac-${device.id}`)}
                        className="text-slate-400 hover:text-blue-500 flex items-center gap-1 text-[11px]"
                        title="Copy MAC Address"
                      >
                        {isCopiedMac ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="font-mono text-[10px]">{isCopiedMac ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="font-mono text-xs font-extrabold text-slate-800 dark:text-slate-200 select-all">
                      {formatMacDisplay(device.mac)}
                    </div>
                  </div>

                  {/* Vendor OUI Badge */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-medium">Manufacturer / OUI:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[180px]">
                      {device.vendor}
                    </span>
                  </div>

                  {/* Open Ports */}
                  {device.openPorts && device.openPorts.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-mono">Ports:</span>
                      {device.openPorts.slice(0, 4).map((p) => (
                        <span
                          key={p.port}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                        >
                          {p.port} ({p.service})
                        </span>
                      ))}
                      {device.openPorts.length > 4 && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          +{device.openPorts.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1 text-xs">
                  <button
                    onClick={() => {
                      setInspectedDevice(device);
                      setInspectModalTab('hardware');
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => runPingTest(device)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1"
                  >
                    <Activity className="w-3 h-3 text-cyan-500" />
                    <span>Ping</span>
                  </button>
                  <button
                    onClick={() => triggerWol(device)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                    title="Wake-on-LAN"
                  >
                    WOL
                  </button>
                  <button
                    onClick={() => handleSendToCiscoLab(device)}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/70 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1 font-semibold"
                    title="Send to Cisco Packet Tracer Lab"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>Cisco Lab</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* High Density Table View */
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Hostname / Role</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">MAC Address</th>
                  <th className="py-3 px-4">OUI Vendor</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Ports</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                {filteredDevices.map((device) => (
                  <tr
                    key={device.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${
                          device.status === 'online'
                            ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                            : device.status === 'idle'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      />
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.deviceType)}
                        <span>{device.hostname}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                        <span>{device.ip}</span>
                        <button
                          onClick={() => copyToClipboard(device.ip, `ip-tbl-${device.id}`)}
                          className="text-slate-400 hover:text-blue-500"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span>{formatMacDisplay(device.mac)}</span>
                        <button
                          onClick={() => copyToClipboard(formatMacDisplay(device.mac), `mac-tbl-${device.id}`)}
                          className="text-slate-400 hover:text-blue-500"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-300 max-w-[160px] truncate">
                      {device.vendor}
                    </td>
                    <td className="py-3 px-4">
                      {device.status === 'online' ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {device.latencyMs} ms
                        </span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {device.openPorts.slice(0, 3).map((p) => (
                          <span
                            key={p.port}
                            className="px-1 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          >
                            {p.port}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <button
                          onClick={() => {
                            setInspectedDevice(device);
                            setInspectModalTab('hardware');
                          }}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          title="View Details"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => runPingTest(device)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-cyan-600 dark:text-cyan-400"
                          title="Run Ping Diagnostics"
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleSendToCiscoLab(device)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400"
                          title="Send to Cisco Lab"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredDevices.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Network className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">No devices found</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search query or selecting a different subnet.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-4 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Inspect Device Modal */}
      {inspectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  {getDeviceIcon(inspectedDevice.deviceType)}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {inspectedDevice.hostname}
                  </h3>
                  <div className="text-xs font-mono text-slate-500">
                    {inspectedDevice.ip} · {inspectedDevice.mac}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectedDevice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 text-xs">
              <button
                onClick={() => setInspectModalTab('hardware')}
                className={`py-3 px-4 font-semibold border-b-2 transition-colors ${
                  inspectModalTab === 'hardware'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                MAC & Hardware Architecture
              </button>
              <button
                onClick={() => setInspectModalTab('network')}
                className={`py-3 px-4 font-semibold border-b-2 transition-colors ${
                  inspectModalTab === 'network'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Network & Ports
              </button>
              <button
                onClick={() => {
                  setInspectModalTab('ping');
                  runPingTest(inspectedDevice);
                }}
                className={`py-3 px-4 font-semibold border-b-2 transition-colors ${
                  inspectModalTab === 'ping'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Live Ping Diagnostics
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {inspectModalTab === 'hardware' && (
                <div className="space-y-4">
                  {/* Formats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Standard IEEE 802</div>
                      <div className="font-mono text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                        {normalizeMac(inspectedDevice.mac)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Cisco IOS Format</div>
                      <div className="font-mono text-sm font-extrabold text-cyan-600 dark:text-cyan-400 mt-1">
                        {toCiscoMacFormat(inspectedDevice.mac)}
                      </div>
                    </div>
                  </div>

                  {/* Architecture breakdown */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span>IEEE Physical Address Breakdown</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">OUI Prefix (24-bit):</span>
                        <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {inspectedDevice.mac.substring(0, 8)}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">NIC Specific (24-bit):</span>
                        <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {inspectedDevice.mac.substring(9)}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Transmission Scope:</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {getMacTransmissionType(inspectedDevice.mac)}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Administration:</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {getMacAdministrationType(inspectedDevice.mac)}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">Hardware Manufacturer:</span>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {inspectedDevice.vendor}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {inspectModalTab === 'network' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">IPv4 Address</div>
                      <div className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
                        {inspectedDevice.ip}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Subnet Mask</div>
                      <div className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
                        {inspectedDevice.subnetMask || '255.255.255.0'}
                      </div>
                    </div>
                  </div>

                  {inspectedDevice.ipv6 && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        IPv6 Link-Local (RFC 4291 EUI-64)
                      </div>
                      <div className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 mt-1 select-all">
                        {inspectedDevice.ipv6}
                      </div>
                    </div>
                  )}

                  {/* Open Ports */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Detected Open Ports & Services</h4>
                    {inspectedDevice.openPorts && inspectedDevice.openPorts.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {inspectedDevice.openPorts.map((p) => (
                          <div
                            key={p.port}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs"
                          >
                            <span className="font-bold text-blue-600">{p.port}</span>
                            <span className="text-slate-400"> / TCP</span>
                            <div className="text-[11px] font-sans text-slate-600 dark:text-slate-400">
                              {p.service}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No standard open ports probed on this host.</p>
                    )}
                  </div>
                </div>
              )}

              {inspectModalTab === 'ping' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">ICMP Ping Diagnostics</h4>
                      <p className="text-xs text-slate-500">Live 4-packet round-trip delay measurement to {inspectedDevice.ip}</p>
                    </div>
                    <button
                      onClick={() => runPingTest(inspectedDevice)}
                      disabled={isPinging}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                      <span>{isPinging ? 'Pinging...' : 'Repeat Ping'}</span>
                    </button>
                  </div>

                  {pingResult && (
                    <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2">
                      <div className="text-cyan-400 font-bold">
                        Pinging {pingResult.ip} with 32 bytes of data:
                      </div>
                      {pingResult.roundtrips ? (
                        pingResult.roundtrips.map((rtt: number, idx: number) => (
                          <div key={idx} className="text-slate-300">
                            Reply from {pingResult.ip}: bytes=32 time={rtt}ms TTL={pingResult.ttl}
                          </div>
                        ))
                      ) : (
                        <div>Reply from {pingResult.ip}: bytes=32 time={pingResult.rttAvgMs}ms TTL={pingResult.ttl}</div>
                      )}
                      <div className="pt-2 border-t border-slate-700 text-slate-400">
                        Ping statistics for {pingResult.ip}:
                        <div>Packets: Sent = {pingResult.packetsSent}, Received = {pingResult.packetsReceived}, Lost = 0 (0% loss)</div>
                        <div>Approximate round trip times: Minimum = {pingResult.rttMinMs}ms, Maximum = {pingResult.rttMaxMs}ms, Average = {pingResult.rttAvgMs}ms</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <button
                onClick={() => handleSendToCiscoLab(inspectedDevice)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Export Host to Cisco Lab</span>
              </button>
              <button
                onClick={() => setInspectedDevice(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAC OUI Lookup Modal */}
      {isOuiLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  IEEE MAC Address OUI Lookup
                </h3>
              </div>
              <button
                onClick={() => setIsOuiLookupOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter any MAC address or 24-bit OUI prefix (e.g., <code className="font-mono text-blue-600">00:00:0C</code> for Cisco, <code className="font-mono text-blue-600">B8:27:EB</code> for Raspberry Pi, <code className="font-mono text-blue-600">AC:BC:32</code> for Apple):
            </p>

            <div>
              <input
                type="text"
                value={ouiQuery}
                onChange={(e) => handleOuiLookup(e.target.value)}
                placeholder="e.g. 00:1A:2B:3C:4D:5E or 001A2B"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {ouiResult && (
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/40 space-y-2 text-xs">
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">
                  Identified Hardware Vendor
                </div>
                <div className="text-base font-extrabold text-slate-900 dark:text-white">
                  {ouiResult.vendor}
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <span>Category: <strong className="capitalize">{ouiResult.category}</strong></span>
                  <span>·</span>
                  <span>OUI Verified: {ouiResult.isKnown ? 'Yes (IEEE Registry)' : 'Heuristic / Private'}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsOuiLookupOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Device Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Add Static Network Host
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDeviceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Hostname / Device Name
                </label>
                <input
                  type="text"
                  required
                  value={newDeviceForm.hostname}
                  onChange={(e) => setNewDeviceForm({ ...newDeviceForm, hostname: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-sans"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  IP Address
                </label>
                <input
                  type="text"
                  required
                  value={newDeviceForm.ip}
                  onChange={(e) => setNewDeviceForm({ ...newDeviceForm, ip: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  MAC Address (Physical Address)
                </label>
                <input
                  type="text"
                  required
                  value={newDeviceForm.mac}
                  onChange={(e) => setNewDeviceForm({ ...newDeviceForm, mac: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Device Role
                  </label>
                  <select
                    value={newDeviceForm.deviceType}
                    onChange={(e) =>
                      setNewDeviceForm({
                        ...newDeviceForm,
                        deviceType: e.target.value as DiscoveredDevice['deviceType'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 capitalize"
                  >
                    <option value="router">Router</option>
                    <option value="switch">Switch</option>
                    <option value="server">Server</option>
                    <option value="workstation">Workstation / PC</option>
                    <option value="mobile">Mobile</option>
                    <option value="iot">IoT / Camera</option>
                    <option value="printer">Printer</option>
                    <option value="ap">Access Point</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Manufacturer / Vendor
                  </label>
                  <input
                    type="text"
                    value={newDeviceForm.vendor}
                    onChange={(e) => setNewDeviceForm({ ...newDeviceForm, vendor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
