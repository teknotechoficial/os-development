import { Router } from 'express';
import { getPool, mapRows, toCamel } from '../db';
import { randomUUID } from 'crypto';
import { calculateBasePrice, calculateFinalPrice } from '../../src/shared/pricing';

const router = Router();

const VALID_STATUSES = ['borrador', 'enviada', 'aceptada', 'rechazada', 'pagada'];

router.get('/', async (req: any, res: any) => {
  const db = getPool();
  const { userId, role } = req.query;
  try {
    let q;
    if ((role === 'vendedor' || role === 'closer') && userId) {
      q = await db.query('SELECT * FROM quotes WHERE seller_id = $1 ORDER BY created_at DESC', [userId]);
    } else if (role === 'desarrollador' && userId) {
      q = await db.query('SELECT * FROM quotes WHERE developer_id = $1 ORDER BY created_at DESC', [userId]);
    } else {
      q = await db.query('SELECT * FROM quotes ORDER BY created_at DESC');
    }
    res.json(mapRows(q.rows).map((row) => ({ ...row, config: parseConfig(row.config) })));
  } catch (err) {
    res.status(500).json({ error: 'Error en servidor' });
  }
});

router.get('/:id', async (req: any, res: any) => {
  const db = getPool();
  const { id } = req.params;
  try {
    const q = await db.query('SELECT * FROM quotes WHERE id = $1', [id]);
    if (q.rows.length === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    res.json({ quote: quoteRow(q.rows[0]) });
  } catch (err) {
    res.status(500).json({ error: 'Error en servidor' });
  }
});

router.post('/', async (req: any, res: any) => {
  const db = getPool();
  const { productType, config, clientName, clientType, sellerId, developerId } = req.body;
  try {
    const id = randomUUID();
    const now = new Date().toISOString();
    const basePrice = calculateBasePrice(productType, config);
    const finalPrice = calculateFinalPrice(basePrice);
    const margin = finalPrice - basePrice;
    await db.query(
      'INSERT INTO quotes (id, client_name, client_type, product_type, config, base_price, margin, final_price, seller_id, developer_id, assigned_at, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [id, clientName, clientType, productType, JSON.stringify(config), basePrice, margin, finalPrice, sellerId, developerId || null, developerId ? now : null, now, now]
    );
    const q = await db.query('SELECT * FROM quotes WHERE id = $1', [id]);
    const row = toCamel(q.rows[0]);
    res.json({ ...row, config: parseConfig(row.config) });
  } catch (err) {
    console.error('[quotes POST]', err);
    res.status(500).json({ error: 'Error al crear cotización' });
  }
});

router.put('/:id', async (req: any, res: any) => {
  const db = getPool();
  const { id } = req.params;
  const { status, developerId } = req.body;
  if (status !== undefined && status !== null && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  try {
    const result = await db.query(
      'UPDATE quotes SET status = COALESCE($1, status), developer_id = COALESCE($2, developer_id), updated_at = $3 WHERE id = $4',
      [status || null, developerId || null, new Date().toISOString(), id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    const q = await db.query('SELECT * FROM quotes WHERE id = $1', [id]);
    res.json({ quote: quoteRow(q.rows[0]) });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

router.delete('/:id', async (req: any, res: any) => {
  const db = getPool();
  const { id } = req.params;
  try {
    const check = await db.query('SELECT id FROM quotes WHERE id = $1', [id]);
    if (check.rowCount === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    await db.query('DELETE FROM quotes WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[quotes DELETE]', err);
    res.status(500).json({ error: 'Error al eliminar la cotización' });
  }
});

function quoteRow(row: any): any {
  const camel = toCamel(row);
  return { ...camel, config: parseConfig(camel.config) };
}

function parseConfig(config: any): any {
  if (typeof config === 'string') {
    try {
      return JSON.parse(config);
    } catch {
      return {};
    }
  }
  return config || {};
}

export default router;
