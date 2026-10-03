import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
	Check,
	CircleDollarSign,
	FileX,
	MessageCircle,
	Send,
	X,
} from 'lucide-react';
import { useAuth } from '@/renderer/store/auth';
import { useQuotes } from '@/renderer/store/quotes';
import { useTeam } from '@/renderer/store/team';
import { PRODUCT_NAMES, STATUS_LABELS } from '@/shared/constants';
import type { QuoteItem } from '@/shared/types';
import { formatCurrency } from '@/shared/validators';
import { Button, Card, EmptyState, PageHeader, Spinner } from '@/renderer/components/ui';
import StatusBadge from '@/renderer/components/StatusBadge';

const CARD_TITLE =
	'font-display text-xs uppercase tracking-[0.2em] text-[#8FA6C4] border-b border-[#1C3557] pb-3 mb-4';

const DETAIL_ROW = 'flex justify-between gap-4 py-2 border-b border-[#16294A] text-sm';

const QuoteDetail: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const backTo = typeof location.state?.from === 'string' ? location.state.from : '/cotizaciones';
	const backLabel =
		backTo === '/historial'
			? 'Volver al historial'
			: backTo === '/dashboard'
				? 'Volver al inicio'
				: backTo === '/mi-trabajo'
					? 'Volver a mi trabajo'
					: 'Volver a cotizaciones';
	const { user } = useAuth();
	const { quotes, currentQuote, fetchQuote, updateQuoteStatus } = useQuotes();
	const { users, fetchTeam } = useTeam();

	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [busy, setBusy] = useState<string | null>(null);
	const [feedback, setFeedback] = useState<string | null>(null);

	useEffect(() => {
		fetchTeam();
	}, []);

	useEffect(() => {
		if (!id) {
			setLoading(false);
			setNotFound(true);
			return;
		}
		let active = true;
		fetchQuote(id)
			.then((result) => {
				if (!active) return;
				const local = useQuotes.getState();
				const exists =
					!!result ||
					local.currentQuote?.id === id ||
					local.quotes.some((q) => q.id === id);
				if (!exists) setNotFound(true);
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, [id]);

	const quote =
		currentQuote && currentQuote.id === id
			? currentQuote
			: quotes.find((q) => q.id === id) ?? null;

	const role = user?.role;
	const canSend =
		quote?.status === 'borrador' &&
		(role === 'vendedor' || role === 'closer' || role === 'gerente' || role === 'super_admin');
	const canDecide = quote?.status === 'enviada' && (role === 'gerente' || role === 'super_admin');
	const canPay = quote?.status === 'aceptada' && (role === 'gerente' || role === 'super_admin');
	const canWhatsapp =
		role === 'vendedor' || role === 'closer' || role === 'gerente' || role === 'super_admin';

	const seller = quote ? users.find((u) => u.id === quote.sellerId) : null;
	const developer = quote?.developerId ? users.find((u) => u.id === quote.developerId) : null;

	const handleStatus = async (next: 'enviada' | 'aceptada' | 'rechazada' | 'pagada') => {
		if (!quote) return;
		setBusy(next);
		try {
			await updateQuoteStatus(quote.id, next);
			setFeedback(`Estado actualizado: ${STATUS_LABELS[next]}`);
		} catch {
			setFeedback('No se pudo actualizar el estado');
		} finally {
			setBusy(null);
		}
	};

	const handleWhatsApp = () => {
		if (!quote) return;
		const lines = [
			'*TeknoTech Services*',
			`Cliente: ${quote.clientName}`,
			`Producto: ${PRODUCT_NAMES[quote.productType] ?? quote.productType}`,
			`Precio: ${formatCurrency(quote.finalPrice)}`,
		];
		if (quote.items?.length) {
			for (const item of quote.items) {
				lines.push(`${item.name} x${item.quantity}: ${formatCurrency(item.unitPrice * item.quantity)}`);
			}
		}
		lines.push(`Estado: ${STATUS_LABELS[quote.status] ?? quote.status}`);
		window.open('https://wa.me/?text=' + encodeURIComponent(lines.join('\n')));
	};

	if (loading) {
		return (
			<div className="max-w-5xl mx-auto">
				<div className="flex justify-center py-24">
					<Spinner />
				</div>
			</div>
		);
	}

	if (notFound || !quote) {
		return (
			<div className="max-w-5xl mx-auto space-y-6">
				<PageHeader title="Cotización no encontrada" subtitle="No pudimos cargar esta cotización" />
				<Card className="p-6">
					<EmptyState
						icon={FileX}
						title="Cotización no encontrada"
						description="Puede que haya sido eliminada o no tenés acceso a ella"
						action={
							<Button variant="primary" onClick={() => navigate(backTo)}>
								{backLabel}
							</Button>
						}
					/>
				</Card>
			</div>
		);
	}

	const configEntries = Object.entries(quote.config ?? {}).filter(
		([key, value]) =>
			key !== 'services' && value !== null && value !== undefined && value !== ''
	);

	const items: QuoteItem[] = quote.items ?? [];
	const servicesTotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

	return (
		<div className="max-w-5xl mx-auto space-y-6">
			<PageHeader
				title={quote.clientName}
				subtitle={`Cotización #${quote.id.slice(0, 8).toUpperCase()}`}
				actions={
					<div className="flex items-center gap-3">
						<Button variant="ghost" size="sm" onClick={() => navigate(backTo)}>
							← {backLabel}
						</Button>
						<StatusBadge status={quote.status} />
					</div>
				}
			/>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="md:col-span-2 space-y-6">
					<Card className="p-6">
						<h2 className={CARD_TITLE}>Producto</h2>
						<p className="font-display text-lg uppercase text-white">
							{PRODUCT_NAMES[quote.productType] ?? quote.productType}
						</p>
						{configEntries.length > 0 && (
							<dl className="mt-4">
								{configEntries.map(([key, value]) => (
									<div key={key} className={DETAIL_ROW}>
										<dt className="text-[#5B7295] capitalize">{key}</dt>
										<dd className="text-[#D6E2F2] text-right">
											{Array.isArray(value) ? value.join(', ') : String(value)}
										</dd>
									</div>
								))}
							</dl>
						)}
					</Card>

					{quote.items && quote.items.length > 0 && (
						<Card className="p-6">
							<h2 className={CARD_TITLE}>Servicios cotizados</h2>
							<dl>
								{items.map((item) => (
									<div key={item.serviceId} className={DETAIL_ROW}>
										<dt className="text-[#5B7295]">
											{item.name} ×{item.quantity}
										</dt>
										<dd className="text-[#D6E2F2] text-right">
											{formatCurrency(item.unitPrice * item.quantity)}
										</dd>
									</div>
								))}
								<div className={DETAIL_ROW}>
									<dt className="text-[#5B7295]">Subtotal</dt>
									<dd className="text-[#D6E2F2] text-right">{formatCurrency(servicesTotal)}</dd>
								</div>
							</dl>
						</Card>
					)}

					<Card className="p-6">
						<h2 className={CARD_TITLE}>Detalle</h2>
						<dl>
							<div className={DETAIL_ROW}>
								<dt className="text-[#5B7295]">Vendedor</dt>
								<dd className="text-[#D6E2F2] text-right font-medium">{seller?.name ?? '—'}</dd>
							</div>
							<div className={DETAIL_ROW}>
								<dt className="text-[#5B7295]">Desarrollador asignado</dt>
								<dd className="text-[#D6E2F2] text-right font-medium">
									{developer?.name ?? 'Sin asignar'}
								</dd>
							</div>
							<div className={DETAIL_ROW}>
								<dt className="text-[#5B7295]">Fecha</dt>
								<dd className="text-[#D6E2F2] text-right font-medium">
									{new Date(quote.createdAt).toLocaleDateString('es-ES')}
								</dd>
							</div>
							{quote.config?.notes && (
								<div className={DETAIL_ROW}>
									<dt className="text-[#5B7295]">Notas</dt>
									<dd className="text-[#D6E2F2] text-right font-medium">{quote.config.notes}</dd>
								</div>
							)}
						</dl>
					</Card>
				</div>

				<div className="space-y-6">
					<Card className="p-6">
						<h2 className={CARD_TITLE}>Precio</h2>
						<p className="text-xs uppercase tracking-[0.12em] text-[#8FA6C4] font-semibold">
							Subtotal servicios
						</p>
						<p className="text-lg font-semibold text-white mt-1">{formatCurrency(quote.basePrice)}</p>
						{quote.margin > 0 && (
							<div className="flex justify-between text-sm py-2 mt-2">
								<span className="text-[#8FA6C4]">Mínimo de venta</span>
								<span className="text-[#F59E0B]">{formatCurrency(quote.margin)}</span>
							</div>
						)}
						<div className="border-t border-[#1C3557] my-2" />
						<div className="flex justify-between items-center pt-2">
							<span className="font-display text-xs uppercase tracking-[0.2em] text-[#8FA6C4]">
								Total
							</span>
							<span className="font-display text-3xl font-bold text-white">
								{formatCurrency(quote.finalPrice)}
							</span>
						</div>
					</Card>

					<Card className="p-6">
						<h2 className={CARD_TITLE}>Acciones</h2>
						<div className="space-y-3">
							{canSend && (
								<Button
									variant="primary"
									className="w-full"
									disabled={busy === 'enviada'}
									onClick={() => handleStatus('enviada')}
								>
									<Send className="w-4 h-4" />
									{busy === 'enviada' ? 'Enviando...' : 'Enviar al cliente'}
								</Button>
							)}

							{canDecide && (
								<>
									<Button
										variant="primary"
										className="w-full bg-[#059669] hover:bg-[#047857] text-white"
										disabled={busy === 'aceptada'}
										onClick={() => handleStatus('aceptada')}
									>
										<Check className="w-4 h-4" />
										{busy === 'aceptada' ? 'Aprobando...' : 'Aprobar'}
									</Button>
									<Button
										variant="danger"
										className="w-full"
										disabled={busy === 'rechazada'}
										onClick={() => handleStatus('rechazada')}
									>
										<X className="w-4 h-4" />
										{busy === 'rechazada' ? 'Rechazando...' : 'Rechazar'}
									</Button>
								</>
							)}

							{canPay && (
								<Button
									variant="primary"
									className="w-full"
									disabled={busy === 'pagada'}
									onClick={() => handleStatus('pagada')}
								>
									<CircleDollarSign className="w-4 h-4" />
									{busy === 'pagada' ? 'Guardando...' : 'Marcar como pagada'}
								</Button>
							)}

							{canWhatsapp && (
								<Button variant="secondary" className="w-full" onClick={handleWhatsApp}>
									<MessageCircle className="w-4 h-4" />
									Enviar por WhatsApp
								</Button>
							)}

							{feedback && (
								<p
									className={`text-xs text-center pt-1 ${
										feedback.startsWith('No se pudo') ? 'text-[#FB7185]' : 'text-[#34D399]'
									}`}
								>
									{feedback}
								</p>
							)}
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default QuoteDetail;
