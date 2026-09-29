import React, { useEffect, useState } from 'react';
import { AlertCircle, Building2, Check, KeyRound, Mail, Server } from 'lucide-react';
import { useAuth } from '@/renderer/store/auth';
import { apiUrl } from '@/renderer/api';
import { COMPANY, MINIMUM_MARGIN, ROLE_LABELS } from '@/shared/constants';
import { Button, Card, PageHeader, Spinner } from '@/renderer/components/ui';

const INPUT_CLASS =
	'w-full px-4 py-2.5 bg-[#0C1E36] border border-[#1C3557] text-white placeholder-[#5B7295] focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none rounded-xl text-sm';
const LABEL_CLASS =
	'block text-xs uppercase tracking-[0.12em] text-[#8FA6C4] font-semibold mb-1.5';
const CARD_CLASS = 'bg-[#10233E] border border-[#1C3557] rounded-2xl';
const SECTION_TITLE = 'font-display text-sm uppercase tracking-[0.12em] text-white mb-4';

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

const Settings: React.FC = () => {
	const { user } = useAuth();
	const role = user?.role;
	const canManage = role === 'super_admin' || role === 'gerente';

	const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [banner, setBanner] = useState<BannerState | null>(null);

	const [credField, setCredField] = useState<'password' | 'pin'>('password');
	const [credCurrent, setCredCurrent] = useState('');
	const [credNext, setCredNext] = useState('');
	const [credConfirm, setCredConfirm] = useState('');
	const [credSaving, setCredSaving] = useState(false);
	const [credBanner, setCredBanner] = useState<BannerState | null>(null);

	const [testingMail, setTestingMail] = useState(false);

	useEffect(() => {
		let active = true;
		fetch(apiUrl('/api/settings'))
			.then((res) => (res.ok ? res.json() : null))
			.then((data: any) => {
				if (!active || !data || typeof data !== 'object') return;
				setSettings((prev) => ({
					companyName:
						typeof data.companyName === 'string' ? data.companyName : prev.companyName,
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
				}));
			})
			.catch(() => undefined)
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, []);

	const handleSave = async (event: React.FormEvent) => {
		event.preventDefault();
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

	const updateField = (key: keyof SettingsData) => (value: string) =>
		setSettings((prev) => ({ ...prev, [key]: value }) as SettingsData);

	return (
		<div className="max-w-5xl mx-auto space-y-6">
			<PageHeader
				title="Ajustes"
				subtitle={canManage ? 'Datos de la empresa, correos y tu cuenta' : 'Tu cuenta de acceso'}
			/>

			<Banner banner={banner} />

			<Card className={`p-6 ${CARD_CLASS}`}>
				<div className="flex items-center gap-4 mb-6 pb-5 border-b border-[#16294A]">
					<span className="w-14 h-14 rounded-2xl bg-[#1877E8]/12 border border-[#1877E8]/30 text-[#60A5FA] font-display text-xl font-bold flex items-center justify-center shrink-0 uppercase">
						{(user?.name || '?')
							.split(' ')
							.filter(Boolean)
							.map((part: string) => part[0])
							.slice(0, 2)
							.join('')}
					</span>
					<div className="min-w-0">
						<p className="font-display text-lg text-white uppercase tracking-wide truncate">
							{user?.name || '—'}
						</p>
						<div className="flex flex-wrap items-center gap-2 mt-1.5">
							<span className="text-[10px] uppercase tracking-widest bg-[#1877E8]/20 text-[#60A5FA] border border-[#1877E8]/30 rounded-full px-2.5 py-0.5">
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
				</div>

				<div className="flex items-center gap-3 mb-4">
					<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
						<KeyRound className="w-4 h-4" />
					</span>
					<div>
						<h2 className={SECTION_TITLE.replace(' mb-4', '')}>Cambiar credenciales</h2>
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

			{canManage ? (
				loading ? (
					<div className="flex justify-center py-16">
						<Spinner />
					</div>
				) : (
					<form onSubmit={handleSave} className="space-y-6">
						<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
							<Card className={`p-6 ${CARD_CLASS}`}>
								<div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#16294A]">
									<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
										<Building2 className="w-4 h-4" />
									</span>
									<div>
										<h2 className={SECTION_TITLE.replace(' mb-4', '')}>Datos de la empresa</h2>
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
									<Field
										id="settings-logo"
										label="Logo de la empresa (URL)"
										placeholder="https://..."
										value={settings.companyLogo}
										onChange={updateField('companyLogo')}
									/>
								</div>
							</Card>

							<Card className={`p-6 ${CARD_CLASS}`}>
								<div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#16294A]">
									<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
										<Server className="w-4 h-4" />
									</span>
									<div>
										<h2 className={SECTION_TITLE.replace(' mb-4', '')}>Correo de recuperación (SMTP)</h2>
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
						</div>
						<div className="flex justify-end pt-1">
							<Button type="submit" variant="primary" disabled={saving}>
								{saving ? 'GUARDANDO…' : 'GUARDAR CAMBIOS'}
							</Button>
						</div>
					</form>
				)
			) : null}
		</div>
	);
};

export default Settings;
