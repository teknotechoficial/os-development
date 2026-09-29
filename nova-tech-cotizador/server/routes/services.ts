import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getPool, toCamel } from '../db';

const router = Router();

// GET /api/services - public catalogue (active only); ?all=1 returns inactive too (admin)
router.get('/', async (req: any, res: any) => {
  const db = getPool();
  try {
    const wantAll = req.query.all === '1' || req.query.all === 'true';
    const r = wantAll
      ? await db.query('SELECT * FROM services ORDER BY sort_order, name')
      : await db.query('SELECT * FROM services WHERE active = true ORDER BY sort_order, name');
    res.json({ services: r.rows.map(toCamel) });
  } catch (err) {
    console.error('[services GET]', err);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

function readFields(body: any) {
  const out: any = {};
  if (body.name !== undefined) out.name = typeof body.name === 'string' ? body.name.trim() : body.name;
  if (body.description !== undefined) out.description = String(body.description);
  if (body.category !== undefined) out.category = typeof body.category === 'string' ? body.category.trim() : body.category;
  if (body.basePrice !== undefined && body.basePrice !== null) out.basePrice = Number(body.basePrice);
  if (body.icon !== undefined && body.icon !== null) out.icon = String(body.icon).trim();
  if (body.active !== undefined && body.active !== null) out.active = !!body.active;
  if (body.sortOrder !== undefined && body.sortOrder !== null) out.sortOrder = Number(body.sortOrder);
  return out;
}

function validateFields(fields: any, requireAll: boolean): string | null {
  if (requireAll) {
    if (!fields.name || !fields.category) return 'Nombre y categoría son obligatorios.';
  } else {
    if (fields.name !== undefined && !fields.name) return 'El nombre no puede estar vacío.';
    if (fields.category !== undefined && !fields.category) return 'La categoría no puede estar vacía.';
  }
  if (fields.basePrice !== undefined && !Number.isFinite(fields.basePrice)) return 'Precio base inválido.';
  if (fields.sortOrder !== undefined && !Number.isInteger(fields.sortOrder)) return 'Orden inválido.';
  return null;
}

// POST /api/services
router.post('/', async (req: any, res: any) => {
  const db = getPool();
  try {
    const fields = readFields(req.body || {});
    const invalid = validateFields(fields, true);
    if (invalid) return res.status(400).json({ error: invalid });

    const id = randomUUID();
    const r = await db.query(
      `INSERT INTO services (id, name, description, category, base_price, icon, active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        id,
        fields.name,
        fields.description !== undefined ? fields.description : '',
        fields.category,
        fields.basePrice !== undefined ? fields.basePrice : 0,
        fields.icon !== undefined ? fields.icon : '',
        fields.active !== undefined ? fields.active : true,
        fields.sortOrder !== undefined ? fields.sortOrder : 0,
      ]
    );
    res.json({ success: true, service: toCamel(r.rows[0]) });
  } catch (err) {
    console.error('[services POST]', err);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
});

// PUT /api/services/:id
router.put('/:id', async (req: any, res: any) => {
  const db = getPool();
  try {
    const fields = readFields(req.body || {});
    const invalid = validateFields(fields, false);
    if (invalid) return res.status(400).json({ error: invalid });
    if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'No hay datos para actualizar.' });

    const r = await db.query(
      `UPDATE services SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         category = COALESCE($3, category),
         base_price = COALESCE($4, base_price),
         icon = COALESCE($5, icon),
         active = COALESCE($6, active),
         sort_order = COALESCE($7, sort_order)
       WHERE id = $8`,
      [
        fields.name !== undefined ? fields.name : null,
        fields.description !== undefined ? fields.description : null,
        fields.category !== undefined ? fields.category : null,
        fields.basePrice !== undefined ? fields.basePrice : null,
        fields.icon !== undefined ? fields.icon : null,
        fields.active !== undefined ? fields.active : null,
        fields.sortOrder !== undefined ? fields.sortOrder : null,
        req.params.id,
      ]
    );
    if (r.rowCount === 0) return res.status(400).json({ error: 'Servicio no encontrado.' });

    const s = await db.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
    res.json({ success: true, service: toCamel(s.rows[0]) });
  } catch (err) {
    console.error('[services PUT]', err);
    res.status(500).json({ error: 'Error al guardar servicio' });
  }
});

// DELETE /api/services/:id
router.delete('/:id', async (req: any, res: any) => {
  const db = getPool();
  try {
    const r = await db.query('DELETE FROM services WHERE id = $1', [req.params.id]);
    if (r.rowCount === 0) return res.status(400).json({ error: 'Servicio no encontrado.' });
    res.json({ success: true });
  } catch (err) {
    console.error('[services DELETE]', err);
    res.status(500).json({ error: 'Error al eliminar servicio' });
  }
});

export default router;
