import { useEffect, useMemo, useState } from 'react';
import { Filter, Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { propertyTypes, sampleProperties, gujaratDistricts, gujaratSubDistricts, gujaratVillages } from '../utils/data';
import { onListingsChanged, readStorage, STORAGE_KEYS } from '../utils/storage';
import Pagination from '../components/Pagination';
import ContactModal from '../components/ContactModal';
import PropertyCard from '../components/PropertyCard';
import { useLanguage } from '../i18n/LanguageContext';
import { formatIndianPrice } from '../utils/format';

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

const MIN_PRICE = 0;
const MAX_PRICE = 200000000; // ₹20 Cr
const PRICE_STEP = 100000;   // ₹1 Lakh (Precise increments from ₹0 to ₹20 Cr)

function SellListingsPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All districts');
  const [selectedTaluka, setSelectedTaluka] = useState('All talukas');
  const [selectedVillage, setSelectedVillage] = useState('All villages');
  const [type, setType] = useState('All types');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priceRange, setPriceRange] = useState([MIN_PRICE, MAX_PRICE]);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);
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
  const talukaOptions = selectedDistrict === 'All districts' ? [] : ['All talukas', ...(gujaratSubDistricts[selectedDistrict] || [])];
  const villageOptions = selectedDistrict === 'All districts' || selectedTaluka === 'All talukas' || !selectedTaluka ? [] : ['All villages', ...(gujaratVillages[selectedDistrict]?.[selectedTaluka] || [])];

  useEffect(() => {
    setSelectedTaluka('All talukas');
    setSelectedVillage('All villages');
  }, [selectedDistrict]);

  useEffect(() => {
    setSelectedVillage('All villages');
  }, [selectedTaluka]);

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

  useEffect(() => {
    document.body.style.overflow = mobileFilters ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFilters]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const minimum = priceRange[0];
    const maximum = priceRange[1] >= MAX_PRICE ? Number.POSITIVE_INFINITY : priceRange[1];

    const result = listings.filter((property) => {
      const titleText = property.title || property.name || '';
      const villageText = property.village || '';
      const talukaText = property.subDistrict || property.taluka || '';
      const districtText = property.district || property.city || property.location || '';
      const searchText = `${titleText} ${villageText} ${talukaText} ${districtText}`.toLowerCase();

      const matchesSearch = !normalized || searchText.includes(normalized);
      const matchesDistrict = selectedDistrict === 'All districts' || property.district === selectedDistrict || property.location === selectedDistrict || property.city === selectedDistrict;
      const matchesTaluka = selectedTaluka === 'All talukas' || property.subDistrict === selectedTaluka || property.taluka === selectedTaluka;
      const matchesVillage = selectedVillage === 'All villages' || property.village === selectedVillage;
      const matchesType = type === 'All types' || property.type === type || property.propertyType === type;

      const price = priceNumber(property.priceAmount || property.price);
      const matchesPrice = price >= minimum && price <= maximum;

      const pStatus = String(property.status || 'Available');
      const matchesStatus = statusFilter === 'All'
        ? pStatus.toLowerCase() !== 'unavailable'
        : pStatus.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesDistrict && matchesTaluka && matchesVillage && matchesType && matchesPrice && matchesStatus;
    });

    if (sort === 'oldest') {
      return [...result].sort((a, b) => new Date(a.updatedAt || a.createdAt || a.submittedAt || a.uploadedDate || 0) - new Date(a.updatedAt || a.createdAt || a.submittedAt || a.uploadedDate || 0));
    }
    if (sort === 'price_asc') {
      return [...result].sort((a, b) => priceNumber(a.priceAmount || a.price) - priceNumber(b.priceAmount || b.price));
    }
    if (sort === 'price_desc') {
      return [...result].sort((a, b) => priceNumber(b.priceAmount || b.price) - priceNumber(a.priceAmount || a.price));
    }

    // Default: newest
    return [...result].sort((a, b) => new Date(b.updatedAt || b.createdAt || b.submittedAt || b.uploadedDate || 0) - new Date(a.updatedAt || a.createdAt || a.submittedAt || a.uploadedDate || 0));
  }, [listings, query, selectedDistrict, selectedTaluka, selectedVillage, type, statusFilter, priceRange, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const activePage = Math.min(page, pageCount);
  const paged = filtered.slice((activePage - 1) * perPage, activePage * perPage);

  const clearFilters = () => {
    setQuery('');
    setSelectedDistrict('All districts');
    setSelectedTaluka('All talukas');
    setSelectedVillage('All villages');
    setType('All types');
    setStatusFilter('All');
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    setSort('newest');
    setPage(1);
  };

  const filters = (
    <div className="space-y-5">
      <div className="hidden lg:flex items-center justify-between gap-4 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-[#1D5CA9]" />
          <h2 className="text-base font-bold text-slate-900">{t('buy.filterHeading') || 'Filters'}</h2>
        </div>
        <button type="button" onClick={clearFilters} className="text-xs font-bold uppercase tracking-wider text-[#1D5CA9] hover:underline">
          {t('buy.reset') || 'Reset'}
        </button>
      </div>

      {/* PROPERTY TYPE */}
      <label className="block">
        <span className="field-label text-xs font-bold text-slate-700">{t('buy.propertyType') || 'Property Type'}</span>
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="field-control w-full mt-1.5"
        >
          <option value="All types">{t('buy.allTypes') || 'All types'}</option>
          <option value="Agricultural Land">{t('buyerForm.agriculturalLand') || 'Agricultural Land'}</option>
          <option value="Non-Agricultural Land">{t('buyerForm.nonAgriculturalLand') || 'Non-Agricultural Land'}</option>
        </select>
      </label>

      {/* DISTRICT */}
      <label className="block">
        <span className="field-label text-xs font-bold text-slate-700">{t('buy.district') || 'District'}</span>
        <select
          value={selectedDistrict}
          onChange={(event) => { setSelectedDistrict(event.target.value); setPage(1); }}
          className="field-control w-full mt-1.5"
        >
          {districtOptions.map((dist) => (
            <option key={dist} value={dist}>
              {dist === 'All districts' ? t('buy.allDistricts') || 'All districts' : t(dist)}
            </option>
          ))}
        </select>
      </label>

      {/* TALUKA */}
      {selectedDistrict !== 'All districts' && (
        <label className="block">
          <span className="field-label text-xs font-bold text-slate-700">{t('common.taluka') || 'Taluka'}</span>
          <select
            value={selectedTaluka}
            onChange={(event) => { setSelectedTaluka(event.target.value); setPage(1); }}
            className="field-control w-full mt-1.5"
          >
            {talukaOptions.map((taluka) => (
              <option key={taluka} value={taluka}>
                {taluka === 'All talukas' ? t('buy.allTalukas') || 'All talukas' : t(taluka)}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* VILLAGE */}
      {selectedDistrict !== 'All districts' && selectedTaluka !== 'All talukas' && (
        <label className="block">
          <span className="field-label text-xs font-bold text-slate-700">{t('buy.village') || 'Village'}</span>
          <select
            value={selectedVillage}
            onChange={(event) => { setSelectedVillage(event.target.value); setPage(1); }}
            className="field-control w-full mt-1.5"
          >
            {villageOptions.map((village) => (
              <option key={village} value={village}>
                {village === 'All villages' ? t('buy.allVillages') || 'All villages' : t(village)}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* LISTING STATUS */}
      <label className="block">
        <span className="field-label text-xs font-bold text-slate-700">Listing Status</span>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="field-control w-full mt-1.5"
        >
          <option value="All">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Pending">Pending</option>
          <option value="Sold">Sold</option>
        </select>
      </label>

      {/* DUAL-HANDLE PRICE RANGE SLIDER (₹0 - ₹20 Cr, Step = ₹1 Lakh) */}
      <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-700">Price Range</span>
          <span className="text-xs font-bold text-[#1D5CA9] whitespace-nowrap">
            {formatIndianPrice(priceRange[0])} — {formatIndianPrice(priceRange[1])}
          </span>
        </div>

        <div className="relative my-3 flex h-7 w-full items-center select-none">
          {/* Background Track */}
          <div className="absolute inset-x-0 h-2 rounded-full bg-slate-200" />

          {/* Active Range Bar */}
          <div
            className="absolute h-2 rounded-full bg-[#1D5CA9]"
            style={{
              left: `${(priceRange[0] / MAX_PRICE) * 100}%`,
              right: `${100 - (priceRange[1] / MAX_PRICE) * 100}%`,
            }}
          />

          {/* Min Thumb Input */}
          <input
            type="range"
            min={MIN_PRICE}
            max={MAX_PRICE}
            step={PRICE_STEP}
            value={priceRange[0]}
            onChange={(e) => {
              const val = Math.min(Number(e.target.value), priceRange[1] - PRICE_STEP);
              setPriceRange([val, priceRange[1]]);
              setPage(1);
            }}
            className="pointer-events-auto absolute z-30 h-7 w-full appearance-none bg-transparent opacity-0 cursor-pointer touch-none"
          />

          {/* Max Thumb Input */}
          <input
            type="range"
            min={MIN_PRICE}
            max={MAX_PRICE}
            step={PRICE_STEP}
            value={priceRange[1]}
            onChange={(e) => {
              const val = Math.max(Number(e.target.value), priceRange[0] + PRICE_STEP);
              setPriceRange([priceRange[0], val]);
              setPage(1);
            }}
            className="pointer-events-auto absolute z-30 h-7 w-full appearance-none bg-transparent opacity-0 cursor-pointer touch-none"
          />

          {/* Visible Min Circle */}
          <div
            className="pointer-events-none absolute z-20 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white bg-[#1D5CA9] shadow-md transition-transform"
            style={{
              left: `${(priceRange[0] / MAX_PRICE) * 100}%`,
            }}
          />

          {/* Visible Max Circle */}
          <div
            className="pointer-events-none absolute z-20 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white bg-[#1D5CA9] shadow-md transition-transform"
            style={{
              left: `${(priceRange[1] / MAX_PRICE) * 100}%`,
            }}
          />
        </div>

        <div className="flex justify-between text-[11px] font-semibold text-slate-400">
          <span>₹0</span>
          <span>₹20 Cr</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#FDFDFD] pb-28 sm:pb-20 dark:bg-dark-bg">
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
              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setMobileFilters(true)}
                className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-800 transition hover:bg-slate-100 lg:hidden"
              >
                <SlidersHorizontal size={15} className="text-[#1D5CA9]" />
                <span>{t('buy.filterButton') || 'Filters'}</span>
              </button>

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

        {/* MOBILE FILTER MODAL DRAWER */}
        {mobileFilters ? (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 p-0 sm:p-4">
            <div className="fixed inset-0" onClick={() => setMobileFilters(false)} />
            <div className="relative z-10 flex flex-col w-full max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl transition-all">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-[#1D5CA9]" />
                  <h2 className="text-base font-bold text-slate-900">{t('buy.filterHeading') || 'Filters'}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-bold uppercase tracking-wider text-[#1D5CA9] hover:underline"
                  >
                    {t('buy.reset') || 'Reset'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileFilters(false)}
                    aria-label="Close filters"
                    className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-700 transition hover:bg-slate-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable Filter Form Controls */}
              <div className="flex-1 overflow-y-auto py-4 pr-1">
                {filters}
              </div>

              {/* Sticky Action Footer */}
              <div className="border-t border-slate-100 pt-3.5 pb-2">
                <button
                  type="button"
                  onClick={() => setMobileFilters(false)}
                  className="w-full rounded-xl bg-[#1D5CA9] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-[#1D5CA9]/90 active:scale-[0.99]"
                >
                  {t('buy.applyFilters') || 'Apply Filters'} ({filtered.length})
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* MAIN DESKTOP GRID: SIDEBAR & CARDS */}
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="hidden self-start rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:block">
            {filters}
          </aside>

          <div>
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
          </div>
        </div>
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
