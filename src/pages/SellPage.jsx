import { sampleProperties } from '../utils/data';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SectionHeading from '../components/SectionHeading';
import ContactModal from '../components/ContactModal';
import PropertyCard from '../components/PropertyCard';
import { useLanguage } from '../i18n/LanguageContext';

function SellPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const justSubmitted = location.state?.justSubmitted;
  const submittedData = location.state?.data;
  const [contactModal, setContactModal] = useState(null);
  const { t } = useLanguage();

  return (
    <div className="-mx-4 -mt-8 space-y-16 bg-cream pb-20 sm:-mx-6 lg:-mx-8">
      <section className="bg-ink px-6 py-20 text-white sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl"><p className="eyebrow text-blue-100">{t('sell.pageEyebrow')}</p>
          {justSubmitted && (
            <div className="mb-5 border border-blue-200/30 bg-white/10 p-4 text-center">
              <p className="text-lg font-semibold text-white">{t('sell.requestReceived')}</p>
            </div>
          )}
          <h1 className="mt-4 max-w-2xl text-5xl font-bold leading-tight text-white sm:text-6xl">{t('sell.heroTitle')}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/70">{t('sell.heroDescription')}</p></div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 sm:grid-cols-3 lg:px-12"><div className="border border-slate-200 bg-white p-6 shadow-card"><strong className="block text-3xl text-primary">1,200+</strong><span className="mt-2 block text-sm text-muted">{t('sell.propertyEnquiries')}</span></div><div className="border border-slate-200 bg-white p-6 shadow-card"><strong className="block text-3xl text-primary">14 days</strong><span className="mt-2 block text-sm text-muted">{t('sell.averageFirstResponse')}</span></div><div className="border border-slate-200 bg-white p-6 shadow-card"><strong className="block text-3xl text-primary">4.8 / 5</strong><span className="mt-2 block text-sm text-muted">{t('sell.sellerSatisfaction')}</span></div></section>

      <section className="mx-auto max-w-7xl px-6 lg:px-12"><SectionHeading eyebrow={t('sell.benefitsEyebrow')} title={t('sell.benefitsTitle')} /><div className="mt-8 grid gap-4 md:grid-cols-3"><div className="border border-slate-200 bg-blue-50 p-6"><h2 className="text-lg font-semibold text-ink">{t('sell.reachBuyersTitle')}</h2><p className="mt-3 text-sm leading-6 text-muted">{t('sell.reachBuyersDescription')}</p></div><div className="border border-slate-200 bg-blue-50 p-6"><h2 className="text-lg font-semibold text-ink">{t('sell.nextStepsTitle')}</h2><p className="mt-3 text-sm leading-6 text-muted">{t('sell.nextStepsDescription')}</p></div><div className="border border-slate-200 bg-blue-50 p-6"><h2 className="text-lg font-semibold text-ink">{t('sell.localContextTitle')}</h2><p className="mt-3 text-sm leading-6 text-muted">{t('sell.localContextDescription')}</p></div></div></section>

      {justSubmitted && (
        <section className="rounded-[30px] border border-slate-200 bg-white p-8 text-slate-700 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">{t('sell.submissionReceived')}</h2>
          <p className="mt-3 text-base text-slate-600">{t('sell.submissionDescription')}</p>
          {submittedData && (
            <div className="mt-4 text-sm text-slate-700">
              <p><strong>{t('sell.owner')}:</strong> {submittedData.name}</p>
              <p><strong>{t('sell.mobile')}:</strong> {submittedData.mobile}</p>
              <p><strong>{t('sell.city')}:</strong> {submittedData.city}</p>
              <p><strong>{t('sell.type')}:</strong> {submittedData.type}</p>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button onClick={() => navigate('/seller-form')} className="inline-flex w-full items-center justify-center rounded-3xl bg-primary px-6 py-3 text-base font-semibold text-white sm:w-auto">{t('sell.addAnotherProperty')}</button>
            <a href="mailto:help@brokerstreets.com" className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-900 sm:w-auto">{t('sell.contactSupport')}</a>
            <button onClick={() => navigate('/home')} className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-900 sm:w-auto">{t('sell.backToHome')}</button>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 lg:px-12"><div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]"><div><SectionHeading eyebrow={t('sell.notesEyebrow')} title={t('sell.notesTitle')} /><ul className="mt-6 space-y-4 text-sm leading-6 text-muted"><li className="flex gap-3"><span className="font-bold text-primary">01</span>{t('sell.notePrice')}</li><li className="flex gap-3"><span className="font-bold text-primary">02</span>{t('sell.noteMap')}</li><li className="flex gap-3"><span className="font-bold text-primary">03</span>{t('sell.noteFeatures')}</li></ul></div><div><SectionHeading eyebrow={t('sell.recentlySold')} title={t('sell.localResults')} /><div className="mt-6 grid gap-4 sm:grid-cols-2">{sampleProperties.slice(0, 2).map((property) => <PropertyCard key={property.id} property={property} onContact={setContactModal} />)}</div></div></div></section>

      <section className="mx-6 bg-primary px-6 py-12 text-white sm:mx-10 lg:mx-auto lg:max-w-7xl lg:px-12"><div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-3xl font-bold">{t('sell.ctaTitle')}</h2><p className="mt-2 text-white/75">{t('sell.ctaDescription')}</p></div><button type="button" onClick={() => navigate('/seller-form')} className="rounded-full bg-white px-6 py-3.5 font-semibold text-primary">{t('sell.startSelling')}</button></div></section>
      <ContactModal open={Boolean(contactModal)} onClose={() => setContactModal(null)} data={contactModal || {}} title={t('buy.contactSeller')} />
    </div>
  );
}

export default SellPage;
