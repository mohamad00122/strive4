export default function BottomNav({ tabs, activeTab, onTabChange }) {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-items">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`bottom-nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="bottom-nav-icon">{tab.icon}</span>
            <span className="bottom-nav-dot" />
          </div>
        ))}
      </div>
    </nav>
  )
}
