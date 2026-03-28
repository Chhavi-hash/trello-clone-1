const db = require('../db');
const validate = require('../middleware/validate');

const logActivity = (cardId, actionType, performedBy, details) =>
  db.query('INSERT INTO activity_logs (card_id, action_type, performed_by, details) VALUES ($1,$2,$3,$4)',
    [cardId, actionType, performedBy || null, details ? JSON.stringify(details) : null]);

// GET full card detail
exports.getCard = async (req, res) => {
  const { id } = req.params;
  const card = await db.query('SELECT * FROM cards WHERE id=$1', [id]);
  if (!card.rows.length) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } });

  const [labels, members, checklistItems, attachments, comments, activity] = await Promise.all([
    db.query('SELECT l.* FROM labels l JOIN card_labels cl ON cl.label_id=l.id WHERE cl.card_id=$1', [id]),
    db.query('SELECT m.* FROM members m JOIN card_members cm ON cm.member_id=m.id WHERE cm.card_id=$1', [id]),
    db.query('SELECT * FROM checklist_items WHERE card_id=$1 ORDER BY position', [id]),
    db.query('SELECT * FROM attachments WHERE card_id=$1 ORDER BY created_at', [id]),
    db.query(`SELECT c.*, m.name AS author_name, m.avatar_url AS author_avatar
              FROM comments c JOIN members m ON m.id=c.author_id
              WHERE c.card_id=$1 ORDER BY c.created_at`, [id]),
    db.query(`SELECT al.*, m.name AS performer_name, m.avatar_url AS performer_avatar
              FROM activity_logs al LEFT JOIN members m ON m.id=al.performed_by
              WHERE al.card_id=$1 ORDER BY al.created_at DESC`, [id]),
  ]);

  res.json({
    ...card.rows[0],
    labels: labels.rows,
    members: members.rows,
    checklist_items: checklistItems.rows,
    attachments: attachments.rows,
    comments: comments.rows,
    activity: activity.rows,
  });
};

// POST /lists/:id/cards
exports.createCard = async (req, res) => {
  const err = validate({ title: { required: true, min: 1, max: 100 } }, req.body);
  if (err) return res.status(400).json(err);
  const { id: listId } = req.params;
  const { title, description, performed_by } = req.body;
  if (description && description.length > 5000)
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'description max 5000 chars', field: 'description' } });

  const pos = await db.query('SELECT COALESCE(MAX(position),0)+1 AS next FROM cards WHERE list_id=$1', [listId]);
  const r = await db.query(
    'INSERT INTO cards (list_id, title, description, position) VALUES ($1,$2,$3,$4) RETURNING *',
    [listId, title.trim(), description || null, pos.rows[0].next]
  );
  const card = r.rows[0];
  await logActivity(card.id, 'CREATE_CARD', performed_by, { title: card.title });
  res.status(201).json({ ...card, labels: [], members: [], checklist_items: [], attachments: [], comment_count: 0 });
};

// PATCH /cards/:id
exports.updateCard = async (req, res) => {
  const err = validate({
    title: { min: 1, max: 100 },
    cover_type: { enum: ['color', 'image'] },
  }, req.body);
  if (err) return res.status(400).json(err);
  const { id } = req.params;
  const { title, description, cover_type, cover_value, archived } = req.body;
  if (description && description.length > 5000)
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'description max 5000 chars', field: 'description' } });

  const r = await db.query(
    `UPDATE cards SET
      title=COALESCE($1,title), description=COALESCE($2,description),
      cover_type=COALESCE($3,cover_type), cover_value=COALESCE($4,cover_value),
      archived=COALESCE($5,archived)
     WHERE id=$6 RETURNING *`,
    [title?.trim(), description, cover_type, cover_value, archived, id]
  );
  if (!r.rows.length) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } });
  res.json(r.rows[0]);
};

// PATCH /cards/:id/move
exports.moveCard = async (req, res) => {
  const { id } = req.params;
  const { newListId, newPosition, performed_by } = req.body;
  if (!newListId || newPosition === undefined)
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'newListId and newPosition required' } });

  const old = await db.query('SELECT * FROM cards WHERE id=$1', [id]);
  if (!old.rows.length) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } });

  const oldListId = old.rows[0].list_id;
  const oldPos = old.rows[0].position;

  if (String(oldListId) === String(newListId)) {
    // reorder within same list
    if (newPosition > oldPos) {
      await db.query('UPDATE cards SET position=position-1 WHERE list_id=$1 AND position>$2 AND position<=$3 AND archived=FALSE', [newListId, oldPos, newPosition]);
    } else {
      await db.query('UPDATE cards SET position=position+1 WHERE list_id=$1 AND position>=$2 AND position<$3 AND archived=FALSE', [newListId, newPosition, oldPos]);
    }
  } else {
    // move to different list
    await db.query('UPDATE cards SET position=position-1 WHERE list_id=$1 AND position>$2 AND archived=FALSE', [oldListId, oldPos]);
    await db.query('UPDATE cards SET position=position+1 WHERE list_id=$1 AND position>=$2 AND archived=FALSE', [newListId, newPosition]);

    // get list names for activity log
    const lists = await db.query('SELECT id, title FROM lists WHERE id=ANY($1)', [[oldListId, newListId]]);
    const fromList = lists.rows.find(l => l.id === oldListId)?.title;
    const toList = lists.rows.find(l => String(l.id) === String(newListId))?.title;
    await logActivity(id, 'MOVE_CARD', performed_by, { from: fromList, to: toList });
  }

  const r = await db.query('UPDATE cards SET list_id=$1, position=$2 WHERE id=$3 RETURNING *', [newListId, newPosition, id]);
  res.json(r.rows[0]);
};

// DELETE /cards/:id
exports.deleteCard = async (req, res) => {
  await db.query('DELETE FROM cards WHERE id=$1', [req.params.id]);
  res.status(204).end();
};

// Labels
exports.getCardLabels = async (req, res) => {
  const r = await db.query('SELECT l.* FROM labels l JOIN card_labels cl ON cl.label_id=l.id WHERE cl.card_id=$1', [req.params.id]);
  res.json(r.rows);
};

exports.addCardLabel = async (req, res) => {
  const { id: cardId } = req.params;
  const { labelId, performed_by } = req.body;
  if (!labelId) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'labelId required' } });
  await db.query('INSERT INTO card_labels (card_id, label_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [cardId, labelId]);
  const label = await db.query('SELECT * FROM labels WHERE id=$1', [labelId]);
  await logActivity(cardId, 'ADD_LABEL', performed_by, { label: label.rows[0]?.name });
  res.json({ success: true });
};

exports.removeCardLabel = async (req, res) => {
  const { id: cardId, labelId } = req.params;
  const label = await db.query('SELECT * FROM labels WHERE id=$1', [labelId]);
  await db.query('DELETE FROM card_labels WHERE card_id=$1 AND label_id=$2', [cardId, labelId]);
  await logActivity(cardId, 'REMOVE_LABEL', null, { label: label.rows[0]?.name });
  res.status(204).end();
};

// Members
exports.addCardMember = async (req, res) => {
  const { id: cardId } = req.params;
  const { memberId, performed_by } = req.body;
  if (!memberId) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'memberId required' } });
  await db.query('INSERT INTO card_members (card_id, member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [cardId, memberId]);
  const member = await db.query('SELECT * FROM members WHERE id=$1', [memberId]);
  await logActivity(cardId, 'ADD_MEMBER', performed_by, { member: member.rows[0]?.name });
  res.json({ success: true });
};

exports.removeCardMember = async (req, res) => {
  const { id: cardId, memberId } = req.params;
  const member = await db.query('SELECT * FROM members WHERE id=$1', [memberId]);
  await db.query('DELETE FROM card_members WHERE card_id=$1 AND member_id=$2', [cardId, memberId]);
  await logActivity(cardId, 'REMOVE_MEMBER', null, { member: member.rows[0]?.name });
  res.status(204).end();
};

// Checklist items
exports.addChecklistItem = async (req, res) => {
  const err = validate({ text: { required: true, min: 1, max: 200 } }, req.body);
  if (err) return res.status(400).json(err);
  const { id: cardId } = req.params;
  const { text, performed_by } = req.body;
  const pos = await db.query('SELECT COALESCE(MAX(position),0)+1 AS next FROM checklist_items WHERE card_id=$1', [cardId]);
  const r = await db.query(
    'INSERT INTO checklist_items (card_id, text, position) VALUES ($1,$2,$3) RETURNING *',
    [cardId, text.trim(), pos.rows[0].next]
  );
  res.status(201).json(r.rows[0]);
};

exports.updateChecklistItem = async (req, res) => {
  const { id } = req.params;
  const { text, is_complete, performed_by } = req.body;
  if (text) {
    const err = validate({ text: { min: 1, max: 200 } }, req.body);
    if (err) return res.status(400).json(err);
  }
  const r = await db.query(
    'UPDATE checklist_items SET text=COALESCE($1,text), is_complete=COALESCE($2,is_complete) WHERE id=$3 RETURNING *',
    [text?.trim(), is_complete, id]
  );
  if (!r.rows.length) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Item not found' } });
  if (is_complete !== undefined) {
    await logActivity(r.rows[0].card_id, 'COMPLETE_CHECKLIST_ITEM', performed_by, { item: r.rows[0].text, complete: is_complete });
  }
  res.json(r.rows[0]);
};

exports.deleteChecklistItem = async (req, res) => {
  await db.query('DELETE FROM checklist_items WHERE id=$1', [req.params.id]);
  res.status(204).end();
};

// Attachments
exports.getAttachments = async (req, res) => {
  const r = await db.query('SELECT * FROM attachments WHERE card_id=$1 ORDER BY created_at', [req.params.id]);
  res.json(r.rows);
};

exports.addAttachment = async (req, res) => {
  const err = validate({ url: { required: true, url: true } }, req.body);
  if (err) return res.status(400).json(err);
  const { id: cardId } = req.params;
  const { url, name, performed_by } = req.body;
  const r = await db.query('INSERT INTO attachments (card_id, url, name) VALUES ($1,$2,$3) RETURNING *', [cardId, url, name || null]);
  await logActivity(cardId, 'ADD_ATTACHMENT', performed_by, { url });
  res.status(201).json(r.rows[0]);
};

exports.deleteAttachment = async (req, res) => {
  await db.query('DELETE FROM attachments WHERE id=$1', [req.params.attachmentId]);
  res.status(204).end();
};

// Comments
exports.getComments = async (req, res) => {
  const r = await db.query(
    `SELECT c.*, m.name AS author_name, m.avatar_url AS author_avatar
     FROM comments c JOIN members m ON m.id=c.author_id
     WHERE c.card_id=$1 ORDER BY c.created_at`,
    [req.params.id]
  );
  res.json(r.rows);
};

exports.addComment = async (req, res) => {
  const err = validate({ text: { required: true, min: 1 } }, req.body);
  if (err) return res.status(400).json(err);
  const { id: cardId } = req.params;
  const { authorId, text } = req.body;
  if (!authorId) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'authorId required' } });
  const r = await db.query(
    'INSERT INTO comments (card_id, author_id, text) VALUES ($1,$2,$3) RETURNING *',
    [cardId, authorId, text.trim()]
  );
  const comment = r.rows[0];
  const member = await db.query('SELECT * FROM members WHERE id=$1', [authorId]);
  await logActivity(cardId, 'ADD_COMMENT', authorId, { text: text.slice(0, 50) });
  res.status(201).json({ ...comment, author_name: member.rows[0]?.name, author_avatar: member.rows[0]?.avatar_url });
};

exports.deleteComment = async (req, res) => {
  await db.query('DELETE FROM comments WHERE id=$1', [req.params.commentId]);
  res.status(204).end();
};

// Activity log
exports.getActivity = async (req, res) => {
  const r = await db.query(
    `SELECT al.*, m.name AS performer_name, m.avatar_url AS performer_avatar
     FROM activity_logs al LEFT JOIN members m ON m.id=al.performed_by
     WHERE al.card_id=$1 ORDER BY al.created_at DESC`,
    [req.params.id]
  );
  res.json(r.rows);
};
