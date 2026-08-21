import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Building2, FilePlus, Mail, User } from 'lucide-react';
import { getSubmissionDestination } from '../utils/formNavigation';
import { useLanguage } from '../i18n/LanguageContext';

function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const hideRoutes = ['/', '/login', '/register', '/otp'];

  const items = [
    { label: t('nav.home'), to: '/home', icon: Home },
    { label: t('nav.buy'), to: '/buy', icon: Building2, action: 'buy' },
    { label: t('nav.sell'), to: '/sell', icon: FilePlus, action: 'sell' },
    { label: t('nav.contact'), to: '/contact', icon: Mail },
    { label: t('nav.profile'), to: '/profile', icon: User },
  ];

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
