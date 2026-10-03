import { randomUUID } from 'crypto';

export async function notify(
	db: any,
	userIds: string[],
	type: string,
	title: string,
	message: string,
	quoteId?: string
): Promise<void> {
	try {
		const ids = Array.from(
			new Set((userIds || []).filter((id) => typeof id === 'string' && id.trim() !== ''))
		);
		if (ids.length === 0) return;
		const now = new Date().toISOString();
		for (const userId of ids) {
			await db.query(
				'INSERT INTO notifications (id, user_id, type, title, message, quote_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
				[randomUUID(), userId, type, title, message, quoteId || null, now]
			);
		}
	} catch (err) {
		console.log('[notifications]', err);
	}
}

export async function notifyRoles(
	db: any,
	roles: string[],
	type: string,
	title: string,
	message: string,
	quoteId?: string
): Promise<void> {
	try {
		const r = await db.query('SELECT id FROM users WHERE role = ANY($1) AND is_active = true', [
			roles || [],
		]);
		await notify(
			db,
			(r.rows || []).map((row: any) => row.id),
			type,
			title,
			message,
			quoteId
		);
	} catch (err) {
		console.log('[notifications:roles]', err);
	}
}
