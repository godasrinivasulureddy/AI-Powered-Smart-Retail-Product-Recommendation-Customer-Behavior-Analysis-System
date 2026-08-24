import React, { useEffect, useState } from 'react';
import { Database, CheckCircle, Clock, Cpu } from 'lucide-react';
import { api } from '../services/api.ts';
import { ModelMetricEntry } from '../types/index.ts';

export const ModelRegistryView: React.FC = () => {
  const [models, setModels] = useState<ModelMetricEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getModelMetrics()
      .then((data) => {
        setModels(data);
      })
      .catch((err) => {
        console.error('Failed to load model registry metrics:', err);
        setError(err.message || 'Failed to load model registry.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const formatValue = (v: any): string => {
    if (typeof v === 'number') {
      return Number.isInteger(v) ? v.toString() : v.toFixed(4);
    }
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (Array.isArray(v)) return JSON.stringify(v);
    if (typeof v === 'object' && v !== null) return JSON.stringify(v);
    return String(v);
  };

  const formatKeyName = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Database className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active ML Model Registry</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Production registry of trained models, artifact versions, and validated statistical metrics.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
              All Production Artifacts Active
            </span>
          </div>
        </div>
      </div>

      {/* Model Cards Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400">Loading model registry...</div>
        ) : error ? (
          <div className="col-span-full text-center py-12 text-rose-500 text-sm">{error}</div>
        ) : (
          models.map((m, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between min-w-0 w-full overflow-hidden"
            >
              <div className="min-w-0 space-y-4">
                {/* Header info */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span
                    className="text-[11px] font-bold text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 truncate max-w-[200px]"
                    title={m.version}
                  >
                    {m.version}
                  </span>
                  <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    <CheckCircle className="w-3 h-3 mr-1 text-emerald-500" />
                    Active
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base mb-1 font-mono break-words">
                    {m.model_name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                    Trained: {new Date(m.trained_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Validation Metrics Box */}
                <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-0">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                    Validation Metrics
                  </span>

                  {Object.entries(m.metrics).map(([key, val]) => {
                    // Special structured rendering for all_models dictionary
                    if (key === 'all_models' && typeof val === 'object' && val !== null) {
                      return (
                        <div key={key} className="space-y-2 pt-2 border-t border-slate-200/60 min-w-0">
                          <span className="text-xs font-bold text-slate-700 block">
                            Model Comparison Breakdown:
                          </span>
                          {Object.entries(val).map(([modelKey, modelMetrics]) => (
                            <div key={modelKey} className="bg-white p-2.5 rounded-lg border border-slate-200/70 text-xs space-y-1 min-w-0">
                              <span className="font-mono font-bold text-indigo-600 uppercase text-[10px] block border-b border-slate-100 pb-1 mb-1">
                                {formatKeyName(modelKey)}
                              </span>
                              {typeof modelMetrics === 'object' && modelMetrics !== null ? (
                                Object.entries(modelMetrics).map(([mk, mv]) => (
                                  <div key={mk} className="flex justify-between items-center text-[11px] min-w-0 gap-2">
                                    <span className="text-slate-500 font-medium truncate">{formatKeyName(mk)}</span>
                                    <span className="font-mono font-semibold text-slate-900 shrink-0 break-all max-w-[140px] text-right">
                                      {formatValue(mv)}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span className="font-mono text-slate-800 break-all">{formatValue(modelMetrics)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    }

                    // Standard key-value metrics
                    return (
                      <div key={key} className="flex justify-between items-center text-xs min-w-0 gap-2 pt-1 border-t border-slate-100/60">
                        <span className="text-slate-600 font-medium truncate shrink-0">{formatKeyName(key)}</span>
                        <span className="font-mono font-bold text-slate-900 break-all text-right truncate" title={formatValue(val)}>
                          {formatValue(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center">
                  <Cpu className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                  Inference: &lt;15ms
                </span>
                <span className="text-[11px] font-mono text-slate-400">spec v2</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

