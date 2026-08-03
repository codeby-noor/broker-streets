// import { Navigate, Outlet } from 'react-router-dom';
// import { useUserStore } from '../store/useUserStore';

// function ProtectedRoute() {
//   const isAuthenticated = useUserStore((state) => state.isAuthenticated);
//   return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
// }

// export default ProtectedRoute;
import { Navigate, Outlet } from "react-router-dom";
import { useUserStore } from "../store/useUserStore";

export default function ProtectedRoute() {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const hasHydrated = useUserStore.persist.hasHydrated();

  console.log("Hydrated:", hasHydrated);
  console.log("Authenticated:", isAuthenticated);

  if (!hasHydrated) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}