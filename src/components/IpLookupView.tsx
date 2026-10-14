import React, { useState, useEffect } from 'react';
import { IpLookupPayload } from '../types';
import { exportCsvFile } from '../utils/reportExporter';
import {
  Globe,
  Search,
  MapPin,
  Server,
  ShieldAlert,
  Activity,
  Copy,
  Check,
  Download,
  Crosshair,
  Wifi,
  ExternalLink,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { GoogleMapsPreciseView } from './GoogleMapsPreciseView';
import { ErrorBoundary } from './ErrorBoundary';

export const IpLookupView: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="IP Address Intelligence Recovery">
      <IpLookupInner />
    </ErrorBoundary>
  );
};

const IpLookupInner: React.FC = () => {
  const [targetInput, setTargetInput] = useState('1.1.1.1');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IpLookupPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pinging, setPinging] = useState(false);

  const fetchIpData = async (target?: string) => {
    const rawTarget = target !== undefined ? target : targetInput;
    const cleanTarget = rawTarget.trim();

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/ip-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: cleanTarget }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to lookup IP information');
      }
      setData(json);
      runPingCheck();
    } catch (err: any) {
      setError(err.message || 'Lookup failed. Please verify the IP address or domain name.');
    } finally {
      setLoading(false);
    }
  };

  const handleDetectMyIp = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/my-ip');
      const json = await res.json();
      if (json && json.ip) {
        setTargetInput(json.ip);
        fetchIpData(json.ip);
        return;
      }
    } catch {}
    fetchIpData('');
  };

  const runPingCheck = async () => {
    setPinging(true);
    const start = performance.now();
    try {
      await fetch('/api/v1/speedtest/ping');
      const diff = Math.round(performance.now() - start);
      setPingLatency(diff);
    } catch {
      setPingLatency(null);
    } finally {
      setPinging(false);
    }
  };

  useEffect(() => {
    fetchIpData('1.1.1.1');
  }, []);

  const copyVal = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleExportCsv = () => {
    if (!data) return;
    const rows = [
      ['Attribute', 'Value'],
      ['Query Target', data.query],
      ['Resolved IP', data.ip],
      ['Protocol Version', data.version],
      ['Hostname / Reverse DNS', data.hostname || 'None'],
      ['Country', data.country],
      ['Region / State', data.region],
      ['City', data.city],
      ['Coordinates', `${data.lat}, ${data.lon}`],
      ['Timezone', data.timezone],
      ['ISP', data.isp],
      ['Organization', data.organization],
      ['Autonomous System (ASN)', data.asn],
      ['Is Private RFC1918', String(data.isPrivate)],
    ];
    exportCsvFile(`IP_Lookup_${data.ip}`, rows);
  };

  const numLat = Number(data?.lat ?? 37.7749);
  const numLon = Number(data?.lon ?? -122.4194);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              IP Address Intelligence & ASN Telemetry
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              GeoIP & BGP Routing
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Resolve any IPv4, IPv6, or domain name to autonomous systems, physical coordinates, and network topology.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDetectMyIp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400 transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Detect My Public IP</span>
          </button>
          {data && (
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Input Search Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchIpData();
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="Enter IP address (e.g. 1.1.1.1, 2606:4700::) or domain (e.g. github.com)"
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Inspect IP</span>
          </button>
        </form>

        {/* Public IP Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px] font-mono">
          <span className="text-slate-400 font-sans">Quick Presets:</span>
          {[
            { label: 'Cloudflare (1.1.1.1)', val: '1.1.1.1' },
            { label: 'Google (8.8.8.8)', val: '8.8.8.8' },
            { label: 'Quad9 (9.9.9.9)', val: '9.9.9.9' },
            { label: 'OpenDNS (208.67.222.222)', val: '208.67.222.222' },
            { label: 'GitHub (140.82.121.4)', val: '140.82.121.4' },
          ].map((preset) => (
            <button
              key={preset.val}
              type="button"
              onClick={() => {
                setTargetInput(preset.val);
                fetchIpData(preset.val);
              }}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 text-slate-600 dark:text-slate-300 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-3 p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setTargetInput('1.1.1.1');
                fetchIpData('1.1.1.1');
              }}
              className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-200 font-semibold text-xs shrink-0 self-start sm:self-auto transition-colors"
            >
              Reset to 1.1.1.1
            </button>
          </div>
        )}
      </div>

      {loading && !data && (
        <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
          <div className="w-8 h-8 mx-auto border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-mono text-slate-500">Querying IP intelligence and physical geolocation...</div>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* RFC 1918 Private IP Notice Banner */}
          {data.isPrivate && (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-900 dark:text-amber-200">
                    RFC 1918 Private Intranet Address ({data.ip})
                  </div>
                  <p className="text-amber-700 dark:text-amber-300 text-[11px] mt-0.5 leading-relaxed">
                    This IP address belongs to an internal local area network (LAN/VPC) and does not exist on public BGP backbones. Geolocation coordinates are centered on your public internet gateway.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDetectMyIp}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 shadow-sm transition-colors"
              >
                Inspect My Public Internet IP
              </button>
            </div>
          )}

          {/* Main IP Overview Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] font-medium text-slate-500">Query Target</span>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1 truncate">
                {data.ip}
              </div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                {data.version} · {data.isPrivate ? 'RFC 1918 Private' : 'Public Routable'}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] font-medium text-slate-500">Reverse DNS (PTR)</span>
              <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white mt-1 truncate">
                {data.reverseDns || data.hostname || 'No PTR Record'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">PTR Resolver</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] font-medium text-slate-500">ISP / Carrier</span>
              <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">
                {data.isp}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{data.organization}</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] font-medium text-slate-500">Roundtrip Latency</span>
              <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-2">
                {pinging ? (
                  <span className="text-xs text-slate-400">Probing...</span>
                ) : pingLatency !== null ? (
                  <span>{pingLatency} ms</span>
                ) : (
                  <span>--</span>
                )}
                <button
                  type="button"
                  onClick={runPingCheck}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                  title="Re-ping"
                >
                  <Wifi className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">ICMP/TCP RTT Estimate</div>
            </div>
          </div>

          {/* Interactive World Map & Geo Location */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* High-Precision Google Maps Geolocation Visualizer */}
            <div className="lg:col-span-7 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  High-Precision Geolocation & Maps
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  Lat: {numLat.toFixed(4)}°, Lon: {numLon.toFixed(4)}°
                </span>
              </div>

              <GoogleMapsPreciseView
                lat={numLat}
                lng={numLon}
                ip={data.ip}
                city={data.city}
                region={data.region}
                country={data.country}
                countryCode={data.countryCode}
                isp={data.isp}
                asn={data.asn}
                isPrivate={data.isPrivate}
              />
            </div>

            {/* Geo and BGP Routing Details */}
            <div className="lg:col-span-5 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-500" />
                Autonomous System & Routing Data
              </h3>

              <div className="space-y-2.5 text-xs font-mono">
                {[
                  { label: 'Autonomous System (ASN)', val: data.asn },
                  { label: 'Internet Service Provider', val: data.isp },
                  { label: 'Hosting Organization', val: data.organization },
                  { label: 'Country & Code', val: `${data.country} (${data.countryCode})` },
                  { label: 'Region / Province', val: data.region },
                  { label: 'City', val: data.city },
                  { label: 'Postal / ZIP Code', val: data.zip || 'N/A' },
                  { label: 'Regional Timezone', val: data.timezone },
                  { label: 'IP Security Status', val: data.isPrivate ? 'RFC 1918 Private Intranet' : 'Public Routable BGP' },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex justify-between items-center gap-3"
                  >
                    <span className="text-slate-500 shrink-0">{row.label}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right break-words max-w-[62%] leading-snug">
                      {row.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
