/**
 * Advanced IPv4 & IPv6 Subnet Engine with Classful Architecture & VLSM
 */

export interface IPv4SubnetResult {
  ip: string;
  cidr: number;
  netmask: string;
  wildcardMask: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableIp: string;
  lastUsableIp: string;
  usableHosts: number;
  totalAddresses: number;
  ipBinary: string[];
  maskBinary: string[];
  networkBitsCount: number;
  hostBitsCount: number;
  ipClass: 'A' | 'B' | 'C' | 'D' | 'E';
  classDetails: {
    name: string;
    range: string;
    defaultMask: string;
    defaultCidr: number;
    leadingBits: string;
    totalNetworks: string;
    hostsPerNetwork: string;
    purpose: string;
  };
  addressType: string;
  isPrivate: boolean;
  hexIp: string;
  inAddrArpa: string;
}

export interface IPv6SubnetResult {
  ip: string;
  compressedIp: string;
  expandedIp: string;
  cidr: number;
  networkPrefix: string;
  prefixLength: number;
  totalAddresses: string;
  possible64Subnets: string;
  scopeType: string;
  scopeDescription: string;
  rfcStandard: string;
  hextets: string[];
  binaryHextets: string[];
  globalRoutingPrefixBits: number;
  subnetBits: number;
  interfaceBits: number;
}

// Convert 32-bit integer to IPv4 string
export function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255,
  ].join('.');
}

// Convert IPv4 string to 32-bit unsigned int
export function ipToInt(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

// Format integer to 8-bit binary string
export function toByteBinary(val: number): string {
  return (val >>> 0).toString(2).padStart(8, '0');
}

// Get CIDR from subnet mask
export function maskToCidr(mask: string): number {
  const binary = mask
    .split('.')
    .map((o) => parseInt(o, 10).toString(2).padStart(8, '0'))
    .join('');
  return (binary.match(/1/g) || []).length;
}

// Get subnet mask from CIDR
export function cidrToMask(cidr: number): string {
  const maskInt = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  return intToIp(maskInt);
}

// Get Wildcard mask from CIDR
export function cidrToWildcard(cidr: number): string {
  const maskInt = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  const wildcardInt = (~maskInt) >>> 0;
  return intToIp(wildcardInt);
}

// Classful Architecture Reference
export const CLASSFUL_DATA = {
  A: {
    name: 'Class A',
    range: '0.0.0.0 - 127.255.255.255',
    defaultMask: '255.0.0.0',
    defaultCidr: 8,
    leadingBits: '0',
    totalNetworks: '128 (126 usable)',
    hostsPerNetwork: '16,777,214',
    purpose: 'Massive networks, Tier-1 backbones, historical Fortune 500 allocations',
  },
  B: {
    name: 'Class B',
    range: '128.0.0.0 - 191.255.255.255',
    defaultMask: '255.255.0.0',
    defaultCidr: 16,
    leadingBits: '10',
    totalNetworks: '16,384',
    hostsPerNetwork: '65,534',
    purpose: 'Medium-to-large enterprise networks, universities, regional ISPs',
  },
  C: {
    name: 'Class C',
    range: '192.0.0.0 - 223.255.255.255',
    defaultMask: '255.255.255.0',
    defaultCidr: 24,
    leadingBits: '110',
    totalNetworks: '2,097,152',
    hostsPerNetwork: '254',
    purpose: 'Small business LANs, departmental subnets, customer edge networks',
  },
  D: {
    name: 'Class D (Multicast)',
    range: '224.0.0.0 - 239.255.255.255',
    defaultMask: 'N/A (Group addressed)',
    defaultCidr: 4,
    leadingBits: '1110',
    totalNetworks: '268,435,456 Multicast Groups',
    hostsPerNetwork: 'N/A (Multicast streaming / routing protocols)',
    purpose: 'OSPF, RIPv2, PIM, RTP streaming, video conferencing group distribution',
  },
  E: {
    name: 'Class E (Experimental)',
    range: '240.0.0.0 - 255.255.255.255',
    defaultMask: 'N/A (Reserved)',
    defaultCidr: 4,
    leadingBits: '1111',
    totalNetworks: 'Reserved by IETF',
    hostsPerNetwork: 'N/A (Not assigned to public hosts)',
    purpose: 'IETF research, future expansion, experimental protocols',
  },
};

export function calculateIPv4(inputIp: string, inputCidr: number): IPv4SubnetResult {
  const cleanIp = inputIp.trim();
  const cidr = Math.max(0, Math.min(32, Math.floor(inputCidr)));
  const ipInt = ipToInt(cleanIp);
  const maskInt = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  const wildcardInt = (~maskInt) >>> 0;

  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;

  const networkAddress = intToIp(networkInt);
  const broadcastAddress = intToIp(broadcastInt);
  const netmask = intToIp(maskInt);
  const wildcardMask = intToIp(wildcardInt);

  const totalAddresses = Math.pow(2, 32 - cidr);
  let usableHosts = 0;
  let firstUsableIp = '';
  let lastUsableIp = '';

  if (cidr === 32) {
    usableHosts = 1;
    firstUsableIp = networkAddress;
    lastUsableIp = networkAddress;
  } else if (cidr === 31) {
    // RFC 3021 Point-to-Point links
    usableHosts = 2;
    firstUsableIp = networkAddress;
    lastUsableIp = broadcastAddress;
  } else {
    usableHosts = Math.max(0, totalAddresses - 2);
    firstUsableIp = intToIp((networkInt + 1) >>> 0);
    lastUsableIp = intToIp((broadcastInt - 1) >>> 0);
  }

  // Octet binaries
  const octets = cleanIp.split('.').map((o) => parseInt(o, 10));
  const maskOctets = netmask.split('.').map((o) => parseInt(o, 10));
  const ipBinary = octets.map(toByteBinary);
  const maskBinary = maskOctets.map(toByteBinary);

  // Determine Class
  const firstOctet = octets[0];
  let ipClass: 'A' | 'B' | 'C' | 'D' | 'E' = 'A';
  if (firstOctet >= 0 && firstOctet <= 127) ipClass = 'A';
  else if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'B';
  else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'C';
  else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'D';
  else ipClass = 'E';

  // Address Type
  let addressType = 'Public Internet Address';
  let isPrivate = false;

  if (firstOctet === 10) {
    addressType = 'Private Network (RFC 1918 Class A)';
    isPrivate = true;
  } else if (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) {
    addressType = 'Private Network (RFC 1918 Class B)';
    isPrivate = true;
  } else if (firstOctet === 192 && octets[1] === 168) {
    addressType = 'Private Network (RFC 1918 Class C)';
    isPrivate = true;
  } else if (firstOctet === 127) {
    addressType = 'Loopback Host (RFC 1122)';
    isPrivate = true;
  } else if (firstOctet === 169 && octets[1] === 254) {
    addressType = 'Link-Local / APIPA (RFC 3927)';
    isPrivate = true;
  } else if (firstOctet === 100 && octets[1] >= 64 && octets[1] <= 127) {
    addressType = 'Carrier-Grade NAT / CGNAT (RFC 6598)';
    isPrivate = true;
  } else if (firstOctet >= 224 && firstOctet <= 239) {
    addressType = 'Multicast (RFC 5771)';
  } else if (firstOctet >= 240) {
    addressType = 'Reserved for Future Use (RFC 1112)';
  }

  // Hexadecimal IP representation
  const hexIp = '0x' + (ipInt >>> 0).toString(16).toUpperCase().padStart(8, '0');

  // Reverse DNS in-addr.arpa format
  const inAddrArpa = octets.slice().reverse().join('.') + '.in-addr.arpa';

  return {
    ip: cleanIp,
    cidr,
    netmask,
    wildcardMask,
    networkAddress,
    broadcastAddress,
    firstUsableIp,
    lastUsableIp,
    usableHosts,
    totalAddresses,
    ipBinary,
    maskBinary,
    networkBitsCount: cidr,
    hostBitsCount: 32 - cidr,
    ipClass,
    classDetails: CLASSFUL_DATA[ipClass],
    addressType,
    isPrivate,
    hexIp,
    inAddrArpa,
  };
}

// Generate VLSM Subnets Breakdown table
export function generateSubnetSubdivisions(
  baseNetwork: string,
  baseCidr: number,
  targetCidr: number,
  maxDisplay = 32
) {
  if (targetCidr <= baseCidr || targetCidr > 32) return [];

  const subnetsCount = Math.pow(2, targetCidr - baseCidr);
  const baseNetInt = ipToInt(baseNetwork);
  const targetMaskInt = targetCidr === 0 ? 0 : (~0 << (32 - targetCidr)) >>> 0;
  const targetWildcard = (~targetMaskInt) >>> 0;
  const blockSize = Math.pow(2, 32 - targetCidr);

  const results = [];
  const limit = Math.min(subnetsCount, maxDisplay);

  for (let i = 0; i < limit; i++) {
    const netInt = (baseNetInt + i * blockSize) >>> 0;
    const bcastInt = (netInt + targetWildcard) >>> 0;
    const netAddr = intToIp(netInt);
    const bcastAddr = intToIp(bcastInt);

    let usable = Math.max(0, blockSize - 2);
    let firstUsable = intToIp((netInt + 1) >>> 0);
    let lastUsable = intToIp((bcastInt - 1) >>> 0);

    if (targetCidr === 32) {
      usable = 1;
      firstUsable = netAddr;
      lastUsable = netAddr;
    } else if (targetCidr === 31) {
      usable = 2;
      firstUsable = netAddr;
      lastUsable = bcastAddr;
    }

    results.push({
      index: i + 1,
      network: netAddr + '/' + targetCidr,
      networkAddress: netAddr,
      netmask: intToIp(targetMaskInt),
      firstUsable,
      lastUsable,
      broadcast: bcastAddr,
      usableHosts: usable,
    });
  }

  return results;
}

// CIDR Quick Reference Master Table (/0 to /32)
export function getCidrMasterTable() {
  const table = [];
  for (let c = 0; c <= 32; c++) {
    const mask = cidrToMask(c);
    const wildcard = cidrToWildcard(c);
    const total = Math.pow(2, 32 - c);
    let usable = 0;
    if (c === 32) usable = 1;
    else if (c === 31) usable = 2;
    else usable = Math.max(0, total - 2);

    let classEquiv = '';
    if (c === 8) classEquiv = '1 Class A (/8)';
    else if (c === 16) classEquiv = '1 Class B (/16)';
    else if (c === 24) classEquiv = '1 Class C (/24)';
    else if (c < 8) classEquiv = `${Math.pow(2, 8 - c)} Class A blocks`;
    else if (c < 16) classEquiv = `${Math.pow(2, 16 - c)} Class B blocks`;
    else if (c < 24) classEquiv = `${Math.pow(2, 24 - c)} Class C blocks`;
    else classEquiv = `1/${Math.pow(2, c - 24)} Class C`;

    table.push({
      cidr: '/' + c,
      mask,
      wildcard,
      totalHosts: total.toLocaleString(),
      usableHosts: usable.toLocaleString(),
      classEquiv,
    });
  }
  return table;
}

// ----------------------------------------------------------------------
// IPv6 SUB-ENGINE
// ----------------------------------------------------------------------

export function expandIPv6(address: string): string[] {
  let ip = address.trim().toLowerCase();
  // Handle :: compression
  if (ip.includes('::')) {
    const parts = ip.split('::');
    const leftHextets = parts[0] ? parts[0].split(':') : [];
    const rightHextets = parts[1] ? parts[1].split(':') : [];
    const missing = 8 - (leftHextets.length + rightHextets.length);
    const middleHextets = new Array(missing).fill('0000');
    const full = [...leftHextets, ...middleHextets, ...rightHextets];
    return full.map((h) => h.padStart(4, '0'));
  }
  return ip.split(':').map((h) => h.padStart(4, '0'));
}

export function compressIPv6(hextets: string[]): string {
  const formatted = hextets.map((h) => h.replace(/^0+/, '') || '0');
  const joined = formatted.join(':');
  // Find longest run of consecutive 0s
  return joined.replace(/(?:^|:)(0(?::0)+)(?=:|$)/, '::').replace(':::', '::');
}

export function calculateIPv6(inputIp: string, prefixLen: number): IPv6SubnetResult {
  let clean = inputIp.trim().toLowerCase();
  if (clean.includes('/')) {
    const parts = clean.split('/');
    clean = parts[0];
    prefixLen = parseInt(parts[1], 10);
  }

  const prefix = Math.max(0, Math.min(128, prefixLen || 64));
  const hextets = expandIPv6(clean);
  const expandedIp = hextets.join(':');
  const compressedIp = compressIPv6(hextets);

  // Convert to 128 binary bits
  const binaryHextets = hextets.map((h) => {
    return parseInt(h, 16).toString(2).padStart(16, '0');
  });
  const allBits = binaryHextets.join('');

  // Network prefix calculation
  const networkBits = allBits.substring(0, prefix).padEnd(128, '0');
  const networkHextets: string[] = [];
  for (let i = 0; i < 8; i++) {
    const chunk = networkBits.substring(i * 16, (i + 1) * 16);
    networkHextets.push(parseInt(chunk, 2).toString(16).padStart(4, '0'));
  }
  const networkPrefix = compressIPv6(networkHextets) + '/' + prefix;

  // Address space calculation
  const hostBits = 128 - prefix;
  let totalAddresses = '';
  if (hostBits <= 60) {
    totalAddresses = Math.pow(2, hostBits).toLocaleString();
  } else {
    totalAddresses = `2^${hostBits} (~${(Math.pow(2, hostBits % 10) * Math.pow(10, Math.floor(hostBits * 0.30103))).toExponential(2)} addresses)`;
  }

  let possible64Subnets = '0';
  if (prefix <= 64) {
    const subBits = 64 - prefix;
    possible64Subnets = Math.pow(2, subBits).toLocaleString() + ' (/64 subnets)';
  } else {
    possible64Subnets = 'Subdivided smaller than standard /64';
  }

  // IPv6 Scope Classification
  let scopeType = 'Global Unicast';
  let scopeDescription = 'Publicly routable on the global IPv6 Internet backbone.';
  let rfcStandard = 'RFC 4291 / RFC 3587';

  const firstHextet = parseInt(hextets[0], 16);

  if (expandedIp === '0000:0000:0000:0000:0000:0000:0000:0001') {
    scopeType = 'Loopback Address';
    scopeDescription = 'Host loopback device (equivalent to 127.0.0.1 in IPv4).';
    rfcStandard = 'RFC 4291 Section 2.5.3';
  } else if (expandedIp === '0000:0000:0000:0000:0000:0000:0000:0000') {
    scopeType = 'Unspecified Address';
    scopeDescription = 'Default route or placeholder (equivalent to 0.0.0.0 in IPv4).';
    rfcStandard = 'RFC 4291 Section 2.5.2';
  } else if (hextets[0].startsWith('fe8') || hextets[0].startsWith('fe9') || hextets[0].startsWith('fea') || hextets[0].startsWith('feb')) {
    scopeType = 'Link-Local Unicast (fe80::/10)';
    scopeDescription = 'Scoped exclusively for local physical link / collision domain.';
    rfcStandard = 'RFC 4291 Section 2.5.6';
  } else if (hextets[0].startsWith('fc') || hextets[0].startsWith('fd')) {
    scopeType = 'Unique Local Address - ULA (fc00::/7)';
    scopeDescription = 'Private intranet routing only (IPv6 counterpart of RFC 1918).';
    rfcStandard = 'RFC 4193';
  } else if (hextets[0].startsWith('ff')) {
    scopeType = 'Multicast Address (ff00::/8)';
    scopeDescription = 'One-to-many packet broadcast replacement.';
    rfcStandard = 'RFC 4291 Section 2.7';
  } else if (hextets[0] === '2001' && hextets[1] === '0db8') {
    scopeType = 'Documentation Prefix (2001:db8::/32)';
    scopeDescription = 'Reserved for books, tutorials, RFC examples, and architectural diagrams.';
    rfcStandard = 'RFC 3849';
  }

  // Field bit partition (assuming standard /48 or /64)
  const globalRoutingPrefixBits = Math.min(prefix, 48);
  const subnetBits = prefix > 48 ? Math.min(prefix - 48, 16) : 16;
  const interfaceBits = 64;

  return {
    ip: clean,
    compressedIp,
    expandedIp,
    cidr: prefix,
    networkPrefix,
    prefixLength: prefix,
    totalAddresses,
    possible64Subnets,
    scopeType,
    scopeDescription,
    rfcStandard,
    hextets,
    binaryHextets,
    globalRoutingPrefixBits,
    subnetBits,
    interfaceBits,
  };
}
