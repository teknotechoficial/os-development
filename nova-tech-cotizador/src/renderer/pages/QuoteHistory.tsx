import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FilePlus2, FileSearch, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '@/renderer/store/auth';
import { useQuotes } from '@/renderer/store/quotes';
import { useTeam } from '@/renderer/store/team';
import { apiUrl } from '@/renderer/api';
import { PRODUCT_NAMES, STATUS_LABELS } from '@/shared/constants';
import { formatCurrency } from '@/shared/validators';
import { Button, Card, EmptyState, PageHeader, Spinner } from '@/renderer/components/ui';
import StatusBadge from '@/renderer/components/StatusBadge';

type StatusFilter = 'todos' | 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'pagada';
type SortOption = 'recent' | 'old' | 'price';

const ACTIVE_STATUSES = ['borrador', 'enviada', 'aceptada'];
const ARCHIVED_STATUSES = ['pagada', 'rechazada'];

interface QuoteHistoryProps {
	mode?: 'active' | 'archived';
}

const QuoteHistory: React.FC<QuoteHistoryProps> = ({ mode = 'active' }) => {
	const { user } = useAuth();
	const { quotes, fetchMyQuotes, removeQuote } = useQuotes();
	const { users, fetchTeam } = useTeam();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState('');
	const [status, setStatus] = useState<StatusFilter>('todos');
	const [scope, setScope] = useState<'archived' | 'all'>('archived');
	const [sort, setSort] = useState<SortOption>('recent');
	const [manage, setManage] = useState(false);
	const [confirmId, setConfirmId] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		Promise.all([fetchMyQuotes(), fetchTeam()]).finally(() => {
			if (active) setLoading(false);
		});
		return () => {
			active = false;
		};
	}, []);

	useEffect(() => {
		setQuery('');
		setStatus('todos');
		setScope('archived');
		setManage(false);
		setConfirmId(null);
	}, [mode]);

	const canManage = user?.role !== 'desarrollador';

	const handleDelete = async (id: string) => {
		if (confirmId !== id) {
			setConfirmId(id);
			return;
		}
		setConfirmId(null);
		try {
			const response = await fetch(apiUrl(`/api/quotes/${id}`), { method: 'DELETE' });
			if (response.ok) removeQuote(id);
		} catch (error) {
			console.error('Error deleting quote:', error);
		}
	};

	const isArchived = mode === 'archived';

	const sellerName = (sellerId: string) => {
		const member = users.find((u) => u.id === sellerId);
		if (member) return member.name;
		if (user && sellerId === user.id) return user.name;
		return '—';
	};

	const scoped = quotes.filter((q) => {
		if (isArchived) return scope === 'all' ? true : ARCHIVED_STATUSES.includes(q.status);
		return ACTIVE_STATUSES.includes(q.status);
	});

	const statusOptions = Object.entries(STATUS_LABELS).filter(
		([key]) => isArchived || !ARCHIVED_STATUSES.includes(key)
	);

	const filtered = scoped
		.filter((q) => q.clientName.toLowerCase().includes(query.trim().toLowerCase()))
		.filter((q) => (status === 'todos' ? true : q.status === status))
		.sort((a, b) => {
			if (sort === 'price') return b.finalPrice - a.finalPrice;
			if (sort === 'old') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});

	return (
		<div className="max-w-7xl mx-auto space-y-6">
			<PageHeader
				title={isArchived ? 'Historial' : 'Cotizaciones'}
				subtitle={
					isArchived ? 'Cotizaciones cerradas y archivo' : `Cotizaciones vigentes (${scoped.length})`
				}
				actions={
					canManage && !isArchived ? (
						manage ? (
							<Button variant="secondary" onClick={() => { setManage(false); setConfirmId(null); }}>
								<X className="w-4 h-4" />
								Salir de gestión
							</Button>
						) : (
							<>
								<Button variant="secondary" onClick={() => setManage(true)} aria-label="Gestionar cotizaciones">
									<Pencil className="w-4 h-4" />
									Gestionar cotizaciones
								</Button>
								<Button variant="primary" onClick={() => navigate('/nueva-cotizacion')}>
									<Plus className="w-4 h-4" />
									Nueva Cotización
								</Button>
							</>
						)
					) : (
						<Button variant="primary" onClick={() => navigate('/nueva-cotizacion')}>
							<Plus className="w-4 h-4" />
							Nueva Cotización
						</Button>
					)
				}
			/>

			<Card className="p-4">
				<div className="flex flex-col md:flex-row gap-3">
					<div className="relative flex-1">
						<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5B7295]" />
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Buscar por cliente..."
							className="w-full pl-9 pr-4 py-2.5 bg-[#0C1E36] border border-[#1C3557] text-white placeholder-[#5B7295] focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none rounded-xl text-sm"
						/>
					</div>
					{isArchived ? (
						<label className="flex items-center gap-2 text-sm text-[#8FA6C4]">
							Ver:
							<select
								value={scope}
								onChange={(e) => setScope(e.target.value as 'archived' | 'all')}
								className="bg-[#0C1E36] border border-[#1C3557] text-[#D6E2F2] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30"
							>
								<option value="archived">Archivadas</option>
								<option value="all">Todas</option>
							</select>
						</label>
					) : null}
					<select
						value={status}
						onChange={(e) => setStatus(e.target.value as StatusFilter)}
						className="bg-[#0C1E36] border border-[#1C3557] text-[#D6E2F2] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30"
					>
						<option value="todos">Todos los estados</option>
						{statusOptions.map(([key, label]) => (
							<option key={key} value={key}>
								{label}
							</option>
						))}
					</select>
					<select
						value={sort}
						onChange={(e) => setSort(e.target.value as SortOption)}
						className="bg-[#0C1E36] border border-[#1C3557] text-[#D6E2F2] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30"
					>
						<option value="recent">Más recientes</option>
						<option value="old">Más antiguos</option>
						<option value="price">Mayor precio</option>
					</select>
				</div>
			</Card>

			{loading ? (
				<div className="flex justify-center py-24">
					<Spinner />
				</div>
			) : scoped.length === 0 ? (
				<Card className="p-6">
					<EmptyState
						icon={FilePlus2}
						title={isArchived ? 'No hay cotizaciones archivadas' : 'No hay cotizaciones vigentes'}
						description={
							isArchived
								? 'Las cotizaciones pagadas o rechazadas aparecerán aquí'
								: 'Creá tu primera cotización para verla aquí'
						}
						action={
							<Button variant="primary" onClick={() => navigate('/nueva-cotizacion')}>
								<Plus className="w-4 h-4" />
								Nueva Cotización
							</Button>
						}
					/>
				</Card>
			) : filtered.length === 0 ? (
				<Card className="p-6">
					<EmptyState
						icon={FileSearch}
						title={query ? `Sin resultados para «${query}»` : 'Sin resultados'}
						description={
							query
								? 'Probá con otro nombre de cliente o cambiá los filtros'
								: 'No hay cotizaciones que coincidan con los filtros seleccionados'
						}
						action={
							<Button
								variant="secondary"
								onClick={() => {
									setQuery('');
									setStatus('todos');
									setScope('archived');
								}}
							>
								Limpiar filtros
							</Button>
						}
					/>
				</Card>
			) : (
				<Card className="p-6">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr>
									<th className="text-[10px] uppercase tracking-[0.18em] text-[#5B7295] border-b border-[#1C3557] pb-3 pr-4 text-left">
										N°
									</th>
									<th className="text-[10px] uppercase tracking-[0.18em] text-[#5B7295] border-b border-[#1C3557] pb-3 pr-4 text-left">
										Cliente
									</th>
									<th className="text-[10px] uppercase tracking-[0.18em] text-[#5B7295] border-b border-[#1C3557] pb-3 pr-4 text-left">
										Tipo
									</th>
									<th className="text-[10px] uppercase tracking-[0.18em] text-[#5B7295] border-b border-[#1C3557] pb-3 pr-4 text-left">
										Estado
									</th>
									<th className="text-[10px] uppercase tracking-[0.18em] text-[#5B7295] border-b border-[#1C3557] pb-3 pr-4 text-right">
										Precios
									</th>
									<th className="text-[10px] uppercase tracking-[0.18em] text-[#5B7295] border-b border-[#1C3557] pb-3 pr-4 text-left">
										Vendedor
									</th>
									<th className="text-[10px] uppercase tracking-[0.18em] text-[#5B7295] border-b border-[#1C3557] pb-3 pr-4 text-left">
										Fecha
									</th>
									<th className="text-[10px] uppercase tracking-[0.18em] text-[#5B7295] border-b border-[#1C3557] pb-3 text-right">
										{manage ? 'Gestión' : 'Acción'}
									</th>
								</tr>
							</thead>
							<tbody className="stagger-in">
								{filtered.map((quote) => (
									<tr
										key={quote.id}
										onClick={() => {
											if (manage) return;
											navigate(`/cotizacion/${quote.id}`, {
												state: { from: isArchived ? '/historial' : '/cotizaciones' },
											});
										}}
										className={`group border-b border-[#16294A] hover:bg-[#14294A] text-[#D6E2F2] transition-colors ${
											manage ? 'cursor-default' : 'cursor-pointer'
										}`}
									>
										<td className="py-3 pr-4 text-xs text-[#5B7295] row-shift">
											#{quote.id.slice(0, 8).toUpperCase()}
										</td>
										<td className="py-3 pr-4 font-medium text-white">{quote.clientName}</td>
										<td className="py-3 pr-4 text-[#D6E2F2]">
											{PRODUCT_NAMES[quote.productType] ?? quote.productType}
										</td>
										<td className="py-3 pr-4">
											<StatusBadge status={quote.status} />
										</td>
										<td className="py-3 pr-4 text-right font-medium text-white">
											{formatCurrency(quote.finalPrice)}
										</td>
										<td className="py-3 pr-4 text-[#8FA6C4]">{sellerName(quote.sellerId)}</td>
										<td className="py-3 pr-4 text-[#8FA6C4]">
											{new Date(quote.createdAt).toLocaleDateString('es-ES')}
										</td>
										<td className="py-3 text-right whitespace-nowrap">
											{manage ? (
												<span className="inline-flex items-center gap-2 justify-end">
													<button
														type="button"
														aria-label={`Editar cotización de ${quote.clientName}`}
														onClick={(e) => {
															e.stopPropagation();
															navigate(`/cotizacion/${quote.id}`, {
																state: { from: isArchived ? '/historial' : '/cotizaciones' },
															});
														}}
														className="p-1.5 rounded-lg bg-[#1877E8]/10 border border-[#1877E8]/30 text-[#60A5FA] hover:bg-[#1877E8]/25 transition-colors"
													>
														<Pencil className="w-3.5 h-3.5" />
													</button>
													<button
														type="button"
														aria-label={
															confirmId === quote.id
																? `Confirmar eliminar cotización de ${quote.clientName}`
																: `Eliminar cotización de ${quote.clientName}`
														}
														onClick={(e) => {
															e.stopPropagation();
															void handleDelete(quote.id);
														}}
														className={`px-2 py-1.5 rounded-lg border text-[10px] uppercase tracking-wider transition-colors ${
															confirmId === quote.id
																? 'bg-[#FB7185]/20 border-[#FB7185]/50 text-[#FB7185]'
																: 'bg-[#FB7185]/10 border-[#FB7185]/30 text-[#FB7185] hover:bg-[#FB7185]/25'
														}`}
													>
														{confirmId === quote.id ? (
															'¿Eliminar?'
														) : (
															<Trash2 className="w-3.5 h-3.5" />
														)}
													</button>
												</span>
											) : (
												<ChevronRight className="w-4 h-4 text-[#5B7295] inline-flex" />
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Card>
			)}
		</div>
	);
};

export default QuoteHistory;
