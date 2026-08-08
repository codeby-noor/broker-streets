import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../assets/images/logo.png';
import { getSubmissionDestination } from '../utils/formNavigation';

const navItems = [
  { label: 'Home', to: '/home' },
  { label: 'Buy', to: '/buy' },
  { label: 'Sell', to: '/sell' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const hideNav = ['/', '/otp'].includes(location.pathname);

  const navigateBuy = () => {
    setMenuOpen(false);
    navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'));
  };

  const navigateSell = () => {
    setMenuOpen(false);
    navigate(getSubmissionDestination('sellerFormSubmitted', '/seller-form', '/sell'));
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-8">
        <Link to={hideNav ? '/' : '/home'} className="flex items-center gap-3">
          <img src={logo} alt="Broker Streets logo" className="h-9 w-auto object-contain sm:h-12" />
          <span className="hidden text-lg font-semibold tracking-tight text-ink sm:inline-block">Broker Streets</span>
        </Link>

        {!hideNav && (
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => {
              if (item.label === 'Buy') {
                return (
                  <button key={item.to} type="button" onClick={navigateBuy} className="text-base font-medium text-slate-700 transition hover:text-primary">
                    Buy
                  </button>
                );
              }
              if (item.label === 'Sell') {
                return (
                  <button key={item.to} type="button" onClick={navigateSell} className="text-base font-medium text-slate-700 transition hover:text-primary">
                    Sell
                  </button>
                );
              }
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `text-base font-medium transition ${isActive ? 'text-primary' : 'text-slate-700 hover:text-primary'}`
                  }
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        )}

        {!hideNav ? (
          <>
            <div className="hidden items-center gap-3 md:flex">
              <Link to="/profile" className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50">
                Profile
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 md:hidden"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </>
        ) : null}
      </div>

      {menuOpen && !hideNav ? (
        <>
          <div className="fixed inset-0 z-30 bg-slate-950/70 md:hidden" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-x-0 top-full z-40 border-t border-slate-200 bg-white shadow-xl md:hidden">
            <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (item.label === 'Buy') return navigateBuy();
                      if (item.label === 'Sell') return navigateSell();
                      return navigate(item.to);
                    }}
                    className="w-full rounded-2xl px-4 py-3.5 text-left text-base font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    {item.label}
                  </button>
                ))}
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-base font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Profile
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}

export default Navbar;
