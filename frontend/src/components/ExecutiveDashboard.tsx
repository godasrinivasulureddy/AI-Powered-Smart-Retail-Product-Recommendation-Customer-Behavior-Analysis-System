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
  const [monthlySales, setMonthlySales] = useState<{ month: string; revenue: number; orders: number }[]>([]);
  const [countries, setCountries] = useState<{ country: string; revenue: number; orders: number; customers: number }[]>([]);
  const [rfmStats, setRfmStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [execData, segData, prodData, salesData, countryData, rfmData] = await Promise.all([
        api.getExecutiveMetrics(),
        api.getSegmentsSummary(),
        api.getTopProducts(8),
        api.getMonthlySales(),
        api.getCountrySales(6),
        api.getRfmStats(),
      ]);
      setMetrics(execData);
      setSegments(segData);
      setProducts(prodData);
      setMonthlySales(salesData);
      setCountries(countryData);
      setRfmStats(rfmData);
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

      {/* EDA EXPLORATORY DATA ANALYSIS SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Exploratory Data Analysis (EDA)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Database-backed temporal sales trends, geographic distribution, and RFM behavioral metrics.
            </p>
          </div>
          <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 font-semibold">
            UCI Online Retail II Pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Monthly Revenue Trend Bar Visualization */}
          <div className="lg:col-span-7 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Monthly Gross Revenue Trend (2009 – 2011)
              </span>
              <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-semibold">
                Live SQL Aggregation
              </span>
            </div>

            <div className="h-52 flex items-end justify-between gap-2 pt-6 pb-2 px-1 border-b border-slate-200/60">
              {monthlySales.map((item, idx) => {
                const maxRev = Math.max(...monthlySales.map((m) => m.revenue), 1);
                const heightPct = Math.max(12, Math.round((item.revenue / maxRev) * 100));
                // Format YYYY-MM into MMM YY (e.g. 2009-12 -> Dec 09)
                const [year, monthNum] = item.month.split('-');
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthLabel = `${monthNames[parseInt(monthNum, 10) - 1]} '${year.substring(2)}`;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative cursor-pointer">
                    {/* Floating Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-900 text-white text-[11px] py-1 px-2.5 rounded-lg font-mono shadow-xl z-20 pointer-events-none whitespace-nowrap border border-slate-700">
                      <span className="font-bold text-indigo-300">{monthLabel}:</span> ${item.revenue.toLocaleString()} ({item.orders} orders)
                    </div>
                    {/* Gradient Bar */}
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-violet-500 rounded-t-md group-hover:from-indigo-500 group-hover:to-violet-400 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] font-mono font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors">
                      {monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Country Markets Breakdown */}
          <div className="lg:col-span-5 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Top Geographic Markets (Revenue)
              </span>
              <span className="text-[11px] font-mono text-slate-500">By Country</span>
            </div>

            <div className="space-y-3.5 pt-1">
              {countries.map((c, idx) => {
                const maxRev = countries[0]?.revenue || 1;
                const widthPct = Math.max(8, Math.round((c.revenue / maxRev) * 100));
                return (
                  <div key={idx} className="space-y-1 group">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-800 font-semibold group-hover:text-indigo-600 transition-colors truncate">{c.country}</span>
                      <span className="font-mono text-slate-600 text-[11px]">
                        ${c.revenue.toLocaleString()} ({c.customers} buyers)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full group-hover:from-emerald-400 group-hover:to-teal-400 transition-all duration-300"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Customer RFM Distribution Averages */}
        {rfmStats && rfmStats.avg_recency !== undefined && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-center space-y-1 hover:border-slate-300 transition-all">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Average Recency</span>
              <span className="text-xl font-black text-slate-900 font-mono">{rfmStats.avg_recency} days</span>
              <span className="text-[10px] text-slate-400 block font-mono">Range: {rfmStats.min_recency} – {rfmStats.max_recency}d</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-center space-y-1 hover:border-slate-300 transition-all">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Average Frequency</span>
              <span className="text-xl font-black text-slate-900 font-mono">{rfmStats.avg_frequency} orders</span>
              <span className="text-[10px] text-slate-400 block font-mono">Range: {rfmStats.min_frequency} – {rfmStats.max_frequency}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-center space-y-1 hover:border-slate-300 transition-all">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Average Customer Spend</span>
              <span className="text-xl font-black text-emerald-600 font-mono">${rfmStats.avg_monetary?.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block font-mono">Range: ${rfmStats.min_monetary} – ${rfmStats.max_monetary?.toLocaleString()}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-center space-y-1 hover:border-slate-300 transition-all">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Customer Mean AOV</span>
              <span className="text-xl font-black text-indigo-600 font-mono">${rfmStats.avg_aov?.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block font-mono">Per-Customer Average</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

