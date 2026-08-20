import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { readStorage, STORAGE_KEYS } from '../utils/storage';
import SectionHeading from '../components/SectionHeading';
import Pagination from '../components/Pagination';
import ContactModal from '../components/ContactModal';
import { useLanguage } from '../i18n/LanguageContext';

const landTypes = ['All types', 'Agricultural Land', 'Non-Agricultural Land'];
const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

function BuyerRequirementsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [buyerLeads, setBuyerLeads] = useState(() => readStorage(STORAGE_KEYS.buyerLeads, []));
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [landType, setLandType] = useState('All types');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [contactModal, setContactModal] = useState(null);

  useEffect(() => {
    const stored = readStorage(STORAGE_KEYS.buyerLeads, []);
    setBuyerLeads(Array.isArray(stored) ? stored : []);
    const handler = () => setBuyerLeads(readStorage(STORAGE_KEYS.buyerLeads, []));
    window.addEventListener('broker-streets-buyer-leads-changed', handler);
    return () => window.removeEventListener('broker-streets-buyer-leads-changed', handler);
  }, []);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return buyerLeads
      .filter((lead) => {
        const matchesCity = !city || String(lead.state || '').toLowerCase().includes(city.toLowerCase()) || String(lead.district || '').toLowerCase().includes(city.toLowerCase());
        const matchesDistrict = !district || String(lead.district || '').toLowerCase().includes(district.toLowerCase());
        const matchesType = !propertyType || String(lead.propertyType || '').toLowerCase().includes(propertyType.toLowerCase());
        const matchesLandType = landType === 'All types' || String(lead.propertyType || '').toLowerCase().includes(landType.toLowerCase());
        const matchesQuery = !normalizedQuery || `${lead.userName} ${lead.requirements} ${lead.propertyType} ${lead.district} ${lead.state}`.toLowerCase().includes(normalizedQuery);
        return matchesCity && matchesDistrict && matchesType && matchesLandType && matchesQuery;
      })
      .sort((a, b) => {
        if (sort === 'newest') return new Date(b.createdAt || b.submittedAt || 0) - new Date(a.createdAt || a.submittedAt || 0);
        return new Date(a.createdAt || a.submittedAt || 0) - new Date(b.createdAt || b.submittedAt || 0);
      });
  }, [buyerLeads, city, district, propertyType, landType, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const pagedLeads = filteredLeads.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, city, district, propertyType, landType, sort]);

  return (
    <div className="min-h-screen w-full bg-[#FDFDFD] pb-28 sm:pb-20 dark:bg-dark-bg">
      <section className="bg-[#1D5CA9] px-4 py-8 text-white sm:px-8 sm:py-12 lg:px-12 dark:bg-dark-card dark:border-b dark:border-dark-border">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow text-white/80">{t('profile.buyerRequirements')}</p>
          <h1 className="display-heading mt-2 text-2xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">{t('profile.buyerRequirementsTitle')}</h1>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-white/80 sm:text-base">{t('buyerForm.description')}</p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* SEARCH & FILTERS BAR */}
        <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative col-span-full lg:col-span-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(1); }}
                placeholder={t('common.search')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none transition focus:border-[#1D5CA9] focus:bg-white"
              />
            </div>
            <input
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#1D5CA9]"
              placeholder={t('buy.allDistricts')}
            />
            <select
              value={landType}
              onChange={(event) => setLandType(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#1D5CA9]"
            >
              <option value="All types">{t('buy.allTypes')}</option>
              <option value="Agricultural Land">{t('buyerForm.agriculturalLand')}</option>
              <option value="Non-Agricultural Land">{t('buyerForm.nonAgriculturalLand')}</option>
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#1D5CA9]"
            >
              <option value="newest">{t('dropdown.newest')}</option>
              <option value="oldest">{t('dropdown.oldest')}</option>
            </select>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700">{filteredLeads.length} {t('home.buyerRequirements')}</p>
        </div>

        {/* LEADS GRID */}
        <div className="space-y-4">
          {pagedLeads.map((lead) => {
            const villages = Array.isArray(lead.preferredVillages)
              ? lead.preferredVillages
              : typeof lead.preferredVillages === 'string'
                ? lead.preferredVillages.split(',').map((s) => s.trim()).filter(Boolean)
                : [];
            const villagesFormatted = villages.length ? villages.join(', ') : t('common.notProvided');
            const initials = lead.userName?.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'B';
            return (
              <article key={lead.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-[#1D5CA9]/30">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1D5CA9] text-base font-bold text-white shadow-sm">{initials}</div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{lead.userName || t('profile.profileFallbackName')}</h3>
                          <span className="rounded-full bg-[#1D5CA9]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#1D5CA9]">{t('home.verifiedBuyer')}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">{new Date(lead.createdAt || lead.submittedAt || '').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) || t('common.notAvailable')}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {lead.propertyType === 'Agricultural Land' ? t('buyerForm.agriculturalLand') : lead.propertyType === 'Non-Agricultural Land' ? t('buyerForm.nonAgriculturalLand') : lead.propertyType || t('propertyDetails.propertyTypeFallback')}
                      </span>
                      <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {lead.purpose === 'Investment' ? t('buyerForm.investment') : lead.purpose === 'Project' ? t('buyerForm.project') : lead.purpose === 'Personal Farm' ? t('buyerForm.personalFarm') : lead.purpose === 'Other' ? t('buyerForm.other') : lead.purpose || t('buyerForm.other')}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/60 bg-slate-50/70 p-3.5">
                    <p className="text-xs font-bold text-slate-500">{t('buy.location')}</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-900">{[lead.district, lead.taluka].filter(Boolean).join(' • ') || t('common.notProvided')}</p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-500">{t('buyerForm.preferredVillages')}</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-800">{villagesFormatted}</p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-500">{t('profile.buyerRequirements')}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-700">{lead.requirements || t('common.notProvided')}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setContactModal(lead)}
                    className="w-full rounded-xl bg-[#1D5CA9] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1D5CA9]/90 active:scale-[0.99]"
                  >
                    {t('home.buyerContactTitle')}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <Pagination currentPage={page} pageCount={pageCount} onChange={setPage} />
      </main>
      <ContactModal open={Boolean(contactModal)} onClose={() => setContactModal(null)} data={contactModal || {}} title={t('home.buyerContactTitle')} />
    </div>
  );
}

export default BuyerRequirementsPage;
