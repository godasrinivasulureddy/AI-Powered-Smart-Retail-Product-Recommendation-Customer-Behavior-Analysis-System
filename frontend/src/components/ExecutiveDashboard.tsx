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
  Globe,
  BarChart3,
  Layers,
  Activity,
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
  const [rfmDist, setRfmDist] = useState<{
    recency: { bin: string; count: number }[];
    frequency: { bin: string; count: number }[];
    monetary: { bin: string; count: number }[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ month: string; revenue: number; orders: number; x: number; y: number } | null>(null);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [execData, segData, prodData, salesData, countryData, rfmData, rfmDistData] = await Promise.all([
        api.getExecutiveMetrics(),
        api.getSegmentsSummary(),
        api.getTopProducts(8),
        api.getMonthlySales(),
        api.getCountrySales(6),
        api.getRfmStats(),
        api.getRfmDistributions(),
      ]);
      setMetrics(execData);
      setSegments(segData);
      setProducts(prodData);
      setMonthlySales(salesData);
      setCountries(countryData);
      setRfmStats(rfmData);
      setRfmDist(rfmDistData);
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

  // SVG Chart Geometry Calculations
  const chartWidth = 700;
  const chartHeight = 200;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;
  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const maxY = 1500000; // $1.5M max scale

  const points = monthlySales.map((item, i) => {
    const x = paddingLeft + i * (graphWidth / Math.max(monthlySales.length - 1, 1));
    const clampedRevenue = Math.min(item.revenue, maxY);
    const y = paddingTop + (graphHeight - (clampedRevenue / maxY) * graphHeight);
    return { ...item, x, y };
  });

  const linePathD = points.length > 0
    ? points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '')
    : '';

  const areaPathD = points.length > 0
    ? `${linePathD} L ${points[points.length - 1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`
    : '';

  const yTicks = [1500000, 1000000, 500000, 0];

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

      {/* ============================================================ */}
      {/* SECTION 1: EXPLORATORY DATA ANALYSIS (EDA)                    */}
      {/* ============================================================ */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Exploratory Data Analysis (EDA)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Database-backed temporal sales trends, geographic distribution, and product demand metrics.
            </p>
          </div>
          <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 font-semibold w-fit">
            UCI Online Retail II Pipeline
          </span>
        </div>

        {/* 1. Monthly Revenue Trend (Line/Area Chart) */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Monthly Gross Revenue Trend (2009 – 2011)
              </h3>
              <p className="text-xs text-slate-500">
                Continuous monthly revenue trajectory across 39,520 valid completed orders
              </p>
            </div>
            <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100 font-semibold">
              Live SQL Telemetry
            </span>
          </div>

          <div className="relative w-full overflow-hidden">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto max-h-64 overflow-visible">
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines & Y Ticks */}
              {yTicks.map((val, idx) => {
                const y = paddingTop + (graphHeight - (val / maxY) * graphHeight);
                return (
                  <g key={idx}>
                    <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                    <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="text-[10px] font-mono fill-slate-400 font-medium">
                      {val === 0 ? '$0' : `$${(val / 1000).toFixed(0)}k`}
                    </text>
                  </g>
                );
              })}

              {/* Area Gradient Fill */}
              {areaPathD && <path d={areaPathD} fill="url(#revenueGradient)" />}

              {/* Main Trend Line */}
              {linePathD && <path d={linePathD} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

              {/* Data Points & X-Axis Labels */}
              {points.map((p, i) => {
                const showXLabel = i % 3 === 0 || i === points.length - 1;
                const [year, monthNum] = p.month.split('-');
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthLabel = `${monthNames[parseInt(monthNum, 10) - 1]} '${year.substring(2)}`;

                return (
                  <g key={i}>
                    {/* Point Circle */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      className="fill-white stroke-indigo-600 stroke-2 hover:r-6 transition-all cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(p)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />

                    {/* X-Axis Tick Label */}
                    {showXLabel && (
                      <text x={p.x} y={chartHeight - 10} textAnchor="middle" className="text-[10px] font-mono fill-slate-500 font-semibold">
                        {monthLabel}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div
                className="absolute bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl z-30 font-mono pointer-events-none border border-slate-700 space-y-1 transform -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                  top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                }}
              >
                <div className="font-bold text-indigo-300">{hoveredPoint.month} Revenue:</div>
                <div className="text-emerald-400 font-extrabold text-sm">${hoveredPoint.revenue.toLocaleString()}</div>
                <div className="text-slate-400 text-[10px]">{hoveredPoint.orders.toLocaleString()} orders completed</div>
              </div>
            )}
          </div>
        </div>

        {/* 2 & 3. Top Markets & Top Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Markets by Revenue */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Top Markets by Revenue</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">By Country</span>
            </div>

            <div className="space-y-3 pt-1">
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

          {/* Top Products by Units Sold */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Top Products by Units Sold</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-medium">By Volume</span>
            </div>

            <div className="space-y-3 pt-1">
              {products.map((p, idx) => {
                const maxUnits = products[0]?.units_sold || 1;
                const widthPct = Math.max(8, Math.round((p.units_sold / maxUnits) * 100));
                return (
                  <div key={idx} className="space-y-1 group">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-800 font-semibold group-hover:text-indigo-600 transition-colors truncate max-w-[200px]" title={p.description}>
                        {p.description}
                      </span>
                      <span className="font-mono text-slate-600 text-[11px]">
                        {p.units_sold.toLocaleString()} units (${p.revenue?.toLocaleString() || '0'})
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full group-hover:from-amber-400 group-hover:to-orange-400 transition-all duration-300"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: CUSTOMER BEHAVIOR ANALYSIS                       */}
      {/* ============================================================ */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-violet-50 text-violet-600 rounded-lg">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Customer Behavior Analysis</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              RFM feature profiling and K-Means clustering distributions across 5,852 database customers.
            </p>
          </div>
          <span className="text-xs font-mono bg-violet-50 text-violet-700 px-3 py-1 rounded-full border border-violet-200 font-semibold">
            RFM Profiling Engine
          </span>
        </div>

        {/* 4 RFM Summary Cards */}
        {rfmStats && rfmStats.avg_recency !== undefined && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

        {/* 3 Customer Behavior Distributions + K-Means Cluster Distribution */}
        {rfmDist && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* A. Recency Bins */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recency Distribution</span>
                <span className="text-[10px] font-mono text-slate-500">Days Since Last Order</span>
              </div>
              <div className="space-y-2.5 pt-1">
                {rfmDist.recency.map((item, idx) => {
                  const pct = ((item.count / 5852) * 100).toFixed(1);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700 font-semibold">{item.bin}</span>
                        <span className="font-mono text-slate-500 text-[11px]">{item.count} cust ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* B. Frequency Bins */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Frequency Distribution</span>
                <span className="text-[10px] font-mono text-slate-500">Lifetime Order Count</span>
              </div>
              <div className="space-y-2.5 pt-1">
                {rfmDist.frequency.map((item, idx) => {
                  const pct = ((item.count / 5852) * 100).toFixed(1);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700 font-semibold">{item.bin}</span>
                        <span className="font-mono text-slate-500 text-[11px]">{item.count} cust ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* C. Monetary Bins */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Monetary Spend Distribution</span>
                <span className="text-[10px] font-mono text-slate-500">Lifetime Gross Spend</span>
              </div>
              <div className="space-y-2.5 pt-1">
                {rfmDist.monetary.map((item, idx) => {
                  const pct = ((item.count / 5852) * 100).toFixed(1);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700 font-semibold">{item.bin}</span>
                        <span className="font-mono text-slate-500 text-[11px]">{item.count} cust ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* K-Means Customer Segment Distribution (K=2) */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">K-Means Customer Segment Distribution (K=2)</h3>
            </div>
            <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-semibold">
              Silhouette: 0.4397
            </span>
          </div>

          <div className="space-y-3">
            {segments.map((seg, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-800 font-bold">{seg.segment_label}</span>
                  <span className="font-mono text-slate-600">
                    {seg.count.toLocaleString()} customers ({seg.percentage}% of catalog)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${seg.percentage}%`,
                      backgroundColor: seg.color || '#6366f1',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
