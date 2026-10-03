import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getPool, mapRows, toCamel } from '../db';

const router = Router();

const canManage = (req: any): boolean => {
	const r = req.headers['x-user-role'];
	return r === 'super_admin' || r === 'gerente';
};

// GET /api/tasks
router.get('/', async (_req: any, res: any) => {
  const db = getPool();
  try {
    const r = await db.query('SELECT * FROM tasks ORDER BY done, created_at DESC');
    res.json(r.rows.map(toCamel));
  } catch (err) {
    console.error('[tasks GET]', err);
    res.status(500).json({ error: 'Error al cargar tareas' });
  }
});

// POST /api/tasks
router.post('/', async (req: any, res: any) => {
	if (!canManage(req))
		return res.status(403).json({ error: 'Solo el CEO y el Gerente General pueden agregar tareas' });
  const db = getPool();
  try {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    if (!title) return res.status(400).json({ error: 'El título de la tarea es obligatorio' });
    const id = randomUUID();
    const r = await db.query(
      'INSERT INTO tasks (id, title) VALUES ($1, $2) RETURNING *',
      [id, title]
    );
    res.json({ success: true, task: toCamel(r.rows[0]) });
  } catch (err) {
    console.error('[tasks POST]', err);
    res.status(500).json({ error: 'Error al crear la tarea' });
  }
});

// PUT /api/tasks/:id - toggle done / rename
router.put('/:id', async (req: any, res: any) => {
  const db = getPool();
  try {
    const title =
      req.body?.title !== undefined
        ? typeof req.body.title === 'string'
          ? req.body.title.trim()
          : ''
        : null;
    if (req.body?.title !== undefined && !title) {
      return res.status(400).json({ error: 'El título de la tarea no puede estar vacío' });
    }
    const done = req.body?.done !== undefined ? !!req.body.done : null;
    const r = await db.query(
      'UPDATE tasks SET title = COALESCE($1, title), done = COALESCE($2, done) WHERE id = $3',
      [title, done, req.params.id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    const t = await db.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true, task: toCamel(t.rows[0]) });
  } catch (err) {
    console.error('[tasks PUT]', err);
    res.status(500).json({ error: 'Error al guardar la tarea' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req: any, res: any) => {
	if (!canManage(req))
		return res.status(403).json({ error: 'Solo el CEO y el Gerente General pueden gestionar tareas' });
  const db = getPool();
  try {
    const r = await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json({ success: true });
  } catch (err) {
    console.error('[tasks DELETE]', err);
    res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
});

export default router;
