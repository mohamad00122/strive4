import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 100 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>
          Strive<span style={{ color: 'var(--amber)' }}>.</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/login" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--text2)', textDecoration: 'none', padding: '8px 16px', borderRadius: 9, border: '1px solid var(--border2)', background: 'var(--bg1)' }}>
            Log in
          </Link>
          <Link to="/signup" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#000', textDecoration: 'none', padding: '8px 16px', borderRadius: 9, background: 'var(--amber)' }}>
            Get started →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ maxWidth: 740, margin: '0 auto', textAlign: 'center', padding: '72px 24px 56px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '5px 14px', fontSize: 11, color: 'var(--amber)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 24 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)', display: 'inline-block' }} />
          Personal Training Platform
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(36px, 7vw, 68px)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.05, letterSpacing: -2, marginBottom: 18 }}>
          Train smarter,<br /><span style={{ color: 'var(--amber)' }}>get results.</span>
        </h1>
        <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', color: 'var(--text2)', lineHeight: 1.7, marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
          Strive connects personal trainers with their clients online. Build custom workout plans, attach demo videos, track progress, and deliver a world-class training experience from anywhere.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/signup" style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: '#000', textDecoration: 'none', padding: '13px 26px', borderRadius: 12, background: 'var(--amber)' }}>
            Start free →
          </Link>
          <Link to="/login" style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--text2)', textDecoration: 'none', padding: '13px 26px', borderRadius: 12, background: 'var(--bg2)', border: '1px solid var(--border2)' }}>
            Log in
          </Link>
        </div>
      </div>

      {/* FEATURES GRID */}
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '40px 24px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5, marginBottom: 8 }}>
            Everything you need to train online
          </h2>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Built for trainers who want to scale. Built for clients who want results.</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {[
            { icon: '🎬', title: 'Video demos', desc: 'Upload your own exercise videos. Clients see your cues on every exercise in their plan.' },
            { icon: '📋', title: 'Custom weekly plans', desc: 'Build personalised weekly workout splits with sets, reps, rest time, and coaching notes.' },
            { icon: '📊', title: 'Progress tracking', desc: 'Track weight, performance PRs, and compliance over time with beautiful charts.' },
            { icon: '🥗', title: 'Nutrition planning', desc: 'Auto-calculated macros and meal plans based on each client\'s goals and stats.' },
            { icon: '💬', title: 'Built-in messaging', desc: 'Chat directly with clients or trainers in real time without leaving the app.' },
            { icon: '🔒', title: 'Fully secure', desc: 'Every trainer\'s data is isolated. Your clients, plans, and videos are private to you.' },
          ].map(f => (
            <div key={f.title} style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FOR TRAINERS / CLIENTS */}
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 24px 72px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 14, padding: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 14 }}>🏋️</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 19, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>For Trainers</div>
          {['Build plans for unlimited clients', 'Upload your own demo videos', 'Track client progress and compliance', 'Manage your full client roster', 'In-app messaging with every client'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{item}</div>
            </div>
          ))}
          <Link to="/signup" style={{ display: 'block', marginTop: 18, fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: '#000', textDecoration: 'none', padding: 11, borderRadius: 9, background: 'var(--amber)', textAlign: 'center' }}>
            Join as a Trainer →
          </Link>
        </div>

        <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 14, padding: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 14 }}>💪</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 19, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>For Clients</div>
          {['See your full weekly workout plan', 'Watch trainer demo videos inline', 'Log sessions and track streaks', 'View your nutrition plan and macros', 'Message your trainer anytime'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{item}</div>
            </div>
          ))}
          <Link to="/login" style={{ display: 'block', marginTop: 18, fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--text)', textDecoration: 'none', padding: 11, borderRadius: 9, background: 'var(--bg2)', border: '1px solid var(--border2)', textAlign: 'center' }}>
            Client login →
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '56px 24px', textAlign: 'center', background: 'var(--bg1)' }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5, marginBottom: 10 }}>
          Ready to elevate your training?
        </h2>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>Join Strive today — free to get started.</div>
        <Link to="/signup" style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: '#000', textDecoration: 'none', padding: '13px 28px', borderRadius: 12, background: 'var(--amber)', display: 'inline-block' }}>
          Create your account →
        </Link>
      </div>
    </div>
  )
}
