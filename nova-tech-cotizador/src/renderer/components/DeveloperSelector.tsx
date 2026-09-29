import React from 'react';
import { useTeam } from '@/renderer/store/team';
import { AVAILABILITY_LABELS } from '@/shared/constants';
import { Card } from '@/renderer/components/ui';

interface Props {
	selectedDeveloper: string;
	onChange: (devId: string) => void;
	availableDevs: Array<{ developerId: string; status: string }>;
}

const STATUS_TEXT: Record<string, string> = {
	disponible: 'text-[#34D399]',
	ocupado: 'text-[#FBBF24]',
	no_disponible: 'text-[#FB7185]',
};

const DeveloperSelector: React.FC<Props> = ({ selectedDeveloper, onChange, availableDevs }) => {
	const { users } = useTeam();

	return (
		<Card className="p-6">
			<h2 className="font-display text-xs uppercase tracking-[0.2em] text-[#8FA6C4] border-b border-[#1C3557] pb-3 mb-2">
				Desarrollador Delegado
			</h2>
			<p className="text-[11px] text-[#5B7295] mb-4">
				El cartel indica la disponibilidad de cada desarrollador
			</p>
			{users.filter((u) => u.role === 'desarrollador').length === 0 ? (
				<p className="text-sm text-[#5B7295] py-4">
					No hay desarrolladores registrados. Agregalos desde Equipo.
				</p>
			) : (
			<div className="space-y-3">
				{users
					.filter((u) => u.role === 'desarrollador')
					.map((dev) => {
						const availability =
							availableDevs.find((a) => a.developerId === dev.id)?.status ?? 'no_disponible';
						const isAvailable = availability === 'disponible';
						const selected = selectedDeveloper === dev.id;
						return (
							<label
								key={dev.id}
								className={`flex items-center gap-3 border rounded-xl p-3 transition-all ${
									selected
										? 'border-[#1877E8] bg-[#1877E8]/10'
										: 'bg-[#0C1E36] border-[#1C3557]'
								} ${isAvailable ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
							>
								<input
									type="radio"
									name="developer"
									checked={selected}
									onChange={() => onChange(dev.id)}
									disabled={!isAvailable}
									className="accent-[#1877E8]"
								/>
								<span className="flex-1 text-sm font-medium text-[#D6E2F2]">{dev.name}</span>
								<span
									className={`text-[10px] uppercase tracking-widest ${
										STATUS_TEXT[availability] ?? 'text-[#5B7295]'
									}`}
								>
									{AVAILABILITY_LABELS[availability] ?? availability}
								</span>
							</label>
						);
					})}
			</div>
			)}
		</Card>
	);
};

export default DeveloperSelector;
