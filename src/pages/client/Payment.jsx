import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import Spinner from '../../components/Spinner'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export default function Payment() {
  const { profile, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCheckout = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          success_url: `${window.location.origin}/payment-success`,
          cancel_url: `${window.location.origin}/payment`,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <div style={{ width: '100%', maxWidth: 440, background: 'var(--bg1)', border: '1px solid var(--border2)', borderRadius: 16, padding: '32px 28px' }}>

        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5, textAlign: 'center', marginBottom: 4 }}>
          Strive<span style={{ color: 'var(--amber)' }}>.</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', marginBottom: 32 }}>
          Welcome, {profile?.full_name?.split(' ')[0]}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 800, color: 'var(--amber)', lineHeight: 1 }}>$200</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>per month</div>
        </div>

        <div style={{ marginBottom: 28 }}>
          {[
            '💪 Custom weekly workout plan',
            '🎬 Trainer demo videos on every exercise',
            '🥗 Personalised nutrition plan & macros',
            '📊 Progress tracking & personal bests',
            '💬 Direct messaging with your trainer',
            '🔒 Signed documents & health records',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 14 }}>{item.split(' ')[0]}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{item.split(' ').slice(1).join(' ')}</div>
            </div>
          ))}
        </div>

        {error && (
          <div className="error-msg" style={{ marginBottom: 14 }}>{error}</div>
        )}

        <button
          className="btn btn-amber"
          onClick={handleCheckout}
          disabled={loading}
          style={{ width: '100%', fontSize: 15, padding: '14px 0', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
        >
          {loading ? <Spinner size={20} /> : 'Start my training →'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'var(--text3)' }}>
          Secured by Stripe · Cancel anytime
        </div>

        <button
          onClick={signOut}
          style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: 'var(--text3)', fontSize: 12, cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
