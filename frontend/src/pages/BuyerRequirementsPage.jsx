import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search, MapPin, Sprout, Building2, Eye, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { gujaratDistricts, sampleProperties } from '../utils/data';
import { readStorage, STORAGE_KEYS } from '../utils/storage';
import Pagination from '../components/Pagination';
import ContactModal from '../components/ContactModal';
import { useLanguage } from '../i18n/LanguageContext';

const getBudgetNumber = (lead) => {
  const val = lead.minBudget || lead.priceAmount || lead.expectedPrice || lead.budgetRange || 0;
  if (typeof val === 'number') return val;
  const str = String(val);
  if (/lakh|lac/i.test(str)) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : Math.round(num * 100000);
  }
  if (/cr|crore/i.test(str)) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : Math.round(num * 10000000);
  }
  const digits = str.replace(/[^0-9]/g, '');
  return Number(digits) || 0;
};

function BuyerRequirementsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [buyerLeads, setBuyerLeads] = useState(() => readStorage(STORAGE_KEYS.buyerLeads, []));
  const [query, setQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All districts');
  const [landType, setLandType] = useState('All types');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [contactModal, setContactModal] = useState(null);

  useEffect(() => {
    const stored = readStorage(STORAGE_KEYS.buyerLeads, []);
    setBuyerLeads(Array.isArray(stored) && stored.length ? stored : []);
    const handler = () => {
      const updated = readStorage(STORAGE_KEYS.buyerLeads, []);
      setBuyerLeads(Array.isArray(updated) ? updated : []);
    };
    window.addEventListener('broker-streets-buyer-leads-changed', handler);
    return () => window.removeEventListener('broker-streets-buyer-leads-changed', handler);
  }, []);

  const districtOptions = ['All districts', ...gujaratDistricts];

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const result = buyerLeads.filter((lead) => {
      const matchesDistrict = selectedDistrict === 'All districts' || String(lead.district || '').toLowerCase() === selectedDistrict.toLowerCase();
      const matchesLandType = landType === 'All types' || String(lead.propertyType || '').toLowerCase().includes(landType.toLowerCase());

      const preferredVillagesText = Array.isArray(lead.preferredVillages)
        ? lead.preferredVillages.join(' ')
        : String(lead.preferredVillages || '');

      const searchText = `${lead.userName || ''} ${lead.requirements || ''} ${lead.propertyType || ''} ${lead.district || ''} ${lead.taluka || lead.subDistrict || ''} ${preferredVillagesText} ${lead.purpose || ''}`.toLowerCase();
      const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);

      return matchesDistrict && matchesLandType && matchesQuery;
    });

    if (sort === 'oldest') {
      return [...result].sort((a, b) => new Date(a.createdAt || a.submittedAt || 0) - new Date(b.createdAt || b.submittedAt || 0));
    }
    if (sort === 'budget_asc') {
      return [...result].sort((a, b) => getBudgetNumber(a) - getBudgetNumber(b));
    }
    if (sort === 'budget_desc') {
      return [...result].sort((a, b) => getBudgetNumber(b) - getBudgetNumber(a));
    }

    // Default: newest
    return [...result].sort((a, b) => new Date(b.createdAt || b.submittedAt || 0) - new Date(a.createdAt || a.submittedAt || 0));
  }, [buyerLeads, selectedDistrict, landType, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const pagedLeads = filteredLeads.slice((activePage - 1) * pageSize, activePage * pageSize);

  return (
    <div className="min-h-screen w-full bg-[#FDFDFD] pb-28 sm:pb-20 dark:bg-dark-bg">
      {/* HERO / PAGE HEADER SECTION */}
      <section className="bg-[#1D5CA9] px-4 py-8 text-white sm:px-8 sm:py-12 lg:px-12 dark:bg-dark-card dark:border-b dark:border-dark-border">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow text-white/80">{t('buyerRequirements.eyebrow') || 'BUYER MARKETPLACE'}</p>
          <h1 className="display-heading mt-2 text-2xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            {t('buyerRequirements.pageTitle') || 'Buyer Requirements'}
          </h1>
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-white/80 sm:text-base">
            {t('buyerRequirements.subtitle') || 'Connect with buyers looking for agricultural and non-agricultural land across Gujarat.'}
          </p>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* TOP SEARCH & UNIFIED FILTER TOOLBAR */}
        <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-sm">
          <div className="flex flex-col gap-2.5 sm:gap-3 lg:flex-row lg:items-center">
            {/* 1. Search Field (takes largest available width on desktop) */}
            <div className="relative flex-1 min-w-0">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                aria-label={t('buyerRequirements.searchPlaceholder')}
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(1); }}
                placeholder={t('buyerRequirements.searchPlaceholder') || 'Search by district, taluka, village, property type or requirements...'}
                className="w-full h-11 sm:h-12 rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-800 outline-none transition focus:border-[#1D5CA9] focus:bg-white"
              />
            </div>

            {/* 2. Controls Grid: Property Type, District, Sort by */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:flex lg:items-center lg:gap-3 shrink-0">
              {/* Property Type Dropdown */}
              <div className="relative flex h-11 sm:h-12 items-center rounded-xl border border-slate-200 bg-white transition hover:border-[#1D5CA9]/50 focus-within:border-[#1D5CA9] lg:w-[185px]">
                <select
                  value={landType}
                  onChange={(event) => { setLandType(event.target.value); setPage(1); }}
                  className="w-full appearance-none border-0 bg-transparent pl-3.5 pr-10 text-xs font-bold text-slate-800 outline-none focus:outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="All types">{t('buy.allTypes')}</option>
                  <option value="Agricultural Land">{t('buyerForm.agriculturalLand')}</option>
                  <option value="Non-Agricultural Land">{t('buyerForm.nonAgriculturalLand')}</option>
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 shrink-0" />
              </div>

              {/* District Dropdown */}
              <div className="relative flex h-11 sm:h-12 items-center rounded-xl border border-slate-200 bg-white transition hover:border-[#1D5CA9]/50 focus-within:border-[#1D5CA9] lg:w-[165px]">
                <select
                  value={selectedDistrict}
                  onChange={(event) => { setSelectedDistrict(event.target.value); setPage(1); }}
                  className="w-full appearance-none border-0 bg-transparent pl-3.5 pr-10 text-xs font-bold text-slate-800 outline-none focus:outline-none focus:ring-0 cursor-pointer"
                >
                  {districtOptions.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist === 'All districts' ? t('buy.allDistricts') : t(dist)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 shrink-0" />
              </div>

              {/* STANDALONE SORT CONTROL */}
              <div className="col-span-2 sm:col-span-1 relative flex h-11 sm:h-12 items-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-2xs transition hover:border-[#1D5CA9]/50 focus-within:border-[#1D5CA9] focus-within:ring-1 focus-within:ring-[#1D5CA9] lg:w-[210px]">
                <span className="pl-3.5 shrink-0 text-xs font-bold text-slate-500">{t('buy.sortBy')}:</span>
                <select
                  value={sort}
                  onChange={(event) => { setSort(event.target.value); setPage(1); }}
                  className="w-full appearance-none border-0 bg-transparent pl-1.5 pr-10 text-xs font-bold text-slate-800 outline-none focus:outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="newest">{t('dropdown.newest')}</option>
                  <option value="oldest">{t('dropdown.oldest')}</option>
                  <option value="budget_asc">Budget: Low to High</option>
                  <option value="budget_desc">Budget: High to Low</option>
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 shrink-0" />
              </div>
            </div>

            {/* 3. Result Count Badge */}
            <div className="flex items-center justify-start lg:justify-end shrink-0">
              <span className="inline-flex h-11 sm:h-12 items-center justify-center rounded-xl bg-[#1D5CA9]/10 px-4 text-xs font-bold text-[#1D5CA9] whitespace-nowrap">
                {filteredLeads.length} {t('buyerRequirements.foundCount') || 'buyer requirements found'}
              </span>
            </div>
          </div>
        </div>

        {/* BUYER REQUIREMENT CARDS GRID */}
        {pagedLeads.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pagedLeads.map((lead) => {
              const villages = Array.isArray(lead.preferredVillages)
                ? lead.preferredVillages
                : typeof lead.preferredVillages === 'string'
                  ? lead.preferredVillages.split(',').map((s) => s.trim()).filter(Boolean)
                  : [];
              const locationParts = [lead.district, lead.taluka || lead.subDistrict, villages.join(', ')].filter(Boolean);
              const initials = lead.userName?.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'B';
              const budgetDisplay = lead.budgetRange || (lead.minBudget ? `₹${lead.minBudget} - ₹${lead.maxBudget}` : lead.expectedPrice || null);
              const areaDisplay = lead.requiredArea || lead.area || null;

              return (
                <article
                  key={lead.id}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:border-[#1D5CA9]/40 hover:shadow-md"
                >
                  <div className="space-y-3.5">
                    {/* Header with Avatar and Type Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1D5CA9] text-sm font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{lead.userName || 'Buyer'}</h3>
                            <UserCheck size={14} className="text-[#1D5CA9] shrink-0" />
                          </div>
                          <p className="text-[11px] font-semibold text-slate-500">
                            {lead.createdAt || lead.submittedAt
                              ? new Date(lead.createdAt || lead.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : 'Recent Requirement'}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-lg bg-[#1D5CA9]/10 px-2.5 py-1 text-[11px] font-bold text-[#1D5CA9]">
                        {lead.propertyType === 'Agricultural Land' ? t('buyerForm.agriculturalLand') : lead.propertyType === 'Non-Agricultural Land' ? t('buyerForm.nonAgriculturalLand') : lead.propertyType || 'Land'}
                      </span>
                    </div>

                    {/* Location Badge */}
                    {locationParts.length > 0 && (
                      <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-800">
                        <MapPin size={14} className="text-[#1D5CA9] shrink-0" />
                        <span className="line-clamp-1">{locationParts.join(' • ')}</span>
                      </div>
                    )}

                    {/* Budget & Area Info */}
                    {(budgetDisplay || areaDisplay) && (
                      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50/50 p-2.5 text-xs">
                        {budgetDisplay && (
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Budget</span>
                            <span className="font-bold text-[#1D5CA9]">{budgetDisplay}</span>
                          </div>
                        )}
                        {areaDisplay && (
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Required Area</span>
                            <span className="font-bold text-slate-800">{areaDisplay}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Requirement Description */}
                    {lead.requirements && (
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Requirement Notes</span>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-700 line-clamp-3">
                          {lead.requirements}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/buyer-requirement/${lead.id}`)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 transition hover:bg-slate-50"
                    >
                      <Eye size={14} />
                      <span>View Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactModal(lead)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1D5CA9] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1D5CA9]/90 active:scale-[0.99]"
                    >
                      <span>{t('home.buyerContactTitle') || 'Contact Buyer'}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="my-12 rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
            <h3 className="text-base font-bold text-slate-800">{t('buyerRequirements.noRequirementsFound') || 'No Buyer Requirements Found'}</h3>
            <p className="mt-1 text-xs text-slate-500">Try adjusting your search criteria or filters.</p>
          </div>
        )}

        {/* PAGINATION */}
        <Pagination currentPage={activePage} pageCount={pageCount} onChange={setPage} />
      </main>

      <ContactModal open={Boolean(contactModal)} onClose={() => setContactModal(null)} data={contactModal || {}} title={t('home.buyerContactTitle')} />
    </div>
  );
}

export default BuyerRequirementsPage;
