import React, { useEffect, useMemo, useState } from 'react';
import { CheckCheck, CircleDollarSign, Coins, Download, FileText } from 'lucide-react';
import { useQuotes } from '@/renderer/store/quotes';
import { useTeam } from '@/renderer/store/team';
import { STATUS_LABELS } from '@/shared/constants';
import { formatCurrency } from '@/shared/validators';
import { Button, Card, EmptyState, Spinner, StatCard } from '@/renderer/components/ui';

const MONTH_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const BAR_COLOR = '#1877E8';
const SECTION_TITLE = 'font-display text-sm uppercase tracking-[0.15em] text-white mb-4';

const STATUS_KEYS = ['borrador', 'enviada', 'aceptada', 'rechazada', 'pagada'] as const;
const STATUS_BARS: Record<string, string> = {
	borrador: '#5B7295',
	enviada: '#1877E8',
	aceptada: '#22C55E',
	rechazada: '#E11D48',
	pagada: '#F5A623',
};

const PRODUCT_KEYS = ['web', 'store', 'app', 'custom', 'maintenance', 'seo'] as const;
const PRODUCT_LABELS: Record<string, string> = {
	web: 'Sitio Web',
	store: 'Tienda Online',
	app: 'App Móvil',
	custom: 'Software a Medida',
	maintenance: 'Mantenimiento',
	seo: 'SEO/Marketing',
};

const monthKeyOf = (dateStr: string): string => {
	const d = new Date(dateStr);
	return `${d.getFullYear()}-${d.getMonth()}`;
};

const pctOf = (part: number, total: number): number => (total > 0 ? Math.round((part / total) * 100) : 0);

const compactAmount = (value: number): string => {
	if (value >= 10000) return `$${Math.round(value / 1000)}k`;
	if (value >= 1000) return `$${(value / 1000).toFixed(1).replace('.0', '')}k`;
	return `$${Math.round(value)}`;
};

const csvCell = (value: string): string =>
	/[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const Reports: React.FC = () => {
	const { quotes, fetchMyQuotes } = useQuotes();
	const { users, fetchTeam } = useTeam();
	const [loading, setLoading] = useState(true);
	const [period, setPeriod] = useState(6);

	useEffect(() => {
		let active = true;
		Promise.all([fetchMyQuotes(), fetchTeam()]).finally(() => {
			if (active) setLoading(false);
		});
		return () => {
			active = false;
		};
	}, []);

	const filtered = useMemo(() => {
		const now = new Date();
		const cutoff = new Date(now.getFullYear(), now.getMonth() - period + 1, 1).getTime();
		return quotes.filter((q) => new Date(q.createdAt).getTime() >= cutoff);
	}, [quotes, period]);

	const totalCount = filtered.length;
	const totalAmount = filtered.reduce((acc, q) => acc + q.finalPrice, 0);
	const acceptedCount = filtered.filter((q) => q.status === 'aceptada' || q.status === 'pagada').length;
	const averageTicket = totalCount > 0 ? totalAmount / totalCount : 0;

	const salesByMonth = useMemo(() => {
		const now = new Date();
		const buckets: { key: string; label: string; total: number }[] = [];
		for (let i = period - 1; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
			buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_SHORT[d.getMonth()], total: 0 });
		}
		filtered.forEach((q) => {
			const bucket = buckets.find((b) => b.key === monthKeyOf(q.createdAt));
			if (bucket) bucket.total += q.finalPrice;
		});
		return buckets;
	}, [filtered, period]);

	const statusStats = useMemo(() => {
		const total = filtered.length;
		return STATUS_KEYS.map((key) => {
			const count = filtered.filter((q) => q.status === key).length;
			return {
				key,
				label: STATUS_LABELS[key] || key,
				color: STATUS_BARS[key],
				count,
				pct: pctOf(count, total),
			};
		});
	}, [filtered]);

	const sellerStats = useMemo(() => {
		const list = Array.isArray(users) ? users : [];
		const totals = new Map<string, { name: string; count: number; total: number }>();
		filtered.forEach((q) => {
			const found = list.find((u) => u.id === q.sellerId);
			const name = found ? found.name : 'Vendedor';
			const key = q.sellerId || name;
			const prev = totals.get(key);
			totals.set(key, {
				name,
				count: (prev ? prev.count : 0) + 1,
				total: (prev ? prev.total : 0) + q.finalPrice,
			});
		});
		return Array.from(totals, ([id, value]) => ({ id, ...value })).sort((a, b) => b.total - a.total);
	}, [filtered, users]);

	const serviceStats = useMemo(() => {
		const totals: Record<string, { count: number; total: number }> = {};
		PRODUCT_KEYS.forEach((key) => {
			totals[key] = { count: 0, total: 0 };
		});
		filtered.forEach((q) => {
			const key = q.productType || 'custom';
			if (!totals[key]) totals[key] = { count: 0, total: 0 };
			totals[key].count += 1;
			totals[key].total += q.finalPrice;
		});
		return Object.entries(totals)
			.filter(([, value]) => value.count > 0)
			.map(([key, value]) => ({
				key,
				label: PRODUCT_LABELS[key] || key,
				...value,
			}));
	}, [filtered]);

	const topClients = useMemo(() => {
		const totals = new Map<string, { count: number; total: number }>();
		filtered.forEach((q) => {
			const name = q.clientName || 'Sin nombre';
			const prev = totals.get(name);
			totals.set(name, {
				count: (prev ? prev.count : 0) + 1,
				total: (prev ? prev.total : 0) + q.finalPrice,
			});
		});
		return Array.from(totals, ([name, value]) => ({ name, ...value }))
			.sort((a, b) => b.total - a.total)
			.slice(0, 5);
	}, [filtered]);

	const maxTotal = salesByMonth.reduce((max, b) => Math.max(max, b.total), 0);
	const maxSellerTotal = sellerStats.reduce((max, s) => Math.max(max, s.total), 0);
	const baselineY = 184;
	const slotWidth = 576 / (salesByMonth.length || 1);

	const exportCsv = () => {
		const header = 'fecha;cliente;producto;estado;total';
		const rows = [...filtered]
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.map((q) =>
				[
					new Date(q.createdAt).toLocaleDateString('es-ES'),
					q.clientName || '',
					PRODUCT_LABELS[q.productType] || q.productType || '',
					STATUS_LABELS[q.status] || q.status,
					String(q.finalPrice),
				]
					.map(csvCell)
					.join(';')
			);
		const csv = '\uFEFF' + [header, ...rows].join('\r\n') + '\r\n';
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'reportes-nova-tech.csv';
		link.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="max-w-7xl mx-auto">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
				<div>
					<h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white animate-title-in">REPORTES</h1>
					<p className="text-xs uppercase tracking-[0.25em] text-[#8FA6C4] mt-2">ANÁLISIS DE TU ACTIVIDAD</p>
				</div>
				<div className="flex items-center gap-3">
					<select
						value={period}
						onChange={(e) => setPeriod(Number(e.target.value))}
						className="bg-[#0C1E36] border border-[#1C3557] text-[#8FA6C4] text-[11px] uppercase tracking-widest rounded-lg px-3 py-2 focus:outline-none"
					>
						<option value={3}>ÚLTIMOS 3 MESES</option>
						<option value={6}>ÚLTIMOS 6 MESES</option>
						<option value={12}>ÚLTIMOS 12 MESES</option>
					</select>
					<Button variant="secondary" onClick={exportCsv}>
						<Download className="w-4 h-4" />
						EXPORTAR CSV
					</Button>
				</div>
			</div>

			{loading ? (
				<div className="flex justify-center py-24">
					<Spinner />
				</div>
			) : totalCount === 0 ? (
				<Card className="p-6">
					<EmptyState
						icon={FileText}
						title="Sin datos en el periodo"
						description={`No hay cotizaciones en los últimos ${period} meses`}
					/>
				</Card>
			) : (
				<>
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
						<StatCard label="Cotizaciones en periodo" value={String(totalCount)} icon={FileText} tone="blue" />
						<StatCard label="Monto total" value={formatCurrency(totalAmount)} icon={CircleDollarSign} tone="green" />
						<StatCard
							label="Aceptadas"
							value={String(acceptedCount)}
							icon={CheckCheck}
							tone="green"
						/>
						<StatCard label="Ticket promedio" value={formatCurrency(averageTicket)} icon={Coins} tone="amber" />
					</div>

					<div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
						<Card className="p-6 xl:col-span-2">
							<h2 className={SECTION_TITLE}>VENTAS POR MES</h2>
							{maxTotal <= 0 ? (
								<EmptyState
									icon={Coins}
									title="Sin ventas en el periodo"
									description={`No hay montos en los últimos ${period} meses`}
								/>
							) : (
								<svg viewBox="0 0 600 220" className="w-full h-[220px]">
									<line x1="12" y1={baselineY} x2="588" y2={baselineY} stroke="#1C3557" strokeWidth="1" />
									{salesByMonth.map((bucket, i) => {
										const barWidth = Math.min(slotWidth * 0.5, 46);
										const x = 12 + i * slotWidth + (slotWidth - barWidth) / 2;
										const height = maxTotal > 0 ? (bucket.total / maxTotal) * (baselineY - 16) : 0;
										return (
											<g key={bucket.key}>
												<rect
													x={x}
													y={baselineY - height}
													width={barWidth}
													height={height}
													rx="3"
													fill={BAR_COLOR}
													fillOpacity={0.85}
												/>
												{bucket.total > 0 ? (
													<text
														x={x + barWidth / 2}
														y={baselineY - height - 5}
														textAnchor="middle"
														fontSize={8}
														fill="#8FA6C4"
													>
														{compactAmount(bucket.total)}
													</text>
												) : null}
												<text
													x={x + barWidth / 2}
													y="202"
													textAnchor="middle"
													className="text-[9px]"
													fill="#5B7295"
												>
													{bucket.label}
												</text>
											</g>
										);
									})}
								</svg>
							)}
						</Card>

						<Card className="p-6">
							<h2 className={SECTION_TITLE}>POR ESTADO</h2>
							<div className="space-y-4">
								{statusStats.map((s) => (
									<div key={s.key}>
										<div className="flex items-center justify-between gap-3 text-xs mb-1.5">
											<span className="uppercase tracking-widest text-[#8FA6C4]">{s.label}</span>
											<span className="text-[#D6E2F2] font-medium shrink-0">
												{s.count} · {s.pct}%
											</span>
										</div>
										<div className="h-1.5 rounded-full bg-[#0C1E36] overflow-hidden">
											<div
												className="h-1.5 rounded-full opacity-80"
												style={{ width: `${s.pct}%`, backgroundColor: s.color }}
											/>
										</div>
									</div>
								))}
							</div>
						</Card>
					</div>

					<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
						<Card className="p-6">
							<h2 className={SECTION_TITLE}>POR VENDEDOR</h2>
							<div className="space-y-4">
								{sellerStats.map((s) => {
									const width = maxSellerTotal > 0 ? (s.total / maxSellerTotal) * 100 : 0;
									return (
										<div key={s.id}>
											<div className="flex items-center justify-between gap-3 text-xs mb-1.5">
												<span className="text-[#D6E2F2] truncate">{s.name}</span>
												<span className="text-white font-medium shrink-0">{formatCurrency(s.total)}</span>
											</div>
											<div className="h-2 rounded-full bg-[#0C1E36] overflow-hidden">
												<div className="h-2 rounded-full bg-[#1877E8]" style={{ width: `${width}%` }} />
											</div>
										</div>
									);
								})}
							</div>
						</Card>

						<Card className="p-6">
							<h2 className={SECTION_TITLE}>POR SERVICIO</h2>
							<table className="w-full">
								<thead className="text-[10px] uppercase tracking-[0.18em] text-[#5B7295] text-left">
									<tr>
										<th className="pb-3 border-b border-[#1C3557]">SERVICIO</th>
										<th className="pb-3 border-b border-[#1C3557] text-right">COTIZACIONES</th>
										<th className="pb-3 border-b border-[#1C3557] text-right">TOTAL</th>
									</tr>
								</thead>
								<tbody className="stagger-in">
									{serviceStats.map((s) => (
										<tr key={s.key} className="border-b border-[#16294A] text-sm text-[#D6E2F2]">
											<td className="py-3">{s.label}</td>
											<td className="py-3 text-right">{s.count}</td>
											<td className="py-3 text-right font-medium text-white">{formatCurrency(s.total)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</Card>
					</div>

					<Card className="p-6">
						<h2 className={SECTION_TITLE}>TOP CLIENTES</h2>
						{topClients.map((c, i) => (
							<div
								key={c.name}
								className="flex items-center gap-4 py-3 border-b border-[#16294A] last:border-b-0"
							>
								<span className="font-display text-lg font-bold text-[#5B7295] w-8 text-center shrink-0">
									{i + 1}
								</span>
								<div className="flex-1 min-w-0">
									<p className="text-sm text-white truncate">{c.name}</p>
									<p className="text-xs text-[#5B7295]">
										{c.count} {c.count === 1 ? 'cotización' : 'cotizaciones'}
									</p>
								</div>
								<span className="text-sm font-medium text-white shrink-0">{formatCurrency(c.total)}</span>
							</div>
						))}
					</Card>
				</>
			)}
		</div>
	);
};

export default Reports;
