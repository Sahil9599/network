export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  provider: string;
  token: string;
  createdAt: number;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  createdAt: number;
  lastUsed?: number;
  rateLimit: number;
}

export interface MonitorItem {
  id: string;
  userId: string;
  name: string;
  url: string;
  interval: number;
  lastCheck?: {
    status: number;
    latencyMs: number;
    isUp: boolean;
    checkedAt: number;
  };
  history: Array<{ timestamp: number; latencyMs: number; isUp: boolean }>;
}

export interface DnsResultPayload {
  domain: string;
  queryDurationMs: number;
  records: Record<string, any>;
  errors?: Record<string, string>;
  timestamp: string;
}

export interface IpLookupPayload {
  query: string;
  ip: string;
  version: string;
  hostname: string | null;
  reverseDns: string | null;
  isPrivate: boolean;
  isLoopback: boolean;
  isLinkLocal: boolean;
  status: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  organization: string;
  asn: string;
  gatewayIp?: string;
  timestamp: string;
}

export interface UptimePayload {
  url: string;
  host: string;
  protocol: string;
  isUp: boolean;
  statusCode: number;
  statusMessage?: string;
  timing: {
    dnsMs?: number;
    tcpConnectMs?: number;
    tlsHandshakeMs?: number;
    ttfbMs?: number;
    totalMs: number;
  };
  headers?: {
    server: string;
    contentType: string;
    contentLength: string;
    cacheControl: string;
    strictTransportSecurity: boolean;
    contentSecurityPolicy: boolean;
    xFrameOptions: string;
  };
  ssl?: {
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    daysRemaining: number;
    fingerprint?: string;
    bits?: number;
  };
  error?: string;
  checkedAt: string;
}

export interface PortCheckResult {
  port: number;
  service: string;
  state: 'open' | 'closed' | 'filtered';
  latencyMs: number;
}

export interface TracerouteHop {
  hop: number;
  ip: string;
  hostname: string;
  location: string;
  asn: string;
  rtt1: number;
  rtt2: number;
  rtt3: number;
  status: string;
}

export interface CiscoInterface {
  name: string;
  ip?: string;
  mask?: string;
  isUp: boolean;
  connectedToDeviceId?: string;
  connectedToInterface?: string;
  vlan?: number;
  mac: string;
}

export interface CiscoRoute {
  network: string;
  mask: string;
  nextHop: string;
  interface?: string;
}

export interface CiscoDevice {
  id: string;
  name: string;
  hostname: string;
  type: 'router' | 'switch' | 'pc' | 'server';
  model: string;
  x: number;
  y: number;
  interfaces: Record<string, CiscoInterface>;
  gateway?: string;
  dnsServer?: string;
  routes: CiscoRoute[];
  vlans: Record<number, string>;
  cliHistory: string[];
  cliMode: 'user' | 'priv' | 'config' | 'config-if';
  currentInterface?: string;
}

export interface CiscoLink {
  id: string;
  fromDeviceId: string;
  fromInterface: string;
  toDeviceId: string;
  toInterface: string;
  cableType: 'straight' | 'crossover' | 'serial';
  status: 'up' | 'down';
}

export interface SimulationPacket {
  id: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  sourceIp: string;
  targetIp: string;
  protocol: 'ICMP' | 'ARP';
  status: 'in-transit' | 'successful' | 'failed';
  currentDeviceIndex: number;
  path: string[];
  currentHop: { from: string; to: string };
  details: {
    layer2: { srcMac: string; dstMac: string; type: string };
    layer3: { srcIp: string; dstIp: string; ttl: number; protocol: string };
    layer4: { type: string; code: number };
  };
}

export interface PracticeLabTask {
  id: string;
  text: string;
  hint: string;
  check: (devices: CiscoDevice[], links: CiscoLink[]) => boolean;
}

export interface PracticeLab {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'CCNA Pro';
  category: string;
  description: string;
  topologySummary: string;
  tasks: PracticeLabTask[];
  initialDevices: CiscoDevice[];
  initialLinks: CiscoLink[];
}

export interface DiscoveredDevice {
  id: string;
  ip: string;
  ipv6?: string;
  mac: string;
  macCiscoFormat?: string;
  hostname: string;
  vendor: string;
  deviceType: 'router' | 'switch' | 'server' | 'workstation' | 'mobile' | 'iot' | 'printer' | 'ap';
  status: 'online' | 'offline' | 'idle';
  latencyMs: number;
  openPorts: Array<{ port: number; service: string }>;
  networkInterface: string;
  subnetMask: string;
  firstSeen: number;
  lastSeen: number;
  isGateway?: boolean;
  isSelf?: boolean;
  packetLoss?: number;
  ttl?: number;
  notes?: string;
}

export interface NetworkScanSummary {
  subnet: string;
  netmask: string;
  gatewayIp: string;
  totalScanned: number;
  activeCount: number;
  idleCount: number;
  offlineCount: number;
  scanDurationMs: number;
  scannedAt: number;
}

export type ActiveToolTab =
  | 'cisco-sim'
  | 'subnet'
  | 'device-scanner'
  | 'dashboard';
