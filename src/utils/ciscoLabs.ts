import { CiscoDevice, CiscoLink, PracticeLab } from '../types';

export const CISCO_PRACTICE_LABS: PracticeLab[] = [
  {
    id: 'lab-1-basics',
    title: 'Lab 1: Router Initial Config & Interface IP Addressing',
    difficulty: 'Beginner',
    category: 'CCNA Fundamentals',
    description:
      'Practice configuring a Cisco 2901 ISR router from scratch. Assign a hostname, configure GigabitEthernet0/0 with an IPv4 address and subnet mask, bring up the interface using "no shutdown", and test connectivity from PC0 using ICMP ping.',
    topologySummary: 'PC0 (192.168.1.10/24) ── Switch0 (Catalyst 2960) ── Router0 (Cisco 2901 ISR)',
    tasks: [
      {
        id: 'task-1-1',
        text: 'Configure Router hostname to "R1" (enable -> conf t -> hostname R1)',
        hint: 'Type "enable", then "configure terminal", then "hostname R1"',
        check: (devices) => {
          const r = devices.find((d) => d.id === 'r0');
          return r?.hostname?.toUpperCase() === 'R1';
        },
      },
      {
        id: 'task-1-2',
        text: 'Assign IP 192.168.1.1 255.255.255.0 to GigabitEthernet0/0',
        hint: 'In global config mode, type "interface g0/0", then "ip address 192.168.1.1 255.255.255.0"',
        check: (devices) => {
          const r = devices.find((d) => d.id === 'r0');
          const iface = r?.interfaces['g0/0'];
          return iface?.ip === '192.168.1.1' && iface?.mask === '255.255.255.0';
        },
      },
      {
        id: 'task-1-3',
        text: 'Bring GigabitEthernet0/0 up using "no shutdown"',
        hint: 'Inside interface configuration mode (config-if)#, type "no shutdown"',
        check: (devices) => {
          const r = devices.find((d) => d.id === 'r0');
          return r?.interfaces['g0/0']?.isUp === true;
        },
      },
      {
        id: 'task-1-4',
        text: 'Verify PC0 can ping the default gateway at 192.168.1.1',
        hint: 'Click on PC0, switch to Command Prompt tab, and type "ping 192.168.1.1"',
        check: (devices) => {
          const pc = devices.find((d) => d.id === 'pc0');
          const r = devices.find((d) => d.id === 'r0');
          return (
            pc?.interfaces['fa0']?.ip === '192.168.1.10' &&
            pc?.gateway === '192.168.1.1' &&
            r?.interfaces['g0/0']?.isUp === true &&
            r?.interfaces['g0/0']?.ip === '192.168.1.1'
          );
        },
      },
    ],
    initialDevices: [
      {
        id: 'r0',
        name: 'Router0',
        hostname: 'Router',
        type: 'router',
        model: 'Cisco 2901 ISR',
        x: 480,
        y: 120,
        interfaces: {
          'g0/0': { name: 'GigabitEthernet0/0', isUp: false, mac: '0001.42A1.0001', connectedToDeviceId: 'sw0', connectedToInterface: 'fa0/1' },
          'g0/1': { name: 'GigabitEthernet0/1', isUp: false, mac: '0001.42A1.0002' },
        },
        routes: [],
        vlans: {},
        cliHistory: [],
        cliMode: 'user',
      },
      {
        id: 'sw0',
        name: 'Switch0',
        hostname: 'Switch',
        type: 'switch',
        model: 'Catalyst 2960-24TT',
        x: 300,
        y: 220,
        interfaces: {
          'fa0/1': { name: 'FastEthernet0/1', isUp: true, mac: '0060.70DF.0001', connectedToDeviceId: 'r0', connectedToInterface: 'g0/0' },
          'fa0/2': { name: 'FastEthernet0/2', isUp: true, mac: '0060.70DF.0002', connectedToDeviceId: 'pc0', connectedToInterface: 'fa0' },
          'fa0/3': { name: 'FastEthernet0/3', isUp: true, mac: '0060.70DF.0003', connectedToDeviceId: 'pc1', connectedToInterface: 'fa0' },
        },
        routes: [],
        vlans: { 1: 'default' },
        cliHistory: [],
        cliMode: 'user',
      },
      {
        id: 'pc0',
        name: 'PC0',
        hostname: 'PC0',
        type: 'pc',
        model: 'FastEthernet Workstation',
        x: 160,
        y: 340,
        interfaces: {
          fa0: { name: 'FastEthernet0', ip: '192.168.1.10', mask: '255.255.255.0', isUp: true, mac: '00E0.F72B.0001', connectedToDeviceId: 'sw0', connectedToInterface: 'fa0/2' },
        },
        gateway: '192.168.1.1',
        dnsServer: '8.8.8.8',
        routes: [],
        vlans: {},
        cliHistory: [],
        cliMode: 'user',
      },
      {
        id: 'pc1',
        name: 'PC1',
        hostname: 'PC1',
        type: 'pc',
        model: 'FastEthernet Workstation',
        x: 400,
        y: 340,
        interfaces: {
          fa0: { name: 'FastEthernet0', ip: '192.168.1.11', mask: '255.255.255.0', isUp: true, mac: '00E0.F72B.0002', connectedToDeviceId: 'sw0', connectedToInterface: 'fa0/3' },
        },
        gateway: '192.168.1.1',
        dnsServer: '8.8.8.8',
        routes: [],
        vlans: {},
        cliHistory: [],
        cliMode: 'user',
      },
    ],
    initialLinks: [
      { id: 'l1', fromDeviceId: 'r0', fromInterface: 'g0/0', toDeviceId: 'sw0', toInterface: 'fa0/1', cableType: 'straight', status: 'down' },
      { id: 'l2', fromDeviceId: 'sw0', fromInterface: 'fa0/2', toDeviceId: 'pc0', toInterface: 'fa0', cableType: 'straight', status: 'up' },
      { id: 'l3', fromDeviceId: 'sw0', fromInterface: 'fa0/3', toDeviceId: 'pc1', toInterface: 'fa0', cableType: 'straight', status: 'up' },
    ],
  },
  {
    id: 'lab-2-subnet-routing',
    title: 'Lab 2: Subnetting & Inter-VLAN / Multi-Subnet Gateway Routing',
    difficulty: 'Intermediate',
    category: 'CCNA Routing & Subnets',
    description:
      'Connect two distinct subnets across a Cisco Gateway Router: Sales LAN (192.168.10.0/24) on G0/0 and Server Farm (172.16.50.0/24) on G0/1. Configure interface addresses, bring both links UP, and verify end-to-end packet transmission from PC0 to WebServer.',
    topologySummary: 'PC0 (192.168.10.10) ── SW1 ── (G0/0) R1 (G0/1) ── SW2 ── WebServer (172.16.50.100)',
    tasks: [
      {
        id: 'task-2-1',
        text: 'Configure R1 G0/0 with 192.168.10.1 255.255.255.0 and no shutdown',
        hint: 'Router# conf t -> interface g0/0 -> ip address 192.168.10.1 255.255.255.0 -> no shutdown',
        check: (devices) => {
          const r = devices.find((d) => d.id === 'r1');
          const iface = r?.interfaces['g0/0'];
          return iface?.ip === '192.168.10.1' && iface?.mask === '255.255.255.0' && iface?.isUp;
        },
      },
      {
        id: 'task-2-2',
        text: 'Configure R1 G0/1 with 172.16.50.1 255.255.255.0 and no shutdown',
        hint: 'Router# conf t -> interface g0/1 -> ip address 172.16.50.1 255.255.255.0 -> no shutdown',
        check: (devices) => {
          const r = devices.find((d) => d.id === 'r1');
          const iface = r?.interfaces['g0/1'];
          return iface?.ip === '172.16.50.1' && iface?.mask === '255.255.255.0' && iface?.isUp;
        },
      },
      {
        id: 'task-2-3',
        text: 'Ensure WebServer gateway is 172.16.50.1',
        hint: 'Click WebServer -> IP Configuration -> set Gateway to 172.16.50.1',
        check: (devices) => {
          const srv = devices.find((d) => d.id === 'srv0');
          return srv?.gateway === '172.16.50.1';
        },
      },
      {
        id: 'task-2-4',
        text: 'Execute successful ping from PC0 (192.168.10.10) to WebServer (172.16.50.100)',
        hint: 'Open PC0 command prompt and type: "ping 172.16.50.100"',
        check: (devices) => {
          const r = devices.find((d) => d.id === 'r1');
          const pc = devices.find((d) => d.id === 'pc0');
          const srv = devices.find((d) => d.id === 'srv0');
          return Boolean(
            r?.interfaces['g0/0']?.isUp &&
            r?.interfaces['g0/0']?.ip === '192.168.10.1' &&
            r?.interfaces['g0/1']?.isUp &&
            r?.interfaces['g0/1']?.ip === '172.16.50.1' &&
            pc?.gateway === '192.168.10.1' &&
            srv?.gateway === '172.16.50.1'
          );
        },
      },
    ],
    initialDevices: [
      {
        id: 'r1',
        name: 'R1_Gateway',
        hostname: 'R1',
        type: 'router',
        model: 'Cisco 2901 ISR',
        x: 440,
        y: 140,
        interfaces: {
          'g0/0': { name: 'GigabitEthernet0/0', isUp: false, mac: '0001.42A1.1001', connectedToDeviceId: 'sw1', connectedToInterface: 'fa0/1' },
          'g0/1': { name: 'GigabitEthernet0/1', isUp: false, mac: '0001.42A1.1002', connectedToDeviceId: 'sw2', connectedToInterface: 'fa0/1' },
        },
        routes: [],
        vlans: {},
        cliHistory: [],
        cliMode: 'user',
      },
      {
        id: 'sw1',
        name: 'SW1_Sales',
        hostname: 'SW1',
        type: 'switch',
        model: 'Catalyst 2960-24TT',
        x: 240,
        y: 240,
        interfaces: {
          'fa0/1': { name: 'FastEthernet0/1', isUp: true, mac: '0060.70DF.1001', connectedToDeviceId: 'r1', connectedToInterface: 'g0/0' },
          'fa0/2': { name: 'FastEthernet0/2', isUp: true, mac: '0060.70DF.1002', connectedToDeviceId: 'pc0', connectedToInterface: 'fa0' },
        },
        routes: [],
        vlans: { 10: 'Sales' },
        cliHistory: [],
        cliMode: 'user',
      },
      {
        id: 'sw2',
        name: 'SW2_Servers',
        hostname: 'SW2',
        type: 'switch',
        model: 'Catalyst 2960-24TT',
        x: 640,
        y: 240,
        interfaces: {
          'fa0/1': { name: 'FastEthernet0/1', isUp: true, mac: '0060.70DF.2001', connectedToDeviceId: 'r1', connectedToInterface: 'g0/1' },
          'fa0/2': { name: 'FastEthernet0/2', isUp: true, mac: '0060.70DF.2002', connectedToDeviceId: 'srv0', connectedToInterface: 'fa0' },
        },
        routes: [],
        vlans: { 50: 'Servers' },
        cliHistory: [],
        cliMode: 'user',
      },
      {
        id: 'pc0',
        name: 'Sales_PC0',
        hostname: 'PC0',
        type: 'pc',
        model: 'FastEthernet Workstation',
        x: 140,
        y: 350,
        interfaces: {
          fa0: { name: 'FastEthernet0', ip: '192.168.10.10', mask: '255.255.255.0', isUp: true, mac: '00E0.F72B.1001', connectedToDeviceId: 'sw1', connectedToInterface: 'fa0/2' },
        },
        gateway: '192.168.10.1',
        routes: [],
        vlans: {},
        cliHistory: [],
        cliMode: 'user',
      },
      {
        id: 'srv0',
        name: 'App_Server0',
        hostname: 'Server0',
        type: 'server',
        model: 'Enterprise Rack Server',
        x: 740,
        y: 350,
        interfaces: {
          fa0: { name: 'FastEthernet0', ip: '172.16.50.100', mask: '255.255.255.0', isUp: true, mac: '00E0.F72B.2001', connectedToDeviceId: 'sw2', connectedToInterface: 'fa0/2' },
        },
        gateway: '172.16.50.1',
        routes: [],
        vlans: {},
        cliHistory: [],
        cliMode: 'user',
      },
    ],
    initialLinks: [
      { id: 'l1', fromDeviceId: 'r1', fromInterface: 'g0/0', toDeviceId: 'sw1', toInterface: 'fa0/1', cableType: 'straight', status: 'down' },
      { id: 'l2', fromDeviceId: 'r1', fromInterface: 'g0/1', toDeviceId: 'sw2', toInterface: 'fa0/1', cableType: 'straight', status: 'down' },
      { id: 'l3', fromDeviceId: 'sw1', fromInterface: 'fa0/2', toDeviceId: 'pc0', toInterface: 'fa0', cableType: 'straight', status: 'up' },
      { id: 'l4', fromDeviceId: 'sw2', fromInterface: 'fa0/2', toDeviceId: 'srv0', toInterface: 'fa0', cableType: 'straight', status: 'up' },
    ],
  },
  {
    id: 'lab-3-static-routing',
    title: 'Lab 3: Cisco Static Routing & WAN Point-to-Point Backbone',
    difficulty: 'CCNA Pro',
    category: 'CCNA WAN & Static Routing',
    description:
      'Configure dual Cisco routers connected via a point-to-point /30 WAN link (10.0.0.0/30). Configure IPv4 static routes ("ip route <network> <mask> <next-hop>") in both directions so the Branch LAN can reach the HQ Server Farm.',
    topologySummary: 'Branch_PC (192.168.1.50) ── R_Branch (10.0.0.1/30) ════ (10.0.0.2/30) R_HQ ── HQ_Server (192.168.200.10)',
    tasks: [
      {
        id: 'task-3-1',
        text: 'Configure R_Branch WAN interface (g0/1) with 10.0.0.1 255.255.255.252 and no shutdown',
        hint: 'R_Branch(config)# int g0/1 -> ip address 10.0.0.1 255.255.255.252 -> no shutdown',
        check: (devices) => {
          const r = devices.find((d) => d.id === 'r_branch');
          const iface = r?.interfaces['g0/1'];
          return iface?.ip === '10.0.0.1' && iface?.mask === '255.255.255.252' && iface?.isUp;
        },
      },
      {
        id: 'task-3-2',
        text: 'Configure R_HQ WAN interface (g0/1) with 10.0.0.2 255.255.255.252 and no shutdown',
        hint: 'R_HQ(config)# int g0/1 -> ip address 10.0.0.2 255.255.255.252 -> no shutdown',
        check: (devices) => {
          const r = devices.find((d) => d.id === 'r_hq');
          const iface = r?.interfaces['g0/1'];
          return iface?.ip === '10.0.0.2' && iface?.mask === '255.255.255.252' && iface?.isUp;
        },
      },
      {
        id: 'task-3-3',
        text: 'Add static route on R_Branch: ip route 192.168.200.0 255.255.255.0 10.0.0.2',
        hint: 'In R_Branch global config mode: "ip route 192.168.200.0 255.255.255.0 10.0.0.2"',
        check: (devices) => {
          const r = devices.find((d) => d.id === 'r_branch');
          return r?.routes.some(
            (rt) => rt.network === '192.168.200.0' && rt.mask === '255.255.255.0' && rt.nextHop === '10.0.0.2'
          ) || false;
        },
      },
      {
        id: 'task-3-4',
        text: 'Add return static route on R_HQ: ip route 192.168.1.0 255.255.255.0 10.0.0.1',
        hint: 'In R_HQ global config mode: "ip route 192.168.1.0 255.255.255.0 10.0.0.1"',
        check: (devices) => {
          const r = devices.find((d) => d.id === 'r_hq');
          return r?.routes.some(
            (rt) => rt.network === '192.168.1.0' && rt.mask === '255.255.255.0' && rt.nextHop === '10.0.0.1'
          ) || false;
        },
      },
      {
        id: 'task-3-5',
        text: 'Test full WAN connectivity: Ping HQ_Server (192.168.200.10) from Branch_PC',
        hint: 'Open Branch_PC command prompt and ping 192.168.200.10',
        check: (devices) => {
          const rb = devices.find((d) => d.id === 'r_branch');
          const rh = devices.find((d) => d.id === 'r_hq');
          const bHasRoute = rb?.routes.some((r) => r.network === '192.168.200.0' && r.nextHop === '10.0.0.2');
          const hHasRoute = rh?.routes.some((r) => r.network === '192.168.1.0' && r.nextHop === '10.0.0.1');
          return Boolean(rb?.interfaces['g0/1']?.isUp && rh?.interfaces['g0/1']?.isUp && bHasRoute && hHasRoute);
        },
      },
    ],
    initialDevices: [
      {
        id: 'r_branch',
        name: 'R_Branch',
        hostname: 'R_Branch',
        type: 'router',
        model: 'Cisco 2901 ISR',
        x: 320,
        y: 160,
        interfaces: {
          'g0/0': { name: 'GigabitEthernet0/0', ip: '192.168.1.1', mask: '255.255.255.0', isUp: true, mac: '0001.42A1.3001', connectedToDeviceId: 'pc_branch', connectedToInterface: 'fa0' },
          'g0/1': { name: 'GigabitEthernet0/1', isUp: false, mac: '0001.42A1.3002', connectedToDeviceId: 'r_hq', connectedToInterface: 'g0/1' },
        },
        routes: [],
        vlans: {},
        cliHistory: [],
        cliMode: 'user',
      },
      {
        id: 'r_hq',
        name: 'R_HQ',
        hostname: 'R_HQ',
        type: 'router',
        model: 'Cisco 2901 ISR',
        x: 580,
        y: 160,
        interfaces: {
          'g0/0': { name: 'GigabitEthernet0/0', ip: '192.168.200.1', mask: '255.255.255.0', isUp: true, mac: '0001.42A1.4001', connectedToDeviceId: 'srv_hq', connectedToInterface: 'fa0' },
          'g0/1': { name: 'GigabitEthernet0/1', isUp: false, mac: '0001.42A1.4002', connectedToDeviceId: 'r_branch', connectedToInterface: 'g0/1' },
        },
        routes: [],
        vlans: {},
        cliHistory: [],
        cliMode: 'user',
      },
      {
        id: 'pc_branch',
        name: 'Branch_PC',
        hostname: 'Branch_PC',
        type: 'pc',
        model: 'Workstation',
        x: 140,
        y: 280,
        interfaces: {
          fa0: { name: 'FastEthernet0', ip: '192.168.1.50', mask: '255.255.255.0', isUp: true, mac: '00E0.F72B.3001', connectedToDeviceId: 'r_branch', connectedToInterface: 'g0/0' },
        },
        gateway: '192.168.1.1',
        routes: [],
        vlans: {},
        cliHistory: [],
        cliMode: 'user',
      },
      {
        id: 'srv_hq',
        name: 'HQ_Server',
        hostname: 'HQ_Server',
        type: 'server',
        model: 'Corporate Cloud Server',
        x: 760,
        y: 280,
        interfaces: {
          fa0: { name: 'FastEthernet0', ip: '192.168.200.10', mask: '255.255.255.0', isUp: true, mac: '00E0.F72B.4001', connectedToDeviceId: 'r_hq', connectedToInterface: 'g0/0' },
        },
        gateway: '192.168.200.1',
        routes: [],
        vlans: {},
        cliHistory: [],
        cliMode: 'user',
      },
    ],
    initialLinks: [
      { id: 'l1', fromDeviceId: 'pc_branch', fromInterface: 'fa0', toDeviceId: 'r_branch', toInterface: 'g0/0', cableType: 'straight', status: 'up' },
      { id: 'l2', fromDeviceId: 'r_branch', fromInterface: 'g0/1', toDeviceId: 'r_hq', toInterface: 'g0/1', cableType: 'crossover', status: 'down' },
      { id: 'l3', fromDeviceId: 'r_hq', fromInterface: 'g0/0', toDeviceId: 'srv_hq', toInterface: 'fa0', cableType: 'straight', status: 'up' },
    ],
  },
  {
    id: 'lab-4-troubleshoot',
    title: 'Lab 4: CCNA Troubleshooting Challenge (Broken Network)',
    difficulty: 'Intermediate',
    category: 'CCNA Troubleshooting',
    description:
      'Users report PC1 cannot communicate with the Core Database. Diagnose configuration errors using "show ip int brief" and "ipconfig". Fix interface shutdowns, incorrect subnet masks, or missing default gateways.',
    topologySummary: 'PC1 (Misconfigured LAN) ── Switch0 ── Router0 (Interface Admin Down) ── DB_Server',
    tasks: [
      {
        id: 'task-4-1',
        text: 'Fix Router0 interface G0/0: Bring it up from Administratively Down (no shutdown)',
        hint: 'Type "enable" -> "conf t" -> "int g0/0" -> "no shutdown"',
        check: (devices) => {
          const r = devices.find((d) => d.id === 'r0_broken');
          return r?.interfaces['g0/0']?.isUp === true;
        },
      },
      {
        id: 'task-4-2',
        text: 'Fix PC1 Subnet Mask: Change from 255.0.0.0 to 255.255.255.0',
        hint: 'Click PC1 -> IP Configuration tab -> set Subnet Mask to 255.255.255.0',
        check: (devices) => {
          const pc = devices.find((d) => d.id === 'pc1_broken');
          return pc?.interfaces['fa0']?.mask === '255.255.255.0';
        },
      },
      {
        id: 'task-4-3',
        text: 'Fix PC1 Default Gateway: Set to 192.168.1.1 (currently blank)',
        hint: 'Click PC1 -> set Gateway to 192.168.1.1',
        check: (devices) => {
          const pc = devices.find((d) => d.id === 'pc1_broken');
          return pc?.gateway === '192.168.1.1';
        },
      },
      {
        id: 'task-4-4',
        text: 'Verify Resolution: Successfully ping DB_Server (192.168.2.100) from PC1',
        hint: 'Open PC1 command prompt and run "ping 192.168.2.100"',
        check: (devices) => {
          const r = devices.find((d) => d.id === 'r0_broken');
          const pc = devices.find((d) => d.id === 'pc1_broken');
          return Boolean(
            r?.interfaces['g0/0']?.isUp &&
            pc?.interfaces['fa0']?.mask === '255.255.255.0' &&
            pc?.gateway === '192.168.1.1'
          );
        },
      },
    ],
    initialDevices: [
      {
        id: 'r0_broken',
        name: 'Router0',
        hostname: 'Router',
        type: 'router',
        model: 'Cisco 2901 ISR',
        x: 440,
        y: 140,
        interfaces: {
          'g0/0': { name: 'GigabitEthernet0/0', ip: '192.168.1.1', mask: '255.255.255.0', isUp: false, mac: '0001.42A1.5001', connectedToDeviceId: 'sw0_broken', connectedToInterface: 'fa0/1' },
          'g0/1': { name: 'GigabitEthernet0/1', ip: '192.168.2.1', mask: '255.255.255.0', isUp: true, mac: '0001.42A1.5002', connectedToDeviceId: 'srv_broken', connectedToInterface: 'fa0' },
        },
        routes: [],
        vlans: {},
        cliHistory: [],
        cliMode: 'user',
      },
      {
        id: 'sw0_broken',
        name: 'Switch0',
        hostname: 'Switch',
        type: 'switch',
        model: 'Catalyst 2960-24TT',
        x: 240,
        y: 240,
        interfaces: {
          'fa0/1': { name: 'FastEthernet0/1', isUp: true, mac: '0060.70DF.5001', connectedToDeviceId: 'r0_broken', connectedToInterface: 'g0/0' },
          'fa0/2': { name: 'FastEthernet0/2', isUp: true, mac: '0060.70DF.5002', connectedToDeviceId: 'pc1_broken', connectedToInterface: 'fa0' },
        },
        routes: [],
        vlans: {},
        cliHistory: [],
        cliMode: 'user',
      },
      {
        id: 'pc1_broken',
        name: 'PC1_Client',
        hostname: 'PC1',
        type: 'pc',
        model: 'Workstation',
        x: 120,
        y: 350,
        interfaces: {
          fa0: { name: 'FastEthernet0', ip: '192.168.1.55', mask: '255.0.0.0', isUp: true, mac: '00E0.F72B.5001', connectedToDeviceId: 'sw0_broken', connectedToInterface: 'fa0/2' },
        },
        gateway: '', // Missing Gateway!
        routes: [],
        vlans: {},
        cliHistory: [],
        cliMode: 'user',
      },
      {
        id: 'srv_broken',
        name: 'DB_Server',
        hostname: 'DB_Server',
        type: 'server',
        model: 'Postgres SQL Cluster',
        x: 680,
        y: 240,
        interfaces: {
          fa0: { name: 'FastEthernet0', ip: '192.168.2.100', mask: '255.255.255.0', isUp: true, mac: '00E0.F72B.5002', connectedToDeviceId: 'r0_broken', connectedToInterface: 'g0/1' },
        },
        gateway: '192.168.2.1',
        routes: [],
        vlans: {},
        cliHistory: [],
        cliMode: 'user',
      },
    ],
    initialLinks: [
      { id: 'l1', fromDeviceId: 'r0_broken', fromInterface: 'g0/0', toDeviceId: 'sw0_broken', toInterface: 'fa0/1', cableType: 'straight', status: 'down' },
      { id: 'l2', fromDeviceId: 'sw0_broken', fromInterface: 'fa0/2', toDeviceId: 'pc1_broken', toInterface: 'fa0', cableType: 'straight', status: 'up' },
      { id: 'l3', fromDeviceId: 'r0_broken', fromInterface: 'g0/1', toDeviceId: 'srv_broken', toInterface: 'fa0', cableType: 'straight', status: 'up' },
    ],
  },
];
