import { Link } from 'react-router-dom';
import logo from '../assets/images/logo-cropped.png';
import { useLanguage } from '../i18n/LanguageContext';

function AuthHeader() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-dark-border dark:bg-dark-card/90">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3.5 sm:max-w-xl sm:px-6">
        <Link to="/home" className="flex items-center transition hover:opacity-90">
          <img src={logo} alt="Broker Streets logo" className="h-8 w-auto max-w-[180px] object-contain sm:h-9 sm:max-w-[220px]" />
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
