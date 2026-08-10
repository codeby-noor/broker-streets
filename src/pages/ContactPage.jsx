import { useLanguage } from '../i18n/LanguageContext';

function ContactPage() {
  const { t } = useLanguage();
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold text-slate-900">{t('contact.heading')}</h1>
      <p className="mt-4 text-base leading-7 text-slate-600">{t('contact.description')}</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-800">{t('contact.phone')}</p>
          <p className="mt-2 text-base text-slate-700">+91 98765 43210</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-800">{t('contact.email')}</p>
          <p className="mt-2 text-base text-slate-700">support@brokerstreets.com</p>
        </div>
      </div>
      <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-semibold text-slate-800">{t('contact.headOffice')}</p>
        <p className="mt-2 text-base text-slate-700">{t('contact.officeLocation')}</p>
      </div>
    </div>
  );
}

export default ContactPage;
