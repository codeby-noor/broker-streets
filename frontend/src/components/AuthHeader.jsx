import { Link } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import { useLanguage } from '../i18n/LanguageContext';

function AuthHeader() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="broker-streets-header w-full">
      <div className="header-inner mx-auto flex max-w-md items-center justify-between px-4 sm:max-w-xl sm:px-6">
        <Link to="/home" className="flex items-center transition hover:opacity-90">
          <img src={logo} alt="Broker Streets" className="broker-streets-logo" />
        </Link>

        {/* Direct Language Switcher - visible on screen for mobile & desktop */}
        <div className="flex items-center rounded-full border border-slate-200 bg-slate-100/80 p-1 shadow-inner dark:border-dark-border dark:bg-dark-bg">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
              language === 'en'
                ? 'bg-sage text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-dark-muted dark:hover:text-dark-text'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('gu')}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
              language === 'gu'
                ? 'bg-sage text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-dark-muted dark:hover:text-dark-text'
            }`}
          >
            ગુજરાતી
          </button>
        </div>
      </div>
    </header>
  );
}

export default AuthHeader;
