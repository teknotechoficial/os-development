import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Check, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/renderer/store/auth';
import { Button, Spinner } from '@/renderer/components/ui';

interface TextFieldProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'password';
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'numeric' | 'text';
  maxLength?: number;
  required?: boolean;
  children?: React.ReactNode;
}

const TextField: React.FC<TextFieldProps> = ({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete = 'off',
  inputMode,
  maxLength,
  required,
  children,
}) => {
  const [visible, setVisible] = React.useState(false);
  const secret = type === 'password';

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs uppercase tracking-[0.15em] text-[#8FA6C4] font-semibold mb-2"
      >
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5B7295] pointer-events-none" />
        <input
          id={id}
          type={secret && visible ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          required={required}
          className={`w-full bg-[#0C1E36] border border-[#1C3557] rounded-xl py-3 text-white placeholder-[#5B7295] focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none text-sm pl-12 ${
            secret ? 'pr-12' : 'pr-4'
          }`}
        />
        {secret ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar' : 'Mostrar'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B7295] hover:text-[#8FA6C4] transition-colors"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
};

const SetupCredentials: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setup } = useAuth();

  const state = (location.state || {}) as { token?: string; code?: string };
  const token = state.token;

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (!/\d/.test(password)) {
      setError('La contraseña debe incluir un número');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError('El PIN debe tener 4 dígitos');
      return;
    }
    if (pin !== confirmPin) {
      setError('Los PIN no coinciden');
      return;
    }
    setLoading(true);
    try {
      await setup(token as string, password, pin);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'No se pudieron guardar las credenciales');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0A182E] bg-[radial-gradient(ellipse_at_top,rgba(24,119,232,0.15),transparent_60%)] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#10233E]/80 border border-[#1C3557] rounded-3xl p-8 text-center">
          <AlertCircle className="h-10 w-10 text-[#FB7185] mx-auto" />
          <p className="text-[#8FA6C4] mt-4">Sesión inválida. Volvé a iniciar sesión.</p>
          <Button
            type="button"
            variant="primary"
            className="mt-6 w-full py-3 font-display tracking-wider"
            onClick={() => navigate('/')}
          >
            VOLVER AL LOGIN
          </Button>
        </div>
      </div>
    );
  }

  const passwordRules = [
    { label: 'Al menos 6 caracteres', ok: password.length >= 6 },
    { label: 'Incluye un número', ok: /\d/.test(password) },
  ];

  return (
    <div className="min-h-screen bg-[#0A182E] bg-[radial-gradient(ellipse_at_top,rgba(24,119,232,0.15),transparent_60%)] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-[#10233E]/80 border border-[#1C3557] rounded-3xl p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1877E8] shadow-lg shadow-blue-900/50 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-display text-2xl text-white tracking-wider mt-4">
            CONFIGURA TUS CREDENCIALES
          </h1>
          <p className="text-[#8FA6C4] mt-2">
            Por seguridad, creá tu contraseña y tu PIN de 4 dígitos
          </p>
        </div>

        {error ? (
          <div className="flex items-center gap-2 text-sm text-[#FB7185] bg-[#E11D48]/10 border border-[#E11D48]/30 rounded-xl p-3 mt-6">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <TextField
            id="setup-password"
            label="Contraseña"
            icon={Lock}
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={setPassword}
            required
          >
            <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {passwordRules.map((rule) => (
                <li
                  key={rule.label}
                  className={`flex items-center gap-1.5 text-xs ${
                    rule.ok ? 'text-[#22C55E]' : 'text-[#5B7295]'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  {rule.label}
                </li>
              ))}
            </ul>
          </TextField>

          <TextField
            id="setup-password-confirm"
            label="Confirmar contraseña"
            icon={Lock}
            type="password"
            autoComplete="new-password"
            placeholder="Repetí tu contraseña"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
          />

          <TextField
            id="setup-pin"
            label="PIN de 4 dígitos"
            icon={KeyRound}
            type="password"
            autoComplete="off"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={(value) => setPin(value.replace(/\D/g, '').slice(0, 4))}
            required
          />

          <TextField
            id="setup-pin-confirm"
            label="Confirmar PIN"
            icon={KeyRound}
            type="password"
            autoComplete="off"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={confirmPin}
            onChange={(value) => setConfirmPin(value.replace(/\D/g, '').slice(0, 4))}
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 font-display tracking-wider"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner className="h-4 w-4" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                GUARDAR CREDENCIALES
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SetupCredentials;
