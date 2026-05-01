import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export default function ClientDashboard() {
  const { profile, signOut } = useAuth()
  const [days, setDays] = useState([])
  const [activeDay, setActiveDay] = useState('')
  const [loading, setLoading] = useState(true)
  const [openEx, setOpenEx] = useState(null)
  const [tab, setTab] = useState('plan')
  const [newName, setNewName] = useState(profile?.full_name || '')
  const [newEmail, setNewEmail] = useState(profile?.email || '')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    setActiveDay(today)
    fetchPlan()
  }, [])

  const fetchPlan = async () => {
    setLoading(true)
    const { data: plans } = await supabase
      .from('workout_plans')
      .select('id')
      .eq('client_id', profile.id)
    if (!plans || plans.length === 0) { setLoading(false); return }
    const planId = plans[0].id
    const { data } = await supabase
      .from('workout_days')
      .select('*, exercises(*, video:video_id(*))')
      .eq('plan_id', planId)
    setDays(data || [])
    setLoading(false)
  }

  const saveSettings = async () => {
    setSaving(true)
    setSaveMsg('')
    await supabase.from('profiles').update({ full_name: newName, email: newEmail }).eq('id', profile.id)
    if (newPassword) await supabase.auth.updateUser({ password: newPassword })
    setSaveMsg('Saved successfully!')
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const activeDayData = days.find(d => d.day_of_week === activeDay)
  const exercises = activeDayData?.exercises?.sort((a, b) => a.order_index - b.order_index) || []
  const isRest = activeDayData?.is_rest_day
  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="app-layout">
      <div className="sidebar">
        <div className="sidebar-logo">Strive<span>.</span></div>
        <nav className="sidebar-nav">
          <div className={`nav-item ${tab === 'plan' ? 'active' : ''}`} onClick={() => setTab('plan')}>
            <div className="nav-dot" />My Plan
          </div>
          <div className={`nav-item ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
            <div className="nav-dot" />Settings
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">{initials(profile?.full_name)}</div>
          <div className="sidebar-footer-name">{profile?.full_name}</div>
          <button className="signout-btn" onClick={signOut}>Sign out</button>
        </div>
      </div>

      <div className="mobile-header">
        <div className="mobile-logo">Strive<span>.</span></div>
        <div className="avatar">{initials(profile?.full_name)}</div>
      </div>

      <main className="main-content">
        {tab === 'plan' && (
          <>
            <div style={{fontSize:'13px', color:'var(--text3)', marginBottom:'2px'}}>{greeting()},</div>
            <div className="page-title">{profile?.full_name?.split(' ')[0]} 💪</div>
            <div className="page-sub">Here's your workout plan for the week</div>

            <div style={{display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'22px'}}>
              {DAYS.map(d => {
                const dayData = days.find(day => day.day_of_week === d)
                const isRestDay = dayData?.is_rest_day
                const isToday = d === today
                const isActive = d === activeDay
                return (
                  <div key={d} onClick={() => { setActiveDay(d); setOpenEx(null) }}
                    style={{padding:'7px 13px', borderRadius:'20px', fontSize:'12px', cursor:'pointer',
                      fontFamily:'var(--font-head)', fontWeight:'700', letterSpacing:'0.3px', transition:'all 0.2s',
                      background: isActive ? 'var(--accent)' : isRestDay ? 'var(--surface3)' : 'var(--accent-dim)',
                      color: isActive ? '#fff' : isRestDay ? 'var(--text3)' : 'var(--accent)',
                      border: `0.5px solid ${isActive ? 'var(--accent)' : 'var(--border2)'}`,
                      boxShadow: isActive && isToday ? '0 4px 14px var(--accent-glow)' : 'none'}}>
                    {d.slice(0, 3)}{isToday ? ' ●' : ''}
                  </div>
                )
              })}
            </div>

            {loading ? (
              <div className="loading" style={{minHeight:'200px'}}><div className="spinner" /></div>
            ) : !activeDayData ? (
              <div className="card" style={{textAlign:'center', padding:'40px'}}>
                <div style={{fontSize:'32px', marginBottom:'12px'}}>📋</div>
                <div style={{fontFamily:'var(--font-head)', fontSize:'16px', fontWeight:'600', marginBottom:'6px'}}>No plan yet</div>
                <div style={{fontSize:'13px', color:'var(--text3)'}}>Your trainer hasn't added exercises for this day yet</div>
              </div>
            ) : isRest ? (
              <div className="card" style={{textAlign:'center', padding:'40px'}}>
                <div style={{fontSize:'40px', marginBottom:'12px'}}>😴</div>
                <div style={{fontFamily:'var(--font-head)', fontSize:'18px', fontWeight:'700', marginBottom:'6px'}}>Rest day</div>
                <div style={{fontSize:'13px', color:'var(--text3)'}}>Recovery is part of the process. Enjoy your rest.</div>
              </div>
            ) : (
              <>
                <div style={{fontSize:'10px', color:'var(--accent)', textTransform:'uppercase', letterSpacing:'2px', fontFamily:'var(--font-head)', fontWeight:'700', marginBottom:'14px'}}>
                  {activeDay} — {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                </div>
                {exercises.length === 0 ? (
                  <div className="card" style={{textAlign:'center', padding:'40px'}}>
                    <div style={{fontSize:'32px', marginBottom:'12px'}}>📋</div>
                    <div style={{fontFamily:'var(--font-head)', fontSize:'16px', fontWeight:'600', marginBottom:'6px'}}>No exercises yet</div>
                    <div style={{fontSize:'13px', color:'var(--text3)'}}>Your trainer hasn't added exercises for this day yet</div>
                  </div>
                ) : exercises.map(ex => (
                  <div key={ex.id} className="card" style={{marginBottom:'10px', border: openEx === ex.id ? '0.5px solid rgba(91,140,255,0.25)' : '0.5px solid var(--border)', transition:'border-color 0.2s'}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer'}}
                      onClick={() => setOpenEx(openEx === ex.id ? null : ex.id)}>
                      <div>
                        <div style={{fontFamily:'var(--font-head)', fontSize:'15px', fontWeight:'600'}}>{ex.name}</div>
                        <div style={{fontSize:'12px', color:'var(--text3)', marginTop:'3px'}}>
                          {[ex.sets && `${ex.sets} sets`, ex.reps && `${ex.reps} reps`, ex.rest_time && `${ex.rest_time} rest`].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <div style={{fontSize:'12px', color:'var(--accent)', transition:'transform 0.25s', transform: openEx === ex.id ? 'rotate(180deg)' : 'none'}}>▼</div>
                    </div>
                    {openEx === ex.id && (
                      <div style={{borderTop:'0.5px solid var(--border)', paddingTop:'14px', marginTop:'12px'}}>
                        {ex.video ? (
                          <video src={ex.video.video_url} controls playsInline
                            style={{width:'100%', borderRadius:'12px', background:'#000', marginBottom:'12px', maxHeight:'280px'}} />
                        ) : (
                          <div style={{background:'var(--surface3)', borderRadius:'12px', height:'80px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'12px'}}>
                            <div style={{fontSize:'13px', color:'var(--text3)'}}>No demo video yet</div>
                          </div>
                        )}
                        <div style={{display:'flex', gap:'8px', marginBottom: ex.notes ? '12px' : '0'}}>
                          {ex.sets && <div style={{flex:1, background:'var(--surface3)', borderRadius:'10px', padding:'8px', textAlign:'center'}}>
                            <div style={{fontFamily:'var(--font-head)', fontSize:'17px', fontWeight:'700', color:'var(--accent)'}}>{ex.sets}</div>
                            <div style={{fontSize:'9px', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginTop:'2px'}}>Sets</div>
                          </div>}
                          {ex.reps && <div style={{flex:1, background:'var(--surface3)', borderRadius:'10px', padding:'8px', textAlign:'center'}}>
                            <div style={{fontFamily:'var(--font-head)', fontSize:'17px', fontWeight:'700', color:'var(--accent)'}}>{ex.reps}</div>
                            <div style={{fontSize:'9px', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginTop:'2px'}}>Reps</div>
                          </div>}
                          {ex.rest_time && <div style={{flex:1, background:'var(--surface3)', borderRadius:'10px', padding:'8px', textAlign:'center'}}>
                            <div style={{fontFamily:'var(--font-head)', fontSize:'17px', fontWeight:'700', color:'var(--accent)'}}>{ex.rest_time}</div>
                            <div style={{fontSize:'9px', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginTop:'2px'}}>Rest</div>
                          </div>}
                        </div>
                        {ex.notes && <div style={{fontSize:'13px', color:'var(--text2)', lineHeight:'1.65', marginTop:'10px'}}>{ex.notes}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {tab === 'settings' && (
          <>
            <div className="page-title">Account Settings</div>
            <div className="page-sub">Update your personal info</div>
            <div className="card" style={{maxWidth:'440px'}}>
              {saveMsg && <div style={{background:'var(--green-dim)', border:'0.5px solid rgba(62,207,142,0.2)', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', color:'var(--green)', marginBottom:'14px'}}>{saveMsg}</div>}
              <div style={{marginBottom:'10px'}}>
                <span className="label">Full name</span>
                <input className="input" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div style={{marginBottom:'10px'}}>
                <span className="label">Email</span>
                <input className="input" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              </div>
              <div style={{marginBottom:'20px'}}>
                <span className="label">New password (leave blank to keep current)</span>
                <input className="input" type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={saveSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save changes →'}
              </button>
            </div>
          </>
        )}
      </main>

      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          <div className={`mobile-nav-item ${tab === 'plan' ? 'active' : ''}`} onClick={() => setTab('plan')}>
            <div className="mobile-nav-dot" />Plan
          </div>
          <div className={`mobile-nav-item ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
            <div className="mobile-nav-dot" />Settings
          </div>
          <div className="mobile-nav-item" onClick={signOut}>
            <div className="mobile-nav-dot" />Sign out
          </div>
        </div>
      </nav>
    </div>
  )
}