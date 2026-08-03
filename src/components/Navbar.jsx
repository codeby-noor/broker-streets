import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import logo from '../assets/images/logo.png';
import { getSubmissionDestination } from '../utils/formNavigation';

const navItems = [
  { label: 'Home', to: '/home' },
  { label: 'Buy', to: '/buy' },
  { label: 'Sell', to: '/sell' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' }
];

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const hideNav = ['/', '/otp'].includes(location.pathname);

  const navigateBuy = () => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'));
  const navigateSell = () => navigate(getSubmissionDestination('sellerFormSubmitted', '/seller-form', '/sell'));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to={hideNav ? '/' : '/home'} className="flex items-center gap-3">
          <img src={logo} alt="Broker Streets logo" className="h-14 w-auto object-contain sm:h-12" />
        </Link>
        {!hideNav && (
          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => {
              if (item.label === 'Buy') {
                return <button key={item.to} type="button" onClick={navigateBuy} className="text-base font-medium text-slate-700 hover:text-primary">Buy</button>;
              }
              if (item.label === 'Sell') {
                return <button key={item.to} type="button" onClick={navigateSell} className="text-base font-medium text-slate-700 hover:text-primary">Sell</button>;
              }
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `text-base font-medium ${isActive ? 'text-primary' : 'text-slate-700'} hover:text-primary`
                  }
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        )}
        {!hideNav ? (
          <div className="flex items-center gap-3">
            <Link to="/profile" className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50">
              Profile
            </Link>
            <button className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 md:hidden">
              <Menu size={24} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 md:hidden">
              <Menu size={24} />
            </button>
          </div>
        )}
      </div>
      {location.pathname === '/' && (
        <div className="border-t border-slate-200/70 bg-slate-50 px-4 py-3 text-center text-sm text-slate-600 sm:px-6">
          Create your account to begin buying or selling with Broker Streets.
        </div>
      )}
    </header>
  );
}

export default Navbar;
