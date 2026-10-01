import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
	Boxes,
	Cloud,
	Code2,
	Cpu,
	Globe,
	LifeBuoy,
	Megaphone,
	Monitor,
	Palette,
	Pencil,
	Plus,
	Rocket,
	Server,
	ShieldCheck,
	ShoppingCart,
	Smartphone,
	Store,
	Trash2,
	Upload,
	Wrench,
	X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '@/renderer/store/auth';
import { apiUrl } from '@/renderer/api';
import { formatCurrency } from '@/shared/validators';
import { Button, Card, EmptyState, Spinner } from '@/renderer/components/ui';

interface Service {
	id: string;
	name: string;
	description?: string;
	category?: string;
	basePrice: number;
	icon?: string;
	active?: boolean;
	sortOrder?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
	web: 'SITIOS WEB',
	ecommerce: 'E-COMMERCE',
	movil: 'APPS MÓVILES',
	'a-medida': 'A MEDIDA',
	soporte: 'SOPORTE',
	marketing: 'MARKETING',
};

const ICONS: Record<string, LucideIcon> = {
	Globe,
	ShoppingCart,
	Smartphone,
	Code2,
	Wrench,
	Megaphone,
	Boxes,
	Server,
	Cloud,
	ShieldCheck,
	Palette,
	Rocket,
	LifeBuoy,
	Monitor,
	Cpu,
	Store,
};

const ICON_NAMES = Object.keys(ICONS);

const CATEGORY_ICONS: Record<string, LucideIcon> = {
	web: Globe,
	ecommerce: ShoppingCart,
	movil: Smartphone,
	'a-medida': Code2,
	soporte: Wrench,
	marketing: Megaphone,
};

const CATEGORY_ICON_NAMES: Record<string, string> = {
	web: 'Globe',
	ecommerce: 'ShoppingCart',
	movil: 'Smartphone',
	'a-medida': 'Code2',
	soporte: 'Wrench',
	marketing: 'Megaphone',
};

const categoryLabel = (category?: string) => {
	if (!category) return 'SERVICIO';
	return CATEGORY_LABELS[category] || category.toUpperCase();
};

const iconOf = (service: Service): LucideIcon =>
	(service.icon && ICONS[service.icon]) || CATEGORY_ICONS[service.category || ''] || Boxes;

const EMPTY_FORM = {
	name: '',
	description: '',
	category: 'web',
	basePrice: '',
	icon: 'Globe',
	sortOrder: '0',
	active: true,
};

const CUSTOM_CATEGORY = '__custom__';

type FormState = typeof EMPTY_FORM;

interface EditorState {
	mode: 'edit' | 'create';
	service?: Service;
}

const INPUT_CLASS =
	'w-full px-4 py-2.5 bg-[#0C1E36] border border-[#1C3557] text-white placeholder-[#5B7295] focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none rounded-xl text-sm';
const LABEL_CLASS = 'block text-xs uppercase tracking-[0.12em] text-[#8FA6C4] font-semibold mb-1.5';
const SELECT_CLASS =
	'w-full bg-[#0C1E36] border border-[#1C3557] text-[#D6E2F2] rounded-lg px-3 py-2 text-sm focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none';

const IMG_ICON_PREFIX = 'img:';
const ICON_PIXELS = 128;
const ICON_RGB: [number, number, number] = [96, 165, 250]; /* #60A5FA, igual que los trazos lucide */
const MAX_ICON_IMAGE_BYTES = 2 * 1024 * 1024;

const readAsDataUrl = (file: Blob): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
		reader.readAsDataURL(file);
	});

const loadImageElement = (src: string): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error('No se pudo decodificar la imagen'));
		img.src = src;
	});

/*
 * Convierte cualquier imagen en una silueta azul estilo lucide (stroke #60A5FA):
 * canvas 128x128, dibujo fit-contain centrado, alpha derivado del fondo detectado
 * en las 4 esquinas del dibujo (claro >235 -> 255-luminancia, oscuro <40 ->
 * luminancia, mixto o transparente -> alpha original) y TODOS los pixeles
 * repintados con el color del tema. Devuelve un dataURL PNG.
 */
const processIconImage = async (file: File): Promise<string> => {
	const source = await loadImageElement(await readAsDataUrl(file));
	const srcWidth = source.naturalWidth || source.width;
	const srcHeight = source.naturalHeight || source.height;
	if (!srcWidth || !srcHeight) throw new Error('Imagen vacía');

	const canvas = document.createElement('canvas');
	canvas.width = ICON_PIXELS;
	canvas.height = ICON_PIXELS;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas no disponible');
	ctx.clearRect(0, 0, ICON_PIXELS, ICON_PIXELS);

	const scale = Math.min(ICON_PIXELS / srcWidth, ICON_PIXELS / srcHeight);
	const drawWidth = Math.max(1, Math.round(srcWidth * scale));
	const drawHeight = Math.max(1, Math.round(srcHeight * scale));
	const offsetX = Math.floor((ICON_PIXELS - drawWidth) / 2);
	const offsetY = Math.floor((ICON_PIXELS - drawHeight) / 2);
	ctx.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);

	const frame = ctx.getImageData(0, 0, ICON_PIXELS, ICON_PIXELS);
	const data = frame.data;
	const lumaAt = (x: number, y: number) => {
		const i = (y * ICON_PIXELS + x) * 4;
		return (data[i] + data[i + 1] + data[i + 2]) / 3;
	};
	const alphaAt = (x: number, y: number) => data[(y * ICON_PIXELS + x) * 4 + 3];
	const corners: [number, number][] = [
		[offsetX, offsetY],
		[offsetX + drawWidth - 1, offsetY],
		[offsetX, offsetY + drawHeight - 1],
		[offsetX + drawWidth - 1, offsetY + drawHeight - 1],
	];
	const cornerLuma = corners.reduce((sum, [x, y]) => sum + lumaAt(x, y), 0) / corners.length;
	const cornerAlpha = corners.reduce((sum, [x, y]) => sum + alphaAt(x, y), 0) / corners.length;

	/* Fondo transparente o mixto: se conserva la alpha original. */
	const mode: 'light' | 'dark' | 'keep' =
		cornerAlpha < 128 ? 'keep' : cornerLuma > 235 ? 'light' : cornerLuma < 40 ? 'dark' : 'keep';

	for (let i = 0; i < data.length; i += 4) {
		const originalAlpha = data[i + 3];
		const luma = (data[i] + data[i + 1] + data[i + 2]) / 3;
		let alpha = originalAlpha;
		if (mode === 'light') alpha = Math.round((255 - luma) * (originalAlpha / 255));
		else if (mode === 'dark') alpha = Math.round(luma * (originalAlpha / 255));
		data[i] = ICON_RGB[0];
		data[i + 1] = ICON_RGB[1];
		data[i + 2] = ICON_RGB[2];
		data[i + 3] = Math.max(0, Math.min(255, alpha));
	}
	ctx.putImageData(frame, 0, 0);
	return canvas.toDataURL('image/png');
};

/* 'img:<dataURL>' -> dataURL listo para <img>; admite tambien dataURL/http legados. */
const imageIconSrc = (value?: string | null): string | null => {
	if (!value) return null;
	if (value.startsWith(IMG_ICON_PREFIX)) return value.slice(IMG_ICON_PREFIX.length) || null;
	if (/^data:image\//i.test(value) || /^https?:\/\//i.test(value)) return value;
	return null;
};

const toStoredIcon = (src: string) => (src.startsWith('data:') ? IMG_ICON_PREFIX + src : src);

const ServiceEditor: React.FC<{
	editor: EditorState;
	onClose: () => void;
	onSaved: () => void;
}> = ({ editor, onClose, onSaved }) => {
	const isEdit = editor.mode === 'edit';
	const [form, setForm] = React.useState<FormState>(() => {
		if (isEdit && editor.service) {
			const storedIcon = editor.service.icon || '';
			return {
				name: editor.service.name,
				description: editor.service.description || '',
				category: editor.service.category || 'web',
				basePrice: String(editor.service.basePrice ?? 0),
				icon:
					storedIcon && !imageIconSrc(storedIcon)
						? storedIcon
						: CATEGORY_ICON_NAMES[editor.service.category || ''] || 'Boxes',
				sortOrder: String(editor.service.sortOrder ?? 0),
				active: editor.service.active !== false,
			};
		}
		return { ...EMPTY_FORM };
	});
	const [busy, setBusy] = React.useState(false);
	const [error, setError] = React.useState('');
	const [imageData, setImageData] = React.useState<string | null>(() =>
		isEdit ? imageIconSrc(editor.service?.icon) : null
	);
	const [logoError, setLogoError] = React.useState('');
	const [logoBusy, setLogoBusy] = React.useState(false);
	const PreviewIcon = ICONS[form.icon] || CATEGORY_ICONS[form.category] || Boxes;
	const isKnownCategory = Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, form.category);
	const categorySelectValue = isKnownCategory
		? form.category
		: form.category || CUSTOM_CATEGORY;

	const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
		setForm((prev) => ({ ...prev, [key]: value }));

	const handleIconFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files && event.target.files[0];
		event.target.value = '';
		if (!file) return;
		setLogoError('');
		if (!file.type || !file.type.startsWith('image/')) {
			setLogoError('El archivo debe ser una imagen (PNG, JPG, SVG o WEBP).');
			return;
		}
		if (file.size > MAX_ICON_IMAGE_BYTES) {
			setLogoError('La imagen supera el máximo permitido de 2 MB.');
			return;
		}
		setLogoBusy(true);
		try {
			setImageData(await processIconImage(file));
		} catch {
			setLogoError('No se pudo procesar la imagen. Intenta con otro archivo.');
		} finally {
			setLogoBusy(false);
		}
	};

	const clearIconImage = () => {
		setImageData(null);
		setLogoError('');
	};

	const save = async (event: React.FormEvent) => {
		event.preventDefault();
		setError('');
		if (!form.name.trim()) {
			setError('El nombre es obligatorio');
			return;
		}
		if (!form.category.trim()) {
			setError('La categoría es obligatoria');
			return;
		}
		if (!Number.isFinite(Number(form.basePrice)) || Number(form.basePrice) < 0) {
			setError('Precio base inválido');
			return;
		}
		setBusy(true);
		try {
			const payload = {
				name: form.name.trim(),
				description: form.description.trim(),
				category: form.category.trim(),
				basePrice: Number(form.basePrice),
				icon: imageData ? toStoredIcon(imageData) : form.icon,
				sortOrder: Number(form.sortOrder) || 0,
				active: form.active,
			};
			const res = await fetch(
				isEdit ? apiUrl(`/api/services/${editor.service?.id}`) : apiUrl('/api/services'),
				{
					method: isEdit ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				}
			);
			const data = await res.json().catch(() => ({}));
			if (!res.ok || data.error) throw new Error(data.error || 'No se pudo guardar');
			onSaved();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'No se pudo guardar');
		} finally {
			setBusy(false);
		}
	};

	const remove = async () => {
		if (!editor.service) return;
		if (!window.confirm(`¿Eliminar el servicio "${editor.service.name}"?`)) return;
		setBusy(true);
		setError('');
		try {
			const res = await fetch(apiUrl(`/api/services/${editor.service.id}`), { method: 'DELETE' });
			const data = await res.json().catch(() => ({}));
			if (!res.ok || data.error) throw new Error(data.error || 'No se pudo eliminar');
			onSaved();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'No se pudo eliminar');
		} finally {
			setBusy(false);
		}
	};

	return createPortal(
		<div
			className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[3px] flex items-center justify-center p-4 animate-fade-in"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
		>
			<div
				className="bg-[#10233E] border border-[#1C3557] rounded-2xl w-full max-w-2xl shadow-[0_25px_80px_-20px_rgba(0,0,0,0.9)] animate-scale-in max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="p-6 border-b border-[#16294A] flex items-start justify-between gap-4">
					<div>
						<div className="flex items-center gap-2.5 flex-wrap">
							<p className="font-display text-lg text-white uppercase tracking-wide">
								{isEdit ? 'Editar servicio' : 'Nuevo servicio'}
							</p>
							<span className="text-[10px] uppercase tracking-[0.15em] bg-[#1877E8]/15 text-[#60A5FA] border border-[#1877E8]/30 rounded-full px-2.5 py-1">
								{categoryLabel(form.category)}
							</span>
						</div>
						<p className="text-xs text-[#5B7295] uppercase tracking-[0.15em] mt-1">
							Catálogo de TeknoTech Services
						</p>
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

				<form onSubmit={save} className="p-6 space-y-5">
					{error ? (
						<div className="bg-[#E11D48]/10 border border-[#E11D48]/30 text-[#FB7185] rounded-xl p-3 text-sm">
							{error}
						</div>
					) : null}

					<div className="grid grid-cols-1 sm:grid-cols-5 gap-5">
						<div className="sm:col-span-2 space-y-4">
							<p className="text-[10px] uppercase tracking-[0.18em] text-[#5B7295]">
								Icono del servicio
							</p>

							<div className="rounded-2xl bg-[#0C1E36] border border-[#1877E8]/30 px-4 py-4 flex flex-col items-center gap-3">
								<span className="w-32 h-32 shrink-0 overflow-hidden rounded-2xl bg-[#1877E8]/12 border border-[#1877E8]/30 text-[#60A5FA] flex items-center justify-center">
									{imageData ? (
										<img src={imageData} alt="" className="w-full h-full object-contain" />
									) : (
										<PreviewIcon className="w-16 h-16" />
									)}
								</span>
								<span className="text-[10px] uppercase tracking-[0.18em] text-[#5B7295]">
									Vista previa
								</span>
								<label
									htmlFor="svc-logo-input"
									className={
										'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-colors ' +
										(logoBusy
											? 'bg-[#0C1E36] border-[#1C3557] text-[#8FA6C4] opacity-70 cursor-wait'
											: 'bg-[#1877E8]/12 border-[#1877E8]/30 text-[#60A5FA] hover:bg-[#1877E8]/20')
									}
								>
									<Upload className="w-4 h-4" />
									SUBIR IMAGEN
									<input
										id="svc-logo-input"
										type="file"
										accept="image/*"
										className="sr-only"
										disabled={logoBusy}
										onChange={handleIconFile}
									/>
								</label>
								{imageData ? (
									<button
										type="button"
										onClick={clearIconImage}
										className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1C3557] text-xs uppercase tracking-[0.12em] font-semibold text-[#8FA6C4] hover:text-white hover:bg-[#14294A] transition-colors"
									>
										<X className="w-3.5 h-3.5" />
										QUITAR IMAGEN
									</button>
								) : null}
								{logoError ? (
									<p role="alert" className="text-xs text-[#FB7185] text-center">
										{logoError}
									</p>
								) : null}
							</div>

							<div>
								<label htmlFor="svc-icon" className={LABEL_CLASS}>
									Icono
								</label>
								<select
									id="svc-icon"
									value={form.icon}
									onChange={(e) => {
										set('icon', e.target.value);
										setImageData(null);
										setLogoError('');
									}}
									className={SELECT_CLASS}
								>
									{ICON_NAMES.map((name) => (
										<option key={name} value={name}>
											{name}
										</option>
									))}
								</select>
								{imageData ? (
									<p className="text-[10px] uppercase tracking-[0.15em] text-[#60A5FA] mt-1.5">
										Imagen personalizada activa
									</p>
								) : null}
							</div>

							<div>
								<label htmlFor="svc-order" className={LABEL_CLASS}>
									Orden
								</label>
								<input
									id="svc-order"
									type="number"
									min={0}
									step="1"
									value={form.sortOrder}
									onChange={(e) => set('sortOrder', e.target.value)}
									className={INPUT_CLASS}
								/>
							</div>

							<label className="flex items-start gap-3 text-sm text-[#D6E2F2] cursor-pointer select-none">
								<input
									type="checkbox"
									checked={form.active}
									onChange={(e) => set('active', e.target.checked)}
									className="w-4 h-4 mt-0.5 accent-[#1877E8]"
								/>
								Servicio activo (visible en catálogo)
							</label>
						</div>

						<div className="sm:col-span-3 space-y-4">
							<p className="text-[10px] uppercase tracking-[0.18em] text-[#5B7295]">
								Información básica
							</p>

							<div>
								<label htmlFor="svc-name" className={LABEL_CLASS}>
									Nombre
								</label>
								<input
									id="svc-name"
									type="text"
									value={form.name}
									onChange={(e) => set('name', e.target.value)}
									className={INPUT_CLASS}
									placeholder="Ej: Desarrollo Web"
								/>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label htmlFor="svc-category" className={LABEL_CLASS}>
										Categoría
									</label>
									<select
										id="svc-category"
										value={categorySelectValue}
										onChange={(e) => {
											if (e.target.value === CUSTOM_CATEGORY) set('category', '');
											else set('category', e.target.value);
										}}
										className={SELECT_CLASS}
									>
										{Object.entries(CATEGORY_LABELS).map(([key, label]) => (
											<option key={key} value={key}>
												{label}
											</option>
										))}
										{!isKnownCategory && form.category ? (
											<option value={form.category}>
												{categoryLabel(form.category)} (personalizada)
											</option>
										) : null}
										<option value={CUSTOM_CATEGORY}>＋ Nueva categoría…</option>
									</select>
									{!isKnownCategory ? (
										<input
											id="svc-category-custom"
											type="text"
											value={form.category}
											onChange={(e) => set('category', e.target.value)}
											className={INPUT_CLASS + ' mt-2'}
											placeholder="Nombre de la categoría (ej: SEO)"
											autoFocus
										/>
									) : null}
								</div>

								<div>
									<label htmlFor="svc-price" className={LABEL_CLASS}>
										Precio base (USD)
									</label>
									<input
										id="svc-price"
										type="number"
										min={0}
										step="1"
										value={form.basePrice}
										onChange={(e) => set('basePrice', e.target.value)}
										className={INPUT_CLASS}
									/>
								</div>
							</div>

							<div>
								<label htmlFor="svc-desc" className={LABEL_CLASS}>
									Descripción
								</label>
								<textarea
									id="svc-desc"
									rows={3}
									value={form.description}
									onChange={(e) => set('description', e.target.value)}
									className={INPUT_CLASS + ' resize-none'}
									placeholder="Qué incluye este servicio…"
								/>
							</div>
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[#16294A]">
						<Button type="submit" variant="primary" disabled={busy || logoBusy}>
							{busy ? 'GUARDANDO…' : isEdit ? 'GUARDAR CAMBIOS' : 'CREAR SERVICIO'}
						</Button>
						<Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
							Cancelar
						</Button>
						{isEdit ? (
							<Button type="button" variant="danger" disabled={busy} onClick={remove}>
								<Trash2 className="w-4 h-4" />
								Eliminar
							</Button>
						) : null}
					</div>
				</form>
			</div>
		</div>,
		document.body
	);
};

const Services: React.FC = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [services, setServices] = React.useState<Service[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState(false);
	const [manage, setManage] = React.useState(false);
	const [editor, setEditor] = React.useState<EditorState | null>(null);

	const canManage = user?.role === 'super_admin';

	const reload = React.useCallback(() => {
		fetch(apiUrl('/api/services?all=1'))
			.then((res) => {
				if (!res.ok) throw new Error('request failed');
				return res.json();
			})
			.then((data: any) => {
				setServices(Array.isArray(data?.services) ? data.services : []);
				setError(false);
			})
			.catch(() => {
				setServices((prev) => prev);
				setError(true);
			})
			.finally(() => setLoading(false));
	}, []);

	React.useEffect(() => {
		reload();
	}, [reload]);

	const visible = manage ? services : services.filter((s) => s.active !== false);

	return (
		<div>
			<div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
				<div>
					<h1 className="font-display text-3xl font-bold uppercase tracking-[0.08em] text-white animate-title-in">
						Servicios
					</h1>
					<p className="text-[#8FA6C4] text-xs uppercase tracking-[0.15em] mt-1">
						Catálogo de servicios de TeknoTech
					</p>
				</div>
				{canManage ? (
					manage ? (
						<div className="flex items-center gap-2">
							<Button variant="primary" size="sm" onClick={() => setEditor({ mode: 'create' })}>
								<Plus className="w-4 h-4" />
								Nuevo servicio
							</Button>
							<Button variant="secondary" size="sm" onClick={() => setManage(false)}>
								Listo
							</Button>
						</div>
					) : (
						<Button variant="secondary" size="sm" onClick={() => setManage(true)}>
							<Pencil className="w-4 h-4" />
							Gestionar servicios
						</Button>
					)
				) : null}
			</div>

			{manage ? (
				<p className="text-xs text-[#5B7295] -mt-5 mb-5 animate-fade-in">
					Modo gestión: tocá un servicio para cambiar su icono, nombre, precio y más.
				</p>
			) : null}

			{loading ? (
				<div className="flex justify-center py-24">
					<Spinner />
				</div>
			) : visible.length === 0 ? (
				<Card className="p-6">
					<EmptyState
						icon={Boxes}
						title="Sin servicios por ahora"
						description={
							error
								? 'No pudimos cargar el catálogo de servicios. Intenta de nuevo en unos minutos.'
								: 'Aún no hay servicios registrados en el catálogo.'
						}
					/>
				</Card>
			) : (
				<div className="stagger-in grid md:grid-cols-2 xl:grid-cols-3 gap-6">
					{visible.map((service) => {
						const CardIcon = iconOf(service);
						const cardImageSrc = imageIconSrc(service.icon);
						return (
							<Card
								key={service.id}
								className={
									'p-6 flex flex-col hover-lift ' +
									(manage ? 'cursor-pointer' : '')
								}
								{...(manage
									? {
											onClick: () => setEditor({ mode: 'edit', service }),
											role: 'button' as const,
											tabIndex: 0,
											'aria-label': `Editar ${service.name}`,
									  }
									: {})}
							>
								<div className="flex items-start justify-between gap-3">
									<span className="text-[10px] uppercase tracking-widest bg-[#1877E8]/15 text-[#60A5FA] border border-[#1877E8]/30 rounded-full px-2.5 py-1">
										{categoryLabel(service.category)}
									</span>
									{service.active === false ? (
										<span className="text-[10px] uppercase tracking-widest bg-[#1C3557] text-[#8FA6C4] rounded-full px-2.5 py-1">
											Inactivo
										</span>
									) : null}
								</div>
								<div className="flex items-center gap-3 mt-3">
									<span className="w-11 h-11 rounded-2xl bg-[#0C1E36] border border-[#1877E8]/30 text-[#60A5FA] flex items-center justify-center shrink-0 overflow-hidden">
										{cardImageSrc ? (
											<img
												src={cardImageSrc}
												alt=""
												className="w-full h-full object-contain"
											/>
										) : (
											<CardIcon className="w-5 h-5" />
										)}
									</span>
									<h2 className="font-display text-lg text-white uppercase tracking-wide">
										{service.name}
									</h2>
								</div>
								<p className="text-sm text-[#8FA6C4] mt-2 flex-1">
									{service.description || 'Sin descripción disponible.'}
								</p>
								<div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-[#16294A]">
									<p className="font-display text-sm text-[#E6EDF7]">
										<span className="text-[#5B7295] text-xs uppercase tracking-wider">desde </span>
										{formatCurrency(service.basePrice || 0)}
									</p>
									{manage ? (
										<span className="text-[#60A5FA] text-xs uppercase tracking-wider flex items-center gap-1.5">
											<Pencil className="w-3.5 h-3.5" />
											Editar
										</span>
									) : (
										<Button
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												navigate('/nueva-cotizacion');
											}}
										>
											Cotizar
										</Button>
									)}
								</div>
							</Card>
						);
					})}
				</div>
			)}

			{editor ? (
				<ServiceEditor editor={editor} onClose={() => setEditor(null)} onSaved={reload} />
			) : null}
		</div>
	);
};

export default Services;
