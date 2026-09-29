import React from 'react';
import { createPortal } from 'react-dom';
import { Camera, KeyRound, Save, Trash2, X } from 'lucide-react';
import { useAuth } from '../store/auth';
import { useTeam } from '../store/team';
import { apiUrl } from '../api';
import { Button, Spinner } from './ui';
import { ImageCropper } from './ImageCropper';
import { ROLE_LABELS } from '@/shared/constants';

const INPUT_CLASS =
	'w-full px-4 py-2.5 bg-[#0C1E36] border border-[#1C3557] text-white placeholder-[#5B7295] focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none rounded-xl text-sm';
const LABEL_CLASS = 'block text-xs uppercase tracking-[0.12em] text-[#8FA6C4] font-semibold mb-1.5';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ProfileModalProps {
	onClose: () => void;
}

const initials = (name: string) =>
	name
		.split(' ')
		.filter(Boolean)
		.map((part) => part[0])
		.slice(0, 2)
		.join('')
		.toUpperCase();

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
	const { user, updateUser } = useAuth();
	const { users, fetchTeam } = useTeam();
	const fileRef = React.useRef<HTMLInputElement>(null);
	const [name, setName] = React.useState(user?.name ?? '');
	const [email, setEmail] = React.useState(user?.email ?? '');
	const [original, setOriginal] = React.useState<string | null>(null);
	const [cropperOpen, setCropperOpen] = React.useState(false);
	const [preview, setPreview] = React.useState<string | null>(null);
	const [dirty, setDirty] = React.useState(false);
	const [saving, setSaving] = React.useState(false);
	const [message, setMessage] = React.useState<string | null>(null);
	const [error, setError] = React.useState<string | null>(null);

	const me = user ? users.find((u) => u.id === user.id) : undefined;
	const currentAvatar = preview ?? me?.avatar ?? null;

	React.useEffect(() => {
		if (users.length === 0) void fetchTeam();
	}, [users.length, fetchTeam]);

	React.useEffect(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	}, []);

	React.useEffect(() => {
		if (dirty) return;
		setName(me?.name ?? user?.name ?? '');
		setEmail(me?.email ?? user?.email ?? '');
	}, [dirty, me?.name, me?.email, user?.name, user?.email]);

	const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;
		if (!file.type.startsWith('image/')) {
			setError('El archivo debe ser una imagen');
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			setError('La imagen no puede superar 5 MB');
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			setOriginal(String(reader.result));
			setCropperOpen(true);
			setMessage(null);
			setError(null);
		};
		reader.onerror = () => setError('No se pudo leer la imagen');
		reader.readAsDataURL(file);
	};

	const save = async () => {
		if (!user) return;
		const trimmedName = name.trim();
		const trimmedEmail = email.trim();
		if (!trimmedName) {
			setError('El nombre no puede estar vacío');
			return;
		}
		if (!EMAIL_RE.test(trimmedEmail)) {
			setError('Ingresa un email válido');
			return;
		}
		setSaving(true);
		setMessage(null);
		setError(null);
		try {
			const body: Record<string, unknown> = { name: trimmedName, email: trimmedEmail };
			if (preview !== null && preview !== (me?.avatar ?? null)) body.avatar = preview;
			const res = await fetch(apiUrl(`/api/team/${user.id}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || 'Error al guardar');
			await fetchTeam();
			updateUser({ name: trimmedName, email: trimmedEmail });
			setDirty(false);
			setMessage('Perfil actualizado');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil');
		} finally {
			setSaving(false);
		}
	};

	const removeAvatar = async () => {
		if (!user) return;
		setSaving(true);
		setMessage(null);
		setError(null);
		try {
			const res = await fetch(apiUrl(`/api/team/${user.id}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ avatar: null }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || 'No se pudo quitar la foto');
			setPreview(null);
			await fetchTeam();
			setDirty(false);
			setMessage('Foto eliminada');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'No se pudo eliminar la foto');
		} finally {
			setSaving(false);
		}
	};

	if (!user) return null;

	return createPortal(
		<div
			className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[3px] flex items-center justify-center p-4 animate-fade-in"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
		>
			<div
				className="bg-[#10233E] border border-[#1C3557] rounded-2xl w-full max-w-md shadow-[0_25px_80px_-20px_rgba(0,0,0,0.9)] animate-scale-in max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="p-6 border-b border-[#16294A] flex items-start justify-between">
					<div>
						<p className="font-display text-lg text-white uppercase tracking-wide">Mi perfil</p>
						<p className="text-xs text-[#5B7295] uppercase tracking-[0.15em] mt-1">Cuenta personal</p>
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

				<div className="p-6 space-y-5">
					<div className="flex items-center gap-5">
						<div className="relative group shrink-0">
							{currentAvatar ? (
								<img
									src={currentAvatar}
									alt=""
									className="w-24 h-24 rounded-full object-cover ring-2 ring-[#1877E8]/50"
								/>
							) : (
								<div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1877E8] to-[#6366F1] flex items-center justify-center font-display text-2xl text-white">
									{initials(name || user.name)}
								</div>
							)}
							<button
								type="button"
								onClick={() => fileRef.current?.click()}
								aria-label="Cambiar foto"
								className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#1877E8] text-white shadow-lg hover:bg-[#0F65CC] transition-colors"
							>
								<Camera size={14} />
							</button>
						</div>
						<div className="min-w-0 text-sm space-y-1">
							<p className="text-xs uppercase tracking-[0.12em] text-[#8FA6C4] font-semibold">Foto de perfil</p>
							<p className="text-xs text-[#5B7295]">
								PNG o JPG de hasta 5 MB. Al elegirla podrás acomodar el recorte antes de guardar.
							</p>
						</div>
					</div>

					<input
						ref={fileRef}
						type="file"
						accept="image/*"
						className="hidden"
						onChange={handleFile}
					/>

					<div className="flex flex-wrap gap-2">
						<Button size="sm" onClick={save} disabled={saving || !dirty}>
							{saving ? <Spinner className="w-4 h-4" /> : <Save size={14} />}
							Guardar foto
						</Button>
						<Button
							variant="danger"
							size="sm"
							onClick={removeAvatar}
							disabled={saving || !me?.avatar}
						>
							<Trash2 size={14} />
							Quitar foto
						</Button>
					</div>

					<div className="space-y-4">
						<div>
							<label className={LABEL_CLASS} htmlFor="profile-name">
								Nombre
							</label>
							<input
								id="profile-name"
								type="text"
								className={INPUT_CLASS}
								value={name}
								placeholder="Tu nombre"
								onChange={(e) => {
									setName(e.target.value);
									setDirty(true);
								}}
							/>
						</div>
						<div>
							<label className={LABEL_CLASS} htmlFor="profile-email">
								Email
							</label>
							<input
								id="profile-email"
								type="email"
								className={INPUT_CLASS}
								value={email}
								placeholder="tu@empresa.com"
								onChange={(e) => {
									setEmail(e.target.value);
									setDirty(true);
								}}
							/>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2 pt-1">
						<span className="text-[10px] uppercase tracking-[0.18em] text-[#60A5FA] bg-[#1877E8]/15 px-2 py-0.5 rounded-full">
							{ROLE_LABELS[user.role] || user.role}
						</span>
						<span className="text-[10px] uppercase tracking-[0.18em] text-[#8FA6C4] bg-[#0C1E36] border border-[#1C3557] px-2 py-0.5 rounded-full">
							Código: {user.code}
						</span>
					</div>

					<div className="flex flex-wrap gap-2 pt-2 border-t border-[#16294A]">
						<Button variant="primary" size="sm" onClick={save} disabled={saving || !dirty}>
							{saving ? <Spinner className="w-4 h-4" /> : <Save size={14} />}
							Guardar cambios
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								onClose();
								window.location.hash = '#/configuracion';
							}}
						>
							<KeyRound size={14} />
							Cambiar credenciales
						</Button>
					</div>

					{message ? <p className="text-xs text-[#8FA6C4]">{message}</p> : null}
					{error ? <p className="text-xs text-[#FB7185]">{error}</p> : null}
				</div>

				{cropperOpen && original ? (
					<ImageCropper
						src={original}
						onCancel={() => setCropperOpen(false)}
						onConfirm={(cropped) => {
							setPreview(cropped);
							setDirty(true);
							setCropperOpen(false);
						}}
					/>
				) : null}
			</div>
		</div>,
		document.body
	);
};

export default ProfileModal;
