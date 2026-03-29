import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMember } from '../context/MemberContext';
import { getBoards } from '../api';

export default function Navbar({ boardTitle, onFilter }) {
  const { members, currentMember, switchMember } = useMember();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [allBoards, setAllBoards] = useState([]);
  const dropdownRef = useRef();
  const searchRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  useEffect(() => {
    if (!currentMember) return;
    getBoards(currentMember.id).then(setAllBoards).catch(() => {});
  }, [currentMember]);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); setShowResults(false); return; }
    const q = search.toLowerCase();
    const results = allBoards.filter(b => b.title.toLowerCase().includes(q));
    setSearchResults(results);
    setShowResults(true);
  }, [search, allBoards]);

  useEffect(() => {
    if (!showResults) return;
    const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showResults]);

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
        <div className="nav-search-wrapper" ref={searchRef} style={{ position: 'relative' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search boards…"
            className="nav-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => { if (searchResults.length) setShowResults(true); }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setShowResults(false); }}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', fontSize: 14 }}>✕</button>
          )}
          {showResults && (
            <div style={{
              position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 999,
              background: '#2c333a', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', overflow: 'hidden'
            }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: '12px 16px', color: 'var(--text-sub)', fontSize: 13 }}>No boards found</div>
              ) : (
                searchResults.map(b => (
                  <button key={b.id} onClick={() => { navigate(`/board/${b.id}`); setSearch(''); setShowResults(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '10px 14px', background: 'none', border: 'none',
                      color: 'var(--text-main)', cursor: 'pointer', fontSize: 14, textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <div style={{ width: 28, height: 20, borderRadius: 4, flexShrink: 0,
                      background: b.bg_type === 'image' ? `url(${b.bg_value}) center/cover` : b.bg_value }} />
                    <span>{b.title}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="navbar-right">
        <button className="nav-icon-btn" title="Notifications">🔔</button>
        <button className="nav-icon-btn" title="Help">❔</button>
        <button className="nav-icon-btn" title="What's new">⚡</button>

        {currentMember && (
          <div className="member-switcher" ref={dropdownRef}>
            <button className="current-member-btn" onClick={() => setOpen(o => !o)} title={`Signed in as ${currentMember.name}`}>
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
                  <button key={m.id} className={`dropdown-item${currentMember.id === m.id ? ' active' : ''}`}
                    onClick={() => { switchMember(m); setOpen(false); }}>
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