import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import SignUp from './pages/auth/SignUp'
import Login from './pages/auth/Login'
import Onboarding from './pages/auth/Onboarding'
import ClientDashboard from './pages/client/Dashboard'
import TrainerDashboard from './pages/trainer/Dashboard'
import TrainerClient from './pages/trainer/Client'
import TrainerVideos from './pages/trainer/Videos'
import AdminDashboard from './pages/admin/Dashboard'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" />
  if (allowedRoles && !allowedRoles.includes(profile?.role)) return <Navigate to="/login" />
  return children
}

export default function App() {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="loading"><div className="spinner" /></div>

  const getHome = () => {
    if (!user) return <Navigate to="/login" />
    if (!profile?.onboarded) return <Navigate to="/onboarding" />
    if (profile?.role === 'client') return <Navigate to="/client" />
    if (profile?.role === 'trainer') return <Navigate to="/trainer" />
    if (profile?.role === 'admin') return <Navigate to="/admin" />
    return <Navigate to="/login" />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={getHome()} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={
          <ProtectedRoute><Onboarding /></ProtectedRoute>
        } />
        <Route path="/client" element={
          <ProtectedRoute allowedRoles={['client']}><ClientDashboard /></ProtectedRoute>
        } />
        <Route path="/trainer" element={
          <ProtectedRoute allowedRoles={['trainer']}><TrainerDashboard /></ProtectedRoute>
        } />
        <Route path="/trainer/client/:clientId" element={
          <ProtectedRoute allowedRoles={['trainer']}><TrainerClient /></ProtectedRoute>
        } />
        <Route path="/trainer/videos" element={
          <ProtectedRoute allowedRoles={['trainer']}><TrainerVideos /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}