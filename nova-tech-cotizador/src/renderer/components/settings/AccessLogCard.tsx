import React, { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { apiUrl } from '@/renderer/api';
import { Card, Skeleton } from '@/renderer/components/ui';

interface AccessLogCardProps {
	email?: string | null;
	code?: string | null;
	refreshKey?: number; // si cambia → refetch
}

interface AccessLogItem {
	id: string;
	identifier: string;
	success: boolean;
	ip: string | null;
	createdAt: string;
}

const CARD_CLASS = 'p-6 bg-[#10233E] border border-[#1C3557] rounded-2xl';
const SECTION_TITLE = 'font-display text-sm uppercase tracking-[0.12em] text-white';

const AccessLogCard: React.FC<AccessLogCardProps> = ({ email, code, refreshKey }) => {
	const [items, setItems] = useState<AccessLogItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);

	useEffect(() => {
		const identifiers = [email, code].filter(Boolean).join(',');
		if (!identifiers) {
			setItems([]);
			setLoading(false);
			setError(false);
			return;
		}
		const controller = new AbortController();
		setLoading(true);
		setError(false);
		fetch(apiUrl('/api/auth/access-log?identifiers=' + encodeURIComponent(identifiers)), {
			signal: controller.signal,
		})
			.then((response) => {
				if (!response.ok) throw new Error('fetch failed');
				return response.json();
			})
			.then((data: { items?: AccessLogItem[] }) => setItems(Array.isArray(data.items) ? data.items : []))
			.catch(() => {
				if (!controller.signal.aborted) setError(true);
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false);
			});
		return () => controller.abort();
	}, [email, code, refreshKey]);

	return (
		<Card className={CARD_CLASS}>
			<div id="settings-access-log">
				<div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#16294A]">
					<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
						<History className="w-4 h-4" />
					</span>
					<div>
						<h2 className={SECTION_TITLE}>Actividad de accesos</h2>
						<p className="text-xs text-[#5B7295]">Últimos intentos de entrada a tu cuenta</p>
					</div>
				</div>

				{loading ? (
					<div className="space-y-3">
						<Skeleton className="h-6 w-full" />
						<Skeleton className="h-6 w-full" />
						<Skeleton className="h-6 w-full" />
					</div>
				) : error ? (
					<p className="text-xs text-[#FB7185] py-4">No se pudo cargar el historial</p>
				) : items.length === 0 ? (
					<p className="text-xs text-[#5B7295] py-4 text-center">Sin intentos registrados</p>
				) : (
					<table className="w-full">
						<thead className="text-[10px] uppercase tracking-[0.18em] text-[#5B7295] text-left">
							<tr>
								<th className="pb-3 border-b border-[#1C3557]">FECHA</th>
								<th className="pb-3 border-b border-[#1C3557]">RESULTADO</th>
								<th className="pb-3 border-b border-[#1C3557]">DIRECCIÓN</th>
							</tr>
						</thead>
						<tbody>
							{items.map((item) => (
								<tr
									key={item.id}
									className="border-b border-[#16294A] hover:bg-[#14294A] text-sm text-[#D6E2F2]"
								>
									<td className="py-3">{new Date(item.createdAt).toLocaleString('es-ES')}</td>
									<td className="py-3">
										{item.success ? (
											<span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider bg-[#34D399]/15 border border-[#34D399]/40 text-[#34D399]">
												OK
											</span>
										) : (
											<span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider bg-[#E11D48]/10 border border-[#E11D48]/30 text-[#FB7185]">
												FALLÓ
											</span>
										)}
									</td>
									<td className="py-3">{item.ip || '—'}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</Card>
	);
};

export default AccessLogCard;
