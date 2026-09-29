import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

type IconComponent = React.ComponentType<{ className?: string }>;

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold uppercase tracking-wide transition-all duration-150 btn-press focus:outline-none focus:ring-2 focus:ring-[#1877E8]/40 disabled:opacity-50 disabled:cursor-not-allowed';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-[#1877E8] text-white hover:bg-[#0F65CC] shadow-lg shadow-blue-900/30 btn-sweep',
  secondary: 'bg-transparent border border-[#2E4A75] text-[#B8C9E0] hover:bg-[#14294A]',
  danger: 'bg-[#E11D48] text-white hover:bg-[#BE123C]',
  ghost: 'text-[#8FA6C4] hover:text-white hover:bg-[#14294A]',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => (
  <button
    className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className = '', children, ...rest }) => (
  <div className={`bg-card border border-cardborder rounded-2xl ${className}`} {...rest}>{children}</div>
);

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <div className="flex justify-between items-center mb-6">
    <div>
      <h1 className="font-display text-xl font-bold uppercase tracking-[0.08em] text-white animate-title-in">{title}</h1>
      {subtitle ? (
        <p className="text-[#8FA6C4] text-xs uppercase tracking-[0.15em] mt-1">{subtitle}</p>
      ) : null}
    </div>
    {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
  </div>
);

type StatTone = 'blue' | 'green' | 'amber' | 'red' | 'purple';

const COUNT_PATTERN = /^([^0-9]*)(\d{1,3}(?:[^\d]\d{3})+|\d+)([^0-9]*)$/;

interface CountValue {
  target: number;
  render: (amount: number) => string;
}

const parseCountValue = (value: string): CountValue | null => {
  const match = COUNT_PATTERN.exec(value);
  if (!match) return null;
  const prefix = match[1];
  const digits = match[2];
  const suffix = match[3];
  if (prefix.includes('-') || suffix.includes('-')) return null;
  const separator = digits.match(/[^\d]/)?.[0];
  const target = Number(digits.replace(/[^\d]/g, ''));
  if (!Number.isFinite(target) || target <= 0) return null;
  return {
    target,
    render: (amount: number) => {
      const plain = String(Math.round(amount));
      const grouped = separator
        ? plain.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
        : plain;
      return `${prefix}${grouped}${suffix}`;
    },
  };
};

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

const COUNT_DURATION = 700;

export interface StatCardProps {
  label: string;
  value: string;
  icon: IconComponent;
  tone?: StatTone;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend }) => {
  const negative = !!trend && trend.includes('-');
  const parsed = React.useMemo(() => parseCountValue(value), [value]);
  const [display, setDisplay] = React.useState<string>(() => {
    const initial = parseCountValue(value);
    return initial && !prefersReducedMotion() ? initial.render(0) : value;
  });

  React.useEffect(() => {
    if (!parsed || prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const startedAt = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / COUNT_DURATION);
      if (progress >= 1) {
        setDisplay(value);
        return;
      }
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(parsed.render(parsed.target * eased));
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [parsed, value]);

  return (
    <div className="bg-[#0C1E36] border border-[#1C3557] rounded-2xl p-5 hover-lift animate-fade-in-up">
      <span className="w-10 h-10 rounded-xl bg-[#1877E8]/10 border border-[#1877E8]/25 text-[#60A5FA] flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </span>
      <p className="font-display text-3xl font-bold text-white mt-4 tabular-nums">{display}</p>
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8FA6C4] mt-1">{label}</p>
      {trend ? (
        <p
          className={`mt-3 pt-3 border-t border-[#16294A] flex items-center gap-1.5 text-[10px] uppercase tracking-wider ${
            negative ? 'text-[#FB7185]' : 'text-[#34D399]'
          }`}
        >
          {negative ? <TrendingDown className="w-3 h-3 shrink-0" /> : <TrendingUp className="w-3 h-3 shrink-0" />}
          <span>{trend}</span>
        </p>
      ) : null}
    </div>
  );
};

export interface EmptyStateProps {
  icon: IconComponent;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => (
  <div className="py-12 text-center">
    <Icon className="w-10 h-10 mx-auto text-[#2A4A75]" />
    <h3 className="mt-4 font-display text-[#B8C9E0] uppercase tracking-wider text-sm">{title}</h3>
    <p className="mt-1 text-[#5B7295] text-sm">{description}</p>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

export interface SpinnerProps {
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ className = '' }) => (
  <div className={`animate-spin rounded-full h-5 w-5 border-2 border-[#1877E8] border-t-transparent ${className}`} />
);

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);
