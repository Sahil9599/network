import { jsPDF } from 'jspdf';
import { IPv4SubnetResult, IPv6SubnetResult } from './subnetCalculator';

export function exportCsvFile(filename: string, rows: string[][]) {
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportSubnetReportPdf(ipv4: IPv4SubnetResult | null, ipv6?: IPv6SubnetResult | null) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('NETSCOPE PRO // NETWORK AUDIT REPORT', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Generated: ${new Date().toUTCString()} | Report UUID: NS-${Date.now().toString(36).toUpperCase()}`, 14, 24);

  let y = 45;

  if (ipv4) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`IPv4 Subnet Breakdown: ${ipv4.ip}/${ipv4.cidr}`, 14, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    const items = [
      ['Network Address', ipv4.networkAddress],
      ['Broadcast Address', ipv4.broadcastAddress],
      ['Subnet Mask', `${ipv4.netmask} (CIDR /${ipv4.cidr})`],
      ['Wildcard Mask', ipv4.wildcardMask],
      ['Usable Host Range', `${ipv4.firstUsableIp} - ${ipv4.lastUsableIp}`],
      ['Usable Host Count', ipv4.usableHosts.toLocaleString() + ' hosts'],
      ['Total Addresses', ipv4.totalAddresses.toLocaleString() + ' addresses'],
      ['Address Classification', `${ipv4.classDetails.name} (${ipv4.classDetails.range})`],
      ['Class Capacity', `${ipv4.classDetails.totalNetworks} networks, ${ipv4.classDetails.hostsPerNetwork} hosts/net`],
      ['Network Type', `${ipv4.addressType} (${ipv4.isPrivate ? 'RFC 1918 Private' : 'Public Routable'})`],
      ['Hexadecimal Format', ipv4.hexIp],
      ['Reverse PTR Record', ipv4.inAddrArpa],
    ];

    // Render table rows
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Parameter Metric', 18, y + 4.5);
    doc.text('Engineering Value', 90, y + 4.5);
    y += 8;

    doc.setFont('helvetica', 'normal');
    for (let i = 0; i < items.length; i++) {
      if (i % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 4, pageWidth - 28, 6, 'F');
      }
      doc.text(items[i][0], 18, y);
      doc.text(items[i][1], 90, y);
      y += 6.5;
    }

    y += 8;
    // Binary Representation
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Binary Bit Architecture (Network vs Host Partition):', 14, y);
    y += 6;
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`IP Binary:   ${ipv4.ipBinary.join(' . ')}`, 14, y);
    y += 5;
    doc.text(`Mask Binary: ${ipv4.maskBinary.join(' . ')}`, 14, y);
    y += 5;
    doc.text(`Partition:   ${ipv4.networkBitsCount} Network Bits [1] / ${ipv4.hostBitsCount} Host Bits [0]`, 14, y);
    y += 12;
  }

  if (ipv6 && y < 240) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`IPv6 Address Analysis: ${ipv6.ip}/${ipv6.cidr}`, 14, y);
    y += 7;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    const v6Items = [
      ['Compressed Format', ipv6.compressedIp],
      ['Expanded (Full 8-Hextet)', ipv6.expandedIp],
      ['Routing Prefix Block', ipv6.networkPrefix],
      ['Scope & Classification', ipv6.scopeType],
      ['RFC Standard Definition', ipv6.rfcStandard],
      ['Subnet Capacity', ipv6.possible64Subnets],
      ['Total Addresses', ipv6.totalAddresses],
    ];

    for (const [k, v] of v6Items) {
      doc.text(`${k}:`, 18, y);
      doc.text(String(v), 80, y);
      y += 5.5;
    }
  }

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('NetScope Pro Engine // Automated RFC Compliance Report // Confidential Engineering Telemetry', 14, 285);

  doc.save(`NetScope_Subnet_Report_${Date.now()}.pdf`);
}

export function exportDnsReportPdf(domain: string, queryDurationMs: number, records: Record<string, any>) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DNS RECONNAISSANCE AUDIT REPORT', 14, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Domain Target: ${domain} | Latency: ${queryDurationMs}ms | Generated: ${new Date().toUTCString()}`, 14, 24);

  let y = 45;
  doc.setTextColor(15, 23, 42);

  const recordKeys = Object.keys(records);
  if (recordKeys.length === 0) {
    doc.setFontSize(10);
    doc.text('No public DNS records returned or domain was unreachable.', 14, y);
  } else {
    for (const key of recordKeys) {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(`Record Type: ${key}`, 14, y);
      y += 6;

      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);

      const val = records[key];
      if (Array.isArray(val)) {
        val.forEach((row) => {
          const text = typeof row === 'object' ? JSON.stringify(row) : String(row);
          doc.text(`- ${text}`, 18, y);
          y += 5;
        });
      } else if (typeof val === 'object') {
        Object.entries(val).forEach(([k, v]) => {
          doc.text(`- ${k}: ${v}`, 18, y);
          y += 5;
        });
      } else {
        doc.text(`- ${val}`, 18, y);
        y += 5;
      }
      y += 4;
    }
  }

  doc.save(`NetScope_DNS_Audit_${domain}_${Date.now()}.pdf`);
}

export function exportUptimeReportPdf(target: string, uptimeData: any) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('WEBSITE UPTIME & SSL SECURITY AUDIT', 14, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Target URL: ${target} | Generated: ${new Date().toUTCString()}`, 14, 24);

  let y = 45;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Endpoint Status: ${uptimeData.isUp ? 'ONLINE (Healthy)' : 'OFFLINE / UNREACHABLE'}`, 14, y);
  y += 8;

  const rows = [
    ['HTTP Status Code', `${uptimeData.statusCode} (${uptimeData.statusMessage || 'OK'})`],
    ['Total Latency', `${uptimeData.timing?.totalMs || 0} ms`],
    ['DNS Resolution Time', `${uptimeData.timing?.dnsMs || 0} ms`],
    ['TCP Handshake Time', `${uptimeData.timing?.tcpConnectMs || 0} ms`],
    ['TLS Handshake Time', `${uptimeData.timing?.tlsHandshakeMs || 0} ms`],
    ['Time To First Byte (TTFB)', `${uptimeData.timing?.ttfbMs || 0} ms`],
    ['Web Server Engine', uptimeData.headers?.server || 'Unknown'],
    ['Content-Type', uptimeData.headers?.contentType || 'Unknown'],
    ['HSTS Security Policy', uptimeData.headers?.strictTransportSecurity ? 'Enforced' : 'Missing'],
    ['Content-Security-Policy', uptimeData.headers?.contentSecurityPolicy ? 'Configured' : 'Missing'],
  ];

  if (uptimeData.ssl) {
    rows.push(
      ['SSL Certificate Subject', uptimeData.ssl.subject || 'N/A'],
      ['SSL Certificate Issuer', uptimeData.ssl.issuer || 'N/A'],
      ['SSL Validity Period', `${uptimeData.ssl.validFrom} to ${uptimeData.ssl.validTo}`],
      ['Days Until Expiration', `${uptimeData.ssl.daysRemaining} days remaining`]
    );
  }

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  for (const [label, val] of rows) {
    doc.text(label, 18, y);
    doc.text(String(val), 85, y);
    y += 6.5;
  }

  doc.save(`NetScope_Uptime_Audit_${Date.now()}.pdf`);
}
