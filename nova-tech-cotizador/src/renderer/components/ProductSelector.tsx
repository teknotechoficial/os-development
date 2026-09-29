import React from 'react';
import { Globe, LayoutGrid, Search, ShoppingBag, Smartphone, Wrench } from 'lucide-react';
import { PRODUCT_NAMES } from '@/shared/constants';
import type { ProductType } from '@/shared/types';

interface Props {
	productType: ProductType;
	onChange: (type: ProductType) => void;
}

const PRODUCT_ICONS: Record<ProductType, React.ComponentType<{ className?: string }>> = {
	web: Globe,
	store: ShoppingBag,
	app: Smartphone,
	custom: LayoutGrid,
	maintenance: Wrench,
	seo: Search,
};

const ProductSelector: React.FC<Props> = ({ productType, onChange }) => {
	const products: ProductType[] = ['web', 'store', 'app', 'custom', 'maintenance', 'seo'];

	return (
		<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
			{products.map((product) => {
				const Icon = PRODUCT_ICONS[product];
				const selected = productType === product;
				return (
					<button
						key={product}
						type="button"
						onClick={() => onChange(product)}
						className={`border rounded-xl p-4 text-center transition-all ${
							selected
								? 'border-[#1877E8] bg-[#1877E8]/10 text-white shadow-lg shadow-blue-900/30'
								: 'bg-[#0C1E36] border-[#1C3557] text-[#8FA6C4] hover:border-[#1877E8]/60 hover:text-white cursor-pointer'
						}`}
					>
						<Icon className="w-6 h-6 mx-auto mb-2" />
						<p className="uppercase tracking-wide text-xs font-semibold">{PRODUCT_NAMES[product]}</p>
					</button>
				);
			})}
		</div>
	);
};

export default ProductSelector;
