import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

function SellerSuccess() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-3xl rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm text-center">
      <h1 className="text-2xl font-semibold text-slate-900">{t('sell.submissionReceived')}</h1>
      <p className="mt-4 text-base text-slate-700">{t('sell.submissionDescription')}</p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Link to="/seller-form" className="inline-flex items-center justify-center rounded-3xl bg-primary px-6 py-3 text-base font-semibold text-white">{t('sell.addAnotherProperty')}</Link>
        <Link to="/home" className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-900">{t('sell.backToHome')}</Link>
      </div>
    </div>
  );
}

export default SellerSuccess;
