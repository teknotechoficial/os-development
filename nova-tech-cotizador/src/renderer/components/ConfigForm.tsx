import React from 'react';
import { QuoteConfig } from '@/shared/types';

interface Props {
	productType: string;
	config: QuoteConfig;
	onChange: (config: QuoteConfig) => void;
}

const FIELD_LABEL = 'block text-xs uppercase tracking-[0.12em] text-[#8FA6C4] font-semibold mb-2';

const FIELD_INPUT =
	'w-full px-4 py-3 bg-[#0C1E36] border border-[#1C3557] text-white placeholder-[#5B7295] focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none rounded-xl text-sm';

const FIELD_SELECT =
	'w-full bg-[#0C1E36] border border-[#1C3557] text-[#D6E2F2] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30';

const GRID = 'grid grid-cols-1 md:grid-cols-2 gap-4';

const TOGGLE_BASE = 'px-4 py-2 rounded-lg border text-sm transition-colors';

const TOGGLE_OFF =
	'bg-[#0C1E36] border-[#1C3557] text-[#8FA6C4] hover:border-[#1877E8]/60 hover:text-white cursor-pointer';

const TOGGLE_ON = 'border-[#1877E8] bg-[#1877E8]/10 text-white';

const ConfigForm: React.FC<Props> = ({ productType, config, onChange }) => {
	const handleChange = (field: string, value: any) => {
		onChange({ ...config, [field]: value });
	};

	return (
		<div>
			{productType === 'web' && (
				<div className={GRID}>
					<div>
						<label className={FIELD_LABEL}>Cantidad de Páginas</label>
						<input
							type="number"
							min={1}
							max={15}
							value={config.pages || 5}
							onChange={(e) => handleChange('pages', parseInt(e.target.value))}
							className={FIELD_INPUT}
						/>
					</div>
					<div>
						<label className={FIELD_LABEL}>Diseño</label>
						<select
							value={config.design || 'basico'}
							onChange={(e) => handleChange('design', e.target.value)}
							className={FIELD_SELECT}
						>
							<option value="basico">Básico</option>
							<option value="profesional">Profesional (+$150)</option>
							<option value="premium">Premium (+$300)</option>
						</select>
					</div>
				</div>
			)}
			{productType === 'app' && (
				<div className={GRID}>
					<div className="md:col-span-2">
						<label className={FIELD_LABEL}>Plataforma</label>
						<div className="flex flex-wrap gap-3">
							{['android', 'ios', 'both'].map((p) => (
								<button
									key={p}
									type="button"
									onClick={() => handleChange('platform', p)}
									className={`${TOGGLE_BASE} ${config.platform === p ? TOGGLE_ON : TOGGLE_OFF}`}
								>
									{p === 'both' ? 'Ambas (+50%)' : p.charAt(0).toUpperCase() + p.slice(1)}
								</button>
							))}
						</div>
					</div>
					<div>
						<label className={FIELD_LABEL}>Pantallas</label>
						<select
							value={config.screens || 'small'}
							onChange={(e) => handleChange('screens', e.target.value)}
							className={FIELD_SELECT}
						>
							<option value="small">1-5</option>
							<option value="medium">6-15</option>
							<option value="large">16-30</option>
							<option value="xlarge">30+</option>
						</select>
					</div>
				</div>
			)}
			{(productType === 'store' || productType === 'custom') && (
				<div className={GRID}>
					<div className="md:col-span-2">
						<label className={FIELD_LABEL}>Módulos/Productos</label>
						<div className="flex flex-wrap gap-3">
							{['small', 'medium', 'large', 'xlarge'].map((s) => (
								<button
									key={s}
									type="button"
									onClick={() => handleChange('modules', s)}
									className={`${TOGGLE_BASE} ${config.modules === s ? TOGGLE_ON : TOGGLE_OFF}`}
								>
									{s.charAt(0).toUpperCase() + s.slice(1)}
								</button>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ConfigForm;
