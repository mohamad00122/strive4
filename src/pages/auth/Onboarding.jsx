import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

export default function Onboarding() {
  const { profile, fetchProfile, user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPassword, setClientPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile?.onboarded) {
      if (profile.role === 'trainer') navigate('/trainer')
      else if (profile.role === 'client') navigate('/client')
      else if (profile.role === 'admin') navigate('/admin')
    }
  }, [profile])

  const completeOnboarding = async () => {
    await supabase.from('profiles').update({ onboarded: true }).eq('id', user.id)
    await fetchProfile(user.id)
  }

  const isTrainer = profile?.role === 'trainer'

  return (
    <div className="auth-page" style={{alignItems:'flex-start', paddingTop:'40px'}}>
      <div className="auth-box" style={{maxWidth:'440px'}}>
        <div className="auth-logo">Strive<span>.</span></div>

        <div style={{display:'flex', justifyContent:'center', gap:'6px', margin:'16px 0 24px'}}>
          {[1, 2].map(s => (
            <div key={s} style={{height:'5px', borderRadius:'3px',
              background: step >= s ? 'var(--accent)' : 'var(--surface3)',
              width: step >= s ? '28px' : '8px', transition:'all 0.3s'}} />
          ))}
        </div>

        {step === 1 && (
          <>
            <div style={{textAlign:'center', marginBottom:'24px'}}>
              <div style={{fontSize:'44px', marginBottom:'14px'}}>{isTrainer ? '🏋️' : '💪'}</div>
              <div style={{fontFamily:'var(--font-head)', fontSize:'20px', fontWeight:'700', marginBottom:'8px'}}>
                Welcome to Strive{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
              </div>
              <div style={{fontSize:'13px', color:'var(--text2)', lineHeight:'1.6'}}>
                {isTrainer
                  ? "You're set up as a Trainer. Build custom workout plans and attach demo videos for each of your clients."
                  : "You're set up as a Client. Your trainer will build your personalised workout plan with demo videos for every exercise."}
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => isTrainer ? setStep(2) : completeOnboarding()}>
              {isTrainer ? 'Next →' : 'Go to my dashboard →'}
            </button>
          </>
        )}

        {step === 2 && isTrainer && (
          <>
            <div style={{fontFamily:'var(--font-head)', fontSize:'18px', fontWeight:'700', marginBottom:'6px'}}>Add your first client</div>
            <div style={{fontSize:'13px', color:'var(--text3)', marginBottom:'20px'}}>They'll be instantly linked to your account</div>
            {error && <div className="error-msg">{error}</div>}
            <div style={{marginBottom:'10px'}}>
              <input className="input" placeholder="Client's full name" value={clientName} onChange={e => setClientName(e.target.value)} />
            </div>
            <div style={{marginBottom:'10px'}}>
              <input className="input" type="email" placeholder="Client's email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
            </div>
            <div style={{marginBottom:'20px'}}>
              <input className="input" type="password" placeholder="Temporary password" value={clientPassword} onChange={e => setClientPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={completeOnboarding} disabled={loading} style={{marginBottom:'10px'}}>
              {loading ? 'Creating...' : 'Get started →'}
            </button>
            <button className="btn btn-secondary" onClick={completeOnboarding}>
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  )
}