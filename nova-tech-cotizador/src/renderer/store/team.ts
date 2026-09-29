import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, DeveloperAvailability } from '../../shared/types';
import { apiUrl } from '../api';

interface TeamState {
  users: User[];
  availabilities: DeveloperAvailability[];
  currentUser: User | null;
  setUsers: (users: User[]) => void;
  setAvailabilities: (availabilities: DeveloperAvailability[]) => void;
  updateAvailability: (developerId: string, status: string) => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  fetchTeam: () => Promise<void>;
  fetchAvailability: () => Promise<void>;
}

export const useTeam = create<TeamState>()(
  devtools((set, get) => ({
    users: [],
    availabilities: [],
    currentUser: null,
    setUsers: (users) => set({ users }),
    setAvailabilities: (availabilities) => set({ availabilities }),
    updateAvailability: async (developerId, status) => {
      try {
        const response = await fetch(apiUrl(`/api/availability/${developerId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        const data = await response.json();
        if (!response.ok) return;
        const updated: Partial<DeveloperAvailability> =
          data && data.availability ? data.availability : {};
        set((state) => ({
          availabilities: state.availabilities.map((a) =>
            a.developerId === developerId
              ? {
                  ...a,
                  ...updated,
                  developerId,
                  status: (updated.status || status) as DeveloperAvailability['status'],
                }
              : a
          ),
        }));
      } catch (error) {
        console.error('Error updating availability:', error);
      }
    },
    setCurrentUser: (user) => set({ currentUser: user }),
    fetchTeam: async () => {
      try {
        const response = await fetch(apiUrl('/api/team'));
        const data = await response.json();
        set({ users: data });
      } catch (error) {
        console.error('Error fetching team:', error);
      }
    },
    fetchAvailability: async () => {
      try {
        const response = await fetch(apiUrl('/api/availability'));
        const data = await response.json();
        set({ availabilities: data });
      } catch (error) {
        console.error('Error fetching availability:', error);
      }
    },
  }))
);
