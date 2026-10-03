import React from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Boxes,
  FilePlus2,
  FileText,
  History,
  Laptop,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  User,
  UserCog,
  Users,
} from 'lucide-react';
import { useAuth } from '../store/auth';
import { useQuotes } from '../store/quotes';
import { useTeam } from '../store/team';
import { apiUrl } from '../api';
import { playTone } from '@/renderer/utils/sound';
import PersonModal from './PersonModal';
import ProfileModal from './ProfileModal';
import logoUrl from '../../../assets/logo-white.png';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number | string }>;
  path: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Reportes', icon: BarChart3, path: '/reportes' },
  { label: 'Cotizaciones', icon: FileText, path: '/cotizaciones' },
  {
    label: 'Nueva Cotización',
    icon: FilePlus2,
    path: '/nueva-cotizacion',
    roles: ['vendedor', 'closer', 'gerente', 'super_admin'],
  },
  { label: 'Servicios', icon: Boxes, path: '/servicios' },
  { label: 'Equipo', icon: Users, path: '/equipo', roles: ['gerente', 'super_admin'] },
  { label: 'Historial', icon: History, path: '/historial' },
];

const AJUSTES_ITEM: NavItem = {
  label: 'Ajustes',
  icon: Settings,
  path: '/configuracion',
  roles: ['super_admin'],
};

const NAV_EXTRA_ITEMS: NavItem[] = [
  { label: 'Mi Trabajo', icon: Laptop, path: '/mi-trabajo', roles: ['desarrollador'] },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'CEO',
  gerente: 'Gerente General',
  vendedor: 'Vendedor',
  closer: 'Closer de Ventas',
  desarrollador: 'Desarrollador',
};

const BADGE_CLASSES = 'bg-[#E11D48] text-white text-[10px] rounded-full px-1.5 min-w-[18px] text-center';

const POLL_MS = 15000;

const notifKey = (n: any): string => {
  const value = n && typeof n === 'object' ? n.id ?? n._id : undefined;
  return value === undefined || value === null ? '' : String(value);
};

type SearchResult =
  | { type: 'quote'; id: string; title: string; subtitle: string }
  | { type: 'person'; id: string; title: string; subtitle: string };

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

interface LocalPrefs {
  sound: boolean;
  notifyDesktop: boolean;
  soundTone?: string;
  accent?: string;
}

const DEFAULT_PREFS: LocalPrefs = {
  sound: false,
  notifyDesktop: false,
  soundTone: 'classic',
  accent: 'blue',
};

const readPrefs = (): LocalPrefs => {
  try {
    const raw = window.localStorage.getItem('nt_prefs');
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_PREFS };
    return {
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : DEFAULT_PREFS.sound,
      notifyDesktop:
        typeof parsed.notifyDesktop === 'boolean'
          ? parsed.notifyDesktop
          : DEFAULT_PREFS.notifyDesktop,
      soundTone:
        typeof parsed.soundTone === 'string' && parsed.soundTone
          ? parsed.soundTone
          : DEFAULT_PREFS.soundTone,
      accent:
        typeof parsed.accent === 'string' && parsed.accent ? parsed.accent : DEFAULT_PREFS.accent,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = React.useState(0);
  const knownIdsRef = React.useRef<Set<string>>(new Set());
  const inFlightRef = React.useRef(false);
  const baselineDoneRef = React.useRef(false);
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const [personId, setPersonId] = React.useState<string | null>(null);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [profileModal, setProfileModal] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);

  const userId = user?.id;

  const { quotes, fetchMyQuotes } = useQuotes();
  const { users, fetchTeam } = useTeam();

  React.useEffect(() => {
    if (users.length === 0) void fetchTeam();
  }, [users.length, fetchTeam]);

  const poll = React.useCallback(async () => {
    if (!userId || inFlightRef.current || document.hidden) return;
    inFlightRef.current = true;
    try {
      const res = await fetch(apiUrl('/api/notifications?userId=' + userId));
      const data = await res.json();
      if (!Array.isArray(data)) return;
      const pending = data.filter((n: any) => n && n.read === false);
      setUnread(pending.length);
      if (knownIdsRef.current.size === 0 && !baselineDoneRef.current) {
        data.forEach((n: any) => knownIdsRef.current.add(notifKey(n)));
        baselineDoneRef.current = true;
        return;
      }
      const fresh = pending.filter((n: any) => !knownIdsRef.current.has(notifKey(n)));
      if (fresh.length === 0) return;
      const prefs = readPrefs();
      if (prefs.sound) {
        playTone(prefs.soundTone || 'classic');
      }
      if (
        prefs.notifyDesktop &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        const newest = fresh[0];
        try {
          new Notification((newest && newest.title) || 'TeknoTech Services', {
            body: (newest && newest.message) || 'Tenés una notificación nueva',
          });
        } catch {
          /* constructor de Notification no disponible */
        }
      }
      fresh.forEach((n: any) => knownIdsRef.current.add(notifKey(n)));
    } catch {
      /* fetch fallido: se reintenta en el próximo ciclo */
    } finally {
      inFlightRef.current = false;
    }
  }, [userId]);

  React.useEffect(() => {
    if (!userId) return;
    knownIdsRef.current = new Set();
    baselineDoneRef.current = false;
    inFlightRef.current = false;
    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, POLL_MS);
    const onVisibilityChange = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      inFlightRef.current = false;
    };
  }, [userId, poll]);

  React.useEffect(() => {
    if (location.pathname === '/notificaciones') void poll();
  }, [location.pathname, poll]);

  React.useEffect(() => {
    const prefs = readPrefs();
    document.documentElement.dataset.accent = prefs.accent || 'blue';
  });

  React.useEffect(() => {
    if (!open && !profileOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (open && searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
      if (profileOpen && profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, profileOpen]);

  const trimmed = query.trim();
  const showResults = open && trimmed.length >= 2;

  React.useEffect(() => {
    if (showResults && quotes.length === 0) {
      fetchMyQuotes();
    }
  }, [showResults, quotes.length, fetchMyQuotes]);

  const results: SearchResult[] = React.useMemo(() => {
    if (!showResults) return [];
    const term = trimmed.toLowerCase();
    const quoteResults: SearchResult[] = quotes
      .filter((q) => q.clientName && q.clientName.toLowerCase().includes(term))
      .map((q) => ({
        type: 'quote' as const,
        id: q.id,
        title: q.clientName,
        subtitle: q.productType || 'Cotización',
      }));
    const personResults: SearchResult[] = users
      .filter((u) => u.name && u.name.toLowerCase().includes(term))
      .map((u) => ({
        type: 'person' as const,
        id: u.id,
        title: u.name,
        subtitle: ROLE_LABELS[u.role] || u.role,
      }));
    return [...quoteResults, ...personResults].slice(0, 6);
  }, [showResults, trimmed, quotes, users]);

  const clearSearch = () => {
    setQuery('');
    setOpen(false);
  };

  const canViewPerson = user?.role === 'super_admin' || user?.role === 'gerente';

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'quote') {
      clearSearch();
      navigate(`/cotizacion/${result.id}`, { state: { from: location.pathname } });
      return;
    }
    if (canViewPerson) {
      clearSearch();
      setPersonId(result.id);
      return;
    }
    setOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const canSee = (item: NavItem) => !item.roles || (user && item.roles.includes(user.role));
  const visibleItems = NAV_ITEMS.filter(canSee);
  const visibleExtraItems = NAV_EXTRA_ITEMS.filter(canSee);

  const me = user ? users.find((u) => u.id === user.id) : undefined;

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) =>
          `flex items-center gap-4 px-5 py-3.5 mx-3 mb-1.5 text-[13px] uppercase tracking-[0.12em] font-semibold rounded-2xl transition-all duration-150 active:scale-[0.98] ${
            isActive
              ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-blue-900/40'
              : 'text-[#8FA6C4] hover:text-white hover:bg-[#10233E] hover:translate-x-0.5'
          }`
        }
      >
        <span className="shrink-0">
          <Icon size={24} />
        </span>
        <span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A182E]">
      <aside className="fixed left-0 top-0 h-screen w-72 bg-[#081426] border-r border-[#16294A] flex flex-col z-20">
        <div className="px-6 py-6 flex items-center gap-3.5 border-b border-[#16294A]/70">
          <div className="w-14 h-14 rounded-2xl bg-[#10233E] border border-[#1877E8]/30 p-1.5 flex items-center justify-center shrink-0 shadow-[0_6px_20px_rgba(0,0,0,0.4)]">
            <img
              src={logoUrl}
              alt="TeknoTech"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="leading-none">
            <p className="font-display text-[17px] text-white tracking-[0.12em]">TeknoTech</p>
            <p className="font-display text-[10px] text-[#1877E8] tracking-[0.42em] mt-1.5">SERVICES</p>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {visibleItems.map(renderNavItem)}
          {visibleExtraItems.map(renderNavItem)}
          {canSee(AJUSTES_ITEM) ? renderNavItem(AJUSTES_ITEM) : null}
        </nav>

        <div className="border-t border-[#16294A] px-4 py-4">
          <p className="text-[10px] text-[#5B7295] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            Software privado de TeknoTech Services
          </p>
        </div>
      </aside>

      <div className="ml-72">
        <header className="h-16 bg-[#0A182E]/95 border-b border-[#16294A] flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="relative flex-1 max-w-xl" ref={searchRef}>
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B7295] pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results.length > 0) {
                  handleResultClick(results[0]);
                }
              }}
              placeholder="Buscar en el sistema"
              aria-label="Buscar en el sistema"
              className="w-full bg-[#10233E] border border-[#1C3557] rounded-xl px-10 py-2.5 text-sm text-white placeholder-[#5B7295] focus:border-[#1877E8] focus:ring-2 focus:ring-[#1877E8]/30 outline-none transition-colors"
            />
            {showResults ? (
              <div className="absolute left-0 right-0 top-full mt-2 bg-[#10233E] border border-[#1C3557] rounded-2xl shadow-[0_25px_80px_-20px_rgba(0,0,0,0.9)] overflow-hidden animate-dropdown z-50">
                <div className="px-4 py-2.5 border-b border-[#16294A] flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#5B7295]">
                  <Search size={13} />
                  Resultados para “{trimmed}”
                </div>
                {results.length === 0 ? (
                  <div className="px-4 py-5 text-sm text-[#5B7295] text-center">Sin resultados</div>
                ) : (
                  results.map((result, idx) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      data-search-result
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#14294A] cursor-pointer text-left transition-colors animate-fade-in-up"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <span className="w-9 h-9 rounded-lg bg-[#0C1E36] border border-[#1C3557] flex items-center justify-center shrink-0 text-[#8FA6C4]">
                        {result.type === 'quote' ? <FileText size={15} /> : <User size={15} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm text-white truncate">{result.title}</span>
                        <span className="block text-[11px] text-[#5B7295] uppercase tracking-wider truncate">
                          {result.subtitle}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-4 pl-6">
            <Link
              to="/notificaciones"
              className="relative p-2 rounded-xl text-[#8FA6C4] hover:bg-[#14294A] hover:text-white transition-colors"
              aria-label="Notificaciones"
            >
              <Bell size={18} />
              {unread > 0 ? (
                <span className={`absolute -top-1 -right-1 ${BADGE_CLASSES}`}>{unread}</span>
              ) : null}
            </Link>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="group flex items-center gap-3 rounded-2xl pl-1.5 pr-3 py-1.5 hover:bg-[#14294A] transition-all active:scale-[0.98]"
                aria-label="Menú de usuario"
                aria-expanded={profileOpen}
              >
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1877E8] to-[#6366F1] flex items-center justify-center shrink-0 ring-2 ring-[#1877E8]/40 group-hover:ring-[#1877E8]/80 overflow-hidden avatar-pop">
                  {me?.avatar ? (
                    <img src={me.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-white/90" />
                  )}
                </span>
                <span className="leading-tight text-left">
                  <span className="block font-display text-sm text-white uppercase tracking-wide">
                    {user ? user.name : ''}
                  </span>
                  <span className="block text-[10px] text-[#5B7295] uppercase tracking-[0.2em]">
                    {user ? ROLE_LABELS[user.role] || user.role : ''}
                  </span>
                </span>
              </button>

              {profileOpen ? (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#10233E] border border-[#1C3557] rounded-2xl shadow-2xl overflow-hidden animate-dropdown z-50">
                  <div className="px-4 py-3.5 border-b border-[#16294A] bg-[#0C1E36]/60">
                    <p className="text-sm text-white font-medium truncate">{user?.name}</p>
                    <p className="text-[11px] text-[#5B7295] truncate">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      setProfileModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#D6E2F2] hover:bg-[#14294A] hover:text-white transition-colors"
                  >
                    <UserCog size={16} className="text-[#60A5FA]" />
                    Mi perfil
                  </button>
                  {user?.role === 'super_admin' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/configuracion');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#D6E2F2] hover:bg-[#14294A] hover:text-white transition-colors"
                    >
                      <Settings size={16} className="text-[#60A5FA]" />
                      Configuración
                    </button>
                  ) : null}
                  <div className="border-t border-[#16294A]" />
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#FB7185] hover:bg-[#E11D48]/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="p-8 min-h-screen bg-[#0A182E]">
          <div key={location.pathname} className="animate-page-in">
            <Outlet />
          </div>
        </main>
      </div>

      {personId ? <PersonModal memberId={personId} onClose={() => setPersonId(null)} /> : null}
      {profileModal ? <ProfileModal onClose={() => setProfileModal(false)} /> : null}
    </div>
  );
};

export default AppLayout;
