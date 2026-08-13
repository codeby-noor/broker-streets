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
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [landArea, setLandArea] = useState(t('buy.allAreas') || 'Any area');
  const [showSoldProperties, setShowSoldProperties] = useState(false);
  const [sort, setSort] = useState('relevance');
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
    const minimum = Number(minPrice) || 0;
    const maximum = Number(maxPrice) || Number.POSITIVE_INFINITY;

    const result = listings.filter((property) => {
      const searchText = `${property.title || ''} ${property.city || ''} ${property.location || ''} ${property.type || property.propertyType || ''}`.toLowerCase();
      const matchesSearch = !normalized || searchText.includes(normalized);
      const matchesDistrict = selectedDistrict === 'All districts' || property.district === selectedDistrict || property.location === selectedDistrict || property.city === selectedDistrict;
      const matchesTaluka = selectedTaluka === 'All talukas' || property.subDistrict === selectedTaluka || property.taluka === selectedTaluka;
      const matchesVillage = selectedVillage === 'All villages' || property.village === selectedVillage;
      const matchesType = type === 'All types' || property.type === type || property.propertyType === type;
      const price = priceNumber(property.priceAmount || property.price);
      const matchesBudget = price >= minimum && price <= maximum;
      const size = landSizeInSqFt(property.landArea || property.area);
      const matchesArea =
        landArea === 'Any area' ||
        (landArea === 'Under 1000 Sq Ft' && size < 1000) ||
        (landArea === '1000–5000 Sq Ft' && size >= 1000 && size <= 5000) ||
        (landArea === '5000+ Sq Ft' && size > 5000);
      const isSold = String(property.status || 'Available').toLowerCase() === 'sold';
      const isUnavailable = String(property.status || 'Available').toLowerCase() === 'unavailable';
      const matchesStatus = showSoldProperties || (!isSold && !isUnavailable);

      return matchesSearch && matchesDistrict && matchesTaluka && matchesVillage && matchesType && matchesBudget && matchesArea && matchesStatus;
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
  }, [listings, query, selectedDistrict, selectedTaluka, selectedVillage, type, minPrice, maxPrice, landArea, showSoldProperties, sort]);

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
    setMinPrice('');
    setMaxPrice('');
    setLandArea('Any area');
    setShowSoldProperties(false);
    setSort('relevance');
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-sage" />
          <h2 className="text-lg font-semibold text-ink">{t('buy.filterHeading')}</h2>
        </div>
        <button type="button" onClick={clearFilters} className="text-xs font-bold uppercase tracking-[0.12em] text-sage">
          {t('buy.reset')}
        </button>
      </div>

      <label>
        <span className="field-label">{t('buy.propertyType')}</span>
        <select value={type} onChange={change(setType)} className="field-control">
          <option value="All types">{t('buy.allTypes')}</option>
          {propertyTypes.map((item) => (
            <option key={item} value={item}>
              {item === 'Agricultural Land' ? t('buyerForm.agriculturalLand') : item === 'Non-Agricultural Land' ? t('buyerForm.nonAgriculturalLand') : item}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="field-label">{t('buy.district')}</span>
        <select value={selectedDistrict} onChange={(event) => { setSelectedDistrict(event.target.value); setPage(1); }} className="field-control">
          {districtOptions.map((district) => (
            <option key={district} value={district}>
              {district === 'All districts' ? t('buy.allDistricts') : t(district)}
            </option>
          ))}
        </select>
      </label>

      {selectedDistrict !== 'All districts' ? (
        <label>
          <span className="field-label">{t('common.taluka')}</span>
          <select value={selectedTaluka} onChange={(event) => { setSelectedTaluka(event.target.value); setPage(1); }} className="field-control">
            {talukaOptions.map((taluka) => (
              <option key={taluka} value={taluka}>
                {taluka === 'All talukas' ? t('buy.allTalukas') : t(taluka)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {selectedDistrict !== 'All districts' && selectedTaluka !== 'All talukas' ? (
        <label>
          <span className="field-label">{t('buy.village')}</span>
          <select value={selectedVillage} onChange={(event) => { setSelectedVillage(event.target.value); setPage(1); }} className="field-control">
            {villageOptions.map((village) => (
              <option key={village} value={village}>
                {village === 'All villages' ? t('buy.allVillages') : t(village)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div>
        <span className="field-label">{t('buy.price')}</span>
        <div className="grid grid-cols-2 gap-3">
          <input
            aria-label={t('buy.minPrice')}
            type="number"
            min="0"
            value={minPrice}
            onChange={change(setMinPrice)}
            className="field-control"
            placeholder={t('buy.minPrice')}
          />
          <input
            aria-label={t('buy.maxPrice')}
            type="number"
            min="0"
            value={maxPrice}
            onChange={change(setMaxPrice)}
            className="field-control"
            placeholder={t('buy.maxPrice')}
          />
        </div>
      </div>

      <label>
        <span className="field-label">{t('buy.landArea')}</span>
        <select value={landArea} onChange={change(setLandArea)} className="field-control">
          <option value="Any area">{t('buy.allAreas')}</option>
          <option value="Under 1000 Sq Ft">{t('dropdown.under1000SqFt')}</option>
          <option value="1000–5000 Sq Ft">{t('dropdown.sqFt1000To5000')}</option>
          <option value="5000+ Sq Ft">{t('dropdown.sqFt5000Plus')}</option>
        </select>
      </label>

      <label>
        <span className="field-label">{t('buy.sortBy')}</span>
        <select value={sort} onChange={change(setSort)} className="field-control">
          <option value="relevance">{t('dropdown.relevance')}</option>
          <option value="newest">{t('dropdown.newest')}</option>
          <option value="price_asc">{t('dropdown.priceLowToHigh')}</option>
          <option value="price_desc">{t('dropdown.priceHighToLow')}</option>
        </select>
      </label>

      <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
        <input type="checkbox" checked={showSoldProperties} onChange={(event) => { setShowSoldProperties(event.target.checked); setPage(1); }} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
        <span className="text-sm font-medium text-slate-700">{t('buy.showSold')}</span>
      </label>
    </div>
  );

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#FFFEFE] pb-20">
      <section className="bg-ink px-4 py-10 text-white sm:px-10 sm:py-14 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow text-blue-100">{t('buy.heroCollection')}</p>
          <h1 className="display-heading mt-4 text-3xl leading-tight sm:text-6xl">{t('buy.pageTitle')}</h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/65 sm:text-lg">{t('buy.subtitle')}</p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-12">
        {location.state?.justSubmitted && (
          <div className="mb-8 flex items-center justify-between border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-primary">
            <span>{t('contact.modalDescription')}</span>
            <button type="button" onClick={() => window.history.replaceState({}, '', '/buy')}>
              <X size={18} />
            </button>
          </div>
        )}

        <div className="mb-8 space-y-6 border-b border-stone-200 pb-8">
          <div className="grid gap-4 sm:grid-cols-[1.4fr_auto] sm:items-end">
            <div>
              <p className="eyebrow text-sage">{t('buy.findYourLandTitle')}</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink sm:text-4xl">{t('buy.findYourLandHeading')}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:leading-7">{t('buy.findYourLandDescription')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setMobileFilters(true)}
                className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 lg:hidden"
              >
                <SlidersHorizontal size={18} className="mr-2" /> {t('buy.filterButton')}
              </button>
              <button
                type="button"
                onClick={() => setMobileFilters(true)}
                className="hidden min-h-[46px] items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 lg:inline-flex"
              >
                {t('buy.sortButton')}
                <ChevronDown size={16} className="ml-2" />
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
              <Search size={18} className="text-sage" />
              <input
                aria-label={t('buy.searchTitle')}
                value={query}
                onChange={change(setQuery)}
                placeholder={t('buy.searchAll')}
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-800 outline-none"
              />
            </label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setMobileFilters(true)} className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 lg:hidden">
                {t('buy.filterButton')}
              </button>
              <button type="button" className="hidden min-h-[46px] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 lg:inline-flex">
                {t('buy.sortButton')}
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </div>

        {mobileFilters ? (
          <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 px-3 py-4 sm:px-6">
            <div className="absolute inset-0 overflow-y-auto">
              <div className="mx-auto mt-12 max-w-md max-h-[85vh] overflow-y-auto rounded-[32px] bg-white p-4 shadow-xl sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-800">{t('buy.filters')}</p>
                    <p className="text-sm text-slate-600">{t('buy.mobileFilters')}</p>
                  </div>
                  <button type="button" onClick={() => setMobileFilters(false)} className="rounded-full border border-slate-200 bg-slate-50 p-3.5 text-slate-700 transition hover:bg-slate-100">{t('buy.close')}</button>
                </div>
                <div className="mt-6">{filters}</div>
                <div className="sticky bottom-0 left-0 right-0 mt-6 bg-white pt-4">
                  <button type="button" onClick={() => setMobileFilters(false)} className="w-full rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-dark">
                    {t('buy.applyFilters')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="hidden self-start border border-stone-200 bg-white p-6 shadow-card lg:sticky lg:top-24 lg:block">{filters}</aside>
          <div className="space-y-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-ink">{filtered.length} {t('buy.propertyResultLabel')}</p>
              <div className="flex flex-wrap gap-3">
                <label className="flex min-w-0 flex-1 items-center gap-2 border border-stone-200 bg-white px-4 py-2.5 sm:min-w-[210px]">
                  <Search size={17} className="text-sage" />
                  <input
                    aria-label={t('buy.searchTitle')}
                    value={query}
                    onChange={change(setQuery)}
                    placeholder={t('buy.searchAll')}
                    className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                  />
                </label>
                <label className="flex items-center gap-1 border border-stone-200 bg-white px-3">
                  <select value={sort} onChange={change(setSort)} className="border-0 bg-transparent text-sm outline-none">
                    <option value="relevance">{t('dropdown.relevance')}</option>
                    <option value="newest">{t('dropdown.newest')}</option>
                    <option value="price_asc">{t('dropdown.priceLowToHigh')}</option>
                    <option value="price_desc">{t('dropdown.priceHighToLow')}</option>
                  </select>
                  <ChevronDown size={15} />
                </label>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-80 animate-pulse bg-slate-200" />
                ))}
              </div>
            ) : paged.length ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {paged.map((property) => (
                  <PropertyCard key={property.id} property={property} onContact={setContactModal} />
                ))}
              </div>
            ) : (
              <div className="border border-stone-200 bg-white px-8 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage/10 text-sage">
                  <Search size={28} />
                </div>
                <h2 className="mt-6 text-2xl font-semibold text-ink">{t('buy.noResults')}</h2>
                <p className="mt-3 text-sm text-muted">{t('buy.noResultsDetail')}</p>
                <button type="button" onClick={clearFilters} className="mt-6 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-white">
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
