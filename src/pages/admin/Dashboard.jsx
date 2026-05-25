import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import StatTile from '../../components/StatTile'
import Spinner from '../../components/Spinner'
import { IconUsers, IconBarbell, IconAlertTriangle, IconPlus, IconTrash } from '@tabler/icons-react'

const SECTIONS = {
  crm: ['Overview', 'Revenue'],
  people: ['Trainers', 'Clients', 'Documents'],
  platform: ['Settings'],
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export default function AdminDashboard() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const [section, setSection] = useState('Overview')
  const [loading, setLoading] = useState(true)

  const [trainers, setTrainers] = useState([])
  const [clients, setClients] = useState([])
  const [documents, setDocuments] = useState([])
  const [activityLog, setActivityLog] = useState([])
  const [clientRelationships, setClientRelationships] = useState([])

  const [clientSearch, setClientSearch] = useState('')
  const [clientFilter, setClientFilter] = useState('All')
  const [trainerExpanded, setTrainerExpanded] = useState({})

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createRole, setCreateRole] = useState('trainer')
  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createTrainerId, setCreateTrainerId] = useState('')
  const [creating, setCreating] = useState(false)
  const [createSuccess, setCreateSuccess] = useState('')
  const [createError, setCreateError] = useState('')

  const [showDocModal, setShowDocModal] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)

  const [showClientModal, setShowClientModal] = useState(false)
  const [selectedClientProfile, setSelectedClientProfile] = useState(null)

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [newPassword, setNewPassword] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState('')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    const { data: trainersData } = await supabase.from('profiles').select('*').eq('role', 'trainer')
    const { data: clientsData } = await supabase.from('profiles').select('*').eq('role', 'client')
    const { data: clientRelData } = await supabase.from('clients').select('*')
    const [docsRes, activityRes] = await Promise.all([
      supabase.from('signed_documents').select('*, client:profiles!signed_documents_client_id_fkey(full_name)').order('signed_at', { ascending: false }),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(20),
    ])
    setTrainers(trainersData || [])
    const clientsWithStatus = (clientsData || []).map(c => ({
      ...c,
      clientRow: (clientRelData || []).find(r => r.client_id === c.id)
    }))
    setClients(clientsWithStatus)
    setClientRelationships(clientRelData || [])
    setDocuments(docsRes.data || [])
    setActivityLog(activityRes.data || [])
    setLoading(false)
  }

  const createAccount = async () => {
    if (!createName || !createEmail || !createPassword) {
      setCreateError('Please fill all fields.')
      return
    }
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          full_name: createName,
          email: createEmail,
          password: createPassword,
          role: createRole,
          trainer_id: createRole === 'client' ? createTrainerId || null : null,
        })
      })
      const data = await res.json()
      if (data.error) { setCreateError(data.error); setCreating(false); return }
      setCreateSuccess(`Account created: ${createEmail}`)
      setCreateName(''); setCreateEmail(''); setCreatePassword(''); setCreateTrainerId('')
      await loadAll()
    } catch (e) {
      setCreateError(e.message)
    }
    setCreating(false)
  }

  const deleteAccount = async (userId) => {
    if (!window.confirm('Delete this account? This cannot be undone.')) return
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ user_id: userId })
      })
      await loadAll()
    } catch (e) {
      console.error(e)
    }
  }

  const saveSettings = async () => {
    setSettingsSaving(true)
    await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
    if (newPassword) await supabase.auth.updateUser({ password: newPassword })
    await refreshProfile()
    setSettingsMsg('Saved!')
    setSettingsSaving(false)
    setTimeout(() => setSettingsMsg(''), 2500)
  }

  const inactiveClients = clients.filter(c => c.last_seen && (Date.now() - new Date(c.last_seen).getTime()) / 86400000 > 14)

  const filteredClients = clients.filter(c => {
    const name = c.full_name?.toLowerCase() || ''
    const matchSearch = name.includes(clientSearch.toLowerCase())
    const status = c.clientRow?.status || 'active'
    const matchFilter = clientFilter === 'All' || clientFilter.toLowerCase() === status
    return matchSearch && matchFilter
  })

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={36} /></div>

  return (
    <div className="admin-layout">
      {/* Admin sidebar */}
      <aside className="admin-sidebar">
        <div style={{ padding: '0 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800 }}>Strive<span style={{ color: 'var(--amber)' }}>.</span></div>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>Admin</div>
        </div>

        {Object.entries(SECTIONS).map(([sectionKey, items]) => (
          <div key={sectionKey}>
            <div className="admin-nav-section">{sectionKey}</div>
            {items.map(item => (
              <div key={item} className={`admin-nav-item ${section === item ? 'active' : ''}`} onClick={() => setSection(item)}>
                {item}
              </div>
            ))}
          </div>
        ))}

        <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar name={profile?.full_name} email={profile?.email} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name}</div>
            </div>
          </div>
          <button onClick={signOut} style={{ marginTop: 8, width: '100%', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 11, textAlign: 'left', padding: '4px 0' }}>
            Sign out →
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="admin-content">

        {/* OVERVIEW */}
        {section === 'Overview' && (
          <>
            <div className="page-header"><div className="page-title">Overview</div></div>

            <div className="stat-grid">
              <StatTile number="$0" label="Revenue" color="var(--amber)" />
              <StatTile number={clients.length} label="Total clients" />
              <StatTile number={trainers.length} label="Trainers" />
              <StatTile number={inactiveClients.length} label="Alerts" color={inactiveClients.length > 0 ? 'var(--red)' : 'var(--text)'} />
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
                  <div key={c.id} style={{ fontSize: 12, color: 'var(--amber-text)', marginBottom: 2 }}>· {c.full_name}</div>
                ))}
              </div>
            )}

            {/* Trainer performance */}
            <div className="section-title" style={{ marginBottom: 10 }}>Trainer Performance</div>
            {trainers.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <Avatar name={t.full_name} size="sm" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.full_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{clientRelationships.filter(r => r.trainer_id === t.id).length} clients</div>
                </div>
                <div style={{ width: 80 }}>
                  <div className="compliance-bar">
                    <div className="compliance-bar-fill" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
            ))}

            {/* Activity feed */}
            {activityLog.length > 0 && (
              <>
                <div className="section-title" style={{ marginTop: 20, marginBottom: 10 }}>Recent Activity</div>
                {activityLog.map(a => (
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

            {/* Quick actions */}
            <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-amber btn-sm" onClick={() => setShowCreateModal(true)}>
                <IconPlus size={14} /> Create Account
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSection('Clients')}>
                <IconUsers size={14} /> View Clients
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSection('Trainers')}>
                <IconBarbell size={14} /> View Trainers
              </button>
            </div>
          </>
        )}

        {/* REVENUE */}
        {section === 'Revenue' && (
          <>
            <div className="page-header"><div className="page-title">Revenue</div></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 24 }}>
              {['MRR', 'ARR', 'Total Earned', 'Active Subs'].map(label => (
                <StatTile key={label} number="$0" label={label} color="var(--amber)" />
              ))}
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💳</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Stripe Integration Coming Soon</div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>Revenue tracking and billing will be available in a future update.</div>
            </div>
          </>
        )}

        {/* TRAINERS */}
        {section === 'Trainers' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div className="page-title">Trainers ({trainers.length})</div>
              <button className="btn btn-amber btn-sm" onClick={() => { setCreateRole('trainer'); setShowCreateModal(true) }}>
                <IconPlus size={14} /> New Trainer
              </button>
            </div>

            {trainers.map(t => (
              <div key={t.id}>
                <div onClick={() => setTrainerExpanded(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer', marginBottom: trainerExpanded[t.id] ? 0 : 6,
                    background: trainerExpanded[t.id] ? 'var(--amber-dim)' : 'var(--bg1)',
                    border: `1px solid ${trainerExpanded[t.id] ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                    borderRadius: trainerExpanded[t.id] ? '10px 10px 0 0' : 10, transition: 'all 0.15s' }}>
                  <Avatar name={t.full_name} size="md" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.full_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.email} · {clientRelationships.filter(r => r.trainer_id === t.id).length} clients</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteAccount(t.id) }} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4 }}>
                    <IconTrash size={14} />
                  </button>
                </div>

                {trainerExpanded[t.id] && (
                  <div style={{ background: 'var(--bg2)', border: '1px solid rgba(245,158,11,0.3)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: 14, marginBottom: 6 }}>
                    <div className="section-title" style={{ marginBottom: 8 }}>Clients</div>
                    {clientRelationships.filter(r => r.trainer_id === t.id).map(r => {
                      const c = clients.find(cl => cl.id === r.client_id)
                      return c ? (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <Avatar name={c.full_name} size="sm" />
                          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{c.full_name}</span>
                        </div>
                      ) : null
                    })}
                    {clientRelationships.filter(r => r.trainer_id === t.id).length === 0 && (
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>No clients assigned yet.</div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {trainers.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontSize: 13 }}>No trainers yet.</div>}
          </>
        )}

        {/* CLIENTS */}
        {section === 'Clients' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="page-title">Clients ({clients.length})</div>
              <button className="btn btn-amber btn-sm" onClick={() => { setCreateRole('client'); setShowCreateModal(true) }}>
                <IconPlus size={14} /> New Client
              </button>
            </div>

            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input className="input" placeholder="Search clients..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} style={{ paddingLeft: 12 }} />
            </div>

            <div className="chip-bar">
              {['All', 'Active', 'Inactive'].map(f => (
                <div key={f} className={`chip ${clientFilter === f ? 'active' : ''}`} onClick={() => setClientFilter(f)}>{f}</div>
              ))}
            </div>

            {filteredClients.map(c => (
              <div key={c.id} onClick={() => { setSelectedClientProfile(c); setShowClientModal(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer', marginBottom: 6,
                  background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 10, transition: 'all 0.15s' }}>
                <Avatar name={c.full_name} size="md" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.full_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    Trainer: {trainers.find(t => t.id === c.clientRow?.trainer_id)?.full_name || 'Unassigned'} ·
                    Last seen: {c.last_seen ? new Date(c.last_seen).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'never'}
                  </div>
                </div>
                <Badge variant={c.clientRow?.status === 'inactive' ? 'red' : 'green'}>
                  {c.clientRow?.status || 'active'}
                </Badge>
              </div>
            ))}

            {filteredClients.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontSize: 13 }}>No clients found.</div>}
          </>
        )}

        {/* DOCUMENTS */}
        {section === 'Documents' && (
          <>
            <div className="page-header"><div className="page-title">Signed Documents</div></div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Client', 'Document Type', 'Signed As', 'Date'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id} onClick={() => { setSelectedDoc(doc); setShowDocModal(true) }}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '10px 12px', color: 'var(--text)' }}>{doc.client?.full_name || '—'}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>
                        {doc.document_type === 'liability_waiver' ? 'Liability Waiver' : 'Training Contract'}
                      </td>
                      <td style={{ padding: '10px 12px', fontStyle: 'italic', color: 'var(--amber)' }}>{doc.signed_name || '—'}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text3)' }}>
                        {new Date(doc.signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {documents.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontSize: 13 }}>No signed documents yet.</div>}
            </div>
          </>
        )}

        {/* SETTINGS */}
        {section === 'Settings' && (
          <>
            <div className="page-header"><div className="page-title">Platform Settings</div></div>
            <div style={{ maxWidth: 420 }}>
              {settingsMsg && <div className="success-msg">{settingsMsg}</div>}
              <div className="form-group">
                <span className="label">Full name</span>
                <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} />
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
      </div>

      {/* Create Account Modal */}
      <Modal open={showCreateModal} onClose={() => { setShowCreateModal(false); setCreateSuccess(''); setCreateError('') }} title="Create Account">
        {createSuccess ? (
          <div>
            <div className="success-msg">{createSuccess}</div>
            <button className="btn btn-amber" onClick={() => { setShowCreateModal(false); setCreateSuccess('') }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 6, background: 'var(--bg2)', borderRadius: 9, padding: 4, marginBottom: 16 }}>
              {['trainer', 'client', 'admin'].map(r => (
                <button key={r} onClick={() => setCreateRole(r)}
                  style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize', background: createRole === r ? 'var(--amber)' : 'transparent', color: createRole === r ? '#000' : 'var(--text3)', transition: 'all 0.15s' }}>
                  {r}
                </button>
              ))}
            </div>
            {createError && <div className="error-msg">{createError}</div>}
            <div className="form-group">
              <span className="label">Full name</span>
              <input className="input" placeholder="Full name" value={createName} onChange={e => setCreateName(e.target.value)} />
            </div>
            <div className="form-group">
              <span className="label">Email</span>
              <input className="input" type="email" placeholder="email@example.com" value={createEmail} onChange={e => setCreateEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <span className="label">Password</span>
              <input className="input" type="password" placeholder="Password (min 6 chars)" value={createPassword} onChange={e => setCreatePassword(e.target.value)} />
            </div>
            {createRole === 'client' && (
              <div className="form-group">
                <span className="label">Assign trainer</span>
                <select className="input" value={createTrainerId} onChange={e => setCreateTrainerId(e.target.value)}>
                  <option value="">No trainer</option>
                  {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
            )}
            <button className="btn btn-amber" onClick={createAccount} disabled={creating}>
              {creating ? <Spinner size={18} /> : 'Create Account →'}
            </button>
          </>
        )}
      </Modal>

      {/* Document detail modal */}
      <Modal open={showDocModal} onClose={() => setShowDocModal(false)} title="Document Details">
        {selectedDoc && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <div className="section-title">Document</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {selectedDoc.document_type === 'liability_waiver' ? 'Liability Waiver' : 'Training Contract'}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div className="section-title">Client</div>
              <div style={{ fontSize: 14 }}>{selectedDoc.client?.full_name || '—'}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div className="section-title">Signed as</div>
              <div style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--amber)' }}>{selectedDoc.signed_name || '—'}</div>
            </div>
            <div>
              <div className="section-title">Date</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                {new Date(selectedDoc.signed_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Client detail modal */}
      <Modal open={showClientModal} onClose={() => setShowClientModal(false)} title="Client Details">
        {selectedClientProfile && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Avatar name={selectedClientProfile.full_name} size="lg" />
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800 }}>{selectedClientProfile.full_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{selectedClientProfile.email}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
              Trainer: {trainers.find(t => t.id === selectedClientProfile.clientRow?.trainer_id)?.full_name || 'Unassigned'}
            </div>
            <button className="btn btn-danger" onClick={() => { deleteAccount(selectedClientProfile.id); setShowClientModal(false) }} style={{ width: '100%' }}>
              <IconTrash size={14} /> Delete Account
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
