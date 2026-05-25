import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import ComplianceRing from '../../components/ComplianceRing'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import { IconArrowLeft, IconPlus, IconTrash, IconGripVertical, IconVideo } from '@tabler/icons-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function getMondayISO() {
  const now = new Date()
  const dow = now.getDay()
  const daysToMonday = dow === 0 ? 6 : dow - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysToMonday)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

export default function TrainerClient() {
  const { clientId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const [clientProfile, setClientProfile] = useState(null)
  const [clientStatus, setClientStatus] = useState('active')
  const [plan, setPlan] = useState(null)
  const [days, setDays] = useState([])
  const [activeDay, setActiveDay] = useState(DAYS[0])
  const [videos, setVideos] = useState([])
  const [sessionLogs, setSessionLogs] = useState([])
  const [compliance28, setCompliance28] = useState(0)
  const [error, setError] = useState(null)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSets, setNewSets] = useState('')
  const [newReps, setNewReps] = useState('')
  const [newRest, setNewRest] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newVideoId, setNewVideoId] = useState('')
  const [addingEx, setAddingEx] = useState(false)

  const [showCopyModal, setShowCopyModal] = useState(false)
  const [copyTarget, setCopyTarget] = useState('')

  const mondayISO = getMondayISO()

  useEffect(() => { loadAll() }, [clientId])

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    const [profileRes, clientRes, videosRes, sessionsRes, sessions28Res] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', clientId).single(),
      supabase.from('clients').select('*').eq('trainer_id', user.id).eq('client_id', clientId).maybeSingle(),
      supabase.from('videos').select('*').eq('trainer_id', user.id),
      supabase.from('session_logs').select('*').eq('client_id', clientId).gte('logged_at', mondayISO),
      supabase.from('session_logs').select('*').eq('client_id', clientId).gte('logged_at', new Date(Date.now() - 28 * 86400000).toISOString()),
    ])
    setClientProfile(profileRes.data)
    setClientStatus(clientRes.data?.status || 'active')
    setVideos(videosRes.data || [])
    setSessionLogs(sessionsRes.data || [])

    let planData = null
    const { data: plans, error: plansError } = await supabase
      .from('workout_plans')
      .select('id')
      .eq('client_id', clientId)
      .eq('trainer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
    console.log('[Plan Builder] plans query:', { data: plans, error: plansError })

    if (plans?.length > 0) {
      planData = plans[0]
    } else {
      const { data: newPlan, error: insertError } = await supabase
        .from('workout_plans')
        .insert({ client_id: clientId, trainer_id: user.id, name: 'Training Plan' })
        .select()
        .single()
      console.log('[Plan Builder] plan insert:', { data: newPlan, error: insertError })

      if (insertError) {
        setError(`Failed to create training plan: ${insertError.message}`)
        setLoading(false)
        return
      }

      planData = newPlan
      if (newPlan) {
        for (const day of DAYS) {
          const { error: dayError } = await supabase
            .from('workout_days')
            .insert({ plan_id: newPlan.id, day_of_week: day, is_rest_day: false })
          console.log(`[Plan Builder] day insert (${day}):`, { error: dayError })
        }
      }
    }

    if (planData) {
      setPlan(planData)
      await fetchDays(planData.id)

      const { data: wdData } = await supabase.from('workout_days').select('*').eq('plan_id', planData.id)
      const nonRestDays = (wdData || []).filter(d => !d.is_rest_day).length || 1
      const sessions28Count = sessions28Res.data?.length || 0
      setCompliance28(Math.min(Math.round((sessions28Count / (nonRestDays * 4)) * 100), 100))
    }

    setLoading(false)
  }

  const fetchDays = async (planId) => {
    const { data } = await supabase
      .from('workout_days')
      .select('*, exercises(*, video:videos(id, title, video_url))')
      .eq('plan_id', planId)
      .order('created_at', { ascending: true })
    setDays(data || [])
    setActiveDay(data?.[0]?.day_of_week || DAYS[0])
    console.log('days loaded:', data)
  }

  const toggleRestDay = async (dayId, current) => {
    await supabase.from('workout_days').update({ is_rest_day: !current }).eq('id', dayId)
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, is_rest_day: !current } : d))
  }

  const updateExercise = async (exId, field, value) => {
    await supabase.from('exercises').update({ [field]: value }).eq('id', exId)
    setDays(prev => prev.map(d => ({
      ...d,
      exercises: (d.exercises || []).map(e => e.id === exId ? { ...e, [field]: value } : e)
    })))
  }

  const deleteExercise = async (exId) => {
    await supabase.from('exercises').delete().eq('id', exId)
    setDays(prev => prev.map(d => ({
      ...d,
      exercises: (d.exercises || []).filter(e => e.id !== exId)
    })))
  }

  const addExercise = async () => {
    if (!newName.trim()) return
    setAddingEx(true)
    const activeDayData = days.find(d => d.day_of_week === activeDay)
    if (!activeDayData) { setAddingEx(false); return }

    const existingExercises = activeDayData.exercises || []
    const orderIndex = existingExercises.length

    const insertData = {
      day_id: activeDayData.id,
      name: newName.trim(),
      sets: newSets ? parseInt(newSets) : null,
      reps: newReps || null,
      rest_time: newRest ? parseInt(newRest) : null,
      notes: newNotes || null,
      video_id: newVideoId || null,
      order_index: orderIndex,
    }

    const { data: newEx } = await supabase.from('exercises').insert(insertData).select('*, video:videos(id, title, video_url)').single()

    if (newEx) {
      setDays(prev => prev.map(d => d.id === activeDayData.id ? {
        ...d,
        exercises: [...(d.exercises || []), newEx]
      } : d))
    }

    setNewName(''); setNewSets(''); setNewReps(''); setNewRest(''); setNewNotes(''); setNewVideoId('')
    setShowAddForm(false)
    setAddingEx(false)
  }

  const copyDayExercises = async () => {
    if (!copyTarget) return
    const sourceDayData = days.find(d => d.day_of_week === activeDay)
    const targetDayData = days.find(d => d.day_of_week === copyTarget)
    if (!sourceDayData || !targetDayData) return

    const exercises = (sourceDayData.exercises || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i]
      await supabase.from('exercises').insert({
        day_id: targetDayData.id,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        rest_time: ex.rest_time,
        notes: ex.notes,
        video_id: ex.video_id,
        order_index: i,
      })
    }
    await fetchDays(plan.id)
    setShowCopyModal(false)
    setCopyTarget('')
  }

  const weekDayLogs = sessionLogs.map(l => l.day_of_week)

  const activeDayData = days.find(d => d.day_of_week === activeDay)
  const exercises = (activeDayData?.exercises || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0))

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={36} /></div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg1)', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate('/trainer')} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <IconArrowLeft size={16} /> Back
        </button>
        <Avatar name={clientProfile?.full_name} size="md" />
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800 }}>{clientProfile?.full_name || 'Client'}</div>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>Plan Builder</div>
        </div>
        <Badge variant={clientStatus === 'inactive' ? 'red' : 'green'} style={{ marginLeft: 4 }}>{clientStatus}</Badge>
      </div>

      {error && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', margin: '16px 20px', color: 'var(--red)', fontSize: 13 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Main layout */}
      <div style={{ display: 'flex', gap: 0, maxWidth: 1100, margin: '0 auto' }}>
        {/* Day sidebar */}
        <div style={{ width: 220, flexShrink: 0, padding: 16, borderRight: '1px solid var(--border)', minHeight: 'calc(100vh - 60px)' }}>
          <div className="section-title" style={{ marginBottom: 8 }}>Days</div>
          {days.map(d => {
            const isActive = activeDay === d.day_of_week
            const exCount = (d.exercises || []).length
            const logged = weekDayLogs.includes(d.day_of_week)
            return (
              <div key={d.id} className={`plan-day-item ${isActive ? 'active' : ''}`} onClick={() => setActiveDay(d.day_of_week)}>
                <div className="plan-day-name">{d.day_of_week.slice(0, 3)}</div>
                <div className="plan-day-sub">
                  {d.is_rest_day ? <span style={{ fontStyle: 'italic', color: 'var(--text3)' }}>Rest</span>
                    : logged ? <span style={{ color: 'var(--green)' }}>● logged</span>
                    : `${exCount} exercise${exCount !== 1 ? 's' : ''}`}
                </div>
              </div>
            )
          })}

          {/* Mini compliance widget */}
          <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16, textAlign: 'center' }}>
            <ComplianceRing percent={compliance28} size={64} strokeWidth={6} />
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6 }}>28-day compliance</div>
          </div>
        </div>

        {/* Exercise editor */}
        <div style={{ flex: 1, padding: 20 }}>
          {activeDayData && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800 }}>{activeDay}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{activeDayData.is_rest_day ? 'Rest day' : `${exercises.length} exercises`}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleRestDay(activeDayData.id, activeDayData.is_rest_day)}>
                    {activeDayData.is_rest_day ? 'Mark as training' : 'Mark as rest'}
                  </button>
                  {!activeDayData.is_rest_day && exercises.length > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowCopyModal(true)}>Copy to…</button>
                  )}
                </div>
              </div>

              {activeDayData.is_rest_day ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>😴</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700 }}>Rest Day</div>
                </div>
              ) : (
                <>
                  {exercises.map((ex) => (
                    <ExerciseCard key={ex.id} ex={ex} videos={videos} onUpdate={updateExercise} onDelete={deleteExercise} />
                  ))}

                  {showAddForm ? (
                    <div className="card" style={{ marginBottom: 12 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>New Exercise</div>
                      <div className="form-group">
                        <span className="label">Exercise name</span>
                        <input className="input" placeholder="e.g. Bench Press" value={newName} onChange={e => setNewName(e.target.value)} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                        <div>
                          <span className="label">Sets</span>
                          <input className="input" type="number" placeholder="4" value={newSets} onChange={e => setNewSets(e.target.value)} />
                        </div>
                        <div>
                          <span className="label">Reps</span>
                          <input className="input" type="text" placeholder="8-12" value={newReps} onChange={e => setNewReps(e.target.value)} />
                        </div>
                        <div>
                          <span className="label">Rest (sec)</span>
                          <input className="input" type="number" placeholder="90" value={newRest} onChange={e => setNewRest(e.target.value)} />
                        </div>
                      </div>
                      <div className="form-group">
                        <span className="label">Notes</span>
                        <textarea className="input" placeholder="Coaching cues..." value={newNotes} onChange={e => setNewNotes(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <span className="label">Video (optional)</span>
                        <select className="input" value={newVideoId} onChange={e => setNewVideoId(e.target.value)}>
                          <option value="">No video</option>
                          {videos.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-amber" onClick={addExercise} disabled={addingEx || !newName.trim()} style={{ flex: 1 }}>
                          {addingEx ? <Spinner size={16} /> : 'Add exercise'}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowAddForm(false)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-ghost" onClick={() => setShowAddForm(true)} style={{ width: '100%', border: '1px dashed var(--border2)', marginTop: 4 }}>
                      <IconPlus size={14} /> Add exercise
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Copy modal */}
      <Modal open={showCopyModal} onClose={() => setShowCopyModal(false)} title="Copy exercises to…">
        <div style={{ marginBottom: 16 }}>
          {DAYS.filter(d => d !== activeDay).map(d => (
            <div key={d} onClick={() => setCopyTarget(d)}
              style={{ padding: '10px 14px', borderRadius: 9, cursor: 'pointer', marginBottom: 4,
                background: copyTarget === d ? 'var(--amber-dim)' : 'var(--bg2)',
                border: `1px solid ${copyTarget === d ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                color: copyTarget === d ? 'var(--amber)' : 'var(--text2)', fontSize: 13, fontWeight: 500 }}>
              {d}
            </div>
          ))}
        </div>
        <button className="btn btn-amber" onClick={copyDayExercises} disabled={!copyTarget}>Copy →</button>
      </Modal>
    </div>
  )
}

function ExerciseCard({ ex, videos, onUpdate, onDelete }) {
  const [name, setName] = useState(ex.name || '')
  const [sets, setSets] = useState(ex.sets || '')
  const [reps, setReps] = useState(ex.reps || '')
  const [rest, setRest] = useState(ex.rest_time || '')
  const [notes, setNotes] = useState(ex.notes || '')
  const [videoId, setVideoId] = useState(ex.video_id || '')

  const selectedVideo = videos.find(v => v.id === videoId)

  return (
    <div className="exercise-card" style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <IconGripVertical size={16} color="var(--text3)" style={{ flexShrink: 0, cursor: 'grab' }} />
        <input
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={() => onUpdate(ex.id, 'name', name)}
          style={{ flex: 1, fontWeight: 600 }}
          placeholder="Exercise name"
        />
        <button onClick={() => onDelete(ex.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
          <IconTrash size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <span className="label">Sets</span>
          <input className="input" type="number" placeholder="4" value={sets} onChange={e => setSets(e.target.value)} onBlur={() => onUpdate(ex.id, 'sets', sets ? parseInt(sets) : null)} />
        </div>
        <div>
          <span className="label">Reps</span>
          <input className="input" type="text" placeholder="8-12" value={reps} onChange={e => setReps(e.target.value)} onBlur={() => onUpdate(ex.id, 'reps', reps || null)} />
        </div>
        <div>
          <span className="label">Rest (sec)</span>
          <input className="input" type="number" placeholder="90" value={rest} onChange={e => setRest(e.target.value)} onBlur={() => onUpdate(ex.id, 'rest_time', rest ? parseInt(rest) : null)} />
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <span className="label">Coach notes</span>
        <textarea className="input" placeholder="Coaching cues for client..." value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => onUpdate(ex.id, 'notes', notes || null)} style={{ minHeight: 56 }} />
      </div>

      <div>
        <span className="label">Video</span>
        <select className="input" value={videoId} onChange={e => { setVideoId(e.target.value); onUpdate(ex.id, 'video_id', e.target.value || null) }}>
          <option value="">No video</option>
          {videos.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
        </select>
        {selectedVideo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '6px 10px', background: 'var(--bg3)', borderRadius: 7 }}>
            <IconVideo size={14} color="var(--amber)" />
            <span style={{ fontSize: 12, color: 'var(--amber-text)' }}>{selectedVideo.title}</span>
          </div>
        )}
      </div>
    </div>
  )
}
