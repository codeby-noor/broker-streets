import { Link } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import { useLanguage } from '../i18n/LanguageContext';

function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-slate-200/70 bg-white px-4 pt-8 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-10 lg:px-8 lg:pb-12 dark:border-dark-border dark:bg-dark-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-sm text-center sm:text-left">
          <Link to="/home" className="inline-flex items-center gap-3">
            <img src={logo} alt="Broker Streets" className="h-10 sm:h-12 w-auto object-contain max-w-[200px]" />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600 dark:text-dark-muted">
            {t('footer.description')}
          </p>
        </div>
        <div className="grid gap-6 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-800 dark:text-dark-text">{t('footer.support')}</p>
            <a href="tel:+919512722011" className="mt-3 block text-sm text-slate-600 hover:text-primary dark:text-dark-muted">+91 95127 22011</a>
            <a href="https://wa.me/919512722011" target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm text-slate-600 hover:text-primary dark:text-dark-muted">WhatsApp: 95127 22011</a>
            <a href="mailto:vibysolution@gmail.com" className="mt-1 block text-sm text-slate-600 hover:text-primary dark:text-dark-muted">vibysolution@gmail.com</a>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-800 dark:text-dark-text">{t('footer.company')}</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-dark-muted">
              <li><Link to="/about" className="hover:text-primary">{t('footer.about')}</Link></li>
              <li><Link to="/contact" className="hover:text-primary">{t('footer.contact')}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-800 dark:text-dark-text">{t('footer.legal')}</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-dark-muted">
              <li><Link to="/privacy" className="hover:text-primary">{t('footer.privacy')}</Link></li>
              <li><Link to="/terms" className="hover:text-primary">{t('footer.terms')}</Link></li>
              <li><Link to="/legal-disclaimer" className="hover:text-primary">{t('footer.legalDisclaimer')}</Link></li>
              <li><Link to="/listing-policy" className="hover:text-primary">{t('footer.listingPolicy')}</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
