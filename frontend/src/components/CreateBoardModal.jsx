import { useState } from 'react';
import { createBoard } from '../api';
import { BOARD_COLORS, BOARD_GRADIENTS, BOARD_IMAGES } from '../constants';

export default function CreateBoardModal({ onClose, onCreated, memberId }) {
  const [title, setTitle] = useState('');
  const [bgType, setBgType] = useState('image');
  const [bgValue, setBgValue] = useState(BOARD_IMAGES[0]);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Title is required');
    if (title.trim().length > 100) return setError('Title max 100 chars');
    try {
      const board = await createBoard({ title: title.trim(), bg_type: bgType, bg_value: bgValue, member_id: memberId || null });
      if (board?.error) return setError(board.error.message);
      onCreated(board);
    } catch (err) {
      setError(err.message || 'API Error: Could not reach the server');
    }
  };

  const pickBg = (val, type) => { setBgValue(val); setBgType(type); };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal-box create-board-modal glass-heavy" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>Create board</span>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="board-preview" style={{ 
            background: bgType === 'image' ? `url(${bgValue}) center/cover` : bgValue 
          }}>
            <img src="https://trello.com/assets/14cda5ed865d1407694b.svg" alt="Preview Frame" />
          </div>

          <div className="bg-selector-group">
            <div className="bg-selector-label">Background</div>
            <div className="bg-grid">
              {BOARD_IMAGES.slice(0, 4).map(img => (
                <button key={img} className={`bg-swatch${bgValue===img?' sel':''}`} 
                  style={{ backgroundImage: `url(${img})` }} onClick={() => pickBg(img, 'image')} />
              ))}
              {BOARD_GRADIENTS.slice(0, 4).map(grad => (
                <button key={grad} className={`bg-swatch${bgValue===grad?' sel':''}`} 
                  style={{ background: grad }} onClick={() => pickBg(grad, 'gradient')} />
              ))}
            </div>
          </div>

          <form onSubmit={submit}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="field-label">Board title <span className="req">*</span></label>
              <input autoFocus maxLength={100} placeholder="e.g. Sales Pipeline" value={title} 
                onChange={e => { setTitle(e.target.value); setError(''); }} />
              {error && <p className="field-error">{error}</p>}
            </div>

            <button type="submit" className="btn-primary full" disabled={!title.trim()}>Create</button>
          </form>

          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-sub)', textAlign: 'center' }}>
            By using images from Unsplash, you agree to their license and terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
