import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Sprout, Building2, Calendar, ShieldCheck } from 'lucide-react';
import { readStorage, STORAGE_KEYS } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';
import ContactModal from '../components/ContactModal';

function BuyerRequirementDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [requirement, setRequirement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState(false);

  useEffect(() => {
    const leads = readStorage(STORAGE_KEYS.buyerLeads, []);
    const found = leads.find((item) => String(item.id) === String(id));
    setRequirement(found || null);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFDFD]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1D5CA9] border-t-transparent" />
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">{t('buyerRequirements.noRequirementsFound') || 'Buyer Requirement Not Found'}</h2>
        <button
          type="button"
          onClick={() => navigate('/buyer-requirements')}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1D5CA9] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1D5CA9]/90"
        >
          <ArrowLeft size={16} />
          <span>Back to Buyer Requirements</span>
        </button>
      </div>
    );
  }

  const initials = requirement.userName?.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'B';
  const preferredVillages = Array.isArray(requirement.preferredVillages)
    ? requirement.preferredVillages
    : typeof requirement.preferredVillages === 'string'
      ? requirement.preferredVillages.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  return (
    <div className="min-h-screen w-full bg-[#FDFDFD] pb-24 dark:bg-dark-bg">
      {/* HEADER SECTION */}
      <section className="bg-[#1D5CA9] px-4 py-8 text-white sm:px-8 sm:py-10 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => navigate('/buyer-requirements')}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white"
          >
            <ArrowLeft size={15} />
            <span>{t('common.back') || 'Back'}</span>
          </button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold text-white backdrop-blur-sm">
                {initials}
              </div>
              <div>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                  {t('home.verifiedBuyer') || 'Verified Buyer'}
                </span>
                <h1 className="mt-1 text-xl sm:text-2xl font-bold text-white">
                  {requirement.userName || 'Buyer'} Looking for Land
                </h1>
                <p className="mt-0.5 text-xs text-white/80 flex items-center gap-2">
                  <Calendar size={13} />
                  <span>Posted {new Date(requirement.createdAt || requirement.submittedAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DETAILS BODY */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* MAIN CARD */}
          <div className="space-y-6 md:col-span-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                  {requirement.propertyType === 'Agricultural Land' ? <Sprout size={15} /> : <Building2 size={15} />}
                  {requirement.propertyType || 'Land'}
                </span>
                {requirement.purpose && (
                  <span className="inline-flex rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                    Purpose: {requirement.purpose}
                  </span>
                )}
              </div>

              {/* LOCATION BLOCK */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#1D5CA9]" />
                  {t('buyerRequirements.locationLabel') || 'Preferred Location'}
                </h3>
                <p className="mt-1.5 text-sm font-bold text-slate-900">
                  {[requirement.district, requirement.taluka].filter(Boolean).join(' • ') || 'Gujarat'}
                </p>
                {preferredVillages.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                    <span className="text-xs font-semibold text-slate-500">Villages: </span>
                    <span className="text-xs font-bold text-slate-800">{preferredVillages.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* REQUIREMENTS NOTES */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Requirement Details</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {requirement.requirements || 'Buyer looking for suitable land properties matching their criteria.'}
                </p>
              </div>

              {/* ADDITIONAL INFO */}
              {(requirement.budgetRange || requirement.minBudget || requirement.expectedPrice) && (
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <span className="text-xs font-bold text-slate-500">Budget Range</span>
                    <p className="mt-1 text-base font-bold text-[#1D5CA9]">
                      {requirement.budgetRange || (requirement.minBudget ? `₹${requirement.minBudget} - ₹${requirement.maxBudget}` : requirement.expectedPrice || 'On Request')}
                    </p>
                  </div>
                  {requirement.requiredArea && (
                    <div>
                      <span className="text-xs font-bold text-slate-500">Required Area</span>
                      <p className="mt-1 text-base font-bold text-slate-900">{requirement.requiredArea}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR CONTACT CARD */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                <ShieldCheck size={16} />
                <span>Direct Verified Contact</span>
              </div>

              <button
                type="button"
                onClick={() => setContactModal(true)}
                className="w-full rounded-xl bg-[#1D5CA9] px-4 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#1D5CA9]/90 active:scale-[0.99]"
              >
                {t('home.buyerContactTitle') || 'Contact Buyer'}
              </button>
            </div>
          </div>
        </div>
      </main>

      <ContactModal
        open={contactModal}
        onClose={() => setContactModal(false)}
        data={requirement}
        title={t('home.buyerContactTitle') || 'Contact Buyer'}
      />
    </div>
  );
}

export default BuyerRequirementDetailsPage;
