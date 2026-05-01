import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function SignUp() {
  const navigate = useNavigate()
  const [role, setRole] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async () => {
    if (!role) return setError('Please select whether you are a Trainer or Client.')
    if (!fullName || !email || !password) return setError('Please fill in all fields.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } }
    })
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/onboarding')
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">Strive<span>.</span></div>
        <div className="auth-tagline">Online personal training, elevated</div>
        {error && <div className="error-msg">{error}</div>}
        <span className="label">I am a...</span>
        <div className="role-grid">
          <div className={`role-card ${role === 'trainer' ? 'selected' : ''}`} onClick={() => setRole('trainer')}>
            <div className="icon">🏋️</div>
            <div className="name">Trainer</div>
            <div className="hint">Build plans for my clients</div>
          </div>
          <div className={`role-card ${role === 'client' ? 'selected' : ''}`} onClick={() => setRole('client')}>
            <div className="icon">💪</div>
            <div className="name">Client</div>
            <div className="hint">View my workout plan</div>
          </div>
        </div>
        <div className="form-group">
          <input className="input" placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>
        <div className="form-group">
          <input className="input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group" style={{marginBottom: '20px'}}>
          <input className="input" type="password" placeholder="Create password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleSignUp} disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account →'}
        </button>
        <div className="auth-link">Already have an account? <Link to="/login">Log in</Link></div>
      </div>
    </div>
  )
}