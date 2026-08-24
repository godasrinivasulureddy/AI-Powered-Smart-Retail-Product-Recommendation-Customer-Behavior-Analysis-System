import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Calendar,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { Customer, PurchasePredictionResult, RecommendationResult } from '../types/index.ts';

export const CustomerExplorer: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Prediction & recommendation state for selected customer
  const [prediction, setPrediction] = useState<PurchasePredictionResult | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers({
        segment: segmentFilter,
        search: searchQuery,
      });
      setCustomers(data);
      if (data.length > 0 && !selectedCustomer) {
        selectCustomer(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [segmentFilter]);

  const selectCustomer = async (cust: Customer) => {
    setSelectedCustomer(cust);
    setActionLoading(true);

    api.predictPurchase(cust.id)
      .then((pred) => setPrediction(pred))
      .catch((err) => console.error('Failed purchase prediction for customer', cust.id, err));

    api.getRecommendations(cust.id, 4)
      .then((recs) => setRecommendations(recs))
      .catch((err) => console.error('Failed recommendations for customer', cust.id, err))
      .finally(() => setActionLoading(false));
  };


  const getSegmentBadge = (segment?: string) => {
    switch (segment) {
      case 'Champions':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Loyal Customers':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Potential Loyalists':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Promising':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'At Risk':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Hibernating':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'Lost':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer RFM Segmentation</h1>
            <p className="text-sm text-slate-500 mt-1">
              Explore profiled retail accounts with behavioral features and live inference scoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ID, country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
                className="pl-9 pr-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-48 sm:w-56"
              />
            </div>

            {/* Segment Filter */}
            <div className="flex items-center space-x-1.5">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
                className="text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="All">All Segments</option>
                <option value="Champions">Champions</option>
                <option value="Loyal Customers">Loyal Customers</option>
                <option value="Potential Loyalists">Potential Loyalists</option>
                <option value="Promising">Promising</option>
                <option value="At Risk">At Risk</option>
                <option value="Hibernating">Hibernating</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: List + Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Table List */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Profiled Customers ({customers.length})
            </span>
            <span className="text-xs text-slate-400">Click a row to inspect AI predictions</span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-sm text-slate-500">Loading customer cohort...</div>
            ) : customers.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">No customers found matching filter.</div>
            ) : (
              customers.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    className={`p-4 cursor-pointer transition-colors flex items-center justify-between hover:bg-slate-50 ${
                      isSelected ? 'bg-indigo-50/60 border-l-4 border-indigo-600' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 font-mono text-sm">
                          #{c.id}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">({c.external_id})</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getSegmentBadge(c.segment?.segment_label)}`}>
                          {c.segment?.segment_label || 'Unassigned'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-500">
                        <span className="flex items-center">
                          <Globe className="w-3 h-3 mr-1 text-slate-400" />
                          {c.country}
                        </span>
                        <span>•</span>
                        <span>{c.features?.frequency || 0} orders</span>
                        <span>•</span>
                        <span className="font-medium text-slate-700">
                          ${c.features?.monetary.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'} spent
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-right">
                      <div className="hidden sm:block">
                        <div className="text-xs font-medium text-slate-700">
                          {c.features?.recency_days} days ago
                        </div>
                        <div className="text-[10px] text-slate-400">Recency</div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Customer AI Intelligence Pane */}
        <div className="lg:col-span-5 space-y-6">
          {selectedCustomer ? (
            <>
              {/* Profile Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-indigo-600 font-bold">
                      {selectedCustomer.external_id}
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Customer #{selectedCustomer.id}
                    </h2>
                    <p className="text-xs text-slate-500 flex items-center mt-0.5">
                      <Globe className="w-3 h-3 mr-1 text-slate-400" />
                      {selectedCustomer.country} • Registered {selectedCustomer.created_at}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getSegmentBadge(selectedCustomer.segment?.segment_label)}`}>
                    {selectedCustomer.segment?.segment_label}
                  </span>
                </div>

                {/* RFM Matrix */}
                <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recency</span>
                    <p className="text-base font-bold text-slate-900">{selectedCustomer.features?.recency_days} days</p>
                    <span className="text-[10px] text-slate-500">Since last invoice</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Frequency</span>
                    <p className="text-base font-bold text-slate-900">{selectedCustomer.features?.frequency} orders</p>
                    <span className="text-[10px] text-slate-500">Total historical orders</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Monetary</span>
                    <p className="text-base font-bold text-emerald-600 font-mono">
                      ${selectedCustomer.features?.monetary.toFixed(2)}
                    </p>
                    <span className="text-[10px] text-slate-500">Lifetime gross spend</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Order</span>
                    <p className="text-base font-bold text-slate-900 font-mono">
                      ${selectedCustomer.features?.avg_order_value.toFixed(2)}
                    </p>
                    <span className="text-[10px] text-slate-500">AOV per transaction</span>
                  </div>
                </div>
              </div>

              {/* Live Purchase Propensity Prediction */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-violet-50 text-violet-600 rounded-lg">
                      <Zap className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">Purchase Propensity Inference</h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {prediction?.model_version || 'logistic_regression'}
                  </span>
                </div>

                {actionLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400">Computing real-time prediction...</div>
                ) : prediction ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-xs text-slate-500 font-medium">Repurchase Probability</span>
                        <div className="text-2xl font-extrabold text-slate-900">
                          {(prediction.probability * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 font-medium">Classification</span>
                        <div className="flex items-center justify-end space-x-1 mt-0.5">
                          {prediction.prediction ? (
                            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Likely to Purchase
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              High Churn Risk
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-700">Top Influencing Factors:</span>
                      {prediction.factors?.map((f, i) => (
                        <div key={i} className="text-xs p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                          <div className="flex justify-between font-medium">
                            <span className="text-slate-800">{f.feature}</span>
                            <span className={f.impact >= 0 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                              {f.impact >= 0 ? `+${(f.impact * 100).toFixed(0)}%` : `${(f.impact * 100).toFixed(0)}%`}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Top Personalized Recommendations */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">Top Recommended Products</h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Item-CF {recommendations?.model_version || 'item_cf'}
                  </span>
                </div>

                <div className="space-y-3">
                  {recommendations?.recommendations.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {item.external_id}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 truncate max-w-[180px]">
                            {item.description}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{item.reason}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-indigo-600 font-mono">
                          {(item.score * 100).toFixed(0)}% match
                        </span>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.unit_price ? `$${item.unit_price.toFixed(2)}` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 text-sm">
              Select a customer to view AI behavioral analytics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
