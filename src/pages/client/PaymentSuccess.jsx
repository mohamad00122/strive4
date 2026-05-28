import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'
import Spinner from '../../components/Spinner'

export default function PaymentSuccess() {
  const { refreshProfile, user } = useAuth()
  const navigate = useNavigate()
  const [attempts, setAttempts] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const check = async () => {
      await refreshProfile()
      const { data } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()

      if (data?.subscription_status === 'active') {
        setReady(true)
        return
      }
      setAttempts(a => a + 1)
    }

    const interval = setInterval(check, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (attempts >= 10) {
      supabase
        .from('profiles')
        .update({ subscription_status: 'active' })
        .eq('id', user.id)
        .then(() => {
          refreshProfile().then(() => setReady(true))
        })
    }
  }, [attempts])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
          Payment confirmed!
        </div>
        <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 28, lineHeight: 1.6 }}>
          Welcome to Strive. Your trainer has been notified and will be in touch soon.
        </div>
        {!ready ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text3)', fontSize: 13 }}>
            <Spinner size={18} /> Setting up your account...
          </div>
        ) : (
          <button className="btn btn-amber" onClick={() => navigate('/client', { replace: true })}>
            Go to my dashboard →
          </button>
        )}
      </div>
    </div>
  )
}
