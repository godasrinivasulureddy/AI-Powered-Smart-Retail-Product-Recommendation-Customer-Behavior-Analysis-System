import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Sliders,
  ShoppingBag,
  TrendingUp,
  Tag,
  Layers,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { Customer, RecommendationResult } from '../types/index.ts';

export const RecommendationSandbox: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(17850);
  const [topN, setTopN] = useState<number>(6);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getCustomers({ limit: 50 }).then((data) => {
      setCustomers(data);
      if (data.length > 0) {
        setSelectedCustomerId(data[0].id);
        runRecommendation(data[0].id, topN);
      }
    });
  }, []);

  const runRecommendation = async (customerId: number, n: number) => {
    try {
      setLoading(true);
      const res = await api.getRecommendations(customerId, n);
      setResult(res);
    } catch (err) {
      console.error('Failed to get recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = () => {
    runRecommendation(selectedCustomerId, topN);
  };

  const selectedCustomerObj = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                AI Product Recommendation Sandbox
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Test collaborative filtering and popularity-hybrid recommendations across distinct customer personas.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="text-slate-500">Active Model:</span>
            <span className="font-bold text-indigo-600">{result?.model_version || 'item_cf'}</span>
          </div>
        </div>
      </div>

      {/* Control Configuration Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Target Customer
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                const id = parseInt(e.target.value, 10);
                setSelectedCustomerId(id);
                runRecommendation(id, topN);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id} — {c.segment?.segment_label || 'Customer'} ({c.country}, ${c.features?.monetary ? c.features.monetary.toFixed(0) : '0'} spent)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Recommendation Depth (Top-N: {topN})
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min={2}
                max={12}
                value={topN}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setTopN(val);
                  runRecommendation(selectedCustomerId, val);
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="font-mono text-sm font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
                {topN}
              </span>
            </div>
          </div>


          <div>
            <button
              onClick={handleRun}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing Affinity Vectors...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Recommendations</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Customer Context Strip */}
        {selectedCustomerObj && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
            <div className="flex items-center space-x-4">
              <span>
                Segment: <strong className="text-slate-900">{selectedCustomerObj.segment?.segment_label || 'Unassigned'}</strong>
              </span>
              <span>•</span>
              <span>
                Recency: <strong className="text-slate-900">{selectedCustomerObj.features?.recency_days ?? '-'} days</strong>
              </span>
              <span>•</span>
              <span>
                Lifetime Orders: <strong className="text-slate-900">{selectedCustomerObj.features?.frequency ?? 0}</strong>
              </span>
              <span>•</span>
              <span>
                Monetary: <strong className="text-emerald-600">${selectedCustomerObj.features?.monetary ? selectedCustomerObj.features.monetary.toFixed(2) : '0.00'}</strong>
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Inference time: ~12ms (in-memory matrix similarity)
            </span>
          </div>
        )}
      </div>

      {/* Results Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Recommended Products ({result?.recommendations.length || 0})
          </h2>
          <span className="text-xs text-slate-500 font-medium">Ranked by Cosine Similarity & Cluster Lift</span>
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Calculating co-occurrence matrix...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {result?.recommendations.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                      {item.external_id}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600 font-mono bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {(item.score * 100).toFixed(0)}% Match
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-2 leading-snug line-clamp-2">
                    {item.description}
                  </h3>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600 mb-4">
                    <span className="font-semibold text-slate-700 block mb-0.5 text-[11px] uppercase tracking-wide">
                      AI Reasoning
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{item.reason}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {item.unit_price ? `$${item.unit_price.toFixed(2)}` : 'N/A'}
                  </span>
                  <span className="inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-700">
                    <span>Simulate Add to Cart</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
