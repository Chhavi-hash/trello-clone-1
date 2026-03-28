import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useMember } from '../context/MemberContext';

export default function Navbar({ boardTitle }) {
  const { members, currentMember, switchMember } = useMember();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <nav className="navbar glass-heavy">
      <div className="navbar-left">
        <button className="nav-icon-btn">▦</button>
        <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'inherit' }}>
          <svg width="22" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="2" width="20" height="20" rx="3" fill="rgba(255,255,255,0.15)"/>
            <rect x="5" y="5" width="6" height="11" rx="1" fill="#fff"/>
            <rect x="13" y="5" width="6" height="7" rx="1" fill="#fff"/>
          </svg>
          <span className="logo-text">Trello</span>
        </Link>
        <div className="nav-dropdown-btn">Workspaces ▾</div>
        <div className="nav-dropdown-btn">Recent ▾</div>
        <div className="nav-dropdown-btn">Starred ▾</div>
        <button className="btn-primary create-btn">Create</button>
      </div>

      <div className="navbar-center">
        <div className="nav-search-wrapper">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search" className="nav-search-input" />
        </div>
      </div>

      <div className="navbar-right">
        <button className="nav-icon-btn" title="Notifications">🔔</button>
        <button className="nav-icon-btn" title="Help">❔</button>
        <button className="nav-icon-btn" title="What's new">⚡</button>

        {currentMember && (
          <div className="member-switcher" ref={dropdownRef}>
            <button
              className="current-member-btn"
              onClick={() => setOpen(o => !o)}
              title={`Signed in as ${currentMember.name}`}
            >
              <img src={currentMember.avatar_url} alt={currentMember.name} className="nav-avatar" />
              <div className="member-status-dot" />
            </button>

            {open && (
              <div className="member-dropdown glass-heavy">
                <div className="dropdown-header" style={{ padding: '12px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={currentMember.avatar_url} alt={currentMember.name} className="nav-avatar" />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{currentMember.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>Active account</div>
                    </div>
                  </div>
                </div>
                <div className="dropdown-label">Switch member</div>
                {members.map(m => (
                  <button
                    key={m.id}
                    className={`dropdown-item${currentMember.id === m.id ? ' active' : ''}`}
                    onClick={() => { switchMember(m); setOpen(false); }}
                  >
                    <img src={m.avatar_url} alt={m.name} className="nav-avatar sm" />
                    <span style={{ flex: 1 }}>{m.name}</span>
                    {currentMember.id === m.id && <span className="check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
