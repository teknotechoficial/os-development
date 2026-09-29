import { Router } from 'express';
import { getPool, mapRows, toCamel } from '../db';
import { randomUUID } from 'crypto';

const router = Router();

const VALID_STATUSES = ['disponible', 'ocupado', 'no_disponible'];

router.get('/', async (_req: any, res: any) => {
  const db = getPool();
  try {
    const a = await db.query('SELECT * FROM availability');
    res.json(mapRows(a.rows));
  } catch (err) {
    res.status(500).json({ error: 'Error en servidor' });
  }
});

router.put('/:userId', async (req: any, res: any) => {
  const db = getPool();
  const { userId } = req.params;
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  try {
    const user = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const now = new Date().toISOString();
    await db.query(
      'INSERT INTO availability (developer_id, status, updated_at) VALUES ($1, $2, $3) ON CONFLICT (developer_id) DO UPDATE SET status = EXCLUDED.status, updated_at = EXCLUDED.updated_at',
      [userId, status, now]
    );
    const a = await db.query('SELECT * FROM availability WHERE developer_id = $1', [userId]);
    const row = toCamel(a.rows[0]);
    res.json({ availability: { ...row, userId: row.developerId, currentQuotes: row.activeQuotes } });
  } catch (err) {
    console.error('[availability PUT]', err);
    res.status(500).json({ error: 'Error al actualizar disponibilidad' });
  }
});

router.post('/assign', async (req: any, res: any) => {
  const { quoteId, developerId } = req.body;
  const db = getPool();
  if (!quoteId || !developerId) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }
  const now = new Date().toISOString();
  try {
    const quoteCheck = await db.query('SELECT id FROM quotes WHERE id = $1', [quoteId]);
    if (quoteCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    const devCheck = await db.query('SELECT id FROM users WHERE id = $1', [developerId]);
    if (devCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Desarrollador no encontrado' });
    }
    await db.query('UPDATE quotes SET developer_id = $1, assigned_at = $2, updated_at = $3 WHERE id = $4', [developerId, now, now, quoteId]);
    await db.query(
      `INSERT INTO availability (developer_id, status, active_quotes, updated_at)
       VALUES ($1, 'ocupado', (SELECT count(*) FROM quotes WHERE developer_id = $1), $2)
       ON CONFLICT (developer_id) DO UPDATE SET status = 'ocupado',
         active_quotes = (SELECT count(*) FROM quotes WHERE developer_id = $1), updated_at = $2`,
      [developerId, now]
    );
    const q = await db.query('SELECT * FROM quotes WHERE id = $1', [quoteId]);
    const a = await db.query('SELECT * FROM availability WHERE developer_id = $1', [developerId]);
    const notifId = randomUUID();
    await db.query('INSERT INTO notifications (id, user_id, type, title, message, quote_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)', [notifId, developerId, 'quote_delegated', 'Nueva cotización delegada', `Te han asignado la cotización de ${q.rows[0].client_name}`, quoteId, now]);
    const quote = toCamel(q.rows[0]);
    if (typeof quote.config === 'string') {
      try {
        quote.config = JSON.parse(quote.config);
      } catch {
        quote.config = {};
      }
    }
    const availability = toCamel(a.rows[0]);
    res.json({ success: true, quote, availability: { ...availability, userId: availability.developerId, currentQuotes: availability.activeQuotes } });
  } catch (err) {
    console.error('[availability assign]', err);
    res.status(500).json({ error: 'Error al asignar' });
  }
});

export default router;
