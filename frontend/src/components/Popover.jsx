import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Popover({ anchor, onClose, children, width = 240 }) {
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target) && !anchor?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchor]);

  if (!anchor) return null;
  const rect = anchor.getBoundingClientRect();
  const top = rect.bottom + 8 + window.scrollY;
  let left = rect.left + window.scrollX;
  if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;

  return createPortal(
    <div ref={ref} className="popover" style={{ top, left, width }}>
      {children}
    </div>,
    document.body
  );
}
