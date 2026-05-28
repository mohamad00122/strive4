import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { calculateMacros, getMealPlan, scaleMealPlan, getDayGroup } from '../../lib/nutritionPlan'
import { useUnits } from '../../lib/useUnits'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import BottomNav from '../../components/BottomNav'
import ComplianceRing from '../../components/ComplianceRing'
import DayChip from '../../components/DayChip'
import Modal from '../../components/Modal'
import SparklineChart from '../../components/SparklineChart'
import StatTile from '../../components/StatTile'
import Spinner from '../../components/Spinner'
import {
  IconHome, IconBarbell, IconChartLine, IconApple, IconSettings, IconMessageCircle, IconPlus, IconCheck
} from '@tabler/icons-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_ABBR = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getMondayISO() {
  const now = new Date()
  const dow = now.getDay()
  const daysToMonday = dow === 0 ? 6 : dow - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysToMonday)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

const TABS = [
  { id: 'home', label: 'Home', icon: <IconHome size={22} stroke={1.5} /> },
  { id: 'program', label: 'Program', icon: <IconBarbell size={22} stroke={1.5} /> },
  { id: 'progress', label: 'Progress', icon: <IconChartLine size={22} stroke={1.5} /> },
  { id: 'nutrition', label: 'Nutrition', icon: <IconApple size={22} stroke={1.5} /> },
  { id: 'settings', label: 'Settings', icon: <IconSettings size={22} stroke={1.5} /> },
]

export default function ClientDashboard() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (profile && profile.subscription_status !== 'active') {
      navigate('/payment', { replace: true })
    }
  }, [profile])
  const { display, label, isKg, toStorageLbs } = useUnits()
  const todayDayName = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
  const [tab, setTab] = useState('home')
  const [loading, setLoading] = useState(true)

  // Data
  const [plan, setPlan] = useState(null)
  const [days, setDays] = useState([])
  const [sessionLogs, setSessionLogs] = useState([])
  const [optimisticLogged, setOptimisticLogged] = useState([])
  const [weightLogs, setWeightLogs] = useState([])
  const [performanceLogs, setPerformanceLogs] = useState([])
  const [intakeForm, setIntakeForm] = useState(null)
  const [messages, setMessages] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [trainerInfo, setTrainerInfo] = useState(null)

  // Program tab
  const [activeDay, setActiveDay] = useState(todayDayName)
  const [activeExId, setActiveExId] = useState(null)
  const [doneExIds, setDoneExIds] = useState([])
  const [showLogModal, setShowLogModal] = useState(false)

  // Progress tab
  const [progressSubTab, setProgressSubTab] = useState('weight')
  const [weightRange, setWeightRange] = useState('3M')
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [newWeight, setNewWeight] = useState('')
  const [weightNote, setWeightNote] = useState('')
  const [showPerfModal, setShowPerfModal] = useState(false)
  const [perfExercise, setPerfExercise] = useState('')
  const [perfWeight, setPerfWeight] = useState('')
  const [perfReps, setPerfReps] = useState('')
  const [perfSets, setPerfSets] = useState('')
  const [perfNote, setPerfNote] = useState('')
  const [selectedPerfEx, setSelectedPerfEx] = useState('')

  // Nutrition
  const [nutritionDay, setNutritionDay] = useState(new Date().getDay())

  // Settings
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [newPassword, setNewPassword] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState('')
  const [unitPref, setUnitPref] = useState(profile?.unit_preference || 'lbs')

  // Messaging
  const [showMsgModal, setShowMsgModal] = useState(false)
  const [msgText, setMsgText] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const msgBottomRef = useRef(null)

  const mondayISO = getMondayISO()

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    msgBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showMsgModal])

  useEffect(() => {
    if (!user) return
    const channel = supabase.channel('client-msgs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new])
        if (!showMsgModal) setUnreadCount(c => c + 1)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, showMsgModal])

  const loadAll = async () => {
    setLoading(true)
    const [planRes, logsRes, weightRes, perfRes, intakeRes, clientRes] = await Promise.all([
      supabase.from('workout_plans').select('id').eq('client_id', user.id).order('created_at', { ascending: false }).limit(1),
      supabase.from('session_logs').select('*').eq('client_id', user.id).order('logged_at', { ascending: false }),
      supabase.from('weight_logs').select('*').eq('client_id', user.id).order('logged_at', { ascending: true }),
      supabase.from('performance_logs').select('*').eq('client_id', user.id).order('logged_at', { ascending: false }),
      supabase.from('intake_forms').select('*').eq('client_id', user.id).maybeSingle(),
      supabase.from('clients').select('*, profiles!clients_trainer_id_fkey(full_name, id)').eq('client_id', user.id).maybeSingle(),
    ])

    const planId = planRes.data?.[0]?.id
    if (planId) {
      setPlan({ id: planId })
      const { data: daysData } = await supabase
        .from('workout_days')
        .select('*, exercises(*, video:videos(id, title, video_url))')
        .eq('plan_id', planId)
        .order('created_at', { ascending: true })
      const sorted = [...(daysData || [])].sort((a, b) => DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week))
      setDays(sorted)
    }

    const allLogs = logsRes.data || []
    setSessionLogs(allLogs)
    setWeightLogs(weightRes.data || [])
    setPerformanceLogs(perfRes.data || [])
    setIntakeForm(intakeRes.data || null)

    if (!clientRes.error && clientRes.data) {
      setTrainerInfo(clientRes.data.profiles || null)
      const trainerId = clientRes.data.trainer_id
      const { data: msgData } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${trainerId}),and(sender_id.eq.${trainerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
      setMessages(msgData || [])
      const unread = (msgData || []).filter(m => m.receiver_id === user.id && !m.read).length
      setUnreadCount(unread)
    }
    setLoading(false)
  }

  const weekSessionLogs = sessionLogs.filter(l => new Date(l.logged_at) >= new Date(mondayISO))

  const completedDays = [...new Set([
    ...weekSessionLogs.map(l => l.day_of_week),
    ...optimisticLogged
  ])]

  const weekPercent = days.length > 0
    ? Math.min(Math.round((weekSessionLogs.length / days.filter(d => !d.is_rest_day).length) * 100), 100)
    : 0

  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : null
  const firstWeight = weightLogs.length > 0 ? weightLogs[0] : null
  const weightDelta = currentWeight && firstWeight ? currentWeight.weight_lbs - firstWeight.weight_lbs : null

  const logSession = async () => {
    const activeDayData = days.find(d => d.day_of_week === activeDay)
    await supabase.from('session_logs').insert({
      client_id: user.id,
      plan_id: plan?.id || null,
      day_of_week: activeDay
    })
    setOptimisticLogged(prev => [...prev, activeDay])
    setSessionLogs(prev => [...prev, { day_of_week: activeDay, logged_at: new Date().toISOString() }])
    setShowLogModal(false)
  }

  const openMsgModal = async () => {
    setShowMsgModal(true)
    if (unreadCount > 0 && trainerInfo) {
      await supabase.from('messages').update({ read: true }).eq('receiver_id', user.id).eq('sender_id', trainerInfo.id)
      setUnreadCount(0)
    }
  }

  const sendMessage = async () => {
    if (!msgText.trim() || !trainerInfo || sendingMsg) return
    const content = msgText.trim()
    setMsgText('')
    setSendingMsg(true)
    const optimistic = { id: 'opt-' + Date.now(), sender_id: user.id, receiver_id: trainerInfo.id, content, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, optimistic])
    await supabase.from('messages').insert({ sender_id: user.id, receiver_id: trainerInfo.id, content })
    setSendingMsg(false)
  }

  const logWeight = async () => {
    if (!newWeight) return
    const lbs = toStorageLbs(parseFloat(newWeight))
    await supabase.from('weight_logs').insert({ client_id: user.id, weight_lbs: lbs, note: weightNote })
    setWeightLogs(prev => [...prev, { weight_lbs: lbs, logged_at: new Date().toISOString(), note: weightNote }])
    setNewWeight('')
    setWeightNote('')
    setShowWeightModal(false)
  }

  const logPerformance = async () => {
    if (!perfExercise || !perfWeight) return
    const entry = { client_id: user.id, exercise_name: perfExercise, weight_lbs: parseFloat(perfWeight), reps: parseInt(perfReps) || null, sets: parseInt(perfSets) || null, note: perfNote }
    await supabase.from('performance_logs').insert(entry)
    setPerformanceLogs(prev => [{ ...entry, logged_at: new Date().toISOString(), id: 'opt-' + Date.now() }, ...prev])
    setPerfExercise(''); setPerfWeight(''); setPerfReps(''); setPerfSets(''); setPerfNote('')
    setShowPerfModal(false)
  }

  const saveSettings = async () => {
    setSettingsSaving(true)
    setSettingsMsg('')
    await supabase.from('profiles').update({ full_name: fullName, unit_preference: unitPref }).eq('id', user.id)
    if (newPassword) await supabase.auth.updateUser({ password: newPassword })
    await refreshProfile()
    setSettingsMsg('Saved!')
    setSettingsSaving(false)
    setTimeout(() => setSettingsMsg(''), 2500)
  }

  const activeDayData = days.find(d => d.day_of_week === activeDay)
  const exercises = (activeDayData?.exercises || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
  const todayLogged = completedDays.includes(activeDay)

  // Weight chart filter
  const now = new Date()
  const rangeMs = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 99999 }
  const filteredWeightLogs = weightLogs.filter(l => {
    const diff = (now - new Date(l.logged_at)) / (1000 * 60 * 60 * 24)
    return diff <= (rangeMs[weightRange] || 90)
  })
  const weightChartData = filteredWeightLogs.map(l => ({ value: isKg ? l.weight_lbs * 0.453592 : l.weight_lbs, date: l.logged_at }))

  // Nutrition
  const macros = calculateMacros(intakeForm)
  const dayGroup = getDayGroup(nutritionDay)
  const rawMeals = getMealPlan(intakeForm?.fitness_goal, dayGroup)
  const meals = macros ? scaleMealPlan(rawMeals, macros.calories) : rawMeals

  // Unique exercise names for perf filter
  const uniqueExNames = [...new Set(performanceLogs.map(l => l.exercise_name))]
  const filteredPerf = selectedPerfEx ? performanceLogs.filter(l => l.exercise_name === selectedPerfEx) : performanceLogs
  const perfBest = selectedPerfEx ? performanceLogs.filter(l => l.exercise_name === selectedPerfEx).reduce((max, l) => (!max || l.weight_lbs > max.weight_lbs) ? l : max, null) : null

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={36} /></div>

  return (
    <div className="app-layout">
      {/* Sidebar (desktop) */}
      <aside className="sidebar">
        <div className="sidebar-logo">Strive<span>.</span></div>
        <nav className="sidebar-nav">
          {TABS.map(t => (
            <div key={t.id} className={`sidebar-nav-item ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              <span className="nav-icon">{t.icon}</span>
              <span style={{ fontSize: 9 }}>{t.label}</span>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <Avatar name={profile?.full_name} size="sm" />
          <button className="sidebar-signout" onClick={signOut}>Sign out</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="content-area">

        {/* ── HOME TAB ── */}
        {tab === 'home' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>{getGreeting()},</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800 }}>{profile?.full_name?.split(' ')[0] || 'Athlete'} 💪</div>
            </div>

            {/* Compliance ring + day strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
              <ComplianceRing percent={weekPercent} size={100} label="this week" />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>This Week</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {DAYS.map((d, i) => {
                    const dayData = days.find(day => day.day_of_week === d)
                    const done = completedDays.includes(d)
                    const isToday = d === todayDayName
                    const isRest = dayData?.is_rest_day
                    let state = 'default'
                    if (done) state = 'done'
                    else if (isToday) state = 'today'
                    else if (isRest) state = 'rest'
                    return <DayChip key={d} label={DAY_ABBR[i]} state={state} />
                  })}
                </div>
              </div>
            </div>

            {/* Stat tiles */}
            <div className="stat-grid" style={{ marginBottom: 20 }}>
              <StatTile number={`${weekPercent}%`} label="This week" color="var(--amber)" />
              <StatTile
                number={weightDelta !== null ? `${Math.abs(display(Math.abs(weightDelta)))} ${label}` : '—'}
                label={weightDelta !== null ? (weightDelta < 0 ? `${label} lost` : `${label} gained`) : 'Weight change'}
                color={weightDelta !== null ? (weightDelta < 0 ? 'var(--green)' : 'var(--red)') : 'var(--text)'}
              />
              <StatTile number={weekSessionLogs.length} label="Sessions this week" />
              <StatTile number={`${(() => {
                if (!sessionLogs || sessionLogs.length === 0) return 0
                const nonRestDayCount = days.filter(d => !d.is_rest_day).length
                if (nonRestDayCount === 0) return 0

                let streak = 0
                const now2 = new Date()

                for (let w = 0; w < 52; w++) {
                  const wStart = new Date(now2)
                  const dow = wStart.getDay()
                  const daysToMonday = dow === 0 ? 6 : dow - 1
                  wStart.setDate(wStart.getDate() - daysToMonday - w * 7)
                  wStart.setHours(0, 0, 0, 0)
                  const wEnd = new Date(wStart)
                  wEnd.setDate(wEnd.getDate() + 7)

                  const logsThisWeek = sessionLogs.filter(l => {
                    const d = new Date(l.logged_at)
                    return d >= wStart && d < wEnd
                  })

                  if (logsThisWeek.length >= Math.ceil(nonRestDayCount * 0.5)) {
                    streak++
                  } else {
                    if (w === 0) {
                      continue
                    }
                    break
                  }
                }
                return streak
              })()}wks`} label="Streak" />
            </div>

            {/* Today's workout */}
            {!activeDayData?.is_rest_day && exercises.length > 0 && (
              <div className="card" style={{ marginBottom: 14, cursor: 'pointer', border: '1px solid var(--amber)' }} onClick={() => setTab('program')}>
                <div style={{ fontSize: 10, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: 6 }}>Today's Workout</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700 }}>{activeDayData?.name || todayDayName}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{exercises.length} exercises · Tap to view</div>
              </div>
            )}

            {/* Latest PR */}
            {performanceLogs.length > 0 && (
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: 6 }}>Latest Personal Best</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--amber)' }}>
                  {performanceLogs[0].exercise_name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                  {display(performanceLogs[0].weight_lbs)} × {performanceLogs[0].reps || '—'} reps
                </div>
              </div>
            )}
          </>
        )}

        {/* ── PROGRAM TAB ── */}
        {tab === 'program' && (
          <>
            <div className="page-header">
              <div className="page-title">My Program</div>
            </div>

            {days.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No plan yet</div>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>Your trainer hasn't built your plan yet. Check back soon.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 16 }}>
                {/* Day selector */}
                <div style={{ width: 160, flexShrink: 0 }}>
                  {days.map(d => {
                    const done = completedDays.includes(d.day_of_week)
                    const isActive = activeDay === d.day_of_week
                    return (
                      <div key={d.id} className={`plan-day-item ${isActive ? 'active' : ''}`} onClick={() => { setActiveDay(d.day_of_week); setActiveExId(null) }}>
                        <div className="plan-day-name">{d.day_of_week.slice(0, 3)}</div>
                        <div className="plan-day-sub">
                          {d.is_rest_day ? <span style={{ fontStyle: 'italic' }}>Rest day</span>
                            : done ? <span style={{ color: 'var(--green)' }}>● done</span>
                            : `${(d.exercises || []).length} exercises`}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Exercise content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {activeDayData?.is_rest_day ? (
                    <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>😴</div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>Rest Day</div>
                      <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Recovery is part of the process.</div>
                    </div>
                  ) : (
                    <>
                      {exercises.map(ex => {
                        const isActive = activeExId === ex.id
                        const isDone = doneExIds.includes(ex.id)
                        return (
                          <div key={ex.id} className={`exercise-card ${isActive ? 'active-ex' : ''} ${isDone ? 'done-ex' : ''}`}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                              onClick={() => setActiveExId(isActive ? null : ex.id)}>
                              <div>
                                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--green)' : 'var(--text)' }}>
                                  {ex.name}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                                  {[ex.sets && `${ex.sets} sets`, ex.reps && ex.reps, ex.rest_time && `${ex.rest_time}s rest`].filter(Boolean).join(' · ')}
                                </div>
                              </div>
                              {isDone ? <Badge variant="green">done ✓</Badge>
                                : isActive ? <Badge variant="amber">▶ UP NEXT</Badge>
                                : ex.video ? <div style={{ fontSize: 18, color: 'var(--text3)' }}>▶</div> : null}
                            </div>

                            {isActive && (
                              <div style={{ marginTop: 14, borderTop: '1px solid var(--border2)', paddingTop: 14 }}>
                                {ex.video?.video_url && (
                                  <div style={{ position: 'relative', marginBottom: 12 }}>
                                    <video src={ex.video.video_url} controls playsInline style={{ width: '100%', borderRadius: 10, background: '#000', maxHeight: 260 }} />
                                  </div>
                                )}
                                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                  {ex.sets && <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--amber)' }}>{ex.sets}</div>
                                    <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sets</div>
                                  </div>}
                                  {ex.reps && <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--amber)' }}>{ex.reps}</div>
                                    <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reps</div>
                                  </div>}
                                  {ex.rest_time && <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--amber)' }}>{ex.rest_time}s</div>
                                    <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rest</div>
                                  </div>}
                                </div>
                                {ex.notes && <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, marginBottom: 12 }}>{ex.notes}</div>}
                                <button className="btn btn-ghost btn-sm" onClick={() => { setDoneExIds(prev => [...prev, ex.id]); setActiveExId(null) }} style={{ width: '100%' }}>
                                  <IconCheck size={14} /> Mark complete
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {exercises.length === 0 && (
                        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                          <div style={{ fontSize: 13, color: 'var(--text3)' }}>No exercises for this day yet.</div>
                        </div>
                      )}

                      {/* Log session bar */}
                      {exercises.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          {todayLogged && activeDay === todayDayName ? (
                            <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '12px 16px', textAlign: 'center', fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
                              <IconCheck size={14} style={{ marginRight: 6 }} />Session logged ✓
                            </div>
                          ) : (
                            <button className="btn btn-amber" onClick={() => setShowLogModal(true)} style={{ width: '100%' }}>
                              Finish & log session
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── PROGRESS TAB ── */}
        {tab === 'progress' && (
          <>
            <div className="page-header">
              <div className="page-title">Progress</div>
            </div>
            <div className="tab-bar">
              <div className={`tab-item ${progressSubTab === 'weight' ? 'active' : ''}`} onClick={() => setProgressSubTab('weight')}>Weight</div>
              <div className={`tab-item ${progressSubTab === 'performance' ? 'active' : ''}`} onClick={() => setProgressSubTab('performance')}>Performance</div>
            </div>

            {progressSubTab === 'weight' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: 'var(--text)' }}>
                      {currentWeight ? display(currentWeight.weight_lbs) : '—'}
                    </div>
                    {weightDelta !== null && (
                      <Badge variant={weightDelta < 0 ? 'green' : 'red'} style={{ marginTop: 4 }}>
                        {weightDelta < 0 ? '↓' : '↑'} {display(Math.abs(weightDelta))} from start
                      </Badge>
                    )}
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowWeightModal(true)}>
                    <IconPlus size={14} /> Log
                  </button>
                </div>

                <div className="chip-bar">
                  {['1M', '3M', '6M', '1Y', 'All'].map(r => (
                    <div key={r} className={`chip ${weightRange === r ? 'active' : ''}`} onClick={() => setWeightRange(r)}>{r}</div>
                  ))}
                </div>

                <div className="card" style={{ marginBottom: 16 }}>
                  <SparklineChart
                    data={weightChartData}
                    height={120}
                    formatValue={v => `${v.toFixed(1)} ${label}`}
                    formatDate={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                </div>

                {weightLogs.slice().reverse().slice(0, 10).map(l => (
                  <div key={l.id || l.logged_at} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{display(l.weight_lbs)}</div>
                      {l.note && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{l.note}</div>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {new Date(l.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </>
            )}

            {progressSubTab === 'performance' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>Track your personal bests</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowPerfModal(true)}>
                    <IconPlus size={14} /> Log
                  </button>
                </div>

                <div className="chip-bar">
                  <div className={`chip ${selectedPerfEx === '' ? 'active' : ''}`} onClick={() => setSelectedPerfEx('')}>All</div>
                  {uniqueExNames.map(n => (
                    <div key={n} className={`chip ${selectedPerfEx === n ? 'active' : ''}`} onClick={() => setSelectedPerfEx(n)}>{n}</div>
                  ))}
                </div>

                {perfBest && (
                  <div className="card" style={{ marginBottom: 14, border: '1px solid var(--amber)' }}>
                    <div style={{ fontSize: 10, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: 6 }}>Personal Best</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--amber)' }}>{display(perfBest.weight_lbs)}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{perfBest.reps ? `${perfBest.reps} reps` : ''} {perfBest.sets ? `× ${perfBest.sets} sets` : ''}</div>
                  </div>
                )}

                {filteredPerf.map(l => (
                  <div key={l.id || l.logged_at} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{l.exercise_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                        {display(l.weight_lbs)}{l.reps ? ` × ${l.reps} reps` : ''}{l.sets ? ` × ${l.sets} sets` : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0, marginLeft: 8 }}>
                      {new Date(l.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}

                {filteredPerf.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)', fontSize: 13 }}>No performance logs yet.</div>
                )}
              </>
            )}
          </>
        )}

        {/* ── NUTRITION TAB ── */}
        {tab === 'nutrition' && (
          <>
            <div className="page-header">
              <div className="page-title">Nutrition</div>
            </div>

            {!intakeForm ? (
              <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>Complete your intake form to see your nutrition plan.</div>
              </div>
            ) : !macros ? (
              <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>Unable to calculate macros. Please update your profile.</div>
              </div>
            ) : (
              <>
                {/* Calorie ring */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
                  <ComplianceRing
                    percent={100}
                    size={90}
                    label={`${macros.calories} cal`}
                  />
                  <div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800 }}>{macros.calories.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Daily calories</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>BMR: {macros.bmr} · TDEE: {macros.tdee}</div>
                  </div>
                </div>

                {/* Macro bars */}
                {[
                  { label: 'Protein', grams: macros.protein, cal: macros.protein * 4, color: 'var(--amber)' },
                  { label: 'Carbs', grams: macros.carbs, cal: macros.carbs * 4, color: 'var(--green)' },
                  { label: 'Fats', grams: macros.fats, cal: macros.fats * 9, color: 'var(--red)' },
                ].map(m => (
                  <div key={m.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{m.label}</span>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>{m.grams}g · {m.cal} kcal</span>
                    </div>
                    <div className="compliance-bar">
                      <div className="compliance-bar-fill" style={{ width: `${Math.min((m.cal / macros.calories) * 100, 100)}%`, background: m.color }} />
                    </div>
                  </div>
                ))}

                {/* Day strip */}
                <div style={{ display: 'flex', gap: 6, marginTop: 20, marginBottom: 16 }}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                    <div key={d} onClick={() => setNutritionDay(i)}
                      style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                        background: nutritionDay === i ? 'var(--amber-dim)' : 'var(--bg2)',
                        border: `1px solid ${nutritionDay === i ? 'var(--amber)' : 'var(--border)'}`,
                        color: nutritionDay === i ? 'var(--amber)' : 'var(--text3)' }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Meal cards */}
                {meals.map(meal => (
                  <div key={meal.name} className="card" style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700 }}>{meal.name}</div>
                      <Badge variant="amber">{meal.calories} kcal</Badge>
                    </div>
                    {meal.foods.map(f => (
                      <div key={f} style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 3, paddingLeft: 8, borderLeft: '2px solid var(--border2)' }}>
                        {f}
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <>
            <div className="page-header">
              <div className="page-title">Settings</div>
            </div>
            <div style={{ maxWidth: 420 }}>
              {settingsMsg && <div className="success-msg">{settingsMsg}</div>}
              <div className="form-group">
                <span className="label">Full name</span>
                <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div className="form-group">
                <span className="label">Weight unit</span>
                <div style={{ display: 'flex', gap: 8, background: 'var(--bg2)', borderRadius: 9, padding: 4 }}>
                  {['lbs', 'kg'].map(u => (
                    <button key={u} onClick={() => setUnitPref(u)}
                      style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: unitPref === u ? 'var(--amber)' : 'transparent', color: unitPref === u ? '#000' : 'var(--text3)', transition: 'all 0.15s' }}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <span className="label">New password (leave blank to keep current)</span>
                <input className="input" type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <button className="btn btn-amber" onClick={saveSettings} disabled={settingsSaving} style={{ marginBottom: 12 }}>
                {settingsSaving ? <Spinner size={18} /> : 'Save changes →'}
              </button>
              <button className="btn btn-danger" onClick={signOut} style={{ width: '100%' }}>Sign out</button>
            </div>
          </>
        )}
      </main>

      {/* Bottom nav (mobile) */}
      <BottomNav tabs={TABS} activeTab={tab} onTabChange={setTab} />

      {/* FAB */}
      {trainerInfo && (
        <button className="fab" onClick={openMsgModal}>
          <IconMessageCircle size={22} />
          {unreadCount > 0 && <div className="fab-badge">{unreadCount}</div>}
        </button>
      )}

      {/* Log session modal */}
      <Modal open={showLogModal} onClose={() => setShowLogModal(false)} title="Log Session">
        <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>
          Mark {activeDay}'s workout as complete?
        </div>
        <button className="btn btn-amber" onClick={logSession}>Confirm →</button>
      </Modal>

      {/* Weight modal */}
      <Modal open={showWeightModal} onClose={() => setShowWeightModal(false)} title="Log Weight">
        <div className="form-group">
          <span className="label">Weight ({label})</span>
          <input className="input" type="number" step="0.1" placeholder={`e.g. ${label === 'kg' ? '80' : '176'}`} value={newWeight} onChange={e => setNewWeight(e.target.value)} />
        </div>
        <div className="form-group">
          <span className="label">Note (optional)</span>
          <input className="input" placeholder="e.g. morning weight" value={weightNote} onChange={e => setWeightNote(e.target.value)} />
        </div>
        <button className="btn btn-amber" onClick={logWeight}>Save →</button>
      </Modal>

      {/* Performance modal */}
      <Modal open={showPerfModal} onClose={() => setShowPerfModal(false)} title="Log Performance">
        <div className="form-group">
          <span className="label">Exercise name</span>
          <input className="input" placeholder="e.g. Bench Press" value={perfExercise} onChange={e => setPerfExercise(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div>
            <span className="label">Weight ({label})</span>
            <input className="input" type="number" placeholder="100" value={perfWeight} onChange={e => setPerfWeight(e.target.value)} />
          </div>
          <div>
            <span className="label">Reps</span>
            <input className="input" type="number" placeholder="8" value={perfReps} onChange={e => setPerfReps(e.target.value)} />
          </div>
          <div>
            <span className="label">Sets</span>
            <input className="input" type="number" placeholder="4" value={perfSets} onChange={e => setPerfSets(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <span className="label">Note (optional)</span>
          <input className="input" placeholder="e.g. new PR!" value={perfNote} onChange={e => setPerfNote(e.target.value)} />
        </div>
        <button className="btn btn-amber" onClick={logPerformance}>Save →</button>
      </Modal>

      {/* Messaging modal */}
      <Modal open={showMsgModal} onClose={() => setShowMsgModal(false)} title={`Chat with ${trainerInfo?.full_name || 'Trainer'}`} wide>
        <div style={{ display: 'flex', flexDirection: 'column', height: 380 }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 8 }}>
            {messages.map((msg, i) => {
              const isSent = msg.sender_id === user.id
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isSent ? 'flex-end' : 'flex-start' }}>
                  <div className={`msg-bubble ${isSent ? 'msg-bubble-sent' : 'msg-bubble-received'}`}>
                    {msg.content}
                  </div>
                </div>
              )
            })}
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, marginTop: 40 }}>
                No messages yet. Start the conversation!
              </div>
            )}
            <div ref={msgBottomRef} />
          </div>
          <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <input
              className="input"
              placeholder="Type a message..."
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-amber btn-sm" onClick={sendMessage} disabled={!msgText.trim() || sendingMsg} style={{ width: 'auto', flexShrink: 0 }}>
              Send
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
