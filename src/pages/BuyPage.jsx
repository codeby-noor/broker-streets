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

const locationGroups = {
  Surat: ['Vesu', 'Adajan', 'Pal', 'Piplod', 'Dumas', 'Althan', 'VIP Road', 'City Light'],
  Navsari: ['Gandevi', 'Bilimora', 'Chikhli', 'Jalalpore', 'Kabilpore', 'Amalsad', 'Maroli', 'Eru'],
};

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
  const [query, setQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All districts');
  const [selectedTaluka, setSelectedTaluka] = useState('All talukas');
  const [selectedVillage, setSelectedVillage] = useState('All villages');
  const [type, setType] = useState('All types');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [landArea, setLandArea] = useState('Any area');
  const [showSoldProperties, setShowSoldProperties] = useState(false);
  const [sort, setSort] = useState('relevance');
  const [page, setPage] = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState(null);
  const [listings, setListings] = useState(() => {
    const stored = readStorage(STORAGE_KEYS.listings, []);
    return Array.isArray(stored) && stored.length ? stored : sampleProperties;
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

  useEffect(() => {
    const stored = readStorage(STORAGE_KEYS.listings, []);
    setListings(Array.isArray(stored) && stored.length ? stored : sampleProperties);
    const cleanup = onListingsChanged(() => {
      const updated = readStorage(STORAGE_KEYS.listings, []);
      setListings(Array.isArray(updated) && updated.length ? updated : sampleProperties);
    });
    return cleanup;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const districtParam = params.get('district')?.trim();
    const talukaParam = params.get('taluka')?.trim();

    const validDistrict = districtParam
      ? districtOptions.find((district) => district.toLowerCase() === districtParam.toLowerCase()) || 'All districts'
      : 'All districts';

    const validTaluka = talukaParam && validDistrict !== 'All districts'
      ? (gujaratSubDistricts[validDistrict] || []).find((taluka) => taluka.toLowerCase() === talukaParam.toLowerCase()) || 'All talukas'
      : 'All talukas';

    setSelectedDistrict(validDistrict);
    setSelectedTaluka(validTaluka);
    setSelectedVillage('All villages');
    setPage(1);
  }, [location.search]);

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
      const matchesStatus = showSoldProperties || !isSold;

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
          <h2 className="text-lg font-semibold text-ink">Land filters</h2>
        </div>
        <button type="button" onClick={clearFilters} className="text-xs font-bold uppercase tracking-[0.12em] text-sage">
          Reset
        </button>
      </div>

      <label>
        <span className="field-label">Property Type</span>
        <select value={type} onChange={change(setType)} className="field-control">
          <option value="All types">All types</option>
          {propertyTypes.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>

      <label>
        <span className="field-label">District</span>
        <select value={selectedDistrict} onChange={(event) => { setSelectedDistrict(event.target.value); setPage(1); }} className="field-control">
          {districtOptions.map((district) => (
            <option key={district} value={district}>{district}</option>
          ))}
        </select>
      </label>

      {selectedDistrict !== 'All districts' ? (
        <label>
          <span className="field-label">Taluka</span>
          <select value={selectedTaluka} onChange={(event) => { setSelectedTaluka(event.target.value); setPage(1); }} className="field-control">
            {talukaOptions.map((taluka) => (
              <option key={taluka} value={taluka}>{taluka}</option>
            ))}
          </select>
        </label>
      ) : null}

      {selectedDistrict !== 'All districts' && selectedTaluka !== 'All talukas' ? (
        <label>
          <span className="field-label">Village</span>
          <select value={selectedVillage} onChange={(event) => { setSelectedVillage(event.target.value); setPage(1); }} className="field-control">
            {villageOptions.map((village) => (
              <option key={village} value={village}>{village}</option>
            ))}
          </select>
        </label>
      ) : null}

      <div>
        <span className="field-label">Price</span>
        <div className="grid grid-cols-2 gap-3">
          <input
            aria-label="Minimum price"
            type="number"
            min="0"
            value={minPrice}
            onChange={change(setMinPrice)}
            className="field-control"
            placeholder="Minimum"
          />
          <input
            aria-label="Maximum price"
            type="number"
            min="0"
            value={maxPrice}
            onChange={change(setMaxPrice)}
            className="field-control"
            placeholder="Maximum"
          />
        </div>
      </div>

      <label>
        <span className="field-label">Land Area</span>
        <select value={landArea} onChange={change(setLandArea)} className="field-control">
          <option value="Any area">Any area</option>
          <option value="Under 1000 Sq Ft">Under 1000 Sq Ft</option>
          <option value="1000–5000 Sq Ft">1000–5000 Sq Ft</option>
          <option value="5000+ Sq Ft">5000+ Sq Ft</option>
        </select>
      </label>

      <label>
        <span className="field-label">Sort by</span>
        <select value={sort} onChange={change(setSort)} className="field-control">
          <option value="relevance">Relevance</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </label>

      <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
        <input type="checkbox" checked={showSoldProperties} onChange={(event) => { setShowSoldProperties(event.target.checked); setPage(1); }} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
        <span className="text-sm font-medium text-slate-700">Show sold properties</span>
      </label>
    </div>
  );

  return (
    <div className="-mx-4 -mt-8 min-h-screen bg-[#FFFEFE] pb-20 sm:-mx-6 lg:-mx-8">
      <section className="bg-ink px-4 py-12 text-white sm:px-10 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow text-blue-100">Gujarat land collection</p>
          <h1 className="display-heading mt-4 text-4xl sm:text-6xl">Find land with confidence.</h1>
          <p className="mt-5 max-w-xl text-base text-white/65 sm:text-lg">Browse verified agricultural and non-agricultural land listings.</p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-10 sm:py-10 lg:px-12">
        {location.state?.justSubmitted && (
          <div className="mb-8 flex items-center justify-between border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-primary">
            <span>Your land preference has been received.</span>
            <button type="button" onClick={() => window.history.replaceState({}, '', '/buy')}>
              <X size={18} />
            </button>
          </div>
        )}

        <div className="mb-8 space-y-6 border-b border-stone-200 pb-8">
          <div className="grid gap-4 sm:grid-cols-[1.4fr_auto] sm:items-end">
            <div>
              <p className="eyebrow text-sage">Find Your Land</p>
              <h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Search verified agricultural and non-agricultural land.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">Use filters to narrow down by district, taluka, village, price, and land area.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setMobileFilters(true)}
                className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 lg:hidden"
              >
                <SlidersHorizontal size={18} className="mr-2" /> Filters
              </button>
              <button
                type="button"
                onClick={() => setMobileFilters(true)}
                className="hidden min-h-[46px] items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 lg:inline-flex"
              >
                Sort
                <ChevronDown size={16} className="ml-2" />
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
              <Search size={18} className="text-sage" />
              <input
                aria-label="Search land by village taluka or district"
                value={query}
                onChange={change(setQuery)}
                placeholder="Search by village, taluka or district"
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-800 outline-none"
              />
            </label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setMobileFilters(true)} className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 lg:hidden">
                Filters
              </button>
              <button type="button" className="hidden min-h-[46px] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 lg:inline-flex">
                Sort
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </div>

        {mobileFilters ? (
          <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 px-3 py-4 sm:px-6">
            <div className="absolute inset-0 overflow-y-auto">
              <div className="mx-auto mt-16 max-w-md rounded-[32px] bg-white p-4 shadow-xl sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-800">Filters</p>
                    <p className="text-sm text-slate-600">Refine your search before browsing listings.</p>
                  </div>
                  <button type="button" onClick={() => setMobileFilters(false)} className="rounded-full border border-slate-200 bg-slate-50 p-3.5 text-slate-700 transition hover:bg-slate-100">Close</button>
                </div>
                <div className="mt-6">{filters}</div>
                <div className="sticky bottom-0 left-0 right-0 mt-6 bg-white pt-4">
                  <button type="button" onClick={() => setMobileFilters(false)} className="w-full rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-dark">
                    Apply filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          <aside className="hidden self-start border border-stone-200 bg-white p-6 shadow-card lg:sticky lg:top-24 lg:block">{filters}</aside>
          <div className="space-y-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-ink">{filtered.length} land listings found</p>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 border border-stone-200 bg-white px-4 py-2.5">
                  <Search size={17} className="text-sage" />
                  <input
                    aria-label="Search land"
                    value={query}
                    onChange={change(setQuery)}
                    placeholder="Search by property name, city, or area"
                    className="min-w-0 border-0 bg-transparent text-sm outline-none"
                  />
                </label>
                <label className="flex items-center gap-1 border border-stone-200 bg-white px-3">
                  <select value={sort} onChange={change(setSort)} className="border-0 bg-transparent text-sm outline-none">
                    <option value="relevance">Relevance</option>
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price: low to high</option>
                    <option value="price_desc">Price: high to low</option>
                  </select>
                  <ChevronDown size={15} />
                </label>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-80 animate-pulse bg-slate-200" />
                ))}
              </div>
            ) : paged.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {paged.map((property) => (
                  <PropertyCard key={property.id} property={property} onContact={setContactModal} />
                ))}
              </div>
            ) : (
              <div className="border border-stone-200 bg-white px-8 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage/10 text-sage">
                  <Search size={28} />
                </div>
                <h2 className="mt-6 text-2xl font-semibold text-ink">No land listings match these filters</h2>
                <p className="mt-3 text-sm text-muted">Try a broader search or reset the filters to explore available agricultural and non-agricultural land.</p>
                <button type="button" onClick={clearFilters} className="mt-6 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-white">
                  Clear Filters
                </button>
              </div>
            )}

            {!loading && <Pagination currentPage={activePage} pageCount={pageCount} onChange={setPage} />}
          </div>
        </div>
      </main>

      <ContactModal open={Boolean(contactModal)} onClose={() => setContactModal(null)} data={contactModal || {}} title="Contact Seller" />
    </div>
  );
}

export default BuyPage;
