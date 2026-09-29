import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Check, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { postJson } from '@/renderer/api';
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
    </div>
  );
};

const Recover: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = React.useState<1 | 2>(1);
  const [identifier, setIdentifier] = React.useState('');
  const [target, setTarget] = React.useState<'password' | 'pin'>('password');
  const [code, setCode] = React.useState('');
  const [value, setValue] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = identifier.trim();
    if (!trimmed) {
      setError('Ingresá tu usuario o correo');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await postJson('/api/auth/recover', { identifier: trimmed });
      setNotice(data.message || 'Código enviado a tu correo');
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError('El código debe tener 6 dígitos');
      return;
    }
    if (target === 'password') {
      if (value.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (!/\d/.test(value)) {
        setError('La contraseña debe incluir un número');
        return;
      }
    } else if (!/^\d{4}$/.test(value)) {
      setError('El PIN debe tener 4 dígitos');
      return;
    }
    if (value !== confirm) {
      setError(target === 'password' ? 'Las contraseñas no coinciden' : 'Los PIN no coinciden');
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        identifier: identifier.trim(),
        token: code.trim(),
      };
      if (target === 'password') {
        body.password = value;
      } else {
        body.pin = value;
      }
      await postJson('/api/auth/reset', body);
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'No se pudieron actualizar las credenciales');
    } finally {
      setLoading(false);
    }
  };

  const goBackToStep1 = () => {
    setStep(1);
    setCode('');
    setValue('');
    setConfirm('');
    setError('');
    setNotice('');
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#0A182E] bg-[radial-gradient(ellipse_at_top,rgba(24,119,232,0.15),transparent_60%)] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#10233E]/80 border border-[#1C3557] rounded-3xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1877E8] shadow-lg shadow-blue-900/50 flex items-center justify-center mx-auto">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-display text-2xl text-white tracking-wider mt-4">
            Credenciales actualizadas
          </h1>
          <p className="text-[#8FA6C4] mt-2">Ya podés iniciar sesión con tus nuevos datos.</p>
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

  return (
    <div className="min-h-screen bg-[#0A182E] bg-[radial-gradient(ellipse_at_top,rgba(24,119,232,0.15),transparent_60%)] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-[#10233E]/80 border border-[#1C3557] rounded-3xl p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1877E8] shadow-lg shadow-blue-900/50 flex items-center justify-center">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-display text-2xl text-white tracking-wider mt-4">
            RECUPERAR ACCESO
          </h1>
          <p className="text-[#8FA6C4] mt-2">
            {step === 1
              ? 'Te enviaremos un código para restablecer tus credenciales'
              : 'Elegí qué querés restablecer con el código recibido'}
          </p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#5B7295] mt-3">
            Paso {step} de 2
          </p>
        </div>

        {error ? (
          <div className="flex items-center gap-2 text-sm text-[#FB7185] bg-[#E11D48]/10 border border-[#E11D48]/30 rounded-xl p-3 mt-6">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {step === 1 ? (
          <form onSubmit={handleRecover} className="mt-6 space-y-5">
            <TextField
              id="recover-identifier"
              label="Usuario o correo"
              icon={KeyRound}
              autoComplete="username"
              placeholder="Tu usuario o correo"
              value={identifier}
              onChange={setIdentifier}
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
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  ENVIAR CÓDIGO
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 text-sm text-[#8FA6C4] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al login
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="mt-6 space-y-5">
            {notice ? (
              <div className="flex items-center gap-2 text-sm text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl p-3">
                <Check className="h-4 w-4 shrink-0" />
                <span>{notice}</span>
              </div>
            ) : null}

            <div>
              <span className="block text-xs uppercase tracking-[0.15em] text-[#8FA6C4] font-semibold mb-2">
                ¿Qué querés restablecer?
              </span>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#0C1E36] border border-[#1C3557] rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setTarget('password');
                    setValue('');
                    setConfirm('');
                    setError('');
                  }}
                  className={`py-2.5 rounded-lg text-xs uppercase tracking-[0.15em] font-semibold transition-colors ${
                    target === 'password'
                      ? 'bg-[#1877E8] text-white'
                      : 'text-[#8FA6C4] hover:text-white'
                  }`}
                >
                  Contraseña
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTarget('pin');
                    setValue('');
                    setConfirm('');
                    setError('');
                  }}
                  className={`py-2.5 rounded-lg text-xs uppercase tracking-[0.15em] font-semibold transition-colors ${
                    target === 'pin' ? 'bg-[#1877E8] text-white' : 'text-[#8FA6C4] hover:text-white'
                  }`}
                >
                  PIN
                </button>
              </div>
              <p className="text-[11px] text-[#5B7295] mt-2">Cuenta: {identifier}</p>
            </div>

            <TextField
              id="recover-code"
              label="Código recibido por correo"
              icon={KeyRound}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(next) => setCode(next.replace(/\D/g, '').slice(0, 6))}
              required
            />

            <TextField
              id="recover-value"
              label={target === 'password' ? 'Nueva contraseña' : 'Nuevo PIN'}
              icon={target === 'password' ? Lock : KeyRound}
              type="password"
              autoComplete="new-password"
              inputMode={target === 'password' ? undefined : 'numeric'}
              maxLength={target === 'password' ? undefined : 4}
              placeholder={target === 'password' ? 'Mínimo 6 caracteres' : '••••'}
              value={value}
              onChange={(next) =>
                target === 'password'
                  ? setValue(next)
                  : setValue(next.replace(/\D/g, '').slice(0, 4))
              }
              required
            />

            <TextField
              id="recover-confirm"
              label={target === 'password' ? 'Confirmar contraseña' : 'Confirmar PIN'}
              icon={target === 'password' ? Lock : KeyRound}
              type="password"
              autoComplete="new-password"
              inputMode={target === 'password' ? undefined : 'numeric'}
              maxLength={target === 'password' ? undefined : 4}
              placeholder={target === 'password' ? 'Repetí tu contraseña' : '••••'}
              value={confirm}
              onChange={(next) =>
                target === 'password'
                  ? setConfirm(next)
                  : setConfirm(next.replace(/\D/g, '').slice(0, 4))
              }
              required
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goBackToStep1}
                className="flex items-center gap-2 text-sm text-[#8FA6C4] hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1 py-3 font-display tracking-wider"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    ACTUALIZAR CREDENCIALES
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Recover;
