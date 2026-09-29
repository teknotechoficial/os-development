import React from 'react';
import { PRODUCT_NAMES, STATUS_LABELS } from '@/shared/constants';
import { formatCurrency } from '@/shared/validators';
import StatusBadge from '@/renderer/components/StatusBadge';

const QuoteCard: React.FC<{ quote: any }> = ({ quote }) => (
	<div className="bg-[#10233E] hover:bg-[#14294A] border border-[#1C3557] rounded-xl p-4 flex items-center justify-between transition-colors">
		<div className="min-w-0">
			<p className="font-medium text-white truncate">{quote.clientName}</p>
			<p className="text-xs text-[#8FA6C4] mt-1">
				{PRODUCT_NAMES[quote.productType] ?? quote.productType} • {STATUS_LABELS[quote.status]}
			</p>
		</div>
		<div className="text-right shrink-0 pl-4">
			<p className="font-display font-semibold text-white">{formatCurrency(quote.finalPrice)}</p>
			<div className="mt-1 flex justify-end">
				<StatusBadge quote={quote} />
			</div>
		</div>
	</div>
);

export default QuoteCard;
