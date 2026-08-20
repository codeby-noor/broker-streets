import { useEffect, useMemo, useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { sampleProperties, gujaratDistricts } from '../utils/data';
import { onListingsChanged, readStorage, STORAGE_KEYS } from '../utils/storage';
import Pagination from '../components/Pagination';
import ContactModal from '../components/ContactModal';
import PropertyCard from '../components/PropertyCard';
import { useLanguage } from '../i18n/LanguageContext';

const priceNumber = (value) => Number(String(value || '').replace(/[^0-9]/g, '')) || 0;

function SellListingsPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All types');
  const [selectedDistrict, setSelectedDistrict] = useState('All districts');
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
  const districtOptions = ['All districts', ...gujaratDistricts];

  useEffect(() => {
    const stored = readStorage(STORAGE_KEYS.listings, []);
    const source = Array.isArray(stored) && stored.length ? stored : sampleProperties;
    const uniqueMap = new Map();
    source.forEach((item) => {
      if (item && item.id && !uniqueMap.has(String(item.id))) uniqueMap.set(String(item.id), item);
    });
    setListings(Array.from(uniqueMap.values()));

    const cleanup = onListingsChanged(() => {
      const updated = readStorage(STORAGE_KEYS.listings, []);
      const updatedSource = Array.isArray(updated) && updated.length ? updated : sampleProperties;
      const updatedMap = new Map();
      updatedSource.forEach((item) => {
        if (item && item.id && !updatedMap.has(String(item.id))) updatedMap.set(String(item.id), item);
      });
      setListings(Array.from(updatedMap.values()));
    });
    return cleanup;
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const result = listings.filter((property) => {
      const searchText = `${property.title || ''} ${property.city || ''} ${property.location || ''} ${property.district || ''} ${property.type || property.propertyType || ''}`.toLowerCase();
      const matchesSearch = !normalized || searchText.includes(normalized);
      const matchesDistrict = selectedDistrict === 'All districts' || property.district === selectedDistrict || property.location === selectedDistrict || property.city === selectedDistrict;
      const rawType = property.type || property.propertyType || '';
      const matchesType = selectedType === 'All types' || rawType === selectedType;
      const isSold = String(property.status || 'Available').toLowerCase() === 'sold';
      const isUnavailable = String(property.status || 'Available').toLowerCase() === 'unavailable';

      return matchesSearch && matchesDistrict && matchesType && !isSold && !isUnavailable;
    });

    if (sort === 'newest') {
      return [...result].sort((a, b) => new Date(b.updatedAt || b.createdAt || b.submittedAt || b.uploadedDate || 0) - new Date(a.updatedAt || a.createdAt || a.submittedAt || a.uploadedDate || 0));
    }
    if (sort === 'price_asc') {
      return [...result].sort((a, b) => priceNumber(a.priceAmount || a.price) - priceNumber(b.priceAmount || b.price));
    }
    if (sort === 'price_desc') {
      return [...result].sort((a, b) => priceNumber(b.priceAmount || b.price) - priceNumber(a.priceAmount || a.price));
    }

    return result;
  }, [listings, query, selectedDistrict, selectedType, sort]);

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
        {/* FILTER & SEARCH BAR */}
        <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative col-span-full lg:col-span-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder={t('common.search')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none transition focus:border-[#1D5CA9] focus:bg-white"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
              className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#1D5CA9]"
            >
              <option value="All types">{t('buy.allTypes')}</option>
              <option value="Agricultural Land">{t('buyerForm.agriculturalLand')}</option>
              <option value="Non-Agricultural Land">{t('buyerForm.nonAgriculturalLand')}</option>
            </select>

            <select
              value={selectedDistrict}
              onChange={(e) => { setSelectedDistrict(e.target.value); setPage(1); }}
              className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#1D5CA9]"
            >
              {districtOptions.map((district) => (
                <option key={district} value={district}>
                  {district === 'All districts' ? t('buy.allDistricts') : t(district)}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#1D5CA9]"
            >
              <option value="newest">{t('dropdown.newest')}</option>
              <option value="price_asc">{t('dropdown.priceLowToHigh')}</option>
              <option value="price_desc">{t('dropdown.priceHighToLow')}</option>
            </select>
          </div>
        </div>

        {/* RESULTS HEADER */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700">
            {filtered.length} {t('buy.matchingProperties') || 'Properties Found'}
          </p>
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
