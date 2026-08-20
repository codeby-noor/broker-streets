import { useEffect, useMemo, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { sampleProperties } from '../utils/data';
import { onListingsChanged, readStorage, STORAGE_KEYS } from '../utils/storage';
import Pagination from '../components/Pagination';
import ContactModal from '../components/ContactModal';
import PropertyCard from '../components/PropertyCard';
import { useLanguage } from '../i18n/LanguageContext';

const priceNumber = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const str = String(value).trim();
  if (/lakh|lac/i.test(str)) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : Math.round(num * 100000);
  }
  if (/cr|crore/i.test(str)) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : Math.round(num * 10000000);
  }
  const digitsOnly = str.replace(/[^0-9]/g, '');
  if (!digitsOnly) return 0;
  const parsed = parseInt(digitsOnly, 10);
  return isNaN(parsed) ? 0 : parsed;
};

function SellListingsPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [contactModal, setContactModal] = useState(null);
  const [listings, setListings] = useState(() => {
    const stored = readStorage(STORAGE_KEYS.listings, []);
    const source = Array.isArray(stored) && stored.length ? stored : sampleProperties;
    const uniqueMap = new Map();
    (Array.isArray(source) ? source : []).forEach((item) => {
      if (item && item.id && !uniqueMap.has(String(item.id))) uniqueMap.set(String(item.id), item);
    });
    return Array.from(uniqueMap.values());
  });

  const perPage = 9;

  useEffect(() => {
    const stored = readStorage(STORAGE_KEYS.listings, []);
    const source = Array.isArray(stored) && stored.length ? stored : sampleProperties;
    const uniqueMap = new Map();
    (Array.isArray(source) ? source : []).forEach((item) => {
      if (item && item.id && !uniqueMap.has(String(item.id))) uniqueMap.set(String(item.id), item);
    });
    setListings(Array.from(uniqueMap.values()));
  }, []);

  useEffect(() => {
    const cleanup = onListingsChanged(() => {
      const stored = readStorage(STORAGE_KEYS.listings, []);
      const source = Array.isArray(stored) && stored.length ? stored : sampleProperties;
      const uniqueMap = new Map();
      (Array.isArray(source) ? source : []).forEach((item) => {
        if (item && item.id && !uniqueMap.has(String(item.id))) uniqueMap.set(String(item.id), item);
      });
      setListings(Array.from(uniqueMap.values()));
    });
    return cleanup;
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const result = listings.filter((property) => {
      const titleText = property.title || property.name || '';
      const villageText = property.village || '';
      const talukaText = property.subDistrict || property.taluka || '';
      const districtText = property.district || property.city || property.location || '';
      const searchText = `${titleText} ${villageText} ${talukaText} ${districtText}`.toLowerCase();

      const matchesSearch = !normalized || searchText.includes(normalized);
      const isSold = String(property.status || 'Available').toLowerCase() === 'sold';
      const isUnavailable = String(property.status || 'Available').toLowerCase() === 'unavailable';

      return matchesSearch && !isSold && !isUnavailable;
    });

    if (sort === 'oldest') {
      return [...result].sort((a, b) => new Date(a.updatedAt || a.createdAt || a.submittedAt || a.uploadedDate || 0) - new Date(b.updatedAt || b.createdAt || b.submittedAt || b.uploadedDate || 0));
    }
    if (sort === 'price_asc') {
      return [...result].sort((a, b) => priceNumber(a.priceAmount || a.price) - priceNumber(b.priceAmount || b.price));
    }
    if (sort === 'price_desc') {
      return [...result].sort((a, b) => priceNumber(b.priceAmount || b.price) - priceNumber(a.priceAmount || a.price));
    }

    // Default: newest
    return [...result].sort((a, b) => new Date(b.updatedAt || b.createdAt || b.submittedAt || b.uploadedDate || 0) - new Date(a.updatedAt || a.createdAt || a.submittedAt || a.uploadedDate || 0));
  }, [listings, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const activePage = Math.min(page, pageCount);
  const paged = filtered.slice((activePage - 1) * perPage, activePage * perPage);

  return (
    <div className="min-h-screen w-full bg-[#FDFDFD] pb-24 dark:bg-dark-bg">
      {/* HERO SECTION */}
      <section className="bg-[#1D5CA9] px-4 py-8 text-white sm:px-8 sm:py-12 lg:px-12 dark:bg-dark-card dark:border-b dark:border-dark-border">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow text-white/80">{t('home.hero.sellListing') || 'PROPERTIES FOR SALE'}</p>
          <h1 className="display-heading mt-2 text-2xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            {t('home.sellListingsTitle') || 'Properties for Sale'}
          </h1>
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-white/80 sm:text-base">
            {t('home.sellListingsDescription') || 'Browse Agricultural and Non-Agricultural Land available for sale across Gujarat. Search by location, property type and price.'}
          </p>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* TOP SEARCH & UNIFIED SORT BAR */}
        <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-sm">
          <div className="flex flex-col gap-2.5 sm:gap-3 lg:flex-row lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                aria-label={t('buy.searchTitle')}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder={t('buy.searchAll')}
                className="w-full h-11 sm:h-12 rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-800 outline-none transition focus:border-[#1D5CA9] focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
              {/* STANDALONE SORT CONTROL */}
              <div className="relative flex h-11 sm:h-12 items-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-2xs transition hover:border-[#1D5CA9]/50 focus-within:border-[#1D5CA9] focus-within:ring-1 focus-within:ring-[#1D5CA9] lg:w-[210px]">
                <span className="pl-3.5 shrink-0 text-xs font-bold text-slate-500">{t('buy.sortBy')}:</span>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  className="w-full appearance-none border-0 bg-transparent pl-1.5 pr-10 text-xs font-bold text-slate-800 outline-none focus:outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="newest">{t('dropdown.newest')}</option>
                  <option value="oldest">{t('dropdown.oldest')}</option>
                  <option value="price_asc">{t('dropdown.priceLowToHigh')}</option>
                  <option value="price_desc">{t('dropdown.priceHighToLow')}</option>
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 shrink-0" />
              </div>

              {/* Matching Property Count */}
              <span className="inline-flex h-11 sm:h-12 items-center justify-center rounded-xl bg-[#1D5CA9]/10 px-4 text-xs font-bold text-[#1D5CA9] whitespace-nowrap">
                {filtered.length} {t('buy.propertyResultLabel')}
              </span>
            </div>
          </div>
        </div>

        {/* PROPERTIES GRID */}
        {paged.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onContact={() => setContactModal(property)}
              />
            ))}
          </div>
        ) : (
          <div className="my-12 rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
            <h3 className="text-base font-bold text-slate-800">{t('buy.noPropertiesFound') || 'No Properties Found'}</h3>
            <p className="mt-1 text-xs text-slate-500">{t('buy.noPropertiesDesc') || 'Try adjusting your search criteria or filters.'}</p>
          </div>
        )}

        {/* PAGINATION */}
        <Pagination currentPage={activePage} pageCount={pageCount} onChange={setPage} />
      </main>

      <ContactModal
        open={Boolean(contactModal)}
        onClose={() => setContactModal(null)}
        data={contactModal || {}}
        title={t('home.buyerContactTitle')}
      />
    </div>
  );
}

export default SellListingsPage;
