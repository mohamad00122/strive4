import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import Spinner from './components/Spinner'
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import Onboarding from './pages/auth/Onboarding'
import ClientDashboard from './pages/client/Dashboard'
import TrainerDashboard from './pages/trainer/Dashboard'
import TrainerClient from './pages/trainer/Client'
import AdminDashboard from './pages/admin/Dashboard'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="loading-full"><Spinner /></div>
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(profile?.role)) return <Navigate to="/login" replace />
  return children
}

function HomeRedirect() {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="loading-full"><Spinner /></div>
  if (!user) return <Navigate to="/login" replace />
  if (!profile?.onboarded) return <Navigate to="/onboarding" replace />
  if (profile.role === 'client') return <Navigate to="/client" replace />
  if (profile.role === 'trainer') return <Navigate to="/trainer" replace />
  if (profile.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
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
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
