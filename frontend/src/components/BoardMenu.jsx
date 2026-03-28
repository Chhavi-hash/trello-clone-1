import { useState } from 'react';
import { updateBoard } from '../api';
import { BOARD_COLORS, BOARD_GRADIENTS } from '../constants';

export default function BoardMenu({ board, onClose, onBoardUpdated }) {
  const [view, setView] = useState('main'); // main | background

  const changeBg = async (bg) => {
    const updated = await updateBoard(board.id, { background: bg });
    onBoardUpdated(updated);
  };

  return (
    <div className="board-menu">
      <div className="board-menu-header">
        {view !== 'main' && <button className="icon-btn" onClick={() => setView('main')}>←</button>}
        <span>{view === 'main' ? 'Menu' : 'Change background'}</span>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>
      <div className="board-menu-divider" />

      {view === 'main' && (
        <div className="board-menu-body">
          <button className="menu-item" onClick={() => setView('background')}>
            <span className="menu-item-icon">🎨</span> Change background
          </button>
        </div>
      )}

      {view === 'background' && (
        <div className="board-menu-body">
          <p className="menu-section-label">Colors</p>
          <div className="bg-grid">
            {BOARD_COLORS.map(c => (
              <button key={c} className={`bg-swatch${board.background===c?' sel':''}`}
                style={{ background: c }} onClick={() => changeBg(c)} />
            ))}
          </div>
          <p className="menu-section-label">Gradients</p>
          <div className="bg-grid">
            {BOARD_GRADIENTS.map(g => (
              <button key={g} className={`bg-swatch${board.background===g?' sel':''}`}
                style={{ background: g }} onClick={() => changeBg(g)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
