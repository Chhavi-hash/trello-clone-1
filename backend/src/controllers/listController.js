const db = require('../db');
const validate = require('../middleware/validate');

exports.createList = async (req, res) => {
  const err = validate({ title: { required: true, min: 1, max: 50 } }, req.body);
  if (err) return res.status(400).json(err);
  const { id: boardId } = req.params;
  const { title } = req.body;
  const pos = await db.query('SELECT COALESCE(MAX(position),0)+1 AS next FROM lists WHERE board_id=$1', [boardId]);
  const r = await db.query(
    'INSERT INTO lists (board_id, title, position) VALUES ($1,$2,$3) RETURNING *',
    [boardId, title.trim(), pos.rows[0].next]
  );
  res.status(201).json(r.rows[0]);
};

exports.updateList = async (req, res) => {
  const err = validate({ title: { min: 1, max: 50 } }, req.body);
  if (err) return res.status(400).json(err);
  const { title } = req.body;
  const r = await db.query(
    'UPDATE lists SET title=COALESCE($1,title) WHERE id=$2 RETURNING *',
    [title?.trim(), req.params.id]
  );
  if (!r.rows.length) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'List not found' } });
  res.json(r.rows[0]);
};

exports.reorderList = async (req, res) => {
  const { id } = req.params;
  const { newPosition } = req.body;
  if (!newPosition) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'newPosition required' } });

  const list = await db.query('SELECT * FROM lists WHERE id=$1', [id]);
  if (!list.rows.length) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'List not found' } });

  const { board_id, position: oldPos } = list.rows[0];
  if (newPosition > oldPos) {
    await db.query('UPDATE lists SET position=position-1 WHERE board_id=$1 AND position>$2 AND position<=$3', [board_id, oldPos, newPosition]);
  } else {
    await db.query('UPDATE lists SET position=position+1 WHERE board_id=$1 AND position>=$2 AND position<$3', [board_id, newPosition, oldPos]);
  }
  const r = await db.query('UPDATE lists SET position=$1 WHERE id=$2 RETURNING *', [newPosition, id]);
  res.json(r.rows[0]);
};

exports.deleteList = async (req, res) => {
  await db.query('DELETE FROM lists WHERE id=$1', [req.params.id]);
  res.status(204).end();
};
