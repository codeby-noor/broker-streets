import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialUser = {
  id: '',
  name: '',
  mobile: '',
  whatsapp: '',
  email: '',
  state: 'Gujarat',
  district: '',
  subDistrict: '',
  profileImage: '',
  createdAt: '',
};

export const useUserStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,

      user: initialUser,

      setUser: (user) =>
        set((state) => ({
          user: { ...state.user, ...user },
        })),

      login: () =>
        set({
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          user: initialUser,
        }),
    }),
    {
      name: 'broker-streets-auth',
    }
  )
);