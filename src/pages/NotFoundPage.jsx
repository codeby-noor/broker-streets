import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-xl overflow-hidden rounded-[30px] border border-slate-200 bg-cream text-center shadow-sm">
        <div className="px-6 pt-12 sm:px-10">
          <p className="eyebrow">Broker Streets</p>
          <p
            className="display-heading mt-4 text-7xl font-extrabold tracking-tight text-primary sm:text-8xl"
            aria-label="404"
          >
            404
          </p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {t('notFoundPage.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-slate-600 sm:text-base">
            {t('notFoundPage.description')}
          </p>
        </div>
        <div className="mt-8 h-1 w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" aria-hidden="true" />
        <div className="flex flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-center sm:px-10">
          <Link
            to="/"
            className="inline-flex min-h-[48px] items-center justify-center rounded-[24px] bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/20"
          >
            {t('common.backToHome')}
          </Link>
          <Link
            to="/buy"
            className="inline-flex min-h-[48px] items-center justify-center rounded-[24px] border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-ink shadow-sm transition hover:border-primary/40 hover:text-primary focus:outline-none focus:ring-4 focus:ring-primary/20"
          >
            {t('common.browseProperties')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;