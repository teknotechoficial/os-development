import React, { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Bell, CheckCircle2, Inbox, UserPlus, XCircle } from 'lucide-react';
import { useAuth } from '@/renderer/store/auth';
import { apiUrl } from '@/renderer/api';
import type { Notification } from '@/shared/types';
import { Card, EmptyState, PageHeader, Spinner } from '@/renderer/components/ui';

interface NotificationStyle {
	icon: LucideIcon;
	iconClass: string;
}

const NOTIFICATION_STYLES: Record<string, NotificationStyle> = {
	quote_delegated: { icon: UserPlus, iconClass: 'bg-[#1877E8]/15 text-[#60A5FA]' },
	quote_reassigned: { icon: UserPlus, iconClass: 'bg-[#1877E8]/15 text-[#60A5FA]' },
	quote_accepted: { icon: CheckCircle2, iconClass: 'bg-[#22C55E]/15 text-[#34D399]' },
	quote_rejected: { icon: XCircle, iconClass: 'bg-[#E11D48]/15 text-[#FB7185]' },
};

const DEFAULT_STYLE: NotificationStyle = { icon: Bell, iconClass: 'bg-[#1C3557] text-[#8FA6C4]' };

function timeAgo(dateStr: string): string {
	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) return '';
	const diff = Date.now() - date.getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return 'hace un momento';
	if (minutes < 60) return `hace ${minutes} min`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `hace ${hours} h`;
	const days = Math.floor(hours / 24);
	if (days === 1) return 'ayer';
	if (days < 7) return `hace ${days} días`;
	return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

const Notifications: React.FC = () => {
	const { user } = useAuth();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!user) {
			setLoading(false);
			return;
		}
		let active = true;
		fetch(apiUrl(`/api/notifications?userId=${user.id}`))
			.then((res) => (res.ok ? res.json() : []))
			.then((data) => {
				if (active && Array.isArray(data)) setNotifications(data);
			})
			.catch(() => undefined)
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, [user]);

	const unreadCount = notifications.filter((notification) => !notification.read).length;

	const markRead = async (notification: Notification) => {
		if (notification.read) return;
		setNotifications((prev) =>
			prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
		);
		try {
			const response = await fetch(apiUrl(`/api/notifications/${notification.id}/read`), {
				method: 'PUT',
			});
			if (!response.ok) throw new Error();
		} catch {
			setNotifications((prev) =>
				prev.map((item) => (item.id === notification.id ? { ...item, read: false } : item))
			);
		}
	};

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<PageHeader
				title="Notificaciones"
				subtitle={`${unreadCount} sin leer`}
				actions={
					<span className="inline-flex items-center gap-2 rounded-full bg-[#1877E8]/10 border border-[#1877E8]/40 px-3 py-1 text-[11px] uppercase tracking-widest text-[#60A5FA]">
						<span className="w-2 h-2 rounded-full bg-[#1877E8]" />
						{unreadCount} sin leídas
					</span>
				}
			/>

			<Card className="overflow-hidden bg-[#10233E] border border-[#1C3557] rounded-2xl">
				{loading ? (
					<div className="flex justify-center py-12">
						<Spinner />
					</div>
				) : notifications.length === 0 ? (
					<EmptyState
						icon={Inbox}
						title="Sin notificaciones"
						description="Te avisaremos cuando haya novedades"
					/>
				) : (
					<div className="stagger-in divide-y divide-[#16294A]">
						{notifications.map((notification) => {
							const style = NOTIFICATION_STYLES[notification.type] || DEFAULT_STYLE;
							const Icon = style.icon;
							return (
								<div
									key={notification.id}
									onClick={() => markRead(notification)}
									className={`flex items-start gap-3 px-5 py-4 cursor-pointer border-l-[3px] transition-colors ${
										notification.read
											? 'bg-[#0C1E36] border-transparent hover:bg-[#14294A]'
											: 'bg-[#1877E8]/10 border-[#1877E8] hover:bg-[#1877E8]/15'
									}`}
								>
									<span
										className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style.iconClass}`}
									>
										<Icon className="h-4 w-4" />
									</span>
									<div className="min-w-0 flex-1">
										<p
											className={`text-sm ${
												notification.read ? 'text-[#D6E2F2]' : 'font-semibold text-white'
											}`}
										>
											{notification.title}
										</p>
										<p className="text-sm text-[#D6E2F2] mt-0.5">{notification.message}</p>
										<p className="text-[11px] uppercase tracking-widest text-[#5B7295] mt-1">
											{timeAgo(notification.createdAt)}
										</p>
									</div>
									{!notification.read && (
										<span className="w-2 h-2 rounded-full bg-[#1877E8] shrink-0 mt-2" />
									)}
								</div>
							);
						})}
					</div>
				)}
			</Card>
		</div>
	);
};

export default Notifications;
