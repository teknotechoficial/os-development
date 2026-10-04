import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	AlertCircle,
	AppWindow,
	ArrowDown,
	ArrowUp,
	Bell,
	Building2,
	Check,
	Eye,
	EyeOff,
	KeyRound,
	Mail,
	Palette,
	PanelLeft,
	Server,
	Sliders,
	Trash2,
	Type,
	Upload,
	User,
	UserCog,
	Volume2,
} from 'lucide-react';
import { useAuth } from '@/renderer/store/auth';
import { useTeam } from '@/renderer/store/team';
import { apiUrl } from '@/renderer/api';
import { COMPANY, MINIMUM_MARGIN, NAV_LABELS, ROLE_LABELS } from '@/shared/constants';
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
const INPUT_SM =
	'w-full px-2.5 py-1.5 bg-[#0C1E36] border border-[#1C3557] text-white placeholder-[#5B7295] focus:border-[#1877E8] outline-none rounded-lg text-xs';
const CARD_CLASS = 'bg-[#10233E] border border-[#1C3557] rounded-2xl';
const SECTION_TITLE = 'font-display text-sm uppercase tracking-[0.12em] text-white';

type TabId = 'cuenta' | 'empresa' | 'equipo' | 'sistema' | 'correos';

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
	currency: string;
	notifInterval: number;
	loginMaxAttempts: number;
	loginLockoutMinutes: number;
	teamDefaultRole: string;
	teamDefaultTitle: string;
	theme: string;
	sidebarOrder: string[];
	sidebarHidden: string[];
	sidebarLabels: Record<string, string>;
	appIcon: string;
	appTitleSuffix: string;
	customVersion: number;
	loginTagline: string;
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
	currency: 'USD',
	notifInterval: 15,
	loginMaxAttempts: 5,
	loginLockoutMinutes: 15,
	teamDefaultRole: 'vendedor',
	teamDefaultTitle: '',
	theme: 'dark',
	sidebarOrder: [],
	sidebarHidden: [],
	sidebarLabels: {},
	appIcon: '',
	appTitleSuffix: 'Cotizador',
	customVersion: 1,
	loginTagline: 'Tecnología que impulsa,|lealtad que permanece.',
};

const THEME_OPTIONS = [
	{ value: 'dark', label: 'Oscuro (original)', swatch: ['#0A182E', '#10233E', '#1877E8'] },
	{ value: 'midnight', label: 'Medianoche', swatch: ['#030A18', '#0A1A30', '#1877E8'] },
	{ value: 'steel', label: 'Acero', swatch: ['#141A24', '#1C2431', '#60A5FA'] },
	{ value: 'ocean', label: 'Océano', swatch: ['#062040', '#0C2E56', '#38BDF8'] },
];

const CURRENCY_OPTIONS = [
	{ value: 'USD', label: 'USD — Dólar ($)' },
	{ value: 'EUR', label: 'EUR — Euro (€)' },
	{ value: 'ARS', label: 'ARS — Peso argentino (AR$)' },
	{ value: 'GBP', label: 'GBP — Libra (£)' },
];

const NOTIF_INTERVAL_OPTIONS = [5, 10, 15, 30, 60];

const TEAM_DEFAULT_ROLE_OPTIONS = ['vendedor', 'closer', 'desarrollador', 'gerente'];

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
	currency: typeof data.currency === 'string' && data.currency ? data.currency : prev.currency,
	notifInterval:
		typeof data.notifInterval === 'number' && data.notifInterval >= 5
			? data.notifInterval
			: prev.notifInterval,
	loginMaxAttempts:
		typeof data.loginMaxAttempts === 'number' && data.loginMaxAttempts >= 3
			? data.loginMaxAttempts
			: prev.loginMaxAttempts,
	loginLockoutMinutes:
		typeof data.loginLockoutMinutes === 'number' && data.loginLockoutMinutes >= 1
			? data.loginLockoutMinutes
			: prev.loginLockoutMinutes,
	teamDefaultRole:
		typeof data.teamDefaultRole === 'string' && data.teamDefaultRole
			? data.teamDefaultRole
			: prev.teamDefaultRole,
	teamDefaultTitle:
		typeof data.teamDefaultTitle === 'string' ? data.teamDefaultTitle : prev.teamDefaultTitle,
	theme: typeof data.theme === 'string' && data.theme ? data.theme : prev.theme,
	sidebarOrder: Array.isArray(data.sidebarOrder)
		? data.sidebarOrder.filter((x: unknown): x is string => typeof x === 'string')
		: prev.sidebarOrder,
	sidebarHidden: Array.isArray(data.sidebarHidden)
		? data.sidebarHidden.filter((x: unknown): x is string => typeof x === 'string')
		: prev.sidebarHidden,
	loginTagline:
		typeof data.loginTagline === 'string' ? data.loginTagline : prev.loginTagline,
	sidebarLabels: (() => {
		if (!data.sidebarLabels || typeof data.sidebarLabels !== 'object' || Array.isArray(data.sidebarLabels)) {
			return prev.sidebarLabels;
		}
		const labels: Record<string, string> = {};
		for (const [key, value] of Object.entries(data.sidebarLabels as Record<string, unknown>)) {
			if (typeof value === 'string' && value.trim()) labels[key] = value.trim().slice(0, 40);
		}
		return labels;
	})(),
	appIcon: typeof data.appIcon === 'string' ? data.appIcon : prev.appIcon,
	appTitleSuffix:
		typeof data.appTitleSuffix === 'string' ? data.appTitleSuffix : prev.appTitleSuffix,
	customVersion:
		typeof data.customVersion === 'number' && data.customVersion >= 1
			? data.customVersion
			: prev.customVersion,
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
	const canManage = role === 'super_admin' || user?.canCustomizeUi === true;

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

	const iconFileRef = useRef<HTMLInputElement>(null);
	const [iconError, setIconError] = useState<string | null>(null);

	const handleIconFile = (file: File) => {
		setIconError(null);
		if (!/^image\//.test(file.type)) {
			setIconError('Formato no válido: usá PNG, JPG, WEBP o ICO');
			return;
		}
		if (file.size > 300000) {
			setIconError('El icono debe pesar menos de 300 KB');
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = typeof reader.result === 'string' ? reader.result : '';
			if (!dataUrl.startsWith('data:image/') || dataUrl.length > 400000) {
				setIconError('El icono es demasiado grande');
				return;
			}
			setAnyField('appIcon', dataUrl);
		};
		reader.onerror = () => setIconError('No se pudo leer el archivo');
		reader.readAsDataURL(file);
	};

	type TeamDraft = { name: string; title: string; role: string };
	const [teamDrafts, setTeamDrafts] = useState<Record<string, TeamDraft>>({});
	const [teamBusy, setTeamBusy] = useState<Record<string, boolean>>({});
	const [teamRowError, setTeamRowError] = useState<Record<string, string>>({});
	const [teamSavedId, setTeamSavedId] = useState<string | null>(null);
	const teamSavedTimer = useRef<number | null>(null);

	useEffect(
		() => () => {
			if (teamSavedTimer.current !== null) window.clearTimeout(teamSavedTimer.current);
		},
		[],
	);

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
				headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id ?? '' },
				body: JSON.stringify(payload),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok || data.error) {
				throw new Error(data.error || 'No se pudo guardar la configuración');
			}
			/* display currency: sync into nt_prefs so formatCurrency picks it up */
			try {
				const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
				const parsed = raw ? JSON.parse(raw) : null;
				const base = parsed && typeof parsed === 'object' ? parsed : {};
				if (base.currency !== settings.currency) {
					window.localStorage.setItem(
						PREFS_STORAGE_KEY,
						JSON.stringify({ ...base, currency: settings.currency }),
					);
				}
			} catch {
				/* localStorage no disponible */
			}
			/* window title follows the program name + configured suffix */
			try {
				const api = (window as Window & { electronAPI?: { setWindowTitle?: (t: string) => Promise<unknown> } }).electronAPI;
				if (api && typeof api.setWindowTitle === 'function' && settings.companyName.trim()) {
					const suffix = settings.appTitleSuffix.trim();
					void api.setWindowTitle(
						suffix ? `${settings.companyName.trim()} ${suffix}` : settings.companyName.trim(),
					);
				}
			} catch {
				/* sin Electron: título nativo sin actualizar */
			}
			/* apply theme right away and refresh the cached public login branding */
			try {
				document.documentElement.dataset.theme = settings.theme;
			} catch {
				/* sin document */
			}
			try {
				window.localStorage.setItem(
					'nt_pub_settings',
					JSON.stringify({
						logo: settings.companyLogo,
						name: settings.companyName,
						tagline: settings.loginTagline,
					}),
				);
			} catch {
				/* localStorage no disponible */
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
				headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id ?? '' },
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

	const setAnyField = (key: keyof SettingsData, value: unknown) =>
		setSettings((prev) => ({ ...prev, [key]: value }) as SettingsData);

	const updateField = (key: keyof SettingsData) => (value: string) => setField(key, value);

	const navOrderList = (() => {
		const base = NAV_LABELS.map((item) => item.path);
		const current = settings.sidebarOrder.filter((path) => base.includes(path));
		const rest = base.filter((path) => !current.includes(path));
		return [...current, ...rest];
	})();

	const moveNav = (path: string, dir: -1 | 1) => {
		const list = [...navOrderList];
		const index = list.indexOf(path);
		const target = index + dir;
		if (index < 0 || target < 0 || target >= list.length) return;
		[list[index], list[target]] = [list[target], list[index]];
		setAnyField('sidebarOrder', list);
	};

	const toggleNavHidden = (path: string) => {
		const next = new Set(settings.sidebarHidden);
		if (next.has(path)) next.delete(path);
		else next.add(path);
		setAnyField('sidebarHidden', Array.from(next));
	};

	const selectTheme = (value: string) => {
		setField('theme', value);
		try {
			document.documentElement.dataset.theme = value;
		} catch {
			/* sin document */
		}
	};

	const handleMargin = (value: string) =>
		setSettings((prev) => {
			if (value.trim() === '') return { ...prev, marginMinimum: 0 };
			const next = Number(value);
			return Number.isFinite(next) ? { ...prev, marginMinimum: next } : prev;
		});

	const handleNumField =
		(key: 'notifInterval' | 'loginMaxAttempts' | 'loginLockoutMinutes') => (value: string) =>
			setSettings((prev) => {
				if (value.trim() === '') return { ...prev, [key]: 0 };
				const next = Number(value);
				return Number.isFinite(next) ? { ...prev, [key]: next } : prev;
			});

	const getTeamDraft = (member: (typeof users)[number]): TeamDraft =>
		teamDrafts[member.id] || {
			name: member.name,
			title: member.title || '',
			role: member.role,
		};

	const setTeamDraft = (memberId: string, patch: Partial<TeamDraft>) =>
		setTeamDrafts((prev) => {
			const current =
				prev[memberId] ||
				(() => {
					const member = users.find((u) => u.id === memberId);
					return {
						name: member ? member.name : '',
						title: member && member.title ? member.title : '',
						role: member ? member.role : 'vendedor',
					};
				})();
			return { ...prev, [memberId]: { ...current, ...patch } };
		});

	const saveTeamMember = async (memberId: string) => {
		const member = users.find((u) => u.id === memberId);
		if (!member) return;
		const draft = getTeamDraft(member);
		if (!draft.name.trim()) {
			setTeamRowError((prev) => ({ ...prev, [memberId]: 'El nombre no puede estar vacío' }));
			return;
		}
		setTeamBusy((prev) => ({ ...prev, [memberId]: true }));
		setTeamRowError((prev) => ({ ...prev, [memberId]: '' }));
		try {
			const response = await fetch(apiUrl(`/api/team/${memberId}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: draft.name.trim(),
					title: draft.title.trim(),
					role: draft.role,
				}),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok || data.error) {
				throw new Error(data.error || 'No se pudo guardar');
			}
			setTeamDrafts((prev) => {
				const next = { ...prev };
				delete next[memberId];
				return next;
			});
			setTeamSavedId(memberId);
			if (teamSavedTimer.current !== null) window.clearTimeout(teamSavedTimer.current);
			teamSavedTimer.current = window.setTimeout(() => setTeamSavedId(null), 2500);
			await fetchTeam();
		} catch (error) {
			setTeamRowError((prev) => ({
				...prev,
				[memberId]:
					error instanceof Error && error.message ? error.message : 'Error al guardar',
			}));
		} finally {
			setTeamBusy((prev) => ({ ...prev, [memberId]: false }));
		}
	};

	const toggleTeamMemberActive = async (memberId: string) => {
		const member = users.find((u) => u.id === memberId);
		if (!member) return;
		setTeamBusy((prev) => ({ ...prev, [memberId]: true }));
		setTeamRowError((prev) => ({ ...prev, [memberId]: '' }));
		try {
			const response = await fetch(apiUrl(`/api/team/${memberId}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isActive: !member.isActive }),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok || data.error) {
				throw new Error(data.error || 'No se pudo cambiar el estado');
			}
			await fetchTeam();
		} catch (error) {
			setTeamRowError((prev) => ({
				...prev,
				[memberId]:
					error instanceof Error && error.message ? error.message : 'Error al guardar',
			}));
		} finally {
			setTeamBusy((prev) => ({ ...prev, [memberId]: false }));
		}
	};

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
			new Notification(settings.companyName.trim() || 'TeknoTech Services', {
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
				{ id: 'equipo', label: 'Equipo' },
				{ id: 'sistema', label: 'Sistema' },
				{ id: 'correos', label: 'Correos' },
			]
		: [{ id: 'cuenta', label: 'Cuenta' }];

	const logoInputValue = settings.companyLogo.startsWith('data:') ? '' : settings.companyLogo;

	const intervalOptions = NOTIF_INTERVAL_OPTIONS.includes(settings.notifInterval)
		? NOTIF_INTERVAL_OPTIONS
		: [settings.notifInterval, ...NOTIF_INTERVAL_OPTIONS].sort((a, b) => a - b);

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
				subtitle={canManage ? 'Empresa, equipo, sistema, correos y tu cuenta' : 'Tu cuenta de acceso'}
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
												Mínimo de venta (USD)
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

			{canManage && activeTab === 'equipo' ? (
				<div
					role="tabpanel"
					id="settings-panel-equipo"
					aria-labelledby="settings-tab-equipo"
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
											<UserCog className="w-4 h-4" />
										</span>
										<div>
											<h2 className={SECTION_TITLE}>Altas por defecto</h2>
											<p className="text-xs text-[#5B7295]">
												Valores iniciales del formulario Nuevo miembro
											</p>
										</div>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div>
											<label htmlFor="settings-team-default-role" className={LABEL_CLASS}>
												Puesto por defecto
											</label>
											<select
												id="settings-team-default-role"
												value={settings.teamDefaultRole}
												onChange={(e) => setField('teamDefaultRole', e.target.value)}
												className={INPUT_CLASS}
											>
												{TEAM_DEFAULT_ROLE_OPTIONS.map((role) => (
													<option key={role} value={role}>
														{ROLE_LABELS[role] || role}
													</option>
												))}
											</select>
										</div>
										<Field
											id="settings-team-default-title"
											label="Cargo por defecto"
											value={settings.teamDefaultTitle}
											onChange={updateField('teamDefaultTitle')}
											placeholder="Ej: Vendedor Jr."
										/>
									</div>
									<div className="flex justify-end pt-1">
										<Button type="submit" variant="primary" disabled={saving}>
											{saving ? 'GUARDANDO…' : 'GUARDAR CAMBIOS'}
										</Button>
									</div>
								</Card>
							</form>

							<Card className={`p-6 ${CARD_CLASS}`}>
								<div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#16294A]">
									<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
										<User className="w-4 h-4" />
									</span>
									<div>
										<h2 className={SECTION_TITLE}>Miembros del equipo</h2>
										<p className="text-xs text-[#5B7295]">
											Editá nombre, cargo, puesto y estado de cada integrante
										</p>
									</div>
								</div>
								{users.length === 0 ? (
									<div className="text-center py-8">
										<p className="text-sm text-[#5B7295]">Todavía no hay miembros registrados</p>
									</div>
								) : (
									<div className="overflow-x-auto">
										<table className="w-full text-sm">
											<thead>
												<tr className="text-left text-[10px] uppercase tracking-[0.12em] text-[#5B7295] border-b border-[#16294A]">
													<th className="py-2 pr-3 font-semibold">Miembro</th>
													<th className="py-2 pr-3 font-semibold">Nombre</th>
													<th className="py-2 pr-3 font-semibold">Cargo</th>
													<th className="py-2 pr-3 font-semibold">Puesto</th>
													<th className="py-2 pr-3 font-semibold">Estado</th>
													<th className="py-2 font-semibold">Acciones</th>
												</tr>
											</thead>
											<tbody>
												{users.map((member) => {
													const draft = getTeamDraft(member);
													const busy = teamBusy[member.id] === true;
													const rowError = teamRowError[member.id];
													const dirty =
														draft.name !== member.name ||
														draft.title !== (member.title || '') ||
														draft.role !== member.role;
													return (
														<tr
															key={member.id}
															className="border-b border-[#16294A]/60 align-middle"
														>
															<td className="py-2.5 pr-3">
																<div className="flex items-center gap-2.5 min-w-0">
																	<span className="w-8 h-8 rounded-full bg-[#1877E8]/12 border border-[#1877E8]/30 text-[#60A5FA] flex items-center justify-center shrink-0 text-[10px] font-bold uppercase">
																		{member.name
																			.split(' ')
																			.filter(Boolean)
																			.map((part) => part[0])
																			.slice(0, 2)
																			.join('')}
																	</span>
																	<span className="font-mono text-[11px] text-[#5B7295] truncate">
																		{member.code}
																	</span>
																</div>
															</td>
															<td className="py-2 pr-3 min-w-[10rem]">
																<input
																	type="text"
																	value={draft.name}
																	aria-label={`Nombre de ${member.name}`}
																	onChange={(e) => setTeamDraft(member.id, { name: e.target.value })}
																	className={INPUT_SM}
																/>
															</td>
															<td className="py-2 pr-3 min-w-[9rem]">
																<input
																	type="text"
																	value={draft.title}
																	placeholder="Ej: Closer"
																	aria-label={`Cargo de ${member.name}`}
																	onChange={(e) => setTeamDraft(member.id, { title: e.target.value })}
																	className={INPUT_SM}
																/>
															</td>
															<td className="py-2 pr-3 min-w-[9rem]">
																{member.role === 'super_admin' ? (
																	<span className="inline-block text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#FBBF24]">
																		CEO
																	</span>
																) : (
																	<select
																		value={draft.role}
																		aria-label={`Puesto de ${member.name}`}
																		onChange={(e) => setTeamDraft(member.id, { role: e.target.value })}
																		className={INPUT_SM}
																	>
																		{TEAM_DEFAULT_ROLE_OPTIONS.map((role) => (
																			<option key={role} value={role}>
																				{ROLE_LABELS[role] || role}
																			</option>
																		))}
																	</select>
																)}
															</td>
															<td className="py-2 pr-3">
																<button
																	type="button"
																	disabled={busy}
																	aria-label={`Cambiar estado de ${member.name}`}
																	onClick={() => toggleTeamMemberActive(member.id)}
																	className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border transition-colors disabled:opacity-60 ${
																		member.isActive
																			? 'bg-[#34D399]/10 border-[#34D399]/40 text-[#34D399] hover:bg-[#34D399]/20'
																			: 'bg-[#E11D48]/10 border-[#E11D48]/40 text-[#FB7185] hover:bg-[#E11D48]/20'
																	}`}
																>
																	<span
																		className={`w-1.5 h-1.5 rounded-full ${
																			member.isActive ? 'bg-[#34D399]' : 'bg-[#E11D48]'
																		}`}
																	/>
																	{member.isActive ? 'Activo' : 'Inactivo'}
																</button>
															</td>
															<td className="py-2">
																<div className="flex items-center gap-2">
																	<Button
																		type="button"
																		variant="secondary"
																		size="sm"
																		disabled={busy || !dirty}
																		onClick={() => saveTeamMember(member.id)}
																	>
																		{busy ? 'GUARDANDO…' : 'GUARDAR'}
																	</Button>
																	{teamSavedId === member.id ? (
																		<span className="text-[10px] uppercase tracking-wider text-[#34D399]">
																			Guardado
																		</span>
																	) : null}
																</div>
																{rowError ? (
																	<p className="text-[11px] text-[#FB7185] mt-1">{rowError}</p>
																) : null}
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								)}
							</Card>
						</>
					)}
				</div>
			) : null}

			{canManage && activeTab === 'sistema' ? (
				<div
					role="tabpanel"
					id="settings-panel-sistema"
					aria-labelledby="settings-tab-sistema"
					className="space-y-6"
				>
					{loading ? (
						settingsSkeleton
					) : (
						<form onSubmit={handleSave} className="space-y-6">
							<Card className={`p-6 ${CARD_CLASS}`}>
								<div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#16294A]">
									<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
										<Sliders className="w-4 h-4" />
									</span>
									<div>
										<h2 className={SECTION_TITLE}>Configuración del sistema</h2>
										<p className="text-xs text-[#5B7295]">
											Moneda, alertas y seguridad de acceso para todo el equipo
										</p>
									</div>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label htmlFor="settings-currency" className={LABEL_CLASS}>
											Moneda
										</label>
										<select
											id="settings-currency"
											value={settings.currency}
											onChange={(e) => setField('currency', e.target.value)}
											className={INPUT_CLASS}
										>
											{CURRENCY_OPTIONS.map((option) => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
									</div>
									<div>
										<label htmlFor="settings-notif-interval" className={LABEL_CLASS}>
											Alertas cada (segundos)
										</label>
										<select
											id="settings-notif-interval"
											value={String(settings.notifInterval)}
											onChange={(e) => handleNumField('notifInterval')(e.target.value)}
											className={INPUT_CLASS}
										>
											{intervalOptions.map((seconds) => (
												<option key={seconds} value={seconds}>
													{seconds} segundos
												</option>
											))}
										</select>
									</div>
								</div>
							</Card>

							<Card className={`p-6 ${CARD_CLASS}`}>
								<div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#16294A]">
									<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
										<Palette className="w-4 h-4" />
									</span>
									<div>
										<h2 className={SECTION_TITLE}>Apariencia</h2>
										<p className="text-xs text-[#5B7295]">
											Tema visual de toda la aplicación
										</p>
									</div>
								</div>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
									{THEME_OPTIONS.map((option) => (
										<button
											key={option.value}
											type="button"
											id={`settings-theme-${option.value}`}
											aria-pressed={settings.theme === option.value}
											onClick={() => selectTheme(option.value)}
											className={`rounded-xl border p-3 text-left transition-all ${
												settings.theme === option.value
													? 'border-[#1877E8] bg-[#1877E8]/10 ring-2 ring-[#1877E8]/40'
													: 'border-[#1C3557] bg-[#0C1E36] hover:border-[#1877E8]/60'
											}`}
										>
											<span className="flex gap-1.5 mb-2">
												{option.swatch.map((color) => (
													<span
														key={color}
														className="w-4 h-4 rounded-md border border-white/15"
														style={{ backgroundColor: color }}
													/>
												))}
											</span>
											<span className="text-xs text-white font-semibold block">
												{option.label}
											</span>
											<span className="text-[10px] text-[#5B7295] uppercase tracking-[0.1em]">
												{option.value}
											</span>
										</button>
									))}
								</div>
								<p className="text-xs text-[#5B7295] mt-3">
									Se aplica al instante y queda guardado para todos los usuarios.
								</p>
							</Card>

							<Card className={`p-6 ${CARD_CLASS}`}>
								<div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#16294A]">
									<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
										<PanelLeft className="w-4 h-4" />
									</span>
									<div>
										<h2 className={SECTION_TITLE}>Sidebar y navegación</h2>
										<p className="text-xs text-[#5B7295]">
											Orden y visibilidad de los menús, sin tocar código
										</p>
									</div>
								</div>
								<ul className="space-y-1.5" id="settings-sidebar-list">
								{navOrderList.map((path, index) => {
									const meta = NAV_LABELS.find((item) => item.path === path);
									if (!meta) return null;
									const hidden = settings.sidebarHidden.includes(path);
									const customLabel = (settings.sidebarLabels[path] || '').trim();
									const displayLabel = customLabel || meta.label;
									return (
										<li
											key={path}
											data-path={path}
											className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
												hidden
													? 'border-[#1C3557] bg-[#0C1E36]/60 opacity-60'
													: 'border-[#1C3557] bg-[#0C1E36]'
											}`}
										>
											<span className="text-[10px] text-[#5B7295] w-5 text-center">
												{index + 1}
											</span>
											<input
												type="text"
												id={`settings-nav-label-${path.replace(/\//g, '_')}`}
												aria-label={`Renombrar ${displayLabel}`}
												maxLength={40}
												placeholder={meta.label}
												value={customLabel}
												onChange={(e) =>
													setAnyField('sidebarLabels', {
														...settings.sidebarLabels,
														[path]: e.target.value,
													})
												}
												className={`flex-1 min-w-0 bg-transparent border-0 border-b border-dashed border-transparent focus:border-[#1877E8] focus:outline-none text-sm px-1 py-0.5 rounded ${
													hidden ? 'text-[#5B7295] line-through' : 'text-white'
												}`}
											/>
											<button
												type="button"
												aria-label={`Subir ${displayLabel}`}
												disabled={index === 0}
												onClick={() => moveNav(path, -1)}
												className="p-1.5 rounded-lg text-[#8FA6C4] hover:text-white hover:bg-[#1877E8]/15 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
											>
												<ArrowUp className="w-3.5 h-3.5" />
											</button>
											<button
												type="button"
												aria-label={`Bajar ${displayLabel}`}
												disabled={index === navOrderList.length - 1}
												onClick={() => moveNav(path, 1)}
												className="p-1.5 rounded-lg text-[#8FA6C4] hover:text-white hover:bg-[#1877E8]/15 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
											>
												<ArrowDown className="w-3.5 h-3.5" />
											</button>
											<button
												type="button"
												id={`settings-nav-${path.replace(/\//g, '_')}`}
												aria-pressed={!hidden}
												aria-label={`Mostrar u ocultar ${displayLabel}`}
												onClick={() => toggleNavHidden(path)}
												className={`p-1.5 rounded-lg transition-colors ${
													hidden
														? 'text-[#E11D48] hover:bg-[#E11D48]/15'
														: 'text-[#8FA6C4] hover:text-white hover:bg-[#1877E8]/15'
												}`}
											>
												{hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
											</button>
										</li>
									);
								})}
							</ul>
							<p className="text-xs text-[#5B7295] mt-3">
								Ordená, ocultá y renombrá cada entrada: se escribe un nombre para
								renombrarlo (vacío = nombre original). Aplica para todos los perfiles.
							</p>
						</Card>

						<Card className={`p-6 ${CARD_CLASS}`}>
							<div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#16294A]">
								<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
									<AppWindow className="w-4 h-4" />
								</span>
								<div className="flex-1">
									<h2 className={SECTION_TITLE}>Identidad de la aplicación</h2>
									<p className="text-xs text-[#5B7295]">
										Título de la ventana, icono y versión de personalización
									</p>
								</div>
								<span
									id="settings-custom-version"
									className="text-[10px] uppercase tracking-[0.1em] font-semibold px-2.5 py-1 rounded-lg bg-[#1877E8]/15 border border-[#1877E8]/30 text-[#60A5FA]"
								>
									v{settings.customVersion}
								</span>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label htmlFor="settings-title-suffix" className={LABEL_CLASS}>
										Sufijo del título
									</label>
									<input
										id="settings-title-suffix"
										type="text"
										maxLength={40}
										value={settings.appTitleSuffix}
										onChange={(e) => setField('appTitleSuffix', e.target.value)}
										className={INPUT_CLASS}
										placeholder="Cotizador"
									/>
									<p className="text-xs text-[#5B7295] mt-1.5">
										Ventana: {settings.companyName.trim() || '—'}
										{settings.appTitleSuffix.trim() ? ` ${settings.appTitleSuffix.trim()}` : ''}
									</p>
								</div>
								<div>
									<span className={LABEL_CLASS}>Icono de la aplicación</span>
									<div className="flex items-center gap-3">
										<span className="w-10 h-10 rounded-xl border border-[#1C3557] bg-[#0C1E36] overflow-hidden flex items-center justify-center shrink-0">
											{settings.appIcon ? (
												<img src={settings.appIcon} alt="" className="w-full h-full object-contain" />
											) : (
												<AppWindow className="w-4 h-4 text-[#5B7295]" />
											)}
										</span>
										<button
											type="button"
											id="settings-app-icon"
											onClick={() => iconFileRef.current?.click()}
											className="px-3 py-2 rounded-xl border border-[#1C3557] bg-[#0C1E36] text-xs text-[#8FA6C4] hover:text-white hover:border-[#1877E8]/60 transition-colors"
										>
											Subir icono
										</button>
										{settings.appIcon ? (
											<button
												type="button"
												id="settings-app-icon-clear"
												onClick={() => setAnyField('appIcon', '')}
												className="px-3 py-2 rounded-xl border border-[#E11D48]/40 bg-[#E11D48]/10 text-xs text-[#FB7185] hover:bg-[#E11D48]/20 transition-colors"
											>
												Quitar
											</button>
										) : null}
										<input
											ref={iconFileRef}
											type="file"
											accept="image/png,image/jpeg,image/webp,image/x-icon,image/vnd.microsoft.icon"
											className="hidden"
											onChange={(e) => {
												const file = e.target.files && e.target.files[0];
												if (file) handleIconFile(file);
												e.target.value = '';
											}}
										/>
									</div>
									{iconError ? <p className="text-xs text-[#FB7185] mt-1.5">{iconError}</p> : null}
									<p className="text-xs text-[#5B7295] mt-1.5">
										PNG, JPG, WEBP o ICO (máx. 300 KB). Aplica a la ventana y al menú de tareas.
									</p>
								</div>
							</div>
							<p className="text-xs text-[#5B7295] mt-4 pt-3 border-t border-[#16294A]">
								Cada guardado genera una versión de personalización (v{settings.customVersion}
								{' '}&rarr; v{settings.customVersion + 1}) y se notifica como nueva
								actualización en todas las cuentas abiertas.
							</p>
						</Card>

							<Card className={`p-6 ${CARD_CLASS}`}>
								<div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#16294A]">
									<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
										<Type className="w-4 h-4" />
									</span>
									<div>
										<h2 className={SECTION_TITLE}>Pantalla de acceso</h2>
										<p className="text-xs text-[#5B7295]">
											Texto de portada del login (líneas separadas con |)
										</p>
									</div>
								</div>
								<label htmlFor="settings-login-tagline" className={LABEL_CLASS}>
									Frase del login
								</label>
								<textarea
									id="settings-login-tagline"
									rows={2}
									maxLength={200}
									value={settings.loginTagline}
									onChange={(e) => setField('loginTagline', e.target.value)}
									className={INPUT_CLASS}
								/>
								<p className="text-xs text-[#5B7295] mt-2">
									Vista previa: {settings.loginTagline.split('|').map((l) => l.trim()).filter(Boolean).join(' · ') || '—'}
								</p>
							</Card>

							<Card className={`p-6 ${CARD_CLASS}`}>
								<div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#16294A]">
									<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
										<KeyRound className="w-4 h-4" />
									</span>
									<div>
										<h2 className={SECTION_TITLE}>Seguridad de acceso</h2>
										<p className="text-xs text-[#5B7295]">
											Bloqueo temporal tras intentos fallidos de login
										</p>
									</div>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label htmlFor="settings-login-max" className={LABEL_CLASS}>
											Intentos fallidos permitidos
										</label>
										<input
											id="settings-login-max"
											type="number"
											min={3}
											max={20}
											value={settings.loginMaxAttempts}
											onChange={(e) => handleNumField('loginMaxAttempts')(e.target.value)}
											className={INPUT_CLASS}
										/>
									</div>
									<div>
										<label htmlFor="settings-login-lockout" className={LABEL_CLASS}>
											Bloqueo temporal (minutos)
										</label>
										<input
											id="settings-login-lockout"
											type="number"
											min={1}
											max={120}
											value={settings.loginLockoutMinutes}
											onChange={(e) => handleNumField('loginLockoutMinutes')(e.target.value)}
											className={INPUT_CLASS}
										/>
									</div>
								</div>
								<p className="text-xs text-[#5B7295] mt-4">
									Tras {settings.loginMaxAttempts} intentos fallidos se bloquea el acceso
									durante {settings.loginLockoutMinutes} minutos.
								</p>
							</Card>

							<div className="flex justify-end pt-1">
								<Button type="submit" variant="primary" disabled={saving}>
									{saving ? 'GUARDANDO…' : 'GUARDAR CAMBIOS'}
								</Button>
							</div>
						</form>
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
