import { useState, useRef, useEffect } from 'react';
import { createCard } from '../api';

export default function AddCard({ listId, onAdded }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const ref = useRef();

  useEffect(() => { if (open && ref.current) ref.current.focus(); }, [open]);

  const submit = async () => {
    if (!title.trim()) return;
    const card = await createCard({ list_id: listId, title, position: Date.now() });
    onAdded({ ...card, labels: [], members: [] });
    setTitle('');
    ref.current?.focus();
  };

  if (!open) return (
    <button className="add-card-trigger" onClick={() => setOpen(true)}>
      <span>+</span> Add a card
    </button>
  );

  return (
    <div className="add-card-form">
      <textarea ref={ref} placeholder="Enter a title for this card…" value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          if (e.key === 'Escape') { setOpen(false); setTitle(''); }
        }} />
      <div className="form-row">
        <button className="btn-primary" onClick={submit} disabled={!title.trim()}>Add card</button>
        <button className="icon-btn" onClick={() => { setOpen(false); setTitle(''); }}>✕</button>
      </div>
    </div>
  );
}
