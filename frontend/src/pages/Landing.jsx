import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ThunderboltFilled, BranchesOutlined, HistoryOutlined,
  LineChartOutlined, CodeFilled, FileTextFilled,
  RightOutlined, FundFilled, InfoCircleFilled, 
  QuestionCircleFilled, AppstoreFilled, CloudFilled,
  UsergroupAddOutlined, ToolFilled, CheckCircleFilled,
  SunFilled, MoonFilled
} from '@ant-design/icons';

// ── Animated typewriter for the terminal demo ────────────────────────────────
const DEMO_LINES = [
  { text: '$ python3 generate_commits.py > commits.json',  delay: 0,    color: '#818cf8' },
  { text: '  [1/6] a7d4e91 — refactor: migrate JWT...',    delay: 600,  color: '#9898b8' },
  { text: '  [2/6] e1b7c28 — fix: resolve PaymentQueue...', delay: 900,  color: '#9898b8' },
  { text: '$ # Upload both files → click Analyze',          delay: 1400, color: '#818cf8' },
  { text: '  ✓ Correlating 6 incidents with commits...',    delay: 1800, color: '#4ade80' },
  { text: '  User Auth Failure  →  a7d4e91  95% confidence', delay: 2200, color: '#fbbf24' },
  { text: '  Payment Timeout    →  e1b7c28  88% confidence', delay: 2600, color: '#fbbf24' },
  { text: '  Root cause identified successfully ⚡',       delay: 3100, color: '#c084fc' },
];

function Terminal() {
  const [visible, setVisible] = useState([]);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    DEMO_LINES.forEach((line, i) => {
      setTimeout(() => {
        setVisible(prev => [...prev, i]);
      }, line.delay + 300);
    });
    const blinkInterval = setInterval(() => setCursor(c => !c), 530);
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-violet-900/30"
      style={{ background: '#0a0a14', transform: 'translateZ(0)' }}>
      {/* Terminal chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.07]"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <div className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-2 text-xs text-white/30 font-mono">ric — Release Incident Correlator</span>
      </div>
      {/* Terminal body */}
      <div className="p-5 font-mono text-sm min-h-[220px]">
        {DEMO_LINES.map((line, i) => (
          <div key={i}
            className={`transition-all duration-300 leading-7 ${visible.includes(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}
            style={{ color: line.color }}>
            {line.text}
          </div>
        ))}
        <span className={`inline-block w-2 h-4 ml-0.5 align-middle transition-opacity ${cursor ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: '#818cf8' }} />
      </div>
    </div>
  );
}

// ── Designed For ─────────────────────────────────────────────────────────────
const TARGET_AUDIENCES = [
  { title: "SREs", desc: "Resolve outages faster with deep AI context.", image: "/images/sre_team.png" },
  { title: "DevOps Engineers", desc: "Monitor release health and stability efficiently.", image: "/images/devops_team.png" },
  { title: "Release Managers", desc: "Gain absolute confidence in deploy stability.", image: "/images/release_manager_team.png" },
  { title: "Backend Developers", desc: "Quickly identify problematic commits directly.", image: "/images/backend_dev_team.png" },
];

// ── Services (Real Capabilities) ──────────────────────────────────────────────
const SERVICES = [
  { title: "Smart Correlation", desc: "Instantly maps incidents to the exact time-window of deployments.", icon: <BranchesOutlined />, color: "linear-gradient(135deg, #3b82f6, #2563eb)", shadow: "0 8px 24px rgba(59, 130, 246, 0.3)" },
  { title: "Deep Diff Inspection", desc: "AI reads actual code changes, not just commit messages.", icon: <CodeFilled />, color: "linear-gradient(135deg, #8b5cf6, #7c3aed)", shadow: "0 8px 24px rgba(139, 92, 246, 0.3)" },
  { title: "Impact Scoring", desc: "Calculates the blast radius of a problematic commit from 0 to 100%.", icon: <LineChartOutlined />, color: "linear-gradient(135deg, #ec4899, #db2777)", shadow: "0 8px 24px rgba(236, 72, 153, 0.3)" },
  { title: "Interactive Viewer", desc: "Review the isolated code diff directly in a clean UI.", icon: <AppstoreFilled />, color: "linear-gradient(135deg, #10b981, #059669)", shadow: "0 8px 24px rgba(16, 185, 129, 0.3)" },
];

// ── How it works steps ───────────────────────────────────────────────────────
const STEPS = [
  {
    n: '1',
    title: 'Upload your data',
    desc: 'Upload your incidents.csv and commits.json. Bulk upload supports multiple incidents with automatic timestamp parsing.',
    color: '#6366f1', // Indigo
  },
  {
    n: '2',
    title: 'Time-window correlation',
    desc: 'RIC automatically finds every commit deployed within a configurable window before each incident occurred.',
    color: '#8b5cf6', // Purple
  },
  {
    n: '3',
    title: 'AI-Powered Inspection',
    desc: 'Our deep learning models inspect your git diffs to isolate the specific files and logic changes responsible for the issue.',
    color: '#ec4899', // Pink
  },
  {
    n: '4',
    title: 'Detailed analysis',
    desc: 'Get an instant confidence-scored report with detailed rollback instructions, blast radius classification, and clear explanations.',
    color: '#10b981', // Green
  },
];

// ── Checklist Features ───────────────────────────────────────────────────────
const CHECKLIST = [
  "Premium dashboard", 
  "Quick upload and preview of error & commit",
  "Instant AI report", 
  "History analytics",
  "Very fast report generation", 
  "AI powered"
];

// ── Stats ────────────────────────────────────────────────────────────────────
const STATS = [
  { value: '100%',  unit: 'Automated', label: 'No manual log searching' },
  { value: 'Flexible', unit: 'Time Window', label: 'Correlate by custom hours' },
  { value: '95%',   unit: 'Precision', label: 'Confidence-scored matches' },
  { value: 'Seconds', unit: 'Analysis', label: 'Get instant feedback' },
];

// ── Floating Particles ───────────────────────────────────────────────────────
const FloatingParticles = () => {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    // Generate 40 particles for a beautiful ambient effect
    const newParticles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      size: Math.random() * 4 + 2 + 'px',
      animDuration: Math.random() * 20 + 10 + 's',
      animDelay: Math.random() * 5 + 's',
      opacity: Math.random() * 0.5 + 0.6,
      color: Math.random() > 0.5 ? '#6366f1' : '#a855f7'
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {particles.map(p => (
        <div key={p.id} 
             className="absolute rounded-full animate-float"
             style={{
               left: p.left, top: p.top, width: p.size, height: p.size,
               opacity: p.opacity,
               background: p.color,
               animationDuration: p.animDuration,
               animationDelay: p.animDelay,
               boxShadow: `0 0 20px ${p.color}, 0 0 40px ${p.color}`
             }}
        />
      ))}
    </div>
  );
};

// ── FAQ Item Component ───────────────────────────────────────────────────────
const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="purple-hover-card border rounded-lg overflow-hidden mb-3 transition-all duration-300" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-light)' }}>
      <button 
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 text-sm font-semibold flex justify-between items-center cursor-pointer transition-colors"
        style={{ color: 'var(--text-primary)' }}
      >
        {q}
        <RightOutlined style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: 10, color: 'var(--text-muted)' }} />
      </button>
      <div 
        className="overflow-hidden transition-all duration-300 ease-in-out" 
        style={{ maxHeight: open ? '200px' : '0px', opacity: open ? 1 : 0 }}
      >
        <p className="px-4 pb-3 text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{a}</p>
      </div>
    </div>
  );
};

// ── Main landing component ────────────────────────────────────────────────────
export default function Landing({ theme, toggleTheme }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-x-hidden"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        .purple-hover-card {
          transition: all 0.3s ease !important;
        }
        .purple-hover-card:hover {
          border-color: #a855f7 !important;
          box-shadow: 0 0 25px rgba(168, 85, 247, 0.3) !important;
          transform: translateY(-4px) !important;
        }
      `}</style>

      {/* ── Background Particles ── */}
      <FloatingParticles />

      {/* ── Ambient blobs (Hardware-accelerated, filterless for smooth scrolling) ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full"
          style={{
            width: 600, height: 600, top: '-150px', left: '-100px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 50%, transparent 70%)',
            transform: 'translateZ(0)',
          }} />
        <div className="absolute rounded-full"
          style={{
            width: 500, height: 500, top: '30%', right: '-120px',
            background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, rgba(168,85,247,0.02) 50%, transparent 70%)',
            transform: 'translateZ(0)',
          }} />
        <div className="absolute rounded-full"
          style={{
            width: 400, height: 400, bottom: '10%', left: '30%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, rgba(99,102,241,0.01) 50%, transparent 70%)',
            transform: 'translateZ(0)',
          }} />
      </div>

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav className="relative z-10 sticky top-0"
        style={{ background: 'color-mix(in srgb, var(--bg-base) 80%, transparent)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px #6366f144' }}>
              <FundFilled style={{ color: '#fff', fontSize: 15 }} />
            </div>
            <div>
              <span className="font-black text-[var(--text-primary)] text-sm tracking-tight hidden sm:inline">Release Incident Correlator (RIC)</span>
              <span className="font-black text-[var(--text-primary)] text-sm tracking-tight sm:hidden">RIC</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[var(--text-muted)]">
            <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1"><InfoCircleFilled style={{color: '#8b5cf6'}}/> About</button>
            <button onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })} className="hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1"><QuestionCircleFilled style={{color: '#a855f7'}}/> How to use</button>
            <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1"><AppstoreFilled style={{color: '#c084fc'}}/> Features</button>
            <button onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })} className="hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1"><CloudFilled style={{color: '#fbbf24'}}/> Services</button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-white/10 cursor-pointer"
            >
              {theme === 'dark' ? <SunFilled style={{ fontSize: 18, color: '#fbbf24' }} /> : <MoonFilled style={{ fontSize: 18, color: '#6366f1' }} />}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 16px #6366f144' }}
            >
              Open Dashboard →
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-16 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border"
                style={{ background: '#6366f110', borderColor: '#6366f133', color: '#818cf8' }}>
                <ThunderboltFilled />
                AI-Driven Root Cause Analysis
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black leading-[1.15] tracking-tight mb-6">
                <span className="text-[var(--text-primary)]">Pinpoint the</span>
                <br />
                <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  commit that broke
                </span>
                <br />
                <span className="text-[var(--text-primary)]">production.</span>
              </h1>

              <p className="text-base md:text-lg leading-relaxed mb-8 font-medium" style={{ color: 'var(--text-muted)' }}>
                Upload your incidents and git commits. RIC correlates them by time window,
                runs AI-powered code analysis, and returns a detailed root-cause report
                with confidence score and rollback instructions.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 8px 32px #6366f155', color: '#fff' }}
                >
                  <ThunderboltFilled />
                  Open Dashboard
                </button>
                <button
                  onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border transition-all duration-200 hover:border-white/20 cursor-pointer"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#9898b8', background: 'rgba(255,255,255,0.03)' }}
                >
                  How it works <RightOutlined style={{ fontSize: 10 }} />
                </button>
              </div>
            </div>

            {/* Right — Terminal */}
            <div className="w-full">
              <Terminal />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="font-black text-2xl sm:text-3xl lg:text-4xl mb-1"
                  style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {s.value}
                </div>
                <div className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">{s.unit}</div>
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Designed For ──────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6" style={{ background: 'var(--bg-app)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 flex flex-col items-center">
            <div className="text-xs font-bold tracking-widest mb-4 uppercase" style={{ color: '#eb5e28' }}>Empowering Modern Teams</div>
            <h2 className="text-3xl md:text-4xl font-black text-[var(--text-primary)]">Transforming enterprises with innovative digital solutions</h2>
          </div>
          
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: 'smooth' }}>
            <style>{`.flex.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
            {TARGET_AUDIENCES.map((aud, i) => (
              <div key={i} className="purple-hover-card snap-center shrink-0 w-[280px] md:w-[320px] rounded-2xl overflow-hidden relative group cursor-pointer border border-transparent" style={{ height: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <img src={aud.image} alt={aud.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)' }} />
                
                <div className="absolute bottom-0 left-0 right-0 p-6 transform transition-transform duration-300 translate-y-6 group-hover:translate-y-0">
                  <h3 className="font-bold text-white text-xl mb-3 tracking-tight">{aud.title}</h3>
                  <p className="text-sm text-white/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100 font-medium">{aud.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Steps list — clean vertical line layout */}
          <div className="relative pl-8 sm:pl-0">
            {/* Desktop timeline line */}
            <div className="hidden sm:block absolute left-1/2 top-4 bottom-4 w-0.5 -ml-px"
              style={{ background: 'linear-gradient(to bottom, #6366f1, #10b981)' }} />

            {/* Mobile timeline line */}
            <div className="sm:hidden absolute left-4 top-4 bottom-4 w-0.5"
              style={{ background: 'linear-gradient(to bottom, #6366f1, #10b981)' }} />

            <div className="space-y-12">
              {STEPS.map((step, i) => {
                const isEven = i % 2 === 0;
                return (
                  <div key={i} className={`relative flex flex-col sm:flex-row items-start ${isEven ? '' : 'sm:flex-row-reverse'}`}>
                    
                    {/* Spacer (forces card to one side) */}
                    <div className="hidden sm:block w-1/2" />

                    {/* Timeline Node Bubble */}
                    <div className="absolute left-[-24px] sm:left-1/2 sm:-ml-6 top-1 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-base z-10"
                      style={{
                        background: step.color,
                        boxShadow: `0 0 20px ${step.color}aa`,
                      }}>
                      {step.n}
                    </div>

                    {/* Step Card Content */}
                    <div className="w-full sm:w-1/2 px-0 sm:px-8 mt-2 sm:mt-0">
                      <div className="purple-hover-card rounded-2xl p-6 border transition-all duration-300"
                        style={{
                          background: 'var(--bg-card)',
                          borderColor: 'var(--border-light)',
                        }}>
                        <h3 className="font-bold text-[var(--text-primary)] text-xl mb-3 tracking-tight">{step.title}</h3>
                        <p className="text-[15px] leading-relaxed font-medium" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Checklist / Capabilities ─────────────────────────────────────── */}
      <section id="features" className="relative z-10 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-4">
            {CHECKLIST.map((item, i) => (
              <div key={i} className="purple-hover-card flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-default"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)' }}>
                <CheckCircleFilled style={{ color: '#10b981', fontSize: '20px' }} />
                <span className="text-[var(--text-primary)] font-semibold text-[15px] tracking-tight">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Capabilities ──────────────────────────────────────────────────── */}
      <section id="services" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold tracking-widest mb-4" style={{ color: '#fbbf24' }}>CAPABILITIES</div>
            <h2 className="text-3xl md:text-4xl font-black text-[var(--text-primary)]">Everything you need to debug</h2>
          </div>
          
          {/* Creative 4-column Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((s, i) => {
              return (
                <div key={i} className="purple-hover-card rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden"
                  style={{ 
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
                  }}>
                  {/* Subtle background glow from icon color */}
                  <div className="absolute top-0 w-full h-1/2 opacity-10" style={{ background: s.color, filter: 'blur(40px)' }} />
                  
                  <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-6 text-3xl relative z-10"
                    style={{ background: s.color, color: '#fff', boxShadow: s.shadow }}>
                    {s.icon}
                  </div>
                  <h3 className="font-bold text-[var(--text-primary)] text-xl mb-3 tracking-tight relative z-10">{s.title}</h3>
                  <p className="text-[15px] leading-relaxed font-medium relative z-10" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative rounded-[2.5rem] p-12 md:p-20 overflow-hidden"
            style={{
              backgroundImage: 'url(/images/cta_root_cause.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}>
            <div className="absolute inset-0 bg-black/70" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-8 flex items-center justify-center text-3xl"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #c084fc)', boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)' }}>
                <ThunderboltFilled style={{ color: '#fff' }} />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
                Ready to find your root cause?
              </h2>
              <p className="text-lg mb-10 max-w-lg mx-auto font-medium" style={{ color: '#a0a0a0' }}>
                Upload incidents.csv + commits.json and get a confidence-ranked report in under 10 seconds.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-base text-white transition-all duration-300 hover:scale-105 active:scale-[0.98] cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #c084fc)', boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)' }}
              >
                <ThunderboltFilled />
                Open Dashboard Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-12 px-6" style={{ background: 'transparent', borderTop: '1px solid var(--border-light)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12 border-b pb-12" style={{ borderColor: 'var(--border-light)' }}>
            
            {/* Logo & Description */}
            <div className="md:col-span-3">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px #6366f144' }}>
                  <FundFilled style={{ color: '#fff', fontSize: 16 }} />
                </div>
                <div>
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>RIC</div>
                </div>
              </div>
              <p className="text-xs leading-relaxed max-w-[250px]" style={{ color: 'var(--text-muted)' }}>
                Shorten your incident resolution time with intelligent root cause analysis and confident correlation.
              </p>
            </div>
            
            {/* Quick Links */}
            <div className="md:col-span-2">
              <h4 className="font-bold mb-6 text-xs tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>Quick Links</h4>
              <ul className="space-y-3 text-sm font-medium">
                <li><button onClick={() => navigate('/dashboard')} className="cursor-pointer transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>Dashboard</button></li>
                <li><button onClick={() => navigate('/history')} className="cursor-pointer transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>History</button></li>
                <li><button onClick={() => navigate('/analysis')} className="cursor-pointer transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>Analysis</button></li>
              </ul>
            </div>
            
            {/* Learn About */}
            <div className="md:col-span-2">
              <h4 className="font-bold mb-6 text-xs tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>Learn About</h4>
              <ul className="space-y-3 text-sm font-medium">
                <li><button onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })} className="cursor-pointer transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>How to Use</button></li>
                <li><button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="cursor-pointer transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>Features</button></li>
                <li><button onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })} className="cursor-pointer transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>Services</button></li>
              </ul>
            </div>
            
            {/* Frequently Asked Questions */}
            <div className="md:col-span-5">
              <h4 className="font-bold mb-6 text-xs tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>Frequently Asked Questions</h4>
              <div className="flex flex-col">
                <FAQItem 
                  q="What files do I need to upload?" 
                  a="You need to upload two files: incidents.csv (containing your issue tickets) and commits.json (containing your git commit history and diffs)." 
                />
                <FAQItem 
                  q="How does the AI correlate incidents?" 
                  a="RIC maps incidents to deployments using a configurable time-window, then uses AI to analyze the actual code diffs to find the specific root cause." 
                />
                <FAQItem 
                  q="Is my codebase secure?" 
                  a="Yes! The analysis runs securely and we do not store your repository or incident data after the analysis completes." 
                />
              </div>
            </div>
            
          </div>

          {/* Bottom Copyright Row */}
          <div className="flex flex-col items-center justify-center text-center gap-4 pt-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px #6366f144' }}>
              <FundFilled style={{ color: '#fff', fontSize: 18 }} />
            </div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              © 2026 Release Incident Correlator. All rights reserved.
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"></div>
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Service Online</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
