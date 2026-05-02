import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export default function TrainerClient() {
  const { clientId } = useParams()
  const { profile, signOut } = useAuth()
  const [client, setClient] = useState(null)
  const [plan, setPlan] = useState(null)
  const [days, setDays] = useState([])
  const [videos, setVideos] = useState([])
  const [activeDay, setActiveDay] = useState('Monday')
  const [showAddEx, setShowAddEx] = useState(false)
  const [loading, setLoading] = useState(true)
  const [exName, setExName] = useState('')
  const [exSets, setExSets] = useState('')
  const [exReps, setExReps] = useState('')
  const [exRest, setExRest] = useState('')
  const [exNotes, setExNotes] = useState('')
  const [exVideo, setExVideo] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [intakeForm, setIntakeForm] = useState(null)
  const [showIntake, setShowIntake] = useState(false)

  useEffect(() => { init() }, [clientId])

  const init = async () => {
    const { data: clientData } = await supabase.from('profiles').select('*').eq('id', clientId).single()
    setClient(clientData)
    const { data: planData } = await supabase.from('workout_plans').select('*').eq('client_id', clientId).single()
    let currentPlan = planData
    if (!planData) {
      const { data: newPlan } = await supabase.from('workout_plans').insert({ client_id: clientId, trainer_id: profile.id }).select().single()
      currentPlan = newPlan
    }
    setPlan(currentPlan)
    await fetchDays(currentPlan.id)
    const { data: videoData } = await supabase.from('videos').select('*').eq('trainer_id', profile.id).order('title')
    setVideos(videoData || [])
    const { data: intake } = await supabase.from('intake_forms').select('*').eq('client_id', clientId).single()
    setIntakeForm(intake)
    setLoading(false)
  }

  const fetchDays = async (planId) => {
    const { data } = await supabase.from('workout_days').select('*, exercises(*, video:video_id(*))').eq('plan_id', planId).order('created_at')
    setDays(data || [])
  }

  const toggleRestDay = async () => {
    const day = days.find(d => d.day_of_week === activeDay)
    if (day) {
      await supabase.from('workout_days').update({ is_rest_day: !day.is_rest_day }).eq('id', day.id)
    } else {
      await supabase.from('workout_days').insert({ plan_id: plan.id, day_of_week: activeDay, is_rest_day: true })
    }
    fetchDays(plan.id)
  }

  const addExercise = async () => {
    if (!exName) return setError('Exercise name is required.')
    setAdding(true)
    setError('')
    let day = days.find(d => d.day_of_week === activeDay)
    if (!day) {
      const { data } = await supabase.from('workout_days').insert({ plan_id: plan.id, day_of_week: activeDay, is_rest_day: false }).select().single()
      day = data
    } else if (day.is_rest_day) {
      await supabase.from('workout_days').update({ is_rest_day: false }).eq('id', day.id)
    }
    const currentExercises = day.exercises || []
    await supabase.from('exercises').insert({
      day_id: day.id, name: exName, sets: exSets ? parseInt(exSets) : null,
      reps: exReps, rest_time: exRest, notes: exNotes,
      video_id: exVideo || null, order_index: currentExercises.length
    })
    setExName(''); setExSets(''); setExReps(''); setExRest(''); setExNotes(''); setExVideo(''); setShowAddEx(false)
    fetchDays(plan.id)
    setAdding(false)
  }

  const deleteExercise = async (exId) => {
    await supabase.from('exercises').delete().eq('id', exId)
    fetchDays(plan.id)
  }

  const activeDay_ = days.find(d => d.day_of_week === activeDay)
  const exercises = activeDay_?.exercises || []
  const isRest = activeDay_?.is_rest_day
  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '??'

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className="app-layout">
      <div className="sidebar">
        <div className="sidebar-logo">Strive<span>.</span></div>
        <nav className="sidebar-nav">
          <Link to="/trainer" className="nav-item active"><div className="nav-dot" />My Clients</Link>
          <Link to="/trainer/videos" className="nav-item"><div className="nav-dot" />Video Library</Link>
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">{initials(profile?.full_name)}</div>
          <div className="sidebar-footer-name">{profile?.full_name}</div>
          <button className="signout-btn" onClick={signOut}>Sign out</button>
        </div>
      </div>

      <div className="mobile-header">
        <Link to="/trainer" style={{color:'var(--accent)', textDecoration:'none', fontFamily:'var(--font-head)', fontSize:'13px'}}>← Back</Link>
        <div className="mobile-logo">Strive<span>.</span></div>
        <div className="avatar">{initials(profile?.full_name)}</div>
      </div>

      <main className="main-content">
        <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'4px'}}>
          <div className="avatar" style={{width:'44px', height:'44px', fontSize:'15px'}}>{initials(client?.full_name)}</div>
          <div>
            <div className="page-title" style={{marginBottom:'0'}}>{client?.full_name}</div>
            <div style={{fontSize:'12px', color:'var(--text3)'}}>{client?.email}</div>
          </div>
        </div>
        <div className="page-sub" style={{marginTop:'8px'}}>Workout plan builder</div>

        {/* INTAKE FORM */}
        {intakeForm && (
          <div style={{marginBottom:'20px'}}>
            <div className="add-btn" style={{marginBottom:'0'}} onClick={() => setShowIntake(!showIntake)}>
              {showIntake ? '✕ Hide health form' : '📋 View health & goals form'}
            </div>
            {showIntake && (
              <div className="card" style={{marginTop:'10px'}}>
                <div style={{fontFamily:'var(--font-head)', fontSize:'14px', fontWeight:'700', marginBottom:'14px'}}>Client Health Form</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'14px'}}>
                  {[['Age', intakeForm.age], ['Weight', intakeForm.weight], ['Height', intakeForm.height]].map(([label, val]) => (
                    <div key={label} style={{background:'var(--surface3)', borderRadius:'10px', padding:'10px', textAlign:'center'}}>
                      <div style={{fontFamily:'var(--font-head)', fontSize:'16px', fontWeight:'700', color:'var(--accent)'}}>{val || '—'}</div>
                      <div style={{fontSize:'10px', color:'var(--text3)', marginTop:'2px', textTransform:'uppercase', letterSpacing:'0.5px'}}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:'14px'}}>
                  <span className="label">Fitness goal</span>
                  <div style={{fontSize:'14px', color:'var(--accent)', fontFamily:'var(--font-head)', fontWeight:'600'}}>{intakeForm.fitness_goal || '—'}</div>
                </div>
                <div style={{fontFamily:'var(--font-head)', fontSize:'11px', fontWeight:'700', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px'}}>PAR-Q Answers</div>
                {[
                  ['Heart condition', intakeForm.heart_condition],
                  ['Chest pain during activity', intakeForm.chest_pain_activity],
                  ['Chest pain at rest', intakeForm.chest_pain_rest],
                  ['Dizziness / loss of consciousness', intakeForm.dizziness],
                  ['Bone or joint problem', intakeForm.bone_joint_problem],
                  ['Prescription medication', intakeForm.prescription_medication],
                  ['Other reason', intakeForm.other_reason],
                ].map(([label, val]) => (
                  <div key={label} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'0.5px solid var(--border)'}}>
                    <div style={{fontSize:'12px', color:'var(--text2)'}}>{label}</div>
                    <div style={{fontSize:'11px', fontFamily:'var(--font-head)', fontWeight:'600', padding:'3px 10px', borderRadius:'8px',
                      background: val ? 'var(--red-dim)' : 'var(--green-dim)',
                      color: val ? 'var(--red)' : 'var(--green)'}}>
                      {val ? 'YES' : 'NO'}
                    </div>
                  </div>
                ))}
                {intakeForm.other_reason_details && (
                  <div style={{marginTop:'10px', fontSize:'12px', color:'var(--text2)'}}>
                    <span style={{color:'var(--text3)'}}>Details: </span>{intakeForm.other_reason_details}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* DAY SELECTOR */}
        <div style={{display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'20px'}}>
          {DAYS.map(d => {
            const dayData = days.find(day => day.day_of_week === d)
            const isRestDay = dayData?.is_rest_day
            return (
              <div key={d} onClick={() => setActiveDay(d)}
                style={{padding:'7px 14px', borderRadius:'20px', fontSize:'12px', cursor:'pointer', fontFamily:'var(--font-head)', fontWeight:'700',
                  background: activeDay === d ? 'var(--accent)' : isRestDay ? 'var(--surface3)' : 'var(--accent-dim)',
                  color: activeDay === d ? '#fff' : isRestDay ? 'var(--text3)' : 'var(--accent)',
                  border: `0.5px solid ${activeDay === d ? 'var(--accent)' : 'var(--border2)'}`,
                  transition:'all 0.2s'}}>
                {d.slice(0,3)}
              </div>
            )
          })}
        </div>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px'}}>
          <div style={{fontFamily:'var(--font-head)', fontSize:'16px', fontWeight:'700'}}>{activeDay}</div>
          <button className="btn btn-secondary btn-sm" onClick={toggleRestDay}>
            {isRest ? '✓ Rest day — click to undo' : 'Mark as rest day'}
          </button>
        </div>

        {isRest ? (
          <div className="card" style={{textAlign:'center', padding:'32px'}}>
            <div style={{fontSize:'28px', marginBottom:'10px'}}>😴</div>
            <div style={{fontFamily:'var(--font-head)', fontSize:'15px', fontWeight:'600'}}>Rest day</div>
          </div>
        ) : (
          <>
            <div className="add-btn" onClick={() => setShowAddEx(!showAddEx)}>
              {showAddEx ? '✕ Cancel' : '+ Add exercise'}
            </div>

            {showAddEx && (
              <div className="card" style={{marginBottom:'14px'}}>
                <div style={{fontFamily:'var(--font-head)', fontSize:'15px', fontWeight:'700', marginBottom:'16px'}}>New exercise</div>
                {error && <div className="error-msg">{error}</div>}
                <div style={{display:'grid', gap:'10px', marginBottom:'10px'}}>
                  <input className="input" placeholder="Exercise name *" value={exName} onChange={e => setExName(e.target.value)} />
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px'}}>
                    <input className="input" placeholder="Sets" value={exSets} onChange={e => setExSets(e.target.value)} />
                    <input className="input" placeholder="Reps" value={exReps} onChange={e => setExReps(e.target.value)} />
                    <input className="input" placeholder="Rest" value={exRest} onChange={e => setExRest(e.target.value)} />
                  </div>
                  <input className="input" placeholder="Coaching notes..." value={exNotes} onChange={e => setExNotes(e.target.value)} />
                  <select className="input" value={exVideo} onChange={e => setExVideo(e.target.value)}>
                    <option value="">No video selected</option>
                    {videos.map(v => <option key={v.id} value={v.id}>{v.title} ({v.category})</option>)}
                  </select>
                </div>
                <button className="btn btn-primary" onClick={addExercise} disabled={adding}>
                  {adding ? 'Adding...' : 'Add exercise →'}
                </button>
              </div>
            )}

            {exercises.length === 0 ? (
              <div className="card" style={{textAlign:'center', padding:'32px'}}>
                <div style={{fontSize:'28px', marginBottom:'10px'}}>📋</div>
                <div style={{fontFamily:'var(--font-head)', fontSize:'15px', fontWeight:'600', marginBottom:'6px'}}>No exercises yet</div>
                <div style={{fontSize:'13px', color:'var(--text3)'}}>Add exercises for {activeDay}</div>
              </div>
            ) : exercises.map((ex) => (
              <div key={ex.id} className="card" style={{marginBottom:'9px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:'var(--font-head)', fontSize:'15px', fontWeight:'600', marginBottom:'4px'}}>{ex.name}</div>
                    <div style={{fontSize:'12px', color:'var(--text3)'}}>
                      {[ex.sets && `${ex.sets} sets`, ex.reps && `${ex.reps} reps`, ex.rest_time && `${ex.rest_time} rest`].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteExercise(ex.id)}>Delete</button>
                </div>
                {ex.notes && <div style={{fontSize:'12px', color:'var(--text2)', marginTop:'8px', paddingTop:'8px', borderTop:'0.5px solid var(--border)'}}>{ex.notes}</div>}
                {ex.video && (
                  <div style={{marginTop:'10px', paddingTop:'10px', borderTop:'0.5px solid var(--border)'}}>
                    <div style={{fontSize:'11px', color:'var(--accent)', marginBottom:'6px', fontFamily:'var(--font-head)', fontWeight:'600'}}>🎬 {ex.video.title}</div>
                    <video src={ex.video.video_url} controls style={{width:'100%', borderRadius:'10px', background:'#000'}} />
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </main>

      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          <Link to="/trainer" className="mobile-nav-item active">
            <div className="mobile-nav-dot" />Clients
          </Link>
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