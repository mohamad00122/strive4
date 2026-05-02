import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div style={{minHeight:'100vh', background:'var(--bg)', overflowX:'hidden'}}>

      {/* NAV */}
      <nav style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 32px', borderBottom:'0.5px solid var(--border)', position:'sticky', top:0, background:'var(--bg)', zIndex:100}}>
        <div style={{fontFamily:'var(--font-head)', fontSize:'20px', fontWeight:'800', color:'var(--text)', letterSpacing:'-0.5px'}}>
          Strive<span style={{color:'var(--accent)'}}>.</span>
        </div>
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
          <Link to="/login" style={{fontFamily:'var(--font-head)', fontSize:'13px', fontWeight:'600', color:'var(--text2)', textDecoration:'none', padding:'8px 16px', borderRadius:'10px', border:'0.5px solid var(--border2)', background:'var(--surface)'}}>
            Log in
          </Link>
          <Link to="/signup" style={{fontFamily:'var(--font-head)', fontSize:'13px', fontWeight:'600', color:'#fff', textDecoration:'none', padding:'8px 16px', borderRadius:'10px', background:'var(--accent)'}}>
            Get started →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:'-100px', left:'50%', transform:'translateX(-50%)', width:'800px', height:'500px', background:'radial-gradient(ellipse at center, rgba(91,140,255,0.08) 0%, transparent 65%)', pointerEvents:'none'}} />
        <div style={{maxWidth:'760px', margin:'0 auto', textAlign:'center', padding:'80px 24px 60px'}}>
          <div style={{display:'inline-flex', alignItems:'center', gap:'7px', background:'var(--accent-dim)', border:'0.5px solid rgba(91,140,255,0.25)', borderRadius:'20px', padding:'6px 16px', fontSize:'12px', color:'var(--accent)', fontFamily:'var(--font-head)', fontWeight:'600', letterSpacing:'0.5px', marginBottom:'28px'}}>
            <div style={{width:'6px', height:'6px', borderRadius:'50%', background:'var(--accent)', animation:'pulse 2s infinite'}} />
            Online Personal Training Platform
          </div>
          <h1 style={{fontFamily:'var(--font-head)', fontSize:'clamp(36px, 7vw, 72px)', fontWeight:'800', color:'var(--text)', lineHeight:'1.05', letterSpacing:'-2px', marginBottom:'20px'}}>
            Personal training,<br /><span style={{color:'var(--accent)'}}>elevated.</span>
          </h1>
          <p style={{fontSize:'clamp(14px, 2vw, 18px)', color:'var(--text2)', lineHeight:'1.7', marginBottom:'36px', maxWidth:'520px', margin:'0 auto 36px'}}>
            Strive connects trainers with their clients online. Build custom workout plans, attach demo videos for every exercise, and deliver a world-class training experience from anywhere.
          </p>
          <div style={{display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap'}}>
            <Link to="/signup" style={{fontFamily:'var(--font-head)', fontSize:'15px', fontWeight:'700', color:'#fff', textDecoration:'none', padding:'14px 28px', borderRadius:'14px', background:'var(--accent)', boxShadow:'0 6px 28px var(--accent-glow)'}}>
              Start for free →
            </Link>
            <Link to="/login" style={{fontFamily:'var(--font-head)', fontSize:'15px', fontWeight:'700', color:'var(--text2)', textDecoration:'none', padding:'14px 28px', borderRadius:'14px', background:'var(--surface2)', border:'0.5px solid var(--border2)'}}>
              Log in
            </Link>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div style={{maxWidth:'960px', margin:'0 auto', padding:'60px 24px'}}>
        <div style={{textAlign:'center', marginBottom:'48px'}}>
          <div style={{fontFamily:'var(--font-head)', fontSize:'clamp(24px, 4vw, 36px)', fontWeight:'800', color:'var(--text)', letterSpacing:'-1px', marginBottom:'10px'}}>
            Everything you need to train online
          </div>
          <div style={{fontSize:'14px', color:'var(--text3)'}}>Built for trainers who want to scale. Built for clients who want results.</div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'16px'}}>
          {[
            { icon:'🎬', title:'Video demos for every exercise', desc:'Upload your own exercise videos. Clients see your face, your cues, your style — on every single exercise in their plan.' },
            { icon:'📋', title:'Custom weekly plans', desc:'Build personalised weekly workout splits for each client. Set sets, reps, rest time and coaching notes per exercise.' },
            { icon:'💪', title:'Your clients, your brand', desc:'Each trainer has their own video library and client roster. Your clients only ever see your content — never anyone else\'s.' },
            { icon:'📱', title:'Mobile-first experience', desc:'Clients access their plan from their phone, tap any exercise to expand it and watch the demo video inline.' },
            { icon:'⚡', title:'Instant account setup', desc:'Create a client account in seconds and link them to your roster. No email invites, no friction — just get them started.' },
            { icon:'🔒', title:'Secure and private', desc:'Every trainer\'s data is fully isolated. Your clients, your plans, your videos — all private to you.' },
          ].map(f => (
            <div key={f.title} style={{background:'var(--surface2)', border:'0.5px solid var(--border)', borderRadius:'18px', padding:'24px'}}>
              <div style={{fontSize:'28px', marginBottom:'14px'}}>{f.icon}</div>
              <div style={{fontFamily:'var(--font-head)', fontSize:'15px', fontWeight:'700', color:'var(--text)', marginBottom:'8px'}}>{f.title}</div>
              <div style={{fontSize:'13px', color:'var(--text3)', lineHeight:'1.65'}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FOR TRAINERS / FOR CLIENTS */}
      <div style={{maxWidth:'960px', margin:'0 auto', padding:'0 24px 80px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'16px'}}>
        <div style={{background:'var(--surface2)', border:'0.5px solid var(--border)', borderRadius:'20px', padding:'32px'}}>
          <div style={{fontSize:'36px', marginBottom:'16px'}}>🏋️</div>
          <div style={{fontFamily:'var(--font-head)', fontSize:'20px', fontWeight:'800', color:'var(--text)', marginBottom:'12px'}}>For Trainers</div>
          {['Build plans for unlimited clients', 'Upload your own exercise demo videos', 'Organise videos by muscle group', 'Manage your full client roster', 'Add coaching notes to every exercise'].map(item => (
            <div key={item} style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
              <div style={{width:'18px', height:'18px', borderRadius:'50%', background:'var(--accent-dim)', border:'0.5px solid rgba(91,140,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                <div style={{width:'6px', height:'6px', borderRadius:'50%', background:'var(--accent)'}} />
              </div>
              <div style={{fontSize:'13px', color:'var(--text2)'}}>{item}</div>
            </div>
          ))}
          <Link to="/signup" style={{display:'block', marginTop:'20px', fontFamily:'var(--font-head)', fontSize:'13px', fontWeight:'700', color:'#fff', textDecoration:'none', padding:'12px', borderRadius:'12px', background:'var(--accent)', textAlign:'center'}}>
            Join as a Trainer →
          </Link>
        </div>

        <div style={{background:'var(--surface2)', border:'0.5px solid var(--border)', borderRadius:'20px', padding:'32px'}}>
          <div style={{fontSize:'36px', marginBottom:'16px'}}>💪</div>
          <div style={{fontFamily:'var(--font-head)', fontSize:'20px', fontWeight:'800', color:'var(--text)', marginBottom:'12px'}}>For Clients</div>
          {['See your full weekly workout plan', 'Watch your trainer\'s demo videos', 'Know exactly what to do every day', 'Access your plan from any device', 'Rest days clearly marked in your plan'].map(item => (
            <div key={item} style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
              <div key={item} style={{width:'18px', height:'18px', borderRadius:'50%', background:'var(--green-dim)', border:'0.5px solid rgba(62,207,142,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                <div style={{width:'6px', height:'6px', borderRadius:'50%', background:'var(--green)'}} />
              </div>
              <div style={{fontSize:'13px', color:'var(--text2)'}}>{item}</div>
            </div>
          ))}
          <Link to="/signup" style={{display:'block', marginTop:'20px', fontFamily:'var(--font-head)', fontSize:'13px', fontWeight:'700', color:'var(--text)', textDecoration:'none', padding:'12px', borderRadius:'12px', background:'var(--surface3)', border:'0.5px solid var(--border2)', textAlign:'center'}}>
            Join as a Client →
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div style={{borderTop:'0.5px solid var(--border)', padding:'60px 24px', textAlign:'center', background:'var(--surface)'}}>
        <div style={{fontFamily:'var(--font-head)', fontSize:'clamp(24px, 4vw, 36px)', fontWeight:'800', color:'var(--text)', letterSpacing:'-1px', marginBottom:'12px'}}>
          Ready to start training smarter?
        </div>
        <div style={{fontSize:'14px', color:'var(--text3)', marginBottom:'28px'}}>
          Join Strive today — free to get started.
        </div>
        <Link to="/signup" style={{fontFamily:'var(--font-head)', fontSize:'15px', fontWeight:'700', color:'#fff', textDecoration:'none', padding:'14px 32px', borderRadius:'14px', background:'var(--accent)', boxShadow:'0 6px 28px var(--accent-glow)', display:'inline-block'}}>
          Create your account →
        </Link>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}