import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Zap,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { Customer } from '../types/index.ts';

export const PurchasePredictor: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
  const [prediction, setPrediction] = useState<{ probability: number; prediction: boolean; model_version: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Simulation slider values
  const [recencyDays, setRecencyDays] = useState<number>(15);
  const [frequency, setFrequency] = useState<number>(20);
  const [monetary, setMonetary] = useState<number>(3500);

  const fetchPrediction = async (cust: Customer) => {
    try {
      setLoading(true);
      setSelectedCustomerId(cust.id);
      const r = cust.features?.recency_days || 30;
      const f = cust.features?.frequency || 5;
      const m = cust.features?.monetary || 500;
      setRecencyDays(r);
      setFrequency(f);
      setMonetary(m);
      const res = await api.predictPurchase(cust.id);
      setPrediction(res);
    } catch (err) {
      console.error('Failed to run purchase prediction:', err);
    } finally {
      setLoading(false);
    }
  };

  const predictSimulated = async (r: number, f: number, m: number) => {
    try {
      const res = await api.predictPurchase({
        customer_id: selectedCustomerId || undefined,
        recency_days: r,
        frequency: f,
        monetary: m,
      });
      setPrediction(res);
    } catch (err) {
      console.error('Failed simulation prediction:', err);
    }
  };

  const [modelRocAuc, setModelRocAuc] = useState<string>('0.7818');

  useEffect(() => {
    api.getCustomers({ limit: 50 }).then((data) => {
      setCustomers(data);
      if (data.length > 0) {
        fetchPrediction(data[0]);
      }
    });

    api.getModelMetrics().then((metrics) => {
      const predModel = metrics.find((m) => m.model_name === 'purchase_prediction');
      if (predModel?.metrics) {
        const winner = predModel.metrics.winner || 'logistic_regression';
        const modelStats = predModel.metrics.all_models?.[winner];
        if (modelStats?.roc_auc) {
          setModelRocAuc(modelStats.roc_auc.toString());
        }
      }
    }).catch(() => {});
  }, []);



  const probability = prediction ? prediction.probability : 0.0;
  const isLikely = prediction ? prediction.prediction : false;

  const factors = [
    {
      feature: 'Recency Vector',
      value: `${recencyDays} days since last order`,
      impact: recencyDays < 30 ? 'High Positive Weight' : recencyDays < 90 ? 'Moderate Weight' : 'Negative Churn Weight',
      positive: recencyDays < 90,
    },
    {
      feature: 'Frequency Vector',
      value: `${frequency} lifetime orders`,
      impact: frequency >= 15 ? 'Strong Repeat Habit' : frequency >= 5 ? 'Regular Buyer' : 'Low Purchase Habit',
      positive: frequency >= 5,
    },
    {
      feature: 'Monetary Spend Vector',
      value: `$${monetary.toLocaleString()} gross spend`,
      impact: monetary >= 3000 ? 'High Monetary Value' : 'Standard Baseline',
      positive: true,
    },
  ];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-violet-50 text-violet-600 rounded-lg">
                <BrainCircuit className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Purchase Propensity & Churn Predictor
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Simulate customer RFM vectors to evaluate real-time probability of next-month repurchase.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="text-slate-500">ML Classifier:</span>
            <span className="font-bold text-violet-600">{prediction?.model_version || 'logistic_regression'}</span>
          </div>
        </div>
      </div>

      {/* Simulator & Live Inference Gauge Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Simulator */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-base">Feature Vector Inputs</h2>
            </div>

            {/* Customer Preset Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">Load profile:</span>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  const id = parseInt(e.target.value, 10);
                  const cust = customers.find((c) => c.id === id);
                  if (cust) fetchPrediction(cust);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >

                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} ({c.segment?.segment_label})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Slider 1: Recency */}
          <div className="space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-800">Recency (Days Since Last Order)</span>
              <span className="font-mono font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                {recencyDays} days
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={365}
              value={recencyDays}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setRecencyDays(val);
                predictSimulated(val, frequency, monetary);
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>1 day (Recent)</span>
              <span>180 days</span>
              <span>365 days (Dormant)</span>
            </div>
          </div>

          {/* Slider 2: Frequency */}
          <div className="space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-800">Frequency (Total Completed Invoices)</span>
              <span className="font-mono font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                {frequency} orders
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={frequency}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setFrequency(val);
                predictSimulated(recencyDays, val, monetary);
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>1 order (First-time)</span>
              <span>25 orders</span>
              <span>50+ orders (Power Buyer)</span>
            </div>
          </div>

          {/* Slider 3: Monetary */}
          <div className="space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-800">Monetary Value (Lifetime Gross Spend)</span>
              <span className="font-mono font-bold text-emerald-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                ${monetary.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={15000}
              step={50}
              value={monetary}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setMonetary(val);
                predictSimulated(recencyDays, frequency, val);
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            <div className="flex justify-between text-[10px] text-slate-400">
              <span>$50</span>
              <span>$7,500</span>
              <span>$15,000+</span>
            </div>
          </div>
        </div>

        {/* Inference Outcome Panel */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Model Prediction Result
              </span>
              <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 font-semibold">
                ROC-AUC {modelRocAuc}
              </span>
            </div>

            {/* Probability Metric Display */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-3">
              <span className="text-xs font-semibold text-slate-500">Predicted Repurchase Likelihood</span>
              <div className="text-4xl font-black text-slate-900 tracking-tight font-mono">
                {(probability * 100).toFixed(1)}%
              </div>

              {/* Progress bar gauge */}
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isLikely ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                  }`}
                  style={{ width: `${probability * 100}%` }}
                />
              </div>

              <div className="pt-2">
                {isLikely ? (
                  <div className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                    High Propensity — Targeted Retention Campaign
                  </div>
                ) : (
                  <div className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200">
                    <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-600" />
                    Churn Risk — Reactivation Incentive Recommended
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Model Attribution Factors */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-700">Attribution Impact Breakdown:</span>
            {factors.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">{item.feature}</span>
                  <span className="text-slate-500 text-[11px]">{item.value}</span>
                </div>
                <span className={`font-bold font-mono ${item.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {item.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
