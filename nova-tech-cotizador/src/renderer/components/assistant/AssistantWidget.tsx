import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useAssistant } from '@/renderer/store/assistant';
import { useAuth } from '@/renderer/store/auth';
import { apiUrl } from '@/renderer/api';
import novaAvatar from '@/renderer/assets/nova-ia.png';
import AssistantPanel from './AssistantPanel';

const FAB = 92;

const defaultPos = () => ({
	left: Math.max(8, window.innerWidth - FAB - 28),
	top: Math.max(8, window.innerHeight - FAB - 96),
});

const clampPos = (left: number, top: number, w: number, h: number) => ({
	left: Math.min(Math.max(8, left), Math.max(8, w - FAB - 8)),
	top: Math.min(Math.max(8, top), Math.max(8, h - FAB - 8)),
});

const AssistantWidget: React.FC = () => {
	const [cfg, setCfg] = useState<{ enabled: boolean; name: string } | null>(null);
	const { isAuthenticated } = useAuth();
	const { open, setOpen, status, pos, setPos } = useAssistant();

	const [p, setP] = useState(() => {
		const start = pos ?? defaultPos();
		return clampPos(start.left, start.top, window.innerWidth, window.innerHeight);
	});
	const [win, setWin] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
	const [dragging, setDragging] = useState(false);
	const [imgFail, setImgFail] = useState(false);
	const [hop, setHop] = useState(false);
	const [showGreet, setShowGreet] = useState(() => {
		try {
			return !localStorage.getItem('nova_assistant_greeted');
		} catch {
			return false;
		}
	});

	const isDownRef = useRef(false);
	const justDraggedRef = useRef(false);
	const dragRef = useRef({ startX: 0, startY: 0, startLeft: 0, startTop: 0, moved: false });
	const prevStatusRef = useRef(status);

	/* settings gate: widget only renders when the server allows the assistant */
	useEffect(() => {
		let alive = true;
		let retried = false;
		let retryTimer: number | undefined;

		const load = async () => {
			try {
				const response = await fetch(apiUrl('/api/settings/public'));
				if (!response.ok) {
					throw new Error(`settings request failed: HTTP ${response.status}`);
				}
				const data = await response.json();
				if (!alive) return;
				setCfg({
					enabled: data.aiEnabled !== false,
					name:
						typeof data.aiName === 'string' && data.aiName.trim()
							? data.aiName
							: 'Nova IA',
				});
			} catch {
				if (!alive) return;
				/* safe fallback: better to show the widget (it degrades gracefully)
				   than to hide the feature on a transient error */
				setCfg({ enabled: true, name: 'Nova IA' });
				/* one retry after 10s, only when the fetch itself failed */
				if (!retried) {
					retried = true;
					retryTimer = window.setTimeout(() => {
						if (alive) void load();
					}, 10000);
				}
			}
		};

		void load();
		return () => {
			alive = false;
			if (retryTimer !== undefined) window.clearTimeout(retryTimer);
		};
	}, []);

	/* keep the FAB clamped inside the viewport on resize */
	useEffect(() => {
		const onResize = () => setWin({ w: window.innerWidth, h: window.innerHeight });
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	/* short hop for 600ms right after the assistant stops thinking */
	useEffect(() => {
		const prev = prevStatusRef.current;
		prevStatusRef.current = status;
		if (prev === 'thinking' && status === 'idle') {
			setHop(true);
			const timer = window.setTimeout(() => setHop(false), 600);
			return () => window.clearTimeout(timer);
		}
	}, [status]);

	/* auto-dismiss the greeting the first time the panel opens */
	useEffect(() => {
		if (open) setShowGreet(false);
	}, [open]);

	const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		justDraggedRef.current = false;
		isDownRef.current = true;
		dragRef.current = {
			startX: e.clientX,
			startY: e.clientY,
			startLeft: p.left,
			startTop: p.top,
			moved: false,
		};
		try {
			e.currentTarget.setPointerCapture(e.pointerId);
		} catch {
			/* pointer capture no disponible */
		}
	};

	const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!isDownRef.current) return;
		const d = dragRef.current;
		const dx = e.clientX - d.startX;
		const dy = e.clientY - d.startY;
		if (!d.moved) {
			if (Math.abs(dx) <= 4 && Math.abs(dy) <= 4) return;
			d.moved = true;
			setDragging(true);
		}
		setP(clampPos(d.startLeft + dx, d.startTop + dy, win.w, win.h));
	};

	const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!isDownRef.current) return;
		isDownRef.current = false;
		try {
			e.currentTarget.releasePointerCapture(e.pointerId);
		} catch {
			/* ya liberado */
		}
		const d = dragRef.current;
		if (d.moved) {
			const final = clampPos(
				d.startLeft + (e.clientX - d.startX),
				d.startTop + (e.clientY - d.startY),
				win.w,
				win.h
			);
			setP(final);
			setPos(final);
		} else {
			setOpen(!open);
		}
		/* swallow the synthetic click that follows a tap or drag */
		justDraggedRef.current = true;
		setDragging(false);
	};

	const onPointerCancel = () => {
		if (!isDownRef.current) return;
		isDownRef.current = false;
		setDragging(false);
	};

	const onFabClick = () => {
		if (justDraggedRef.current) return;
		setOpen(!open);
	};

	const dismissGreet = () => {
		try {
			localStorage.setItem('nova_assistant_greeted', '1');
		} catch {
			/* localStorage no disponible */
		}
		setShowGreet(false);
	};

	const stopBubble = (e: React.PointerEvent | React.MouseEvent) => {
		e.stopPropagation();
	};

	if (!isAuthenticated) return null;
	if (cfg === null) return null;
	if (!cfg.enabled) return null;

	const clamped = clampPos(p.left, p.top, win.w, win.h);
	const hopClass = hop ? 'mascot-hop' : 'mascot-idle';
	const animClass = status === 'thinking' ? 'mascot-thinking' : hopClass;

	return (
		<>
			<div
				id="nova-fab"
				data-testid="nova-fab"
				className={`fixed z-[60] select-none ${dragging ? 'mascot-dragging' : ''}`}
				style={{
					left: clamped.left,
					top: clamped.top,
					width: FAB,
					height: FAB,
					touchAction: 'none',
				}}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerCancel}
				role="button"
				aria-label={`Abrir asistente ${cfg.name}`}
				title={`${cfg.name} — arrastrá para mover`}
				onClick={onFabClick}
			>
				<div className="w-full h-full rounded-full border-2 border-[#1877E8]/50 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.85)] overflow-hidden bg-[#0A182E]">
					<div className={`w-full h-full ${animClass}`}>
						{imgFail ? (
							<div className="w-full h-full flex items-center justify-center text-[#1877E8]">
								<MessageCircle size={40} />
							</div>
						) : (
							<img
								src={novaAvatar}
								alt=""
								draggable={false}
								onError={() => setImgFail(true)}
								className="w-full h-full object-contain rounded-full pointer-events-none"
							/>
						)}
					</div>
				</div>
				{showGreet && !open && (
					<div
						id="nova-bubble"
						className="absolute bottom-full right-0 mb-3 w-52 rounded-2xl border border-[#1C3557] bg-[#0C1E36] px-3.5 py-3 pr-8 text-xs leading-relaxed text-[#E6EDF7] shadow-[0_18px_50px_-12px_rgba(0,0,0,0.85)] animate-scale-in"
						onPointerDown={stopBubble}
						onClick={stopBubble}
					>
						<button
							type="button"
							aria-label="Cerrar saludo"
							className="absolute top-1.5 right-1.5 rounded-full p-1 text-[#8FA6C4] hover:text-white hover:bg-[#1C3557] transition-colors"
							onClick={dismissGreet}
						>
							<X size={13} />
						</button>
						¡Hola! Soy {cfg.name} 🐾 Tocame para ayudarte.
					</div>
				)}
			</div>
			{open && <AssistantPanel />}
		</>
	);
};

export default AssistantWidget;
