# 🌐 NetScope Pro — Advanced Network Engineering & Diagnostic Suite

**NetScope Pro** is a comprehensive network engineering and diagnostic platform designed for developers, network engineers, cybersecurity learners, system administrators, and IT professionals. It combines IP intelligence, subnet calculations, DNS analysis, network diagnostics, interactive topology simulation, and developer APIs in one unified interface.

🚀 **Live Website:** [https://bytenova.sbs](https://bytenova.sbs)

Built with **React, TypeScript, Tailwind CSS, Node.js, Express, and Vite**, NetScope Pro delivers a modern environment for network analysis, troubleshooting, and hands-on networking practice.

---

## ✨ Key Features

### 1. 🧮 Subnet Calculator & IP Address Architecture

A comprehensive subnetting toolkit for IPv4 and IPv6 network planning.

- **IPv4 & IPv6 Subnet Calculator** — Calculate network addresses, prefixes, subnet ranges, and address allocations.
- **Network & Broadcast Addresses** — Determine network addresses, broadcast addresses for IPv4, and usable host ranges where applicable.
- **Host Capacity Calculator** — Calculate total address space and usable IPv4 hosts according to the selected prefix and subnet rules.
- **Wildcard Mask Generator** — Generate wildcard masks for network configuration and access control lists.
- **Classful IP Architecture** — Explore Classes A, B, C, D, and E, including leading bits, default masks, and address purposes.
- **Private IP Detection** — Identify RFC 1918 private IPv4 address ranges.
- **Bitwise Visualizer** — View 32-bit IPv4 addresses in binary format with network and host bits highlighted.
- **VLSM Calculator** — Divide a network into variable-length subnets and generate allocation tables.
- **CIDR Reference Guide** — Explore IPv4 prefixes from `/0` to `/32`.

### 2. 🗺️ IP Intelligence & ASN Telemetry

Investigate IP addresses and understand their network ownership and routing information.

- **IP Geolocation** — Display available IP location information on an interactive map.
- **Multiple Map Views** — Explore supported street, satellite, and dark-grid map styles.
- **ASN Lookup** — Identify Autonomous System Numbers associated with public IP addresses.
- **ISP & Carrier Identification** — Retrieve available internet service provider and network ownership information.
- **BGP Network Intelligence** — Inspect available autonomous system and routing-related information.
- **Reverse DNS Lookup** — Retrieve PTR records associated with IP addresses when available.
- **Private vs. Public IP Detection** — Distinguish local network addresses from publicly routable addresses.
- **Custom Google Maps API Key** — Configure and test your own Google Maps API key through the application interface.

*Note: Geolocation, ASN, and BGP data accuracy depends on the configured data providers and their available information.*

### 3. 🌐 DNS Resolver & Propagation Analyzer

Analyze domain name configurations and investigate DNS resolution issues.

- **DNS Record Lookup** — Query supported record types:
  - `A` — IPv4 address
  - `AAAA` — IPv6 address
  - `MX` — Mail exchange
  - `TXT` — Text records
  - `NS` — Name servers
  - `CNAME` — Canonical name
  - `SOA` — Start of authority
  - `CAA` — Certificate authority authorization
- **DNS Propagation Checks** — Compare DNS responses across supported global resolvers.
- **Resolution Timing** — Measure DNS query response times.
- **Domain Diagnostics** — Inspect available DNS records to help troubleshoot configuration problems.

### 4. 🧪 Interactive Network Topology Simulator

Practice networking concepts through a visual topology-building environment inspired by network simulation tools such as Cisco Packet Tracer.

- **Drag-and-Drop Canvas** — Add, reposition, and inspect routers, switches, PCs, and servers.
- **Network Topology Builder** — Create visual network layouts using supported devices and links.
- **Interactive CLI** — Practice supported Cisco IOS-style commands, including:
  - `enable`
  - `configure terminal` (`conf t`)
  - `interface`
  - `ip address`
  - `no shutdown`
  - `show ip interface brief`
  - `ping`
- **Packet Flow Animation** — Visualize packet movement across configured network links.
- **Protocol Inspection** — Explore Layer 2, Layer 3, and Layer 4 concepts, including Ethernet, IP, and ICMP.
- **Guided Practice Labs** — Learn through structured networking exercises.

#### Included Practice Labs

1. **Router & Switch Basics** — Learn device configuration and basic connectivity.
2. **VLAN Segmentation & Trunking** — Practice logical network separation and trunk concepts.
3. **Static Routing & Gateway Configuration** — Configure routing concepts and test network reachability.

*The simulator provides an educational environment. Real Cisco IOS execution and complete protocol simulation require an appropriately implemented engine or integration.*

### 5. ⏱️ Website Uptime & SSL Certificate Auditor

Evaluate website availability, connection performance, and TLS certificate information.

- **HTTP/HTTPS Availability Checks** — Test whether a website responds to requests.
- **Latency Diagnostics** — Display available DNS lookup, TCP connection, and TLS handshake timing measurements.
- **SSL Certificate Validation** — Inspect certificate validity and expiration information.
- **Certificate Issuer Details** — Review the issuing certificate authority when available.
- **Protocol Information** — Inspect supported or reported TLS protocol details.
- **Uptime Monitoring** — Check website availability through the configured monitoring mechanism.

### 6. 🔌 TCP Port Checker & Route Tracer

Investigate network connectivity and analyze routes to supported destinations.

- **TCP Port Checks** — Test ports on authorized targets.
- **Multi-Port Scanning** — Check multiple configured ports in one workflow.
- **Port Presets** — Quickly select common service ports.

| Category | Ports |
|---|---|
| Web | `80`, `443` |
| Mail | `25`, `465`, `587`, `993` |
| Database | `3306`, `5432` |
| Administration | `22`, `3389` |

- **Route Tracing** — Visualize available network hops toward a destination.
- **Latency Tracking** — Display response times for supported route-tracing results.
- **Connectivity Troubleshooting** — Help identify potential reachability and routing issues.

*Port checks and route tracing depend on operating-system permissions, server-side network access, and the capabilities of the configured diagnostic implementation. Use these features only on systems you own or have permission to test.*

### 7. ⚡ Internet Speed & Bandwidth Testing

Measure network performance using supported speed-test mechanisms.

- **Ping Latency** — Measure response time to a test endpoint.
- **Jitter Measurement** — Evaluate variations in latency across repeated measurements.
- **Download Throughput** — Estimate download performance using a supported data stream.
- **Upload Throughput** — Estimate upload performance using a supported upload endpoint.
- **Performance Metrics** — Present available results in a clear diagnostic dashboard.

*Actual results depend on the test server, connection quality, browser limitations, and measurement methodology.*

### 8. 💻 Developer REST API & Sandbox

A developer-focused interface for integrating supported network diagnostic functionality into other applications.

- **REST API Endpoints** — Organize supported functionality under `/api/v1/...`.
- **API Key Management** — Manage API credentials according to the implemented authentication system.
- **Usage Monitoring** — Display API request usage and available limits.
- **Interactive API Sandbox** — Experiment with supported endpoints.
- **Code Examples** — Generate or display integration examples in:
  - cURL
  - Python
  - JavaScript
  - Go
- **Developer Integration** — Support workflows for connecting network diagnostics to external tools.

*Endpoint availability, authentication, rate limits, and usage metrics depend on the actual backend implementation.*

### 9. 📄 Exportable Network Audit Reports

Generate reports for documentation, troubleshooting, and technical analysis.

- **PDF Reports** — Export supported network audit results using jsPDF.
- **CSV Exports** — Download supported diagnostic results in spreadsheet-friendly format.
- **Structured Results** — Organize measurements and findings for easier review.
- **Documentation Support** — Preserve useful results for network maintenance and reporting workflows.

---

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React 19, TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Animations | Motion |
| Interactive Maps | Leaflet |
| Backend | Node.js, Express |
| Development Server | Vite 8 |
| TypeScript Execution | tsx |
| Report Generation | jsPDF |
| Data Export | CSV |

---

## 🏗️ Architecture Overview

NetScope Pro uses a full-stack architecture that separates the user interface from server-side diagnostic operations.

```text
NetScope Pro
│
├── Frontend
│   ├── React
│   ├── TypeScript
│   ├── Tailwind CSS
│   ├── Interactive Dashboard
│   ├── Network Visualization
│   └── Diagnostic Interfaces
│
├── Backend
│   ├── Node.js
│   ├── Express
│   ├── REST API
│   ├── Diagnostic Services
│   └── Request Handling
│
├── Network Modules
│   ├── Subnet Calculator
│   ├── IP Intelligence
│   ├── DNS Resolver
│   ├── Topology Simulator
│   ├── Website Auditor
│   ├── Port Checker
│   └── Speed Testing
│
└── Reporting
    ├── PDF Export
    └── CSV Export
```

The availability of individual diagnostics depends on the services, APIs, and server-side implementations configured for the application.

---

## 🚀 Getting Started

Follow these instructions to run NetScope Pro in a local development environment.

### Prerequisites

Install the following tools:

- **Node.js:** Version 20+ recommended; use a version compatible with the project's dependencies.
- **npm** or **Bun**
- **Git**
- A code editor such as Visual Studio Code

### 1. Clone the Repository

Replace `<your-username>` with your GitHub username or the repository owner's username.

```bash
git clone https://github.com/<your-username>/network.git
```

### 2. Navigate to the Project Directory

```bash
cd network
```

### 3. Install Dependencies

Using npm:

```bash
npm install
```

Alternatively, using Bun:

```bash
bun install
```

### 4. Configure Environment Variables

If the application requires external APIs or backend configuration, create a `.env` file using the environment variable names documented by the project.

For example:

```env
PORT=3000
```

Add other required settings only when they are supported by the application's implementation. Never commit API secrets, private keys, or production credentials to a public repository.

### 5. Start the Development Server

```bash
npm run dev
```

Open the local application at:

**http://localhost:3000**

The development URL assumes the Express and Vite setup is configured to serve the application on port `3000`.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the production application |
| `npm run start` | Start the production server |
| `npm run lint` | Run the configured TypeScript validation |

The exact behavior of each command depends on the project's `package.json` configuration.

---

## 🔐 Security & Responsible Usage

NetScope Pro is intended for legitimate network engineering, diagnostics, learning, and authorized troubleshooting.

- Scan only systems and ports you own or are authorized to test.
- Keep API keys and credentials private.
- Restrict external API keys to the required APIs and authorized websites or applications.
- Validate user-supplied IP addresses, domains, ports, and API parameters on the server.
- Apply appropriate authentication, rate limiting, and access controls to public diagnostic endpoints.
- Avoid exposing internal network details or sensitive diagnostic output to unauthorized users.
- Use appropriate server-side protections against requests targeting private, loopback, link-local, or cloud metadata addresses.

---

## 🎯 Use Cases

NetScope Pro is designed to support:

- Network engineering and subnet planning
- Networking education and practical labs
- DNS and domain troubleshooting
- IP address and ASN investigation
- Website availability and TLS diagnostics
- Authorized TCP connectivity testing
- Network topology visualization
- Developer API experimentation
- Technical documentation and network audit reporting

---

## 🗺️ Project Roadmap

Potential future enhancements include:

- [ ] Enhanced IPv4 and IPv6 subnet planning
- [ ] Saved network topologies and lab configurations
- [ ] Expanded interactive networking exercises
- [ ] Historical uptime and latency charts
- [ ] Scheduled website monitoring
- [ ] More DNS resolver locations
- [ ] Expanded REST API documentation
- [ ] Authentication and role-based access control
- [ ] Improved PDF report customization
- [ ] Additional network performance analytics

---

## 🤝 Contributing

Contributions, bug reports, feature suggestions, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement and test your changes.
4. Commit your changes with a descriptive message.
5. Open a pull request describing your contribution.

Please ensure that changes are tested and that sensitive credentials are not included in commits.

---

## 📄 License

This project is distributed under the **Apache License 2.0**.

See the `LICENSE` file in the repository for the complete license terms.

---

## 🌐 Explore NetScope Pro

Ready to explore network engineering and diagnostics in one place?

**🚀 Visit the live website: [https://bytenova.sbs](https://bytenova.sbs)**

Built for network enthusiasts, developers, and engineers who want to turn complex networking concepts into practical tools.

**NetScope Pro — Analyze. Diagnose. Engineer.**
