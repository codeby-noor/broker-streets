import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useUserStore } from '../store/useUserStore';
import { userApi } from '../services/api';

export default function ProtectedRoute() {
  const location = useLocation();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const storeUser = useUserStore((state) => state.user);
  const login = useUserStore((state) => state.login);

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasPhone, setHasPhone] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setCheckingProfile(false);
      return;
    }

    let isMounted = true;

    async function verifyPhone() {
      // Check local store first
      const storePhone = storeUser?.phoneNumber || storeUser?.mobile;
      if (storePhone) {
        if (isMounted) {
          setHasPhone(true);
          setCheckingProfile(false);
        }
        return;
      }

      // Verify with backend
      try {
        const res = await userApi.getMe();
        const dbUser = res?.data?.user;
        const phone = dbUser?.phoneNumber || dbUser?.mobile;

        if (isMounted) {
          if (phone) {
            login(dbUser);
            setHasPhone(true);
          } else {
            setHasPhone(false);
          }
        }
      } catch (err) {
        if (isMounted) setHasPhone(false);
      } finally {
        if (isMounted) setCheckingProfile(false);
      }
    }

    verifyPhone();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, userId, storeUser?.phoneNumber, storeUser?.mobile, login]);

  if (!isLoaded || (isSignedIn && checkingProfile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sage border-t-transparent" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!hasPhone) {
    return <Navigate to="/complete-profile" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}