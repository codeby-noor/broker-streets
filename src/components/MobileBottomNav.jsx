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
    <nav className="mobile-bottom-nav sm:hidden">
      <div className="mobile-bottom-nav__inner">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to || (item.to === '/profile' && location.pathname.startsWith('/profile'));
          return (
            <button
              key={item.to}
              type="button"
              onClick={() => handleNavigation(item)}
              className={`mobile-bottom-nav__item ${active ? 'is-active' : ''}`}
              aria-label={item.label}
            >
              <span className="mobile-bottom-nav__icon-wrap">
                <Icon size={20} />
              </span>
              <span className="mobile-bottom-nav__label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
