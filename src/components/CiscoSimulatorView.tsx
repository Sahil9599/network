import React, { useState, useEffect, useRef } from 'react';
import { CiscoDevice, CiscoLink, PracticeLab, SimulationPacket } from '../types';
import { CISCO_PRACTICE_LABS } from '../utils/ciscoLabs';
import { executeCiscoCommand } from '../utils/ciscoEngine';
import { jsPDF } from 'jspdf';
import {
  Terminal,
  Network,
  RotateCcw,
  CheckCircle2,
  Circle,
  HelpCircle,
  Play,
  Pause,
  Send,
  Layers,
  Server,
  Monitor,
  Laptop,
  Cpu,
  Download,
  Award,
  ChevronRight,
  ShieldCheck,
  Zap,
  Info,
  Maximize2,
  X,
} from 'lucide-react';

export const CiscoSimulatorView: React.FC = () => {
  const [selectedLabId, setSelectedLabId] = useState<string>('lab-1-basics');
  const currentLab: PracticeLab =
    CISCO_PRACTICE_LABS.find((l) => l.id === selectedLabId) || CISCO_PRACTICE_LABS[0];

  // Device & link state initialized from current lab
  const [devices, setDevices] = useState<CiscoDevice[]>(() =>
    JSON.parse(JSON.stringify(currentLab.initialDevices))
  );
  const [links, setLinks] = useState<CiscoLink[]>(() =>
    JSON.parse(JSON.stringify(currentLab.initialLinks))
  );

  // Active inspected device modal
  const [selectedDevice, setSelectedDevice] = useState<CiscoDevice | null>(null);
  const [modalTab, setModalTab] = useState<'cli' | 'config' | 'physical'>('cli');

  // CLI state for active device
  const [cliInput, setCliInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<Record<string, string[]>>({});

  // Simulation mode & active animation packet
  const [simMode, setSimMode] = useState<'realtime' | 'simulation'>('realtime');
  const [activePacket, setActivePacket] = useState<SimulationPacket | null>(null);
  const [eventList, setEventList] = useState<Array<{ time: string; from: string; to: string; type: string; status: string }>>([]);

  // Lab task completion status
  const [taskStatus, setTaskStatus] = useState<Record<string, boolean>>({});
  const [expandedHint, setExpandedHint] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Reinitialize when lab changes
  useEffect(() => {
    const lab = CISCO_PRACTICE_LABS.find((l) => l.id === selectedLabId) || CISCO_PRACTICE_LABS[0];
    setDevices(JSON.parse(JSON.stringify(lab.initialDevices)));
    setLinks(JSON.parse(JSON.stringify(lab.initialLinks)));
    setSelectedDevice(null);
    setEventList([]);
    setActivePacket(null);
    setTerminalHistory({});
  }, [selectedLabId]);

  // Evaluate lab tasks on every devices/links update
  useEffect(() => {
    const statusMap: Record<string, boolean> = {};
    currentLab.tasks.forEach((task) => {
      try {
        statusMap[task.id] = task.check(devices, links);
      } catch {
        statusMap[task.id] = false;
      }
    });
    setTaskStatus(statusMap);
  }, [devices, links, currentLab]);

  // Auto scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory, selectedDevice]);

  // Handle command submission
  const handleSendCommand = (cmdToRun?: string) => {
    if (!selectedDevice) return;
    const input = cmdToRun !== undefined ? cmdToRun : cliInput;
    if (!input && cmdToRun === undefined) return;

    const devId = selectedDevice.id;
    const history = terminalHistory[devId] || [
      `Cisco IOS Software, ${selectedDevice.model}`,
      `Press RETURN to get started!`,
      '',
    ];

    // Determine current prompt string
    let prompt = '';
    if (selectedDevice.type === 'pc' || selectedDevice.type === 'server') {
      prompt = `C:\\>`;
    } else {
      if (selectedDevice.cliMode === 'user') prompt = `${selectedDevice.hostname}>`;
      else if (selectedDevice.cliMode === 'priv') prompt = `${selectedDevice.hostname}#`;
      else if (selectedDevice.cliMode === 'config') prompt = `${selectedDevice.hostname}(config)#`;
      else if (selectedDevice.cliMode === 'config-if') prompt = `${selectedDevice.hostname}(config-if)#`;
    }

    const { updatedDevice, updatedLinks, output, packetEvent } = executeCiscoCommand(
      selectedDevice,
      devices,
      links,
      input
    );

    // Update terminal output lines
    const newLines = [...history, `${prompt} ${input}`, ...output];
    setTerminalHistory((prev) => ({ ...prev, [devId]: newLines }));

    // Update device list
    setDevices((prev) => prev.map((d) => (d.id === devId ? updatedDevice : d)));
    setLinks(updatedLinks);
    setSelectedDevice(updatedDevice);
    setCliInput('');

    // If a packet / ping event occurred, animate simulation packet!
    if (packetEvent && packetEvent.path.length > 1) {
      animatePacketSimulation(packetEvent.path, packetEvent.targetIp, packetEvent.success);
    }
  };

  const animatePacketSimulation = (path: string[], targetIp: string, success: boolean) => {
    const srcDev = devices.find((d) => d.id === path[0]);
    const dstDev = devices.find((d) => d.id === path[path.length - 1]);

    const packet: SimulationPacket = {
      id: 'p_' + Date.now(),
      sourceDeviceId: path[0],
      targetDeviceId: path[path.length - 1],
      sourceIp: Object.values(srcDev?.interfaces || {}).find((i) => i.ip)?.ip || '192.168.1.10',
      targetIp,
      protocol: 'ICMP',
      status: success ? 'in-transit' : 'failed',
      currentDeviceIndex: 0,
      path,
      currentHop: { from: path[0], to: path[1] || path[0] },
      details: {
        layer2: {
          srcMac: Object.values(srcDev?.interfaces || {})[0]?.mac || '00E0.F72B.0001',
          dstMac: Object.values(dstDev?.interfaces || {})[0]?.mac || '0001.42A1.0001',
          type: '0x0800 (IPv4)',
        },
        layer3: {
          srcIp: Object.values(srcDev?.interfaces || {}).find((i) => i.ip)?.ip || '192.168.1.10',
          dstIp: targetIp,
          ttl: 128,
          protocol: '1 (ICMP)',
        },
        layer4: {
          type: 'Echo (Ping) Request',
          code: 0,
        },
      },
    };

    setActivePacket(packet);

    // Add to simulation event list
    setEventList((prev) => [
      {
        time: new Date().toLocaleTimeString(),
        from: srcDev?.name || path[0],
        to: dstDev?.name || path[path.length - 1],
        type: 'ICMP Echo',
        status: success ? 'Successful' : 'Failed',
      },
      ...prev.slice(0, 7),
    ]);

    // Animate across hops
    let hop = 0;
    const interval = setInterval(() => {
      hop++;
      if (hop < path.length) {
        setActivePacket((prev) =>
          prev
            ? {
                ...prev,
                currentDeviceIndex: hop,
                currentHop: { from: path[hop - 1], to: path[hop] },
              }
            : null
        );
      } else {
        clearInterval(interval);
        setTimeout(() => setActivePacket(null), 1400);
      }
    }, 800);
  };

  const handleResetLab = () => {
    setDevices(JSON.parse(JSON.stringify(currentLab.initialDevices)));
    setLinks(JSON.parse(JSON.stringify(currentLab.initialLinks)));
    setTerminalHistory({});
    setSelectedDevice(null);
  };

  const handleExportLabReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 34, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('CISCO PACKET TRACER // LAB COMPLETION AUDIT', 14, 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Lab: ${currentLab.title} (${currentLab.difficulty}) | Generated: ${new Date().toUTCString()}`, 14, 25);

    let y = 46;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CCNA Task Assessment Checklist:', 14, y);
    y += 8;

    currentLab.tasks.forEach((t, i) => {
      const isPassed = taskStatus[t.id];
      doc.setFont('helvetica', isPassed ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.setTextColor(isPassed ? 16 : 100, isPassed ? 120 : 100, isPassed ? 50 : 100);
      doc.text(`[${isPassed ? 'PASSED' : 'INCOMPLETE'}] Task ${i + 1}: ${t.text}`, 18, y);
      y += 6.5;
    });

    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Device Running Configurations:', 14, y);
    y += 8;

    devices.forEach((d) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${d.name} (${d.model}):`, 18, y);
      y += 5.5;

      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);

      Object.values(d.interfaces).forEach((ifc) => {
        doc.text(`- ${ifc.name}: IP ${ifc.ip || 'unassigned'} ${ifc.mask || ''} [${ifc.isUp ? 'UP' : 'SHUTDOWN'}]`, 22, y);
        y += 4.5;
      });
      if (d.gateway) {
        doc.text(`- Default Gateway: ${d.gateway}`, 22, y);
        y += 4.5;
      }
      y += 3;
    });

    doc.save(`Cisco_Lab_${currentLab.id}_Report.pdf`);
  };

  const completedTaskCount = Object.values(taskStatus).filter(Boolean).length;
  const progressPct = Math.round((completedTaskCount / currentLab.tasks.length) * 100);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Lab Selector */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-500" />
              Cisco Packet Tracer Network Simulator & Practice Labs
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              CCNA Interactive
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authentic Cisco IOS CLI, packet flow visualization, router/switch configuration, and automated task evaluation.
          </p>
        </div>

        {/* Lab Dropdown & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedLabId}
            onChange={(e) => setSelectedLabId(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CISCO_PRACTICE_LABS.map((lab) => (
              <option key={lab.id} value={lab.id}>
                {lab.title} ({lab.difficulty})
              </option>
            ))}
          </select>

          <button
            onClick={handleResetLab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Reset topology to default state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Lab</span>
          </button>

          <button
            onClick={handleExportLabReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Lab Tasks & Progress Card */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {currentLab.category}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {currentLab.difficulty}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              {currentLab.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {currentLab.description}
            </p>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <div className="text-xs font-mono text-slate-500">
              Tasks: <span className="font-bold text-slate-900 dark:text-white">{completedTaskCount}</span> / {currentLab.tasks.length}
            </div>
            <div className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {progressPct}% Completed
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Task Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
          {currentLab.tasks.map((task, i) => {
            const isCompleted = taskStatus[task.id];
            const isHintOpen = expandedHint === task.id;
            return (
              <div
                key={task.id}
                className={`p-3 rounded-lg border transition-all text-xs ${
                  isCompleted
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <span className="font-medium leading-snug">
                      Step {i + 1}: {task.text}
                    </span>
                  </div>

                  <button
                    onClick={() => setExpandedHint(isHintOpen ? null : task.id)}
                    className="text-slate-400 hover:text-blue-500 shrink-0 p-0.5"
                    title="View CLI hint"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isHintOpen && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 font-mono text-[11px] text-blue-600 dark:text-blue-400">
                    💡 Hint: {task.hint}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {progressPct === 100 && (
          <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 animate-fadeIn font-semibold">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <span>Congratulations! All tasks verified and CCNA lab objectives satisfied.</span>
            </div>
            <button
              onClick={handleExportLabReport}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Export PDF
            </button>
          </div>
        )}
      </div>

      {/* TOPOLOGY CANVAS & INTERACTIVE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Cisco Topology Viewport */}
        <div className="lg:col-span-8 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Interactive Cisco Packet Tracer Workspace
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Click any device to open Cisco IOS CLI or IP Config
            </span>
          </div>

          {/* Canvas Area with SVG Links and Device Nodes */}
          <div className="relative w-full h-[440px] rounded-xl bg-slate-950 border border-slate-800 overflow-hidden select-none">
            {/* Grid background dots */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

            {/* SVG Cable Links */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {links.map((link) => {
                const fromDev = devices.find((d) => d.id === link.fromDeviceId);
                const toDev = devices.find((d) => d.id === link.toDeviceId);
                if (!fromDev || !toDev) return null;

                const isUp = link.status === 'up';
                const strokeColor = isUp ? '#10b981' : '#f43f5e'; // emerald or rose

                const midX = (fromDev.x + toDev.x) / 2;
                const midY = (fromDev.y + toDev.y) / 2;

                return (
                  <g key={link.id}>
                    {/* Cable Line */}
                    <line
                      x1={fromDev.x}
                      y1={fromDev.y}
                      x2={toDev.x}
                      y2={toDev.y}
                      stroke={strokeColor}
                      strokeWidth={link.cableType === 'serial' ? '3' : '2'}
                      strokeDasharray={link.cableType === 'crossover' ? '5,5' : undefined}
                      className="transition-colors duration-300"
                    />

                    {/* From Port Link LED */}
                    <circle
                      cx={fromDev.x + (toDev.x - fromDev.x) * 0.18}
                      cy={fromDev.y + (toDev.y - fromDev.y) * 0.18}
                      r="4"
                      fill={isUp ? '#10b981' : '#f43f5e'}
                    />

                    {/* To Port Link LED */}
                    <circle
                      cx={toDev.x + (fromDev.x - toDev.x) * 0.18}
                      cy={toDev.y + (fromDev.y - toDev.y) * 0.18}
                      r="4"
                      fill={isUp ? '#10b981' : '#f43f5e'}
                    />

                    {/* Port Name Labels */}
                    <text
                      x={fromDev.x + (toDev.x - fromDev.x) * 0.25}
                      y={fromDev.y + (toDev.y - fromDev.y) * 0.25 - 6}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {link.fromInterface}
                    </text>
                    <text
                      x={toDev.x + (fromDev.x - toDev.x) * 0.25}
                      y={toDev.y + (fromDev.y - toDev.y) * 0.25 - 6}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {link.toInterface}
                    </text>
                  </g>
                );
              })}

              {/* Animated PDU Envelope */}
              {activePacket && (
                <circle
                  cx={
                    devices.find((d) => d.id === activePacket.currentHop.from)?.x || 200
                  }
                  cy={
                    devices.find((d) => d.id === activePacket.currentHop.from)?.y || 200
                  }
                  r="8"
                  fill="#3b82f6"
                  className="animate-pulse"
                />
              )}
            </svg>

            {/* Interactive Devices */}
            {devices.map((dev) => {
              const isSelected = selectedDevice?.id === dev.id;
              // Extract primary active IP
              const primaryIp =
                Object.values(dev.interfaces).find((i) => i.ip)?.ip ||
                (dev.type === 'switch' ? 'Layer 2 Switch' : 'Unassigned');

              return (
                <div
                  key={dev.id}
                  onClick={() => setSelectedDevice(dev)}
                  style={{ left: `${dev.x}px`, top: `${dev.y}px` }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group flex flex-col items-center transition-transform hover:scale-110 ${
                    isSelected ? 'scale-110 z-20' : 'z-10'
                  }`}
                >
                  {/* Device Icon Circle */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                      isSelected
                        ? 'ring-4 ring-blue-500 bg-slate-900 text-blue-400'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {dev.type === 'router' && <Network className="w-7 h-7 text-cyan-400" />}
                    {dev.type === 'switch' && <Cpu className="w-7 h-7 text-indigo-400" />}
                    {dev.type === 'pc' && <Monitor className="w-7 h-7 text-emerald-400" />}
                    {dev.type === 'server' && <Server className="w-7 h-7 text-purple-400" />}
                  </div>

                  {/* Device Label */}
                  <div className="mt-1.5 px-2 py-0.5 rounded bg-slate-900/95 border border-slate-800 text-center font-mono shadow-sm">
                    <div className="text-[11px] font-bold text-white leading-tight">
                      {dev.name}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate max-w-[110px]">
                      {primaryIp}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Real-time Legend Bar */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Link UP (Forwarding)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Link DOWN (Shutdown)</span>
              </span>
            </div>
            <span>Topology: {currentLab.topologySummary}</span>
          </div>
        </div>

        {/* Side Panel: Packet Simulation Events & Quick Actions */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick PDU Ping Injector */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-500" />
              Quick ICMP Ping Probe
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => {
                  const pc = devices.find((d) => d.type === 'pc');
                  const r = devices.find((d) => d.type === 'router');
                  const targetIp = Object.values(r?.interfaces || {}).find((i) => i.ip)?.ip || '192.168.1.1';
                  if (pc) {
                    setSelectedDevice(pc);
                    setModalTab('cli');
                    handleSendCommand(`ping ${targetIp}`);
                  }
                }}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 text-left flex items-center justify-between transition-colors"
              >
                <span>Ping Default Gateway</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  const pc = devices.find((d) => d.type === 'pc');
                  const srv = devices.find((d) => d.type === 'server');
                  const targetIp = Object.values(srv?.interfaces || {}).find((i) => i.ip)?.ip || '172.16.50.100';
                  if (pc) {
                    setSelectedDevice(pc);
                    setModalTab('cli');
                    handleSendCommand(`ping ${targetIp}`);
                  }
                }}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-left flex items-center justify-between transition-colors"
              >
                <span>Ping Remote Server Farm</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Simulation Event List (Packet Tracer Event List) */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-500">
                Simulation Event List
              </h3>
              <span className="text-[10px] text-slate-400">PDU Tracker</span>
            </div>

            {eventList.length === 0 ? (
              <div className="text-slate-400 text-center py-6 text-xs font-sans">
                No packet events recorded yet. Click a device or inject a ping!
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {eventList.map((evt, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {evt.from} → {evt.to}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">{evt.type}</div>
                    </div>
                    <span
                      className={`font-bold ${
                        evt.status === 'Successful' ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DEVICE INSPECTOR / CISCO IOS MODAL */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-3xl h-[620px] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  {selectedDevice.type === 'router' && <Network className="w-4 h-4" />}
                  {selectedDevice.type === 'switch' && <Cpu className="w-4 h-4" />}
                  {selectedDevice.type === 'pc' && <Monitor className="w-4 h-4" />}
                  {selectedDevice.type === 'server' && <Server className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedDevice.name} ({selectedDevice.model})
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Mode: {selectedDevice.cliMode} · Hostname: {selectedDevice.hostname}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2">
                <div className="flex p-0.5 bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setModalTab('cli')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      modalTab === 'cli'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {selectedDevice.type === 'pc' || selectedDevice.type === 'server' ? 'Command Prompt' : 'CLI (IOS)'}
                  </button>
                  <button
                    onClick={() => setModalTab('config')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      modalTab === 'config'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    IP Config
                  </button>
                </div>

                <button
                  onClick={() => setSelectedDevice(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* TAB 1: CISCO IOS TERMINAL */}
            {modalTab === 'cli' && (
              <div className="flex-1 flex flex-col bg-slate-950 text-emerald-400 font-mono text-xs overflow-hidden">
                {/* Terminal Output Window */}
                <div className="flex-1 p-4 overflow-y-auto space-y-1 scrollbar-thin">
                  {(terminalHistory[selectedDevice.id] || [
                    `Cisco IOS Software, ${selectedDevice.model}`,
                    `Press RETURN to get started!`,
                    ``,
                  ]).map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap leading-relaxed">
                      {line}
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>

                {/* Quick IOS Command Shortcuts Toolbar */}
                <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/90 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="text-slate-400 mr-1 self-center">Shortcuts:</span>
                  {(selectedDevice.type === 'pc' || selectedDevice.type === 'server'
                    ? ['ipconfig', 'ipconfig /all', 'ping 192.168.1.1', 'ping 172.16.50.100']
                    : ['enable', 'configure terminal', 'int g0/0', 'no shutdown', 'show ip int brief', 'show ip route', 'show running-config', 'exit']
                  ).map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => handleSendCommand(cmd)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>

                {/* CLI Input Prompt */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendCommand();
                  }}
                  className="p-3 border-t border-slate-800 bg-slate-900 flex items-center gap-2"
                >
                  <span className="text-cyan-400 font-bold shrink-0">
                    {selectedDevice.type === 'pc' || selectedDevice.type === 'server'
                      ? 'C:\\>'
                      : selectedDevice.cliMode === 'user'
                      ? `${selectedDevice.hostname}>`
                      : selectedDevice.cliMode === 'priv'
                      ? `${selectedDevice.hostname}#`
                      : selectedDevice.cliMode === 'config'
                      ? `${selectedDevice.hostname}(config)#`
                      : `${selectedDevice.hostname}(config-if)#`}
                  </span>
                  <input
                    type="text"
                    value={cliInput}
                    onChange={(e) => setCliInput(e.target.value)}
                    placeholder="Type command and press Enter (e.g. enable, conf t, ip address...)"
                    autoFocus
                    className="flex-1 bg-transparent text-white focus:outline-none font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: GUI IP CONFIGURATION */}
            {modalTab === 'config' && (
              <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-white dark:bg-slate-900 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                    Interface Settings & Addressing
                  </h4>
                  <p className="text-slate-500">
                    Configure FastEthernet and GigabitEthernet interfaces or edit default gateways.
                  </p>
                </div>

                {/* Interfaces list */}
                <div className="space-y-4">
                  {Object.entries(selectedDevice.interfaces).map(([key, ifc]) => (
                    <div
                      key={key}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          {ifc.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ifc.isUp
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            Port Status: {ifc.isUp ? 'ON' : 'OFF'}
                          </span>
                          <button
                            onClick={() => {
                              // Toggle Port Status
                              const updatedDev = { ...selectedDevice };
                              updatedDev.interfaces[key].isUp = !ifc.isUp;
                              setSelectedDevice(updatedDev);
                              setDevices(devices.map((d) => (d.id === updatedDev.id ? updatedDev : d)));
                              // update link
                              setLinks(
                                links.map((l) => {
                                  if (
                                    (l.fromDeviceId === updatedDev.id && l.fromInterface === key) ||
                                    (l.toDeviceId === updatedDev.id && l.toInterface === key)
                                  ) {
                                    return { ...l, status: updatedDev.interfaces[key].isUp ? 'up' : 'down' };
                                  }
                                  return l;
                                })
                              );
                            }}
                            className="px-2.5 py-1 text-[11px] rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 font-semibold"
                          >
                            Toggle Port
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-500 mb-1">IPv4 Address</label>
                          <input
                            type="text"
                            value={ifc.ip || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updatedDev = { ...selectedDevice };
                              updatedDev.interfaces[key].ip = val;
                              setSelectedDevice(updatedDev);
                              setDevices(devices.map((d) => (d.id === updatedDev.id ? updatedDev : d)));
                            }}
                            placeholder="e.g. 192.168.1.1"
                            className="w-full px-3 py-1.5 font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-500 mb-1">Subnet Mask</label>
                          <input
                            type="text"
                            value={ifc.mask || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updatedDev = { ...selectedDevice };
                              updatedDev.interfaces[key].mask = val;
                              setSelectedDevice(updatedDev);
                              setDevices(devices.map((d) => (d.id === updatedDev.id ? updatedDev : d)));
                            }}
                            placeholder="e.g. 255.255.255.0"
                            className="w-full px-3 py-1.5 font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Gateway for PCs/Servers */}
                  {(selectedDevice.type === 'pc' || selectedDevice.type === 'server') && (
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Default Gateway Configuration
                      </span>
                      <div>
                        <label className="block text-slate-500 mb-1">Default Gateway IP</label>
                        <input
                          type="text"
                          value={selectedDevice.gateway || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updatedDev = { ...selectedDevice, gateway: val };
                            setSelectedDevice(updatedDev);
                            setDevices(devices.map((d) => (d.id === updatedDev.id ? updatedDev : d)));
                          }}
                          placeholder="e.g. 192.168.1.1"
                          className="w-full px-3 py-1.5 font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
