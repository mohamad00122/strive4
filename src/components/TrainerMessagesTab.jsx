import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Avatar from './Avatar'

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function needsDateHeader(a, b) {
  if (!a) return true
  return new Date(b).getTime() - new Date(a).getTime() > 5 * 60 * 1000
}

export default function TrainerMessagesTab({ clients }) {
  const { user } = useAuth()
  const [selectedClient, setSelectedClient] = useState(null)
  const [messages, setMessages] = useState([])
  const [unreadCounts, setUnreadCounts] = useState({})
  const [conversationPreviews, setConversationPreviews] = useState({})
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!user || !clients.length) return
    fetchUnreadCounts()
    fetchPreviews()

    const channel = supabase.channel('trainer-msgs')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        const msg = payload.new
        if (selectedClient && msg.sender_id === selectedClient.client_id) {
          setMessages(prev => [...prev, msg])
          markRead(selectedClient.client_id)
        } else {
          setUnreadCounts(prev => ({
            ...prev,
            [msg.sender_id]: (prev[msg.sender_id] || 0) + 1
          }))
        }
        setConversationPreviews(prev => ({
          ...prev,
          [msg.sender_id]: { text: msg.content, time: msg.created_at }
        }))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, clients, selectedClient])

  useEffect(() => {
    if (selectedClient) {
      fetchMessages(selectedClient.client_id)
      markRead(selectedClient.client_id)
    }
  }, [selectedClient])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchUnreadCounts = async () => {
    const clientIds = clients.map(c => c.client_id)
    if (!clientIds.length) return
    const { data } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', user.id)
      .eq('read', false)
      .in('sender_id', clientIds)
    if (!data) return
    const counts = {}
    data.forEach(m => { counts[m.sender_id] = (counts[m.sender_id] || 0) + 1 })
    setUnreadCounts(counts)
  }

  const fetchPreviews = async () => {
    const clientIds = clients.map(c => c.client_id)
    if (!clientIds.length) return
    const previews = {}
    for (const cid of clientIds) {
      const { data } = await supabase
        .from('messages')
        .select('content, created_at')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${cid}),and(sender_id.eq.${cid},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .limit(1)
      if (data?.[0]) previews[cid] = { text: data[0].content, time: data[0].created_at }
    }
    setConversationPreviews(previews)
  }

  const fetchMessages = async (clientId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${clientId}),and(sender_id.eq.${clientId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const markRead = async (clientId) => {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', clientId)
      .eq('receiver_id', user.id)
    setUnreadCounts(prev => ({ ...prev, [clientId]: 0 }))
  }

  const sendMessage = async () => {
    if (!text.trim() || !selectedClient || sending) return
    const content = text.trim()
    setText('')
    setSending(true)
    const optimistic = {
      id: 'opt-' + Date.now(),
      sender_id: user.id,
      receiver_id: selectedClient.client_id,
      content,
      created_at: new Date().toISOString(),
      read: false
    }
    setMessages(prev => [...prev, optimistic])
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedClient.client_id,
      content
    })
    setConversationPreviews(prev => ({
      ...prev,
      [selectedClient.client_id]: { text: content, time: new Date().toISOString() }
    }))
    setSending(false)
  }

  const clientName = (c) => c.profiles?.full_name || 'Client'

  return (
    <div className="messages-layout">
      {/* Conversation list */}
      <div className="messages-list">
        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 600, marginBottom: 12 }}>Conversations</div>
        {clients.map(c => {
          const name = clientName(c)
          const preview = conversationPreviews[c.client_id]
          const unread = unreadCounts[c.client_id] || 0
          const isSelected = selectedClient?.client_id === c.client_id
          return (
            <div
              key={c.client_id}
              onClick={() => setSelectedClient(c)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 8px',
                borderRadius: 9,
                cursor: 'pointer',
                background: isSelected ? 'var(--amber-dim)' : 'transparent',
                marginBottom: 2,
                transition: 'background 0.15s'
              }}
            >
              <Avatar name={name} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? 'var(--amber)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {name}
                </div>
                {preview && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                    {preview.text}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                {preview && <div style={{ fontSize: 10, color: 'var(--text3)' }}>{formatDate(preview.time)}</div>}
                {unread > 0 && (
                  <div style={{ background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                    {unread}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {clients.length === 0 && (
          <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', marginTop: 24 }}>No clients yet</div>
        )}
      </div>

      {/* Chat area */}
      {selectedClient ? (
        <div className="messages-chat">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--border)', marginBottom: 12, flexShrink: 0 }}>
            <Avatar name={clientName(selectedClient)} size="md" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{clientName(selectedClient)}</div>
              <div style={{ fontSize: 11, color: 'var(--green)' }}>● Active</div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 8 }}>
            {messages.map((msg, i) => {
              const isSent = msg.sender_id === user.id
              const showHeader = needsDateHeader(messages[i - 1]?.created_at, msg.created_at)
              return (
                <div key={msg.id}>
                  {showHeader && (
                    <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text3)', margin: '8px 0' }}>
                      {formatDate(msg.created_at)} {formatTime(msg.created_at)}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: isSent ? 'flex-end' : 'flex-start' }}>
                    <div className={`msg-bubble ${isSent ? 'msg-bubble-sent' : 'msg-bubble-received'}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
          <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <input
              className="input"
              placeholder="Type a message..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-amber btn-sm"
              onClick={sendMessage}
              disabled={!text.trim() || sending}
              style={{ width: 'auto', flexShrink: 0 }}
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <div className="messages-chat" style={{ alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 14 }}>
          Select a conversation
        </div>
      )}
    </div>
  )
}
