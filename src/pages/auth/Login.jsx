import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) return setError('Please fill in all fields.')
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/')
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">Strive<span>.</span></div>
        <div className="auth-tagline">Welcome back</div>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-group">
          <input className="input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group" style={{marginBottom: '20px'}}>
          <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>
        <button className="btn btn-primary" onClick={handleLogin} disabled={loading}>
          {loading ? 'Logging in...' : 'Log In →'}
        </button>
        <div className="auth-link">Don't have an account? <Link to="/signup">Sign up</Link></div>
      </div>
    </div>
  )
}