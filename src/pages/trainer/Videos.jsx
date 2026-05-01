import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

const CATEGORIES = ['Chest','Back','Legs','Shoulders','Arms','Core','Cardio','Full Body']

export default function TrainerVideos() {
  const { profile, signOut } = useAuth()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Chest')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => { fetchVideos() }, [])

  const fetchVideos = async () => {
    const { data } = await supabase
      .from('videos')
      .select('*')
      .eq('trainer_id', profile.id)
      .order('created_at', { ascending: false })
    setVideos(data || [])
    setLoading(false)
  }

  const uploadVideo = async () => {
    if (!title || !file) return setError('Please add a title and select a video file.')
    setUploading(true)
    setError('')
    const ext = file.name.split('.').pop()
    const fileName = `${profile.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('videos').upload(fileName, file)
    if (uploadError) { setError(uploadError.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(fileName)
    await supabase.from('videos').insert({
      trainer_id: profile.id, title, category, description, video_url: publicUrl
    })
    setTitle(''); setCategory('Chest'); setDescription(''); setFile(null); setShowAdd(false)
    fetchVideos()
    setUploading(false)
  }

  const deleteVideo = async (video) => {
    if (!confirm(`Delete "${video.title}"?`)) return
    const path = video.video_url.split('/videos/')[1]
    await supabase.storage.from('videos').remove([path])
    await supabase.from('videos').delete().eq('id', video.id)
    fetchVideos()
  }

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '??'
  const filtered = filter === 'All' ? videos : videos.filter(v => v.category === filter)
  const categories = ['All', ...CATEGORIES]

  return (
    <div className="app-layout">
      <div className="sidebar">
        <div className="sidebar-logo">Strive<span>.</span></div>
        <nav className="sidebar-nav">
          <Link to="/trainer" className="nav-item"><div className="nav-dot" />My Clients</Link>
          <div className="nav-item active"><div className="nav-dot" />Video Library</div>
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">{initials(profile?.full_name)}</div>
          <div className="sidebar-footer-name">{profile?.full_name}</div>
          <button className="signout-btn" onClick={signOut}>Sign out</button>
        </div>
      </div>

      <div className="mobile-header">
        <div className="mobile-logo">Strive<span>.</span></div>
        <div className="avatar">{initials(profile?.full_name)}</div>
      </div>

      <main className="main-content">
        <div className="page-title">Video Library</div>
        <div className="page-sub">{videos.length} video{videos.length !== 1 ? 's' : ''} uploaded</div>

        <div className="add-btn" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '✕ Cancel' : '+ Upload new video'}
        </div>

        {showAdd && (
          <div className="card" style={{marginBottom:'16px'}}>
            <div style={{fontFamily:'var(--font-head)', fontSize:'15px', fontWeight:'700', marginBottom:'16px'}}>Upload video</div>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-group" style={{marginBottom:'10px'}}>
              <span className="label">Exercise title</span>
              <input className="input" placeholder="e.g. Barbell Back Squat" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="form-group" style={{marginBottom:'10px'}}>
              <span className="label">Category</span>
              <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{marginBottom:'10px'}}>
              <span className="label">Form notes (optional)</span>
              <input className="input" placeholder="Key coaching cues..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="form-group" style={{marginBottom:'16px'}}>
              <span className="label">Video file (MP4)</span>
              <input type="file" accept="video/*" className="input" style={{padding:'10px'}}
                onChange={e => setFile(e.target.files[0])} />
            </div>
            <button className="btn btn-primary" onClick={uploadVideo} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload video →'}
            </button>
          </div>
        )}

        <div style={{display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'16px'}}>
          {categories.map(c => (
            <div key={c} onClick={() => setFilter(c)}
              style={{padding:'6px 14px', borderRadius:'20px', fontSize:'12px', cursor:'pointer', fontFamily:'var(--font-head)', fontWeight:'600',
                background: filter === c ? 'var(--accent)' : 'var(--surface2)',
                color: filter === c ? '#fff' : 'var(--text3)',
                border: `0.5px solid ${filter === c ? 'var(--accent)' : 'var(--border2)'}`,
                transition:'all 0.2s'}}>
              {c}
            </div>
          ))}
        </div>

        {loading ? <div className="loading" style={{minHeight:'200px'}}><div className="spinner" /></div> : (
          filtered.length === 0 ? (
            <div className="card" style={{textAlign:'center', padding:'40px'}}>
              <div style={{fontSize:'32px', marginBottom:'12px'}}>🎬</div>
              <div style={{fontFamily:'var(--font-head)', fontSize:'16px', fontWeight:'600', marginBottom:'6px'}}>No videos yet</div>
              <div style={{fontSize:'13px', color:'var(--text3)'}}>Upload your first exercise demo video</div>
            </div>
          ) : filtered.map(v => (
            <div key={v.id} className="card" style={{marginBottom:'9px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                <div style={{width:'60px', height:'42px', background:'#03030c', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', border:'0.5px solid rgba(91,140,255,0.12)', flexShrink:0}}>
                  <div style={{width:0, height:0, borderTop:'6px solid transparent', borderBottom:'6px solid transparent', borderLeft:'10px solid var(--accent)', marginLeft:'2px'}} />
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontFamily:'var(--font-head)', fontSize:'14px', fontWeight:'600', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{v.title}</div>
                  <div style={{fontSize:'11px', color:'var(--accent)', marginTop:'3px'}}>{v.category}</div>
                </div>
                <div style={{display:'flex', gap:'6px', flexShrink:0}}>
                  <a href={v.video_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">View</a>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteVideo(v)}>Delete</button>
                </div>
              </div>
              {v.description && <div style={{fontSize:'12px', color:'var(--text2)', marginTop:'10px', paddingTop:'10px', borderTop:'0.5px solid var(--border)'}}>{v.description}</div>}
            </div>
          ))
        )}
      </main>

      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          <Link to="/trainer" className="mobile-nav-item">
            <div className="mobile-nav-dot" />Clients
          </Link>
          <div className="mobile-nav-item active">
            <div className="mobile-nav-dot" />Videos
          </div>
          <div className="mobile-nav-item" onClick={signOut}>
            <div className="mobile-nav-dot" />Sign out
          </div>
        </div>
      </nav>
    </div>
  )
}