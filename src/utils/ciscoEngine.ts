import { CiscoDevice, CiscoLink, SimulationPacket } from '../types';

// Normalizes interface shorthand (e.g. "g0/0" -> "g0/0", "gigabitethernet0/0" -> "g0/0")
export function normalizeInterfaceName(input: string): string {
  const clean = input.trim().toLowerCase();
  if (clean.startsWith('gi') || clean.startsWith('g')) {
    return 'g' + clean.replace(/^[a-z]+/, '');
  }
  if (clean.startsWith('fa') || clean.startsWith('f')) {
    return 'fa' + clean.replace(/^[a-z]+/, '');
  }
  return clean;
}

// Convert IP and Subnet mask to check if in same subnet
export function isSameSubnet(ip1: string, ip2: string, mask: string): boolean {
  if (!ip1 || !ip2 || !mask) return false;
  const ip1Parts = ip1.split('.').map(Number);
  const ip2Parts = ip2.split('.').map(Number);
  const maskParts = mask.split('.').map(Number);
  if (ip1Parts.length !== 4 || ip2Parts.length !== 4 || maskParts.length !== 4) return false;

  for (let i = 0; i < 4; i++) {
    if ((ip1Parts[i] & maskParts[i]) !== (ip2Parts[i] & maskParts[i])) {
      return false;
    }
  }
  return true;
}

// Check end-to-end packet route connectivity
export function testPacketReachability(
  sourceDevice: CiscoDevice,
  targetIp: string,
  devices: CiscoDevice[],
  links: CiscoLink[]
): { success: boolean; path: string[]; targetDevice?: CiscoDevice } {
  // Find destination device with targetIp on an active interface
  let targetDevice: CiscoDevice | undefined;
  for (const d of devices) {
    for (const iface of Object.values(d.interfaces)) {
      if (iface.ip === targetIp && iface.isUp) {
        targetDevice = d;
        break;
      }
    }
    if (targetDevice) break;
  }

  if (!targetDevice) {
    return { success: false, path: [sourceDevice.id] };
  }

  // BFS search through active links to find path
  const queue: Array<{ currentId: string; path: string[] }> = [
    { currentId: sourceDevice.id, path: [sourceDevice.id] },
  ];
  const visited = new Set<string>([sourceDevice.id]);

  while (queue.length > 0) {
    const { currentId, path } = queue.shift()!;
    if (currentId === targetDevice.id) {
      return { success: true, path, targetDevice };
    }

    const currentDev = devices.find((d) => d.id === currentId);
    if (!currentDev) continue;

    // Find all neighbors connected via UP links
    for (const link of links) {
      if (link.status !== 'up') continue;

      let neighborId: string | null = null;
      let myIfaceName: string | null = null;
      let neighborIfaceName: string | null = null;

      if (link.fromDeviceId === currentId) {
        neighborId = link.toDeviceId;
        myIfaceName = link.fromInterface;
        neighborIfaceName = link.toInterface;
      } else if (link.toDeviceId === currentId) {
        neighborId = link.fromDeviceId;
        myIfaceName = link.toInterface;
        neighborIfaceName = link.fromInterface;
      }

      if (neighborId && !visited.has(neighborId)) {
        const myIface = currentDev.interfaces[myIfaceName!];
        const neighborDev = devices.find((d) => d.id === neighborId);
        const neighborIface = neighborDev?.interfaces[neighborIfaceName!];

        // Link only works if both interfaces are UP (switches are transparent)
        const myIfaceUp = myIface ? myIface.isUp : true;
        const neighborIfaceUp = neighborIface ? neighborIface.isUp : true;

        if (myIfaceUp && neighborIfaceUp) {
          visited.add(neighborId);
          queue.push({ currentId: neighborId, path: [...path, neighborId] });
        }
      }
    }
  }

  return { success: false, path: [sourceDevice.id] };
}

// Execute Cisco IOS or PC Command
export function executeCiscoCommand(
  device: CiscoDevice,
  allDevices: CiscoDevice[],
  allLinks: CiscoLink[],
  rawInput: string
): {
  updatedDevice: CiscoDevice;
  updatedLinks: CiscoLink[];
  output: string[];
  packetEvent?: { targetIp: string; success: boolean; path: string[] };
} {
  const trimmed = rawInput.trim();
  const dev = JSON.parse(JSON.stringify(device)) as CiscoDevice;
  let links = JSON.parse(JSON.stringify(allLinks)) as CiscoLink[];
  const output: string[] = [];
  let packetEvent: { targetIp: string; success: boolean; path: string[] } | undefined;

  if (!trimmed) {
    return { updatedDevice: dev, updatedLinks: links, output: [''] };
  }

  const tokens = trimmed.split(/\s+/);
  const cmd = tokens[0].toLowerCase();
  const args = tokens.slice(1);

  // -------------------------------------------------------------
  // PC / WORKSTATION COMMAND PROMPT
  // -------------------------------------------------------------
  if (dev.type === 'pc' || dev.type === 'server') {
    if (cmd === 'ipconfig') {
      const isAll = args[0]?.toLowerCase() === '/all';
      output.push('FastEthernet0 Connection:');
      output.push('   Connection-specific DNS Suffix  . : netscope.local');
      if (isAll) {
        output.push(`   Physical Address. . . . . . . . . : ${dev.interfaces['fa0']?.mac || '00E0.F72B.0001'}`);
      }
      output.push(`   IPv4 Address. . . . . . . . . . . : ${dev.interfaces['fa0']?.ip || '0.0.0.0'}`);
      output.push(`   Subnet Mask . . . . . . . . . . . : ${dev.interfaces['fa0']?.mask || '0.0.0.0'}`);
      output.push(`   Default Gateway . . . . . . . . . : ${dev.gateway || '0.0.0.0'}`);
      if (isAll && dev.dnsServer) {
        output.push(`   DNS Servers . . . . . . . . . . . : ${dev.dnsServer}`);
      }
    } else if (cmd === 'ping') {
      const targetIp = args[0];
      if (!targetIp) {
        output.push('Usage: ping <destination_ip>');
      } else {
        output.push(`\nPinging ${targetIp} with 32 bytes of data:`);
        const reach = testPacketReachability(dev, targetIp, allDevices, links);
        packetEvent = { targetIp, success: reach.success, path: reach.path };

        if (reach.success) {
          output.push(`Reply from ${targetIp}: bytes=32 time=2ms TTL=128`);
          output.push(`Reply from ${targetIp}: bytes=32 time=1ms TTL=128`);
          output.push(`Reply from ${targetIp}: bytes=32 time=1ms TTL=128`);
          output.push(`Reply from ${targetIp}: bytes=32 time=2ms TTL=128`);
          output.push(`\nPing statistics for ${targetIp}:`);
          output.push(`    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`);
          output.push(`Approximate round trip times in milli-seconds:`);
          output.push(`    Minimum = 1ms, Maximum = 2ms, Average = 1ms`);
        } else {
          output.push('Request timed out.');
          output.push('Request timed out.');
          output.push('Request timed out.');
          output.push('Request timed out.');
          output.push(`\nPing statistics for ${targetIp}:`);
          output.push(`    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),`);
        }
      }
    } else if (cmd === 'tracert' || cmd === 'traceroute') {
      const targetIp = args[0];
      if (!targetIp) {
        output.push('Usage: tracert <destination_ip>');
      } else {
        output.push(`\nTracing route to ${targetIp} over a maximum of 30 hops:`);
        const reach = testPacketReachability(dev, targetIp, allDevices, links);
        if (reach.success) {
          reach.path.forEach((hopId, i) => {
            const hopDev = allDevices.find((d) => d.id === hopId);
            const ip = Object.values(hopDev?.interfaces || {}).find((ifc) => ifc.ip)?.ip || '192.168.1.1';
            output.push(`  ${i + 1}    1 ms    1 ms    1 ms  ${ip} [${hopDev?.hostname || hopId}]`);
          });
          output.push('\nTrace complete.');
        } else {
          output.push('  1     *        *        *     Request timed out.');
          output.push('  2     *        *        *     Request timed out.');
        }
      }
    } else if (cmd === 'help' || cmd === '?') {
      output.push('Supported Commands:');
      output.push('  ipconfig [/all]  - Display IP configuration and MAC');
      output.push('  ping <ip>        - Send ICMP echo requests');
      output.push('  tracert <ip>     - Trace packet hops');
      output.push('  cls / clear      - Clear terminal window');
    } else {
      output.push(`'${cmd}' is not recognized as an internal or external command.`);
    }

    return { updatedDevice: dev, updatedLinks: links, output, packetEvent };
  }

  // -------------------------------------------------------------
  // CISCO IOS (ROUTER / SWITCH) CLI
  // -------------------------------------------------------------
  const mode = dev.cliMode;

  // Global exit/end across modes
  if (cmd === 'exit') {
    if (mode === 'config-if') {
      dev.cliMode = 'config';
      dev.currentInterface = undefined;
    } else if (mode === 'config') {
      dev.cliMode = 'priv';
    } else if (mode === 'priv') {
      dev.cliMode = 'user';
    }
    return { updatedDevice: dev, updatedLinks: links, output: [] };
  }

  if (cmd === 'end') {
    if (mode === 'config' || mode === 'config-if') {
      dev.cliMode = 'priv';
      dev.currentInterface = undefined;
    }
    return { updatedDevice: dev, updatedLinks: links, output: [] };
  }

  // USER EXEC MODE (Router>)
  if (mode === 'user') {
    if (cmd === 'enable' || cmd === 'en') {
      dev.cliMode = 'priv';
    } else if (cmd === 'ping') {
      const targetIp = args[0];
      if (!targetIp) {
        output.push('% Target IP address missing');
      } else {
        const reach = testPacketReachability(dev, targetIp, allDevices, links);
        packetEvent = { targetIp, success: reach.success, path: reach.path };
        output.push(`Type escape sequence to abort.`);
        output.push(`Sending 5, 100-byte ICMP Echos to ${targetIp}, timeout is 2 seconds:`);
        if (reach.success) {
          output.push('!!!!!');
          output.push('Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms');
        } else {
          output.push('.....');
          output.push('Success rate is 0 percent (0/5)');
        }
      }
    } else if (cmd === 'show' || cmd === 'sh') {
      if (args[0] === 'ip' && args[1] === 'int' && (args[2] === 'brief' || args[2] === 'br')) {
        output.push(renderShowIpInterfaceBrief(dev));
      } else if (args[0] === 'version' || args[0] === 'ver') {
        output.push(`Cisco IOS Software, ${dev.model} Software, Version 15.4(3)M2`);
        output.push(`ROM: System Bootstrap, Version 15.1(4)M4, RELEASE SOFTWARE`);
        output.push(`${dev.hostname} uptime is 4 hours, 18 minutes`);
      } else {
        output.push('% Incomplete command. Try: show ip int brief, show version');
      }
    } else if (cmd === 'help' || cmd === '?') {
      output.push('Exec commands:');
      output.push('  enable         Turn on privileged commands');
      output.push('  ping <ip>      Send ICMP echo messages');
      output.push('  show <subcmd>  Show running system information');
    } else {
      output.push(`% Unknown command or unrecognized command: "${cmd}"`);
    }

    return { updatedDevice: dev, updatedLinks: links, output, packetEvent };
  }

  // PRIVILEGED EXEC MODE (Router#)
  if (mode === 'priv') {
    if (cmd === 'disable') {
      dev.cliMode = 'user';
    } else if (cmd === 'configure' || cmd === 'conf') {
      if (args[0] === 'terminal' || args[0] === 't' || !args[0]) {
        dev.cliMode = 'config';
        output.push('Enter configuration commands, one per line.  End with CNTL/Z or "end".');
      }
    } else if (cmd === 'ping') {
      const targetIp = args[0];
      if (!targetIp) {
        output.push('% Target IP address missing');
      } else {
        const reach = testPacketReachability(dev, targetIp, allDevices, links);
        packetEvent = { targetIp, success: reach.success, path: reach.path };
        output.push(`Type escape sequence to abort.`);
        output.push(`Sending 5, 100-byte ICMP Echos to ${targetIp}, timeout is 2 seconds:`);
        if (reach.success) {
          output.push('!!!!!');
          output.push('Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms');
        } else {
          output.push('.....');
          output.push('Success rate is 0 percent (0/5)');
        }
      }
    } else if (cmd === 'show' || cmd === 'sh') {
      const sub = args.join(' ').toLowerCase();
      if (sub.includes('ip int') || sub.includes('ip interface')) {
        output.push(renderShowIpInterfaceBrief(dev));
      } else if (sub.includes('ip route')) {
        output.push(renderShowIpRoute(dev));
      } else if (sub.includes('run') || sub.includes('running-config')) {
        output.push(renderShowRunningConfig(dev));
      } else if (sub.includes('arp')) {
        output.push('Protocol  Address          Age (min)  Hardware Addr   Type   Interface');
        Object.entries(dev.interfaces).forEach(([k, ifc]) => {
          if (ifc.ip) {
            output.push(`Internet  ${ifc.ip.padEnd(16)} -          ${ifc.mac.padEnd(15)} ARPA   ${ifc.name}`);
          }
        });
      } else {
        output.push('% Incomplete or unknown show command.');
        output.push('Options: show ip interface brief | show ip route | show running-config | show arp');
      }
    } else if (cmd === 'copy' || cmd === 'wr' || cmd === 'write') {
      output.push('Building configuration...');
      output.push('[OK]');
    } else {
      output.push(`% Unknown command: "${cmd}". Type "?" or "configure terminal".`);
    }

    return { updatedDevice: dev, updatedLinks: links, output, packetEvent };
  }

  // GLOBAL CONFIGURATION MODE (Router(config)#)
  if (mode === 'config') {
    if (cmd === 'hostname') {
      if (args[0]) {
        dev.hostname = args[0];
        output.push(`% Hostname set to "${args[0]}"`);
      } else {
        output.push('% Incomplete command: hostname <name>');
      }
    } else if (cmd === 'interface' || cmd === 'int') {
      const ifaceArg = args.join('');
      const normalized = normalizeInterfaceName(ifaceArg);
      // Find matching interface
      const key = Object.keys(dev.interfaces).find((k) => k.toLowerCase() === normalized);
      if (key) {
        dev.cliMode = 'config-if';
        dev.currentInterface = key;
      } else {
        output.push(`% Invalid interface name: ${ifaceArg}. (Available: ${Object.keys(dev.interfaces).join(', ')})`);
      }
    } else if (cmd === 'ip' && args[0] === 'route') {
      // ip route <network> <mask> <next-hop>
      const net = args[1];
      const mask = args[2];
      const nextHop = args[3];
      if (net && mask && nextHop) {
        // Add or replace route
        dev.routes = dev.routes.filter((r) => r.network !== net);
        dev.routes.push({ network: net, mask, nextHop });
        output.push(`% Static route installed for ${net}/${mask} via ${nextHop}`);
      } else {
        output.push('% Incomplete command: ip route <prefix> <mask> <next-hop>');
      }
    } else if (cmd === 'no' && args[0] === 'ip' && args[1] === 'route') {
      const net = args[2];
      if (net) {
        dev.routes = dev.routes.filter((r) => r.network !== net);
        output.push(`% Static route removed for ${net}`);
      }
    } else {
      output.push(`% Invalid input detected at '^' marker for command "${cmd}".`);
    }

    return { updatedDevice: dev, updatedLinks: links, output, packetEvent };
  }

  // INTERFACE CONFIGURATION MODE (Router(config-if)#)
  if (mode === 'config-if') {
    const curIfaceKey = dev.currentInterface;
    if (!curIfaceKey || !dev.interfaces[curIfaceKey]) {
      dev.cliMode = 'config';
      return { updatedDevice: dev, updatedLinks: links, output: ['% Interface session expired.'] };
    }

    const iface = dev.interfaces[curIfaceKey];

    if (cmd === 'ip' && args[0] === 'address') {
      const ip = args[1];
      const mask = args[2];
      if (ip && mask) {
        iface.ip = ip;
        iface.mask = mask;
        output.push(`% IP address ${ip} ${mask} configured on ${iface.name}`);
      } else {
        output.push('% Incomplete command: ip address <ip> <subnet-mask>');
      }
    } else if (cmd === 'no' && args[0] === 'ip' && args[1] === 'address') {
      iface.ip = undefined;
      iface.mask = undefined;
      output.push(`% IP address removed from ${iface.name}`);
    } else if (cmd === 'no' && (args[0] === 'shutdown' || args[0] === 'shut')) {
      iface.isUp = true;
      output.push(`%LINK-5-CHANGED: Interface ${iface.name}, changed state to up`);
      output.push(`%LINEPROTO-5-UPDOWN: Line protocol on Interface ${iface.name}, changed state to up`);

      // Update connected link state
      links = links.map((l) => {
        if (
          (l.fromDeviceId === dev.id && l.fromInterface === curIfaceKey) ||
          (l.toDeviceId === dev.id && l.toInterface === curIfaceKey)
        ) {
          return { ...l, status: 'up' };
        }
        return l;
      });
    } else if (cmd === 'shutdown' || cmd === 'shut') {
      iface.isUp = false;
      output.push(`%LINK-5-CHANGED: Interface ${iface.name}, changed state to administratively down`);
      output.push(`%LINEPROTO-5-UPDOWN: Line protocol on Interface ${iface.name}, changed state to down`);

      // Update connected link state
      links = links.map((l) => {
        if (
          (l.fromDeviceId === dev.id && l.fromInterface === curIfaceKey) ||
          (l.toDeviceId === dev.id && l.toInterface === curIfaceKey)
        ) {
          return { ...l, status: 'down' };
        }
        return l;
      });
    } else {
      output.push(`% Invalid command at interface level: "${cmd}".`);
      output.push('Options: ip address <ip> <mask> | no shutdown | shutdown | exit');
    }

    return { updatedDevice: dev, updatedLinks: links, output, packetEvent };
  }

  return { updatedDevice: dev, updatedLinks: links, output };
}

// Format Cisco "show ip interface brief"
function renderShowIpInterfaceBrief(dev: CiscoDevice): string {
  const header = 'Interface              IP-Address      OK? Method Status                Protocol';
  const lines = [header];

  Object.entries(dev.interfaces).forEach(([k, ifc]) => {
    const nameCol = ifc.name.padEnd(23);
    const ipCol = (ifc.ip || 'unassigned').padEnd(16);
    const okCol = 'YES '.padEnd(4);
    const methodCol = ifc.ip ? 'manual '.padEnd(7) : 'unset  '.padEnd(7);
    const statusCol = ifc.isUp ? 'up'.padEnd(22) : 'administratively down'.padEnd(22);
    const protoCol = ifc.isUp ? 'up' : 'down';
    lines.push(`${nameCol}${ipCol}${okCol}${methodCol}${statusCol}${protoCol}`);
  });

  return lines.join('\n');
}

// Format Cisco "show ip route"
function renderShowIpRoute(dev: CiscoDevice): string {
  const lines = [
    'Codes: C - connected, S - static, R - RIP, M - mobile, B - BGP',
    '       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area',
    'Gateway of last resort is not set\n',
  ];

  // Connected interfaces
  Object.values(dev.interfaces).forEach((ifc) => {
    if (ifc.ip && ifc.mask && ifc.isUp) {
      lines.push(`C    ${ifc.ip}/${ifc.mask} is directly connected, ${ifc.name}`);
    }
  });

  // Static routes
  dev.routes.forEach((rt) => {
    lines.push(`S    ${rt.network}/${rt.mask} [1/0] via ${rt.nextHop}`);
  });

  if (lines.length <= 3) {
    lines.push('% No active IPv4 routes found.');
  }

  return lines.join('\n');
}

// Format Cisco "show running-config"
function renderShowRunningConfig(dev: CiscoDevice): string {
  const lines = [
    '!',
    'version 15.4',
    'service timestamps log datetime msec',
    'no service password-encryption',
    '!',
    `hostname ${dev.hostname}`,
    '!',
    'ip cef',
    'no ipv6 cef',
    '!',
  ];

  Object.values(dev.interfaces).forEach((ifc) => {
    lines.push(`interface ${ifc.name}`);
    if (ifc.ip && ifc.mask) {
      lines.push(` ip address ${ifc.ip} ${ifc.mask}`);
    } else {
      lines.push(' no ip address');
    }
    if (!ifc.isUp) {
      lines.push(' shutdown');
    } else {
      lines.push(' no shutdown');
    }
    lines.push(' duplex auto');
    lines.push(' speed auto');
    lines.push('!');
  });

  dev.routes.forEach((rt) => {
    lines.push(`ip route ${rt.network} ${rt.mask} ${rt.nextHop}`);
  });

  lines.push('line con 0');
  lines.push('line vty 0 4');
  lines.push(' login');
  lines.push('!');
  lines.push('end');

  return lines.join('\n');
}
