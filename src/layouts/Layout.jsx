import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import ScrollToTop from '../components/ScrollToTop';

function Layout() {
  const location = useLocation();
  const isAuthRoute = ['/', '/register', '/login', '/otp', '/language-selection'].includes(location.pathname);

  if (isAuthRoute) {
    return <Outlet />;
  }

  return (
    <div className="relative min-h-screen bg-background text-text dark:bg-dark-bg dark:text-dark-text">
      <ScrollToTop />
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pb-12">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

export default Layout;
