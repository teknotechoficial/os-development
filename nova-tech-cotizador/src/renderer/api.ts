export const API_BASE =
	typeof window !== 'undefined' && window.location.protocol === 'file:'
		? 'http://localhost:3001'
		: '';

export function apiUrl(path: string): string {
	return API_BASE + path;
}

export async function postJson(path: string, body?: unknown): Promise<any> {
	const response = await fetch(apiUrl(path), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	let data: any = null;
	try {
		data = await response.json();
	} catch {
		data = null;
	}
	if (!response.ok || !data || data.error) {
		throw new Error((data && data.error) || 'No se pudo conectar con el servidor');
	}
	return data;
}

/* CEO-configured display name cached at login / settings save (public branding) */
export function readCompany(): string {
	try {
		const raw = window.localStorage.getItem('nt_pub_settings');
		const parsed = raw ? JSON.parse(raw) : null;
		if (
			parsed &&
			typeof parsed === 'object' &&
			typeof parsed.name === 'string' &&
			parsed.name.trim()
		) {
			return parsed.name.trim().slice(0, 80);
		}
	} catch {
		/* localStorage no disponible */
	}
	return 'TeknoTech Services';
}
