const BASE = 'http://localhost:5001/api';

const req = async (url, opts = {}) => {
  const r = await fetch(BASE + url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (r.status === 204) return null;
  const data = await r.json();
  if (!r.ok) throw new Error((data && data.error && data.error.message) || 'API Error');
  return data;
};

// Boards
export const getBoards = (memberId) => req(`/boards${memberId ? `?member_id=${memberId}` : ''}`);
export const createBoard = (data) => req('/boards', { method: 'POST', body: JSON.stringify(data) });
export const getBoard = (id) => req(`/boards/${id}`);
export const updateBoard = (id, data) => req(`/boards/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteBoard = (id) => req(`/boards/${id}`, { method: 'DELETE' });

// Lists
export const createList = (boardId, data) => req(`/boards/${boardId}/lists`, { method: 'POST', body: JSON.stringify(data) });
export const updateList = (id, data) => req(`/lists/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const reorderList = (id, data) => req(`/lists/${id}/reorder`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteList = (id) => req(`/lists/${id}`, { method: 'DELETE' });

// Cards
export const createCard = (listId, data) => req(`/lists/${listId}/cards`, { method: 'POST', body: JSON.stringify(data) });
export const getCard = (id) => req(`/cards/${id}`);
export const updateCard = (id, data) => req(`/cards/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const moveCard = (id, data) => req(`/cards/${id}/move`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteCard = (id) => req(`/cards/${id}`, { method: 'DELETE' });

// Labels
export const getLabels = () => req('/labels');
export const addCardLabel = (cardId, data) => req(`/cards/${cardId}/labels`, { method: 'POST', body: JSON.stringify(data) });
export const removeCardLabel = (cardId, labelId) => req(`/cards/${cardId}/labels/${labelId}`, { method: 'DELETE' });

// Members
export const getMembers = () => req('/members');
export const addCardMember = (cardId, data) => req(`/cards/${cardId}/members`, { method: 'POST', body: JSON.stringify(data) });
export const removeCardMember = (cardId, memberId) => req(`/cards/${cardId}/members/${memberId}`, { method: 'DELETE' });

// Checklist items
export const addChecklistItem = (cardId, data) => req(`/cards/${cardId}/checklist-items`, { method: 'POST', body: JSON.stringify(data) });
export const updateChecklistItem = (id, data) => req(`/checklist-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteChecklistItem = (id) => req(`/checklist-items/${id}`, { method: 'DELETE' });

// Attachments
export const addAttachment = (cardId, data) => req(`/cards/${cardId}/attachments`, { method: 'POST', body: JSON.stringify(data) });
export const deleteAttachment = (cardId, attachmentId) => req(`/cards/${cardId}/attachments/${attachmentId}`, { method: 'DELETE' });

// Comments
export const addComment = (cardId, data) => req(`/cards/${cardId}/comments`, { method: 'POST', body: JSON.stringify(data) });
export const deleteComment = (cardId, commentId) => req(`/cards/${cardId}/comments/${commentId}`, { method: 'DELETE' });
