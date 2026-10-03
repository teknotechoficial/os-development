import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getPool, toCamel } from '../db';
import { notifyRoles } from '../notifications';

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
	if (body.icon !== undefined && body.icon !== null)
		out.icon = typeof body.icon === 'string' ? body.icon.trim() : body.icon;
	if (body.active !== undefined && body.active !== null) out.active = !!body.active;
	if (body.sortOrder !== undefined && body.sortOrder !== null) out.sortOrder = Number(body.sortOrder);
	return out;
}

// Límites de `icon` (coherentes con express.json({ limit: '2mb' }) en server/index.ts):
// - dataURL de imagen (p.ej. PNG 512x512 en base64): máx. 1.9 MB
// - `img:` + dataURL (icono personalizado convertido a silueta en el cliente): máx. 1.9 MB total
// - URL http(s) o ruta relativa (/...): máx. 2048 caracteres
// - identificador corto (nombres lucide, p.ej. "Globe" / "lucide:globe"): máx. 120 caracteres
const MAX_ICON_DATA_URL = 1_900_000;
const MAX_ICON_URL = 2048;
const MAX_ICON_IDENTIFIER = 120;
const DATA_URL_ICON_RE = /^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/]+={0,2}$/i;

function validateIcon(icon: unknown): string | null {
	if (icon === undefined || icon === null) return null;
	if (typeof icon !== 'string') return 'El icono debe ser texto.';
	const value = icon.trim();
	if (value === '') return null;
	if (value.startsWith('img:')) {
		const inner = value.slice(4).trim();
		if (!DATA_URL_ICON_RE.test(inner)) {
			return 'Icono img: inválido: se espera img:data:image/...;base64,...';
		}
		if (value.length > MAX_ICON_DATA_URL) return 'El icono supera el tamaño máximo permitido (1.9 MB).';
		return null;
	}
	if (value.startsWith('data:')) {
		if (!DATA_URL_ICON_RE.test(value)) {
			return 'Icono dataURL inválido: se espera una imagen en base64 (data:image/...;base64,...).';
		}
		if (value.length > MAX_ICON_DATA_URL) return 'El icono supera el tamaño máximo permitido (1.9 MB).';
		return null;
	}
	if (/^https?:\/\/\S+$/i.test(value) || value.startsWith('/')) {
		if (value.length > MAX_ICON_URL) return 'La URL del icono es demasiado larga (máx. 2048 caracteres).';
		if (/[\s\p{Cc}\p{Cf}]/u.test(value)) return 'La URL del icono contiene caracteres no válidos.';
		return null;
	}
	if (value.length > MAX_ICON_IDENTIFIER) {
		return 'El nombre del icono es demasiado largo (máx. 120 caracteres): usá un nombre corto, una URL o un dataURL de imagen.';
	}
	if (/[\s\p{Cc}\p{Cf}]/u.test(value)) {
		return 'Nombre de icono inválido: usá un nombre corto sin espacios (p.ej. "Globe"), una URL o un dataURL de imagen.';
	}
	return null;
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
	if (fields.icon !== undefined) {
		const iconError = validateIcon(fields.icon);
		if (iconError) return iconError;
	}
	return null;
}

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
		await notifyRoles(db, ['super_admin', 'gerente'], 'service_created', 'Nuevo servicio en el catálogo', fields.name);
		res.json({ success: true, service: toCamel(r.rows[0]) });
	} catch (err) {
		console.error('[services POST]', err);
		res.status(500).json({ error: 'Error al crear servicio' });
	}
});

router.put('/:id', async (req: any, res: any) => {
	const db = getPool();
	try {
		const fields = readFields(req.body || {});
		const invalid = validateFields(fields, false);
		if (invalid) return res.status(400).json({ error: invalid });
		if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'No hay datos para actualizar.' });

		const prevQ = await db.query('SELECT base_price, active, name FROM services WHERE id = $1', [req.params.id]);
		if (prevQ.rows.length === 0) return res.status(400).json({ error: 'Servicio no encontrado.' });
		const prev = prevQ.rows[0];

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

		const priceChanged = fields.basePrice !== undefined && Number(fields.basePrice) !== Number(prev.base_price);
		const activeChanged = fields.active !== undefined && !!fields.active !== !!prev.active;
		if (priceChanged || activeChanged) {
			const name = fields.name !== undefined ? fields.name : prev.name;
			await notifyRoles(db, ['super_admin', 'gerente'], 'service_changed', 'Servicio actualizado', `${name}: precio/estado modificado`);
		}

		const s = await db.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
		res.json({ success: true, service: toCamel(s.rows[0]) });
	} catch (err) {
		console.error('[services PUT]', err);
		res.status(500).json({ error: 'Error al guardar servicio' });
	}
});

router.delete('/:id', async (req: any, res: any) => {
	const db = getPool();
	try {
		const prev = await db.query('SELECT id, name FROM services WHERE id = $1', [req.params.id]);
		if (prev.rowCount === 0) return res.status(400).json({ error: 'Servicio no encontrado.' });

		await db.query('DELETE FROM services WHERE id = $1', [req.params.id]);
		await notifyRoles(db, ['super_admin', 'gerente'], 'service_changed', 'Servicio eliminado', prev.rows[0].name);
		res.json({ success: true });
	} catch (err) {
		console.error('[services DELETE]', err);
		res.status(500).json({ error: 'Error al eliminar servicio' });
	}
});

export default router;
