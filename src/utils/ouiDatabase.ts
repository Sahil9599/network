/**
 * IEEE OUI (Organizationally Unique Identifier) Vendor Database & MAC Address Utilities
 */

export interface OuiEntry {
  prefix: string; // e.g. "00:1A:2B" or "001A2B"
  vendor: string;
  category: 'router' | 'switch' | 'server' | 'workstation' | 'mobile' | 'iot' | 'printer' | 'ap';
}

export const OUI_DATABASE: Record<string, { vendor: string; category: OuiEntry['category'] }> = {
  // Cisco Systems
  '00:00:0C': { vendor: 'Cisco Systems, Inc.', category: 'router' },
  '00:01:42': { vendor: 'Cisco Systems, Inc.', category: 'router' },
  '00:01:43': { vendor: 'Cisco Systems, Inc.', category: 'switch' },
  '00:01:C7': { vendor: 'Cisco Systems, Inc.', category: 'switch' },
  '00:01:C9': { vendor: 'Cisco Systems, Inc.', category: 'router' },
  '00:0A:41': { vendor: 'Cisco Systems, Inc.', category: 'router' },
  '00:0C:85': { vendor: 'Cisco Systems, Inc.', category: 'switch' },
  '00:14:1C': { vendor: 'Cisco Systems, Inc.', category: 'router' },
  '00:1A:2B': { vendor: 'Cisco Systems, Inc.', category: 'switch' },
  '00:24:14': { vendor: 'Cisco Systems, Inc.', category: 'router' },
  '00:26:0B': { vendor: 'Cisco Systems, Inc.', category: 'switch' },
  '00:40:0B': { vendor: 'Cisco Systems, Inc.', category: 'router' },
  '04:C5:A4': { vendor: 'Cisco Systems, Inc.', category: 'router' },
  '28:94:0F': { vendor: 'Cisco Systems, Inc.', category: 'switch' },
  '54:75:D0': { vendor: 'Cisco Systems, Inc.', category: 'ap' },
  '70:81:05': { vendor: 'Cisco Systems, Inc.', category: 'router' },
  'AC:F2:C5': { vendor: 'Cisco Systems, Inc.', category: 'switch' },
  'D4:AD:71': { vendor: 'Cisco Systems, Inc.', category: 'ap' },
  'F4:CF:E2': { vendor: 'Cisco Systems, Inc.', category: 'router' },

  // Apple Inc.
  '00:03:93': { vendor: 'Apple, Inc.', category: 'workstation' },
  '00:05:02': { vendor: 'Apple, Inc.', category: 'workstation' },
  '00:17:F2': { vendor: 'Apple, Inc.', category: 'workstation' },
  '00:1E:52': { vendor: 'Apple, Inc.', category: 'mobile' },
  '00:25:00': { vendor: 'Apple, Inc.', category: 'workstation' },
  '04:0C:CE': { vendor: 'Apple, Inc.', category: 'mobile' },
  '14:10:9F': { vendor: 'Apple, Inc.', category: 'workstation' },
  '24:F6:77': { vendor: 'Apple, Inc.', category: 'mobile' },
  '3C:07:54': { vendor: 'Apple, Inc.', category: 'workstation' },
  '48:D7:05': { vendor: 'Apple, Inc.', category: 'mobile' },
  '60:F8:1D': { vendor: 'Apple, Inc.', category: 'workstation' },
  '70:3E:AC': { vendor: 'Apple, Inc.', category: 'mobile' },
  '88:66:5A': { vendor: 'Apple, Inc.', category: 'workstation' },
  'A4:83:E7': { vendor: 'Apple, Inc.', category: 'mobile' },
  'AC:BC:32': { vendor: 'Apple, Inc.', category: 'workstation' },
  'BC:D0:74': { vendor: 'Apple, Inc.', category: 'mobile' },
  'DC:A9:04': { vendor: 'Apple, Inc.', category: 'workstation' },
  'F0:18:98': { vendor: 'Apple, Inc.', category: 'mobile' },

  // Intel Corporation
  '00:02:B3': { vendor: 'Intel Corporate', category: 'workstation' },
  '00:03:47': { vendor: 'Intel Corporate', category: 'workstation' },
  '00:04:23': { vendor: 'Intel Corporate', category: 'server' },
  '00:0E:0C': { vendor: 'Intel Corporate', category: 'workstation' },
  '00:13:02': { vendor: 'Intel Corporate', category: 'workstation' },
  '00:15:00': { vendor: 'Intel Corporate', category: 'workstation' },
  '00:1B:21': { vendor: 'Intel Corporate', category: 'workstation' },
  '00:21:6A': { vendor: 'Intel Corporate', category: 'workstation' },
  '34:13:E8': { vendor: 'Intel Corporate', category: 'workstation' },
  '68:05:CA': { vendor: 'Intel Corporate', category: 'server' },
  '80:86:F2': { vendor: 'Intel Corporate', category: 'server' },

  // Dell Inc.
  '00:06:5B': { vendor: 'Dell Inc.', category: 'server' },
  '00:08:74': { vendor: 'Dell Inc.', category: 'workstation' },
  '00:14:22': { vendor: 'Dell Inc.', category: 'server' },
  '00:18:8B': { vendor: 'Dell Inc.', category: 'server' },
  '00:21:9B': { vendor: 'Dell Inc.', category: 'workstation' },
  '18:66:DA': { vendor: 'Dell Inc.', category: 'server' },
  '24:B6:FD': { vendor: 'Dell Inc.', category: 'workstation' },
  '74:86:7A': { vendor: 'Dell Inc.', category: 'server' },
  'B8:2A:72': { vendor: 'Dell Inc.', category: 'workstation' },
  'E4:54:E8': { vendor: 'Dell Inc.', category: 'server' },

  // HP / Hewlett Packard
  '00:01:E6': { vendor: 'Hewlett Packard Enterprise', category: 'server' },
  '00:0B:CD': { vendor: 'Hewlett Packard', category: 'printer' },
  '00:1E:0B': { vendor: 'Hewlett Packard', category: 'printer' },
  '00:23:7D': { vendor: 'Hewlett Packard', category: 'server' },
  '10:1F:74': { vendor: 'Hewlett Packard', category: 'printer' },
  '3C:D9:2B': { vendor: 'Hewlett Packard', category: 'workstation' },
  '9C:8E:99': { vendor: 'Hewlett Packard', category: 'printer' },

  // Raspberry Pi
  'B8:27:EB': { vendor: 'Raspberry Pi Foundation', category: 'iot' },
  'DC:A6:32': { vendor: 'Raspberry Pi (Trading) Ltd', category: 'iot' },
  'E4:5F:01': { vendor: 'Raspberry Pi (Trading) Ltd', category: 'iot' },
  '28:CD:C1': { vendor: 'Raspberry Pi (Trading) Ltd', category: 'iot' },

  // TP-Link
  '00:25:86': { vendor: 'TP-Link Technologies Co.,Ltd.', category: 'router' },
  '14:CC:20': { vendor: 'TP-Link Technologies Co.,Ltd.', category: 'router' },
  '50:C7:BF': { vendor: 'TP-Link Technologies Co.,Ltd.', category: 'ap' },
  '74:DA:38': { vendor: 'TP-Link Technologies Co.,Ltd.', category: 'router' },
  '98:48:27': { vendor: 'TP-Link Technologies Co.,Ltd.', category: 'router' },
  'C0:4A:00': { vendor: 'TP-Link Technologies Co.,Ltd.', category: 'ap' },

  // Ubiquiti Networks
  '00:27:22': { vendor: 'Ubiquiti Inc.', category: 'ap' },
  '04:18:D6': { vendor: 'Ubiquiti Inc.', category: 'switch' },
  '24:A4:3C': { vendor: 'Ubiquiti Inc.', category: 'ap' },
  '44:D9:E7': { vendor: 'Ubiquiti Inc.', category: 'router' },
  '68:D7:9A': { vendor: 'Ubiquiti Inc.', category: 'ap' },
  '78:8A:20': { vendor: 'Ubiquiti Inc.', category: 'switch' },

  // Samsung Electronics
  '00:07:AB': { vendor: 'Samsung Electronics Co.,Ltd', category: 'mobile' },
  '00:12:47': { vendor: 'Samsung Electronics Co.,Ltd', category: 'mobile' },
  '08:EE:8B': { vendor: 'Samsung Electronics Co.,Ltd', category: 'mobile' },
  '34:23:BA': { vendor: 'Samsung Electronics Co.,Ltd', category: 'mobile' },
  '44:6D:57': { vendor: 'Samsung Electronics Co.,Ltd', category: 'mobile' },
  '50:F0:D3': { vendor: 'Samsung Electronics Co.,Ltd', category: 'iot' },
  'A8:06:00': { vendor: 'Samsung Electronics Co.,Ltd', category: 'mobile' },

  // Netgear
  '00:09:5B': { vendor: 'Netgear Inc.', category: 'router' },
  '00:14:6C': { vendor: 'Netgear Inc.', category: 'switch' },
  '20:E5:2A': { vendor: 'Netgear Inc.', category: 'router' },
  '44:94:FC': { vendor: 'Netgear Inc.', category: 'router' },
  '9C:3D:CF': { vendor: 'Netgear Inc.', category: 'ap' },

  // Synology / QNAP (NAS Storage)
  '00:11:32': { vendor: 'Synology Inc.', category: 'server' },
  '00:08:9B': { vendor: 'QNAP Systems, Inc.', category: 'server' },

  // Hikvision / Dahua (CCTV Cameras)
  '00:18:AE': { vendor: 'Hangzhou Hikvision Digital Tech', category: 'iot' },
  '44:19:B6': { vendor: 'Hangzhou Hikvision Digital Tech', category: 'iot' },
  '3C:EF:8C': { vendor: 'Zhejiang Dahua Technology', category: 'iot' },

  // Google
  '00:1A:11': { vendor: 'Google LLC', category: 'iot' },
  '3C:5A:37': { vendor: 'Google LLC', category: 'mobile' },
  '54:60:09': { vendor: 'Google LLC', category: 'iot' },
  'F4:F5:D8': { vendor: 'Google LLC', category: 'iot' },

  // Virtualization
  '00:50:56': { vendor: 'VMware, Inc.', category: 'server' },
  '00:0C:29': { vendor: 'VMware, Inc.', category: 'server' },
  '08:00:27': { vendor: 'Oracle VirtualBox', category: 'workstation' },
  '52:54:00': { vendor: 'QEMU / KVM Virtual NIC', category: 'server' },
  '42:00:4E': { vendor: 'Google Cloud Platform Virtual NIC', category: 'server' },
};

/**
 * Clean and normalize a MAC address into standard uppercase colon format: XX:XX:XX:XX:XX:XX
 */
export function normalizeMac(mac: string): string {
  if (!mac) return '00:00:00:00:00:00';
  const clean = mac.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  if (clean.length < 6) return mac.toUpperCase();
  const padded = clean.padEnd(12, '0').slice(0, 12);
  const parts = [];
  for (let i = 0; i < 12; i += 2) {
    parts.push(padded.substring(i, i + 2));
  }
  return parts.join(':');
}

/**
 * Format MAC into Cisco notation: XXXX.XXXX.XXXX
 */
export function toCiscoMacFormat(mac: string): string {
  const clean = mac.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
  const padded = clean.padEnd(12, '0').slice(0, 12);
  return `${padded.substring(0, 4)}.${padded.substring(4, 8)}.${padded.substring(8, 12)}`;
}

/**
 * Format MAC into dash format: XX-XX-XX-XX-XX-XX
 */
export function toDashMacFormat(mac: string): string {
  return normalizeMac(mac).replace(/:/g, '-');
}

/**
 * Lookup Vendor OUI from MAC address
 */
export function lookupOuiVendor(mac: string): { vendor: string; category: OuiEntry['category']; isKnown: boolean } {
  const norm = normalizeMac(mac);
  const prefix = norm.substring(0, 8); // e.g. "00:1A:2B"

  if (OUI_DATABASE[prefix]) {
    return {
      vendor: OUI_DATABASE[prefix].vendor,
      category: OUI_DATABASE[prefix].category,
      isKnown: true,
    };
  }

  // Fallback checks
  if (norm.startsWith('00:00:00') || norm.startsWith('FF:FF:FF')) {
    return { vendor: 'Broadcast / Multicast Special Address', category: 'iot', isKnown: true };
  }
  if (norm.startsWith('01:00:5E')) {
    return { vendor: 'IPv4 Multicast (IANA)', category: 'router', isKnown: true };
  }
  if (norm.startsWith('33:33:')) {
    return { vendor: 'IPv6 Multicast (RFC 2464)', category: 'router', isKnown: true };
  }

  // Locally administered address check (bit 1 of 1st byte)
  const firstByte = parseInt(norm.substring(0, 2), 16);
  if (!isNaN(firstByte) && (firstByte & 0x02) !== 0) {
    return { vendor: 'Locally Administered / Private MAC (Randomized)', category: 'mobile', isKnown: false };
  }

  return { vendor: 'Standard Generic Ethernet NIC', category: 'workstation', isKnown: false };
}

/**
 * Check if MAC is Unicast or Multicast
 */
export function getMacTransmissionType(mac: string): 'Unicast' | 'Multicast' | 'Broadcast' {
  const norm = normalizeMac(mac);
  if (norm === 'FF:FF:FF:FF:FF:FF') return 'Broadcast';
  const firstByte = parseInt(norm.substring(0, 2), 16);
  if (isNaN(firstByte)) return 'Unicast';
  return (firstByte & 0x01) === 1 ? 'Multicast' : 'Unicast';
}

/**
 * Check if MAC is Globally Unique (OUI enforced) or Locally Administered
 */
export function getMacAdministrationType(mac: string): 'Globally Unique (OUI Enforced)' | 'Locally Administered (Private)' {
  const norm = normalizeMac(mac);
  const firstByte = parseInt(norm.substring(0, 2), 16);
  if (isNaN(firstByte)) return 'Globally Unique (OUI Enforced)';
  return (firstByte & 0x02) === 2 ? 'Locally Administered (Private)' : 'Globally Unique (OUI Enforced)';
}
