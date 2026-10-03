import React from 'react';
import { formatCurrency } from '@/shared/validators';
import { Card } from '@/renderer/components/ui';

export interface PriceBreakdownItem {
	name: string;
	unitPrice: number;
	quantity: number;
}

interface Props {
	items: PriceBreakdownItem[];
	basePrice: number;
	margin: number;
	suggestedMargin: number;
	finalPrice: number;
}

const PriceBreakdown: React.FC<Props> = ({ items, basePrice, margin, suggestedMargin, finalPrice }) => {
	return (
		<Card className="p-6">
			<h2 className="font-display text-xs uppercase tracking-[0.2em] text-[#8FA6C4] border-b border-[#1C3557] pb-3 mb-4">
				Resumen de Precio
			</h2>
			<div>
				{items.length > 0 ? (
					<>
						<div className="text-[11px] uppercase tracking-[0.12em] text-[#5B7295] pt-2">
							Servicios
						</div>
						{items.map((item) => (
							<div key={item.name} className="flex justify-between text-sm py-2">
								<span className="text-[#8FA6C4]">
									{item.name} ×{item.quantity}
								</span>
								<span className="text-[#D6E2F2]">
									{formatCurrency(item.unitPrice * item.quantity)}
								</span>
							</div>
						))}
						<div className="flex justify-between text-sm py-2">
							<span className="text-[#8FA6C4]">Subtotal</span>
							<span className="text-[#D6E2F2]">{formatCurrency(basePrice)}</span>
						</div>
					</>
				) : (
					<div className="flex justify-between text-sm py-2">
						<span className="text-[#8FA6C4]">Precio Base</span>
						<span className="text-[#D6E2F2]">{formatCurrency(basePrice)}</span>
					</div>
				)}
				<div className="flex justify-between py-2">
					<span className="text-[11px] uppercase tracking-[0.12em] text-[#5B7295]">
						Tu margen
					</span>
					<span className="text-[11px] text-[#5B7295]">{formatCurrency(margin)}</span>
				</div>
				<div className="text-[#5B7295] text-[11px]">
					Mínimo sugerido: {formatCurrency(suggestedMargin)}
				</div>
				<div className="border-t border-[#1C3557] my-2" />
				<div className="flex justify-between items-center pt-2">
					<span className="font-display text-xs uppercase tracking-[0.2em] text-[#8FA6C4] font-semibold">
						Precio Final
					</span>
					<span className="font-display text-2xl font-bold text-white">
						{formatCurrency(finalPrice)}
					</span>
				</div>
			</div>
		</Card>
	);
};

export default PriceBreakdown;
