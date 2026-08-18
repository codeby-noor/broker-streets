import { useLanguage } from '../i18n/LanguageContext';

function ContactPage() {
  const { t } = useLanguage();
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold text-slate-900">{t('contact.heading')}</h1>
      <p className="mt-4 text-base leading-7 text-slate-600">{t('contact.description')}</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-800">{t('contact.callUs')}</p>
          <a href="tel:+919512722011" className="mt-2 block text-base text-slate-700 hover:text-primary">95127 22011</a>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-800">{t('contact.whatsappUs')}</p>
          <a href="https://wa.me/919512722011" target="_blank" rel="noopener noreferrer" className="mt-2 block text-base text-slate-700 hover:text-primary">95127 22011</a>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-800">{t('contact.emailId')}</p>
          <a href="mailto:vibysolution@gmail.com" className="mt-2 block text-base text-slate-700 hover:text-primary">vibysolution@gmail.com</a>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;