import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, LayoutGrid, Send } from 'lucide-react';
import { useAuth } from '@/renderer/store/auth';
import { useTeam } from '@/renderer/store/team';
import { useQuotes } from '@/renderer/store/quotes';
import { calculateFinalPrice } from '@/shared/pricing';
import { MINIMUM_MARGIN, MIN_TOTAL_MESSAGE } from '@/shared/constants';
import { formatCurrency } from '@/shared/validators';
import { Service } from '@/shared/types';
import PriceBreakdown from '@/renderer/components/PriceBreakdown';
import DeveloperSelector from '@/renderer/components/DeveloperSelector';
import { apiUrl } from '@/renderer/api';
import { Button, Card, EmptyState, PageHeader, Spinner } from '@/renderer/components/ui';

const STEP_LABEL = 'font-display text-[11px] tracking-[0.2em] text-[#5B7295] mb-3 uppercase';

const FIELD_LABEL = 'block text-xs uppercase tracking-[0.12em] text-[#8FA6C4] font-semibold mb-2';

const FIELD_INPUT =
	'w-full px-4 py-3 bg-[#0C1E36] border border-[#1C3557] text-white placeholder-[#5B7295] focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none rounded-xl text-sm';

const FIELD_SELECT =
	'w-full bg-[#0C1E36] border border-[#1C3557] text-[#D6E2F2] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30';

const SERVICE_CARD = (active: boolean) =>
	`border rounded-xl p-4 text-left transition-all ${
		active
			? 'border-[#1877E8] bg-[#1877E8]/10 text-white shadow-lg shadow-blue-900/30'
			: 'bg-[#0C1E36] border-[#1C3557] text-[#8FA6C4] hover:border-[#1877E8]/60 hover:text-white cursor-pointer'
	}`;

const NewQuote: React.FC = () => {
	const { user } = useAuth();
	const { availabilities, fetchTeam, fetchAvailability } = useTeam();
	const { addQuote } = useQuotes();
	const navigate = useNavigate();

	const [selectedDeveloper, setSelectedDeveloper] = useState<string>('');
	const [clientName, setClientName] = useState('');
	const [clientType, setClientType] = useState<'empresa' | 'marca_personal'>('empresa');
	const [errors, setErrors] = useState<string[]>([]);
	const [services, setServices] = useState<Service[]>([]);
	const [loadingServices, setLoadingServices] = useState(true);
	const [selected, setSelected] = useState<Record<string, boolean>>({});

	useEffect(() => {
		fetchTeam();
		fetchAvailability();
	}, []);

	useEffect(() => {
		fetch(apiUrl('/api/services'))
			.then((res) => {
				if (!res.ok) throw new Error('request failed');
				return res.json();
			})
			.then((data: any) => {
				setServices(Array.isArray(data?.services) ? data.services : []);
			})
			.catch(() => setServices([]))
			.finally(() => setLoadingServices(false));
	}, []);

	const seleccionados = services.filter((s) => selected[s.id]);
	const basePrice = seleccionados.reduce((a, s) => a + s.basePrice, 0);
	const finalPrice = calculateFinalPrice(basePrice);
	const aplicaMinimo = seleccionados.length > 0 && finalPrice > basePrice;

	const toggleService = (id: string) =>
		setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

	const handleSubmit = async () => {
		const nextErrors: string[] = [];
		if (!clientName || clientName.trim().length < 2)
			nextErrors.push('El nombre del cliente debe tener al menos 2 caracteres');
		if (seleccionados.length === 0) nextErrors.push('Seleccioná al menos un servicio.');
		if (nextErrors.length > 0) {
			setErrors(nextErrors);
			return;
		}
		setErrors([]);
		try {
			const response = await fetch(apiUrl('/api/quotes'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					productType: 'custom',
					config: { services: seleccionados.map((s) => s.name) },
					clientName,
					clientType,
					sellerId: user!.id,
					developerId: selectedDeveloper || null,
					items: seleccionados.map((s) => ({ serviceId: s.id, quantity: 1 })),
				}),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok || data?.error) {
				setErrors([data?.error || 'Error al guardar']);
				return;
			}
			addQuote(data);
			navigate('/cotizaciones');
		} catch {
			setErrors(['No se pudo guardar la cotización. Verificá que el servidor esté activo.']);
		}
	};

	return (
		<div className="max-w-5xl mx-auto space-y-6">
			<PageHeader title="Nueva Cotización" subtitle="Configura el servicio y genera el precio" />

			<Card className="p-6">
				<p className={STEP_LABEL}>Paso 1 — Cliente</p>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className={FIELD_LABEL}>Nombre del Cliente</label>
						<input
							type="text"
							required
							value={clientName}
							onChange={(e) => setClientName(e.target.value)}
							className={FIELD_INPUT}
							placeholder="Nombre del cliente"
						/>
					</div>
					<div>
						<label className={FIELD_LABEL}>Tipo de Cliente</label>
						<select
							value={clientType}
							onChange={(e) => setClientType(e.target.value as 'empresa' | 'marca_personal')}
							className={FIELD_SELECT}
						>
							<option value="empresa">Empresa</option>
							<option value="marca_personal">Marca Personal</option>
						</select>
					</div>
				</div>
			</Card>

			<Card className="p-6" id="quote-services">
				<p className={STEP_LABEL}>Paso 2 — Servicios</p>
				{loadingServices ? (
					<div className="flex items-center justify-center py-10">
						<Spinner className="w-6 h-6" />
					</div>
				) : services.length === 0 ? (
					<EmptyState
						icon={LayoutGrid}
						title="Sin servicios disponibles"
						description="Agregá servicios en el apartado Servicios para poder cotizar."
					/>
				) : (
					<>
						<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
							{services.map((s) => (
								<button
									key={s.id}
									type="button"
									onClick={() => toggleService(s.id)}
									className={SERVICE_CARD(!!selected[s.id])}
								>
									<h3 className="font-display text-sm font-semibold uppercase tracking-wide text-white">
										{s.name}
									</h3>
									{s.category && (
										<p className="text-[11px] uppercase tracking-[0.12em] text-[#5B7295] mt-1">
											{s.category}
										</p>
									)}
									<p className="mt-2 text-sm font-semibold text-[#D6E2F2]">
										{formatCurrency(s.basePrice)}
									</p>
								</button>
							))}
						</div>

						<div className="mt-6 border-t border-[#1C3557] pt-4">
							{aplicaMinimo && (
								<p className="text-xs text-[#F59E0B]">{MIN_TOTAL_MESSAGE}</p>
							)}
							{!aplicaMinimo && seleccionados.length > 0 && (
								<p className="text-xs text-[#5B7295]">
									Total a cobrar: la suma de los servicios seleccionados.
								</p>
							)}
						</div>
					</>
				)}
			</Card>

			{user?.role !== 'desarrollador' && (
				<div>
					<p className={STEP_LABEL}>Paso 3 — Desarrollador</p>
					<DeveloperSelector
						selectedDeveloper={selectedDeveloper}
						onChange={setSelectedDeveloper}
						availableDevs={availabilities}
					/>
				</div>
			)}

			{seleccionados.length > 0 && (
				<PriceBreakdown
					items={seleccionados.map((s) => ({ name: s.name, unitPrice: s.basePrice, quantity: 1 }))}
					basePrice={basePrice}
					finalPrice={finalPrice}
				/>
			)}

			{errors.length > 0 && (
				<div className="flex items-start gap-3 text-[#FB7185] bg-[#E11D48]/10 border border-[#E11D48]/30 rounded-xl p-4">
					<AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
					<div className="text-sm space-y-1">
						{errors.map((e, i) => (
							<p key={i}>{e}</p>
						))}
					</div>
				</div>
			)}

			<Button
				variant="primary"
				className="w-full py-3 font-display tracking-wider"
				onClick={handleSubmit}
			>
				<Send className="w-4 h-4" />
				GENERAR Y GUARDAR COTIZACIÓN
			</Button>
		</div>
	);
};

export default NewQuote;
