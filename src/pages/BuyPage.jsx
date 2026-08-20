import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { propertyTypes, sampleProperties } from '../utils/data';
import { gujaratDistricts, gujaratSubDistricts, gujaratVillages } from '../utils/data';
import { onListingsChanged, readStorage, STORAGE_KEYS } from '../utils/storage';
import Pagination from '../components/Pagination';
import ContactModal from '../components/ContactModal';
import PropertyCard from '../components/PropertyCard';
import SectionHeading from '../components/SectionHeading';
import { useLanguage } from '../i18n/LanguageContext';
import { formatIndianPrice } from '../utils/format';

const priceNumber = (value) => Number(String(value || '').replace(/[^0-9]/g, '')) || 0;
const landSizeInSqFt = (value) => {
  const normalized = String(value || '').toLowerCase().trim();
  if (!normalized) return 0;
  const number = Number(normalized.replace(/[^0-9.]/g, '')) || 0;
  if (normalized.includes('acre')) return number * 43560;
  if (normalized.includes('sq yd') || normalized.includes('sqyd') || normalized.includes('sq. yd')) return number * 9;
  if (normalized.includes('sq m') || normalized.includes('sqm')) return number * 10.764;
  return number;
};

function BuyPage() {
  const location = useLocation();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(t('buy.allDistricts') || 'All districts');
  const [selectedTaluka, setSelectedTaluka] = useState(t('buy.allTalukas') || 'All talukas');
  const [selectedVillage, setSelectedVillage] = useState(t('buy.allVillages') || 'All villages');
  const [type, setType] = useState(t('buy.allTypes') || 'All types');
  const [showSoldProperties, setShowSoldProperties] = useState(false);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [loading, setLoading] = useState(true);
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

  const MIN_PRICE = 0;
  const MAX_PRICE = 100000000; // ₹10 Cr

  const [priceRange, setPriceRange] = useState([MIN_PRICE, MAX_PRICE]);

  const perPage = 9;
  const districtOptions = ['All districts', ...gujaratDistricts];
  const talukaOptions = selectedDistrict === 'All districts' ? [] : ['All talukas', ...(gujaratSubDistricts[selectedDistrict] || [])];
  const villageOptions = selectedDistrict === 'All districts' || selectedTaluka === 'All talukas' || !selectedTaluka ? [] : ['All villages', ...(gujaratVillages[selectedDistrict]?.[selectedTaluka] || [])];

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    setSelectedTaluka('All talukas');
    setSelectedVillage('All villages');
  }, [selectedDistrict]);

  useEffect(() => {
    setSelectedVillage('All villages');
  }, [selectedTaluka]);

  const dedupeListings = (source) => {
    const uniqueMap = new Map();
    (Array.isArray(source) ? source : []).forEach((item) => {
      if (item && item.id && !uniqueMap.has(String(item.id))) uniqueMap.set(String(item.id), item);
    });
    return Array.from(uniqueMap.values());
  };

  useEffect(() => {
    const stored = readStorage(STORAGE_KEYS.listings, []);
    setListings(dedupeListings(Array.isArray(stored) && stored.length ? stored : sampleProperties));
    const cleanup = onListingsChanged(() => {
      const updated = readStorage(STORAGE_KEYS.listings, []);
      setListings(dedupeListings(Array.isArray(updated) && updated.length ? updated : sampleProperties));
    });
    return cleanup;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const districtParam = (params.get('district') || params.get('location'))?.trim();
    const talukaParam = params.get('taluka')?.trim();
    const typeParam = params.get('type')?.trim();

    const validDistrict = districtParam
      ? districtOptions.find((district) => district.toLowerCase() === districtParam.toLowerCase()) || t('buy.allDistricts') || 'All districts'
      : t('buy.allDistricts') || 'All districts';

    const validTaluka = talukaParam && validDistrict !== (t('buy.allDistricts') || 'All districts')
      ? (gujaratSubDistricts[validDistrict] || []).find((taluka) => taluka.toLowerCase() === talukaParam.toLowerCase()) || t('buy.allTalukas') || 'All talukas'
      : t('buy.allTalukas') || 'All talukas';

    if (typeParam) {
      const validTypes = propertyTypes || ['Agricultural Land', 'Non-Agricultural Land'];
      const foundType = validTypes.find((tItem) => tItem.toLowerCase() === typeParam.toLowerCase());
      if (foundType) {
        setType(foundType);
      }
    }

    setSelectedDistrict(validDistrict);
    setSelectedTaluka(validTaluka);
    setSelectedVillage(t('buy.allVillages') || 'All villages');
    setPage(1);
  }, [location.search, t]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const minimum = priceRange[0];
    const maximum = priceRange[1] >= MAX_PRICE ? Number.POSITIVE_INFINITY : priceRange[1];

    const result = listings.filter((property) => {
      const searchText = `${property.title || ''} ${property.city || ''} ${property.location || ''} ${property.type || property.propertyType || ''}`.toLowerCase();
      const matchesSearch = !normalized || searchText.includes(normalized);
      const matchesDistrict = selectedDistrict === 'All districts' || property.district === selectedDistrict || property.location === selectedDistrict || property.city === selectedDistrict;
      const matchesTaluka = selectedTaluka === 'All talukas' || property.subDistrict === selectedTaluka || property.taluka === selectedTaluka;
      const matchesVillage = selectedVillage === 'All villages' || property.village === selectedVillage;
      const matchesType = type === 'All types' || property.type === type || property.propertyType === type;
      const price = priceNumber(property.priceAmount || property.price);
      const matchesBudget = price >= minimum && price <= maximum;
      const isSold = String(property.status || 'Available').toLowerCase() === 'sold';
      const isUnavailable = String(property.status || 'Available').toLowerCase() === 'unavailable';
      const matchesStatus = showSoldProperties || (!isSold && !isUnavailable);

      return matchesSearch && matchesDistrict && matchesTaluka && matchesVillage && matchesType && matchesBudget && matchesStatus;
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
  }, [listings, query, selectedDistrict, selectedTaluka, selectedVillage, type, priceRange, showSoldProperties, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const activePage = Math.min(page, pageCount);
  const paged = filtered.slice((activePage - 1) * perPage, activePage * perPage);

  const change = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedDistrict('All districts');
    setSelectedTaluka('All talukas');
    setSelectedVillage('All villages');
    setType('All types');
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    setShowSoldProperties(false);
    setSort('newest');
    setPage(1);
  };

  useEffect(() => {
    document.body.style.overflow = mobileFilters ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFilters]);

  const filters = (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-sage" />
          <h2 className="text-base font-bold text-slate-900">{t('buy.filterHeading')}</h2>
        </div>
        <button type="button" onClick={clearFilters} className="text-xs font-bold uppercase tracking-wider text-sage hover:underline">
          {t('buy.reset')}
        </button>
      </div>

      <label className="block">
        <span className="field-label">{t('buy.propertyType')}</span>
        <select value={type} onChange={change(setType)} className="field-control w-full">
          <option value="All types">{t('buy.allTypes')}</option>
          {propertyTypes.map((item) => (
            <option key={item} value={item}>
              {item === 'Agricultural Land' ? t('buyerForm.agriculturalLand') : item === 'Non-Agricultural Land' ? t('buyerForm.nonAgriculturalLand') : item}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="field-label">{t('buy.district')}</span>
        <select value={selectedDistrict} onChange={(event) => { setSelectedDistrict(event.target.value); setPage(1); }} className="field-control w-full">
          {districtOptions.map((district) => (
            <option key={district} value={district}>
              {district === 'All districts' ? t('buy.allDistricts') : t(district)}
            </option>
          ))}
        </select>
      </label>

      {selectedDistrict !== 'All districts' ? (
        <label className="block">
          <span className="field-label">{t('common.taluka')}</span>
          <select value={selectedTaluka} onChange={(event) => { setSelectedTaluka(event.target.value); setPage(1); }} className="field-control w-full">
            {talukaOptions.map((taluka) => (
              <option key={taluka} value={taluka}>
                {taluka === 'All talukas' ? t('buy.allTalukas') : t(taluka)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {selectedDistrict !== 'All districts' && selectedTaluka !== 'All talukas' ? (
        <label className="block">
          <span className="field-label">{t('buy.village')}</span>
          <select value={selectedVillage} onChange={(event) => { setSelectedVillage(event.target.value); setPage(1); }} className="field-control w-full">
            {villageOptions.map((village) => (
              <option key={village} value={village}>
                {village === 'All villages' ? t('buy.allVillages') : t(village)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {/* DUAL-HANDLE PRICE RANGE SLIDER (FIXED RANGE: ₹0 - ₹10 Cr) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="field-label">{t('buy.price')}</span>
          <span className="text-xs font-bold text-[#1D5CA9]">
            {formatIndianPrice(priceRange[0])} — {formatIndianPrice(priceRange[1])}
          </span>
        </div>

        <div className="relative my-3 flex h-6 w-full items-center select-none">
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
            step={500000}
            value={priceRange[0]}
            onChange={(e) => {
              const val = Math.min(Number(e.target.value), priceRange[1] - 500000);
              setPriceRange([val, priceRange[1]]);
              setPage(1);
            }}
            className="pointer-events-auto absolute z-30 h-6 w-full appearance-none bg-transparent opacity-0 cursor-pointer"
          />

          {/* Max Thumb Input */}
          <input
            type="range"
            min={MIN_PRICE}
            max={MAX_PRICE}
            step={500000}
            value={priceRange[1]}
            onChange={(e) => {
              const val = Math.max(Number(e.target.value), priceRange[0] + 500000);
              setPriceRange([priceRange[0], val]);
              setPage(1);
            }}
            className="pointer-events-auto absolute z-30 h-6 w-full appearance-none bg-transparent opacity-0 cursor-pointer"
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
          <span>₹10 Cr</span>
        </div>
      </div>

      <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <input type="checkbox" checked={showSoldProperties} onChange={(event) => { setShowSoldProperties(event.target.checked); setPage(1); }} className="h-4 w-4 rounded border-slate-300 text-[#1D5CA9] focus:ring-[#1D5CA9]" />
        <span className="text-xs font-semibold text-slate-700">{t('buy.showSold')}</span>
      </label>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#FDFDFD] pb-28 sm:pb-20 dark:bg-dark-bg">
      <section className="bg-[#1D5CA9] px-4 py-8 text-white sm:px-8 sm:py-12 lg:px-12 dark:bg-dark-card dark:border-b dark:border-dark-border">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow text-white/80">{t('buy.heroCollection')}</p>
          <h1 className="display-heading mt-2 text-2xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">{t('buy.pageTitle')}</h1>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-white/80 sm:text-base">{t('buy.subtitle')}</p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {location.state?.justSubmitted && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-[#1D5CA9]">
            <span>{t('contact.modalDescription')}</span>
            <button type="button" onClick={() => window.history.replaceState({}, '', '/buy')}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* TOP SEARCH & UNIFIED SORT BAR */}
        <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                aria-label={t('buy.searchTitle')}
                value={query}
                onChange={change(setQuery)}
                placeholder={t('buy.searchAll')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 outline-none transition focus:border-[#1D5CA9] focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setMobileFilters(true)}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800 transition hover:bg-slate-100 lg:hidden"
              >
                <SlidersHorizontal size={15} className="text-[#1D5CA9]" />
                <span>{t('buy.filterButton')}</span>
              </button>

              {/* SINGLE UNIFIED SORT BY DROPDOWN */}
              <div className="relative flex min-h-[42px] items-center rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 transition hover:bg-slate-100">
                <span className="mr-2 text-xs font-bold uppercase tracking-wider text-slate-500 hidden sm:inline">{t('buy.sortBy')}:</span>
                <select
                  value={sort}
                  onChange={change(setSort)}
                  className="bg-transparent pr-6 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="newest">{t('dropdown.newest')}</option>
                  <option value="oldest">{t('dropdown.oldest')}</option>
                  <option value="price_asc">{t('dropdown.priceLowToHigh')}</option>
                  <option value="price_desc">{t('dropdown.priceHighToLow')}</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>

              {/* Matching Property Count */}
              <span className="rounded-xl bg-[#1D5CA9]/10 px-3 py-2 text-xs font-bold text-[#1D5CA9]">
                {filtered.length} {t('buy.propertyResultLabel')}
              </span>
            </div>
          </div>
        </div>

        {/* MOBILE FILTER MODAL DRAWER */}
        {mobileFilters ? (
          <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 px-3 py-4 sm:px-6">
            <div className="absolute inset-0 overflow-y-auto">
              <div className="mx-auto mt-12 max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-5 shadow-xl">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-800">{t('buy.filters')}</p>
                    <p className="text-xs text-slate-500">{t('buy.mobileFilters')}</p>
                  </div>
                  <button type="button" onClick={() => setMobileFilters(false)} className="rounded-full border border-slate-200 bg-slate-50 p-2.5 text-slate-700 transition hover:bg-slate-100">
                    <X size={16} />
                  </button>
                </div>
                <div className="mt-5">{filters}</div>
                <div className="sticky bottom-0 left-0 right-0 mt-6 bg-white pt-4">
                  <button type="button" onClick={() => setMobileFilters(false)} className="w-full rounded-xl bg-[#1D5CA9] px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#1D5CA9]/90">
                    {t('buy.applyFilters')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* MAIN DESKTOP GRID: SIDEBAR & CARDS */}
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="hidden self-start rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:block">{filters}</aside>
          <div className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-80 animate-pulse rounded-2xl bg-slate-200/60" />
                ))}
              </div>
            ) : paged.length ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {paged.map((property) => (
                  <PropertyCard key={property.id} property={property} onContact={setContactModal} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/80 bg-white px-8 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1D5CA9]/10 text-[#1D5CA9]">
                  <Search size={24} />
                </div>
                <h2 className="mt-4 text-xl font-bold text-slate-900">{t('buy.noResults')}</h2>
                <p className="mt-2 text-xs text-slate-500">{t('buy.noResultsDetail')}</p>
                <button type="button" onClick={clearFilters} className="mt-5 rounded-xl bg-[#1D5CA9] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1D5CA9]/90">
                  {t('buy.clearFilters')}
                </button>
              </div>
            )}

            {!loading && <Pagination currentPage={activePage} pageCount={pageCount} onChange={setPage} />}
          </div>
        </div>
      </main>

      <ContactModal open={Boolean(contactModal)} onClose={() => setContactModal(null)} data={contactModal || {}} title={t('buy.contactSeller')} />
    </div>
  );
}

export default BuyPage;
