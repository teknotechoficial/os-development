import React from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Mail, CalendarDays, X, User as UserIcon, Briefcase, Activity } from 'lucide-react';
import { useTeam } from '../store/team';
import { apiUrl } from '../api';
import { formatCurrency } from '@/shared/validators';
import { ROLE_LABELS } from '@/shared/constants';
import { Spinner } from './ui';
import StatusBadge from './StatusBadge';

interface PersonModalProps {
	memberId: string;
	fallbackName?: string;
	onClose: () => void;
}

const initials = (name: string) =>
	name
		.split(' ')
		.filter(Boolean)
		.map((part) => part[0])
		.slice(0, 2)
		.join('')
		.toUpperCase();

const AVAILABILITY_STYLES: Record<string, { label: string; dot: string; text: string }> = {
	disponible: { label: 'Disponible', dot: 'bg-[#22C55E]', text: 'text-[#34D399]' },
	ocupado: { label: 'Ocupado', dot: 'bg-[#F59E0B]', text: 'text-[#FBBF24]' },
	no_disponible: { label: 'No disponible', dot: 'bg-[#E11D48]', text: 'text-[#FB7185]' },
};

const PersonModal: React.FC<PersonModalProps> = ({ memberId, fallbackName, onClose }) => {
	const { users, availabilities, fetchTeam, fetchAvailability } = useTeam();
	const navigate = useNavigate();
	const location = useLocation();
	const [quotes, setQuotes] = React.useState<any[] | null>(null);

	React.useEffect(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	}, []);

	React.useEffect(() => {
		if (users.length === 0) void fetchTeam();
		void fetchAvailability().catch(() => undefined);
		fetch(apiUrl('/api/quotes'))
			.then((res) => res.json())
			.then((data) => setQuotes(Array.isArray(data) ? data : []))
			.catch(() => setQuotes([]));
	}, [fetchTeam, fetchAvailability]);

	const member = users.find((u) => u.id === memberId);
	const availability = availabilities.find((a) => a.developerId === memberId);

	const stats = React.useMemo(() => {
		if (!quotes) return null;
		const sold = quotes.filter((q) => q.sellerId === memberId);
		const dev = quotes.filter((q) => q.developerId === memberId);
		const accepted = sold.filter((q) => q.status === 'aceptada' || q.status === 'pagada');
		const pending = sold.filter((q) => q.status === 'borrador' || q.status === 'enviada');
		const total = sold.reduce((acc, q) => acc + (Number(q.finalPrice) || 0), 0);
		const last =
			sold.length > 0
				? sold
						.map((q) => q.createdAt)
						.filter(Boolean)
						.sort()
						.pop()
				: null;
		const recent = [...sold].slice(0, 5);
		return { sold: sold.length, dev: dev.length, accepted: accepted.length, pending: pending.length, total, last, recent };
	}, [memberId, quotes]);

	const name = member ? member.name : fallbackName || 'Miembro';
	const roleLabel = member ? ROLE_LABELS[member.role] || member.role : '';
	const avail = availability ? AVAILABILITY_STYLES[availability.status] : undefined;

	return createPortal(
		<div
			className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[3px] flex items-center justify-center p-4 sm:p-6 animate-fade-in"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
		>
			<div
				className="bg-[#10233E] border border-[#1C3557] rounded-2xl w-full max-w-xl shadow-[0_25px_80px_-20px_rgba(0,0,0,0.9)] animate-scale-in max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="p-6 border-b border-[#16294A] flex items-start justify-between gap-4">
					<div className="flex items-center gap-4 min-w-0">
						{member?.avatar ? (
							<img
								src={member.avatar}
								alt={name}
								className="w-14 h-14 rounded-full object-cover ring-2 ring-[#1877E8]/50 shrink-0"
							/>
						) : (
							<div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1877E8] to-[#6366F1] flex items-center justify-center shrink-0 font-display text-lg text-white">
								{initials(name)}
							</div>
						)}
						<div className="min-w-0">
							<p className="font-display text-lg text-white uppercase tracking-wide truncate">{name}</p>
							<div className="flex flex-wrap items-center gap-2 mt-1">
								<span className="text-[10px] uppercase tracking-[0.18em] text-[#60A5FA] bg-[#1877E8]/15 px-2 py-0.5 rounded-full">
									{roleLabel}
								</span>
								{member?.code ? (
									<span className="text-[10px] uppercase tracking-[0.18em] text-[#8FA6C4] bg-[#0C1E36] border border-[#1C3557] px-2 py-0.5 rounded-full">
										{member.code}
									</span>
								) : null}
								{avail ? (
									<span className={`text-[10px] uppercase tracking-[0.18em] flex items-center gap-1.5 ${avail.text}`}>
										<span className={`w-1.5 h-1.5 rounded-full ${avail.dot}`} />
										{avail.label}
									</span>
								) : null}
							</div>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Cerrar"
						className="p-2 rounded-xl text-[#8FA6C4] hover:bg-[#14294A] hover:text-white transition-colors"
					>
						<X size={18} />
					</button>
				</div>

				<div className="px-6 py-4 space-y-2 text-sm border-b border-[#16294A]">
					{member?.email ? (
						<p className="flex items-center gap-2 text-[#D6E2F2] break-all">
							<Mail size={14} className="text-[#5B7295] shrink-0" />
							{member.email}
						</p>
					) : null}
					{member?.createdAt ? (
						<p className="flex items-center gap-2 text-[#8FA6C4]">
							<CalendarDays size={14} className="text-[#5B7295] shrink-0" />
							Miembro desde {new Date(member.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
						</p>
					) : null}
					<p className="flex items-center gap-2 text-[#8FA6C4]">
						<Activity size={14} className="text-[#5B7295] shrink-0" />
						{member?.isActive === false ? 'Cuenta inactiva' : 'Cuenta activa'}
						{availability ? ` • ${availability.activeQuotes ?? 0} cargas activas como desarrollador` : ''}
					</p>
				</div>

				{quotes === null ? (
					<div className="flex justify-center py-10">
						<Spinner />
					</div>
				) : stats ? (
					<div className="p-6 space-y-5">
						<div className="stagger-in grid grid-cols-2 sm:grid-cols-3 gap-3">
							{[
								{ label: 'Cotizaciones creadas', value: String(stats.sold) },
								{ label: 'Total cotizado', value: formatCurrency(stats.total) },
								{ label: 'Aceptadas / pagadas', value: String(stats.accepted) },
								{ label: 'Pendientes', value: String(stats.pending) },
								{ label: 'Cargas como dev.', value: String(stats.dev) },
								{
									label: 'Última cotización',
									value: stats.last ? new Date(stats.last).toLocaleDateString('es-ES') : '—',
								},
							].map((item) => (
								<div
									key={item.label}
									className="bg-[#0C1E36] border border-[#1C3557] rounded-xl p-3 hover:border-[#1877E8]/40 transition-colors"
								>
									<p className="text-[10px] uppercase tracking-[0.15em] text-[#5B7295]">{item.label}</p>
									<p className="font-display text-base text-white mt-1 truncate">{item.value}</p>
								</div>
							))}
						</div>

						<div>
							<h3 className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#8FA6C4] font-semibold mb-3">
								<Briefcase size={13} />
								Últimas cotizaciones
							</h3>
							{stats.recent.length === 0 ? (
								<p className="text-sm text-[#5B7295]">Sin cotizaciones a su nombre.</p>
							) : (
								<div className="stagger-in space-y-2">
									{stats.recent.map((q) => (
										<button
											key={q.id}
											type="button"
											aria-label={`Abrir cotización de ${q.clientName}`}
											onClick={() => {
												onClose();
												navigate(`/cotizacion/${q.id}`, { state: { from: location.pathname } });
											}}
											className="w-full flex items-center justify-between gap-3 bg-[#0C1E36] border border-[#1C3557] rounded-xl px-3 py-2.5 hover:border-[#1877E8]/60 hover:bg-[#14294A] transition-all text-left group"
										>
											<div className="min-w-0">
												<p className="text-sm text-white truncate">{q.clientName}</p>
												<p className="text-[11px] text-[#5B7295]">
													{q.createdAt ? new Date(q.createdAt).toLocaleDateString('es-ES') : ''}
												</p>
											</div>
											<div className="flex items-center gap-3 shrink-0">
												<StatusBadge status={q.status} />
												<span className="text-sm font-medium text-white">{formatCurrency(q.finalPrice)}</span>
												<ChevronRight
													size={15}
													className="text-[#5B7295] group-hover:text-[#60A5FA] transition-colors"
												/>
											</div>
										</button>
									))}
								</div>
							)}
						</div>
					</div>
				) : (
					<p className="text-sm text-[#5B7295] p-6">Sin actividad para mostrar.</p>
				)}
			</div>
		</div>,
		document.body
	);
};

export default PersonModal;
