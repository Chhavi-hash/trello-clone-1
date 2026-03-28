import { useState } from 'react';
import { Link } from 'react-router-dom';

const navItems = [
  { icon: '🏠', label: 'Home', path: '/' },
  { icon: '📅', label: 'Planner', path: '#' },
  { icon: '📥', label: 'Inbox', path: '#', badge: 3 },
  { icon: '📈', label: 'Reports', path: '#' },
];

const workspaceItems = [
  { icon: '📋', label: 'Boards', id: 'boards' },
  { icon: '👤', label: 'Members', id: 'members' },
  { icon: '⚙️', label: 'Settings', id: 'settings' },
];

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState('boards');

  return (
    <aside className="app-sidebar glass">
      <div className="sidebar-section">
        {navItems.map(item => (
          <Link key={item.label} to={item.path} className="sidebar-item">
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
            {item.badge && <span className="sidebar-badge">{item.badge}</span>}
          </Link>
        ))}
      </div>
      
      <div className="sidebar-divider" />
      
      <div className="sidebar-section">
        <div className="sidebar-heading">Workspace</div>
        {workspaceItems.map(item => (
          <button 
            key={item.id} 
            type="button"
            className={`sidebar-item${activeTab === item.id ? ' active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="promo-box">
          <div className="promo-icon">💡</div>
          <div className="promo-text">NEW: Consolidate your to-dos</div>
          <button className="promo-close" type="button">×</button>
        </div>
      </div>
    </aside>
  );
}
