import { Router } from 'express';
import { getPool, mapRows } from '../db';
import { randomUUID } from 'crypto';

const router = Router();

router.get('/', async (_req: any, res: any) => {
  const db = getPool();
  try {
    const u = await db.query(
      'SELECT id, name, code, role, email, is_active, has_credentials, avatar, title, phone, bio, created_at FROM users ORDER BY role, name'
    );
    res.json(mapRows(u.rows));
  } catch (err) {
    res.status(500).json({ error: 'Error en servidor' });
  }
});

router.post('/', async (req: any, res: any) => {
  const db = getPool();
  const { name, code, role, email, title } = req.body;
  try {
    if (title !== undefined && title !== null && (typeof title !== 'string' || title.length > 80)) {
      return res.status(400).json({ error: 'Cargo demasiado largo' });
    }
    const id = randomUUID();
    await db.query(
      'INSERT INTO users (id, name, code, role, email, title, password_hash, has_credentials, is_active) VALUES ($1, $2, $3, $4, $5, $6, NULL, false, true)',
      [id, name, code, role, email, title ? String(title).trim() : null]
    );
    res.json({ id, name, code, role, email, success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// PUT /api/team/:id - update member profile (sector/role, name, email)
const VALID_ROLES = ['super_admin', 'gerente', 'vendedor', 'closer', 'desarrollador'];

	router.put('/:id', async (req: any, res: any) => {
  const db = getPool();
	const { role, name, email, avatar, title, phone, bio, isActive } = req.body;
	try {
		if (role !== undefined && !VALID_ROLES.includes(role)) {
			return res.status(400).json({ error: 'Sector no válido' });
		}
		const textFields: [string, any, number][] = [
			['title', title, 80],
			['phone', phone, 40],
			['bio', bio, 300],
		];
		for (const [, value, max] of textFields) {
			if (value === undefined || value === null) continue;
			if (typeof value !== 'string') {
				return res.status(400).json({ error: 'Formato no válido' });
			}
			if (value.trim().length > max) {
				return res.status(400).json({ error: 'Texto demasiado largo' });
			}
		}
		const sets: string[] = [];
    const values: any[] = [];
    if (role !== undefined) {
      values.push(role);
      sets.push(`role = $${values.length}`);
    }
    if (name !== undefined) {
      values.push(String(name).trim());
      sets.push(`name = $${values.length}`);
    }
    if (email !== undefined) {
      values.push(String(email).trim());
      sets.push(`email = $${values.length}`);
    }
    if (avatar !== undefined) {
      const value = avatar === null ? null : String(avatar);
      if (value && !/^data:image\/(png|jpe?g|webp|gif);base64,/.test(value)) {
        return res.status(400).json({ error: 'Imagen de perfil no válida' });
      }
      if (value && value.length > 400000) {
        return res.status(400).json({ error: 'La imagen es demasiado grande (máx. 300 KB)' });
      }
			values.push(value);
			sets.push(`avatar = $${values.length}`);
		}
		if (title !== undefined) {
			values.push(title === null ? null : title.trim());
			sets.push(`title = $${values.length}`);
		}
		if (phone !== undefined) {
			values.push(phone === null ? null : phone.trim());
			sets.push(`phone = $${values.length}`);
		}
		if (bio !== undefined) {
			values.push(bio === null ? null : bio.trim());
			sets.push(`bio = $${values.length}`);
		}
		if (isActive !== undefined && isActive !== null) {
			const target = await db.query('SELECT role FROM users WHERE id = $1', [req.params.id]);
			if (target.rows[0] && target.rows[0].role === 'super_admin' && !isActive) {
				return res.status(400).json({ error: 'No se puede desactivar al CEO' });
			}
			values.push(!!isActive);
			sets.push(`is_active = $${values.length}`);
		}
		if (sets.length === 0) {
			return res.status(400).json({ error: 'No hay datos para actualizar' });
		}
		values.push(req.params.id);
		const r = await db.query(
			`UPDATE users SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING id, name, code, role, email, title, phone, bio, is_active`,
			values
		);
    if (r.rowCount === 0) return res.status(400).json({ error: 'Usuario no encontrado.' });
    res.json({ ...mapRows(r.rows)[0], success: true });
  } catch (err) {
    console.error('[team PUT]', err);
    res.status(500).json({ error: 'Error al actualizar el miembro' });
  }
});

// DELETE /api/team/:id - remove member (and their notifications/availability)
router.delete('/:id', async (req: any, res: any) => {
  const db = getPool();
  try {
    const check = await db.query('SELECT id, name, role FROM users WHERE id = $1', [req.params.id]);
    if (check.rowCount === 0) return res.status(404).json({ error: 'Miembro no encontrado' });
    if (check.rows[0].role === 'super_admin') {
      return res.status(400).json({ error: 'No se puede eliminar al CEO' });
    }
    await db.query('DELETE FROM notifications WHERE user_id = $1', [req.params.id]);
    await db.query('DELETE FROM availability WHERE developer_id = $1', [req.params.id]);
    await db.query('DELETE FROM recovery_tokens WHERE user_id = $1', [req.params.id]);
    await db.query('UPDATE quotes SET developer_id = NULL WHERE developer_id = $1', [req.params.id]);
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true, name: check.rows[0].name });
  } catch (err) {
    console.error('[team DELETE]', err);
    res.status(500).json({ error: 'Error al eliminar el miembro' });
  }
});

// PUT /api/team/:id/reset-credentials - clear password/PIN so the user sets them on first login
router.put('/:id/reset-credentials', async (req: any, res: any) => {
  const db = getPool();
  try {
    const r = await db.query(
      'UPDATE users SET password_hash = NULL, pin_hash = NULL, has_credentials = false WHERE id = $1',
      [req.params.id]
    );
    if (r.rowCount === 0) return res.status(400).json({ error: 'Usuario no encontrado.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al restablecer credenciales' });
  }
});

export default router;
