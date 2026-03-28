const switches = [
  { icon: '📥', label: 'Inbox', active: false },
  { icon: '📅', label: 'Planner', active: false },
  { icon: '📋', label: 'Board', active: true },
  { icon: '🔀', label: 'Switch boards', active: false },
];

export default function BottomNav() {
  return (
    <div className="bottom-nav-container">
      <nav className="bottom-switcher-bar glass-heavy">
        {switches.map((item, i) => (
          <button key={item.label} className={`bottom-switch-item${item.active ? ' active' : ''}`}>
            <span className="bottom-switch-icon">{item.icon}</span>
            <span className="bottom-switch-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
