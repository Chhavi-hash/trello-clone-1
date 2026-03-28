import { useState, useRef } from 'react';
import { createList } from '../api';

export default function AddList({ boardId, onAdded }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const list = await createList({ board_id: boardId, title, position: Date.now() });
    onAdded(list);
    setTitle('');
  };

  if (!open) return (
    <button className="add-list-trigger" onClick={() => setOpen(true)}>
      <span>+</span> Add another list
    </button>
  );

  return (
    <div className="add-list-form">
      <input autoFocus placeholder="Enter list title…" value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setTitle(''); } }} />
      <div className="form-row">
        <button className="btn-primary" onClick={submit} disabled={!title.trim()}>Add list</button>
        <button className="icon-btn" onClick={() => { setOpen(false); setTitle(''); }}>✕</button>
      </div>
    </div>
  );
}
