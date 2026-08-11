import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../assets/images/logo.png';
import { getSubmissionDestination } from '../utils/formNavigation';
import { useLanguage } from '../i18n/LanguageContext';
import { useUserStore } from '../store/useUserStore';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const [menuOpen, setMenuOpen] = useState(false);
  const hideNav = ['/', '/login', '/register', '/otp'].includes(location.pathname);

  const navItems = [
    { label: t('nav.home'), to: '/home' },
    { label: t('nav.buy'), to: '/buy' },
    { label: t('nav.sell'), to: '/sell' },
    { label: t('nav.about'), to: '/about' },
    { label: t('nav.contact'), to: '/contact' },
  ];

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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 lg:px-8">
        <Link to="/home" className="flex items-center gap-2 flex-shrink-0">
          <img src={logo} alt="Broker Streets logo" className="h-8 w-auto object-contain sm:h-11" />
          <span className="hidden text-base font-bold tracking-tight text-ink sm:inline-block">Broker Streets</span>
        </Link>

        {!hideNav && (
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => {
              if (item.label === t('nav.buy')) {
                return (
                  <button key={item.to} type="button" onClick={navigateBuy} className="text-base font-medium text-slate-700 transition hover:text-primary">
                    {t('nav.buy')}
                  </button>
                );
              }
              if (item.label === t('nav.sell')) {
                return (
                  <button key={item.to} type="button" onClick={navigateSell} className="text-base font-medium text-slate-700 transition hover:text-primary">
                    {t('nav.sell')}
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
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <div className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-white p-0.5 shadow-sm">
              <button type="button" onClick={() => setLanguage('en')} className={`rounded-full px-2 py-0.5 text-[11px] font-bold transition ${language === 'en' ? 'bg-sage text-white' : 'text-slate-600 hover:text-slate-900'}`}>EN</button>
              <button type="button" onClick={() => setLanguage('gu')} className={`rounded-full px-2 py-0.5 text-[11px] font-bold transition ${language === 'gu' ? 'bg-sage text-white' : 'text-slate-600 hover:text-slate-900'}`}>ગુજરાતી</button>
            </div>

            {isAuthenticated ? (
              <Link to="/profile" className="hidden md:inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50">
                {t('nav.profile')}
              </Link>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50">
                  {t('auth.login')}
                </Link>
                <Link to="/register" className="inline-flex h-9 items-center justify-center rounded-full bg-sage px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-sage-dark">
                  {t('auth.register')}
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 md:hidden"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
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
                      if (item.label === t('nav.buy')) return navigateBuy();
                      if (item.label === t('nav.sell')) return navigateSell();
                      return navigate(item.to);
                    }}
                    className="w-full rounded-2xl px-4 py-3.5 text-left text-base font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button type="button" onClick={() => { setLanguage('en'); setMenuOpen(false); }} className={`rounded-full px-3 py-2 text-sm font-semibold ${language === 'en' ? 'bg-sage text-white' : 'text-slate-700'}`}>EN</button>
                    <button type="button" onClick={() => { setLanguage('gu'); setMenuOpen(false); }} className={`rounded-full px-3 py-2 text-sm font-semibold ${language === 'gu' ? 'bg-sage text-white' : 'text-slate-700'}`}>ગુજરાતી</button>
                  </div>
                </div>
                {isAuthenticated ? (
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-base font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    {t('nav.profile')}
                  </Link>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-base font-semibold text-slate-900 transition hover:bg-slate-50"
                    >
                      {t('auth.login')}
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-2xl bg-sage px-4 py-3 text-center text-base font-semibold text-white transition hover:bg-sage-dark"
                    >
                      {t('auth.register')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}

export default Navbar;
