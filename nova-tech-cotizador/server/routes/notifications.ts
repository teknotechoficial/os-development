import { Router } from 'express';
import { getPool, mapRows } from '../db';

const router = Router();

router.get('/', async (req: any, res: any) => {
	const db = getPool();
	const { userId, limit } = req.query;
	const lim = limit === undefined ? 50 : Number(limit);
	if (!Number.isInteger(lim) || lim < 1 || lim > 200) {
		return res.status(400).json({ error: 'limit debe ser un entero entre 1 y 200' });
	}
	try {
		const n = await db.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2', [userId, lim]);
		res.json(mapRows(n.rows));
	} catch (err) {
		res.status(500).json({ error: 'Error en servidor' });
	}
});

router.get('/unread-count', async (req: any, res: any) => {
	const db = getPool();
	const { userId } = req.query;
	if (userId === undefined || userId === '') {
		return res.status(400).json({ error: 'userId requerido' });
	}
	try {
		const n = await db.query('SELECT count(*)::int AS unread FROM notifications WHERE user_id = $1 AND read = false', [userId]);
		res.json({ unread: n.rows[0].unread });
	} catch (err) {
		res.status(500).json({ error: 'Error en servidor' });
	}
});

router.put('/read-all', async (req: any, res: any) => {
	const db = getPool();
	const { userId } = req.body || {};
	if (userId === undefined || userId === null || userId === '') {
		return res.status(400).json({ error: 'userId requerido' });
	}
	try {
		const r = await db.query('UPDATE notifications SET read = true WHERE user_id = $1 AND read = false', [userId]);
		res.json({ success: true, count: r.rowCount });
	} catch (err) {
		res.status(500).json({ error: 'Error en servidor' });
	}
});

router.put('/:id/read', async (req: any, res: any) => {
  const db = getPool();
  const { id } = req.params;
  try {
    await db.query('UPDATE notifications SET read = true WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error en servidor' });
  }
});

export default router;
