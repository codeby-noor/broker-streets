import { useNavigate } from 'react-router-dom';
import { getSubmissionDestination } from '../utils/formNavigation';
import { useLanguage } from '../i18n/LanguageContext';

function AboutPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="space-y-10">
      <section className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">{t('aboutPage.title')}</h1>
        <p className="mt-4 text-base leading-8 text-slate-600 whitespace-pre-line">
          {t('aboutPage.description')}
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-2xl font-semibold text-slate-900">{t('aboutPage.missionTitle')}</h2>
          <p className="mt-3 text-slate-600">{t('aboutPage.missionDescription')}</p>
        </div>
        <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-2xl font-semibold text-slate-900">{t('aboutPage.whyChooseTitle')}</h2>
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            <li>• {t('aboutPage.bullet1')}</li>
            <li>• {t('aboutPage.bullet2')}</li>
            <li>• {t('aboutPage.bullet3')}</li>
            <li>• {t('aboutPage.bullet4')}</li>
            <li>• {t('aboutPage.bullet5')}</li>
            <li>• {t('aboutPage.bullet6')}</li>
            <li>• {t('aboutPage.bullet7')}</li>
            <li>• {t('aboutPage.bullet8')}</li>
          </ul>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">{t('aboutPage.visionTitle')}</h2>
        <p className="mt-3 text-slate-600">{t('aboutPage.visionDescription')}</p>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">{t('aboutPage.readyTitle')}</h2>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <button onClick={() => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'))} className="inline-flex items-center justify-center rounded-3xl bg-primary px-6 py-4 text-base font-semibold text-white">{t('aboutPage.browseHomes')}</button>
          <button onClick={() => navigate(getSubmissionDestination('sellerFormSubmitted', '/seller-form', '/sell'))} className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-4 text-base font-semibold text-slate-900">{t('aboutPage.sellNow')}</button>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;