import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, BadgeDollarSign, Check, Code2, Crown, Lock, RotateCcw, Settings, ShieldCheck, Target, Trash2, UserCheck, UserPlus, Users } from 'lucide-react';
import { useAuth } from '@/renderer/store/auth';
import { useTeam } from '@/renderer/store/team';
import { AVAILABILITY_LABELS, ROLE_LABELS } from '@/shared/constants';
import { apiUrl } from '@/renderer/api';
import { Button, Card, EmptyState, PageHeader, Spinner } from '@/renderer/components/ui';
import PersonModal from '@/renderer/components/PersonModal';

const INPUT_CLASS =
	'w-full px-4 py-2.5 bg-[#0C1E36] border border-[#1C3557] text-white placeholder-[#5B7295] focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none rounded-xl text-sm';
const LABEL_CLASS = 'block text-xs uppercase tracking-[0.12em] text-[#8FA6C4] font-semibold mb-1.5';
const SELECT_CLASS =
	'w-full bg-[#0C1E36] border border-[#1C3557] text-[#D6E2F2] rounded-lg px-3 py-2 text-sm focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none';
const CARD_CLASS = 'bg-[#10233E] border border-[#1C3557] rounded-2xl';
const SECTION_TITLE = 'font-display text-sm uppercase tracking-[0.12em] text-white mb-4';
const SECTION_TITLE_FLAT = 'font-display text-sm uppercase tracking-[0.12em] text-white';
const SECTION_ICON =
	'w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0';

const ROLE_ICONS: Record<string, LucideIcon> = {
	super_admin: ShieldCheck,
	gerente: Crown,
	vendedor: BadgeDollarSign,
	closer: Target,
	desarrollador: Code2,
};

const ROLE_BADGES: Record<string, string> = {
	super_admin: 'bg-[#6366F1]/20 text-[#A5B4FC]',
	gerente: 'bg-[#1877E8]/20 text-[#60A5FA]',
	vendedor: 'bg-[#F59E0B]/20 text-[#FBBF24]',
	closer: 'bg-[#EC4899]/20 text-[#F472B6]',
	desarrollador: 'bg-[#22C55E]/20 text-[#34D399]',
};

const ROLE_BADGE_BASE = 'text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full';

const AVAILABILITY_DOT: Record<string, string> = {
	disponible: 'bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.7)]',
	ocupado: 'bg-[#FBBF24] shadow-[0_0_8px_rgba(251,191,36,0.7)]',
	no_disponible: 'bg-[#FB7185] shadow-[0_0_8px_rgba(251,113,133,0.7)]',
};

const AVATAR_CLASS =
	'rounded-full overflow-hidden bg-gradient-to-br from-[#1877E8] to-[#6366F1] ring-2 ring-[#1877E8]/40 flex items-center justify-center shrink-0 font-display text-white';

const initials = (name: string) =>
	name
		.split(' ')
		.filter(Boolean)
		.map((part) => part[0])
		.slice(0, 2)
		.join('')
		.toUpperCase();

interface AvatarProps {
	name: string;
	avatar?: string | null;
	className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ name, avatar, className = '' }) => (
	<span className={`${AVATAR_CLASS} ${className}`}>
		{avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : initials(name)}
	</span>
);

const TeamManager: React.FC = () => {
	const { user } = useAuth();
	const { users, availabilities, updateAvailability, fetchTeam, fetchAvailability } = useTeam();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
	const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});
	const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
	const [showForm, setShowForm] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [formError, setFormError] = useState('');
	const [formSuccess, setFormSuccess] = useState(false);
	const [form, setForm] = useState({ name: '', code: '', email: '', role: 'vendedor', specialty: '' });
	const [showManage, setShowManage] = useState(false);
	const [detailId, setDetailId] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		Promise.all([fetchTeam(), fetchAvailability()]).finally(() => {
			if (active) setLoading(false);
		});
		return () => {
			active = false;
		};
	}, [fetchTeam, fetchAvailability]);

	useEffect(() => {
		if (!showManage) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	}, [showManage]);

	const handleStatusChange = async (developerId: string, status: string) => {
		setSavingRows((prev) => ({ ...prev, [developerId]: true }));
		setRowErrors((prev) => ({ ...prev, [developerId]: '' }));
		try {
			await updateAvailability(developerId, status);
			let latest = useTeam
				.getState()
				.availabilities.find((item) => item.developerId === developerId);
			if (!latest) {
				await fetchAvailability();
				latest = useTeam
					.getState()
					.availabilities.find((item) => item.developerId === developerId);
			}
			if (!latest || latest.status !== status) {
				throw new Error('No se pudo guardar la disponibilidad');
			}
		} catch (error) {
			setRowErrors((prev) => ({
				...prev,
				[developerId]:
					error instanceof Error && error.message ? error.message : 'No se pudo guardar',
			}));
			await fetchAvailability();
		} finally {
			setSavingRows((prev) => ({ ...prev, [developerId]: false }));
		}
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setFormError('');
		setFormSuccess(false);
		if (!form.name.trim() || !form.code.trim() || !form.email.trim()) {
			setFormError('Nombre, código y correo son obligatorios');
			return;
		}
		setSubmitting(true);
		try {
			const response = await fetch(apiUrl('/api/team'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: form.name.trim(),
					code: form.code.trim(),
					role: form.role,
					email: form.email.trim(),
					...(form.role === 'desarrollador' && form.specialty.trim()
						? { specialty: form.specialty.trim() }
						: {}),
				}),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok || data.error) {
				throw new Error(data.error || 'No se pudo crear el miembro');
			}
			await fetchTeam();
			setShowForm(false);
			setForm({ name: '', code: '', email: '', role: 'vendedor', specialty: '' });
			setFormSuccess(true);
			window.setTimeout(() => setFormSuccess(false), 3000);
		} catch (error) {
			setFormError(
				error instanceof Error && error.message ? error.message : 'No se pudo crear el miembro'
			);
		} finally {
			setSubmitting(false);
		}
	};

	const [manageBusy, setManageBusy] = useState<Record<string, boolean>>({});
	const [manageErrors, setManageErrors] = useState<Record<string, string>>({});

	const updateMember = async (memberId: string, patch: Record<string, string>) => {
		setManageBusy((prev) => ({ ...prev, [memberId]: true }));
		setManageErrors((prev) => ({ ...prev, [memberId]: '' }));
		try {
			const response = await fetch(apiUrl(`/api/team/${memberId}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(patch),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok || data.error) {
				throw new Error(data.error || 'No se pudo actualizar');
			}
			await fetchTeam();
		} catch (error) {
			setManageErrors((prev) => ({
				...prev,
				[memberId]: error instanceof Error && error.message ? error.message : 'Error al guardar',
			}));
		} finally {
			setManageBusy((prev) => ({ ...prev, [memberId]: false }));
		}
	};

	const resetCredentials = async (memberId: string, memberName: string) => {
		if (
			!window.confirm(
				`¿Restablecer credenciales de ${memberName}? La próxima vez que ingrese tendrá que crear contraseña y PIN nuevos.`
			)
		) {
			return;
		}
		setManageBusy((prev) => ({ ...prev, [memberId]: true }));
		setManageErrors((prev) => ({ ...prev, [memberId]: '' }));
		try {
			const response = await fetch(apiUrl(`/api/team/${memberId}/reset-credentials`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok || data.error) {
				throw new Error(data.error || 'No se pudieron restablecer las credenciales');
			}
			await fetchTeam();
		} catch (error) {
			setManageErrors((prev) => ({
				...prev,
				[memberId]: error instanceof Error && error.message ? error.message : 'Error al guardar',
			}));
		} finally {
			setManageBusy((prev) => ({ ...prev, [memberId]: false }));
		}
	};

	const deleteMember = async (memberId: string, memberName: string) => {
		if (memberId === user?.id) {
			setManageErrors((prev) => ({ ...prev, [memberId]: 'No podés eliminarte a vos mismo' }));
			return;
		}
		if (!window.confirm(`¿Eliminar a ${memberName} del equipo? Esta acción no se puede deshacer.`)) {
			return;
		}
		setManageBusy((prev) => ({ ...prev, [memberId]: true }));
		setManageErrors((prev) => ({ ...prev, [memberId]: '' }));
		try {
			const response = await fetch(apiUrl(`/api/team/${memberId}`), { method: 'DELETE' });
			const data = await response.json().catch(() => ({}));
			if (!response.ok || data.error) {
				throw new Error(data.error || 'No se pudo eliminar el miembro');
			}
			await fetchTeam();
		} catch (error) {
			setManageErrors((prev) => ({
				...prev,
				[memberId]: error instanceof Error && error.message ? error.message : 'Error al eliminar',
			}));
		} finally {
			setManageBusy((prev) => ({ ...prev, [memberId]: false }));
		}
	};

	if (user?.role !== 'super_admin' && user?.role !== 'gerente') {
		return (
			<div className="max-w-7xl mx-auto">
				<Card className={`max-w-lg mx-auto mt-10 p-10 text-center ${CARD_CLASS}`}>
					<div className="w-14 h-14 rounded-full bg-[#0C1E36] border border-[#1C3557] flex items-center justify-center mx-auto mb-4">
						<Lock className="h-6 w-6 text-[#5B7295]" />
					</div>
					<h2 className="font-display text-lg uppercase text-white">Acceso Restringido</h2>
					<p className="text-sm text-[#8FA6C4] mt-1 mb-6">
						Esta sección es solo para gerentes y administradores
					</p>
					<Button variant="secondary" onClick={() => navigate('/dashboard')}>
						Volver al Dashboard
					</Button>
				</Card>
			</div>
		);
	}

	const developers = users.filter((member) => member.role === 'desarrollador');
	const activeMembers = users.filter((member) => member.isActive).length;
	const sellers = users.filter((member) => member.role === 'vendedor').length;

	const stats: { label: string; value: number; icon: LucideIcon; tone: string }[] = [
		{
			label: 'Total miembros',
			value: users.length,
			icon: Users,
			tone: 'text-[#60A5FA] bg-[#1877E8]/10 border-[#1877E8]/25',
		},
		{
			label: 'Activos',
			value: activeMembers,
			icon: UserCheck,
			tone: 'text-[#34D399] bg-[#34D399]/10 border-[#34D399]/25',
		},
		{
			label: 'Desarrolladores',
			value: developers.length,
			icon: Code2,
			tone: 'text-[#A5B4FC] bg-[#6366F1]/10 border-[#6366F1]/25',
		},
		{
			label: 'Vendedores',
			value: sellers,
			icon: BadgeDollarSign,
			tone: 'text-[#FBBF24] bg-[#F59E0B]/10 border-[#F59E0B]/25',
		},
	];

	return (
		<div className="max-w-7xl mx-auto space-y-6">
			<PageHeader
				title="Equipo"
				subtitle="Disponibilidad, miembros y gestión del equipo"
				actions={
					<div className="flex items-center gap-2">
						<Button
							variant="secondary"
							aria-label="Abrir gestión de equipo"
							onClick={() => setShowManage(true)}
						>
							<Settings className="h-4 w-4" />
							Gestionar equipo
						</Button>
						{user?.role === 'super_admin' ? (
							<Button variant="primary" onClick={() => setShowForm(!showForm)}>
								<UserPlus className="h-4 w-4" />
								Agregar nuevo miembro
							</Button>
						) : null}
					</div>
				}
			/>

			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-in">
				{stats.map(({ label, value, icon: StatIcon, tone }) => (
					<div
						key={label}
						className="flex items-center gap-3 bg-[#0C1E36] border border-[#1C3557] rounded-xl px-4 py-3 hover-lift"
					>
						<span
							className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${tone}`}
						>
							<StatIcon className="h-4 w-4" />
						</span>
						<div className="min-w-0">
							<p className="font-display text-xl font-bold text-white leading-none tabular-nums">
								{value}
							</p>
							<p className="text-[10px] uppercase tracking-[0.16em] text-[#8FA6C4] mt-1.5 truncate">
								{label}
							</p>
						</div>
					</div>
				))}
			</div>

			{formSuccess && (
				<div className="flex items-center gap-2 bg-[#059669]/15 border border-[#059669]/40 text-[#34D399] rounded-xl p-3 text-sm font-medium">
					<Check className="h-4 w-4 shrink-0" />
					Miembro creado correctamente
				</div>
			)}

			{showForm && (
				<div className="collapsible-open">
					<Card className={`p-6 ${CARD_CLASS} min-h-0 overflow-hidden`}>
						<div className="flex items-center gap-3 mb-4">
							<span className={SECTION_ICON}>
								<UserPlus className="h-4 w-4" />
							</span>
							<h2 className={SECTION_TITLE_FLAT}>Nuevo miembro</h2>
						</div>
						<form onSubmit={handleSubmit} className="space-y-4">
							{formError && (
								<div className="flex items-center gap-2 bg-[#E11D48]/10 border border-[#E11D48]/30 text-[#FB7185] rounded-xl p-3 text-sm">
									<AlertCircle className="h-4 w-4 shrink-0" />
									{formError}
								</div>
							)}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								<div>
									<label htmlFor="member-name" className={LABEL_CLASS}>
										Nombre
									</label>
									<input
										id="member-name"
										type="text"
										value={form.name}
										onChange={(e) => setForm({ ...form, name: e.target.value })}
										className={INPUT_CLASS}
										placeholder="Nombre completo"
									/>
								</div>
								<div>
									<label htmlFor="member-code" className={LABEL_CLASS}>
										Código
									</label>
									<input
										id="member-code"
										type="text"
										value={form.code}
										onChange={(e) => setForm({ ...form, code: e.target.value })}
										className={INPUT_CLASS}
										placeholder="Ej: VEN006"
									/>
								</div>
								<div>
									<label htmlFor="member-email" className={LABEL_CLASS}>
										Correo
									</label>
									<input
										id="member-email"
										type="email"
										value={form.email}
										onChange={(e) => setForm({ ...form, email: e.target.value })}
										className={INPUT_CLASS}
										placeholder="Ej: vendedor@teknotech.com"
									/>
								</div>
								<div>
									<label htmlFor="member-role" className={LABEL_CLASS}>
										Rol
									</label>
									<select
										id="member-role"
										value={form.role}
										onChange={(e) => setForm({ ...form, role: e.target.value })}
										className={SELECT_CLASS}
									>
										<option value="vendedor">{ROLE_LABELS.vendedor}</option>
										<option value="closer">{ROLE_LABELS.closer}</option>
										<option value="desarrollador">{ROLE_LABELS.desarrollador}</option>
										<option value="gerente">{ROLE_LABELS.gerente}</option>
									</select>
								</div>
								{form.role === 'desarrollador' && (
									<div className="sm:col-span-2 lg:col-span-3">
										<label htmlFor="member-specialty" className={LABEL_CLASS}>
											Especialidad (opcional)
										</label>
										<input
											id="member-specialty"
											type="text"
											value={form.specialty}
											onChange={(e) => setForm({ ...form, specialty: e.target.value })}
											className={INPUT_CLASS}
											placeholder="Ej: Frontend / Backend"
										/>
									</div>
								)}
							</div>
							<div className="flex items-center gap-3">
								<Button type="submit" variant="primary" disabled={submitting}>
									{submitting ? 'GUARDANDO…' : 'AGREGAR MIEMBRO'}
								</Button>
								<Button
									type="button"
									variant="secondary"
									onClick={() => {
										setShowForm(false);
										setFormError('');
									}}
								>
									Cancelar
								</Button>
							</div>
						</form>
					</Card>
				</div>
			)}

			<Card className={`p-6 ${CARD_CLASS}`}>
				<div className="flex items-center gap-3 mb-4">
					<span className={SECTION_ICON}>
						<Code2 className="h-4 w-4" />
					</span>
					<h2 className={SECTION_TITLE_FLAT}>Desarrolladores</h2>
				</div>
				{loading ? (
					<div className="flex justify-center py-10">
						<Spinner />
					</div>
				) : developers.length === 0 ? (
					<EmptyState
						icon={Code2}
						title="Sin desarrolladores"
						description="Cuando agregues desarrolladores aparecerán aquí"
					/>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="text-[10px] uppercase tracking-[0.18em] text-[#5B7295] border-b border-[#1C3557] pb-3">
								<tr>
									<th className="text-left font-medium pb-3 pr-4">DESARROLLADOR</th>
									<th className="text-left font-medium pb-3 pr-4">CÓDIGO</th>
									<th className="text-left font-medium pb-3 pr-4">ROL</th>
									<th className="text-left font-medium pb-3 pr-4">CARGA</th>
									<th className="text-left font-medium pb-3">DISPONIBILIDAD</th>
								</tr>
							</thead>
							<tbody className="stagger-in">
								{developers.map((member) => {
									const availability = availabilities.find(
										(item) => item.developerId === member.id
									);
									const isSaving = !!savingRows[member.id];
									const rowError = rowErrors[member.id];
									const status = availability?.status || 'disponible';
									const RoleIcon = ROLE_ICONS[member.role] || Users;
									return (
										<tr
											key={member.id}
											className="group border-b border-[#16294A] hover:bg-[#14294A] transition-colors"
										>
											<td className="py-3 pr-4 row-shift">
												<div className="flex items-center gap-3">
													<Avatar
														name={member.name}
														avatar={member.avatar}
														className="w-9 h-9 text-[11px] avatar-pop"
													/>
													<span className="font-medium text-white transition-colors group-hover:text-[#60A5FA]">
														{member.name}
													</span>
												</div>
											</td>
											<td className="py-3 pr-4 font-mono text-[#8FA6C4]">{member.code}</td>
											<td className="py-3 pr-4">
												<span
													className={`${ROLE_BADGE_BASE} inline-flex items-center gap-1.5 ${
														ROLE_BADGES[member.role] || 'bg-[#1C3557] text-[#8FA6C4]'
													}`}
												>
													<RoleIcon className="h-3 w-3" />
													{ROLE_LABELS[member.role] || member.role}
												</span>
											</td>
											<td className="py-3 pr-4 text-[#8FA6C4] tabular-nums">
												{availability ? String(availability.activeQuotes) : '—'}
											</td>
											<td className="py-3">
												<div className="flex items-center gap-2">
													<span
														className={`w-2 h-2 rounded-full shrink-0 ${AVAILABILITY_DOT[status]}`}
													/>
													<select
														value={status}
														onChange={(e) => handleStatusChange(member.id, e.target.value)}
														disabled={isSaving}
														aria-label={`Disponibilidad de ${member.name}`}
														className={`${SELECT_CLASS} disabled:opacity-60`}
													>
														<option value="disponible">
															{AVAILABILITY_LABELS.disponible}
														</option>
														<option value="ocupado">{AVAILABILITY_LABELS.ocupado}</option>
														<option value="no_disponible">
															{AVAILABILITY_LABELS.no_disponible}
														</option>
													</select>
												</div>
												{isSaving && (
													<p className="text-xs text-[#8FA6C4] mt-1">Guardando…</p>
												)}
												{!isSaving && rowError && (
													<p className="text-xs text-[#FB7185] mt-1">{rowError}</p>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</Card>

			<Card className={`p-6 ${CARD_CLASS}`}>
				<div className="flex items-center gap-3 mb-4">
					<span className={SECTION_ICON}>
						<Users className="h-4 w-4" />
					</span>
					<h2 className={SECTION_TITLE_FLAT}>Miembros del equipo</h2>
				</div>
				{loading ? (
					<div className="flex justify-center py-10">
						<Spinner />
					</div>
				) : users.length === 0 ? (
					<EmptyState
						icon={Users}
						title="Sin miembros"
						description="Aún no hay miembros registrados"
					/>
				) : (
					<div className="stagger-in grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
						{users.map((member) => {
							const RoleIcon = ROLE_ICONS[member.role] || Users;
							return (
								<button
									key={member.id}
									type="button"
									onClick={() => setDetailId(member.id)}
									aria-label={`Ver ficha de ${member.name}`}
									className="group flex items-center gap-3.5 bg-[#0C1E36] border border-[#16294A] rounded-2xl p-4 hover-lift hover:border-[#1877E8]/50 hover:bg-[#14294A] transition-all text-left cursor-pointer w-full"
								>
									<span className="relative shrink-0">
										<Avatar
											name={member.name}
											avatar={member.avatar}
											className="w-11 h-11 text-xs avatar-pop"
										/>
										<span
											className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0C1E36] ${
												member.isActive ? 'bg-[#34D399]' : 'bg-[#E11D48]'
											}`}
										/>
									</span>
									<div className="min-w-0 flex-1">
										<p className="text-sm font-semibold text-white truncate transition-colors group-hover:text-[#60A5FA]">
											{member.name}
										</p>
										<div className="flex items-center gap-2 mt-1.5 min-w-0">
											<span
												className={`${ROLE_BADGE_BASE} inline-flex items-center gap-1 shrink-0 ${
													ROLE_BADGES[member.role] || 'bg-[#1C3557] text-[#8FA6C4]'
												}`}
											>
												<RoleIcon className="h-3 w-3" />
												{ROLE_LABELS[member.role] || member.role}
											</span>
											<span className="font-mono text-[11px] text-[#5B7295] truncate">
												{member.code}
											</span>
										</div>
									</div>
									<span
										className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full shrink-0 ${
											member.isActive
												? 'bg-[#34D399]/10 text-[#34D399]'
												: 'bg-[#E11D48]/10 text-[#FB7185]'
										}`}
									>
										<span
											className={`w-1.5 h-1.5 rounded-full ${
												member.isActive ? 'bg-[#34D399]' : 'bg-[#E11D48]'
											}`}
										/>
										{member.isActive ? 'Activo' : 'Inactivo'}
									</span>
								</button>
							);
						})}
					</div>
				)}
			</Card>

			{showManage ? createPortal(
				<div
					className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8 animate-fade-in"
					onClick={() => setShowManage(false)}
				>
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="manage-team-title"
						className="bg-[#10233E] border border-[#1C3557] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-[0_25px_80px_-20px_rgba(0,0,0,0.9)] animate-scale-in"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="shrink-0 flex items-start justify-between gap-4 px-6 pt-6 mb-5 pb-4 border-b border-[#16294A]">
							<div className="flex items-center gap-3 min-w-0">
								<span className={SECTION_ICON}>
									<Settings className="h-5 w-5" />
								</span>
								<div className="min-w-0">
									<h2 id="manage-team-title" className={SECTION_TITLE + ' mb-1'}>
										Gestionar equipo
									</h2>
									<p className="text-xs text-[#5B7295]">
										Cambiá el sector de cada miembro o restablecé sus credenciales
									</p>
								</div>
							</div>
							{user?.role === 'super_admin' ? (
								<Button
									variant="secondary"
									size="sm"
									className="shrink-0"
									onClick={() => {
										setShowManage(false);
										setShowForm(true);
									}}
								>
									<UserPlus className="h-3.5 w-3.5" />
									Agregar miembro
								</Button>
							) : null}
						</div>
						<div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto px-6 pb-1 scroll-thin">
							{loading ? (
								<div className="flex justify-center py-10">
									<Spinner />
								</div>
							) : users.length === 0 ? (
								<EmptyState
									icon={Users}
									title="Sin miembros"
									description="Aún no hay miembros registrados"
								/>
							) : (
								<table className="w-full text-sm">
									<thead className="text-[10px] uppercase tracking-[0.18em] text-[#5B7295] border-b border-[#1C3557] pb-3 sticky top-0 bg-[#10233E] z-10">
										<tr>
											<th className="text-left font-medium pb-3 pr-4">MIEMBRO</th>
											<th className="text-left font-medium pb-3 pr-4">CÓDIGO</th>
											<th className="text-left font-medium pb-3 pr-4">SECTOR</th>
											<th className="text-left font-medium pb-3">ACCIONES</th>
										</tr>
									</thead>
									<tbody className="stagger-in">
										{users.map((member) => {
											const isSaving = !!manageBusy[member.id];
											const rowError = manageErrors[member.id];
											return (
												<tr
													key={member.id}
													className="group border-b border-[#16294A] hover:bg-[#14294A] transition-colors"
												>
													<td className="py-3 pr-4 row-shift">
														<div className="flex items-center gap-3">
															<Avatar
																name={member.name}
																avatar={member.avatar}
																className="w-9 h-9 text-[11px] avatar-pop"
															/>
															<div className="min-w-0">
																<button
																	type="button"
																	onClick={() => setDetailId(member.id)}
																	className="font-medium text-white truncate hover:text-[#60A5FA] hover:underline underline-offset-2 transition-colors text-left"
																	aria-label={`Ver ficha de ${member.name}`}
																>
																	{member.name}
																</button>
																{member.email ? (
																	<p className="text-xs text-[#5B7295] truncate">{member.email}</p>
																) : null}
															</div>
														</div>
													</td>
													<td className="py-3 pr-4 font-mono text-[#8FA6C4]">{member.code}</td>
													<td className="py-3 pr-4">
														<select
															value={member.role}
															onChange={(e) => updateMember(member.id, { role: e.target.value })}
															disabled={isSaving}
															aria-label={`Sector de ${member.name}`}
															className="bg-[#0C1E36] border border-[#1C3557] text-[#D6E2F2] rounded-lg px-3 py-2 text-sm focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none disabled:opacity-60"
														>
															<option value="vendedor">{ROLE_LABELS.vendedor}</option>
															<option value="closer">{ROLE_LABELS.closer}</option>
															<option value="desarrollador">{ROLE_LABELS.desarrollador}</option>
															<option value="gerente">{ROLE_LABELS.gerente}</option>
															<option value="super_admin">{ROLE_LABELS.super_admin}</option>
														</select>
														{isSaving && <p className="text-xs text-[#8FA6C4] mt-1">Guardando…</p>}
														{!isSaving && rowError && (
															<p className="text-xs text-[#FB7185] mt-1">{rowError}</p>
														)}
													</td>
													<td className="py-3">
														<div className="flex items-center gap-2">
															<Button
																variant="secondary"
																size="sm"
																disabled={isSaving}
																title="Restablecer acceso"
																onClick={() => resetCredentials(member.id, member.name)}
															>
																<RotateCcw className="h-3.5 w-3.5" />
																Restablecer acceso
															</Button>
															<Button
																variant="danger"
																size="sm"
																disabled={isSaving}
																aria-label={`Eliminar a ${member.name}`}
																title="Eliminar"
																onClick={() => deleteMember(member.id, member.name)}
															>
																<Trash2 className="h-3.5 w-3.5" />
																Eliminar
															</Button>
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							)}
						</div>
						<div className="shrink-0 mt-auto px-6 py-4 bg-[#10233E] border-t border-[#16294A] flex items-center justify-between gap-3">
							<p className="text-[11px] uppercase tracking-[0.16em] text-[#5B7295]">
								{users.length} {users.length === 1 ? 'miembro' : 'miembros'} en el equipo
							</p>
							<Button variant="ghost" size="sm" onClick={() => setShowManage(false)}>
								Cerrar
							</Button>
						</div>
					</div>
				</div>,
			document.body
			) : null}

			{detailId ? <PersonModal memberId={detailId} onClose={() => setDetailId(null)} /> : null}
		</div>
	);
};

export default TeamManager;
