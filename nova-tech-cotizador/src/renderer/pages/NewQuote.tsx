import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Send } from 'lucide-react';
import { useAuth } from '@/renderer/store/auth';
import { useTeam } from '@/renderer/store/team';
import { useQuotes } from '@/renderer/store/quotes';
import { calculateBasePrice, calculateFinalPrice } from '@/shared/pricing';
import { validateQuote } from '@/shared/validators';
import { QuoteConfig, ProductType } from '@/shared/types';
import ProductSelector from '@/renderer/components/ProductSelector';
import ConfigForm from '@/renderer/components/ConfigForm';
import PriceBreakdown from '@/renderer/components/PriceBreakdown';
import DeveloperSelector from '@/renderer/components/DeveloperSelector';
import { apiUrl } from '@/renderer/api';
import { Button, Card, PageHeader } from '@/renderer/components/ui';

const STEP_LABEL = 'font-display text-[11px] tracking-[0.2em] text-[#5B7295] mb-3 uppercase';

const FIELD_LABEL = 'block text-xs uppercase tracking-[0.12em] text-[#8FA6C4] font-semibold mb-2';

const FIELD_INPUT =
	'w-full px-4 py-3 bg-[#0C1E36] border border-[#1C3557] text-white placeholder-[#5B7295] focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none rounded-xl text-sm';

const FIELD_SELECT =
	'w-full bg-[#0C1E36] border border-[#1C3557] text-[#D6E2F2] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30';

const NewQuote: React.FC = () => {
	const { user } = useAuth();
	const { availabilities, fetchTeam, fetchAvailability } = useTeam();
	const { addQuote } = useQuotes();
	const navigate = useNavigate();

	const [productType, setProductType] = useState<ProductType>('web');
	const [config, setConfig] = useState<QuoteConfig>({});
	const [selectedDeveloper, setSelectedDeveloper] = useState<string>('');
	const [clientName, setClientName] = React.useState('');
	const [clientType, setClientType] = React.useState<'empresa' | 'marca_personal'>('empresa');
	const [errors, setErrors] = React.useState<string[]>([]);

	useEffect(() => {
		fetchTeam();
		fetchAvailability();
	}, []);

	const basePrice = calculateBasePrice(productType, config);
	const finalPrice = calculateFinalPrice(basePrice);
	const availableDevs = availabilities;

	const handleSubmit = async () => {
		const validation = validateQuote(productType, config, clientName);
		if (!validation.valid) {
			setErrors(validation.errors);
			return;
		}
		setErrors([]);
		try {
			const response = await fetch(apiUrl('/api/quotes'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					productType,
					config,
					clientName,
					clientType,
					sellerId: user!.id,
					developerId: selectedDeveloper || null,
				}),
			});
			if (!response.ok) throw new Error('Error al guardar');
			const saved = await response.json();
			addQuote(saved);
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

			<Card className="p-6">
				<p className={STEP_LABEL}>Paso 2 — Producto</p>
				<ProductSelector productType={productType} onChange={setProductType} />
			</Card>

			<Card className="p-6">
				<p className={STEP_LABEL}>Paso 3 — Configuración</p>
				<ConfigForm productType={productType} config={config} onChange={setConfig} />
			</Card>

			<PriceBreakdown basePrice={basePrice} finalPrice={finalPrice} />

		{user?.role !== 'desarrollador' && (
			<DeveloperSelector
				selectedDeveloper={selectedDeveloper}
				onChange={setSelectedDeveloper}
				availableDevs={availableDevs}
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
