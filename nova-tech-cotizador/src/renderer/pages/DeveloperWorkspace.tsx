import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Clock, Laptop, X } from 'lucide-react';
import { useAuth } from '@/renderer/store/auth';
import { useTeam } from '@/renderer/store/team';
import { useQuotes } from '@/renderer/store/quotes';
import { AVAILABILITY_LABELS, PRODUCT_NAMES } from '@/shared/constants';
import { formatCurrency } from '@/shared/validators';
import StatusBadge from '@/renderer/components/StatusBadge';
import { Card, EmptyState, PageHeader, Spinner } from '@/renderer/components/ui';

const AVAILABILITY_OPTIONS = ['disponible', 'ocupado', 'no_disponible'];

const AVAILABILITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
	disponible: Check,
	ocupado: Clock,
	no_disponible: X,
};

const AVAILABILITY_ICON_COLORS: Record<string, string> = {
	disponible: 'text-[#34D399]',
	ocupado: 'text-[#FBBF24]',
	no_disponible: 'text-[#FB7185]',
};

const DeveloperWorkspace: React.FC = () => {
	const { user } = useAuth();
	const { quotes, fetchMyQuotes } = useQuotes();
	const { availabilities, fetchAvailability, updateAvailability } = useTeam();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [availabilityError, setAvailabilityError] = useState('');

	useEffect(() => {
		let active = true;
		Promise.all([fetchMyQuotes(), fetchAvailability()]).finally(() => {
			if (active) setLoading(false);
		});
		return () => {
			active = false;
		};
	}, [fetchMyQuotes, fetchAvailability]);

	const myAvailability = user
		? availabilities.find((item) => item.developerId === user.id)
		: undefined;
	const currentStatus = myAvailability?.status ?? 'disponible';
	const myQuotes = quotes.filter((quote) => quote.developerId === user?.id);

	const handleSetAvailability = async (status: string) => {
		if (!user || saving || status === currentStatus) return;
		setSaving(true);
		setAvailabilityError('');
		try {
			await updateAvailability(user.id, status);
			let latest = useTeam
				.getState()
				.availabilities.find((item) => item.developerId === user.id);
			if (!latest) {
				await fetchAvailability();
				latest = useTeam
					.getState()
					.availabilities.find((item) => item.developerId === user.id);
			}
			if (!latest || latest.status !== status) {
				throw new Error('No se pudo actualizar tu disponibilidad');
			}
		} catch (error) {
			setAvailabilityError(
				error instanceof Error && error.message
					? error.message
					: 'No se pudo actualizar tu disponibilidad'
			);
			await fetchAvailability();
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="max-w-7xl mx-auto space-y-6">
			<PageHeader title="Mi Trabajo" subtitle="Cotizaciones asignadas a ti" />

			<Card className="p-6 bg-[#10233E] border border-[#1C3557] rounded-2xl">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<h2 className="font-display text-sm uppercase tracking-[0.12em] text-white">
							Mi disponibilidad
						</h2>
						<p className="text-sm text-[#8FA6C4] mt-0.5">
							Define cómo quieres que te asignen nuevas cotizaciones
						</p>
					</div>
					<div className="bg-[#0C1E36] border border-[#1C3557] rounded-xl p-1 flex gap-1">
						{AVAILABILITY_OPTIONS.map((option) => {
							const OptionIcon = AVAILABILITY_ICONS[option];
							const active = currentStatus === option;
							return (
								<button
									key={option}
									type="button"
									disabled={saving}
									onClick={() => handleSetAvailability(option)}
									className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
										active
											? 'bg-[#1877E8] text-white font-semibold shadow-lg shadow-blue-900/40'
											: 'text-[#8FA6C4] hover:text-white hover:bg-[#14294A]'
									}`}
								>
									<OptionIcon className={`h-3.5 w-3.5 ${AVAILABILITY_ICON_COLORS[option]}`} />
									{AVAILABILITY_LABELS[option]}
								</button>
							);
						})}
					</div>
				</div>
				{saving && <p className="text-xs text-[#8FA6C4] mt-3">Guardando…</p>}
				{!saving && availabilityError && (
					<p className="text-xs text-[#FB7185] mt-3">{availabilityError}</p>
				)}
			</Card>

			<Card className="p-6 bg-[#10233E] border border-[#1C3557] rounded-2xl">
				<h2 className="font-display text-sm uppercase tracking-[0.12em] text-white mb-4">
					Cotizaciones asignadas
				</h2>
				{loading ? (
					<div className="flex justify-center py-10">
						<Spinner />
					</div>
				) : myQuotes.length === 0 ? (
					<EmptyState
						icon={Laptop}
						title="Sin trabajos asignados"
						description="Las cotizaciones que te asignen aparecerán aquí"
					/>
				) : (
					<div className="stagger-in space-y-3">
						{myQuotes.map((quote) => (
							<Link
								key={quote.id}
								to={`/cotizacion/${quote.id}`}
								state={{ from: '/mi-trabajo' }}
								className="flex items-center justify-between gap-4 bg-[#0C1E36] border border-[#1C3557] rounded-xl p-4 hover:border-[#1877E8]/50 transition-all"
							>
								<div className="min-w-0">
									<p className="text-sm font-semibold text-white truncate">{quote.clientName}</p>
									<p className="text-xs text-[#8FA6C4] truncate">
										{PRODUCT_NAMES[quote.productType] ?? quote.productType}
										<span className="text-[#5B7295]"> • </span>
										{new Date(quote.createdAt).toLocaleDateString('es-AR')}
									</p>
								</div>
								<div className="flex items-center gap-4 shrink-0">
									<StatusBadge status={quote.status} />
									<span className="font-display text-sm text-white">
										{formatCurrency(quote.finalPrice)}
									</span>
									<ChevronRight className="h-4 w-4 text-[#5B7295]" />
								</div>
							</Link>
						))}
					</div>
				)}
			</Card>
		</div>
	);
};

export default DeveloperWorkspace;
