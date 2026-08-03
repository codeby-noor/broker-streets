import { Navigate, useLocation } from 'react-router-dom';

export default function FormGuard({
  children,
  flagKey,
  formPath,
  targetPath,
  requireSubmitted = true,
}) {
  const location = useLocation();

  let submitted = false;

  try {
    const mobile = localStorage.getItem('currentUserMobile');

    const storageKey = mobile
      ? `${flagKey}_${mobile}`
      : flagKey;

    submitted = localStorage.getItem(storageKey) === 'true';
  } catch (error) {
    submitted = false;
  }

  if (requireSubmitted) {
    if (!submitted) {
      if (location.pathname === formPath) return children;

      return (
        <Navigate
          to={formPath}
          replace
          state={{ from: location.pathname }}
        />
      );
    }

    return children;
  }

  if (submitted) {
    if (location.pathname === targetPath) return children;

    return <Navigate to={targetPath} replace />;
  }

  return children;
}