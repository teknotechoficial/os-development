import { Router } from 'express';
import { getPool, mapRows, toCamel } from '../db';
import { randomUUID } from 'crypto';
import { calculateBasePrice, calculateFinalPrice } from '../../src/shared/pricing';
import { notify, notifyRoles } from '../notifications';

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
		res.json(mapRows(q.rows).map((row) => ({ ...row, config: parseConfig(row.config), items: parseConfig(row.items) })));
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
	const { productType, config, clientName, clientType, sellerId, developerId, items, actorId } = req.body;
	try {
		const id = randomUUID();
		const now = new Date().toISOString();
		let base = 0;
		let normalizedItems: any[] = [];
		if (Array.isArray(items) && items.length) {
			const serviceIds = Array.from(new Set(items.map((it: any) => it && it.serviceId).filter(Boolean)));
			const s = await db.query('SELECT id, name, base_price, active FROM services WHERE id = ANY($1)', [serviceIds]);
			const byId = new Map(s.rows.map((row: any) => [row.id, row]));
			let sum = 0;
			for (const it of items) {
				const serviceId = it && it.serviceId;
				const svc = serviceId ? byId.get(serviceId) : undefined;
				if (!svc) {
					return res.status(400).json({ error: 'Servicio inexistente: id' });
				}
				if (!svc.active) {
					return res.status(400).json({ error: `Servicio inactivo: ${svc.name}` });
				}
				const quantity = Math.max(1, Math.floor(Number(it.quantity)) || 1);
				const unitPrice = Number(svc.base_price) || 0;
				sum += unitPrice * quantity;
				normalizedItems.push({ serviceId: svc.id, name: svc.name, unitPrice, quantity });
			}
			base = sum;
		} else {
			base = calculateBasePrice(productType, config);
		}
		/* Total = sum of selected services (or legacy base), never below the
		   CEO-configured minimum sale price (settings.margin_minimum) */
		const st = await db.query("SELECT margin_minimum FROM settings WHERE id = 'app'");
		const floor = st.rows[0] && st.rows[0].margin_minimum !== null ? Number(st.rows[0].margin_minimum) : undefined;
		const finalPrice = calculateFinalPrice(base, floor);
		const appliedMargin = finalPrice - base;
		await db.query(
			'INSERT INTO quotes (id, client_name, client_type, product_type, config, items, base_price, margin, final_price, seller_id, developer_id, assigned_at, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',
			[id, clientName, clientType, productType, JSON.stringify(config), JSON.stringify(normalizedItems || []), base, appliedMargin, finalPrice, sellerId, developerId || null, developerId ? now : null, now, now]
		);
		try {
			if (developerId) {
				await notify(db, [developerId], 'quote_created', 'Nueva cotización asignada', `${clientName}`, id);
			} else {
				await notifyRoles(db, ['super_admin', 'gerente'], 'quote_created', 'Nueva cotización creada', `${clientName}`, id);
			}
		} catch (err) {
			console.log('[quotes POST notify]', err);
		}
		const q = await db.query('SELECT * FROM quotes WHERE id = $1', [id]);
		const row = toCamel(q.rows[0]);
		res.json({ ...row, config: parseConfig(row.config), items: parseConfig(row.items) });
	} catch (err) {
		console.error('[quotes POST]', err);
		res.status(500).json({ error: 'Error al crear cotización' });
	}
});

router.put('/:id', async (req: any, res: any) => {
	const db = getPool();
	const { id } = req.params;
	const { status, developerId, actorId } = req.body;
	if (status !== undefined && status !== null && !VALID_STATUSES.includes(status)) {
		return res.status(400).json({ error: 'Estado inválido' });
	}
	try {
		const prevQ = await db.query('SELECT status, developer_id, seller_id, client_name FROM quotes WHERE id = $1', [id]);
		if (prevQ.rows.length === 0) {
			return res.status(404).json({ error: 'Cotización no encontrada' });
		}
		const prev = prevQ.rows[0];
		const result = await db.query(
			'UPDATE quotes SET status = COALESCE($1, status), developer_id = COALESCE($2, developer_id), updated_at = $3 WHERE id = $4',
			[status || null, developerId || null, new Date().toISOString(), id]
		);
		if (result.rowCount === 0) {
			return res.status(404).json({ error: 'Cotización no encontrada' });
		}
		try {
			const clientName = prev.client_name;
			const recipients = (ids: any[]) => ids.filter((uid) => uid && uid !== actorId);
			if (status && status !== prev.status) {
				if (status === 'enviada') {
					await notifyRoles(db, ['super_admin', 'gerente'], 'quote_sent', 'Cotización enviada', clientName, id);
				} else if (status === 'aceptada') {
					await notify(db, recipients([prev.seller_id, prev.developer_id]), 'quote_accepted', 'Cotización aceptada', clientName, id);
				} else if (status === 'rechazada') {
					await notify(db, recipients([prev.seller_id, prev.developer_id]), 'quote_rejected', 'Cotización rechazada', clientName, id);
				} else if (status === 'pagada') {
					await notify(db, recipients([prev.seller_id]), 'quote_paid', 'Cotización pagada', clientName, id);
				}
			}
			if (developerId && prev.developer_id && developerId !== prev.developer_id) {
				await notify(db, recipients([developerId]), 'quote_reassigned', 'Cotización reasignada', clientName, id);
			}
		} catch (err) {
			console.log('[quotes PUT notify]', err);
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
		const check = await db.query('SELECT id, seller_id, developer_id, client_name FROM quotes WHERE id = $1', [id]);
		if (check.rowCount === 0) {
			return res.status(404).json({ error: 'Cotización no encontrada' });
		}
		const prev = check.rows[0];
		await db.query('UPDATE notifications SET quote_id = NULL WHERE quote_id = $1', [id]);
		await db.query('DELETE FROM quotes WHERE id = $1', [id]);
		try {
			await notify(db, [prev.seller_id, prev.developer_id], 'quote_deleted', 'Cotización eliminada', `${prev.client_name}`);
		} catch (err) {
			console.log('[quotes DELETE notify]', err);
		}
		res.json({ success: true });
	} catch (err) {
		console.error('[quotes DELETE]', err);
		res.status(500).json({ error: 'Error al eliminar la cotización' });
	}
});

function quoteRow(row: any): any {
	const camel = toCamel(row);
	return { ...camel, config: parseConfig(camel.config), items: parseConfig(camel.items) };
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
