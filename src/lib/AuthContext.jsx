import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const user = session?.user ?? null

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
    await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', userId)
  }

  const refreshProfile = async () => {
    if (!user) return
    await fetchProfile(user.id)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
