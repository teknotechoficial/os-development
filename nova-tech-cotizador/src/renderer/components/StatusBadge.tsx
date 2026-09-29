import React from 'react';

interface Props {
  quote?: any;
  status?: string;
}

const STATUS_CONFIG: Record<string, { label: string; pill: string }> = {
  borrador: {
    label: 'Borrador',
    pill: 'bg-[#1C3557] text-[#8FA6C4]',
  },
  enviada: {
    label: 'Enviada',
    pill: 'bg-[#1877E8] text-white',
  },
  aceptada: {
    label: 'Aceptada',
    pill: 'bg-[#059669]/20 text-[#34D399] border border-[#059669]/40',
  },
  rechazada: {
    label: 'Rechazada',
    pill: 'bg-[#E11D48]/15 text-[#FB7185] border border-[#E11D48]/40',
  },
  pagada: {
    label: 'Pagada',
    pill: 'bg-[#B45309]/20 text-[#FBBF24] border border-[#B45309]/40',
  },
};

const DEFAULT_CONFIG = {
  label: 'Sin estado',
  pill: 'bg-[#1C3557] text-[#8FA6C4]',
};

const StatusBadge: React.FC<Props> = ({ quote, status }) => {
  const value = status || quote?.status;
  const config = STATUS_CONFIG[value] || { ...DEFAULT_CONFIG, label: value || DEFAULT_CONFIG.label };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${config.pill}`}
    >
      <span className="rounded-full bg-current" style={{ width: 6, height: 6 }} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
