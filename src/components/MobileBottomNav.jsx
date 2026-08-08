import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, PlusCircle, Mail, User } from 'lucide-react';
import { getSubmissionDestination } from '../utils/formNavigation';

const items = [
  { label: 'Home', to: '/home', icon: Home },
  { label: 'Buy', to: '/buy', icon: Search, action: 'buy' },
  { label: 'Sell', to: '/sell', icon: PlusCircle, action: 'sell' },
  { label: 'Contact', to: '/contact', icon: Mail },
  { label: 'Profile', to: '/profile', icon: User },
];

function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const hideRoutes = ['/', '/otp'];

  if (hideRoutes.includes(location.pathname)) {
    return null;
  }

  const handleNavigation = (item) => {
    if (item.action === 'buy') {
      return navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'));
    }
    if (item.action === 'sell') {
      return navigate(getSubmissionDestination('sellerFormSubmitted', '/seller-form', '/sell'));
    }

    navigate(item.to);
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md shadow-[0_-10px_30px_-18px_rgba(15,23,42,0.18)] sm:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-1 px-4 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <button
              key={item.to}
              type="button"
              onClick={() => handleNavigation(item)}
              className={`group flex min-h-[56px] w-full flex-col items-center justify-center rounded-3xl px-2 py-2 text-xs font-semibold transition ${active ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
              aria-label={item.label}
            >
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                <Icon size={20} />
              </span>
              <span className="mt-1 text-[11px] leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
