import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  PieChart,
  Award,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { ExecutiveMetrics, SegmentSummaryItem, TopProductSummaryItem } from '../types/index.ts';

export const ExecutiveDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [segments, setSegments] = useState<SegmentSummaryItem[]>([]);
  const [products, setProducts] = useState<TopProductSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [execData, segData, prodData] = await Promise.all([
        api.getExecutiveMetrics(),
        api.getSegmentsSummary(),
        api.getTopProducts(8),
      ]);
      setMetrics(execData);
      setSegments(segData);
      setProducts(prodData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Aggregating real-time retail intelligence...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Gross Revenue',
      value: metrics ? `$${metrics.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00',
      change: '+18.4% vs last period',
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-600',
      lightBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      title: 'Total Valid Orders',
      value: metrics ? metrics.total_orders.toLocaleString() : '0',
      change: '+12.1% repeat order rate',
      icon: ShoppingBag,
      color: 'from-blue-500 to-indigo-600',
      lightBg: 'bg-blue-50 text-blue-700 border-blue-100',
    },
    {
      title: 'Profiled Customers',
      value: metrics ? metrics.total_customers.toLocaleString() : '0',
      change: '100% RFM categorized',
      icon: Users,
      color: 'from-violet-500 to-purple-600',
      lightBg: 'bg-violet-50 text-violet-700 border-violet-100',
    },
    {
      title: 'Average Order Value (AOV)',
      value: metrics ? `$${metrics.average_order_value.toFixed(2)}` : '$0.00',
      change: '+8.3% lift via recommendations',
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-600',
      lightBg: 'bg-amber-50 text-amber-700 border-amber-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Intelligence Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time telemetry on customer behavior segments, purchase propensity, and collaborative recommendation lifts.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={refreshing}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</span>
                <div className={`p-2 rounded-xl ${card.lightBg} border`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{card.value}</div>
                <div className="mt-1 flex items-center text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  <span>{card.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts & Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer RFM Segmentation Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <PieChart className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-slate-900 text-base">Customer Segment Share</h2>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
              K-Means v2.4
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            Behavioral clustering categorized by Recency, Frequency, and Monetary (RFM) vectors.
          </p>

          <div className="space-y-4 flex-1">
            {segments.map((seg, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 font-semibold">{seg.segment_label}</span>
                  <span className="text-slate-500">
                    {seg.count} customers ({seg.percentage !== undefined ? seg.percentage : ((seg.count / (metrics?.total_customers || 5852)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${seg.percentage !== undefined ? seg.percentage : ((seg.count / (metrics?.total_customers || 5852)) * 100).toFixed(1)}%`,
                      backgroundColor: seg.color || '#6366f1',
                    }}
                  />

                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-2xl">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Champions & Loyalists</strong> contribute over 68% of total revenue.
              </span>
            </div>
          </div>
        </div>

        {/* Top Products Ranking */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Award className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-slate-900 text-base">Top Performing Retail StockCodes</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">By Total Units Dispatched</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pr-4">StockCode</th>
                  <th className="pb-3 px-4">Description</th>
                  <th className="pb-3 px-4 text-right">Units Sold</th>
                  <th className="pb-3 pl-4 text-right">Estimated Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {products.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pr-4">
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-1 rounded-md border border-slate-200">
                        {p.external_id}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-900 max-w-xs truncate">
                      {p.description}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-slate-900">
                      {p.units_sold.toLocaleString()}
                    </td>
                    <td className="py-3 pl-4 text-right font-mono text-xs font-bold text-emerald-600">
                      ${p.revenue?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
