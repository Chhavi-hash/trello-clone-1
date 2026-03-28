const express = require('express');
const router = express.Router();
const b = require('../controllers/boardController');
const l = require('../controllers/listController');
const c = require('../controllers/cardController');
const m = require('../controllers/metaController');

// Boards
router.get('/boards', b.getBoards);
router.post('/boards', b.createBoard);
router.get('/boards/:id', b.getBoard);
router.patch('/boards/:id', b.updateBoard);
router.delete('/boards/:id', b.deleteBoard);

// Lists (nested under board for create)
router.post('/boards/:id/lists', l.createList);
router.patch('/lists/:id', l.updateList);
router.patch('/lists/:id/reorder', l.reorderList);
router.delete('/lists/:id', l.deleteList);

// Cards (nested under list for create)
router.post('/lists/:id/cards', c.createCard);
router.get('/cards/:id', c.getCard);
router.patch('/cards/:id', c.updateCard);
router.patch('/cards/:id/move', c.moveCard);
router.delete('/cards/:id', c.deleteCard);

// Card labels
router.get('/cards/:id/labels', c.getCardLabels);
router.post('/cards/:id/labels', c.addCardLabel);
router.delete('/cards/:id/labels/:labelId', c.removeCardLabel);

// Card members
router.post('/cards/:id/members', c.addCardMember);
router.delete('/cards/:id/members/:memberId', c.removeCardMember);

// Checklist items
router.post('/cards/:id/checklist-items', c.addChecklistItem);
router.patch('/checklist-items/:id', c.updateChecklistItem);
router.delete('/checklist-items/:id', c.deleteChecklistItem);

// Attachments
router.get('/cards/:id/attachments', c.getAttachments);
router.post('/cards/:id/attachments', c.addAttachment);
router.delete('/cards/:id/attachments/:attachmentId', c.deleteAttachment);

// Comments
router.get('/cards/:id/comments', c.getComments);
router.post('/cards/:id/comments', c.addComment);
router.delete('/cards/:id/comments/:commentId', c.deleteComment);

// Activity
router.get('/cards/:id/activity-log', c.getActivity);

// Labels & Members (global)
router.get('/labels', m.getLabels);
router.post('/labels', m.createLabel);
router.get('/members', m.getMembers);
router.post('/members', m.createMember);

module.exports = router;
