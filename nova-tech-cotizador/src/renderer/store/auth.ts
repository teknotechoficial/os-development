import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import type { User } from '../../shared/types';
import { postJson } from '../api';

const STORE_KEY = 'nova-auth';
const REMEMBER_KEY = 'nova-auth-remember';

export interface SetupRequired {
  setupRequired: true;
  token: string;
}

export type LoginResult = User | SetupRequired;

export const isSetupRequired = (result: LoginResult): result is SetupRequired =>
  typeof result === 'object' && result !== null && 'setupRequired' in result;

const pickStorage = (): Storage => {
  if (typeof window !== 'undefined' && window.localStorage.getItem(REMEMBER_KEY) === '1') {
    return window.localStorage;
  }
  return window.sessionStorage;
};

const dynamicStorage: StateStorage = {
  getItem: (name) => pickStorage().getItem(name),
  setItem: (name, value) => pickStorage().setItem(name, value),
  removeItem: (name) => pickStorage().removeItem(name),
};

const applyRemember = (remember: boolean): void => {
  window.localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
  if (remember) {
    window.sessionStorage.removeItem(STORE_KEY);
  } else {
    window.localStorage.removeItem(STORE_KEY);
  }
};

const readSetupRequired = (data: any): SetupRequired | null =>
  data && data.setupRequired && data.token
    ? { setupRequired: true, token: data.token }
    : null;

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  remember: boolean;
  loginWithPassword: (identifier: string, password: string, remember: boolean) => Promise<LoginResult>;
  loginWithCode: (code: string, pin: string, remember: boolean) => Promise<LoginResult>;
  setup: (token: string, password: string, pin: string) => Promise<User>;
  completeSetup: (user: User) => void;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
}

type PersistedAuth = Pick<AuthState, 'user' | 'isAuthenticated' | 'remember'>;

export const useAuth = create<AuthState>()(
  persist(
    devtools((set, get) => ({
      user: null,
      isAuthenticated: false,
      remember: false,
      loginWithPassword: async (identifier, password, remember) => {
        const data = await postJson('/api/login', { identifier, password });
        const setupRequired = readSetupRequired(data);
        if (setupRequired) {
          applyRemember(remember);
          set({ remember });
          return setupRequired;
        }
        if (!data.user) throw new Error('Respuesta inválida del servidor');
        applyRemember(remember);
        set({ user: data.user, isAuthenticated: true, remember });
        return data.user;
      },
      loginWithCode: async (code, pin, remember) => {
        const body: Record<string, unknown> = { code };
        if (pin) body.pin = pin;
        const data = await postJson('/api/login', body);
        const setupRequired = readSetupRequired(data);
        if (setupRequired) {
          applyRemember(remember);
          set({ remember });
          return setupRequired;
        }
        if (!data.user) throw new Error('Respuesta inválida del servidor');
        applyRemember(remember);
        set({ user: data.user, isAuthenticated: true, remember });
        return data.user;
      },
      setup: async (token, password, pin) => {
        const data = await postJson('/api/auth/setup', { token, password, pin });
        if (!data.user) throw new Error('Respuesta inválida del servidor');
        get().completeSetup(data.user);
        return data.user;
      },
      completeSetup: (user) => set({ user, isAuthenticated: true }),
      updateUser: (partial) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...partial } });
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
        window.localStorage.removeItem(STORE_KEY);
        window.sessionStorage.removeItem(STORE_KEY);
      },
    })),
    {
      name: STORE_KEY,
      storage: createJSONStorage<PersistedAuth>(() => dynamicStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        remember: state.remember,
      }),
    }
  )
);
