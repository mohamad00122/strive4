import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

export default function TrainerDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)

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
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, role: 'client' } }
    })
    if (signUpError) { setError(signUpError.message); setAdding(false); return }
    await supabase.from('profiles').upsert({ id: user.id, email, full_name: name, role: 'client', onboarded: true })
    await supabase.from('clients').insert({ trainer_id: profile.id, client_id: user.id })
    setName(''); setEmail(''); setPassword(''); setShowAdd(false)
    fetchClients()
    setAdding(false)
  }

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '??'

  return (
    <div className="app-layout">
      <div className="sidebar">
        <div className="sidebar-logo">Strive<span>.</span></div>
        <nav className="sidebar-nav">
          <div className="nav-item active"><div className="nav-dot" />My Clients</div>
          <Link to="/trainer/videos" className="nav-item"><div className="nav-dot" />Video Library</Link>
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
            <div className="form-group" style={{marginBottom:'10px'}}>
              <input className="input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group" style={{marginBottom:'10px'}}>
              <input className="input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group" style={{marginBottom:'16px'}}>
              <input className="input" type="password" placeholder="Temporary password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={addClient} disabled={adding}>
              {adding ? 'Creating...' : 'Create client →'}
            </button>
          </div>
        )}

        {loading ? <div className="loading" style={{minHeight:'200px'}}><div className="spinner" /></div> : (
          clients.length === 0 ? (
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
          ))
        )}
      </main>

      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          <div className="mobile-nav-item active">
            <div className="mobile-nav-dot" />Clients
          </div>
          <Link to="/trainer/videos" className="mobile-nav-item">
            <div className="mobile-nav-dot" />Videos
          </Link>
          <div className="mobile-nav-item" onClick={signOut}>
            <div className="mobile-nav-dot" />Sign out
          </div>
        </div>
      </nav>
    </div>
  )
}