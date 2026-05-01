import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

export default function AdminDashboard() {
  const { profile, signOut } = useAuth()
  const [stats, setStats] = useState({ trainers: 0, clients: 0, videos: 0 })
  const [trainers, setTrainers] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminRole, setAdminRole] = useState('trainer')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [success, setSuccess] = useState('')
  const [newName, setNewName] = useState(profile?.full_name || '')
  const [newEmail, setNewEmail] = useState(profile?.email || '')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const { data: allProfiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    const trainersData = allProfiles?.filter(p => p.role === 'trainer') || []
    const clientsData = allProfiles?.filter(p => p.role === 'client') || []
    const { count: videoCount } = await supabase.from('videos').select('*', { count: 'exact', head: true })
    setTrainers(trainersData)
    setClients(clientsData)
    setStats({ trainers: trainersData.length, clients: clientsData.length, videos: videoCount || 0 })
    setLoading(false)
  }

  const createAccount = async () => {
    if (!name || !email || !password) return setError('Please fill in all fields.')
    setAdding(true); setError(''); setSuccess('')
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, role: adminRole } }
    })
    if (err) { setError(err.message); setAdding(false); return }
    setSuccess(`${adminRole.charAt(0).toUpperCase() + adminRole.slice(1)} account created successfully.`)
    setName(''); setEmail(''); setPassword('')
    fetchAll()
    setAdding(false)
  }

  const deactivate = async (id) => {
    if (!confirm('Deactivate this account?')) return
    await supabase.from('profiles').update({ onboarded: false }).eq('id', id)
    fetchAll()
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

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
  const tabs = ['overview', 'trainers', 'clients', 'add account', 'settings']

  return (
    <div className="app-layout">
      <div className="sidebar">
        <div className="sidebar-logo">Strive<span>.</span></div>
        <nav className="sidebar-nav">
          {tabs.map(t => (
            <div key={t} className={`nav-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              <div className="nav-dot" />{t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">{initials(profile?.full_name)}</div>
          <div className="sidebar-footer-name">Admin</div>
          <button className="signout-btn" onClick={signOut}>Sign out</button>
        </div>
      </div>

      <div className="mobile-header">
        <div className="mobile-logo">Strive<span>.</span></div>
        <div className="avatar">{initials(profile?.full_name)}</div>
      </div>

      <main className="main-content">
        {tab === 'overview' && (
          <>
            <div className="page-title">Platform Overview</div>
            <div className="page-sub">Everything happening on Strive</div>
            {loading ? <div className="loading" style={{minHeight:'200px'}}><div className="spinner" /></div> : (
              <>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:'12px', marginBottom:'28px'}}>
                  {[['Trainers', stats.trainers, '🏋️'], ['Clients', stats.clients, '💪'], ['Videos', stats.videos, '🎬']].map(([label, val, icon]) => (
                    <div key={label} className="card" style={{textAlign:'center', padding:'20px'}}>
                      <div style={{fontSize:'24px', marginBottom:'8px'}}>{icon}</div>
                      <div style={{fontFamily:'var(--font-head)', fontSize:'28px', fontWeight:'700', color:'var(--accent)'}}>{val}</div>
                      <div style={{fontSize:'12px', color:'var(--text3)', marginTop:'4px'}}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontFamily:'var(--font-head)', fontSize:'16px', fontWeight:'700', marginBottom:'12px'}}>Recent trainers</div>
                {trainers.length === 0 ? (
                  <div className="card" style={{textAlign:'center', padding:'30px'}}>
                    <div style={{fontSize:'13px', color:'var(--text3)'}}>No trainers yet</div>
                  </div>
                ) : trainers.slice(0, 3).map(t => (
                  <div key={t.id} className="card" style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px'}}>
                    <div className="avatar">{initials(t.full_name)}</div>
                    <div>
                      <div style={{fontFamily:'var(--font-head)', fontSize:'14px', fontWeight:'600'}}>{t.full_name}</div>
                      <div style={{fontSize:'12px', color:'var(--text3)'}}>{t.email}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {tab === 'trainers' && (
          <>
            <div className="page-title">Trainers</div>
            <div className="page-sub">{stats.trainers} trainer{stats.trainers !== 1 ? 's' : ''} on the platform</div>
            {trainers.length === 0 ? (
              <div className="card" style={{textAlign:'center', padding:'40px'}}>
                <div style={{fontSize:'32px', marginBottom:'12px'}}>🏋️</div>
                <div style={{fontFamily:'var(--font-head)', fontSize:'16px', fontWeight:'600', marginBottom:'6px'}}>No trainers yet</div>
                <div style={{fontSize:'13px', color:'var(--text3)'}}>Add a trainer from the Add Account tab</div>
              </div>
            ) : trainers.map(t => (
              <div key={t.id} className="card" style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px'}}>
                <div className="avatar">{initials(t.full_name)}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:'var(--font-head)', fontSize:'14px', fontWeight:'600'}}>{t.full_name}</div>
                  <div style={{fontSize:'12px', color:'var(--text3)'}}>{t.email}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deactivate(t.id)}>Deactivate</button>
              </div>
            ))}
          </>
        )}

        {tab === 'clients' && (
          <>
            <div className="page-title">Clients</div>
            <div className="page-sub">{stats.clients} client{stats.clients !== 1 ? 's' : ''} on the platform</div>
            {clients.length === 0 ? (
              <div className="card" style={{textAlign:'center', padding:'40px'}}>
                <div style={{fontSize:'32px', marginBottom:'12px'}}>💪</div>
                <div style={{fontFamily:'var(--font-head)', fontSize:'16px', fontWeight:'600', marginBottom:'6px'}}>No clients yet</div>
                <div style={{fontSize:'13px', color:'var(--text3)'}}>Clients will appear here once trainers add them</div>
              </div>
            ) : clients.map(c => (
              <div key={c.id} className="card" style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px'}}>
                <div className="avatar">{initials(c.full_name)}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:'var(--font-head)', fontSize:'14px', fontWeight:'600'}}>{c.full_name}</div>
                  <div style={{fontSize:'12px', color:'var(--text3)'}}>{c.email}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deactivate(c.id)}>Deactivate</button>
              </div>
            ))}
          </>
        )}

        {tab === 'add account' && (
          <>
            <div className="page-title">Add Account</div>
            <div className="page-sub">Create a new trainer, client, or admin account</div>
            <div className="card" style={{maxWidth:'440px'}}>
              {error && <div className="error-msg">{error}</div>}
              {success && <div style={{background:'var(--green-dim)', border:'0.5px solid rgba(62,207,142,0.2)', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', color:'var(--green)', marginBottom:'14px'}}>{success}</div>}
              <div style={{marginBottom:'10px'}}>
                <span className="label">Role</span>
                <select className="input" value={adminRole} onChange={e => setAdminRole(e.target.value)}>
                  <option value="trainer">Trainer</option>
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{marginBottom:'10px'}}>
                <span className="label">Full name</span>
                <input className="input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div style={{marginBottom:'10px'}}>
                <span className="label">Email</span>
                <input className="input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div style={{marginBottom:'20px'}}>
                <span className="label">Password</span>
                <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={createAccount} disabled={adding}>
                {adding ? 'Creating...' : 'Create account →'}
              </button>
            </div>
          </>
        )}

        {tab === 'settings' && (
          <>
            <div className="page-title">Settings</div>
            <div className="page-sub">Update your admin account info</div>
            <div className="card" style={{maxWidth:'440px', marginBottom:'16px'}}>
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
            <div className="card" style={{maxWidth:'440px'}}>
              <div style={{fontFamily:'var(--font-head)', fontSize:'15px', fontWeight:'700', marginBottom:'4px'}}>Sign out</div>
              <div style={{fontSize:'13px', color:'var(--text3)', marginBottom:'16px'}}>You'll be redirected to the login page</div>
              <button className="btn btn-danger" style={{width:'100%'}} onClick={signOut}>Sign out</button>
            </div>
          </>
        )}
      </main>

      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {tabs.map(t => (
            <div key={t} className={`mobile-nav-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              <div className="mobile-nav-dot" />{t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>
      </nav>
    </div>
  )
}