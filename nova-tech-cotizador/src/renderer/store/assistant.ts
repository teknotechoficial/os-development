import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AssistantMessage } from '../../shared/types';
import { apiUrl } from '../api';
import { useAuth } from './auth';

export type AssistantStatus = 'idle' | 'thinking' | 'error';

export interface AssistantPos {
  left: number;
  top: number;
}

const POS_KEY = 'nova_assistant_pos';

const readPos = (): AssistantPos | null => {
  try {
    const raw = window.localStorage.getItem(POS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.left === 'number' &&
      typeof parsed.top === 'number'
    ) {
      return { left: parsed.left, top: parsed.top };
    }
    return null;
  } catch {
    return null;
  }
};

const userHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  'x-user-id': useAuth.getState().user?.id ?? '',
});

const newId = (): string =>
  Math.random().toString(36).slice(2) + Date.now();

interface AssistantState {
  messages: AssistantMessage[];
  status: AssistantStatus;
  open: boolean;
  error: string | null;
  pos: AssistantPos | null;
  setOpen: (open: boolean) => void;
  setPos: (pos: AssistantPos | null) => void;
  loadHistory: () => Promise<void>;
  send: (text: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const useAssistant = create<AssistantState>()(
  devtools(
    (set, get) => ({
      messages: [],
      status: 'idle',
      open: false,
      error: null,
      pos: readPos(),
      setOpen: (open) => set({ open }),
      setPos: (pos) => {
        try {
          if (pos) {
            window.localStorage.setItem(POS_KEY, JSON.stringify(pos));
          } else {
            window.localStorage.removeItem(POS_KEY);
          }
        } catch {
          /* localStorage no disponible */
        }
        set({ pos });
      },
      loadHistory: async () => {
        try {
          const response = await fetch(apiUrl('/api/assistant/history'), {
            method: 'GET',
            headers: userHeaders(),
          });
          if (!response.ok) return;
          const data: any = await response.json();
          if (data && Array.isArray(data.messages)) {
            const valid = data.messages.filter(
              (m: any): m is AssistantMessage =>
                !!m &&
                typeof m === 'object' &&
                typeof m.id === 'string' &&
                m.id.length > 0 &&
                (m.role === 'user' || m.role === 'assistant') &&
                typeof m.content === 'string'
            );
            const messages: AssistantMessage[] = valid.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              at: typeof m.at === 'string' ? m.at : '',
            }));
            set({ messages: messages.slice(-100) });
          }
        } catch (error) {
          console.error('Error loading assistant history:', error);
        }
      },
      send: async (text) => {
        const message = text.trim();
        if (!message) return;
        if (get().status === 'thinking') return;

        const userMessage: AssistantMessage = {
          id: newId(),
          role: 'user',
          content: message,
          at: new Date().toISOString(),
        };
        set((state) => ({
          messages: [...state.messages, userMessage],
          status: 'thinking',
          error: null,
        }));

        try {
          const response = await fetch(apiUrl('/api/assistant/chat'), {
            method: 'POST',
            headers: userHeaders(),
            body: JSON.stringify({ message }),
          });
          if (!response.ok) {
            let data: any = null;
            try {
              data = await response.json();
            } catch {
              data = null;
            }
            set((state) => ({
              messages: state.messages.filter((m) => m.id !== userMessage.id),
              status: 'error',
              error: (data && data.error) || 'No se pudo conectar con el asistente',
            }));
            return;
          }
          const data: any = await response.json();
          const reply = data && data.reply ? String(data.reply) : '';
          const assistantMessage: AssistantMessage = {
            id: newId(),
            role: 'assistant',
            content: reply,
            at: new Date().toISOString(),
          };
          set((state) => ({
            messages: [...state.messages, assistantMessage],
            status: 'idle',
            error: null,
          }));
        } catch {
          set((state) => ({
            messages: state.messages.filter((m) => m.id !== userMessage.id),
            status: 'error',
            error: 'No se pudo conectar con el asistente',
          }));
        }
      },
      clear: async () => {
        try {
          const response = await fetch(apiUrl('/api/assistant/history'), {
            method: 'DELETE',
            headers: userHeaders(),
          });
          if (response.ok) {
            set({ messages: [] });
          }
        } catch (error) {
          console.error('Error clearing assistant history:', error);
        }
      },
    }),
    { name: 'nova-assistant' }
  )
);
