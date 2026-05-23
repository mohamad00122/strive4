import { useAuth } from '../lib/AuthContext'
import Avatar from './Avatar'

export default function Sidebar({ tabs, activeTab, onTabChange }) {
  const { profile, signOut } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        S<span>.</span>
      </div>
      <nav className="sidebar-nav">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span style={{ fontSize: 9 }}>{tab.label}</span>
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <Avatar name={profile?.full_name} size="sm" />
        <button className="sidebar-signout" onClick={signOut}>Sign out</button>
      </div>
    </aside>
  )
}
