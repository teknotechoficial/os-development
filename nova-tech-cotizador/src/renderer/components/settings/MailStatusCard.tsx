import React, { useEffect, useState } from 'react';
import { Inbox } from 'lucide-react';
import { Card } from '@/renderer/components/ui';

interface MailStatusCardProps {
	enabled: boolean;
	host: string;
	port: string | number;
	from: string;
	refreshTick?: number; // cambia tras un test-mail exitoso → relee localStorage
}

interface MailTestRecord {
	ok: boolean;
	at: string;
	message: string;
}

const CARD_CLASS = 'p-6 bg-[#10233E] border border-[#1C3557] rounded-2xl';
const SECTION_TITLE = 'font-display text-sm uppercase tracking-[0.12em] text-white';
const LABEL_CLASS = 'text-xs uppercase tracking-[0.12em] text-[#8FA6C4] font-semibold';
const VALUE_CLASS = 'text-sm text-[#D6E2F2]';

const readLastTest = (): MailTestRecord | null => {
	try {
		const raw = window.localStorage.getItem('nt_mail_test');
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<MailTestRecord> | null;
		if (!parsed || typeof parsed !== 'object') return null;
		if (typeof parsed.at !== 'string' || parsed.at.trim() === '') return null;
		return {
			ok: parsed.ok === true,
			at: parsed.at,
			message: typeof parsed.message === 'string' ? parsed.message : '',
		};
	} catch {
		return null;
	}
};

export default function MailStatusCard({ enabled, host, port, from, refreshTick }: MailStatusCardProps) {
	const [lastTest, setLastTest] = useState<MailTestRecord | null>(null);

	useEffect(() => {
		setLastTest(readLastTest());
	}, [refreshTick]);

	const lastTestLabel = lastTest ? new Date(lastTest.at).toLocaleString('es-ES') : 'Sin pruebas registradas';

	const rows: Array<{ label: string; value: string }> = [
		{ label: 'Servidor', value: host || '—' },
		{ label: 'Puerto', value: port ? String(port) : '—' },
		{ label: 'Correo origen', value: from || '—' },
		{ label: 'Última prueba', value: lastTestLabel },
	];

	return (
		<Card className={CARD_CLASS}>
			<div className="flex items-start justify-between gap-3 pb-4 border-b border-[#16294A]">
				<div className="flex items-center gap-3">
					<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
						<Inbox className="w-4 h-4" />
					</span>
					<div>
						<h2 className={SECTION_TITLE}>Estado del correo</h2>
						<p className="text-xs text-[#5B7295]">Condición actual del envío SMTP</p>
					</div>
				</div>
				<span
					className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
						enabled
							? 'bg-[#34D399]/15 border border-[#34D399]/40 text-[#34D399]'
							: 'bg-[#E11D48]/10 border border-[#E11D48]/30 text-[#FB7185]'
					}`}
				>
					{enabled ? 'Encendido' : 'Apagado'}
				</span>
			</div>

			<dl className="mt-4 space-y-3">
				{rows.map((row) => (
					<div
						key={row.label}
						className="flex items-baseline justify-between gap-4 border-b border-[#16294A]/70 pb-2 last:border-b-0 last:pb-0"
					>
						<dt className={LABEL_CLASS}>{row.label}</dt>
						<dd className={`${VALUE_CLASS} text-right break-all`}>{row.value}</dd>
					</div>
				))}
			</dl>

			<p className="mt-4 pt-3 border-t border-[#16294A] text-[11px] text-[#5B7295]">
				Las pruebas se envían desde la cuenta configurada arriba.
			</p>
		</Card>
	);
}
