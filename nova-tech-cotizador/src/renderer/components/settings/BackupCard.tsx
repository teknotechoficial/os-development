import React, { useRef, useState } from 'react';
import { DatabaseBackup, Download, Upload } from 'lucide-react';
import { apiUrl } from '@/renderer/api';
import { Button, Card } from '@/renderer/components/ui';
import { useAuth } from '@/renderer/store/auth';

interface BackupCardProps {
	onImported: () => void;
}

type Feedback = { type: 'success' | 'error'; message: string } | null;

const CARD_CLASS = 'p-6 bg-[#10233E] border border-[#1C3557] rounded-2xl';
const SECTION_TITLE = 'font-display text-sm uppercase tracking-[0.12em] text-white';

const STRING_KEYS = [
	'companyName',
	'companyLogo',
	'phone',
	'email',
	'paymentAlias',
	'paymentTitular',
	'smtpHost',
	'smtpUser',
	'smtpPass',
	'smtpFrom',
] as const;

const BackupCard: React.FC<BackupCardProps> = ({ onImported }) => {
	const fileRef = useRef<HTMLInputElement>(null);
	const { user } = useAuth();
	const [exporting, setExporting] = useState(false);
	const [importing, setImporting] = useState(false);
	const [feedback, setFeedback] = useState<Feedback>(null);

	const handleExport = async () => {
		setExporting(true);
		setFeedback(null);
		try {
			const response = await fetch(apiUrl('/api/settings'), {
				headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id ?? '' },
			});
			if (!response.ok) throw new Error('export failed');
			const data = await response.json();
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'ajustes-teknotech.json';
			link.click();
			URL.revokeObjectURL(url);
		} catch {
			setFeedback({ type: 'error', message: 'No se pudieron exportar los ajustes' });
		} finally {
			setExporting(false);
		}
	};

	const importFile = (file: File) => {
		setImporting(true);
		setFeedback(null);
		const reader = new FileReader();
		reader.onload = () => {
			void (async () => {
				try {
					const parsed = JSON.parse(String(reader.result));
					if (!parsed || typeof parsed !== 'object') throw new Error('invalid');
					const rawMargin = (parsed as Record<string, unknown>).marginMinimum;
					const margin =
						typeof rawMargin === 'number'
							? rawMargin
							: typeof rawMargin === 'string' && rawMargin.trim() !== ''
								? Number(rawMargin)
								: NaN;
					if (typeof (parsed as Record<string, unknown>).companyName !== 'string' || !Number.isFinite(margin)) {
						throw new Error('invalid');
					}
					const source = parsed as Record<string, unknown>;
					const payload: Record<string, unknown> = {};
					for (const key of STRING_KEYS) {
						if (typeof source[key] === 'string') payload[key] = source[key];
					}
					payload.marginMinimum = margin;
					if (typeof source.smtpPort === 'number' || typeof source.smtpPort === 'string') {
						payload.smtpPort = source.smtpPort;
					}
					if (typeof source.smtpEnabled === 'boolean') payload.smtpEnabled = source.smtpEnabled;
					const response = await fetch(apiUrl('/api/settings'), {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(payload),
					});
					const data = await response.json().catch(() => ({}));
					if (!response.ok || data.error) {
						setFeedback({ type: 'error', message: 'No se pudieron importar los ajustes' });
						return;
					}
					setFeedback({ type: 'success', message: 'Configuración importada' });
					onImported();
				} catch {
					setFeedback({ type: 'error', message: 'Archivo inválido o no se pudo importar' });
				} finally {
					setImporting(false);
				}
			})();
		};
		reader.onerror = () => {
			setFeedback({ type: 'error', message: 'Archivo inválido o no se pudo importar' });
			setImporting(false);
		};
		reader.readAsText(file);
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (file) importFile(file);
	};

	return (
		<Card className={CARD_CLASS}>
			<div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#16294A]">
				<span className="w-9 h-9 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center shrink-0">
					<DatabaseBackup className="w-4 h-4" />
				</span>
				<div>
					<h2 className={SECTION_TITLE}>Copia de seguridad</h2>
					<p className="text-xs text-[#5B7295]">
						Exportá la configuración actual como archivo JSON para restaurarla en otra instancia.
					</p>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<Button
					type="button"
					id="settings-export"
					variant="secondary"
					onClick={handleExport}
					disabled={exporting}
				>
					<Download className="w-4 h-4" />
					{exporting ? 'EXPORTANDO…' : 'EXPORTAR AJUSTES'}
				</Button>
				<Button
					type="button"
					id="settings-import"
					variant="secondary"
					onClick={() => fileRef.current?.click()}
					disabled={importing}
				>
					<Upload className="w-4 h-4" />
					{importing ? 'IMPORTANDO…' : 'IMPORTAR AJUSTES'}
				</Button>
				<input
					ref={fileRef}
					type="file"
					accept=".json,application/json"
					className="hidden"
					onChange={handleFileChange}
				/>
			</div>

			{feedback ? (
				<p
					className={`text-xs font-medium mt-3 ${
						feedback.type === 'success' ? 'text-[#34D399]' : 'text-[#FB7185]'
					}`}
				>
					{feedback.message}
				</p>
			) : null}
		</Card>
	);
};

export default BackupCard;
