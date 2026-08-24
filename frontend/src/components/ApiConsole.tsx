import React, { useState } from 'react';
import { Terminal, Send, Play, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { api, getAuthToken } from '../services/api.ts';


interface EndpointPreset {
  name: string;
  method: 'GET' | 'POST';
  url: string;
  body?: string;
  description: string;
}

export const ApiConsole: React.FC = () => {
  const presets: EndpointPreset[] = [
    {
      name: 'System Health Check',
      method: 'GET',
      url: '/api/v1/health',
      description: 'Checks microservice health, environment, and version.',
    },
    {
      name: 'Executive Dashboard KPI',
      method: 'GET',
      url: '/api/v1/dashboard/executive',
      description: 'Returns total customers, orders, gross revenue, and AOV.',
    },
    {
      name: 'Customer Segment Breakdown',
      method: 'GET',
      url: '/api/v1/dashboard/segments',
      description: 'Returns counts and percentages for each behavioral segment.',
    },
    {
      name: 'Top Selling Products',
      method: 'GET',
      url: '/api/v1/dashboard/products?limit=5',
      description: 'Returns top retail stockcodes ranked by volume dispatched.',
    },
    {
      name: 'List Profiled Customers',
      method: 'GET',
      url: '/api/v1/customers?limit=5',
      description: 'Paginated customer list with embedded RFM features and segments.',
    },
    {
      name: 'Get Customer #1 Features',
      method: 'GET',
      url: '/api/v1/customers/1/features',
      description: 'Returns computed RFM attributes for specific customer.',
    },
    {
      name: 'Predict Purchase Likelihood (ML)',
      method: 'POST',
      url: '/api/v1/predict/purchase',
      body: JSON.stringify({ customer_id: 1 }, null, 2),
      description: 'Executes active Logistic Regression inference returning probability.',
    },
    {
      name: 'Get AI Recommendations',
      method: 'POST',
      url: '/api/v1/recommend',
      body: JSON.stringify({ customer_id: 1, top_n: 4 }, null, 2),
      description: 'Runs item collaborative filtering to recommend top product stockcodes.',
    },

    {
      name: 'User Authentication Login',
      method: 'POST',
      url: '/api/v1/auth/login',
      body: JSON.stringify({ email: 'analyst@retail-ai.internal', password: 'password123' }, null, 2),
      description: 'Authenticates system user and returns JWT token pair.',
    },
  ];

  const [selectedPreset, setSelectedPreset] = useState<EndpointPreset>(presets[0]);
  const [method, setMethod] = useState<'GET' | 'POST'>(presets[0].method);
  const [url, setUrl] = useState<string>(presets[0].url);
  const [body, setBody] = useState<string>(presets[0].body || '');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const applyPreset = (preset: EndpointPreset) => {
    setSelectedPreset(preset);
    setMethod(preset.method);
    setUrl(preset.url);
    setBody(preset.body || '');
  };

  const executeRequest = async () => {
    try {
      setLoading(true);
      setResponseData(null);
      const start = performance.now();

      const token = getAuthToken();
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };
      if (method === 'POST' && body) {
        options.body = body;
      }

      const res = await fetch(url, options);

      const duration = Math.round(performance.now() - start);
      setResponseTime(duration);
      setResponseStatus(res.status);

      const json = await res.json();
      setResponseData(JSON.stringify(json, null, 2));
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData(JSON.stringify({ error: err.message || 'Request failed' }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (responseData) {
      navigator.clipboard.writeText(responseData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-slate-900 text-slate-100 rounded-lg">
                <Terminal className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Interactive REST API Console</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Directly dispatch HTTP requests to live FastAPI-compatible Express backend routes.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="text-slate-500">Envelope Standard:</span>
            <span className="font-bold text-slate-800">&#123; data, error &#125;</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Preset Selector */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 block">
            Endpoint Presets
          </span>

          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {presets.map((p, idx) => {
              const isSelected = selectedPreset.name === p.name;
              return (
                <button
                  key={idx}
                  onClick={() => applyPreset(p)}
                  className={`w-full text-left p-3 rounded-xl transition-all text-xs flex flex-col space-y-1 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{p.name}</span>
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        p.method === 'GET'
                          ? isSelected
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-emerald-50 text-emerald-700'
                          : isSelected
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {p.method}
                    </span>
                  </div>
                  <span className={`text-[11px] truncate font-mono ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {p.url}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Request & Response Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {/* Request Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as 'GET' | 'POST')}
                className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>

              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />

              <button
                onClick={executeRequest}
                disabled={loading}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{loading ? 'Executing...' : 'Send Request'}</span>
              </button>
            </div>

            {method === 'POST' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Request Body (JSON)</label>
                <textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-xl focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Response Inspector */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden text-slate-100 font-mono text-xs">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-slate-400">Response Payload</span>
                {responseStatus && (
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    HTTP {responseStatus}
                  </span>
                )}
                {responseTime && (
                  <span className="text-slate-500 text-[11px]">{responseTime}ms</span>
                )}
              </div>

              {responseData && (
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-1 text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-[11px]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              )}
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="py-8 text-center text-slate-500">Dispatching request to server...</div>
              ) : responseData ? (
                <pre className="text-emerald-400 leading-relaxed overflow-x-auto">{responseData}</pre>
              ) : (
                <div className="py-8 text-center text-slate-500">
                  Select an endpoint preset and click 'Send Request' to execute.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
