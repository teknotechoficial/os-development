import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  Cloud,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  Monitor,
  Settings,
  Smartphone,
  User,
} from 'lucide-react';
import { useAuth, isSetupRequired } from '@/renderer/store/auth';
import { useQuotes } from '@/renderer/store/quotes';
import { useTeam } from '@/renderer/store/team';
import { Button, Spinner } from '@/renderer/components/ui';

const LOGO_URL = new URL('../../../assets/logo-white.png', import.meta.url).href;

const SERVICE_CARDS = [
  { icon: Monitor, label: 'DESARROLLO WEB' },
  { icon: Smartphone, label: 'SERVICIO TECNICO' },
  { icon: Settings, label: 'SOFTWARE A MEDIDA' },
  { icon: Cloud, label: 'SOLUCIONES DIGITALES' },
];

const Login: React.FC = () => {
  const { loginWithPassword, loginWithCode } = useAuth();
  const { fetchMyQuotes } = useQuotes();
  const { fetchTeam } = useTeam();
  const navigate = useNavigate();

  const [mode, setMode] = React.useState<'password' | 'code'>('password');
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [code, setCode] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState<'password' | 'code' | null>(null);

  const enterApp = async () => {
    await fetchMyQuotes();
    await fetchTeam();
    navigate('/dashboard');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting('password');
    try {
      const result = await loginWithPassword(identifier.trim(), password, remember);
      if (isSetupRequired(result)) {
        navigate('/setup', { state: { token: result.token, code: identifier.trim() } });
        return;
      }
      await enterApp();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setSubmitting(null);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Ingresá tu código de acceso');
      return;
    }
    if (pin && pin.length !== 4) {
      setError('El PIN debe tener 4 dígitos');
      return;
    }
    setSubmitting('code');
    try {
      const result = await loginWithCode(trimmed, pin, remember);
      if (isSetupRequired(result)) {
        navigate('/setup', { state: { token: result.token, code: trimmed } });
        return;
      }
      await enterApp();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setSubmitting(null);
    }
  };

  const toggleMode = () => {
    setError('');
    setMode((m) => (m === 'password' ? 'code' : 'password'));
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0A182E] flex">
      <aside className="hidden lg:flex flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_top_left,rgba(24,119,232,0.16),transparent_55%)]">
        <div className="absolute top-0 left-0 w-56 border-t-2 border-l-2 border-[#1877E8]/40 h-16 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-56 border-b-2 border-r-2 border-[#1877E8]/40 h-16 pointer-events-none" />
        <img
          src={LOGO_URL}
          alt=""
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] max-w-none opacity-[0.07] pointer-events-none select-none animate-logo-float"
        />

        <div className="relative w-full h-full flex flex-col px-14 py-10">
          <div className="flex-1 flex flex-col justify-center gap-10 max-w-xl mx-auto w-full">
            <div className="flex items-center gap-6">
              <img src={LOGO_URL} alt="TeknoTech" className="w-[136px] h-[136px] object-contain shrink-0 drop-shadow-[0_0_24px_rgba(24,119,232,0.35)] animate-logo-float-soft" />
              <div>
                <p className="font-display text-[42px] leading-none text-white tracking-[0.08em]">TEKNOTECH</p>
                <p className="font-display text-[26px] text-[#1877E8] tracking-[0.35em] mt-2">SERVICES</p>
              </div>
            </div>

            <div>
              <p className="text-white text-2xl">Tecnología que impulsa,</p>
              <p className="text-white text-2xl">lealtad que permanece.</p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {SERVICE_CARDS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-3">
                  <div className="w-full aspect-square max-w-[92px] border-2 border-[#1877E8]/70 rounded-2xl bg-[#10233E]/70 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.15em] text-white font-bold text-center leading-snug">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-8">
            <span className="text-[11px] tracking-[0.4em] text-[#1877E8] uppercase font-semibold whitespace-nowrap">
              TeknoTech Services
            </span>
            <span className="flex-1 h-px bg-gradient-to-r from-[#1877E8]/70 to-transparent" />
          </div>
        </div>
      </aside>

      <main className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-xl bg-[#0B1B33]/85 border border-[#1877E8]/40 rounded-3xl p-8 md:p-10 shadow-[0_0_80px_rgba(24,119,232,0.12)] animate-fade-in-up">
          <h1 className="font-display text-3xl text-white tracking-wide">INICIAR SESIÓN</h1>
          <p className="text-[#8FA6C4] mt-2">Accede a tu cuenta para continuar</p>

          {error ? (
            <div className="flex items-center gap-2 text-sm text-[#FB7185] bg-[#E11D48]/10 border border-[#E11D48]/30 rounded-xl p-3 mt-5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {mode === 'password' ? (
            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5B7295] pointer-events-none" />
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  aria-label="Usuario o correo"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Usuario o correo"
                  className="w-full bg-[#0C1E36] border border-[#1C3557] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-[#5B7295] focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none text-sm"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5B7295] pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-label="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full bg-[#0C1E36] border border-[#1C3557] rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-[#5B7295] focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B7295] hover:text-[#8FA6C4] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={remember}
                  onClick={() => setRemember((v) => !v)}
                  className="flex items-center gap-2 text-left"
                >
                  <span
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                      remember ? 'bg-[#1877E8] border-[#1877E8]' : 'bg-[#0C1E36] border-[#1C3557]'
                    }`}
                  >
                    {remember ? <Check className="h-3 w-3 text-white" /> : null}
                  </span>
                  <span className="text-sm text-[#8FA6C4]">Mantener sesión iniciada</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/recover')}
                  className="text-[#1877E8] text-sm hover:underline shrink-0"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3.5 font-display tracking-wider"
                disabled={submitting !== null}
              >
                {submitting === 'password' ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    INICIAR SESIÓN
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="mt-6 space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5B7295] pointer-events-none" />
                <input
                  id="login-code"
                  type="text"
                  autoComplete="off"
                  aria-label="Código de acceso"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Código de acceso (Ej: CEO001)"
                  className="w-full bg-[#0C1E36] border border-[#1C3557] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-[#5B7295] focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none text-sm"
                />
              </div>

              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5B7295] pointer-events-none" />
                <input
                  id="login-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="off"
                  aria-label="PIN de 4 dígitos"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="PIN de 4 dígitos"
                  className="w-full bg-[#0C1E36] border border-[#1C3557] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-[#5B7295] focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none text-sm"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={remember}
                  onClick={() => setRemember((v) => !v)}
                  className="flex items-center gap-2 text-left"
                >
                  <span
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                      remember ? 'bg-[#1877E8] border-[#1877E8]' : 'bg-[#0C1E36] border-[#1C3557]'
                    }`}
                  >
                    {remember ? <Check className="h-3 w-3 text-white" /> : null}
                  </span>
                  <span className="text-sm text-[#8FA6C4]">Mantener sesión iniciada</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/recover')}
                  className="text-[#1877E8] text-sm hover:underline shrink-0"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3.5 font-display tracking-wider"
                disabled={submitting !== null}
              >
                {submitting === 'code' ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    INICIAR CON CÓDIGO
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#1C3557]" />
            <div className="w-6 h-6 rounded-full border border-[#2A4A75] shrink-0" />
            <div className="flex-1 h-px bg-[#1C3557]" />
          </div>

          <button
            id="login-toggle"
            type="button"
            onClick={toggleMode}
            className="w-full py-3.5 rounded-xl border border-[#1C3557] bg-[#0C1E36]/60 text-[#D6E2F2] font-display tracking-wider text-sm uppercase flex items-center justify-center gap-3 hover:border-[#1877E8]/60 hover:text-white transition-colors"
          >
            {mode === 'password' ? (
              <>
                <KeyRound className="h-4 w-4" />
                Ingresar con código + PIN
              </>
            ) : (
              <>
                <User className="h-4 w-4" />
                Ingresar con contraseña
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};

export default Login;
