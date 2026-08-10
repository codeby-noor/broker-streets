import { Link } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import { useLanguage } from '../i18n/LanguageContext';

function AuthHeader() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3.5 sm:max-w-xl sm:px-6">
        <Link to="/home" className="flex items-center gap-2.5 transition hover:opacity-90">
          <img src={logo} alt="Broker Streets logo" className="h-8 w-auto object-contain sm:h-9" />
          <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            {t('app.brand') || 'Broker Streets'}
          </span>
        </Link>

        {/* Direct Language Switcher - visible on screen for mobile & desktop */}
        <div className="flex items-center rounded-full border border-slate-200 bg-slate-100/80 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
              language === 'en'
                ? 'bg-sage text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
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
                : 'text-slate-600 hover:text-slate-900'
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
