import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText, Clock, CheckCheck, CircleDollarSign, TrendingUp, ListTodo, Trash2 } from 'lucide-react';
import { useAuth } from '@/renderer/store/auth';
import { useQuotes } from '@/renderer/store/quotes';
import { apiUrl } from '@/renderer/api';
import type { Quote } from '@/shared/types';
import { formatCurrency } from '@/shared/validators';
import { Button, Card, EmptyState, Spinner, StatCard } from '@/renderer/components/ui';
import StatusBadge from '@/renderer/components/StatusBadge';

const MONTH_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const BAR_COLOR = '#1877E8';

interface Task {
	id: string;
	title: string;
	done: boolean;
}

const monthKeyOf = (dateStr: string): string => {
	const d = new Date(dateStr);
	return `${d.getFullYear()}-${d.getMonth()}`;
};

const isPending = (q: Quote): boolean => q.status === 'borrador' || q.status === 'enviada';
const isAccepted = (q: Quote): boolean => q.status === 'aceptada' || q.status === 'pagada';

const trendOf = (current: number, previous: number, fmt: (v: number) => string = (v) => String(v)): string =>
	previous > 0
		? `${Math.round(((current - previous) / previous) * 100)}% vs. mes anterior`
		: current > 0
			? `${fmt(current)} vs. mes anterior`
			: 'sin cambios vs. mes anterior';

const niceMaxOf = (max: number): number => {
	if (max <= 0) return 1;
	const base = Math.pow(10, Math.floor(Math.log10(max)));
	return [1, 2, 2.5, 5, 10].map((m) => m * base).find((c) => c >= max) ?? 10 * base;
};

const formatTickValue = (v: number): string => {
	const value = Math.round(v * 100) / 100;
	if (value >= 1000) return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
	return `$${value}`;
};

const Dashboard: React.FC = () => {
	const { user } = useAuth();
	const { quotes, fetchMyQuotes } = useQuotes();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [range, setRange] = useState(6);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [taskInput, setTaskInput] = useState('');
	const [tasksLoading, setTasksLoading] = useState(true);

	useEffect(() => {
		let active = true;
		fetch(apiUrl('/api/tasks'))
			.then((r) => r.json())
			.then((data) => {
				if (active && Array.isArray(data)) setTasks(data);
			})
			.catch(() => undefined)
			.finally(() => {
				if (active) setTasksLoading(false);
			});
		return () => {
			active = false;
		};
	}, []);

	const addTask = async (e: React.FormEvent) => {
		e.preventDefault();
		const title = taskInput.trim();
		if (!title) return;
		setTaskInput('');
		try {
			const r = await fetch(apiUrl('/api/tasks'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title }),
			});
			const data = await r.json();
			if (data?.task) setTasks((prev) => [data.task, ...prev]);
			else setTaskInput(title);
		} catch {
			setTaskInput(title);
		}
	};

	const toggleTask = async (task: Task) => {
		const done = !task.done;
		setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done } : t)));
		try {
			await fetch(apiUrl(`/api/tasks/${task.id}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ done }),
			});
		} catch {
			setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !done } : t)));
		}
	};

	const deleteTask = async (task: Task) => {
		setTasks((prev) => prev.filter((t) => t.id !== task.id));
		try {
			await fetch(apiUrl(`/api/tasks/${task.id}`), { method: 'DELETE' });
		} catch {
			setTasks((prev) => [task, ...prev]);
		}
	};

	useEffect(() => {
		let active = true;
		fetchMyQuotes().finally(() => {
			if (active) setLoading(false);
		});
		return () => {
			active = false;
		};
	}, []);

	const today = new Date();
	const currentMonthKey = `${today.getFullYear()}-${today.getMonth()}`;
	const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
	const prevMonthKey = `${prevDate.getFullYear()}-${prevDate.getMonth()}`;

	const pendingCount = quotes.filter(isPending).length;
	const acceptedCount = quotes.filter(isAccepted).length;
	const totalCotizado = quotes.reduce((acc, q) => acc + q.finalPrice, 0);

	const createdThisMonth = quotes.filter((q) => monthKeyOf(q.createdAt) === currentMonthKey).length;
	const createdPrevMonth = quotes.filter((q) => monthKeyOf(q.createdAt) === prevMonthKey).length;
	const pendingThisMonth = quotes.filter((q) => isPending(q) && monthKeyOf(q.createdAt) === currentMonthKey).length;
	const pendingPrevMonth = quotes.filter((q) => isPending(q) && monthKeyOf(q.createdAt) === prevMonthKey).length;
	const acceptedThisMonth = quotes.filter((q) => isAccepted(q) && monthKeyOf(q.createdAt) === currentMonthKey).length;
	const acceptedPrevMonth = quotes.filter((q) => isAccepted(q) && monthKeyOf(q.createdAt) === prevMonthKey).length;
	const totalThisMonth = quotes
		.filter((q) => monthKeyOf(q.createdAt) === currentMonthKey)
		.reduce((acc, q) => acc + q.finalPrice, 0);
	const totalPrevMonth = quotes
		.filter((q) => monthKeyOf(q.createdAt) === prevMonthKey)
		.reduce((acc, q) => acc + q.finalPrice, 0);

	const recentQuotes = [...quotes]
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
		.slice(0, 5);

	const salesByMonth = useMemo(() => {
		const buckets: { key: string; label: string; total: number }[] = [];
		for (let i = range - 1; i >= 0; i--) {
			const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
			buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_SHORT[d.getMonth()], total: 0 });
		}
		quotes.forEach((q) => {
			const bucket = buckets.find((b) => b.key === monthKeyOf(q.createdAt));
			if (bucket) bucket.total += q.finalPrice;
		});
		return buckets;
	}, [quotes, range]);

	const maxTotal = salesByMonth.reduce((max, b) => Math.max(max, b.total), 0);
	const baselineY = 330;
	const chartTopY = 24;
	const niceMax = niceMaxOf(maxTotal);
	const ticks = [0, 1, 2, 3, 4].map((i) => (niceMax / 4) * i);
	const tickY = (value: number) => baselineY - (value / niceMax) * (baselineY - chartTopY);
	const slotWidth = 544 / salesByMonth.length;

	return (
		<div className="max-w-7xl mx-auto">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
				<div>
					<h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white">
						CÓMO ANDAS {user?.name ? user.name.split(' ')[0].toUpperCase() : ''}
					</h1>
					<p className="text-xs uppercase tracking-[0.25em] text-[#8FA6C4] mt-2">
						¡AHÍ TE VA UN RESUMEN DE TU ACTIVIDAD!
					</p>
				</div>
				{user?.role !== 'desarrollador' ? (
					<Button variant="primary" onClick={() => navigate('/nueva-cotizacion')}>
						<Plus className="w-4 h-4" />
						NUEVA COTIZACIÓN
					</Button>
				) : null}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
				<StatCard
					label="Cotizaciones Realizadas"
					value={String(quotes.length)}
					icon={FileText}
					tone="blue"
					trend={trendOf(createdThisMonth, createdPrevMonth)}
				/>
				<StatCard
					label="Pendientes"
					value={String(pendingCount)}
					icon={Clock}
					tone="green"
					trend={trendOf(pendingThisMonth, pendingPrevMonth)}
				/>
				<StatCard
					label="Aceptadas"
					value={String(acceptedCount)}
					icon={CheckCheck}
					tone="purple"
					trend={trendOf(acceptedThisMonth, acceptedPrevMonth)}
				/>
				<StatCard
					label="Total Cotizado"
					value={formatCurrency(totalCotizado)}
					icon={CircleDollarSign}
					tone="red"
					trend={trendOf(totalThisMonth, totalPrevMonth, formatCurrency)}
				/>
			</div>

			<Card className="p-6 mb-6">
				<div className="flex items-center justify-between mb-4 gap-3">
					<h2 className="font-display text-sm uppercase tracking-[0.15em] text-white flex items-center gap-2">
						<ListTodo className="w-4 h-4 text-[#1877E8]" />
						TAREAS PENDIENTES
						{tasks.filter((t) => !t.done).length > 0 ? (
							<span className="text-[10px] bg-[#1877E8]/15 border border-[#1877E8]/30 text-[#60A5FA] rounded-full px-2 py-0.5 tracking-widest normal-case">
								{tasks.filter((t) => !t.done).length} pendientes
							</span>
						) : null}
					</h2>
				</div>
				<form onSubmit={addTask} className="flex gap-2 mb-4">
					<input
						type="text"
						value={taskInput}
						onChange={(e) => setTaskInput(e.target.value)}
						placeholder="Anotá una tarea..."
						aria-label="Nueva tarea"
						className="flex-1 bg-[#0C1E36] border border-[#1C3557] text-white placeholder-[#5B7295] focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none rounded-xl px-4 py-2.5 text-sm"
					/>
					<Button variant="primary" type="submit">
						<Plus className="w-4 h-4" />
						Agregar
					</Button>
				</form>
				{tasksLoading ? (
					<div className="flex justify-center py-6">
						<Spinner />
					</div>
				) : tasks.length === 0 ? (
					<p className="text-sm text-[#5B7295]">Sin tareas pendientes. Agregá la primera arriba.</p>
				) : (
					<ul className="stagger-in space-y-1 max-h-64 overflow-y-auto dashboard-table-scroll">
						{tasks.map((task) => (
							<li
								key={task.id}
								className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-[#14294A] group transition-colors"
							>
								<input
									type="checkbox"
									checked={task.done}
									onChange={() => toggleTask(task)}
									aria-label={`Marcar tarea ${task.title}`}
									className="w-4 h-4 accent-[#1877E8] cursor-pointer shrink-0"
								/>
								<span
									className={`flex-1 text-sm min-w-0 truncate transition-all duration-200 ${
										task.done
											? 'line-through decoration-[#5B7295] text-[#5B7295]'
											: 'decoration-transparent text-[#D6E2F2]'
									}`}
								>
									{task.title}
								</span>
								<button
									type="button"
									onClick={() => deleteTask(task)}
									aria-label={`Eliminar tarea ${task.title}`}
									className="text-[#5B7295] hover:text-[#FB7185] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</li>
						))}
					</ul>
				)}
			</Card>

			<div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
			<Card className="p-6 xl:col-span-2">
					<div className="flex items-center justify-between mb-4 gap-3">
						<h2 className="font-display text-sm uppercase tracking-[0.15em] text-white whitespace-nowrap">
							COTIZACIONES RECIENTES
						</h2>
						<Link
							to="/historial"
							className="text-[#1877E8] text-xs uppercase tracking-widest font-semibold hover:text-[#60A5FA] whitespace-nowrap shrink-0"
						>
							VER TODAS →
						</Link>
					</div>
					{loading ? (
						<div className="flex justify-center py-12">
							<Spinner />
						</div>
					) : recentQuotes.length === 0 ? (
						<EmptyState
							icon={FileText}
							title="Aún no hay cotizaciones"
							description="Crea tu primera cotización para verla aquí"
							action={
								user?.role !== 'desarrollador' ? (
									<Button variant="primary" onClick={() => navigate('/nueva-cotizacion')}>
										<Plus className="w-4 h-4" />
										NUEVA COTIZACIÓN
									</Button>
								) : undefined
							}
						/>
					) : (
						<div className="max-h-[420px] overflow-y-auto overflow-x-hidden dashboard-table-scroll -mx-2 px-2">
							<table className="w-full table-fixed">
								<thead className="text-[10px] uppercase tracking-[0.18em] text-[#5B7295] text-left sticky top-0 bg-[#10233E] z-10">
									<tr>
										<th className="pb-3 border-b border-[#1C3557] w-9">N°</th>
										<th className="pb-3 border-b border-[#1C3557] pr-2">CLIENTE</th>
										<th className="pb-3 border-b border-[#1C3557] w-20 text-right">TOTAL</th>
										<th className="pb-3 border-b border-[#1C3557] w-28 pl-3">ESTADO</th>
									</tr>
								</thead>
								<tbody className="stagger-in">
									{recentQuotes.map((quote, idx) => (
										<tr
											key={quote.id}
											onClick={() => navigate(`/cotizacion/${quote.id}`, { state: { from: '/dashboard' } })}
											className="border-b border-[#16294A] text-sm text-[#D6E2F2] hover:bg-[#14294A] transition-colors cursor-pointer"
										>
											<td className="py-4 w-9">#{String(idx + 1).padStart(3, '0')}</td>
											<td className="py-4 pr-2 min-w-0">
												<p className="truncate">{quote.clientName}</p>
												<p className="text-[11px] text-[#5B7295] truncate">
													{new Date(quote.createdAt).toLocaleDateString('es-ES')}
												</p>
											</td>
											<td className="py-4 w-20 text-right font-medium text-white">
												{formatCurrency(quote.finalPrice)}
											</td>
											<td className="py-4 w-28 pl-3">
												<StatusBadge status={quote.status} />
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</Card>

			<Card className="p-6 xl:col-span-3">
				<div className="flex items-center justify-between mb-4 gap-3">
					<h2 className="font-display text-sm uppercase tracking-[0.15em] text-white">
						VENTAS POR MES
					</h2>
						<select
							value={range}
							onChange={(e) => setRange(Number(e.target.value))}
							className="bg-[#0C1E36] border border-[#1C3557] text-[#8FA6C4] text-[11px] uppercase tracking-widest rounded-lg px-2 py-1 focus:outline-none"
						>
							<option value={6}>ÚLTIMOS 6 MESES</option>
							<option value={12}>ÚLTIMOS 12 MESES</option>
						</select>
					</div>
					{loading ? (
						<div className="flex justify-center py-12">
							<Spinner />
						</div>
					) : maxTotal <= 0 ? (
						<EmptyState
							icon={TrendingUp}
							title="Sin ventas en el periodo"
							description={`No hay cotizaciones en los últimos ${range} meses`}
						/>
					) : (
					<svg viewBox="0 0 600 400" className="w-full h-[400px]">
						<line x1="12" y1={baselineY} x2="588" y2={baselineY} stroke="#1C3557" strokeWidth="1" />
						{ticks
							.filter((tick) => tick > 0)
							.map((tick) => (
								<g key={tick}>
									<line
										x1={44}
										y1={tickY(tick)}
										x2={588}
										y2={tickY(tick)}
										stroke="#16294A"
										strokeDasharray="3 4"
									/>
									<text x={36} y={tickY(tick) + 5} textAnchor="end" fill="#5B7295" fontSize={15}>
										{formatTickValue(tick)}
									</text>
								</g>
							))}
						{salesByMonth.map((bucket, i) => {
							const barWidth = Math.min(slotWidth * 0.55, 72);
							const x = 44 + i * slotWidth + (slotWidth - barWidth) / 2;
							const height = niceMax > 0 ? (bucket.total / niceMax) * (baselineY - chartTopY) : 0;
							return (
									<g key={bucket.key}>
										<rect
											x={x}
											y={baselineY - height}
											width={barWidth}
											height={height}
											rx="4"
											fill={BAR_COLOR}
											fillOpacity={0.85}
											style={{
												transformBox: 'fill-box',
												transformOrigin: 'bottom',
												animation: 'barGrow .6s cubic-bezier(.22,1,.36,1) both',
												animationDelay: `${i * 70}ms`,
											}}
										/>
										<text
											x={x + barWidth / 2}
											y="382"
											textAnchor="middle"
											fill="#5B7295"
											fontSize={15}
										>
											{bucket.label}
										</text>
									</g>
								);
							})}
						</svg>
					)}
				</Card>
			</div>
		</div>
	);
};

export default Dashboard;
