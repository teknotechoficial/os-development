import { Router } from 'express';
import { getPool, mapRows } from '../db';

const router = Router();

router.get('/', async (req: any, res: any) => {
  const db = getPool();
  const { userId } = req.query;
  try {
    const n = await db.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(mapRows(n.rows));
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
