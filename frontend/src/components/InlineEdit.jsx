import { useState, useRef, useEffect } from 'react';

/**
 * Inline editable text — click to edit, blur/Enter to save
 */
export default function InlineEdit({ value, onSave, className = '', tag: Tag = 'span', multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const ref = useRef();

  useEffect(() => { setVal(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  const save = () => { setEditing(false); if (val.trim() && val !== value) onSave(val.trim()); else setVal(value); };

  if (!editing) return (
    <Tag className={className} onClick={() => setEditing(true)}>{value}</Tag>
  );

  if (multiline) return (
    <textarea ref={ref} className={className + ' editing'} value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={save}
      onKeyDown={e => { if (e.key === 'Escape') { setEditing(false); setVal(value); } }} />
  );

  return (
    <input ref={ref} className={className + ' editing'} value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={save}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setVal(value); } }} />
  );
}
