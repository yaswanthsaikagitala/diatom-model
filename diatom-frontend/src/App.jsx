import { useState, useEffect, useRef, useCallback } from 'react';

/* ─── Constants ─────────────────────────────────────────── */
// Empty string = relative URLs → forwarded by Vite proxy to Flask :5000
// This completely avoids CORS issues in the browser
const API_BASE = '';

/* ─── Utility helpers ───────────────────────────────────── */
const accColor = (acc) => {
  if (acc >= 0.9)  return 'text-emerald-400';
  if (acc >= 0.7)  return 'text-amber-400';
  return 'text-red-400';
};
const accDot = (acc) => {
  if (acc >= 0.9)  return 'bg-emerald-400';
  if (acc >= 0.7)  return 'bg-amber-400';
  return 'bg-red-400';
};
const pct = (v) => `${(v * 100).toFixed(1)}%`;

/* ─── Sub-components ────────────────────────────────────── */

/** Animated spinner */
function Spinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-10 animate-fade-in">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-400 animate-spin-slow" style={{ animationDirection: 'reverse' }} />
      </div>
      <p className="text-cyan-300 text-sm font-medium tracking-widest uppercase animate-pulse">
        Analysing specimen…
      </p>
    </div>
  );
}

/** Accuracy badge pill */
function AccBadge({ label, value }) {
  const colorClass = accColor(value);
  return (
    <div className="glass-light rounded-xl px-4 py-3 flex flex-col items-center gap-1 min-w-[110px]">
      <span className="text-white/40 text-xs uppercase tracking-wider">{label}</span>
      <span className={`text-xl font-bold font-mono ${colorClass}`}>{pct(value)}</span>
    </div>
  );
}

/** Progress bar */
function ConfBar({ name, confidence, rank }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(confidence * 100), 100);
    return () => clearTimeout(t);
  }, [confidence]);

  const rankColors = ['from-cyan-500 to-blue-500', 'from-blue-500 to-violet-500', 'from-violet-500 to-fuchsia-500'];
  return (
    <div className="glass-light rounded-xl p-4 animate-slide-up">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white/30 w-5">#{rank}</span>
          <span className="text-sm font-semibold text-white/90 italic">{name}</span>
        </div>
        <span className="text-sm font-mono text-cyan-300 font-semibold">{pct(confidence)}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${rankColors[rank - 1] || rankColors[2]} progress-bar-fill`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/** Small chip tag */
function Chip({ text, color = 'cyan' }) {
  const palette = {
    cyan:   'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    blue:   'bg-blue-500/10 text-blue-300 border-blue-500/20',
    purple: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${palette[color]}`}>
      {text}
    </span>
  );
}

/** Advantage / lab card item */
function ListCard({ text, variant = 'green' }) {
  const style = variant === 'green'
    ? 'border-l-4 border-emerald-500 bg-emerald-500/5 text-emerald-100'
    : 'border-l-4 border-blue-500 bg-blue-500/5 text-blue-100';
  const icon = variant === 'green'
    ? <span className="text-emerald-400 mt-0.5">✦</span>
    : <span className="text-blue-400 mt-0.5">⬡</span>;
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg ${style} text-sm leading-relaxed`}>
      {icon}
      <span>{text}</span>
    </div>
  );
}

/* ─── Sidebar ───────────────────────────────────────────── */
function Sidebar({ classes, sidebarOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-72 z-30 flex flex-col
          glass border-r border-white/5
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:z-auto lg:flex-shrink-0
        `}
      >
        {/* Logo area */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg glow-cyan">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient-cyan">DiatomAI</h1>
              <p className="text-xs text-white/40 font-mono">v1.0 · ResNet-50</p>
            </div>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            ResNet-based deep learning classifier for freshwater &amp; marine diatom species identification.
          </p>
        </div>

        {/* Species list */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Known Species</p>
            {classes.length > 0 && (
              <span className="text-xs bg-white/5 text-white/40 rounded-full px-2 py-0.5">{classes.length}</span>
            )}
          </div>

          {classes.length === 0 ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-white/3 rounded-lg animate-pulse" />
              ))}
              <p className="text-xs text-white/30 text-center pt-2">Connecting to API…</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {classes.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg glass-light hover:bg-white/8 transition-all duration-200 group cursor-default"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${accDot(item.accuracy ?? 0)}`} />
                    <span className="text-xs text-white/75 group-hover:text-white transition-colors truncate italic">
                      {item.name}
                    </span>
                  </div>
                  {item.accuracy != null && (
                    <span className={`text-xs font-mono font-semibold flex-shrink-0 ml-2 ${accColor(item.accuracy)}`}>
                      {pct(item.accuracy)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 p-3 glass-light rounded-xl">
            <p className="text-xs text-white/30 font-semibold uppercase tracking-wider mb-2">Accuracy Legend</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <div className="w-2 h-2 rounded-full bg-emerald-400" /><span>&gt; 90% — Excellent</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <div className="w-2 h-2 rounded-full bg-amber-400" /><span>70–90% — Good</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <div className="w-2 h-2 rounded-full bg-red-400" /><span>&lt; 70% — Low</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 text-center">
          <p className="text-xs text-white/20">DiatomAI · ML Classification System</p>
        </div>
      </aside>
    </>
  );
}

/* ─── Upload Zone ───────────────────────────────────────── */
function UploadZone({ preview, onFile, isDragging, onDragOver, onDragLeave, onDrop }) {
  const inputRef = useRef(null);

  return (
    <div
      className={`
        relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
        ${isDragging
          ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
          : 'border-white/15 hover:border-cyan-500/50 hover:bg-white/3'
        }
      `}
      onClick={() => inputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      id="upload-zone"
    >
      <input
        ref={inputRef}
        id="file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files[0])}
      />

      {preview ? (
        <div className="relative p-3">
          <img
            src={preview}
            alt="Uploaded diatom specimen"
            className="w-full h-72 object-contain rounded-xl"
          />
          <div className="absolute top-5 right-5 glass rounded-full px-3 py-1 text-xs text-cyan-300 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Ready to classify
          </div>
          <div className="mt-2 text-center text-xs text-white/30">Click to change image</div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-14 px-6 text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragging ? 'bg-cyan-500/20 scale-110' : 'bg-white/5'}`}>
            <svg className={`w-8 h-8 transition-colors ${isDragging ? 'text-cyan-400' : 'text-white/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-white/70 font-medium mb-1">
              {isDragging ? 'Drop your image here' : 'Drag & drop a diatom image'}
            </p>
            <p className="text-white/30 text-sm">or click to browse · JPG, PNG, TIFF supported</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Diatom Radial Graphic ─────────────────────────────── */
function DiatomGraphic() {
  const spokes = 16;
  const cx = 40, cy = 40, r = 32;
  return (
    <div className="flex items-center gap-4 py-1 select-none pointer-events-none" aria-hidden>
      {/* Left line */}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/25 to-cyan-500/40" />

      {/* Centre: spinning SVG + label stacked */}
      <div className="flex flex-col items-center gap-1">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="animate-diatom-spin opacity-55">
          <circle cx={cx} cy={cy} r={r}     stroke="url(#rg)" strokeWidth="1" strokeDasharray="3 2" />
          <circle cx={cx} cy={cy} r={21}    stroke="url(#rg)" strokeWidth="0.6" strokeDasharray="1.5 3" />
          {[...Array(spokes)].map((_, i) => {
            const a = (i / spokes) * 2 * Math.PI;
            return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)}
              stroke="url(#sg)" strokeWidth="0.5" strokeOpacity="0.5" />;
          })}
          {[...Array(spokes)].map((_, i) => {
            const a = (i / spokes) * 2 * Math.PI + Math.PI / spokes;
            return <circle key={i} cx={cx + 21 * Math.cos(a)} cy={cy + 21 * Math.sin(a)}
              r="1.4" fill="url(#dg)" fillOpacity="0.75" />;
          })}
          <circle cx={cx} cy={cy} r="6"  fill="url(#ng)" />
          <circle cx={cx} cy={cy} r="3"  fill="#22d3ee" fillOpacity="0.4" />
          <defs>
            <linearGradient id="rg" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="sg" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <radialGradient id="dg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#67e8f9" /><stop offset="100%" stopColor="#6366f1" />
            </radialGradient>
            <radialGradient id="ng" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0e7490" /><stop offset="100%" stopColor="#1e1b4b" />
            </radialGradient>
          </defs>
        </svg>
        <span className="text-[9px] font-mono text-cyan-400/45 tracking-[0.25em] uppercase">Analysis Complete</span>
      </div>

      {/* Right line */}
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-cyan-500/25 to-cyan-500/40" />
    </div>
  );
}

/* ─── Results Panel ─────────────────────────────────────── */
function ResultsPanel({ result }) {
  const hasAdvantages = result.advantages?.length > 0;
  const hasLabMethods = result.lab_methods?.length > 0;
  const showSideBySide = hasAdvantages && hasLabMethods;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Hero prediction */}
      <div className="glass rounded-2xl p-6 glow-cyan">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Identified Species</p>
            <h2 className="text-2xl font-bold italic text-gradient-cyan leading-tight">
              {result.predicted_class}
            </h2>
          </div>
          <div className="flex gap-3 flex-wrap">
            <AccBadge label="Confidence" value={result.confidence} />
            <AccBadge label="Model Acc." value={result.model_accuracy} />
          </div>
        </div>

        {/* Habitat & Ecology chips */}
        {(result.habitat || result.ecology) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {result.habitat && <Chip text={`🌊 ${result.habitat}`} color="cyan" />}
            {result.ecology && <Chip text={`🔬 ${result.ecology}`} color="purple" />}
          </div>
        )}
      </div>

      {/* ── Animated diatom graphic divider ── */}
      <DiatomGraphic />

      {/* Top 3 predictions — full width */}
      {result.top3?.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Top Predictions
          </h3>
          <div className="space-y-3">
            {result.top3.map((item, i) => (
              <ConfBar key={i} name={item.name} confidence={item.confidence} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* ── Side-by-side: Lab Methods  |  Species Advantages ── */}
      {showSideBySide ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Lab Methods */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="text-blue-400 text-base">⬡</span> Lab Methods
            </h3>
            <div className="space-y-2">
              {result.lab_methods.map((method, i) => (
                <ListCard key={i} text={method} variant="blue" />
              ))}
            </div>
          </div>

          {/* Species Uses */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="text-emerald-400 text-base">✦</span> Species Uses
            </h3>
            <div className="space-y-2">
              {result.advantages.map((adv, i) => (
                <ListCard key={i} text={adv} variant="green" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Fallback: only one section exists — render it full width */}
          {hasLabMethods && (
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-blue-400">⬡</span> Lab Methods
              </h3>
              <div className="space-y-2">
                {result.lab_methods.map((method, i) => (
                  <ListCard key={i} text={method} variant="blue" />
                ))}
              </div>
            </div>
          )}
          {hasAdvantages && (
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-emerald-400">✦</span> Species Uses
              </h3>
              <div className="space-y-2">
                {result.advantages.map((adv, i) => (
                  <ListCard key={i} text={adv} variant="green" />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Error Banner ──────────────────────────────────────── */
function ErrorBanner({ message, onDismiss }) {
  return (
    <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 animate-fade-in">
      <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-red-300 text-sm flex-1">{message}</p>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-200 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/* ─── Main App ──────────────────────────────────────────── */
export default function App() {
  const [classes, setClasses]       = useState([]);
  const [file, setFile]             = useState(null);
  const [preview, setPreview]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarOpen, setSidebar]   = useState(false);
  const resultsRef                  = useRef(null);

  /* fetch species list on mount */
  useEffect(() => {
    fetch(`${API_BASE}/classes`)
      .then((r) => r.json())
      .then((data) => setClasses(Array.isArray(data) ? data : []))
      .catch(() => setClasses([]));
  }, []);

  /* scroll to results */
  useEffect(() => {
    if (result) {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [result]);

  const handleFile = useCallback((f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handlePredict = async () => {
    if (!file) {
      setError('Please select an image first.');
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/predict`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(
        err.message.includes('fetch')
          ? 'Cannot reach the backend. Make sure Flask is running at http://localhost:5000.'
          : `Prediction failed: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex relative overflow-hidden"
      style={{
        backgroundImage: "url('/bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay on top of bg image */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-950/90 via-navy-900/85 to-blue-950/80" />

      {/* Decorative glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Layout */}
      <div className="relative z-10 flex w-full min-h-screen">

        <Sidebar classes={classes} sidebarOpen={sidebarOpen} onClose={() => setSidebar(false)} />

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">

          {/* Top bar */}
          <header className="sticky top-0 z-20 glass border-b border-white/5 px-6 py-4 flex items-center gap-4">
            {/* Hamburger (mobile) */}
            <button
              id="sidebar-toggle"
              onClick={() => setSidebar((s) => !s)}
              className="lg:hidden text-white/60 hover:text-white transition-colors p-1"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex w-1.5 h-6 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" />
                <div>
                  <h1 className="text-lg font-bold text-white leading-tight">DiatomAI — Species Classifier</h1>
                  <p className="text-xs text-white/40">ResNet-50 · Deep Learning · Microscopy Image Analysis</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/40 hidden sm:block">System online</span>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 p-6 lg:p-8 max-w-3xl mx-auto w-full">

            {/* Hero */}
            <div className="mb-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs text-cyan-300 font-medium tracking-wide">AI-Powered Microscopy Analysis</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-3 leading-tight">
                Identify Diatom Species<br />
                <span className="text-gradient-cyan">with Deep Learning</span>
              </h2>
              <p className="text-white/50 text-base leading-relaxed max-w-xl">
                Upload a microscopy image of a diatom specimen and our ResNet-50 model will classify the species, 
                providing detailed ecological and analytical information.
              </p>
            </div>

            {/* Upload card */}
            <div className="glass rounded-2xl p-6 mb-5 animate-fade-in">
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Specimen Image
              </h3>

              <UploadZone
                preview={preview}
                onFile={handleFile}
                isDragging={isDragging}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />

              {error && (
                <div className="mt-4">
                  <ErrorBanner message={error} onDismiss={() => setError(null)} />
                </div>
              )}

              <button
                id="identify-btn"
                onClick={handlePredict}
                disabled={loading || !file}
                className={`
                  mt-5 w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide
                  flex items-center justify-center gap-2.5 transition-all duration-300
                  ${loading || !file
                    ? 'bg-white/5 text-white/25 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.01] active:scale-[0.99]'
                  }
                `}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Identifying…
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Identify Diatom
                  </>
                )}
              </button>
            </div>

            {/* Loading spinner */}
            {loading && <Spinner />}

            {/* Results */}
            {result && !loading && (
              <div ref={resultsRef}>
                <ResultsPanel result={result} />
              </div>
            )}

            {/* Empty state */}
            {!result && !loading && (
              <div className="glass rounded-2xl p-8 text-center animate-fade-in mt-2">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <p className="text-white/30 text-sm">Upload a diatom image and click <span className="text-cyan-400 font-medium">Identify Diatom</span> to see results</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}