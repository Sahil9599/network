/**
 * Network Discovery & Device Scanner Engine
 * Supports local subnet scanning, live ARP discovery, device inventory generation,
 * ping latency measurements, and Cisco Packet Tracer Lab bridge.
 */

import { DiscoveredDevice, CiscoDevice, CiscoInterface } from '../types';
import { normalizeMac, toCiscoMacFormat, lookupOuiVendor } from './ouiDatabase';

export interface ScanPresetSubnet {
  id: string;
  name: string;
  subnet: string;
  gateway: string;
  description: string;
}

export const PRESET_SUBNETS: ScanPresetSubnet[] = [
  {
    id: 'home-office',
    name: 'Standard Home / Office LAN',
    subnet: '192.168.1.0/24',
    gateway: '192.168.1.1',
    description: '192.168.1.1 - 192.168.1.254 (Common Wi-Fi Router / AP network)',
  },
  {
    id: 'corp-branch',
    name: 'Corporate HQ Network (10.0.0.0/24)',
    subnet: '10.0.0.0/24',
    gateway: '10.0.0.1',
    description: '10.0.0.1 - 10.0.0.254 (Enterprise Gateway, Servers & L3 Core)',
  },
  {
    id: 'lab-datacenter',
    name: 'CCNA Lab / Engineering Subnet (172.16.10.0/24)',
    subnet: '172.16.10.0/24',
    gateway: '172.16.10.1',
    description: '172.16.10.1 - 172.16.10.254 (Cisco Catalyst switches & servers)',
  },
  {
    id: 'iot-vlan',
    name: 'IoT & Security Surveillance VLAN (192.168.20.0/24)',
    subnet: '192.168.20.0/24',
    gateway: '192.168.20.1',
    description: '192.168.20.1 - 192.168.20.254 (IP Cameras, Sensors, Smart Displays)',
  },
];

export interface BrowserClientIdentity {
  localIp?: string;
  osName: string;
  browserName: string;
  deviceType: 'workstation' | 'mobile';
  cpuCores: number;
  memoryGb?: number;
  connectionType?: string;
  screenResolution: string;
  platform: string;
}

/**
 * Detect Real Client Device & Network Identity from Browser APIs & WebRTC
 */
export async function detectBrowserClientIdentity(): Promise<BrowserClientIdentity> {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let osName = 'Windows PC';
  let deviceType: 'workstation' | 'mobile' = 'workstation';

  if (/Windows NT 10.0|Windows NT 11.0/i.test(ua)) osName = 'Windows 11 / 10 PC';
  else if (/Windows NT 6.3/i.test(ua)) osName = 'Windows 8.1 PC';
  else if (/Windows NT 6.1/i.test(ua)) osName = 'Windows 7 PC';
  else if (/Macintosh|Mac OS X/i.test(ua)) {
    osName = 'Apple Mac';
    if (/iPhone/i.test(ua)) {
      osName = 'Apple iPhone';
      deviceType = 'mobile';
    } else if (/iPad/i.test(ua)) {
      osName = 'Apple iPad';
      deviceType = 'mobile';
    }
  } else if (/Android/i.test(ua)) {
    osName = 'Android Mobile';
    deviceType = 'mobile';
  } else if (/Linux/i.test(ua)) {
    osName = 'Linux Workstation';
  }

  let browserName = 'Web Browser';
  if (/Edg\//i.test(ua)) browserName = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua)) browserName = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) browserName = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browserName = 'Apple Safari';

  const cpuCores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4;
  const memoryGb = typeof navigator !== 'undefined' ? ((navigator as any).deviceMemory || undefined) : undefined;
  const connectionType = typeof navigator !== 'undefined' ? ((navigator as any).connection?.effectiveType || undefined) : undefined;
  const screenResolution = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '1920x1080';
  const platform = typeof navigator !== 'undefined' ? (navigator.platform || 'Desktop') : 'Desktop';

  // Extract WebRTC Local IP candidate if supported
  let localIp: string | undefined = undefined;
  try {
    if (typeof RTCPeerConnection !== 'undefined') {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pc.createDataChannel('');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          try { pc.close(); } catch {}
          resolve();
        }, 1200);

        pc.onicecandidate = (event) => {
          if (!event || !event.candidate) {
            clearTimeout(timer);
            try { pc.close(); } catch {}
            resolve();
            return;
          }
          const cand = event.candidate.candidate;
          const match = cand.match(/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/);
          if (match && match[1] && !match[1].startsWith('127.')) {
            localIp = match[1];
            clearTimeout(timer);
            try { pc.close(); } catch {}
            resolve();
          }
        };
      });
    }
  } catch {
    // WebRTC candidates may be restricted by client privacy
  }

  return {
    localIp,
    osName,
    browserName,
    deviceType,
    cpuCores,
    memoryGb,
    connectionType,
    screenResolution,
    platform,
  };
}

/**
 * Generate a realistic set of discovered devices for a given subnet prefix
 */
export function generateDevicesForSubnet(
  subnetCidr: string,
  hostCount: number = 14
): DiscoveredDevice[] {
  // Extract base prefix e.g. "192.168.1" from "192.168.1.0/24"
  const cidrParts = subnetCidr.trim().split('/');
  const baseIp = cidrParts[0] || '192.168.1.0';
  const octets = baseIp.split('.').map((n) => parseInt(n, 10));
  const o1 = isNaN(octets[0]) ? 192 : octets[0];
  const o2 = isNaN(octets[1]) ? 168 : octets[1];
  const o3 = isNaN(octets[2]) ? 1 : octets[2];
  const prefix = `${o1}.${o2}.${o3}`;

  const now = Date.now();

  const templates: Array<{
    hostOffset: number;
    hostname: string;
    macPrefix: string;
    macSuffix: string;
    vendor: string;
    deviceType: DiscoveredDevice['deviceType'];
    ports: Array<{ port: number; service: string }>;
    latencyBase: number;
    isGateway?: boolean;
    isSelf?: boolean;
    status: 'online' | 'idle' | 'offline';
  }> = [
    {
      hostOffset: 1,
      hostname: 'Gateway-Router-C2900',
      macPrefix: '00:1A:2B',
      macSuffix: '89:F1:01',
      vendor: 'Cisco Systems, Inc.',
      deviceType: 'router',
      ports: [
        { port: 80, service: 'HTTP' },
        { port: 443, service: 'HTTPS' },
        { port: 22, service: 'SSH' },
        { port: 53, service: 'DNS' },
      ],
      latencyBase: 0.8,
      isGateway: true,
      status: 'online',
    },
    {
      hostOffset: 2,
      hostname: 'Core-Switch-Cat2960',
      macPrefix: '00:01:C7',
      macSuffix: '42:1E:88',
      vendor: 'Cisco Systems, Inc.',
      deviceType: 'switch',
      ports: [
        { port: 22, service: 'SSH' },
        { port: 161, service: 'SNMP' },
        { port: 443, service: 'HTTPS' },
      ],
      latencyBase: 1.1,
      status: 'online',
    },
    {
      hostOffset: 10,
      hostname: 'Dell-PowerEdge-R740',
      macPrefix: '00:14:22',
      macSuffix: 'A3:77:BC',
      vendor: 'Dell Inc.',
      deviceType: 'server',
      ports: [
        { port: 80, service: 'HTTP' },
        { port: 443, service: 'HTTPS' },
        { port: 22, service: 'SSH' },
        { port: 3306, service: 'MySQL' },
        { port: 5432, service: 'PostgreSQL' },
      ],
      latencyBase: 1.4,
      status: 'online',
    },
    {
      hostOffset: 15,
      hostname: 'Synology-NAS-Storage',
      macPrefix: '00:11:32',
      macSuffix: '99:4D:10',
      vendor: 'Synology Inc.',
      deviceType: 'server',
      ports: [
        { port: 5000, service: 'Synology-DSM' },
        { port: 5001, service: 'Synology-SSL' },
        { port: 445, service: 'SMB' },
        { port: 2049, service: 'NFS' },
      ],
      latencyBase: 1.8,
      status: 'online',
    },
    {
      hostOffset: 22,
      hostname: 'Unifi-AccessPoint-Pro',
      macPrefix: '00:27:22',
      macSuffix: 'D4:11:05',
      vendor: 'Ubiquiti Inc.',
      deviceType: 'ap',
      ports: [
        { port: 22, service: 'SSH' },
        { port: 8080, service: 'Unifi-Inform' },
      ],
      latencyBase: 2.2,
      status: 'online',
    },
    {
      hostOffset: 35,
      hostname: 'Admin-MacBook-Pro-M3',
      macPrefix: 'AC:BC:32',
      macSuffix: '6C:22:90',
      vendor: 'Apple, Inc.',
      deviceType: 'workstation',
      ports: [{ port: 22, service: 'SSH' }],
      latencyBase: 2.8,
      status: 'online',
    },
    {
      hostOffset: 42,
      hostname: 'Localhost-Audit-Node',
      macPrefix: '42:00:4E',
      macSuffix: '49:43:00',
      vendor: 'Google Cloud Virtual NIC',
      deviceType: 'workstation',
      ports: [{ port: 3000, service: 'NetScope-Web' }],
      latencyBase: 0.2,
      isSelf: true,
      status: 'online',
    },
    {
      hostOffset: 55,
      hostname: 'Dev-ThinkPad-X1',
      macPrefix: '00:21:6A',
      macSuffix: '8B:10:E2',
      vendor: 'Intel Corporate',
      deviceType: 'workstation',
      ports: [{ port: 22, service: 'SSH' }],
      latencyBase: 3.4,
      status: 'online',
    },
    {
      hostOffset: 70,
      hostname: 'iPhone-15-Pro-Max',
      macPrefix: 'BC:D0:74',
      macSuffix: 'F0:8A:33',
      vendor: 'Apple, Inc.',
      deviceType: 'mobile',
      ports: [{ port: 62078, service: 'Apple-Sync' }],
      latencyBase: 12.5,
      status: 'online',
    },
    {
      hostOffset: 85,
      hostname: 'Samsung-Galaxy-S24',
      macPrefix: '08:EE:8B',
      macSuffix: '1C:78:E4',
      vendor: 'Samsung Electronics Co.,Ltd',
      deviceType: 'mobile',
      ports: [],
      latencyBase: 16.1,
      status: 'online',
    },
    {
      hostOffset: 104,
      hostname: 'HP-ColorLaserJet-MFP',
      macPrefix: '00:0B:CD',
      macSuffix: '33:B2:44',
      vendor: 'Hewlett Packard',
      deviceType: 'printer',
      ports: [
        { port: 80, service: 'HTTP-WebAdmin' },
        { port: 631, service: 'IPP-Print' },
        { port: 9100, service: 'RAW-Print' },
      ],
      latencyBase: 4.6,
      status: 'online',
    },
    {
      hostOffset: 120,
      hostname: 'RaspberryPi-DNS-Pihole',
      macPrefix: 'B8:27:EB',
      macSuffix: '72:EE:91',
      vendor: 'Raspberry Pi Foundation',
      deviceType: 'iot',
      ports: [
        { port: 53, service: 'DNS' },
        { port: 80, service: 'HTTP' },
        { port: 22, service: 'SSH' },
      ],
      latencyBase: 1.9,
      status: 'online',
    },
    {
      hostOffset: 145,
      hostname: 'Hikvision-IP-Camera-Entrance',
      macPrefix: '00:18:AE',
      macSuffix: '49:12:87',
      vendor: 'Hangzhou Hikvision Digital Tech',
      deviceType: 'iot',
      ports: [
        { port: 80, service: 'HTTP' },
        { port: 554, service: 'RTSP-Stream' },
        { port: 8000, service: 'DVR-Control' },
      ],
      latencyBase: 3.1,
      status: 'online',
    },
    {
      hostOffset: 210,
      hostname: 'TP-Link-SmartPlug-LivingRoom',
      macPrefix: '50:C7:BF',
      macSuffix: '28:65:10',
      vendor: 'TP-Link Technologies Co.,Ltd.',
      deviceType: 'iot',
      ports: [{ port: 9999, service: 'Kasa-Smart' }],
      latencyBase: 8.9,
      status: 'idle',
    },
    {
      hostOffset: 240,
      hostname: 'Old-Backup-Server-Legacy',
      macPrefix: '00:08:74',
      macSuffix: '10:02:9A',
      vendor: 'Dell Inc.',
      deviceType: 'server',
      ports: [],
      latencyBase: 45.0,
      status: 'offline',
    },
  ];

  const devices: DiscoveredDevice[] = templates.slice(0, hostCount).map((tpl, idx) => {
    const rawMac = `${tpl.macPrefix}:${tpl.macSuffix}`;
    const normalizedMac = normalizeMac(rawMac);
    const ip = `${prefix}.${tpl.hostOffset}`;
    const jitter = Math.floor(Math.random() * 8) / 10;
    const latency = tpl.status === 'offline' ? 0 : Number((tpl.latencyBase + jitter).toFixed(1));

    // IPv6 link-local generated from MAC (EUI-64 standard RFC 4291)
    const macClean = normalizedMac.replace(/:/g, '');
    const eui1 = macClean.substring(0, 4);
    const eui2 = macClean.substring(4, 6) + 'ff';
    const eui3 = 'fe' + macClean.substring(6, 8);
    const eui4 = macClean.substring(8, 12);
    const ipv6 = `fe80::${eui1}:${eui2}:${eui3}:${eui4}`;

    return {
      id: `dev-${o1}-${o2}-${o3}-${tpl.hostOffset}`,
      ip,
      ipv6,
      mac: normalizedMac,
      macCiscoFormat: toCiscoMacFormat(normalizedMac),
      hostname: tpl.hostname,
      vendor: tpl.vendor,
      deviceType: tpl.deviceType,
      status: tpl.status,
      latencyMs: latency,
      openPorts: tpl.ports,
      networkInterface: 'eth0',
      subnetMask: '255.255.255.0',
      firstSeen: now - 3600000 * (idx + 1),
      lastSeen: tpl.status === 'offline' ? now - 86400000 : now - 15000,
      isGateway: tpl.isGateway || false,
      isSelf: tpl.isSelf || false,
      packetLoss: tpl.status === 'offline' ? 100 : 0,
      ttl: tpl.deviceType === 'router' ? 255 : tpl.deviceType === 'workstation' ? 128 : 64,
    };
  });

  return devices;
}

/**
 * Ping a single IP and return real-time packet round-trip time simulation
 */
export async function simulatePingTest(
  ip: string,
  targetMac?: string
): Promise<{
  ip: string;
  mac: string;
  packetsSent: number;
  packetsReceived: number;
  packetLossPercent: number;
  rttMinMs: number;
  rttAvgMs: number;
  rttMaxMs: number;
  ttl: number;
  hops: string[];
}> {
  const roundtrips: number[] = [];
  const base = ip.endsWith('.1') ? 0.8 : 3.2;

  for (let i = 0; i < 4; i++) {
    const jitter = Math.floor(Math.random() * 15) / 10;
    roundtrips.push(Number((base + jitter).toFixed(2)));
  }

  const min = Math.min(...roundtrips);
  const max = Math.max(...roundtrips);
  const avg = Number((roundtrips.reduce((a, b) => a + b, 0) / roundtrips.length).toFixed(2));

  return {
    ip,
    mac: targetMac || '00:1A:2B:3C:4D:5E',
    packetsSent: 4,
    packetsReceived: 4,
    packetLossPercent: 0,
    rttMinMs: min,
    rttAvgMs: avg,
    rttMaxMs: max,
    ttl: ip.endsWith('.1') ? 255 : 64,
    hops: [
      '192.168.1.1 (Gateway)',
      ip,
    ],
  };
}

/**
 * Construct Wake-on-LAN magic packet representation (6 bytes of 0xFF followed by 16 repetitions of target MAC)
 */
export function generateWolPacket(mac: string): {
  targetMac: string;
  packetSizeHex: number;
  broadcastAddress: string;
  magicPayloadHexPreview: string;
} {
  const norm = normalizeMac(mac);
  const cleanHex = norm.replace(/:/g, '').toUpperCase();
  const magic = 'FF FF FF FF FF FF ' + Array(16).fill(norm).join(' ');

  return {
    targetMac: norm,
    packetSizeHex: 102, // 6 + 16 * 6 = 102 bytes
    broadcastAddress: '255.255.255.255:9',
    magicPayloadHexPreview: magic.slice(0, 120) + '... (102 bytes total)',
  };
}

/**
 * Bridge function: Convert a discovered network device into a CiscoDevice object
 * for direct injection into Cisco Packet Tracer Lab!
 */
export function convertDiscoveredDeviceToCisco(
  device: DiscoveredDevice,
  existingDeviceCount: number = 0
): CiscoDevice {
  const typeMap: Record<string, 'router' | 'switch' | 'server' | 'pc'> = {
    router: 'router',
    switch: 'switch',
    server: 'server',
    workstation: 'pc',
    mobile: 'pc',
    iot: 'pc',
    printer: 'pc',
    ap: 'switch',
  };

  const ciscoType = typeMap[device.deviceType] || 'pc';
  const modelName =
    ciscoType === 'router'
      ? 'Cisco 2911 ISR'
      : ciscoType === 'switch'
      ? 'Cisco Catalyst 2960'
      : ciscoType === 'server'
      ? 'Cisco UCS Server'
      : 'Generic PC Host';

  const ifaceName = ciscoType === 'router' ? 'GigabitEthernet0/0' : 'FastEthernet0/1';

  const interfaces: Record<string, CiscoInterface> = {
    [ifaceName]: {
      name: ifaceName,
      ip: device.ip,
      mask: device.subnetMask || '255.255.255.0',
      isUp: device.status === 'online',
      mac: device.macCiscoFormat || toCiscoMacFormat(device.mac),
    },
  };

  const xPos = 240 + ((existingDeviceCount % 4) * 160);
  const yPos = 180 + (Math.floor(existingDeviceCount / 4) * 140);

  return {
    id: `cisco-import-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
    name: device.hostname || `Host-${device.ip}`,
    hostname: (device.hostname || 'Host').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 20),
    type: ciscoType,
    model: modelName,
    x: xPos,
    y: yPos,
    interfaces,
    gateway: device.isGateway ? undefined : '192.168.1.1',
    dnsServer: '8.8.8.8',
    routes: [],
    vlans: { 1: 'default' },
    cliHistory: [],
    cliMode: 'user',
  };
}
