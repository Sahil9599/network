import React, { useState, useEffect } from 'react';
import { ApiKeyItem } from '../types';
import {
  Terminal,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Code2,
  Play,
  Layers,
  BookOpen,
  ShieldCheck,
  Send,
} from 'lucide-react';

export const ApiDocsView: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('dns');
  const [codeLang, setCodeLang] = useState<'curl' | 'python' | 'js' | 'go'>('curl');

  // Interactive Sandbox
  const [sandboxRequest, setSandboxRequest] = useState<string>(
    JSON.stringify({ domain: 'google.com', recordType: 'ALL' }, null, 2)
  );
  const [sandboxResponse, setSandboxResponse] = useState<string>('');
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/v1/api-keys');
      const data = await res.json();
      if (data.keys) setKeys(data.keys);
    } catch {
      //
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyLabel) return;
    try {
      const res = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyLabel, rateLimit: 120 }),
      });
      if (res.ok) {
        fetchKeys();
        setNewKeyLabel('');
      }
    } catch {
      //
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      await fetch(`/api/v1/api-keys/${id}`, { method: 'DELETE' });
      setKeys(keys.filter((k) => k.id !== id));
    } catch {
      //
    }
  };

  const copyVal = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Endpoint definitions
  const endpoints = [
    {
      id: 'dns',
      name: 'DNS Resolution API',
      method: 'POST',
      path: '/api/v1/dns',
      desc: 'Resolve A, AAAA, MX, TXT, NS, SOA records for any domain.',
      sampleBody: { domain: 'google.com', recordType: 'ALL' },
    },
    {
      id: 'ip-lookup',
      name: 'IP & ASN Intelligence',
      method: 'POST',
      path: '/api/v1/ip-lookup',
      desc: 'Get Autonomous System, ISP, country, and geo-coordinates.',
      sampleBody: { target: '1.1.1.1' },
    },
    {
      id: 'uptime',
      name: 'Website Health & SSL Audit',
      method: 'POST',
      path: '/api/v1/uptime',
      desc: 'Probe HTTP response, connection waterfall timings, and TLS cert.',
      sampleBody: { url: 'https://www.google.com' },
    },
    {
      id: 'port-check',
      name: 'TCP Port Prober',
      method: 'POST',
      path: '/api/v1/port-check',
      desc: 'Check TCP socket connectivity and handshake latency.',
      sampleBody: { host: '1.1.1.1', ports: [80, 443, 22] },
    },
    {
      id: 'speedtest-ping',
      name: 'Latency Node Ping',
      method: 'GET',
      path: '/api/v1/speedtest/ping',
      desc: 'Measure core engine server round-trip latency and node health.',
      sampleBody: null,
    },
  ];

  const currentEp = endpoints.find((e) => e.id === selectedEndpoint) || endpoints[0];

  const handleSelectEndpoint = (ep: typeof currentEp) => {
    setSelectedEndpoint(ep.id);
    if (ep.sampleBody) {
      setSandboxRequest(JSON.stringify(ep.sampleBody, null, 2));
    } else {
      setSandboxRequest('{}');
    }
    setSandboxResponse('');
  };

  const executeSandbox = async () => {
    setSandboxLoading(true);
    setSandboxResponse('');
    try {
      const activeKey = keys[0]?.key || 'ns_live_demo_key';
      let options: RequestInit = {
        method: currentEp.method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': activeKey,
        },
      };

      if (currentEp.method !== 'GET') {
        options.body = sandboxRequest;
      }

      const res = await fetch(currentEp.path, options);
      const data = await res.json();
      setSandboxResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setSandboxResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setSandboxLoading(false);
    }
  };

  // Generate code snippet
  const activeKeySample = keys[0]?.key || 'YOUR_API_KEY_HERE';
  const getCodeSnippet = () => {
    const fullUrl = `${window.location.origin}${currentEp.path}`;
    if (codeLang === 'curl') {
      if (currentEp.method === 'GET') {
        return `curl -X GET "${fullUrl}" \\\n  -H "X-API-Key: ${activeKeySample}"`;
      }
      return `curl -X POST "${fullUrl}" \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: ${activeKeySample}" \\\n  -d '${sandboxRequest.replace(/\n\s*/g, ' ')}'`;
    }
    if (codeLang === 'python') {
      if (currentEp.method === 'GET') {
        return `import requests\n\nheaders = {"X-API-Key": "${activeKeySample}"}\nresponse = requests.get("${fullUrl}", headers=headers)\nprint(response.json())`;
      }
      return `import requests\n\nheaders = {\n    "Content-Type": "application/json",\n    "X-API-Key": "${activeKeySample}"\n}\npayload = ${sandboxRequest}\n\nresponse = requests.post("${fullUrl}", json=payload, headers=headers)\nprint(response.json())`;
    }
    if (codeLang === 'js') {
      if (currentEp.method === 'GET') {
        return `const res = await fetch("${fullUrl}", {\n  headers: { "X-API-Key": "${activeKeySample}" }\n});\nconst data = await res.json();\nconsole.log(data);`;
      }
      return `const res = await fetch("${fullUrl}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "X-API-Key": "${activeKeySample}"\n  },\n  body: JSON.stringify(${sandboxRequest.replace(/\n\s*/g, ' ')})\n});\nconst data = await res.json();\nconsole.log(data);`;
    }
    if (codeLang === 'go') {
      return `package main\n\nimport (\n    "bytes"\n    "fmt"\n    "net/http"\n)\n\nfunc main() {\n    req, _ := http.NewRequest("${currentEp.method}", "${fullUrl}", bytes.NewBuffer([]byte(\`${sandboxRequest}\`)))\n    req.Header.Set("Content-Type", "application/json")\n    req.Header.Set("X-API-Key", "${activeKeySample}")\n    client := &http.Client{}\n    resp, _ := client.Do(req)\n    fmt.Println(resp.Status)\n}`;
    }
    return '';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Developer REST API & Key Management
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              v1.0 Endpoints
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Programmatic access to DNS queries, IP geolocation, TCP port testing, and uptime health monitors.
          </p>
        </div>
      </div>

      {/* API Key Management Card */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-500" />
              Active External API Keys ({keys.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Authenticate third-party scripts via HTTP header <code className="text-blue-500 font-mono">X-API-Key</code> or Bearer session token.
            </p>
          </div>

          <form onSubmit={handleCreateKey} className="flex gap-2">
            <input
              type="text"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              placeholder="Key label (e.g. CI/CD Daemon)"
              required
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Key</span>
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold">
                <th className="py-2.5 px-3">Label</th>
                <th className="py-2.5 px-3">Secret API Key</th>
                <th className="py-2.5 px-3">Rate Limit</th>
                <th className="py-2.5 px-3">Created</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">{k.name}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{k.key.substring(0, 12)}••••••••••••</span>
                      <button
                        onClick={() => copyVal(k.key, k.id)}
                        className="text-slate-400 hover:text-blue-500"
                        title="Copy API key"
                      >
                        {copiedKey === k.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{k.rateLimit} req/min</td>
                  <td className="py-3 px-3 text-slate-400">{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleDeleteKey(k.id)}
                      className="p-1.5 rounded hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 text-slate-400 transition-colors"
                      title="Revoke key"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Sandbox & Documentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoint Selector Menu */}
        <div className="lg:col-span-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            API Endpoints Catalog
          </h3>

          <div className="space-y-1">
            {endpoints.map((ep) => {
              const isSelected = selectedEndpoint === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded font-mono ${
                        ep.method === 'POST'
                          ? 'bg-blue-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {ep.name}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                    {ep.path}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Runner & Code Snippets */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-bold font-mono rounded bg-blue-600 text-white">
                    {currentEp.method}
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                    {currentEp.path}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{currentEp.desc}</div>
              </div>

              {/* Code Snippet Lang Switcher */}
              <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-mono">
                {(['curl', 'python', 'js', 'go'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setCodeLang(l)}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      codeLang === l
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Code Box */}
            <div className="relative">
              <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                {getCodeSnippet()}
              </pre>
              <button
                onClick={() => copyVal(getCodeSnippet(), 'code_snip')}
                className="absolute top-2.5 right-2.5 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Copy code"
              >
                {copiedKey === 'code_snip' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Live Request Payload & Send */}
            {currentEp.method !== 'GET' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>JSON Request Payload:</span>
                  <button
                    onClick={executeSandbox}
                    disabled={sandboxLoading}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {sandboxLoading ? (
                      <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send Request</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={sandboxRequest}
                  onChange={(e) => setSandboxRequest(e.target.value)}
                  className="w-full p-3 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {currentEp.method === 'GET' && (
              <div className="flex justify-end">
                <button
                  onClick={executeSandbox}
                  disabled={sandboxLoading}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                >
                  {sandboxLoading ? (
                    <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Test Endpoint</span>
                </button>
              </div>
            )}

            {/* Sandbox Response Output */}
            {sandboxResponse && (
              <div className="space-y-1.5 pt-2">
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Live HTTP Response:
                </div>
                <pre className="p-3.5 rounded-lg bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-60 border border-slate-800">
                  {sandboxResponse}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
