import React, { useEffect, useRef, useState } from 'react';
import { Send, Trash2, X } from 'lucide-react';
import { useAssistant } from '@/renderer/store/assistant';
import { apiUrl } from '@/renderer/api';
import novaAvatar from '@/renderer/assets/nova-ia.png';

const SUGGESTIONS: string[] = [
	'¿Cómo creo una cotización?',
	'¿Dónde veo los reportes?',
	'¿Qué puedo hacer en el sistema?',
];

const HEADER_ACTION_CLASS =
	'p-2 rounded-xl text-[#8FA6C4] hover:bg-[#14294A] hover:text-white transition-colors';

const AssistantPanel: React.FC = () => {
	const { messages, status, error, open, send, clear, setOpen, loadHistory } = useAssistant();
	const [input, setInput] = useState('');
	const [aiName, setAiName] = useState('Nova IA');
	const [dismissed, setDismissed] = useState(false);
	const endRef = useRef<HTMLDivElement>(null);
	const historyLoaded = useRef(false);

	useEffect(() => {
		if (historyLoaded.current) return;
		historyLoaded.current = true;
		void loadHistory();
	}, [loadHistory]);

	useEffect(() => {
		let alive = true;
		fetch(apiUrl('/api/settings/public'))
			.then((res) => (res.ok ? res.json() : null))
			.then((data: any) => {
				if (!alive || !data) return;
				const name = typeof data.aiName === 'string' ? data.aiName.trim() : '';
				if (name) setAiName(name.slice(0, 40));
			})
			.catch(() => undefined);
		return () => {
			alive = false;
		};
	}, []);

	useEffect(() => {
		if (open) setDismissed(false);
	}, [open]);

	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
	}, [messages.length, status]);

	const close = () => {
		setOpen(false);
		setDismissed(true);
	};

	const clearHistory = () => {
		if (window.confirm('¿Borrar el historial de la conversación?')) {
			void clear();
		}
	};

	const submit = (text: string) => {
		const trimmed = text.trim();
		if (!trimmed || status === 'thinking') return;
		setInput('');
		void send(trimmed);
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key !== 'Enter' || event.shiftKey) return;
		event.preventDefault();
		submit(input);
	};

	if (dismissed) return null;

	return (
		<div
			id="nova-panel"
			className="fixed bottom-28 right-6 z-[60] w-[380px] max-w-[calc(100vw-3rem)] h-[540px] max-h-[calc(100vh-10rem)] bg-[#10233E] border border-[#1C3557] rounded-2xl shadow-[0_25px_80px_-20px_rgba(0,0,0,0.9)] animate-fade-in flex flex-col overflow-hidden"
		>
			<div className="flex items-center gap-3 px-4 py-3 border-b border-[#1C3557] shrink-0">
				<img
					src={novaAvatar}
					alt=""
					className="w-9 h-9 rounded-full object-cover ring-2 ring-[#1877E8]/50"
				/>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-semibold text-white leading-tight truncate">{aiName}</p>
					<span className="text-[10px] text-[#5B7295] uppercase tracking-wider">
						IA de TeknoTech Services
					</span>
				</div>
				<button
					id="nova-clear"
					type="button"
					aria-label="Borrar historial"
					onClick={clearHistory}
					className={HEADER_ACTION_CLASS}
				>
					<Trash2 className="w-4 h-4" />
				</button>
				<button
					id="nova-close"
					type="button"
					aria-label="Cerrar"
					onClick={close}
					className={HEADER_ACTION_CLASS}
				>
					<X className="w-4 h-4" />
				</button>
			</div>

			<div id="nova-messages" className="flex-1 overflow-y-auto p-4 space-y-3">
				{messages.length === 0 ? (
					<div className="min-h-full flex flex-col items-center justify-center gap-4 text-center py-6">
						<p className="text-sm text-[#5B7295]">Escribime y te ayudo con el cotizador 🐾</p>
						<div className="flex flex-wrap justify-center gap-2">
							{SUGGESTIONS.map((text) => (
								<button
									key={text}
									type="button"
									onClick={() => void send(text)}
									className="bg-[#0C1E36] border border-[#1C3557] rounded-full px-3 py-1.5 text-xs text-[#8FA6C4] hover:text-white hover:border-[#1877E8]/60 transition-colors"
								>
									{text}
								</button>
							))}
						</div>
					</div>
				) : (
					messages.map((m) =>
						m.role === 'user' ? (
							<div key={m.id} className="flex justify-end">
								<div className="bg-[#1877E8] text-white rounded-2xl rounded-br-md px-3.5 py-2 text-sm max-w-[85%] whitespace-pre-wrap">
									{m.content}
								</div>
							</div>
						) : (
							<div key={m.id} className="flex justify-start">
								<div
									data-role="assistant"
									className="bg-[#0C1E36] border border-[#1C3557] text-[#E6EDF7] rounded-2xl rounded-bl-md px-3.5 py-2 text-sm max-w-[85%] whitespace-pre-wrap"
								>
									{m.content}
								</div>
							</div>
						)
					)
				)}

				{status === 'thinking' ? (
					<div className="flex justify-start">
						<div
							data-testid="nova-thinking"
							className="bg-[#0C1E36] border border-[#1C3557] rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-1.5"
						>
							<span className="w-1.5 h-1.5 rounded-full bg-[#5B7295] animate-pulse" />
							<span className="w-1.5 h-1.5 rounded-full bg-[#5B7295] animate-pulse [animation-delay:150ms]" />
							<span className="w-1.5 h-1.5 rounded-full bg-[#5B7295] animate-pulse [animation-delay:300ms]" />
						</div>
					</div>
				) : null}

				{status === 'error' && error ? (
					<div className="flex justify-start">
						<div className="bg-[#E11D48]/10 border border-[#E11D48]/30 text-[#FB7185] text-xs rounded-2xl rounded-bl-md px-3.5 py-2 max-w-[85%] whitespace-pre-wrap">
							{error}
						</div>
					</div>
				) : null}

				<div ref={endRef} />
			</div>

			<form
				id="nova-form"
				onSubmit={(event) => {
					event.preventDefault();
					submit(input);
				}}
				className="border-t border-[#1C3557] p-3 flex gap-2 items-end shrink-0"
			>
				<textarea
					id="nova-input"
					rows={1}
					maxLength={2000}
					value={input}
					onChange={(event) => setInput(event.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Preguntame algo…"
					className="flex-1 resize-none bg-[#0C1E36] border border-[#1C3557] rounded-xl px-3 py-2 text-sm text-white placeholder:text-[#5B7295] focus:outline-none focus:ring-2 focus:ring-[#1877E8]/40 max-h-24"
				/>
				<button
					id="nova-send"
					type="submit"
					aria-label="Enviar"
					disabled={status === 'thinking' || !input.trim()}
					className="bg-[#1877E8] hover:bg-[#0F65CC] rounded-xl px-3 py-2 text-white disabled:opacity-50 transition-colors shrink-0"
				>
					<Send className="w-4 h-4" />
				</button>
			</form>

			<div className="px-3 pb-2 text-[10px] text-[#5B7295] text-center shrink-0">
				Nova IA puede cometer errores — verificá los datos importantes.
			</div>
		</div>
	);
};

export default AssistantPanel;
