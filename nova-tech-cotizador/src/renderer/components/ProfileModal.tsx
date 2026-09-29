import React from 'react';
import { Camera, Save, Trash2, X } from 'lucide-react';
import { useAuth } from '../store/auth';
import { useTeam } from '../store/team';
import { apiUrl } from '../api';
import { Button, Spinner } from './ui';
import { ROLE_LABELS } from '@/shared/constants';

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
	const { user } = useAuth();
	const { users, fetchTeam } = useTeam();
	const fileRef = React.useRef<HTMLInputElement>(null);
	const [preview, setPreview] = React.useState<string | null>(null);
	const [dirty, setDirty] = React.useState(false);
	const [saving, setSaving] = React.useState(false);
	const [message, setMessage] = React.useState<string | null>(null);

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

	const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;
		if (!file.type.startsWith('image/')) {
			setMessage('El archivo debe ser una imagen');
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			setMessage('La imagen no puede superar 5 MB');
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => {
				const size = 160;
				const canvas = document.createElement('canvas');
				canvas.width = size;
				canvas.height = size;
				const ctx = canvas.getContext('2d');
				if (!ctx) return;
				const scale = Math.max(size / img.width, size / img.height);
				const w = img.width * scale;
				const h = img.height * scale;
				ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
				setPreview(canvas.toDataURL('image/jpeg', 0.85));
				setDirty(true);
				setMessage(null);
			};
			img.onerror = () => setMessage('No se pudo leer la imagen');
			img.src = String(reader.result);
		};
		reader.readAsDataURL(file);
	};

	const save = async () => {
		if (!user) return;
		setSaving(true);
		setMessage(null);
		try {
			const res = await fetch(apiUrl(`/api/team/${user.id}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ avatar: preview }),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error || 'Error al guardar');
			}
			await fetchTeam();
			setDirty(false);
			setMessage('Foto de perfil actualizada');
		} catch (err) {
			setMessage(err instanceof Error ? err.message : 'No se pudo guardar la foto');
		} finally {
			setSaving(false);
		}
	};

	const removeAvatar = async () => {
		if (!user) return;
		setSaving(true);
		setMessage(null);
		try {
			const res = await fetch(apiUrl(`/api/team/${user.id}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ avatar: null }),
			});
			if (!res.ok) throw new Error('No se pudo quitar la foto');
			setPreview(null);
			await fetchTeam();
			setDirty(false);
			setMessage('Foto eliminada');
		} catch (err) {
			setMessage(err instanceof Error ? err.message : 'No se pudo eliminar la foto');
		} finally {
			setSaving(false);
		}
	};

	if (!user) return null;

	return (
		<div
			className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[3px] flex items-center justify-center p-4 animate-fade-in"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
		>
			<div
				className="bg-[#10233E] border border-[#1C3557] rounded-2xl w-full max-w-md shadow-[0_25px_80px_-20px_rgba(0,0,0,0.9)] animate-scale-in"
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
						<div className="relative group">
							{currentAvatar ? (
								<img
									src={currentAvatar}
									alt=""
									className="w-24 h-24 rounded-full object-cover ring-2 ring-[#1877E8]/50"
								/>
							) : (
								<div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1877E8] to-[#6366F1] flex items-center justify-center font-display text-2xl text-white">
									{initials(user.name)}
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
							<p className="text-white font-medium truncate">{user.name}</p>
							<p className="text-[#5B7295] truncate">{user.email}</p>
							<p className="text-[#60A5FA] text-xs uppercase tracking-[0.18em]">
								{ROLE_LABELS[user.role] || user.role}
							</p>
							<p className="text-[#5B7295] text-xs">Código: {user.code}</p>
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

					{message ? <p className="text-xs text-[#8FA6C4]">{message}</p> : null}
				</div>
			</div>
		</div>
	);
};

export default ProfileModal;
