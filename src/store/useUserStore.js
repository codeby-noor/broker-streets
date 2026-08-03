import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserStore = create(persist((set) => ({
  isAuthenticated: false,
  user: {
    name: '',
    mobile: '',
    email: '',
    state: 'gujarat',
    city: 'Ahmedabad'
  },
  setUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false, user: { name: '', mobile: '', email: '', state: 'gujarat', city: 'Ahmedabad' } })
}), {
  name: 'broker-streets-auth'
}));
