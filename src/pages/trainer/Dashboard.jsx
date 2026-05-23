import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import BottomNav from '../../components/BottomNav'
import ComplianceRing from '../../components/ComplianceRing'
import Modal from '../../components/Modal'
import StatTile from '../../components/StatTile'
import Spinner from '../../components/Spinner'
import TrainerMessagesTab from '../../components/TrainerMessagesTab'
import { IntakeSheet, DocumentsSheet } from '../../components/ClientSheets'
import {
  IconHome, IconUsers, IconMessageCircle, IconVideo, IconSettings,
  IconPlus, IconSearch, IconAlertTriangle, IconTrash, IconExternalLink
} from '@tabler/icons-react'

const TABS = [
  { id: 'home', label: 'Home', icon: <IconHome size={22} stroke={1.5} /> },
  { id: 'clients', label: 'Clients', icon: <IconUsers size={22} stroke={1.5} /> },
  { id: 'messages', label: 'Messages', icon: <IconMessageCircle size={22} stroke={1.5} /> },
  { id: 'library', label: 'Library', icon: <IconVideo size={22} stroke={1.5} /> },
  { id: 'settings', label: 'Settings', icon: <IconSettings size={22} stroke={1.5} /> },
]

const VIDEO_CATEGORIES = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full Body']

export default function TrainerDashboard() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('home')
  const [loading, setLoading] = useState(true)

  const [clients, setClients] = useState([])
  const [videos, setVideos] = useState([])
  const [activityLog, setActivityLog] = useState([])

  const [clientSearch, setClientSearch] = useState('')
  const [clientFilter, setClientFilter] = useState('All')
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientPanelData, setClientPanelData] = useState({})
  const [panelLoading, setPanelLoading] = useState(false)
  const [clientNotes, setClientNotes] = useState('')
  const [showIntakeModal, setShowIntakeModal] = useState(false)
  const [showDocsModal, setShowDocsModal] = useState(false)

  const [videoCategory, setVideoCategory] = useState('All')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadCategory, setUploadCategory] = useState('Chest')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [playVideo, setPlayVideo] = useState(null)

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [newPassword, setNewPassword] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState('')
  const [unitPref, setUnitPref] = useState(profile?.unit_preference || 'lbs')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    const [clientsRes, videosRes, activityRes] = await Promise.all([
      supabase.from('clients').select('*, profiles!clients_client_id_fkey(id, full_name, email, last_seen)').eq('trainer_id', user.id),
      supabase.from('videos').select('*').eq('trainer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('activity_log').select('*').eq('trainer_id', user.id).order('created_at', { ascending: false }).limit(20),
    ])
    setClients(clientsRes.data || [])
    setVideos(videosRes.data || [])
    setActivityLog(activityRes.data || [])
    setLoading(false)
  }

  const openClientPanel = async (c) => {
    if (selectedClient?.client_id === c.client_id) { setSelectedClient(null); return }
    setSelectedClient(c)
    setClientNotes(c.notes || '')
    setPanelLoading(true)

    await supabase.from('clients').upsert({ trainer_id: user.id, client_id: c.client_id }, { onConflict: 'trainer_id,client_id' })

    const [intakeRes, docsRes, sessionsRes, weightsRes] = await Promise.all([
      supabase.from('intake_forms').select('*').eq('client_id', c.client_id).single(),
      supabase.from('signed_documents').select('*').eq('client_id', c.client_id),
      supabase.from('session_logs').select('*').eq('client_id', c.client_id).gte('logged_at', new Date(Date.now() - 28 * 86400000).toISOString()),
      supabase.from('weight_logs').select('*').eq('client_id', c.client_id).order('logged_at', { ascending: false }).limit(1),
    ])

    const daysData = await supabase.from('workout_plans').select('id').eq('client_id', c.client_id).order('created_at', { ascending: false }).limit(1)
    const planId = daysData.data?.[0]?.id
    let workoutDays = []
    if (planId) {
      const { data } = await supabase.from('workout_days').select('*').eq('plan_id', planId)
      workoutDays = data || []
    }

    const { data: lastMsg } = await supabase.from('messages')
      .select('content, created_at')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${c.client_id}),and(sender_id.eq.${c.client_id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: false }).limit(1)

    const nonRestDays = workoutDays.filter(d => !d.is_rest_day).length
    const compliance28 = nonRestDays > 0
      ? Math.min(Math.round(((sessionsRes.data?.length || 0) / (nonRestDays * 4)) * 100), 100)
      : 0

    setClientPanelData({
      intake: intakeRes.data,
      docs: docsRes.data || [],
      sessions28: sessionsRes.data?.length || 0,
      currentWeight: weightsRes.data?.[0]?.weight_lbs,
      workoutDays,
      compliance28,
      lastMessage: lastMsg?.[0],
    })
    setPanelLoading(false)
  }

  const saveNotes = async () => {
    if (!selectedClient) return
    await supabase.from('clients').update({ notes: clientNotes }).eq('trainer_id', user.id).eq('client_id', selectedClient.client_id)
  }

  const uploadVideo = async () => {
    if (!uploadFile || !uploadTitle) return
    setUploading(true)
    const ext = uploadFile.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('videos').upload(path, uploadFile)
    if (uploadError) { setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(path)
    const { data: videoRow } = await supabase.from('videos').insert({
      trainer_id: user.id, title: uploadTitle, category: uploadCategory,
      description: uploadDesc, video_url: publicUrl, file_path: path,
    }).select().single()
    if (videoRow) setVideos(prev => [videoRow, ...prev])
    setUploadTitle(''); setUploadCategory('Chest'); setUploadDesc(''); setUploadFile(null)
    setShowUploadModal(false)
    setUploading(false)
  }

  const deleteVideo = async (video) => {
    if (!window.confirm(`Delete "${video.title}"?`)) return
    if (video.file_path) await supabase.storage.from('videos').remove([video.file_path])
    await supabase.from('videos').delete().eq('id', video.id)
    setVideos(prev => prev.filter(v => v.id !== video.id))
  }

  const saveSettings = async () => {
    setSettingsSaving(true)
    await supabase.from('profiles').update({ full_name: fullName, unit_preference: unitPref }).eq('id', user.id)
    if (newPassword) await supabase.auth.updateUser({ password: newPassword })
    await refreshProfile()
    setSettingsMsg('Saved!')
    setSettingsSaving(false)
    setTimeout(() => setSettingsMsg(''), 2500)
  }

  const filteredClients = clients.filter(c => {
    const name = c.profiles?.full_name?.toLowerCase() || ''
    const matchSearch = name.includes(clientSearch.toLowerCase())
    const matchFilter = clientFilter === 'All' || clientFilter.toLowerCase() === (c.status || 'active')
    return matchSearch && matchFilter
  })

  const inactiveClients = clients.filter(c => {
    if (!c.profiles?.last_seen) return false
    const diff = (Date.now() - new Date(c.profiles.last_seen).getTime()) / 86400000
    return diff > 14
  })

  const filteredVideos = videoCategory === 'All' ? videos : videos.filter(v => v.category === videoCategory)

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={36} /></div>

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">S<span>.</span></div>
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

      <main className="content-area">

        {/* HOME */}
        {tab === 'home' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800 }}>
                Hey, {profile?.full_name?.split(' ')[0] || 'Coach'} 👋
              </div>
            </div>

            <div className="stat-grid">
              <StatTile number={clients.length} label="Total clients" />
              <StatTile number={clients.filter(c => c.status !== 'inactive').length} label="Active" color="var(--green)" />
              <StatTile number={inactiveClients.length} label="Alerts" color={inactiveClients.length > 0 ? 'var(--amber)' : 'var(--text)'} />
              <StatTile number={videos.length} label="Videos" />
            </div>

            {inactiveClients.length > 0 && (
              <div style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: 14, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <IconAlertTriangle size={16} color="var(--amber)" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)' }}>
                    {inactiveClients.length} client{inactiveClients.length !== 1 ? 's' : ''} inactive 14+ days
                  </span>
                </div>
                {inactiveClients.map(c => (
                  <div key={c.client_id} style={{ fontSize: 12, color: 'var(--amber-text)', marginBottom: 2 }}>
                    · {c.profiles?.full_name}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <div className="section-title">Client roster</div>
                {clients.slice(0, 5).map(c => (
                  <div key={c.client_id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Avatar name={c.profiles?.full_name} size="sm" />
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{c.profiles?.full_name}</div>
                  </div>
                ))}
                {clients.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)' }}>No clients yet</div>}
              </div>
              <div>
                <div className="section-title">Needs attention</div>
                {inactiveClients.slice(0, 5).map(c => (
                  <div key={c.client_id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Avatar name={c.profiles?.full_name} size="sm" />
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{c.profiles?.full_name}</div>
                  </div>
                ))}
                {inactiveClients.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)' }}>All clients active ✓</div>}
              </div>
            </div>

            {activityLog.length > 0 && (
              <>
                <div className="section-title">Recent Activity</div>
                {activityLog.slice(0, 8).map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge variant="amber">{a.type || 'event'}</Badge>
                      <span style={{ color: 'var(--text2)' }}>{a.description || '—'}</span>
                    </div>
                    <span style={{ color: 'var(--text3)', flexShrink: 0, marginLeft: 8 }}>
                      {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* CLIENTS */}
        {tab === 'clients' && (
          <>
            <div className="page-header"><div className="page-title">Clients</div></div>

            <div style={{ position: 'relative', marginBottom: 12 }}>
              <IconSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              <input className="input" placeholder="Search clients..." value={clientSearch}
                onChange={e => setClientSearch(e.target.value)} style={{ paddingLeft: 36 }} />
            </div>

            <div className="chip-bar">
              {['All', 'Active', 'Inactive'].map(f => (
                <div key={f} className={`chip ${clientFilter === f ? 'active' : ''}`} onClick={() => setClientFilter(f)}>{f}</div>
              ))}
            </div>

            {filteredClients.map(c => {
              const name = c.profiles?.full_name || 'Unknown'
              const isSelected = selectedClient?.client_id === c.client_id
              return (
                <div key={c.client_id}>
                  <div onClick={() => openClientPanel(c)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer', marginBottom: isSelected ? 0 : 6,
                      background: isSelected ? 'var(--amber-dim)' : 'var(--bg1)',
                      border: `1px solid ${isSelected ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                      borderRadius: isSelected ? '10px 10px 0 0' : 10, transition: 'all 0.15s' }}>
                    <Avatar name={name} size="md" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                        Last seen: {c.profiles?.last_seen ? new Date(c.profiles.last_seen).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'never'}
                      </div>
                    </div>
                    <Badge variant={c.status === 'inactive' ? 'red' : 'green'}>{c.status || 'active'}</Badge>
                  </div>

                  {isSelected && (
                    <div style={{ background: 'var(--bg2)', border: '1px solid rgba(245,158,11,0.3)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: 16, marginBottom: 6 }}>
                      {panelLoading ? <div style={{ padding: 20, textAlign: 'center' }}><Spinner size={24} /></div> : (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                            <StatTile number={clientPanelData.sessions28 || 0} label="Sessions (28d)" />
                            <StatTile number={clientPanelData.docs?.length || 0} label="Docs signed" />
                            <StatTile number={clientPanelData.currentWeight ? `${Math.round(clientPanelData.currentWeight)} lbs` : '—'} label="Weight" />
                          </div>

                          {clientPanelData.intake?.fitness_goal && (
                            <div style={{ marginBottom: 12 }}>
                              <Badge variant="amber">{clientPanelData.intake.fitness_goal.replace(/_/g, ' ')}</Badge>
                            </div>
                          )}

                          {clientPanelData.workoutDays?.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                              <div className="section-title">Schedule</div>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d, i) => {
                                  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                                  const dayData = clientPanelData.workoutDays.find(wd => wd.day_of_week === dayNames[i])
                                  const isRest = dayData?.is_rest_day
                                  return (
                                    <div key={d} style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700,
                                      background: isRest ? 'var(--bg3)' : 'var(--amber-dim)',
                                      color: isRest ? 'var(--text3)' : 'var(--amber)',
                                      border: `1px solid ${isRest ? 'var(--border)' : 'rgba(245,158,11,0.3)'}` }}>
                                      {d}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <ComplianceRing percent={clientPanelData.compliance28 || 0} size={56} strokeWidth={5} />
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>28-day compliance</div>
                          </div>

                          {clientPanelData.lastMessage && (
                            <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, fontSize: 12, color: 'var(--text3)' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text2)' }}>Last message: </span>
                              {clientPanelData.lastMessage.content}
                            </div>
                          )}

                          <div style={{ marginBottom: 12 }}>
                            <span className="label">Private notes</span>
                            <textarea className="input" placeholder="Notes about this client..." value={clientNotes}
                              onChange={e => setClientNotes(e.target.value)} onBlur={saveNotes} style={{ minHeight: 56 }} />
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <button className="btn btn-amber btn-sm" onClick={() => navigate(`/trainer/client/${c.client_id}`)}>
                              <IconExternalLink size={12} /> Plan Builder
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setTab('messages')}>
                              <IconMessageCircle size={12} /> Message
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowIntakeModal(true)}>Intake Form</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowDocsModal(true)}>Documents</button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {filteredClients.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontSize: 13 }}>
                {clients.length === 0 ? 'No clients yet. Clients are added via Admin.' : 'No clients match your search.'}
              </div>
            )}
          </>
        )}

        {/* MESSAGES */}
        {tab === 'messages' && (
          <>
            <div className="page-header"><div className="page-title">Messages</div></div>
            <TrainerMessagesTab clients={clients} />
          </>
        )}

        {/* LIBRARY */}
        {tab === 'library' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="page-title">Video Library</div>
              <button className="btn btn-amber btn-sm" onClick={() => setShowUploadModal(true)}>
                <IconPlus size={14} /> Upload
              </button>
            </div>

            <div className="chip-bar">
              {VIDEO_CATEGORIES.map(cat => (
                <div key={cat} className={`chip ${videoCategory === cat ? 'active' : ''}`} onClick={() => setVideoCategory(cat)}>{cat}</div>
              ))}
            </div>

            <div className="video-grid">
              {filteredVideos.map(v => (
                <div key={v.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <div onClick={() => setPlayVideo(v)} style={{ height: 100, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <span style={{ fontSize: 28, opacity: 0.5 }}>▶</span>
                  </div>
                  <div style={{ padding: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Badge variant="amber">{v.category}</Badge>
                      <button onClick={() => deleteVideo(v)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 2 }}>
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredVideos.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontSize: 13 }}>No videos yet.</div>
            )}
          </>
        )}

        {/* SETTINGS */}
        {tab === 'settings' && (
          <>
            <div className="page-header"><div className="page-title">Settings</div></div>
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
                <span className="label">New password</span>
                <input className="input" type="password" placeholder="Leave blank to keep current" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <button className="btn btn-amber" onClick={saveSettings} disabled={settingsSaving} style={{ marginBottom: 12 }}>
                {settingsSaving ? <Spinner size={18} /> : 'Save changes →'}
              </button>
              <button className="btn btn-danger" onClick={signOut} style={{ width: '100%' }}>Sign out</button>
            </div>
          </>
        )}
      </main>

      <BottomNav tabs={TABS} activeTab={tab} onTabChange={setTab} />

      <Modal open={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Video">
        <div className="form-group">
          <span className="label">Title</span>
          <input className="input" placeholder="e.g. Barbell Bench Press" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <span className="label">Category</span>
          <select className="input" value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}>
            {VIDEO_CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <span className="label">Description (optional)</span>
          <textarea className="input" placeholder="Coaching notes..." value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} />
        </div>
        <div className="form-group">
          <span className="label">Video file</span>
          <input type="file" accept="video/*" onChange={e => setUploadFile(e.target.files[0])} style={{ color: 'var(--text2)', fontSize: 13 }} />
        </div>
        <button className="btn btn-amber" onClick={uploadVideo} disabled={uploading || !uploadFile || !uploadTitle}>
          {uploading ? <Spinner size={18} /> : 'Upload →'}
        </button>
      </Modal>

      <Modal open={!!playVideo} onClose={() => setPlayVideo(null)} title={playVideo?.title} wide>
        {playVideo && <video src={playVideo.video_url} controls autoPlay style={{ width: '100%', borderRadius: 10, background: '#000' }} />}
      </Modal>

      <Modal open={showIntakeModal} onClose={() => setShowIntakeModal(false)} title="Intake Form">
        <IntakeSheet intakeForm={clientPanelData.intake} />
      </Modal>

      <Modal open={showDocsModal} onClose={() => setShowDocsModal(false)} title="Signed Documents">
        <DocumentsSheet documents={clientPanelData.docs || []} />
      </Modal>
    </div>
  )
}
