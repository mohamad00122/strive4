import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import Spinner from '../../components/Spinner'

const PAR_Q = [
  { key: 'heart_condition', icon: '❤️', question: 'Has your doctor ever said you have a heart condition and that you should only do physical activity recommended by a doctor?' },
  { key: 'chest_pain_activity', icon: '🏃', question: 'Do you feel pain in your chest when you do physical activity?' },
  { key: 'chest_pain_rest', icon: '🫁', question: 'In the past month, have you had chest pain when you were not doing physical activity?' },
  { key: 'dizziness', icon: '💫', question: 'Do you lose your balance because of dizziness or do you ever lose consciousness?' },
  { key: 'bone_joint_problem', icon: '🦴', question: 'Do you have a bone or joint problem that could be made worse by physical activity?' },
  { key: 'prescription_medication', icon: '💊', question: 'Are you currently taking prescription medication?' },
  { key: 'other_reason', icon: '⚠️', question: 'Do you know of any other reason why you should not do physical activity?' },
]

const GOALS = [
  { value: 'build_muscle', label: 'Build Muscle', icon: '💪' },
  { value: 'lose_weight', label: 'Lose Weight', icon: '🔥' },
  { value: 'endurance', label: 'Endurance', icon: '🏃' },
  { value: 'general_fitness', label: 'General Fitness', icon: '⭐' },
]

const WAIVER_TEXT = `LIABILITY WAIVER AND RELEASE OF CLAIMS

By signing this document, you acknowledge and agree to the following terms and conditions:

1. ASSUMPTION OF RISK: You understand that participation in physical fitness activities involves inherent risks, including but not limited to physical injury, muscular strains, sprains, fractures, or in extreme cases, heart attack or death. You voluntarily assume all such risks associated with participation in exercise programs.

2. MEDICAL CLEARANCE: You represent that you are in good physical condition and have no medical conditions that would prevent or limit your participation in a personal training program. You have completed the PAR-Q questionnaire truthfully and to the best of your knowledge.

3. RELEASE OF LIABILITY: You hereby release, waive, discharge, and covenant not to sue your personal trainer, the training platform, their officers, agents, employees, or successors from any and all liability, claims, demands, actions, or causes of action whatsoever arising from personal injury, property damage, or death resulting from your participation in the training program.

4. INDEMNIFICATION: You agree to indemnify and hold harmless your personal trainer and the training platform against any loss, damage, or costs, including reasonable attorneys' fees, incurred in connection with any claims made by you or on your behalf arising out of your participation in the training program.

5. MEDICAL EMERGENCY: In the event of a medical emergency arising from your participation in the program, you authorise your personal trainer to seek emergency medical treatment on your behalf and agree to bear all costs associated with such treatment.

6. PHOTOGRAPHY/RECORDING: You consent to being photographed or recorded during training sessions for professional purposes, with the understanding that such material will be used only in accordance with applicable privacy laws.

7. PROGRAM MODIFICATIONS: You understand that the training program may be modified from time to time at the discretion of your personal trainer, and that such modifications are made in your best interest.

8. ENTIRE AGREEMENT: This document constitutes the entire agreement between you and your personal trainer regarding liability and supersedes all prior agreements or understandings.

By signing below, you confirm that you have read, understood, and agree to all terms above.`

const CONTRACT_TEXT = `PERSONAL TRAINING SERVICES AGREEMENT

This Personal Training Services Agreement ("Agreement") is entered into between you ("Client") and your assigned personal trainer ("Trainer") through the Strive platform.

1. SERVICES: Trainer agrees to provide personalised fitness coaching services including custom workout program design, exercise instruction, progress monitoring, nutritional guidance, and ongoing support.

2. CLIENT RESPONSIBILITIES: Client agrees to:
   - Follow the prescribed workout program to the best of their ability
   - Communicate openly about physical limitations, discomfort, or health changes
   - Attend scheduled sessions punctually or provide adequate notice of cancellation
   - Complete all required intake forms and health questionnaires honestly
   - Respect the trainer's professional expertise and recommendations

3. COMMITMENT: Client understands that visible results require consistent effort over time. Both parties agree to maintain professional communication and mutual respect throughout the training relationship.

4. CONFIDENTIALITY: Trainer agrees to keep all client health information, personal details, and progress data strictly confidential and will not share this information with third parties without express written consent.

5. PAYMENT AND CANCELLATION: Specific pricing, payment schedules, and cancellation policies will be communicated separately and form part of this agreement by reference.

6. PROGRAMME ADJUSTMENTS: Trainer reserves the right to modify the training programme based on client progress, feedback, and evolving fitness goals. Any significant changes will be communicated in advance.

7. TERMINATION: Either party may terminate this agreement with reasonable written notice. Upon termination, Client's access to the Strive platform for this training relationship will be managed accordingly.

8. GOVERNING LAW: This Agreement shall be governed by and construed in accordance with applicable law.

By signing below, Client confirms they have read, understood, and agree to all terms of this Training Contract.`

export default function Onboarding() {
  const { profile, user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [intakeId, setIntakeId] = useState(null)

  // Step 1
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [fitnessGoal, setFitnessGoal] = useState('')
  const [goalWeightLbs, setGoalWeightLbs] = useState('')
  const [unitPref, setUnitPref] = useState('lbs')

  // Step 2 — PAR-Q
  const [parqAnswers, setParqAnswers] = useState({})
  const [parqIndex, setParqIndex] = useState(0)
  const [otherDetails, setOtherDetails] = useState('')
  const [parqAgreed, setParqAgreed] = useState(false)
  const [showParqSummary, setShowParqSummary] = useState(false)

  // Step 3 — Waiver
  const [waiverSig, setWaiverSig] = useState('')

  // Step 4 — Contract
  const [contractSig, setContractSig] = useState('')

  useEffect(() => {
    if (profile?.onboarded) {
      if (profile.role === 'trainer') navigate('/trainer')
      else if (profile.role === 'client') navigate('/client')
      else if (profile.role === 'admin') navigate('/admin')
    }
    if (profile?.role === 'admin') {
      completeOnboarding()
    }
  }, [profile])

  const completeOnboarding = async () => {
    setLoading(true)
    await supabase.from('profiles').update({ onboarded: true }).eq('id', user.id)
    await refreshProfile()
    setLoading(false)
  }

  // TRAINER flow
  if (profile?.role === 'trainer') {
    return (
      <div className="auth-page">
        <div className="auth-box" style={{ textAlign: 'center' }}>
          <div className="auth-logo">Strive<span>.</span></div>
          <div style={{ fontSize: 48, marginBottom: 16, marginTop: 16 }}>🏋️</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 10 }}>
            Welcome to Strive{profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 28 }}>
            You're all set as a Trainer. Head to your dashboard to add your first client and start building their workout plan.
          </div>
          <button className="btn btn-amber" onClick={completeOnboarding} disabled={loading}>
            {loading ? <Spinner size={18} /> : 'Go to my dashboard →'}
          </button>
        </div>
      </div>
    )
  }

  // CLIENT flow
  const totalSteps = 4
  const StepIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i + 1 <= step ? 'var(--amber)' : 'var(--bg3)', transition: 'background 0.3s' }} />
      ))}
    </div>
  )

  // STEP 1: Profile
  const saveStep1 = async () => {
    if (!fitnessGoal) return setError('Please select a fitness goal.')
    if (!weight || !height || !age) return setError('Please fill in age, weight, and height.')
    setLoading(true)
    setError('')
    const { data, error } = await supabase.from('intake_forms').upsert({
      client_id: user.id,
      age: parseInt(age) || null,
      weight,
      height,
      fitness_goal: fitnessGoal,
      goal_weight_lbs: goalWeightLbs ? parseFloat(goalWeightLbs) : null,
    }).select().single()
    if (error) { setError(error.message); setLoading(false); return }
    if (data) setIntakeId(data.id)
    await supabase.from('profiles').update({ unit_preference: unitPref }).eq('id', user.id)
    setLoading(false)
    setStep(2)
    setParqIndex(0)
    setShowParqSummary(false)
  }

  // STEP 2: PAR-Q
  const handleParqAnswer = (val) => {
    const key = PAR_Q[parqIndex].key
    setParqAnswers(prev => ({ ...prev, [key]: val }))
    if (parqIndex < PAR_Q.length - 1) {
      setTimeout(() => setParqIndex(i => i + 1), 300)
    } else {
      setTimeout(() => setShowParqSummary(true), 300)
    }
  }

  const saveStep2 = async () => {
    if (!parqAgreed) return setError('Please confirm your answers are accurate.')
    setLoading(true)
    setError('')
    const updateData = { ...parqAnswers, agreed: parqAgreed, other_reason_details: otherDetails }
    await supabase.from('intake_forms').update(updateData).eq('client_id', user.id)
    setLoading(false)
    setStep(3)
  }

  // STEP 3: Waiver
  const saveStep3 = async () => {
    if (!waiverSig.trim()) return setError('Please enter your signature.')
    setLoading(true)
    setError('')
    await supabase.from('signed_documents').insert({
      client_id: user.id,
      document_type: 'liability_waiver',
      signed_name: waiverSig.trim(),
    })
    setLoading(false)
    setStep(4)
  }

  // STEP 4: Contract
  const saveStep4 = async () => {
    if (!contractSig.trim()) return setError('Please enter your signature.')
    setLoading(true)
    setError('')
    await supabase.from('signed_documents').insert({
      client_id: user.id,
      document_type: 'training_contract',
      signed_name: contractSig.trim(),
    })
    await supabase.from('profiles').update({ onboarded: true }).eq('id', user.id)
    await refreshProfile()
    setLoading(false)
  }

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: 32, paddingBottom: 48 }}>
      <div className="auth-box" style={{ maxWidth: 500 }}>
        <div className="auth-logo" style={{ marginBottom: 20 }}>Strive<span>.</span></div>
        <StepIndicator />

        {error && <div className="error-msg">{error}</div>}

        {/* STEP 1: Profile */}
        {step === 1 && (
          <>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Your Profile</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>Step 1 of 4 — Tell us about yourself</div>

            <div style={{ display: 'flex', gap: 8, background: 'var(--bg2)', borderRadius: 9, padding: 4, marginBottom: 16 }}>
              {['lbs', 'kg'].map(u => (
                <button key={u} onClick={() => setUnitPref(u)}
                  style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: unitPref === u ? 'var(--amber)' : 'transparent', color: unitPref === u ? '#000' : 'var(--text3)', transition: 'all 0.15s' }}>
                  {u}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div>
                <span className="label">Age</span>
                <input className="input" placeholder="25" type="number" value={age} onChange={e => setAge(e.target.value)} />
              </div>
              <div>
                <span className="label">Weight ({unitPref})</span>
                <input className="input" placeholder={unitPref === 'lbs' ? '180' : '82'} value={weight} onChange={e => setWeight(e.target.value)} />
              </div>
              <div>
                <span className="label">Height</span>
                <input className="input" placeholder="5'10&quot;" value={height} onChange={e => setHeight(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <span className="label">Fitness Goal</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {GOALS.map(g => (
                  <div key={g.value} onClick={() => setFitnessGoal(g.value)}
                    style={{ padding: 12, borderRadius: 10, cursor: 'pointer', textAlign: 'center', border: `1.5px solid ${fitnessGoal === g.value ? 'var(--amber)' : 'var(--border)'}`, background: fitnessGoal === g.value ? 'var(--amber-dim)' : 'var(--bg2)', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{g.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: fitnessGoal === g.value ? 'var(--amber)' : 'var(--text3)' }}>{g.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {(fitnessGoal === 'lose_weight') && (
              <div className="form-group">
                <span className="label">Goal weight ({unitPref}) — optional</span>
                <input className="input" placeholder="Target weight" value={goalWeightLbs} onChange={e => setGoalWeightLbs(e.target.value)} />
              </div>
            )}

            <button className="btn btn-amber" onClick={saveStep1} disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <Spinner size={18} /> : 'Continue →'}
            </button>
          </>
        )}

        {/* STEP 2: PAR-Q */}
        {step === 2 && !showParqSummary && (
          <>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Health Check</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>Step 2 of 4 — PAR-Q Questionnaire ({parqIndex + 1}/{PAR_Q.length})</div>

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 14, textAlign: 'center' }}>{PAR_Q[parqIndex].icon}</div>
              <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.6, textAlign: 'center', marginBottom: 24 }}>
                {PAR_Q[parqIndex].question}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => handleParqAnswer(false)}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: `1px solid ${parqAnswers[PAR_Q[parqIndex].key] === false ? 'var(--green)' : 'var(--border2)'}`, background: parqAnswers[PAR_Q[parqIndex].key] === false ? 'var(--green-dim)' : 'var(--bg3)', color: parqAnswers[PAR_Q[parqIndex].key] === false ? 'var(--green)' : 'var(--text2)', fontWeight: 700, cursor: 'pointer', fontSize: 15, transition: 'all 0.15s' }}>
                  No
                </button>
                <button onClick={() => handleParqAnswer(true)}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: `1px solid ${parqAnswers[PAR_Q[parqIndex].key] === true ? 'var(--red)' : 'var(--border2)'}`, background: parqAnswers[PAR_Q[parqIndex].key] === true ? 'var(--red-dim)' : 'var(--bg3)', color: parqAnswers[PAR_Q[parqIndex].key] === true ? 'var(--red)' : 'var(--text2)', fontWeight: 700, cursor: 'pointer', fontSize: 15, transition: 'all 0.15s' }}>
                  Yes
                </button>
              </div>
            </div>

            {PAR_Q[parqIndex].key === 'other_reason' && parqAnswers.other_reason && (
              <div className="form-group">
                <span className="label">Please describe</span>
                <textarea className="input" placeholder="Describe your reason..." value={otherDetails} onChange={e => setOtherDetails(e.target.value)} />
              </div>
            )}
          </>
        )}

        {step === 2 && showParqSummary && (
          <>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Review Your Answers</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Step 2 of 4 — PAR-Q Summary</div>

            <div style={{ marginBottom: 16 }}>
              {PAR_Q.map(q => (
                <div key={q.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                  <span style={{ color: 'var(--text2)', flex: 1, paddingRight: 12 }}>{q.icon} {q.question.slice(0, 50)}...</span>
                  <span style={{ fontWeight: 700, color: parqAnswers[q.key] ? 'var(--red)' : 'var(--green)', flexShrink: 0 }}>
                    {parqAnswers[q.key] === true ? 'Yes' : 'No'}
                  </span>
                </div>
              ))}
            </div>

            <div onClick={() => setParqAgreed(!parqAgreed)}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, background: 'var(--bg2)', borderRadius: 10, border: `1.5px solid ${parqAgreed ? 'var(--amber)' : 'var(--border)'}`, cursor: 'pointer', marginBottom: 16, transition: 'all 0.15s' }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${parqAgreed ? 'var(--amber)' : 'var(--border2)'}`, background: parqAgreed ? 'var(--amber)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                {parqAgreed && <span style={{ color: '#000', fontSize: 11, fontWeight: 800 }}>✓</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                I confirm that I have read and answered all questions honestly and to the best of my knowledge.
              </div>
            </div>

            <button className="btn btn-amber" onClick={saveStep2} disabled={loading}>
              {loading ? <Spinner size={18} /> : 'Continue →'}
            </button>
          </>
        )}

        {/* STEP 3: Liability Waiver */}
        {step === 3 && (
          <>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Liability Waiver</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Step 3 of 4 — Please read and sign</div>

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, maxHeight: 220, overflowY: 'auto', fontSize: 11, color: 'var(--text3)', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 16 }}>
              {WAIVER_TEXT}
            </div>

            <div className="form-group">
              <span className="label">Digital Signature — type your full name</span>
              <input
                className="input"
                placeholder="Sign here..."
                value={waiverSig}
                onChange={e => setWaiverSig(e.target.value)}
                style={{ fontStyle: 'italic', borderBottom: '2px solid var(--amber)', borderRadius: '9px 9px 0 0', fontSize: 16 }}
              />
            </div>

            <button className="btn btn-amber" onClick={saveStep3} disabled={loading}>
              {loading ? <Spinner size={18} /> : 'Sign & Continue →'}
            </button>
          </>
        )}

        {/* STEP 4: Training Contract */}
        {step === 4 && (
          <>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Training Contract</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Step 4 of 4 — Final step</div>

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, maxHeight: 220, overflowY: 'auto', fontSize: 11, color: 'var(--text3)', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 16 }}>
              {CONTRACT_TEXT}
            </div>

            <div className="form-group">
              <span className="label">Digital Signature — type your full name</span>
              <input
                className="input"
                placeholder="Sign here..."
                value={contractSig}
                onChange={e => setContractSig(e.target.value)}
                style={{ fontStyle: 'italic', borderBottom: '2px solid var(--amber)', borderRadius: '9px 9px 0 0', fontSize: 16 }}
              />
            </div>

            <button className="btn btn-amber" onClick={saveStep4} disabled={loading}>
              {loading ? <Spinner size={18} /> : 'Sign & Enter Strive →'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
