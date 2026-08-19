import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { languageStorageKey } from '../i18n/translations';

function LanguageSelectionPage() {
  const navigate = useNavigate();
  const { setLanguage, t } = useLanguage();

  useEffect(() => {
    const savedLanguage = localStorage.getItem(languageStorageKey);
    if (savedLanguage === 'en' || savedLanguage === 'gu') {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const chooseLanguage = (value) => {
    setLanguage(value);
    navigate('/home', { replace: true });
  };

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#F8F8F4] px-4 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center justify-center">
        <section className="w-full rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-10">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sage/10">
              <span className="text-2xl font-bold text-sage">BS</span>
            </div>
            <h1 className="mt-6 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">{t('app.brand')}</h1>
            <p className="mt-3 text-sm font-medium uppercase tracking-[0.24em] text-slate-500">{t('app.subtitle')}</p>
          </div>

          <div className="mt-10">
            <div className="text-center">
              <p className="text-base font-semibold text-slate-700">{t('landing.choose')}</p>
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => chooseLanguage('en')}
                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-[18px] border border-slate-300 bg-sage px-6 py-3 text-sm font-bold text-white transition hover:bg-sage-dark focus:outline-none focus:ring-2 focus:ring-sage/40"
              >
                {t('landing.englishButton')}
              </button>

              <button
                type="button"
                onClick={() => chooseLanguage('gu')}
                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-[18px] border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {t('landing.gujaratiButton')}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default LanguageSelectionPage;
