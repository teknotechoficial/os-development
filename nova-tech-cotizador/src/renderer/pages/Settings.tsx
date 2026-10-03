import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	AlertCircle,
	Bell,
	Building2,
	Check,
	KeyRound,
	Mail,
	Server,
	Sliders,
	Trash2,
	Upload,
	User,
	UserCog,
	Volume2,
} from 'lucide-react';
import { useAuth } from '@/renderer/store/auth';
import { useTeam } from '@/renderer/store/team';
import { apiUrl } from '@/renderer/api';
import { COMPANY, MINIMUM_MARGIN, ROLE_LABELS } from '@/shared/constants';
import { Button, Card, PageHeader, Skeleton, Spinner } from '@/renderer/components/ui';
import ProfileModal from '@/renderer/components/ProfileModal';
import AccessLogCard from '@/renderer/components/settings/AccessLogCard';
import BackupCard from '@/renderer/components/settings/BackupCard';
import QuotePreviewCard from '@/renderer/components/settings/QuotePreviewCard';
import MailStatusCard from '@/renderer/components/settings/MailStatusCard';
import { TONE_OPTIONS, isValidTone, playTone } from '@/renderer/utils/sound';
import type { SoundTone } from '@/renderer/utils/sound';

const INPUT_CLASS =
	'w-full px-4 py-2.5 bg-[#0C1E36] border border-[#1C3557] text-white placeholder-[#5B7295] focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none rounded-xl text-sm';
const LABEL_CLASS =
	'block text-xs uppercase tracking-[0.12em] text-[#8FA6C4] font-semibold mb-1.5';
const CARD_CLASS = 'bg-[#10233E] border border-[#1C3557] rounded-2xl';
const SECTION_TITLE = 'font-display text-sm uppercase tracking-[0.12em] text-white';

type TabId = 'cuenta' | 'empresa' | 'correos';

interface SettingsData {
	companyName: string;
	companyLogo: string;
	phone: string;
	email: string;
	paymentTitular: string;
	paymentAlias: string;
	marginMinimum: number;
	smtpHost: string;
	smtpPort: string;
	smtpUser: string;
	smtpPass: string;
	smtpFrom: string;
	smtpEnabled: boolean;
}

const DEFAULT_SETTINGS: SettingsData = {
	companyName: COMPANY.name,
	companyLogo: '',
	phone: COMPANY.phone,
	email: COMPANY.email,
	paymentTitular: COMPANY.paymentTitular,
	paymentAlias: COMPANY.paymentAlias,
	marginMinimum: MINIMUM_MARGIN,
	smtpHost: '',
	smtpPort: '',
	smtpUser: '',
	smtpPass: '',
	smtpFrom: '',
	smtpEnabled: false,
};

type BannerState = { type: 'success' | 'error'; message: string };

interface NotifItem {
	id: string | number;
	title: string;
	message: string;
	createdAt: string;
}

const PREFS_STORAGE_KEY = 'nt_prefs';
const RECENT_LIMIT_OPTIONS = [5, 10, 15];

type UserPrefs = {
	reducedMotion: boolean;
	recentLimit: number;
	dateFormat: 'es-ES' | 'iso';
	notifyDesktop: boolean;
	sound: boolean;
	soundTone: string;
	accent: string;
};

const DEFAULT_PREFS: UserPrefs = {
	reducedMotion: false,
	recentLimit: 10,
	dateFormat: 'es-ES',
	notifyDesktop: false,
	sound: false,
	soundTone: 'classic',
	accent: 'blue',
};

const readUserPrefs = (): UserPrefs => {
	try {
		const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
		if (!raw) return { ...DEFAULT_PREFS };
		const parsed = JSON.parse(raw) as Partial<UserPrefs> | null;
		if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_PREFS };
		const limit = typeof parsed.recentLimit === 'number' ? parsed.recentLimit : DEFAULT_PREFS.recentLimit;
		const soundTone: SoundTone = isValidTone(parsed.soundTone)
			? parsed.soundTone
			: (DEFAULT_PREFS.soundTone as SoundTone);
		return {
			reducedMotion: parsed.reducedMotion === true,
			recentLimit: RECENT_LIMIT_OPTIONS.indexOf(limit) >= 0 ? limit : DEFAULT_PREFS.recentLimit,
			dateFormat:
				parsed.dateFormat === 'es-ES' || parsed.dateFormat === 'iso'
					? parsed.dateFormat
					: DEFAULT_PREFS.dateFormat,
			notifyDesktop: parsed.notifyDesktop === true,
			sound: parsed.sound === true,
			soundTone,
			accent: typeof parsed.accent === 'string' && parsed.accent ? parsed.accent : DEFAULT_PREFS.accent,
		};
	} catch {
		return { ...DEFAULT_PREFS };
	}
};

const persistUserPrefs = (prefs: UserPrefs) => {
	try {
		window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
	} catch {
		/* localStorage no disponible */
	}
};

const removeUserPrefs = () => {
	try {
		window.localStorage.removeItem(PREFS_STORAGE_KEY);
	} catch {
		/* localStorage no disponible */
	}
};

const ROLE_BADGE_CLASS: Record<string, string> = {
	super_admin: 'bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#FBBF24]',
	gerente: 'bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 text-[#A78BFA]',
	vendedor: 'bg-[#1877E8]/20 border border-[#1877E8]/30 text-[#60A5FA]',
	closer: 'bg-[#059669]/15 border border-[#059669]/40 text-[#34D399]',
	desarrollador: 'bg-[#EC4899]/15 border border-[#EC4899]/30 text-[#F472B6]',
};

const ROLE_BADGE_FALLBACK = 'bg-[#0C1E36] border border-[#1C3557] text-[#8FA6C4]';

const LOGO_SIZE = 512;
const LOGO_RADIUS = Math.round(LOGO_SIZE * 0.18);
const LOGO_PADDING = Math.round(LOGO_SIZE * 0.06);

const processLogoToAppStyle = (img: HTMLImageElement): string | null => {
	const source = document.createElement('canvas');
	source.width = Math.max(1, img.naturalWidth || img.width);
	source.height = Math.max(1, img.naturalHeight || img.height);
	const sourceCtx = source.getContext('2d');
	if (!sourceCtx) return null;
	sourceCtx.drawImage(img, 0, 0, source.width, source.height);

	let backgroundCleared = false;
	try {
		const width = source.width;
		const height = source.height;
		const pixels = sourceCtx.getImageData(0, 0, width, height);
		const data = pixels.data;
		const sample = (x: number, y: number) => {
			const index = (y * width + x) * 4;
			return (data[index] + data[index + 1] + data[index + 2]) / 3;
		};
		const cornersAvg =
			(sample(0, 0) + sample(width - 1, 0) + sample(0, height - 1) + sample(width - 1, height - 1)) / 4;
		if (cornersAvg > 225) {
			for (let i = 0; i < data.length; i += 4) {
				if (data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235) data[i + 3] = 0;
			}
			sourceCtx.putImageData(pixels, 0, 0);
			backgroundCleared = true;
		}
	} catch {
		backgroundCleared = false;
	}

	const canvas = document.createElement('canvas');
	canvas.width = LOGO_SIZE;
	canvas.height = LOGO_SIZE;
	const ctx = canvas.getContext('2d');
	if (!ctx) return null;

	ctx.beginPath();
	ctx.roundRect(0, 0, LOGO_SIZE, LOGO_SIZE, LOGO_RADIUS);
	ctx.clip();
	ctx.fillStyle = '#0A182E';
	ctx.fillRect(0, 0, LOGO_SIZE, LOGO_SIZE);

	const drawable: CanvasImageSource = backgroundCleared ? source : img;
	const srcWidth = backgroundCleared ? source.width : img.naturalWidth || img.width;
	const srcHeight = backgroundCleared ? source.height : img.naturalHeight || img.height;
	const available = LOGO_SIZE - LOGO_PADDING * 2;
	const scale = Math.min(available / srcWidth, available / srcHeight);
	const drawWidth = Math.max(1, srcWidth * scale);
	const drawHeight = Math.max(1, srcHeight * scale);
	ctx.drawImage(drawable, (LOGO_SIZE - drawWidth) / 2, (LOGO_SIZE - drawHeight) / 2, drawWidth, drawHeight);

	return canvas.toDataURL('image/png');
};

const mergeSettings = (prev: SettingsData, data: Record<string, any>): SettingsData => ({
	companyName: typeof data.companyName === 'string' ? data.companyName : prev.companyName,
	companyLogo:
		typeof data.companyLogo === 'string' && data.companyLogo
			? data.companyLogo
			: prev.companyLogo,
	phone: typeof data.phone === 'string' ? data.phone : prev.phone,
	email: typeof data.email === 'string' ? data.email : prev.email,
	paymentTitular:
		typeof data.paymentTitular === 'string' ? data.paymentTitular : prev.paymentTitular,
	paymentAlias:
		typeof data.paymentAlias === 'string' ? data.paymentAlias : prev.paymentAlias,
	marginMinimum:
		typeof data.marginMinimum === 'number' ? data.marginMinimum : prev.marginMinimum,
	smtpHost: typeof data.smtpHost === 'string' ? data.smtpHost : prev.smtpHost,
	smtpPort:
		typeof data.smtpPort === 'number'
			? String(data.smtpPort)
			: typeof data.smtpPort === 'string'
				? data.smtpPort
				: prev.smtpPort,
	smtpUser: typeof data.smtpUser === 'string' ? data.smtpUser : prev.smtpUser,
	smtpPass: typeof data.smtpPass === 'string' ? data.smtpPass : prev.smtpPass,
	smtpFrom: typeof data.smtpFrom === 'string' ? data.smtpFrom : prev.smtpFrom,
	smtpEnabled:
		typeof data.smtpEnabled === 'boolean' ? data.smtpEnabled : prev.smtpEnabled,
});

interface FieldProps {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	type?: string;
	span?: boolean;
}

const Field: React.FC<FieldProps> = ({ id, label, value, onChange, placeholder, type = 'text', span }) => (
	<div className={span ? 'sm:col-span-2' : ''}>
		<label htmlFor={id} className={LABEL_CLASS}>
			{label}
		</label>
		<input
			id={id}
			type={type}
			value={value}
			placeholder={placeholder}
			onChange={(e) => onChange(e.target.value)}
			className={INPUT_CLASS}
		/>
	</div>
);

const Banner: React.FC<{ banner: BannerState | null }> = ({ banner }) =>
	banner ? (
		<div
			className={`animate-banner-in flex items-center gap-2 rounded-xl p-3 text-sm font-medium ${
				banner.type === 'success'
					? 'bg-[#059669]/15 border border-[#059669]/40 text-[#34D399]'
					: 'bg-[#E11D48]/10 border border-[#E11D48]/30 text-[#FB7185]'
			}`}
		>
			{banner.type === 'success' ? (
				<Check className="h-4 w-4 shrink-0" />
			) : (
				<AlertCircle className="h-4 w-4 shrink-0" />
			)}
			{banner.message}
		</div>
	) : null;

interface ToggleProps {
	checked: boolean;
	onChange: (value: boolean) => void;
	label: string;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label }) => (
	<button
		type="button"
		onClick={() => onChange(!checked)}
		aria-pressed={checked}
		className="flex items-center gap-3 focus:outline-none"
	>
		<span
			className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
				checked ? 'bg-[#1877E8]' : 'bg-[#1C3557]'
			}`}
		>
			<span
				className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
					checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
				}`}
			/>
		</span>
		<span className="text-xs uppercase tracking-[0.12em] text-[#8FA6C4] font-semibold">{label}</span>
	</button>
);

interface SwitchProps {
	checked: boolean;
	onChange: (value: boolean) => void;
	ariaLabel: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, ariaLabel }) => (
	<button
		type="button"
		onClick={() => onChange(!checked)}
		aria-pressed={checked}
		aria-label={ariaLabel}
		className="flex items-center gap-3 focus:outline-none shrink-0"
	>
		<span
			className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
				checked ? 'bg-[#1877E8]' : 'bg-[#1C3557]'
			}`}
		>
			<span
				className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
					checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
				}`}
			/>
		</span>
	</button>
);

const formatNotifDate = (value: string): string => {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('es-ES');
};

const Settings: React.FC = () => {
	const { user } = useAuth();
	const { users, fetchTeam } = useTeam();
	const role = user?.role;
	const canManage = role === 'super_admin';

	const me = user ? users.find((u) => u.id === user.id) : undefined;
	const avatarUrl = me?.avatar ?? user?.avatar ?? null;

	const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [banner, setBanner] = useState<BannerState | null>(null);

	const [activeTab, setActiveTab] = useState<TabId>('cuenta');

	const [credField, setCredField] = useState<'password' | 'pin'>('password');
	const [credCurrent, setCredCurrent] = useState('');
	const [credNext, setCredNext] = useState('');
	const [credConfirm, setCredConfirm] = useState('');
	const [credSaving, setCredSaving] = useState(false);
	const [credBanner, setCredBanner] = useState<BannerState | null>(null);

	const [testingMail, setTestingMail] = useState(false);

	const [prefs, setPrefs] = useState<UserPrefs>(() => readUserPrefs());
	const [prefsSaved, setPrefsSaved] = useState(false);
	const prefsSavedTimer = useRef<number | null>(null);

	const [notifyDenied, setNotifyDenied] = useState(false);
	const [notifyError, setNotifyError] = useState<string | null>(null);
	const [soundError, setSoundError] = useState<string | null>(null);

	const [notifItems, setNotifItems] = useState<NotifItem[]>([]);
	const [notifLoading, setNotifLoading] = useState(false);

	const [accessRefresh, setAccessRefresh] = useState(0);
	const [mailTick, setMailTick] = useState(0);
	const [profileOpen, setProfileOpen] = useState(false);

	const logoFileRef = useRef<HTMLInputElement>(null);
	const [logoError, setLogoError] = useState<string | null>(null);

	useEffect(() => {
		const root = document.documentElement;
		if (prefs.reducedMotion) root.classList.add('reduced-motion');
		else root.classList.remove('reduced-motion');
	}, [prefs.reducedMotion]);

	useEffect(
		() => () => {
			if (prefsSavedTimer.current !== null) window.clearTimeout(prefsSavedTimer.current);
		},
		[],
	);

	useEffect(() => {
		if (users.length === 0) void fetchTeam();
	}, [users.length, fetchTeam]);

	const fetchSettings = useCallback(async (isCurrent?: () => boolean) => {
		try {
			const response = await fetch(apiUrl('/api/settings'));
			if (!response.ok) return;
			const data = await response.json().catch(() => null);
			if (!data || typeof data !== 'object') return;
			if (isCurrent && !isCurrent()) return;
			setSettings((prev) => mergeSettings(prev, data as Record<string, any>));
		} catch {
			/* sin conexión: se conservan los valores actuales */
		} finally {
			if (!isCurrent || isCurrent()) setLoading(false);
		}
	}, []);

	useEffect(() => {
		let active = true;
		void fetchSettings(() => active);
		return () => {
			active = false;
		};
	}, [fetchSettings]);

	const fetchNotifications = useCallback(async () => {
		setNotifLoading(true);
		try {
			const response = await fetch(
				apiUrl('/api/notifications?userId=' + (user?.id ?? '') + '&limit=5'),
			);
			const data = await response.json().catch(() => []);
			if (response.ok && Array.isArray(data)) setNotifItems(data.slice(0, 5));
		} catch {
			/* sin conexión: se conserva la lista actual */
		} finally {
			setNotifLoading(false);
		}
	}, [user?.id]);

	useEffect(() => {
		if (activeTab !== 'cuenta' || !user?.id) return;
		void fetchNotifications();
	}, [activeTab, user?.id, fetchNotifications]);

	const handleMarkAllRead = async () => {
		if (!user?.id) return;
		try {
			await fetch(apiUrl('/api/notifications/read-all'), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: user.id }),
			});
		} catch {
			/* sin conexión: se reintenta con el refetch */
		}
		void fetchNotifications();
	};

	const handleSave = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!canManage) return;
		setSaving(true);
		setBanner(null);
		try {
			const payload: Record<string, unknown> = { ...settings };
			delete payload.smtpPort;
			const portRaw = settings.smtpPort.trim();
			if (portRaw !== '') {
				const port = Number(portRaw);
				if (!Number.isInteger(port) || port < 1 || port > 65535) {
					throw new Error('Puerto SMTP inválido');
				}
				payload.smtpPort = port;
			}
			const response = await fetch(apiUrl('/api/settings'), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok || data.error) {
				throw new Error(data.error || 'No se pudo guardar la configuración');
			}
			setBanner({ type: 'success', message: 'Configuración guardada' });
			window.setTimeout(() => setBanner(null), 3000);
		} catch (error) {
			setBanner({
				type: 'error',
				message:
					error instanceof Error && error.message
						? error.message
						: 'No se pudo guardar la configuración',
			});
		} finally {
			setSaving(false);
		}
	};

	const handleTestMail = async () => {
		setTestingMail(true);
		setBanner(null);
		try {
			const response = await fetch(apiUrl('/api/settings/test-mail'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok || data.error || data.success === false) {
				throw new Error(data.error || 'No se pudo enviar el correo de prueba');
			}
			try {
				window.localStorage.setItem(
					'nt_mail_test',
					JSON.stringify({ ok: true, at: new Date().toISOString(), message: 'Correo de prueba enviado' }),
				);
			} catch {
				/* localStorage no disponible */
			}
			setMailTick((tick) => tick + 1);
			setBanner({ type: 'success', message: 'Correo de prueba enviado' });
			window.setTimeout(() => setBanner(null), 4000);
		} catch (error) {
			setBanner({
				type: 'error',
				message:
					error instanceof Error && error.message
						? error.message
						: 'No se pudo enviar el correo de prueba',
			});
		} finally {
			setTestingMail(false);
		}
	};

	const handleChangeCredentials = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!user) return;
		setCredBanner(null);
		const isPin = credField === 'pin';
		if (!credCurrent) {
			setCredBanner({
				type: 'error',
				message: isPin ? 'Ingresá tu PIN actual' : 'Ingresá tu contraseña actual',
			});
			return;
		}
		if (isPin) {
			if (!/^\d{4}$/.test(credNext)) {
				setCredBanner({ type: 'error', message: 'El PIN debe tener exactamente 4 dígitos' });
				return;
			}
		} else if (credNext.length < 6) {
			setCredBanner({
				type: 'error',
				message: 'La nueva contraseña debe tener al menos 6 caracteres',
			});
			return;
		}
		if (credNext !== credConfirm) {
			setCredBanner({ type: 'error', message: 'La confirmación no coincide' });
			return;
		}
		setCredSaving(true);
		try {
			const response = await fetch(apiUrl('/api/auth/change'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: user.id,
					field: credField,
					current: credCurrent,
					next: credNext,
				}),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok || data.error) {
				throw new Error(data.error || 'No se pudieron actualizar las credenciales');
			}
			setCredBanner({ type: 'success', message: 'Credenciales actualizadas' });
			setCredCurrent('');
			setCredNext('');
			setCredConfirm('');
			setAccessRefresh((tick) => tick + 1);
		} catch (error) {
			setCredBanner({
				type: 'error',
				message:
					error instanceof Error && error.message
						? error.message
						: 'No se pudieron actualizar las credenciales',
			});
		} finally {
			setCredSaving(false);
		}
	};

	const setField = (key: keyof SettingsData, value: string) =>
		setSettings((prev) => ({ ...prev, [key]: value }) as SettingsData);

	const updateField = (key: keyof SettingsData) => (value: string) => setField(key, value);

	const handleMargin = (value: string) =>
		setSettings((prev) => {
			if (value.trim() === '') return { ...prev, marginMinimum: 0 };
			const next = Number(value);
			return Number.isFinite(next) ? { ...prev, marginMinimum: next } : prev;
		});

	const flashPrefsSaved = () => {
		setPrefsSaved(true);
		if (prefsSavedTimer.current !== null) window.clearTimeout(prefsSavedTimer.current);
		prefsSavedTimer.current = window.setTimeout(() => setPrefsSaved(false), 2000);
	};

	const applyPrefs = (next: UserPrefs) => {
		setPrefs(next);
		persistUserPrefs(next);
		flashPrefsSaved();
	};

	const resetPrefs = () => {
		removeUserPrefs();
		document.documentElement.classList.remove('reduced-motion');
		setPrefs({ ...DEFAULT_PREFS });
		flashPrefsSaved();
	};

	const requestNotifyPermission = async () => {
		try {
			if (typeof Notification === 'undefined') return;
			const result = await Notification.requestPermission();
			setNotifyDenied(result === 'denied');
		} catch {
			/* API de notificaciones no disponible */
		}
	};

	const handleNotifyToggle = (value: boolean) => {
		applyPrefs({ ...prefs, notifyDesktop: value });
		setNotifyError(null);
		if (!value) {
			setNotifyDenied(false);
			return;
		}
		void requestNotifyPermission();
	};

	const handleTestNotification = () => {
		setNotifyError(null);
		try {
			new Notification('TeknoTech Services', {
				body: 'Alerta de prueba. Todo funciona correctamente.',
			});
		} catch {
			setNotifyError('No se pudieron mostrar las alertas');
		}
	};

	const handleSoundToggle = (value: boolean) => {
		applyPrefs({ ...prefs, sound: value });
		setSoundError(null);
	};

	const handleTestSound = () => {
		setSoundError(null);
		try {
			playTone(prefs.soundTone);
		} catch {
			setSoundError('No se pudo reproducir el sonido');
		}
	};

	const handleLogoFile = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;
		if (!file.type.startsWith('image/')) {
			setLogoError('El archivo debe ser una imagen');
			return;
		}
		if (file.size > 2 * 1024 * 1024) {
			setLogoError('La imagen no puede superar 2 MB');
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => {
				const dataUrl = processLogoToAppStyle(img);
				if (!dataUrl) {
					setLogoError('No se pudo procesar la imagen');
					return;
				}
				setField('companyLogo', dataUrl);
				setLogoError(null);
			};
			img.onerror = () => setLogoError('No se pudo leer la imagen');
			img.src = String(reader.result);
		};
		reader.onerror = () => setLogoError('No se pudo leer la imagen');
		reader.readAsDataURL(file);
	};

	const tabs: { id: TabId; label: string }[] = canManage
		? [
				{ id: 'cuenta', label: 'Cuenta' },
				{ id: 'empresa', label: 'Empresa' },
				{ id: 'correos', label: 'Correos' },
			]
		: [{ id: 'cuenta', label: 'Cuenta' }];

	const logoInputValue = settings.companyLogo.startsWith('data:') ? '' : settings.companyLogo;

	const roleBadgeClass = user?.role
		? ROLE_BADGE_CLASS[user.role] || ROLE_BADGE_FALLBACK
		: ROLE_BADGE_FALLBACK;

	const settingsSkeleton = (
		<div className="py-6 space-y-6">
			<div className="flex justify-center pb-2">
				<Spinner />
			</div>
			<div className="bg-[#10233E] border border-[#1C3557] rounded-2xl p-6 space-y-4">
				<Skeleton className="h-4 w-1/3 rounded-md" />
				<Skeleton className="h-10 w-full rounded-xl" />
				<Skeleton className="h-10 w-full rounded-xl" />
				<Skeleton className="h-10 w-2/3 rounded-xl" />
			</div>
		</div>
	);

	return (
		<div className="max-w-5xl mx-auto space-y-6">
			<PageHeader
				title="Ajustes"
				subtitle={canManage ? 'Datos de la empresa, correos y tu cuenta' : 'Tu cuenta de acceso'}
			/>

			<Banner banner={banner} />

			{canManage ? (
				<div
					role="tablist"
					aria-label="Secciones de ajustes"
					className="flex gap-2 p-1 bg-[#0C1E36] border border-[#1C3557] rounded-xl w-fit"
				>
					{tabs.map((tab) => (
						<button
							key={tab.id}
							type="button"
							role="tab"
							id={`settings-tab-${tab.id}`}
							aria-selected={activeTab === tab.id}
							aria-controls={`settings-panel-${tab.id}`}
							onClick={() => setActiveTab(tab.id)}
							className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-[0.12em] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1877E8]/40 ${
								activeTab === tab.id
									? 'bg-[#1877E8] text-white shadow-md shadow-blue-900/40'
									: 'text-[#8FA6C4] hover:bg-[#14294A] hover:text-white'
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>
			) : null}

			{!canManage || activeTab === 'cuenta' ? (
				<div
					role={canManage ? 'tabpanel' : undefined}
					id={canManage ? 'settings-panel-cuenta' : undefined}
					aria-labelledby={canManage ? 'settings-tab-cuenta' : undefined}
					className="space-y-6"
				>
					<Card className={`p-6 ${CARD_CLASS}`}>
						<div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#16294A]">
							<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
								<User className="w-4 h-4" />
							</span>
							<div>
								<h2 className={SECTION_TITLE}>Mi perfil</h2>
								<p className="text-xs text-[#5B7295]">Tu cuenta de acceso personal</p>
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-4">
							{avatarUrl ? (
								<img
									src={avatarUrl}
									alt={user?.name || 'Avatar'}
									className="w-20 h-20 rounded-full object-cover border border-[#1877E8]/30 ring-2 ring-[#1877E8]/30 shrink-0"
								/>
							) : (
								<span className="w-20 h-20 rounded-full bg-[#1877E8]/12 border border-[#1877E8]/30 ring-2 ring-[#1877E8]/25 text-[#60A5FA] font-display text-2xl font-bold flex items-center justify-center shrink-0 uppercase">
									{(user?.name || '?')
										.split(' ')
										.filter(Boolean)
										.map((part: string) => part[0])
										.slice(0, 2)
										.join('')}
								</span>
							)}
							<div className="min-w-0 flex-1">
								<p className="font-display text-lg text-white uppercase tracking-wide truncate">
									{user?.name || '—'}
								</p>
								<div className="flex flex-wrap items-center gap-2 mt-1.5">
									<span
										className={`text-[10px] uppercase tracking-widest rounded-full px-2.5 py-0.5 border ${roleBadgeClass}`}
									>
										{user?.role ? ROLE_LABELS[user.role] || user.role : '—'}
									</span>
									{user?.code ? (
										<span className="text-[10px] uppercase tracking-widest bg-[#0C1E36] text-[#8FA6C4] border border-[#1C3557] rounded-full px-2.5 py-0.5">
											{user.code}
										</span>
									) : null}
									{user?.email ? (
										<span className="text-[11px] text-[#5B7295] truncate">{user.email}</span>
									) : null}
								</div>
							</div>
							<Button
								type="button"
								variant="secondary"
								size="sm"
								onClick={() => setProfileOpen(true)}
							>
								<UserCog className="w-4 h-4" />
								EDITAR PERFIL
							</Button>
						</div>
					</Card>

					<div className="grid lg:grid-cols-2 gap-6">
						<Card className={`p-6 ${CARD_CLASS}`}>
							<div className="flex items-center gap-3 mb-4">
								<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
									<KeyRound className="w-4 h-4" />
								</span>
								<div>
									<h2 className={SECTION_TITLE}>Cambiar credenciales</h2>
									<p className="text-xs text-[#5B7295]">
										Actualizá tu contraseña o PIN de acceso
									</p>
								</div>
							</div>

							{credBanner ? (
								<div className="mb-4">
									<Banner banner={credBanner} />
								</div>
							) : null}

							<form onSubmit={handleChangeCredentials} className="space-y-4">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label htmlFor="cred-field" className={LABEL_CLASS}>
											Tipo de credencial
										</label>
										<select
											id="cred-field"
											value={credField}
											onChange={(e) => setCredField(e.target.value as 'password' | 'pin')}
											className={INPUT_CLASS}
										>
											<option value="password">Contraseña</option>
											<option value="pin">PIN</option>
										</select>
									</div>
									<Field
										id="cred-current"
										label="Actual"
										type="password"
										value={credCurrent}
										onChange={setCredCurrent}
									/>
									<Field
										id="cred-next"
										label="Nueva"
										type="password"
										value={credNext}
										onChange={setCredNext}
									/>
									<Field
										id="cred-confirm"
										label="Confirmar"
										type="password"
										value={credConfirm}
										onChange={setCredConfirm}
									/>
								</div>
								<div className="pt-1">
									<Button type="submit" variant="primary" disabled={credSaving}>
										{credSaving ? 'ACTUALIZANDO…' : 'ACTUALIZAR CREDENCIALES'}
									</Button>
								</div>
							</form>
						</Card>

						<AccessLogCard email={user?.email} code={user?.code} refreshKey={accessRefresh} />
					</div>

					<Card className={`p-6 ${CARD_CLASS}`}>
						<div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#16294A]">
							<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
								<Bell className="w-4 h-4" />
							</span>
							<div>
								<h2 className={SECTION_TITLE}>Mis notificaciones</h2>
								<p className="text-xs text-[#5B7295]">Tus alertas más recientes</p>
							</div>
						</div>

						{notifLoading ? (
							<div className="flex justify-center py-6">
								<Spinner />
							</div>
						) : notifItems.length === 0 ? (
							<p className="text-sm text-[#5B7295]">Sin notificaciones</p>
						) : (
							<ul className="space-y-3">
								{notifItems.map((item) => (
									<li
										key={item.id}
										className="rounded-xl border border-[#1C3557] bg-[#0C1E36] px-4 py-3"
									>
										<p className="text-sm text-white font-medium">{item.title}</p>
										<p className="text-sm text-[#D6E2F2] mt-0.5">{item.message}</p>
										<p className="text-[11px] uppercase tracking-widest text-[#5B7295] mt-1">
											{formatNotifDate(item.createdAt)}
										</p>
									</li>
								))}
							</ul>
						)}

						<div className="mt-4">
							<Button
								type="button"
								variant="secondary"
								id="settings-notif-clear"
								onClick={() => void handleMarkAllRead()}
							>
								MARCAR TODAS COMO LEÍDAS
							</Button>
						</div>
					</Card>

					<Card className={`p-6 ${CARD_CLASS}`}>
						<div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#16294A]">
							<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
								<Sliders className="w-4 h-4" />
							</span>
							<div>
								<h2 className={SECTION_TITLE}>Preferencias de la aplicación</h2>
								<p className="text-xs text-[#5B7295]">
									Personalizá cómo se comporta el sistema para vos
								</p>
							</div>
						</div>

						<div className="space-y-4">
							<div className="rounded-xl border border-[#1C3557] bg-[#0C1E36] px-4 py-3">
								<Toggle
									checked={prefs.reducedMotion}
									onChange={(value) => applyPrefs({ ...prefs, reducedMotion: value })}
									label="Reducir animaciones"
								/>
								<p className="text-xs text-[#5B7295] mt-2 pl-12">
									Desactiva transiciones y efectos visuales en toda la interfaz
								</p>
							</div>

							<div className="rounded-xl border border-[#1C3557] bg-[#0C1E36] px-4 py-3">
								<div className="flex items-center justify-between gap-3">
									<span className="text-sm text-[#D6E2F2] font-medium">
										Alertas del sistema
									</span>
									<Switch
										checked={prefs.notifyDesktop}
										onChange={handleNotifyToggle}
										ariaLabel="Alertas del sistema"
									/>
								</div>
								<p className="text-xs text-[#5B7295] mt-2">
									Permití alertas de escritorio del sistema
								</p>
								{notifyDenied ? (
									<p className="text-xs text-[#FB7185] mt-2">Permiso de alertas denegado</p>
								) : null}
								{notifyError ? (
									<p className="text-xs text-[#FB7185] mt-2">{notifyError}</p>
								) : null}
								<div className="mt-3">
									<Button
										type="button"
										variant="secondary"
										size="sm"
										onClick={handleTestNotification}
									>
										<Bell className="w-4 h-4" />
										PROBAR ALERTA
									</Button>
								</div>
							</div>

							<div className="rounded-xl border border-[#1C3557] bg-[#0C1E36] px-4 py-3">
								<div className="flex items-center justify-between gap-3">
									<span className="text-sm text-[#D6E2F2] font-medium">
										Sonido de notificaciones
									</span>
									<Switch
										checked={prefs.sound}
										onChange={handleSoundToggle}
										ariaLabel="Sonido de notificaciones"
									/>
								</div>
								<p className="text-xs text-[#5B7295] mt-2">
									Reproduce un aviso cuando llega una notificación nueva
								</p>
								{soundError ? (
									<p className="text-xs text-[#FB7185] mt-2">{soundError}</p>
								) : null}
								<div className="mt-3">
									<Button type="button" variant="secondary" size="sm" onClick={handleTestSound}>
										<Volume2 className="w-4 h-4" />
										PROBAR SONIDO
									</Button>
								</div>
							</div>

							<div className="rounded-xl border border-[#1C3557] bg-[#0C1E36] px-4 py-3">
								<label htmlFor="settings-sound-tone" className={LABEL_CLASS}>
									Tono de notificación
								</label>
								<select
									id="settings-sound-tone"
									className={INPUT_CLASS}
									value={prefs.soundTone}
									onChange={(e) => applyPrefs({ ...prefs, soundTone: e.target.value })}
								>
									{TONE_OPTIONS.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
								<p className="text-xs text-[#5B7295] mt-2">
									Tono que suena al llegar una notificación nueva
								</p>
							</div>

							<div className="rounded-xl border border-[#1C3557] bg-[#0C1E36] px-4 py-3">
								<label htmlFor="settings-recent-limit" className={LABEL_CLASS}>
									Cotizaciones recientes en Inicio
								</label>
								<select
									id="settings-recent-limit"
									value={String(prefs.recentLimit)}
									onChange={(e) => applyPrefs({ ...prefs, recentLimit: Number(e.target.value) })}
									className={INPUT_CLASS}
								>
									{RECENT_LIMIT_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
								<p className="text-xs text-[#5B7295] mt-2">
									Cuántas cotizaciones recientes mostrar en el Dashboard
								</p>
							</div>

							<div className="rounded-xl border border-[#1C3557] bg-[#0C1E36] px-4 py-3">
								<label htmlFor="settings-date-format" className={LABEL_CLASS}>
									Formato de fecha en Inicio
								</label>
								<select
									id="settings-date-format"
									value={prefs.dateFormat}
									onChange={(e) =>
										applyPrefs({
											...prefs,
											dateFormat: e.target.value as UserPrefs['dateFormat'],
										})
									}
									className={INPUT_CLASS}
								>
									<option value="es-ES">DD/MM/AAAA (27/9/2026)</option>
									<option value="iso">AAAA-MM-DD (2026-09-27)</option>
								</select>
								<p className="text-xs text-[#5B7295] mt-2">
									Cómo se muestran las fechas en el Inicio
								</p>
							</div>

							<div className="flex flex-wrap items-center gap-3 pt-1">
								<Button type="button" variant="secondary" onClick={resetPrefs}>
									Restablecer preferencias
								</Button>
								{prefsSaved ? (
									<span className="text-xs text-[#34D399]">Guardado localmente</span>
								) : null}
							</div>
						</div>
					</Card>
				</div>
			) : null}

			{canManage && activeTab === 'empresa' ? (
				<div
					role="tabpanel"
					id="settings-panel-empresa"
					aria-labelledby="settings-tab-empresa"
					className="space-y-6"
				>
					{loading ? (
						settingsSkeleton
					) : (
						<>
							<form onSubmit={handleSave} className="space-y-6">
								<Card className={`p-6 ${CARD_CLASS}`}>
									<div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#16294A]">
										<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
											<Building2 className="w-4 h-4" />
										</span>
										<div>
											<h2 className={SECTION_TITLE}>Datos de la empresa</h2>
											<p className="text-xs text-[#5B7295]">
												Información que aparece en las cotizaciones
											</p>
										</div>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<Field
											id="settings-company"
											label="Nombre de la empresa"
											value={settings.companyName}
											onChange={updateField('companyName')}
										/>
										<Field
											id="settings-phone"
											label="Teléfono"
											value={settings.phone}
											onChange={updateField('phone')}
										/>
										<Field
											id="settings-email"
											label="Correo electrónico"
											type="email"
											value={settings.email}
											onChange={updateField('email')}
										/>
										<Field
											id="settings-alias"
											label="Alias de pago"
											value={settings.paymentAlias}
											onChange={updateField('paymentAlias')}
										/>
										<Field
											id="settings-titular"
											label="Titular de cuenta de pago"
											value={settings.paymentTitular}
											onChange={updateField('paymentTitular')}
										/>
										<div>
											<label htmlFor="settings-margin" className={LABEL_CLASS}>
												Margen mínimo (%)
											</label>
											<input
												id="settings-margin"
												type="number"
												min={0}
												step="any"
												value={settings.marginMinimum}
												onChange={(e) => handleMargin(e.target.value)}
												className={INPUT_CLASS}
											/>
										</div>
										<div className="sm:col-span-2">
											<span className={LABEL_CLASS}>Logo de la empresa</span>
											<div className="flex items-center gap-4">
												{settings.companyLogo ? (
													<img
														src={settings.companyLogo}
														alt="Logo de la empresa"
														className="w-16 h-16 rounded-xl object-cover border border-[#1C3557] bg-[#0C1E36] shrink-0"
													/>
												) : (
													<span className="w-16 h-16 rounded-xl bg-[#0C1E36] border border-[#1C3557] text-[#5B7295] flex items-center justify-center shrink-0">
														<Building2 className="w-6 h-6" />
													</span>
												)}
												<div className="flex flex-wrap items-center gap-2">
													<input
														ref={logoFileRef}
														type="file"
														accept="image/*"
														className="hidden"
														onChange={handleLogoFile}
													/>
													<Button
														type="button"
														variant="secondary"
														size="sm"
														onClick={() => logoFileRef.current?.click()}
													>
														<Upload className="w-4 h-4" />
														SUBIR LOGO
													</Button>
													{settings.companyLogo ? (
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={() => {
																setField('companyLogo', '');
																setLogoError(null);
															}}
														>
															<Trash2 className="w-4 h-4" />
															Quitar logo
														</Button>
													) : null}
												</div>
											</div>
											{logoError ? (
												<p className="text-xs text-[#FB7185] mt-2">{logoError}</p>
											) : null}
											<div className="mt-3">
												<label htmlFor="settings-logo" className={LABEL_CLASS}>
													o pegá una URL
												</label>
												<input
													id="settings-logo"
													type="url"
													placeholder="https://..."
													value={logoInputValue}
													onChange={(e) => {
														setField('companyLogo', e.target.value);
														setLogoError(null);
													}}
													className={INPUT_CLASS}
												/>
											</div>
										</div>
									</div>
								</Card>
								<div className="flex justify-end pt-1">
									<Button type="submit" variant="primary" disabled={saving}>
										{saving ? 'GUARDANDO…' : 'GUARDAR CAMBIOS'}
									</Button>
								</div>
							</form>

							<div className="grid md:grid-cols-2 gap-6">
								<QuotePreviewCard
									companyName={settings.companyName}
									companyLogo={settings.companyLogo}
									phone={settings.phone}
									email={settings.email}
									paymentAlias={settings.paymentAlias}
									paymentTitular={settings.paymentTitular}
									marginMinimum={settings.marginMinimum}
								/>
								<BackupCard onImported={() => { void fetchSettings(); }} />
							</div>
						</>
					)}
				</div>
			) : null}

			{canManage && activeTab === 'correos' ? (
				<div
					role="tabpanel"
					id="settings-panel-correos"
					aria-labelledby="settings-tab-correos"
					className="space-y-6"
				>
					{loading ? (
						settingsSkeleton
					) : (
						<div className="grid md:grid-cols-2 gap-6">
							<form onSubmit={handleSave} className="space-y-6">
								<Card className={`p-6 ${CARD_CLASS}`}>
									<div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#16294A]">
										<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
											<Server className="w-4 h-4" />
										</span>
										<div>
											<h2 className={SECTION_TITLE}>Correo de recuperación (SMTP)</h2>
											<p className="text-xs text-[#5B7295]">
												Envío de códigos para recuperar acceso
											</p>
										</div>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<Field
											id="settings-smtp-host"
											label="Servidor"
											placeholder="smtp.gmail.com"
											value={settings.smtpHost}
											onChange={updateField('smtpHost')}
										/>
										<Field
											id="settings-smtp-port"
											label="Puerto"
											type="number"
											placeholder="465"
											value={settings.smtpPort}
											onChange={updateField('smtpPort')}
										/>
										<Field
											id="settings-smtp-user"
											label="Usuario"
											value={settings.smtpUser}
											onChange={updateField('smtpUser')}
										/>
										<Field
											id="settings-smtp-pass"
											label="Contraseña de aplicación"
											type="password"
											value={settings.smtpPass}
											onChange={updateField('smtpPass')}
										/>
										<Field
											id="settings-smtp-from"
											label="Correo origen"
											type="email"
											value={settings.smtpFrom}
											onChange={updateField('smtpFrom')}
										/>
									</div>
									<div className="mt-5 flex flex-col gap-4">
										<Toggle
											checked={settings.smtpEnabled}
											onChange={(value) =>
												setSettings((prev) => ({ ...prev, smtpEnabled: value }))
											}
											label="Habilitar envío de correos"
										/>
										<p className="text-xs text-[#5B7295]">
											Usá una &quot;Contraseña de app&quot; de Google (myaccount.google.com/apppasswords).
											Es gratis.
										</p>
										<div>
											<Button
												type="button"
												variant="secondary"
												onClick={handleTestMail}
												disabled={testingMail}
											>
												<Mail className="w-4 h-4" />
												{testingMail ? 'ENVIANDO…' : 'ENVIAR CORREO DE PRUEBA'}
											</Button>
										</div>
									</div>
								</Card>
								<div className="flex justify-end pt-1">
									<Button type="submit" variant="primary" disabled={saving}>
										{saving ? 'GUARDANDO…' : 'GUARDAR CAMBIOS'}
									</Button>
								</div>
							</form>

							<MailStatusCard
								enabled={settings.smtpEnabled}
								host={settings.smtpHost}
								port={settings.smtpPort}
								from={settings.smtpFrom}
								refreshTick={mailTick}
							/>
						</div>
					)}
				</div>
			) : null}

			{profileOpen ? <ProfileModal onClose={() => setProfileOpen(false)} /> : null}
		</div>
	);
};

export default Settings;
