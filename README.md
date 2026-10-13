# NetScope Pro - Advanced Network Engineering & Diagnostic Suite

An enterprise-grade, high-performance Network Diagnostic & Engineering Platform built with React, TypeScript, Tailwind CSS, Express, and Cisco Packet Tracer simulation engine.

---

## 🚀 Key Features & Modules

### 1. 🧮 Subnet Calculator & Class Architecture
* **IPv4 & IPv6 Subnetting Engine**: Computes Network Address, Broadcast Address, First & Last Usable Hosts, Total Address Space ($2^{32-\text{prefix}}$), Usable Hosts ($2^{32-\text{prefix}}-2$), and Wildcard Mask.
* **Classful Matrix (Classes A, B, C, D, E)**: Visual bit breakdown, leading bits, default masks, and RFC 1918 private allocations.
* **Bitwise Visualizer**: Real-time 32-bit binary octet breakdown showing network vs. host bit distribution.
* **VLSM Generator**: Variable-Length Subnet Masking divider with downloadable allocation tables.
* **CIDR Cheat Sheet**: Complete reference guide from `/0` to `/32`.

### 2. 🗺️ IP Intelligence & ASN Telemetry
* **High-Precision Geolocation**: Dual-engine interactive map supporting Street, Satellite (Esri), and Dark Grid view modes.
* **BGP Autonomous System Routing**: ASN lookups, ISP carrier identification, and reverse DNS (PTR).
* **RFC 1918 Local IP Detection**: Automatic identification of private intranets and public gateway routing.
* **Custom Google Maps API Key**: Built-in dialog to enter and test your own Google Maps API Key.

### 3. 🌐 DNS Resolver & Propagation
* Comprehensive records lookup: `A`, `AAAA`, `MX`, `TXT`, `NS`, `CNAME`, `SOA`, `CAA`.
* Global DNS propagation status and DNS timing diagnostics.

### 4. 🧪 Cisco Packet Tracer Simulation & Practice Labs
* **Interactive Canvas**: Drag, reposition, and inspect routers, switches, PCs, and servers.
* **Real Cisco IOS CLI**: Interactive command terminal supporting `enable`, `conf t`, `interface`, `ip address`, `no shutdown`, `show ip int brief`, `ping`, and more.
* **Packet Tracer Animation**: Visual packet transit across physical links with Layer 2, Layer 3 (IP), and Layer 4 (ICMP) inspect modals.
* **Guided Practice Labs**:
  1. *Router & Switch Basics*
  2. *VLAN Segmentation & Trunking*
  3. *Static Route & Gateway Configuration*

### 5. ⏱️ Website Uptime & SSL Certificate Auditor
* Real-time HTTP/HTTPS latency breakdown: DNS lookup, TCP connect, and TLS handshake times.
* SSL certificate validity, issuer authority, expiration tracker, and protocol versions.

### 6. 🔌 TCP Port Checker & Route Tracer
* Multi-port scanner with presets for Web (`80`, `443`), Mail (`25`, `465`, `587`, `993`), Database (`3306`, `5432`), and Admin (`22`, `3389`).
* Hop-by-hop route visualization with latency tracking.

### 7. ⚡ Automated Speed & Bandwidth Testing
* Live jitter, ping latency, download bandwidth stream, and upload speed throughput.

### 8. 💻 Developer REST API & Sandbox
* RESTful endpoints (`/api/v1/...`) with API key management, usage meters, and code snippets in cURL, Python, JavaScript, and Go.

### 9. 📄 Exportable Executive Reports
* One-click PDF network audit reports (jsPDF) and CSV data exports across all diagnostic tools.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Motion, Leaflet
* **Backend**: Node.js, Express, tsx
* **Build Tooling**: Vite 8
* **Reporting**: jsPDF

---

## 🏁 Getting Started

### Prerequisites
* Node.js 18+ or Node.js 20+
* npm or bun

### Installation
```bash
# Clone the repository
git clone https://github.com/<your-username>/network.git
cd network

# Install dependencies
npm install

# Start the full-stack development server
npm run dev
```

The application runs on `http://localhost:3000`.

---

## 📜 Scripts
* `npm run dev`: Starts the Express server with Vite middleware on port 3000.
* `npm run build`: Compiles production assets with Vite.
* `npm run start`: Runs production server with tsx.
* `npm run lint`: Validates TypeScript typing (`tsc --noEmit`).

---

## 📄 License
Apache-2.0
