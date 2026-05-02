import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function SignUp() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async () => {
    if (!fullName || !email || !password) return setError('Please fill in all fields.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: 'trainer' } }
    })
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/onboarding')
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">Strive<span>.</span></div>
        <div className="auth-tagline">Join as a Personal Trainer</div>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-group">
          <span className="label">Full name</span>
          <input className="input" placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>
        <div className="form-group">
          <span className="label">Email</span>
          <input className="input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group" style={{marginBottom:'20px'}}>
          <span className="label">Password</span>
          <input className="input" type="password" placeholder="Create password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSignUp()} />
        </div>
        <button className="btn btn-primary" onClick={handleSignUp} disabled={loading}>
          {loading ? 'Creating account...' : 'Create Trainer Account →'}
        </button>
        <div className="auth-link">Already have an account? <Link to="/login">Log in</Link></div>
        <div style={{marginTop:'16px', padding:'12px', background:'var(--surface3)', borderRadius:'10px', fontSize:'12px', color:'var(--text3)', textAlign:'center', lineHeight:'1.5'}}>
          Are you a client? Ask your trainer to create your account — they'll send you your login details.
        </div>
      </div>
    </div>
  )
}