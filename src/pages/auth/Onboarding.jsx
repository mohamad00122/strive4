import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

export default function Onboarding() {
  const { profile, fetchProfile, user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Client intake form state
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [fitnessGoal, setFitnessGoal] = useState('')
  const [heartCondition, setHeartCondition] = useState(null)
  const [chestPainActivity, setChestPainActivity] = useState(null)
  const [chestPainRest, setChestPainRest] = useState(null)
  const [dizziness, setDizziness] = useState(null)
  const [boneJoint, setBoneJoint] = useState(null)
  const [medication, setMedication] = useState(null)
  const [otherReason, setOtherReason] = useState(null)
  const [otherDetails, setOtherDetails] = useState('')
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    if (profile?.onboarded) {
      if (profile.role === 'trainer') navigate('/trainer')
      else if (profile.role === 'client') navigate('/client')
      else if (profile.role === 'admin') navigate('/admin')
    }
  }, [profile])

  const completeOnboarding = async () => {
    setLoading(true)
    await supabase.from('profiles').update({ onboarded: true }).eq('id', user.id)
    await fetchProfile(user.id)
    setLoading(false)
  }

  const submitIntakeForm = async () => {
    if (!agreed) return setError('Please confirm that your answers are accurate.')
    if (!fitnessGoal) return setError('Please select your fitness goal.')
    setLoading(true)
    setError('')
    await supabase.from('intake_forms').upsert({
      client_id: user.id,
      age: age ? parseInt(age) : null,
      weight, height, fitness_goal: fitnessGoal,
      heart_condition: heartCondition || false,
      chest_pain_activity: chestPainActivity || false,
      chest_pain_rest: chestPainRest || false,
      dizziness: dizziness || false,
      bone_joint_problem: boneJoint || false,
      prescription_medication: medication || false,
      other_reason: otherReason || false,
      other_reason_details: otherDetails,
      agreed
    })
    await completeOnboarding()
    setLoading(false)
  }

  const isTrainer = profile?.role === 'trainer'
  const isClient = profile?.role === 'client'

  const YesNo = ({ label, value, onChange }) => (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'12px 0', borderBottom:'0.5px solid var(--border)'}}>
      <div style={{fontSize:'13px', color:'var(--text2)', flex:1, paddingRight:'16px', lineHeight:'1.5'}}>{label}</div>
      <div style={{display:'flex', gap:'8px', flexShrink:0}}>
        <div onClick={() => onChange(true)}
          style={{padding:'5px 14px', borderRadius:'8px', fontSize:'12px', cursor:'pointer', fontFamily:'var(--font-head)', fontWeight:'600',
            background: value === true ? 'var(--red-dim)' : 'var(--surface3)',
            color: value === true ? 'var(--red)' : 'var(--text3)',
            border: `0.5px solid ${value === true ? 'rgba(255,91,91,0.3)' : 'var(--border2)'}`,
            transition:'all 0.2s'}}>Yes</div>
        <div onClick={() => onChange(false)}
          style={{padding:'5px 14px', borderRadius:'8px', fontSize:'12px', cursor:'pointer', fontFamily:'var(--font-head)', fontWeight:'600',
            background: value === false ? 'var(--accent-dim)' : 'var(--surface3)',
            color: value === false ? 'var(--accent)' : 'var(--text3)',
            border: `0.5px solid ${value === false ? 'rgba(91,140,255,0.3)' : 'var(--border2)'}`,
            transition:'all 0.2s'}}>No</div>
      </div>
    </div>
  )

  return (
    <div className="auth-page" style={{alignItems:'flex-start', paddingTop:'32px', paddingBottom:'40px'}}>
      <div className="auth-box" style={{maxWidth:'480px'}}>
        <div className="auth-logo">Strive<span>.</span></div>

        {/* TRAINER — just welcome and go */}
        {isTrainer && (
          <div style={{textAlign:'center', marginTop:'16px'}}>
            <div style={{fontSize:'48px', marginBottom:'16px'}}>🏋️</div>
            <div style={{fontFamily:'var(--font-head)', fontSize:'20px', fontWeight:'700', marginBottom:'10px'}}>
              Welcome to Strive{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
            </div>
            <div style={{fontSize:'13px', color:'var(--text2)', lineHeight:'1.7', marginBottom:'28px'}}>
              You're all set as a Trainer. Head to your dashboard to add your first client and start building their workout plan.
            </div>
            <button className="btn btn-primary" onClick={completeOnboarding} disabled={loading}>
              {loading ? 'Loading...' : 'Go to my dashboard →'}
            </button>
          </div>
        )}

        {/* CLIENT INTAKE FORM */}
        {isClient && (
          <>
            <div style={{textAlign:'center', margin:'12px 0 24px'}}>
              <div style={{fontSize:'36px', marginBottom:'10px'}}>📋</div>
              <div style={{fontFamily:'var(--font-head)', fontSize:'18px', fontWeight:'700', marginBottom:'6px'}}>Health & Goals Form</div>
              <div style={{fontSize:'12px', color:'var(--text3)', lineHeight:'1.6'}}>Please fill this out before your trainer builds your plan. Your answers are kept private.</div>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <div style={{fontFamily:'var(--font-head)', fontSize:'11px', fontWeight:'700', color:'var(--accent)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'12px'}}>Basic Info</div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'10px'}}>
              <div>
                <span className="label">Age</span>
                <input className="input" placeholder="e.g. 25" value={age} onChange={e => setAge(e.target.value)} />
              </div>
              <div>
                <span className="label">Weight</span>
                <input className="input" placeholder="e.g. 75kg" value={weight} onChange={e => setWeight(e.target.value)} />
              </div>
              <div>
                <span className="label">Height</span>
                <input className="input" placeholder="e.g. 5'10" value={height} onChange={e => setHeight(e.target.value)} />
              </div>
            </div>

            <div style={{marginBottom:'20px'}}>
              <span className="label">Fitness Goal</span>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                {['Lose Weight', 'Build Muscle', 'Improve Endurance', 'General Fitness'].map(goal => (
                  <div key={goal} onClick={() => setFitnessGoal(goal)}
                    style={{padding:'10px', borderRadius:'10px', fontSize:'12px', cursor:'pointer', textAlign:'center',
                      fontFamily:'var(--font-head)', fontWeight:'600',
                      background: fitnessGoal === goal ? 'var(--accent-dim)' : 'var(--surface2)',
                      color: fitnessGoal === goal ? 'var(--accent)' : 'var(--text3)',
                      border: `1.5px solid ${fitnessGoal === goal ? 'var(--accent)' : 'var(--border)'}`,
                      transition:'all 0.2s'}}>
                    {goal}
                  </div>
                ))}
              </div>
            </div>

            <div style={{fontFamily:'var(--font-head)', fontSize:'11px', fontWeight:'700', color:'var(--accent)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'4px'}}>PAR-Q Health Questions</div>
            <div style={{fontSize:'11px', color:'var(--text3)', marginBottom:'12px'}}>Please answer honestly. If you answer YES to any question, consult your doctor before starting.</div>

            <div className="card" style={{marginBottom:'20px', padding:'0 16px'}}>
              <YesNo label="Has your doctor ever said you have a heart condition and that you should only do physical activity recommended by a doctor?" value={heartCondition} onChange={setHeartCondition} />
              <YesNo label="Do you feel pain in your chest when you do physical activity?" value={chestPainActivity} onChange={setChestPainActivity} />
              <YesNo label="In the past month, have you had chest pain when you were not doing physical activity?" value={chestPainRest} onChange={setChestPainRest} />
              <YesNo label="Do you lose your balance because of dizziness or do you ever lose consciousness?" value={dizziness} onChange={setDizziness} />
              <YesNo label="Do you have a bone or joint problem that could be made worse by physical activity?" value={boneJoint} onChange={setBoneJoint} />
              <YesNo label="Are you currently taking prescription medication?" value={medication} onChange={setMedication} />
              <YesNo label="Do you know of any other reason why you should not do physical activity?" value={otherReason} onChange={setOtherReason} />
            </div>

            {otherReason && (
              <div style={{marginBottom:'16px'}}>
                <span className="label">Please describe</span>
                <input className="input" placeholder="Describe your reason..." value={otherDetails} onChange={e => setOtherDetails(e.target.value)} />
              </div>
            )}

            <div onClick={() => setAgreed(!agreed)}
              style={{display:'flex', alignItems:'flex-start', gap:'12px', padding:'14px', background:'var(--surface2)', borderRadius:'12px', border:`1.5px solid ${agreed ? 'var(--accent)' : 'var(--border)'}`, cursor:'pointer', marginBottom:'20px', transition:'all 0.2s'}}>
              <div style={{width:'20px', height:'20px', borderRadius:'6px', border:`2px solid ${agreed ? 'var(--accent)' : 'var(--border2)'}`, background: agreed ? 'var(--accent)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s'}}>
                {agreed && <div style={{color:'#fff', fontSize:'12px', fontWeight:'700'}}>✓</div>}
              </div>
              <div style={{fontSize:'12px', color:'var(--text2)', lineHeight:'1.6'}}>
                I confirm that I have read and answered all questions honestly and to the best of my knowledge. I understand that this information will be used by my trainer to design a safe and effective program.
              </div>
            </div>

            <button className="btn btn-primary" onClick={submitIntakeForm} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit & go to my plan →'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}