import { Link, useNavigate } from 'react-router-dom';
import { getSubmissionDestination } from '../utils/formNavigation';
import { useLanguage } from '../i18n/LanguageContext';

function BuyerSuccess() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-3xl rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm text-center">
      <h1 className="text-2xl font-semibold text-slate-900">{t('sell.submissionReceived')}</h1>
      <p className="mt-4 text-base text-slate-700">{t('contact.modalDescription')}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
        <button onClick={() => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'))} className="inline-flex w-full items-center justify-center rounded-3xl bg-primary px-6 py-3 text-base font-semibold text-white sm:w-auto">{t('home.hero.browse')}</button>
        <Link to="/home" className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-900 sm:w-auto">{t('sell.backToHome')}</Link>
      </div>
    </div>
  );
}

export default BuyerSuccess;
