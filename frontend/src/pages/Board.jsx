import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, pointerWithin, rectIntersection, getFirstCollision,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove,
  horizontalListSortingStrategy, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBoard, updateBoard, createList, updateList, reorderList, deleteList, createCard, moveCard, deleteCard } from '../api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import CardModal from '../components/CardModal';
import { useMember } from '../context/MemberContext';
import { BOARD_COLORS, BOARD_GRADIENTS, BOARD_IMAGES } from '../constants';

export default function Board() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentMember } = useMember();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState({}); // { listId: [card] }
  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editBoardTitle, setEditBoardTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState('');
  const [starred, setStarred] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    getBoard(id).then(data => {
      setBoard(data);
      setBoardTitle(data.title);
      setLists(data.lists);
      const byList = {};
      data.lists.forEach(l => { byList[l.id] = []; });
      data.cards.forEach(c => { if (byList[c.list_id]) byList[c.list_id].push(c); });
      setCards(byList);
    });
  }, [id]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const findContainer = (id) => {
    if (lists.find(l => `list-${l.id}` === id)) return id;
    const list = lists.find(l => (cards[l.id] || []).some(c => `card-${c.id}` === id));
    return list ? `list-${list.id}` : null;
  };

  const onDragOver = ({ active, over }) => {
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    const actIdNum = active.data.current.id;
    const overIdNum = over.data.current.id;
    const actListId = parseInt(activeContainer.replace('list-', ''));
    const overListId = parseInt(overContainer.replace('list-', ''));

    setCards(prev => {
      const activeItems = prev[actListId] || [];
      const overItems = prev[overListId] || [];
      
      const activeIndex = activeItems.findIndex(c => c.id === actIdNum);
      const overIndex = over.data.current.type === 'list' 
        ? overItems.length 
        : overItems.findIndex(c => c.id === overIdNum);

      let newIndex;
      if (overIndex in overItems) {
        newIndex = overIndex;
      } else {
        newIndex = overItems.length;
      }

      const movedCard = activeItems[activeIndex];
      if (!movedCard) return prev;

      return {
        ...prev,
        [actListId]: activeItems.filter(c => c.id !== actIdNum),
        [overListId]: [
          ...overItems.slice(0, newIndex),
          { ...movedCard, list_id: overListId },
          ...overItems.slice(newIndex)
        ]
      };
    });
  };

  const onDragStart = ({ active }) => {
    setActiveId(active.data.current?.id);
    setActiveType(active.data.current?.type);
  };

  const onDragEnd = ({ active, over, cancelled }) => {
    setActiveId(null);
    setActiveType(null);
    if (!over || cancelled) return;

    const type = active.data.current?.type;
    const activeIdNum = active.data.current?.id;
    const overIdNum = over.data.current?.id;
    const overType = over.data.current?.type;

    if (type === 'list') {
      const oldIdx = lists.findIndex(l => l.id === activeIdNum);
      const newIdx = lists.findIndex(l => l.id === overIdNum);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        setLists(prev => arrayMove(prev, oldIdx, newIdx));
        reorderList(activeIdNum, { newPosition: newIdx + 1 });
      }
      return;
    }

    if (type === 'card') {
      const activeId = active.id;
      const overId = over.id;
      const activeContainer = findContainer(activeId);
      const overContainer = findContainer(overId);

      if (!activeContainer || !overContainer) return;

      const actListId = parseInt(activeContainer.replace('list-', ''));
      const overListId = parseInt(overContainer.replace('list-', ''));
      const listCards = cards[overListId] || [];
      
      const oldIdx = listCards.findIndex(c => c.id === activeIdNum);
      const newIdx = overType === 'list' 
        ? listCards.length - 1 
        : listCards.findIndex(c => c.id === overIdNum);

      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        const reordered = arrayMove(listCards, oldIdx, newIdx);
        setCards(prev => ({ ...prev, [overListId]: reordered }));
        moveCard(activeIdNum, { newListId: overListId, newPosition: Math.max(0, newIdx) + 1, performed_by: currentMember?.id });
      } else if (oldIdx !== -1 || activeContainer !== overContainer) {
        // Position might be same but list changed, or dropped on list container
        moveCard(activeIdNum, { newListId: overListId, newPosition: Math.max(0, newIdx) + 1, performed_by: currentMember?.id });
      }
    }
  };

  const collisionDetectionStrategy = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return closestCorners(args);
  }, []);

  const listIds = useMemo(() => lists.map(l => `list-${l.id}`), [lists]);

  const handleCardUpdated = (updated) => {
    setCards(prev => {
      const next = {};
      Object.keys(prev).forEach(lid => { next[lid] = prev[lid].filter(c => c.id !== updated.id); });
      const lid = updated.list_id;
      if (next[lid]) next[lid] = [...next[lid], updated].sort((a, b) => a.position - b.position);
      return next;
    });
  };

  const activeCard = activeType === 'card' ? Object.values(cards).flat().find(c => c.id === activeId) : null;
  const activeList = activeType === 'list' ? lists.find(l => l.id === activeId) : null;
  const selectedCard = selectedCardId ? Object.values(cards).flat().find(c => c.id === selectedCardId) : null;
  const selectedListTitle = selectedCard ? lists.find(l => l.id === selectedCard.list_id)?.title : '';

  if (!board) return <div className="board-loading"><div className="spinner" /></div>;

  return (
    <div className="app-container" style={{ 
      background: board.bg_type === 'image' ? `url(${board.bg_value}) center/cover fixed` : board.bg_value 
    }}>
      <Navbar boardTitle={board.title} />
      
      <div className="app-body">
        <Sidebar />
        
        <main className="board-page">
          <div className="board-header">
            <div className="bh-left">
              {editBoardTitle
                ? <input className="board-title-input" autoFocus value={boardTitle}
                    onChange={e => setBoardTitle(e.target.value)}
                    onBlur={() => { setEditBoardTitle(false); if (boardTitle.trim()) { updateBoard(id, { title: boardTitle.trim() }); setBoard(b => ({ ...b, title: boardTitle.trim() })); } else setBoardTitle(board.title); }}
                    onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { setEditBoardTitle(false); setBoardTitle(board.title); } }} />
                : <h1 className="board-title-btn" onClick={() => setEditBoardTitle(true)}>{board.title}</h1>
              }
              <button
                className="icon-btn bh-star"
                title={starred ? 'Unstar board' : 'Star board'}
                onClick={() => setStarred(s => !s)}
                style={{ color: starred ? '#f7cd56' : undefined, fontSize: 20 }}
              >{starred ? '★' : '☆'}</button>
              <div className="sidebar-divider vr" />
              <button className="icon-btn bh-view">▦ Board</button>
              <button className="icon-btn bh-chevron">▾</button>
            </div>

            <div className="bh-right" style={{ position: 'relative' }}>
              <button className="icon-btn bh-view" onClick={() => setMenuOpen(true)}>🎨 Background</button>
              <div className="sidebar-divider vr" />
              <button
                className={`icon-btn bh-filter${showFilter ? ' active-filter' : ''}`}
                onClick={() => setShowFilter(f => !f)}
              >🪄 Filter</button>
              <div className="bh-members">
                {board.cards?.slice(0,3).flatMap(c => c.members || []).filter((v,i,a) => a.findIndex(t=>(t.id === v.id)) === i).map(m => (
                  <img key={m.id} src={m.avatar_url} className="avatar-img sm" alt={m.name} />
                ))}
              </div>
              <button className="btn-primary bh-share" onClick={() => setShowShare(true)}>👤 Share</button>
              <button className="icon-btn bh-menu" onClick={() => setMenuOpen(o => !o)}>···</button>
              {menuOpen && <BoardMenuPanel board={board} onClose={() => setMenuOpen(false)} onUpdated={updated => setBoard(b => ({ ...b, ...updated }))} />}
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={collisionDetectionStrategy}
            onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
            <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
              <div className="lists-row">
                {lists.map(list => (
                  <SortableList key={list.id} list={list} cards={cards[list.id] || []}
                    onCardClick={setSelectedCardId}
                    onCardAdded={(card) => setCards(prev => ({ ...prev, [list.id]: [...(prev[list.id]||[]), card] }))}
                    onCardDeleted={(cardId) => setCards(prev => ({ ...prev, [list.id]: prev[list.id].filter(c => c.id !== cardId) }))}
                    onListDeleted={() => { setLists(ls => ls.filter(l => l.id !== list.id)); setCards(prev => { const n = {...prev}; delete n[list.id]; return n; }); }}
                    onListRenamed={(title) => setLists(ls => ls.map(l => l.id === list.id ? { ...l, title } : l))}
                    currentMember={currentMember}
                  />
                ))}
                <AddListForm boardId={id} onAdded={(list) => { setLists(ls => [...ls, list]); setCards(prev => ({ ...prev, [list.id]: [] })); }} />
              </div>
            </SortableContext>

            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
              {activeCard && <CardItemOverlay card={activeCard} />}
              {activeList && <ListOverlay list={activeList} cards={cards[activeList.id] || []} />}
            </DragOverlay>
          </DndContext>
          
          <BottomNav />
        </main>
      </div>



      {showShare && (
        <div className="overlay" onClick={() => setShowShare(false)}>
          <div className="card-modal" style={{ width: 400, padding: 24 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowShare(false)}>✕</button>
            <h2 style={{ marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Share Board</h2>
            <p style={{ color: 'var(--text-sub)', marginBottom: 12, fontSize: 14 }}>Anyone with this link can view the board:</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input readOnly value={window.location.href} style={{ flex: 1 }} />
              <button className="btn-primary" onClick={() => { navigator.clipboard.writeText(window.location.href); }}>Copy</button>
            </div>
          </div>
        </div>
      )}

      {showFilter && (
        <div style={{
          position: 'fixed', top: 56, right: 16, zIndex: 150,
          background: '#242730', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12, padding: '14px 18px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          color: 'var(--text-main)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 12
        }}>
          <span>🪄</span>
          <span style={{ color: 'var(--text-sub)' }}>Filter by label or member — coming soon!</span>
          <button className="icon-btn" style={{ marginLeft: 4 }} onClick={() => setShowFilter(false)}>✕</button>
        </div>
      )}

      {selectedCardId && (
        <CardModal cardId={selectedCardId} listTitle={selectedListTitle}
          onClose={() => setSelectedCardId(null)} onUpdated={handleCardUpdated} />
      )}
    </div>
  );
}

// ── Sortable List ──────────────────────────────────────────────────────────────
const SortableList = React.memo(({ list, cards, onCardClick, onCardAdded, onCardDeleted, onListDeleted, onListRenamed, currentMember }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `list-${list.id}`, data: { type: 'list', id: list.id },
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const [listMenu, setListMenu] = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(list.title);
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const cardInputRef = useRef();

  useEffect(() => { if (addingCard && cardInputRef.current) cardInputRef.current.focus(); }, [addingCard]);

  const saveTitle = () => {
    setEditTitle(false);
    if (titleVal.trim() && titleVal.trim() !== list.title) {
      updateList(list.id, { title: titleVal.trim() });
      onListRenamed(titleVal.trim());
    } else setTitleVal(list.title);
  };

  const submitCard = async () => {
    if (!newCardTitle.trim()) return;
    const card = await createCard(list.id, { title: newCardTitle.trim(), performed_by: currentMember?.id });
    onCardAdded(card);
    setNewCardTitle('');
    cardInputRef.current?.focus();
  };

  return (
    <div ref={setNodeRef} style={style} className="list-wrapper">
      <div className="list">
        <div className="list-header" {...attributes} {...listeners}>
          {editTitle
            ? <input className="list-title-input" autoFocus value={titleVal} maxLength={50}
                onChange={e => setTitleVal(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditTitle(false); setTitleVal(list.title); } }}
                onClick={e => e.stopPropagation()} />
            : <span className="list-title" onClick={e => { e.stopPropagation(); setEditTitle(true); }}>{list.title}</span>
          }
          <button className="icon-btn list-menu-btn" onClick={e => { e.stopPropagation(); setListMenu(o => !o); }}>···</button>
        </div>

        {listMenu && (
          <div className="list-context-menu">
            <div className="lcm-header"><span>List actions</span><button className="icon-btn" onClick={() => setListMenu(false)}>✕</button></div>
            <button className="lcm-item" onClick={() => { setEditTitle(true); setListMenu(false); }}>✏️ Rename list</button>
            <button className="lcm-item" onClick={async () => { await deleteList(list.id); onListDeleted(); setListMenu(false); }}>🗑 Delete list</button>
            <button className="lcm-item" onClick={() => {
              const sorted = [...cards].sort((a,b) => a.title.localeCompare(b.title));
              // optimistic sort only
              setListMenu(false);
            }}>↕ Sort by name</button>
          </div>
        )}

        <SortableContext items={useMemo(() => cards.map(c => `card-${c.id}`), [cards])} strategy={verticalListSortingStrategy}>
          <div className="cards-container">
            {cards.map(card => (
              <SortableCard key={card.id} card={card} onClick={() => onCardClick(card.id)}
                onDelete={async (e) => { e.stopPropagation(); await deleteCard(card.id); onCardDeleted(card.id); }} />
            ))}
          </div>
        </SortableContext>

        {addingCard ? (
          <div className="add-card-form">
            <textarea ref={cardInputRef} placeholder="Enter a title for this card…" value={newCardTitle}
              onChange={e => setNewCardTitle(e.target.value)} maxLength={100}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitCard(); } if (e.key === 'Escape') { setAddingCard(false); setNewCardTitle(''); } }} />
            <div className="form-row">
              <button className="btn-primary" onClick={submitCard} disabled={!newCardTitle.trim()}>Add card</button>
              <button className="icon-btn" onClick={() => { setAddingCard(false); setNewCardTitle(''); }}>✕</button>
            </div>
          </div>
        ) : (
          <button className="add-card-trigger" onClick={() => setAddingCard(true)}>+ Add a card</button>
        )}
      </div>
    </div>
  );
});

// ── Sortable Card ──────────────────────────────────────────────────────────────
const SortableCard = React.memo(({ card, onClick, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${card.id}`, data: { type: 'card', id: card.id },
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="card" onClick={onClick}>
      <CardContent card={card} onDelete={onDelete} />
    </div>
  );
});

const CardContent = React.memo(({ card, onDelete }) => {
  const coverStyle = card.cover_type === 'color' || card.cover_type === 'gradient' ? { background: card.cover_value }
    : card.cover_type === 'image' ? { backgroundImage: `url(${card.cover_value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : null;
  const checklistTotal = parseInt(card.checklist_total || 0);
  const checklistDone = parseInt(card.checklist_done || 0);
  return (
    <>
      {coverStyle && <div className="card-cover" style={coverStyle} />}
      {card.labels?.length > 0 && (
        <div className="card-labels">
          {card.labels.map(l => <span key={l.id} className="card-label-pip" style={{ background: l.color }} title={l.name} />)}
        </div>
      )}
      <div className="card-title-text">{card.title}</div>
      <div className="card-badges">
        <div className="card-badge-left">
          {card.due_date && <span className="card-badge">📅 {card.due_date.slice(0,10)}</span>}
          {checklistTotal > 0 && (
            <span className={`card-badge${checklistDone===checklistTotal?' badge-done':''}`}>
              ☑ {checklistDone}/{checklistTotal}
            </span>
          )}
          {parseInt(card.attachment_count||0) > 0 && <span className="card-badge">📎 {card.attachment_count}</span>}
          {parseInt(card.comment_count||0) > 0 && <span className="card-badge">💬 {card.comment_count}</span>}
        </div>
        <div className="card-badge-right">
          {card.members?.map(m => (
            <img 
              key={m.id} 
              src={m.avatar_url} 
              alt={m.name} 
              className="avatar-img xs" 
              title={m.name} 
              onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random`; }}
            />
          ))}
          <button className="card-delete-btn" onClick={onDelete} title="Delete">✕</button>
        </div>
      </div>
    </>
  );
});

function CardItemOverlay({ card }) {
  return <div className="card dragging"><CardContent card={card} onDelete={() => {}} /></div>;
}
function ListOverlay({ list, cards }) {
  return (
    <div className="list-wrapper" style={{ opacity: 0.9 }}>
      <div className="list">
        <div className="list-header"><span className="list-title">{list.title}</span></div>
        <div className="cards-container" style={{ maxHeight: 200, overflow: 'hidden' }}>
          {cards.slice(0,3).map(c => <div key={c.id} className="card"><div className="card-title-text">{c.title}</div></div>)}
        </div>
      </div>
    </div>
  );
}

// ── Add List Form ──────────────────────────────────────────────────────────────
function AddListForm({ boardId, onAdded }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const submit = async () => {
    if (!title.trim()) return;
    const list = await createList(boardId, { title: title.trim() });
    onAdded(list);
    setTitle('');
  };
  if (!open) return <button className="add-list-trigger" onClick={() => setOpen(true)}>+ Add another list</button>;
  return (
    <div className="add-list-form">
      <input autoFocus placeholder="Enter list title…" value={title} maxLength={50}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setOpen(false); setTitle(''); } }} />
      <div className="form-row">
        <button className="btn-primary" onClick={submit} disabled={!title.trim()}>Add list</button>
        <button className="icon-btn" onClick={() => { setOpen(false); setTitle(''); }}>✕</button>
      </div>
    </div>
  );
}

// ── Board Menu ─────────────────────────────────────────────────────────────────
function BoardMenuPanel({ board, onClose, onUpdated }) {
  const [view, setView] = useState('main');
  const changeBg = async (value, type) => {
    const updated = await updateBoard(board.id, { bg_type: type, bg_value: value });
    onUpdated(updated);
  };
  return (
    <div className="bg-menu-popover glass-heavy">
      <div className="bg-menu-header">
        {view !== 'main' && <button className="icon-btn" onClick={() => setView('main')}>←</button>}
        <span className="bg-menu-title">{view === 'main' ? 'Menu' : 'Change background'}</span>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>
      <div className="bg-menu-body">
        {view === 'main' && (
          <div className="board-menu-items">
            <button className="sidebar-item" onClick={() => setView('background')}>🎨 Change background</button>
          </div>
        )}
        {view === 'background' && (
          <div className="background-picker">
            <p className="bg-menu-section-title">Colors</p>
            <div className="bg-grid">
              {BOARD_COLORS.map(c => <button key={c} className={`bg-swatch${board.bg_value===c?' sel':''}`} style={{ background: c }} onClick={() => changeBg(c,'color')} />)}
            </div>
            <p className="bg-menu-section-title">Gradients</p>
            <div className="bg-grid">
              {BOARD_GRADIENTS.map(g => <button key={g} className={`bg-swatch${board.bg_value===g?' sel':''}`} style={{ background: g }} onClick={() => changeBg(g,'gradient')} />)}
            </div>
            <p className="bg-menu-section-title">Photos</p>
            <div className="bg-grid">
              {BOARD_IMAGES.map(img => (
                <button key={img} className={`bg-swatch${board.bg_value===img?' sel':''}`} 
                  style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover' }} 
                  onClick={() => changeBg(img,'image')} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
