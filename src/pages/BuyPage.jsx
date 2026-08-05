import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { propertyTypes, sampleProperties } from '../utils/data';
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
  const [selectedLocation, setSelectedLocation] = useState('All locations');
  const [type, setType] = useState('All types');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [landArea, setLandArea] = useState('Any area');
  const [sort, setSort] = useState('relevance');
  const [page, setPage] = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [showSold, setShowSold] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState(null);
  const [listings, setListings] = useState(() => {
    const stored = readStorage(STORAGE_KEYS.listings, []);
    return Array.isArray(stored) && stored.length ? stored : sampleProperties;
  });
  const perPage = 9;

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const stored = readStorage(STORAGE_KEYS.listings, []);
    setListings(Array.isArray(stored) && stored.length ? stored : sampleProperties);
    const cleanup = onListingsChanged(() => {
      const updated = readStorage(STORAGE_KEYS.listings, []);
      setListings(Array.isArray(updated) && updated.length ? updated : sampleProperties);
    });
    return cleanup;
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const minimum = Number(minPrice) || 0;
    const maximum = Number(maxPrice) || Number.POSITIVE_INFINITY;

    return sampleProperties.filter((property) => {
      const searchable = `${property.title} ${property.city} ${property.location} ${property.type}`.toLowerCase();
      const matchesSearch = !normalized || searchable.includes(normalized);
      const matchesLocation = selectedLocation === 'All locations' || property.location === selectedLocation || property.city === selectedLocation;
      const matchesType = type === 'All types' || property.type === type;
      const price = priceNumber(property.price);
      const matchesBudget = price >= minimum && price <= maximum;
      const size = landSizeInSqFt(property.landArea || property.area);
      const matchesArea =
        landArea === 'Any area' ||
        (landArea === 'Under 1000 Sq Ft' && size < 1000) ||
        (landArea === '1000–5000 Sq Ft' && size >= 1000 && size <= 5000) ||
        (landArea === '5000+ Sq Ft' && size > 5000);
      const matchesSold = showSold || property.status !== 'Sold';

      return matchesSearch && matchesLocation && matchesType && matchesBudget && matchesArea && matchesSold;
    }).sort((a, b) => {
      if (sort === 'newest') return String(b.uploadedDate || b.id).localeCompare(String(a.uploadedDate || a.id));
      if (sort === 'price_asc') return priceNumber(a.price) - priceNumber(b.price);
      if (sort === 'price_desc') return priceNumber(b.price) - priceNumber(a.price);
      return 0;
    });
  }, [query, selectedLocation, type, minPrice, maxPrice, landArea, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const change = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedLocation('All locations');
    setType('All types');
    setMinPrice('');
    setMaxPrice('');
    setLandArea('Any area');
    setSort('relevance');
    setPage(1);
  };

  const filters = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-sage" />
          <h2 className="text-lg font-semibold text-ink">Land filters</h2>
        </div>
        <button type="button" onClick={clearFilters} className="text-xs font-bold uppercase tracking-[0.12em] text-sage">
          Clear all
        </button>
      </div>

      <label>
        <span className="field-label">City / Area</span>
        <select value={selectedLocation} onChange={change(setSelectedLocation)} className="field-control">
          <option>All locations</option>
          {Object.entries(locationGroups).map(([cityName, areas]) => (
            <optgroup key={cityName} label={cityName}>
              {areas.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label>
        <span className="field-label">Property Type</span>
        <select value={type} onChange={change(setType)} className="field-control">
          <option>All types</option>
          {propertyTypes.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>

      <div>
        <span className="field-label">Budget</span>
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
          <option>Any area</option>
          <option>Under 1000 Sq Ft</option>
          <option>1000–5000 Sq Ft</option>
          <option>5000+ Sq Ft</option>
        </select>
      </label>
    </div>
  );

  return (
    <div className="-mx-4 -mt-8 min-h-screen bg-[#FFFEFE] pb-20 sm:-mx-6 lg:-mx-8">
      <section className="bg-ink px-6 py-16 text-white sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow text-blue-100">Gujarat land collection</p>
          <h1 className="display-heading mt-4 text-5xl sm:text-6xl">Find land with confidence.</h1>
          <p className="mt-5 max-w-xl text-lg text-white/65">Browse verified agricultural and non-agricultural land listings.</p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-12">
        {location.state?.justSubmitted && (
          <div className="mb-8 flex items-center justify-between border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-primary">
            <span>Your land preference has been received.</span>
            <button type="button" onClick={() => window.history.replaceState({}, '', '/buy')}>
              <X size={18} />
            </button>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 border-b border-stone-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <SectionHeading eyebrow="Land listings" title="Property collection" description="Filter by location, land type, budget, and land area." />
            <label className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
              <input type="checkbox" checked={showSold} onChange={(event) => setShowSold(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary" />
              Show sold properties
            </label>
          </div>
          <button
            type="button"
            onClick={() => setMobileFilters(true)}
            className="rounded-full border border-stone-200 px-5 py-3 text-sm font-semibold lg:hidden"
          >
            <SlidersHorizontal size={17} className="inline" /> Filters
          </button>
        </div>

        {mobileFilters ? (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-md rounded-[32px] bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-800">Filters</p>
                  <p className="text-sm text-slate-600">Refine your search before browsing listings.</p>
                </div>
                <button type="button" onClick={() => setMobileFilters(false)} className="rounded-full border border-slate-200 bg-slate-50 p-3 text-slate-700 transition hover:bg-slate-100">Close</button>
              </div>
              <div className="mt-6">{filters}</div>
              <div className="mt-6 flex justify-end">
                <button type="button" onClick={() => setMobileFilters(false)} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark">Apply filters</button>
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
                    placeholder="Search property, city, or area"
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
                <Search size={30} className="mx-auto text-sage" />
                <h2 className="mt-5 text-2xl font-semibold text-ink">No land listings found</h2>
                <p className="mt-3 text-sm text-muted">Adjust filters or search terms to find land matching your criteria.</p>
                <button type="button" onClick={clearFilters} className="mt-6 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-white">
                  Clear Filters
                </button>
              </div>
            )}

            {!loading && <Pagination currentPage={page} pageCount={pageCount} onChange={setPage} />}
          </div>
        </div>
      </main>

      <ContactModal open={Boolean(contactModal)} onClose={() => setContactModal(null)} data={contactModal || {}} title="Contact Seller" />

      {mobileFilters && (
        <div className="fixed inset-0 z-50 bg-ink/40 lg:hidden">
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto bg-cream p-6">
            <button type="button" onClick={() => setMobileFilters(false)} className="float-right">
              <X size={20} />
            </button>
            {filters}
            <button type="button" onClick={() => setMobileFilters(false)} className="mt-8 w-full rounded-full bg-sage py-3 text-white">
              Show {filtered.length} listings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuyPage;
