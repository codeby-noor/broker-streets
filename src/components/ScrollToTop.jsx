import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const location = useLocation();
  const previousPathnameRef = useRef(location.pathname);

  useEffect(() => {
    const nextPathname = location.pathname;
    const changedRoute = previousPathnameRef.current !== nextPathname;

    if (changedRoute && !location.hash) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
    }

    previousPathnameRef.current = nextPathname;
  }, [location]);

  return null;
}

export default ScrollToTop;
