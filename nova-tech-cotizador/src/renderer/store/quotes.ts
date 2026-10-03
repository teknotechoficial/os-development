import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Quote } from '../../shared/types';
import { calculateBasePrice, calculateFinalPrice } from '../../shared/pricing';
import type { QuoteConfig, ProductType } from '../../shared/types';
import { apiUrl } from '../api';
import { useAuth } from './auth';

interface QuotesState {
  quotes: Quote[];
  currentQuote: Quote | null;
  addQuote: (quote: Quote) => void;
  removeQuote: (id: string) => void;
  updateQuote: (id: string, updates: Partial<Quote>) => void;
  setCurrentQuote: (quote: Quote | null) => void;
  calculatePrice: (productType: ProductType, config: QuoteConfig) => { basePrice: number; finalPrice: number };
  fetchMyQuotes: () => Promise<void>;
  fetchQuote: (id: string) => Promise<Quote | null>;
  updateQuoteStatus: (id: string, status: string) => Promise<void>;
  assignDeveloper: (id: string, developerId: string) => Promise<void>;
}

export const useQuotes = create<QuotesState>()(
  devtools((set, get) => ({
    quotes: [],
    currentQuote: null,
    addQuote: (quote) => set((state) => ({ quotes: [quote, ...state.quotes] })),
    removeQuote: (id) =>
      set((state) => ({
        quotes: state.quotes.filter((q) => q.id !== id),
        currentQuote: state.currentQuote?.id === id ? null : state.currentQuote,
      })),
    updateQuote: (id, updates) =>
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === id ? { ...q, ...updates } : q)),
        currentQuote: state.currentQuote?.id === id ? { ...state.currentQuote, ...updates } : state.currentQuote,
      })),
    setCurrentQuote: (quote) => set({ currentQuote: quote }),
    calculatePrice: (productType, config) => {
      const basePrice = calculateBasePrice(productType, config);
      const finalPrice = calculateFinalPrice(basePrice);
      return { basePrice, finalPrice };
    },
    fetchMyQuotes: async () => {
      try {
        const { user } = useAuth.getState();
        const path = user
          ? '/api/quotes?userId=' + user.id + '&role=' + user.role
          : '/api/quotes';
        const response = await fetch(apiUrl(path));
        const data = await response.json();
        if (Array.isArray(data)) {
          set({ quotes: data });
        }
      } catch (error) {
        console.error('Error fetching my quotes:', error);
      }
    },
    fetchQuote: async (id) => {
      try {
        const response = await fetch(apiUrl(`/api/quotes/${id}`));
        if (!response.ok) return null;
        const data = await response.json();
        if (!data || data.error || !data.quote) return null;
        set({ currentQuote: data.quote });
        return data.quote as Quote;
      } catch (error) {
        console.error('Error fetching quote:', error);
        return null;
      }
    },
    updateQuoteStatus: async (id, status) => {
      try {
        const response = await fetch(apiUrl(`/api/quotes/${id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        const data = await response.json();
        if (response.ok && data && data.quote) {
          get().updateQuote(id, data.quote);
        }
      } catch (error) {
        console.error('Error updating quote status:', error);
      }
    },
    assignDeveloper: async (id, developerId) => {
      try {
        const response = await fetch(apiUrl('/api/availability/assign'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quoteId: id, developerId }),
        });
        const data = await response.json();
        if (response.ok && data && data.quote) {
          get().updateQuote(id, data.quote);
        }
      } catch (error) {
        console.error('Error assigning developer:', error);
      }
    },
  }))
);
