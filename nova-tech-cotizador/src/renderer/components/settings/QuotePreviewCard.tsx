import React from 'react';
import { Building2, FileText } from 'lucide-react';
import { formatCurrency } from '@/shared/validators';

export interface QuotePreviewCardProps {
	companyName: string;
	companyLogo: string;
	phone: string;
	email: string;
	paymentAlias: string;
	paymentTitular: string;
	marginMinimum: number;
}

const CHIP_CLASS = 'rounded-lg bg-[#0A182E] border border-[#1C3557] px-2 py-1 text-[10px] text-[#8FA6C4]';

export default function QuotePreviewCard(props: QuotePreviewCardProps) {
	const {
		companyName,
		companyLogo,
		phone,
		email,
		paymentAlias,
		paymentTitular,
		marginMinimum,
	} = props;

	const today = new Date().toLocaleDateString('es-ES');

	return (
		<section className="p-6 bg-[#10233E] border border-[#1C3557] rounded-2xl">
			<div className="flex items-center gap-2 mb-1">
				<span className="w-7 h-7 rounded-lg bg-[#1877E8]/10 border border-[#1877E8]/25 flex items-center justify-center text-[#60A5FA] shrink-0">
					<FileText className="w-4 h-4" />
				</span>
				<h2 className="font-display text-sm uppercase tracking-[0.12em] text-white">Vista previa de cotización</h2>
			</div>
			<p className="text-xs text-[#5B7295] mb-4">Así se ve el encabezado en tus cotizaciones</p>

			<div className="border border-dashed border-[#1C3557] rounded-xl p-4 bg-[#0C1E36]">
				<div className="flex items-start gap-3">
					{companyLogo ? (
						<img
							src={companyLogo}
							alt={companyName || 'Logo de la empresa'}
							className="w-12 h-12 rounded-lg object-cover border border-[#1C3557] shrink-0"
						/>
					) : (
						<span className="w-12 h-12 rounded-lg bg-[#1877E8]/10 border border-[#1877E8]/25 flex items-center justify-center text-[#60A5FA] shrink-0">
							<Building2 className="w-5 h-5" />
						</span>
					)}
					<div className="min-w-0">
						<p className="font-display text-sm uppercase text-white truncate">
							{companyName || 'Tu empresa'}
						</p>
						<p className="text-[11px] text-[#8FA6C4] flex flex-wrap gap-x-2">
							<span>{phone || '—'}</span>
							<span>{email || '—'}</span>
						</p>
					</div>
				</div>

				<p className="text-[11px] text-[#5B7295] mt-3">{'Cotización N° 001 — '}{today}</p>

				<div className="flex flex-wrap gap-2 mt-3">
					<span className={CHIP_CLASS}>{`Alias: ${paymentAlias || '—'}`}</span>
					<span className={CHIP_CLASS}>{`Titular: ${paymentTitular || '—'}`}</span>
									<span className={CHIP_CLASS}>{`Mínimo de venta: ${formatCurrency(marginMinimum)}`}</span>
				</div>
			</div>
		</section>
	);
}
