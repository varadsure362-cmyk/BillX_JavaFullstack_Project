import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../redux/slices/themeSlice';
import {
  Menu, X, Sun, Moon, ShoppingCart, QrCode, Package,
  GitBranch, BarChart2, FileText, Lock, ChevronRight,
  Zap, Star, ArrowRight
} from 'lucide-react';

const Github = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);


/* ─── Asset paths ─── */
const HERO_BG = '/assets/banner2.png';
const FEATURES_BG = '/assets/Gemini_Generated_Image_8xltzq8xltzq8xlt.png';
const FEATURE_LEFT = '/assets/image.png';       // QR payment
const FEATURE_RIGHT = '/assets/image3.png';      // Cart + inventory
const FEATURE_INV = '/assets/image3.png';      // Inventory focus

/* ─── Feature list ─── */
const NAV_FEATURES = [
  { label: 'POS Billing', icon: ShoppingCart, anchor: '#pos-billing' },
  { label: 'UPI QR Payments', icon: QrCode, anchor: '#upi-payments' },
  { label: 'Inventory Management', icon: Package, anchor: '#inventory' },
  { label: 'Branch Management', icon: GitBranch, anchor: '#branches' },
  { label: 'Analytics & Reports', icon: BarChart2, anchor: '#analytics' },
  { label: 'Weekly PDF Reports', icon: FileText, anchor: '#reports' },
  { label: 'Google Login', icon: Lock, anchor: '#auth' },
];

const FEATURE_CARDS = [
  {
    id: 'pos-billing',
    icon: ShoppingCart,
    title: 'Lightning POS Billing',
    desc: 'Blazing-fast checkout terminal with barcode search, category filters, and keyboard shortcuts. Built for cashiers who move at the speed of retail.',
    accent: '#10b981',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'upi-payments',
    icon: QrCode,
    title: 'UPI QR Payments',
    desc: 'Dynamic per-branch Razorpay integration — each branch connects its own account. Payments settle directly into the right bank, every time.',
    accent: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'inventory',
    icon: Package,
    title: 'Inventory Control',
    desc: 'Track stock levels across every branch in real time. Automatic low-stock alerts ensure you never miss a restock window.',
    accent: '#f59e0b',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    id: 'branches',
    icon: GitBranch,
    title: 'Branch & Employee Management',
    desc: 'Manage multiple store locations from one dashboard. Assign employees, compare performance, and switch context instantly.',
    accent: '#3b82f6',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'analytics',
    icon: BarChart2,
    title: 'Dynamic Analytics & Charts',
    desc: 'Interactive donut charts, sales trends, cashier leaderboards, and category breakdowns — all powered by live data.',
    accent: '#06b6d4',
    gradient: 'from-cyan-400 to-blue-500',
  },
  {
    id: 'reports',
    icon: FileText,
    title: 'Weekly PDF Email Reports',
    desc: 'Auto-generated weekly performance reports delivered to your inbox. Trigger manual reports on demand for any date range.',
    accent: '#f43f5e',
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    id: 'auth',
    icon: Lock,
    title: 'Google OAuth2 Login',
    desc: 'Secure, passwordless authentication via Google. New users are auto-provisioned — managers assign roles and branches.',
    accent: '#64748b',
    gradient: 'from-slate-400 to-zinc-500',
  },
];

/* ─── Scroll-reveal hook ─── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── Reveal wrapper ─── */
function Reveal({ children, delay = 0, direction = 'up', className = '', style = {} }) {
  const [ref, visible] = useScrollReveal(0.12);
  const translateMap = { up: 'translateY(40px)', left: 'translateX(-40px)', right: 'translateX(40px)' };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : translateMap[direction] || 'translateY(40px)',
        transition: `opacity 0.55s ease ${delay}s, transform 0.55s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}


/* ─── Main Component ─── */
export const LandingPage = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.mode);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Close sidebar on outside click
  useEffect(() => {
    if (!sidebarOpen) return;
    const handler = (e) => {
      if (!document.getElementById('lp-sidebar')?.contains(e.target) &&
        !document.getElementById('lp-hamburger')?.contains(e.target)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sidebarOpen]);

  const handleNavAnchor = (anchor) => {
    setSidebarOpen(false);
    setTimeout(() => {
      const el = document.querySelector(anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  /* ── CSS vars for theme ── */
  const css = {
    bg: isDark ? '#09090b' : '#ffffff',
    bgSub: isDark ? '#111113' : '#f8fafc',
    surface: isDark ? '#18181b' : '#ffffff',
    surfaceAlt: isDark ? '#1f1f23' : '#f1f5f9',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    text: isDark ? '#f4f4f5' : '#18181b',
    textSub: isDark ? '#a1a1aa' : '#64748b',
    green: '#059669',
    greenL: '#10b981',
    blue: '#2563eb',
    blueL: '#3b82f6',
  };

  return (
    <div style={{ background: css.bg, color: css.text, minHeight: '100vh', overflowX: 'hidden', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ══════════ SIDEBAR ══════════ */}
      {/* Backdrop */}
      <div
        onClick={() => setSidebarOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 90,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? 'all' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />
      {/* Panel */}
      <aside
        id="lp-sidebar"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
          width: 280,
          background: isDark ? '#111113' : '#ffffff',
          borderRight: `1px solid ${css.border}`,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', flexDirection: 'column',
          boxShadow: sidebarOpen ? '8px 0 40px rgba(0,0,0,0.25)' : 'none',
        }}
      >
        {/* Sidebar header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: `1px solid ${css.border}` }}>
          <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' }}>
            <span style={{ color: css.green }}>Bill</span>X
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: css.textSub, padding: 4, borderRadius: 6 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Theme toggle */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${css.border}` }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: css.textSub, marginBottom: 10 }}>Appearance</p>
          <button
            onClick={() => dispatch(toggleTheme())}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px',
              background: css.surfaceAlt, border: `1px solid ${css.border}`,
              borderRadius: 10, cursor: 'pointer', color: css.text,
              fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
            }}
          >
            {isDark
              ? <><Sun size={16} style={{ color: '#fbbf24' }} /> Switch to Light Mode</>
              : <><Moon size={16} style={{ color: '#818cf8' }} /> Switch to Dark Mode</>
            }
          </button>
        </div>

        {/* Feature nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: css.textSub, marginBottom: 12 }}>Features</p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.anchor}
                  onClick={() => handleNavAnchor(f.anchor)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '10px 12px', background: 'none',
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    color: css.textSub, fontSize: 14, fontWeight: 500,
                    textAlign: 'left', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = css.surfaceAlt; e.currentTarget.style.color = css.text; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = css.textSub; }}
                >
                  <Icon size={15} style={{ flexShrink: 0, color: css.green }} />
                  {f.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar footer */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${css.border}` }}>
          <Link
            to="/signup"
            onClick={() => setSidebarOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '11px', background: css.green, color: '#fff',
              borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700,
              boxShadow: `0 4px 14px ${css.green}40`,
            }}
          >
            Get Started Free <ArrowRight size={15} />
          </Link>
        </div>
      </aside>

      {/* ══════════ NAVBAR ══════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 80,
        height: 64,
        background: isDark ? 'rgba(9,9,11,0.85)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${css.border}`,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: hamburger + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              id="lp-hamburger"
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: `1px solid ${css.border}`, borderRadius: 8, cursor: 'pointer', color: css.text, padding: '6px', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' }}>
              <span style={{ color: css.green }}>Bill</span>X
            </span>
          </div>

          {/* Right: Login + Sign Up */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link
              to="/login"
              style={{
                padding: '8px 18px', fontSize: 14, fontWeight: 600,
                color: css.textSub, textDecoration: 'none', borderRadius: 8,
                transition: 'color 0.15s',
                border: `1px solid ${css.border}`,
                background: 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.color = css.green}
              onMouseLeave={e => e.currentTarget.style.color = css.textSub}
            >
              Log in
            </Link>
            <Link
              to="/signup"
              style={{
                padding: '8px 18px', fontSize: 14, fontWeight: 700,
                background: css.green, color: '#fff', textDecoration: 'none',
                borderRadius: 8, boxShadow: `0 2px 12px ${css.green}40`,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 18px ${css.green}55`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 2px 12px ${css.green}40`; }}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════ HERO SECTION ══════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 64 }}>
        {/* Background image */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center 30%', backgroundRepeat: 'no-repeat' }} />
        {/* Gradient overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.75) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 180, background: `linear-gradient(to top, ${css.bg}, transparent)` }} />

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 760, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          {/* Badge */}
          <div style={{
            opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(20px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 28,
            padding: '6px 16px', borderRadius: 999,
            border: '1px solid rgba(16,185,129,0.35)',
            background: 'rgba(16,185,129,0.1)', backdropFilter: 'blur(8px)',
          }}>
            <Zap size={12} style={{ color: '#10b981' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#10b981' }}>Next-Generation Point of Sale</span>
          </div>

          {/* Headline */}
          <h1 style={{
            opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(28px)',
            transition: 'opacity 0.65s ease 0.1s, transform 0.65s ease 0.1s',
            fontSize: 'clamp(2.8rem, 8vw, 5.5rem)', fontWeight: 900,
            lineHeight: 1.0, letterSpacing: '-0.03em', color: '#ffffff', margin: '0 0 24px',
          }}>
            Sell smarter.<br />
            <span style={{ background: 'linear-gradient(90deg, #10b981, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Grow faster.
            </span>
          </h1>

          {/* Subtext */}
          <p style={{
            opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(24px)',
            transition: 'opacity 0.65s ease 0.2s, transform 0.65s ease 0.2s',
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'rgba(255,255,255,0.72)',
            lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px', fontWeight: 400,
          }}>
            BillX brings billing, inventory, multi-branch operations, and live analytics under one roof — so you can focus on what matters: your customers.
          </p>

          {/* CTA buttons */}
          <div style={{
            opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(20px)',
            transition: 'opacity 0.65s ease 0.32s, transform 0.65s ease 0.32s',
            display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'center',
          }}>
            <Link
              to="/signup"
              style={{
                padding: '14px 32px', fontSize: 15, fontWeight: 700,
                background: css.green, color: '#fff', textDecoration: 'none',
                borderRadius: 12, boxShadow: `0 6px 24px ${css.green}50`,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 30px ${css.green}60`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 6px 24px ${css.green}50`; }}
            >
              Get Started — It's Free <ChevronRight size={16} />
            </Link>
            <Link
              to="/login"
              style={{
                padding: '14px 32px', fontSize: 15, fontWeight: 600,
                background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none',
                borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'none'; }}
            >
              Log In to Dashboard
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
          opacity: heroVisible ? 1 : 0, transition: 'opacity 0.6s ease 0.9s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Scroll to explore</span>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)', animation: 'pulse 2s ease-in-out infinite' }} />
        </div>
      </section>

      {/* ══════════ FEATURES SECTION ══════════ */}
      <section id="features" style={{ position: 'relative', padding: '100px 0', background: css.bg }}>
        {/* Features BG accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 560, backgroundImage: `url(${FEATURES_BG})`, backgroundSize: 'cover', backgroundPosition: 'center 20%', opacity: isDark ? 0.07 : 0.04 }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 560, background: isDark ? 'linear-gradient(to bottom, rgba(9,9,11,0), rgba(9,9,11,0.9) 80%)' : 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.95) 80%)' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          {/* Section heading */}
          <Reveal>
            <div style={{ textAlign: 'center', maxWidth: 580, margin: '0 auto 72px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: '5px 14px', borderRadius: 999, background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(5,150,105,0.08)', border: `1px solid rgba(16,185,129,0.2)` }}>
                <Star size={11} style={{ color: css.green }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: css.green }}>Everything You Need</span>
              </div>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 16px', color: css.text }}>
                Built for modern retail
              </h2>
              <p style={{ fontSize: 17, color: css.textSub, lineHeight: 1.7, margin: 0 }}>
                From checkout to analytics, BillX covers every aspect of your point-of-sale operations with precision and speed.
              </p>
            </div>
          </Reveal>

          {/* Feature cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURE_CARDS.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.id} delay={i * 0.07} direction="up">
                  <div
                    id={f.id}
                    style={{
                      position: 'relative', padding: '28px', borderRadius: 16,
                      background: css.surface,
                      border: `1px solid ${css.border}`,
                      overflow: 'hidden', cursor: 'default',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = isDark ? '0 12px 36px rgba(0,0,0,0.5)' : '0 12px 36px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {/* Top accent line */}
                    <div style={{ position: 'absolute', top: 0, left: 28, right: 28, height: 2, background: `linear-gradient(90deg, ${f.accent}, transparent)`, borderRadius: 999 }} />
                    {/* Icon badge */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, background: `${f.accent}18`, marginBottom: 18, border: `1px solid ${f.accent}25` }}>
                      <Icon size={20} style={{ color: f.accent }} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', margin: '0 0 10px', color: css.text }}>{f.title}</h3>
                    <p style={{ fontSize: 14, color: css.textSub, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ FEATURE SPOTLIGHT — LEFT IMAGE ══════════ */}
      {/* UPI QR Payments spotlight */}
      <section style={{ padding: '80px 0', background: css.bgSub }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 60 }}>
          <Reveal direction="left" className="lp-feat-img" delay={0} style={{ flex: '1 1 340px', maxWidth: 380 }}>
            <div style={{ borderRadius: 24, overflow: 'hidden', border: `1px solid ${css.border}`, boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.6)' : '0 20px 60px rgba(0,0,0,0.12)' }}>
              <img src={FEATURE_LEFT} alt="UPI QR payment confirmation on mobile" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
            </div>
          </Reveal>
          <Reveal direction="right" delay={0.1} style={{ flex: '1 1 320px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: '5px 14px', borderRadius: 999, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}>
                <QrCode size={11} style={{ color: '#8b5cf6' }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8b5cf6' }}>UPI QR Payments</span>
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 18px', color: css.text, lineHeight: 1.15 }}>
                Every branch,<br />its own payment account.
              </h2>
              <p style={{ fontSize: 16, color: css.textSub, lineHeight: 1.75, margin: '0 0 24px' }}>
                Dynamic per-branch Razorpay integration means each store location connects its own Razorpay account. Payments settle directly into the right bank — no manual splits, no shared pools.
              </p>
              <p style={{ fontSize: 15, color: css.textSub, lineHeight: 1.75, margin: 0 }}>
                Real-time webhook-driven payment confirmation. QR codes generated per order, verified automatically — cashiers see the ✓ the instant the customer pays.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════ FEATURE SPOTLIGHT — RIGHT IMAGE ══════════ */}
      {/* POS + Inventory spotlight */}
      <section style={{ padding: '80px 0', background: css.bg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', flexWrap: 'wrap-reverse', alignItems: 'center', gap: 60 }}>
          <Reveal direction="left" delay={0.1} style={{ flex: '1 1 320px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: '5px 14px', borderRadius: 999, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <Package size={11} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f59e0b' }}>Inventory Management</span>
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 18px', color: css.text, lineHeight: 1.15 }}>
                Never run out.<br />Always restock right.
              </h2>
              <p style={{ fontSize: 16, color: css.textSub, lineHeight: 1.75, margin: '0 0 24px' }}>
                Track stock levels across every branch in real time. BillX automatically fires low-stock alerts the moment quantities dip below your threshold — so you're never caught off guard.
              </p>
              <p style={{ fontSize: 15, color: css.textSub, lineHeight: 1.75, margin: 0 }}>
                POS billing is equally powerful — barcode search, category filters, and keyboard-first shortcuts designed for cashiers who move at retail speed.
              </p>
            </div>
          </Reveal>
          <Reveal direction="right" delay={0} style={{ flex: '1 1 340px', maxWidth: 420 }}>
            <div style={{ borderRadius: 24, overflow: 'hidden', border: `1px solid ${css.border}`, boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.6)' : '0 20px 60px rgba(0,0,0,0.12)' }}>
              <img src={FEATURE_RIGHT} alt="POS terminal and inventory management" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════ SLOGAN / MESSAGING SECTION ══════════ */}
      <section style={{ padding: '100px 24px', background: isDark ? 'linear-gradient(135deg, #0f172a 0%, #09090b 60%, #052e16 100%)' : 'linear-gradient(135deg, #ecfdf5 0%, #f0f9ff 60%, #f8fafc 100%)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div style={{ marginBottom: 48 }}>
              {/* Decorative line */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 40 }}>
                <div style={{ height: 1, width: 60, background: `linear-gradient(to right, transparent, ${css.green})` }} />
                <Star size={14} style={{ color: css.green }} />
                <div style={{ height: 1, width: 60, background: `linear-gradient(to left, transparent, ${css.green})` }} />
              </div>
              <h2 style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 24px', color: css.text }}>
                Run your store,<br />
                <span style={{ background: 'linear-gradient(90deg, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  not your spreadsheets.
                </span>
              </h2>
              <p style={{ fontSize: 18, color: css.textSub, lineHeight: 1.7, margin: '0 0 48px', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
                One platform to bill, track, report, and grow — so every minute you save behind the counter is a minute you spend building your business.
              </p>
              <Link
                to="/signup"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '15px 36px', fontSize: 15, fontWeight: 700,
                  background: `linear-gradient(135deg, ${css.green}, #3b82f6)`,
                  color: '#fff', textDecoration: 'none', borderRadius: 12,
                  boxShadow: `0 8px 28px rgba(16,185,129,0.35)`,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(16,185,129,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(16,185,129,0.35)'; }}
              >
                Start for Free <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>

          {/* Stats row */}
          <Reveal delay={0.15}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '28px 56px', marginTop: 16 }}>
              {[
                { value: '7+', label: 'Core Features' },
                { value: '∞', label: 'Branch Support' },
                { value: '100%', label: 'Real-Time Data' },
              ].map(s => (
                <div key={s.value} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', color: css.text }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: css.textSub, fontWeight: 500, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════ CTA BAND ══════════ */}
      <section style={{ padding: '80px 24px', background: css.bgSub, borderTop: `1px solid ${css.border}`, borderBottom: `1px solid ${css.border}` }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 16px', color: css.text }}>
              Ready to upgrade your<br />
              <span style={{ color: css.green }}>point of sale?</span>
            </h2>
            <p style={{ fontSize: 16, color: css.textSub, lineHeight: 1.7, margin: '0 auto 36px', maxWidth: 460 }}>
              Join BillX and start processing transactions, tracking inventory, and generating reports in minutes. No setup fees, no lock-in.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
              <Link
                to="/signup"
                style={{
                  padding: '13px 30px', fontSize: 15, fontWeight: 700,
                  background: css.green, color: '#fff', textDecoration: 'none',
                  borderRadius: 10, boxShadow: `0 4px 16px ${css.green}40`,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >
                Create Your Account
              </Link>
              <Link
                to="/login"
                style={{
                  padding: '13px 30px', fontSize: 15, fontWeight: 600,
                  border: `1px solid ${css.border}`, color: css.text, textDecoration: 'none',
                  borderRadius: 10, background: 'transparent', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = css.surfaceAlt; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none'; }}
              >
                Sign In
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ padding: '36px 24px', borderTop: `1px solid ${css.border}`, background: css.bg }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 15, color: css.textSub }}>
            Built with <span style={{ color: '#f43f5e' }}>❤️</span> by{' '}
            <span style={{ fontWeight: 700, color: css.text }}>Varad</span>
          </p>
          <span style={{ color: css.border, fontSize: 18 }}>·</span>
          <a
            href="https://github.com/varadsure362-cmyk"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: css.textSub, textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = css.text}
            onMouseLeave={e => e.currentTarget.style.color = css.textSub}
          >
            <Github size={15} /> GitHub
          </a>
        </div>
      </footer>

      {/* ══════════ GLOBAL STYLES ══════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        
        html { scroll-behavior: smooth; }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .lp-feat-img { max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
