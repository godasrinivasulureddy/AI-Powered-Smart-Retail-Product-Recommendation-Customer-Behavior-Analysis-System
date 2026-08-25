import React from 'react';
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
  BarChart3,
  Users,
  Target,
  Zap,
  TrendingUp,
  Lock,
  ChevronRight,
  ShieldCheck,
  Brain,
  Search,
  CheckCircle2
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0c1324] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden antialiased">
      {/* Radial Background Glows from Stitch Layout */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* 1. TOP NAVBAR */}
      <header className="bg-[#0c1324]/80 backdrop-blur-lg sticky top-0 z-50 border-b border-white/10 shadow-md">
        <div className="flex justify-between items-center w-full px-4 sm:px-8 max-w-7xl mx-auto h-20">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">RetailIQ AI</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <button onClick={() => scrollToSection('capabilities')} className="hover:text-indigo-400 transition-colors cursor-pointer">
              Capabilities
            </button>
            <button onClick={() => scrollToSection('workflow')} className="hover:text-indigo-400 transition-colors cursor-pointer">
              Workflow
            </button>
            <button onClick={() => scrollToSection('why-retailiq')} className="hover:text-indigo-400 transition-colors cursor-pointer">
              Why RetailIQ
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onSignIn}
              className="text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white px-3 py-2 transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sign In</span>
            </button>
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] cursor-pointer flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <main className="flex-1">
        <section className="relative pt-12 pb-20 px-4 sm:px-8 overflow-hidden min-h-[85vh] flex flex-col items-center justify-center text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center z-10 space-y-6">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Enterprise Retail Analytics & Machine Learning</span>
            </div>

            {/* EXACT 3-LINE HEADLINE REQUESTED */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.15]">
              AI-POWERED <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#c0c1ff] to-[#d0bcff]">RETAIL INTELLIGENCE</span>
              <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-300 bg-clip-text text-transparent block mt-2 text-2xl sm:text-4xl lg:text-5xl font-extrabold">
                Smarter Recommendations
              </span>
              <span className="text-slate-200 block mt-1 text-2xl sm:text-4xl lg:text-5xl font-extrabold">
                Better Retail Decisions
              </span>
            </h1>

            {/* SUPPORTING TEXT */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed pt-2">
              Understand customer behavior, uncover purchasing patterns, anticipate future activity, and discover relevant product cross-selling opportunities through intelligent analytics.
            </p>

            {/* HERO CTAS */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollToSection('capabilities')}
                className="bg-transparent border border-slate-700 text-slate-200 px-7 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Explore Capabilities</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* VISUAL CONTENT (Stitch Interactive Glassmorphism UI Card) */}
          <div className="relative w-full max-w-5xl h-[440px] hidden md:block z-10 mt-16">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-violet-500/0 rounded-2xl blur-2xl" />
            <div className="bg-[#191f31]/60 backdrop-blur-xl border border-indigo-500/30 rounded-2xl w-full h-full p-6 flex flex-col justify-between shadow-2xl shadow-indigo-950/80 space-y-4">
              {/* Mock Dashboard Header */}
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-indigo-300" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">Intelligence Overview</span>
                </div>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                </div>
              </div>

              {/* Mock Dashboard Content Grid */}
              <div className="grid grid-cols-2 gap-4 flex-1">
                {/* Panel 1 */}
                <div className="bg-[#23293c]/50 backdrop-blur-md rounded-xl p-5 border border-white/10 flex flex-col justify-between">
                  <span className="text-xs font-mono text-slate-400">Prediction Accuracy</span>
                  <span className="text-4xl font-extrabold text-[#c0c1ff] drop-shadow-[0_0_10px_rgba(192,193,255,0.5)]">94.8%</span>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
                    <div className="w-[94.8%] h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full shadow-[0_0_10px_rgba(192,193,255,0.8)]" />
                  </div>
                </div>

                {/* Panel 2 */}
                <div className="bg-[#23293c]/50 backdrop-blur-md rounded-xl p-5 border border-white/10 flex flex-col justify-between">
                  <span className="text-xs font-mono text-slate-400">Active Behavioral Cohorts</span>
                  <span className="text-3xl font-bold text-[#d0bcff] drop-shadow-[0_0_10px_rgba(208,188,255,0.5)]">High Affinity</span>
                  <div className="flex items-center space-x-2 text-xs text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Real-Time Model Scoring</span>
                  </div>
                </div>

                {/* Panel 3 */}
                <div className="bg-[#23293c]/50 backdrop-blur-md rounded-xl p-5 border border-white/10 col-span-2 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-slate-400">Product Cross-Sell Matrix</span>
                    <span className="text-sm font-semibold text-slate-200 block">Collaborative Affinity Engine</span>
                  </div>
                  <div className="px-3.5 py-1.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-xs rounded-lg">
                    Optimized Affinity
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. FEATURE CAPABILITIES SECTION */}
        <section id="capabilities" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Core Capabilities</h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">Advanced intelligence designed to optimize retail decision-making.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Capability 1 */}
            <div className="bg-[#191f31]/40 backdrop-blur-xl border border-indigo-500/30 p-6 rounded-2xl hover:border-indigo-500/70 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-[#c0c1ff]">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Customer Intelligence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deep dive into behavioral patterns to understand key engagement segments.
              </p>
            </div>

            {/* Capability 2 */}
            <div className="bg-[#191f31]/40 backdrop-blur-xl border border-indigo-500/30 p-6 rounded-2xl hover:border-indigo-500/70 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-[#d0bcff]">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Predictive Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Turn historical purchase trends into forward-looking repurchase probability.
              </p>
            </div>

            {/* Capability 3 */}
            <div className="bg-[#191f31]/40 backdrop-blur-xl border border-indigo-500/30 p-6 rounded-2xl hover:border-indigo-500/70 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-amber-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Smart Recommendations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated product suggestions to enhance cross-selling opportunities.
              </p>
            </div>

            {/* Capability 4 */}
            <div className="bg-[#191f31]/40 backdrop-blur-xl border border-indigo-500/30 p-6 rounded-2xl hover:border-indigo-500/70 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-emerald-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Business Insights</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Actionable strategic metrics delivered through clear executive views.
              </p>
            </div>
          </div>
        </section>

        {/* 4. WORKFLOW TIMELINE SECTION */}
        <section id="workflow" className="py-20 bg-[#070d1f] border-y border-white/5 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Structured Workflow</h2>
              <p className="text-slate-400 text-sm max-w-2xl mx-auto">From raw data logs to refined retail intelligence.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="bg-[#151b2d] p-6 rounded-2xl border border-white/10 hover:border-indigo-500/70 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer space-y-3">
                <span className="text-3xl font-black text-indigo-400/40 font-mono">01</span>
                <h4 className="text-base font-bold text-white">Connect Data</h4>
                <p className="text-xs text-slate-400">Ingest retail transaction logs into a clean analytics pipeline.</p>
              </div>

              <div className="bg-[#151b2d] p-6 rounded-2xl border border-white/10 hover:border-indigo-500/70 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer space-y-3">
                <span className="text-3xl font-black text-indigo-400/40 font-mono">02</span>
                <h4 className="text-base font-bold text-white">Understand Behavior</h4>
                <p className="text-xs text-slate-400">Extract key features to profile customer recency, frequency, and value.</p>
              </div>

              <div className="bg-[#151b2d] p-6 rounded-2xl border border-white/10 hover:border-indigo-500/70 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer space-y-3">
                <span className="text-3xl font-black text-indigo-400/40 font-mono">03</span>
                <h4 className="text-base font-bold text-white">Generate Intelligence</h4>
                <p className="text-xs text-slate-400">Apply algorithms to score repurchase probability and product synergy.</p>
              </div>

              <div className="bg-[#151b2d] p-6 rounded-2xl border border-white/10 hover:border-indigo-500/70 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer space-y-3">
                <span className="text-3xl font-black text-indigo-400/40 font-mono">04</span>
                <h4 className="text-base font-bold text-white">Take Action</h4>
                <p className="text-xs text-slate-400">Support merchandising and strategy with decision-ready insights.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. WHY RETAILIQ SECTION */}
        <section id="why-retailiq" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-[#191f31]/40 border border-white/10 p-8 rounded-3xl hover:border-indigo-500/70 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Understand Customers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gain clarity on customer purchasing velocity and engagement patterns.
              </p>
            </div>

            <div className="bg-[#191f31]/40 border border-white/10 p-8 rounded-3xl hover:border-indigo-500/70 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Anticipate Opportunities</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Highlight accounts with high repurchase potential for targeted strategy.
              </p>
            </div>

            <div className="bg-[#191f31]/40 border border-white/10 p-8 rounded-3xl hover:border-indigo-500/70 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Make Confident Decisions</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Support retail strategy with objective, data-backed analytical metrics.
              </p>
            </div>
          </div>
        </section>

        {/* 6. HIGH-IMPACT CTA */}
        <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="bg-[#191f31]/60 backdrop-blur-xl rounded-3xl p-10 sm:p-14 border border-[#6366f1]/40 text-center space-y-6 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to transform your retail data?
            </h2>
            <p className="text-slate-300 text-sm max-w-xl mx-auto">
              Access RetailIQ AI to explore predictive analytics and personalized product recommendations.
            </p>
            <div>
              <button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] cursor-pointer inline-flex items-center space-x-2"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 7. FOOTER */}
      <footer className="bg-[#070d1f] border-t border-white/5 py-8 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2 font-bold text-white text-sm">
            <span>RetailIQ AI</span>
          </div>

          <div className="flex space-x-6 uppercase tracking-wider text-[11px]">
            <button onClick={() => scrollToSection('capabilities')} className="hover:text-white transition-colors cursor-pointer">
              Capabilities
            </button>
            <button onClick={() => scrollToSection('workflow')} className="hover:text-white transition-colors cursor-pointer">
              Workflow
            </button>
            <button onClick={onSignIn} className="hover:text-white transition-colors cursor-pointer">
              Sign In
            </button>
          </div>

          <div>© 2026 RetailIQ AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};
