import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

export default function TrainerDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('clients')
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState(profile?.full_name || '')
  const [newEmail, setNewEmail] = useState(profile?.email || '')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => { fetchClients() }, [])

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*, client:client_id(id, full_name, email, created_at)')
      .eq('trainer_id', profile.id)
      .order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  const addClient = async () => {
  if (!name || !email || !password) return setError('Please fill in all fields.')
  setAdding(true)
  setError('')
  const { data, error: fnError } = await supabase.functions.invoke('create-client', {
    body: { email, password, fullName: name, trainerId: profile.id }
  })
  if (fnError || data?.error) {
    setError(data?.error || 'Could not create client. Please try again.')
    setAdding(false)
    return
  }
  setName(''); setEmail(''); setPassword(''); setShowAdd(false)
  fetchClients()
  setAdding(false)
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

  return (
    <div className="app-layout">
      <div className="sidebar">
        <div className="sidebar-logo">Strive<span>.</span></div>
        <nav className="sidebar-nav">
          <div className={`nav-item ${tab === 'clients' ? 'active' : ''}`} onClick={() => setTab('clients')}>
            <div className="nav-dot" />My Clients
          </div>
          <Link to="/trainer/videos" className="nav-item">
            <div className="nav-dot" />Video Library
          </Link>
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
        {tab === 'clients' && (
          <>
            <div className="page-title">My Clients</div>
            <div className="page-sub">{clients.length} client{clients.length !== 1 ? 's' : ''} linked to your account</div>

            <div className="add-btn" onClick={() => setShowAdd(!showAdd)}>
              {showAdd ? '✕ Cancel' : '+ Add new client'}
            </div>

            {showAdd && (
              <div className="card" style={{marginBottom:'16px'}}>
                <div style={{fontFamily:'var(--font-head)', fontSize:'15px', fontWeight:'700', marginBottom:'4px'}}>New client</div>
                <div style={{fontSize:'12px', color:'var(--text3)', marginBottom:'16px'}}>They'll be instantly linked to your account</div>
                {error && <div className="error-msg">{error}</div>}
                <div style={{marginBottom:'10px'}}>
                  <input className="input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div style={{marginBottom:'10px'}}>
                  <input className="input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div style={{marginBottom:'16px'}}>
                  <input className="input" type="password" placeholder="Temporary password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={addClient} disabled={adding}>
                  {adding ? 'Creating...' : 'Create client →'}
                </button>
              </div>
            )}

            {loading ? (
              <div className="loading" style={{minHeight:'200px'}}><div className="spinner" /></div>
            ) : clients.length === 0 ? (
              <div className="card" style={{textAlign:'center', padding:'40px'}}>
                <div style={{fontSize:'32px', marginBottom:'12px'}}>👥</div>
                <div style={{fontFamily:'var(--font-head)', fontSize:'16px', fontWeight:'600', marginBottom:'6px'}}>No clients yet</div>
                <div style={{fontSize:'13px', color:'var(--text3)'}}>Add your first client to get started</div>
              </div>
            ) : clients.map(c => (
              <div key={c.id} className="card" style={{display:'flex', alignItems:'center', gap:'13px', marginBottom:'9px', cursor:'pointer'}}
                onClick={() => navigate(`/trainer/client/${c.client.id}`)}>
                <div className="avatar">{initials(c.client?.full_name)}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:'var(--font-head)', fontSize:'14px', fontWeight:'600'}}>{c.client?.full_name}</div>
                  <div style={{fontSize:'12px', color:'var(--text3)', marginTop:'3px'}}>{c.client?.email}</div>
                </div>
                <div className={`badge ${c.status === 'active' ? 'badge-active' : 'badge-pending'}`}>
                  {c.status}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'settings' && (
          <>
            <div className="page-title">Settings</div>
            <div className="page-sub">Update your account info</div>
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
          <div className={`mobile-nav-item ${tab === 'clients' ? 'active' : ''}`} onClick={() => setTab('clients')}>
            <div className="mobile-nav-dot" />Clients
          </div>
          <Link to="/trainer/videos" className="mobile-nav-item">
            <div className="mobile-nav-dot" />Videos
          </Link>
          <div className={`mobile-nav-item ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
            <div className="mobile-nav-dot" />Settings
          </div>
        </div>
      </nav>
    </div>
  )
}