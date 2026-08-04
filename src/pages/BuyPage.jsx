import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import {
  amenities,
  gujaratDistricts,
  gujaratSubDistricts,
  propertyTypes,
  sampleProperties,
} from '../utils/data';
import Pagination from '../components/Pagination';
import PropertyCard from '../components/PropertyCard';
import SectionHeading from '../components/SectionHeading';

function BuyPage() {
  const location = useLocation();
  const [type, setType] = useState('All types');
  const [district, setDistrict] = useState('All districts');
  const [subDistrict, setSubDistrict] = useState('All sub districts');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [bhk, setBhk] = useState('Any BHK');
  const [bathrooms, setBathrooms] = useState('Any bathrooms');
  const [area, setArea] = useState('Any area');
  const [status, setStatus] = useState('All status');
  const [furnished, setFurnished] = useState(false);
  const [parking, setParking] = useState(false);
  const [readyToMove, setReadyToMove] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('relevance');
  const [page, setPage] = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const perPage = 9;

  const districtOptions = Array.isArray(gujaratDistricts) ? gujaratDistricts : [];
  const propertyTypeOptions = Array.isArray(propertyTypes) ? propertyTypes : [];
  const amenityOptions = Array.isArray(amenities) ? amenities : [];
  const subDistrictOptions = Array.isArray(gujaratSubDistricts?.[district]) ? gujaratSubDistricts[district] : [];

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    setSubDistrict('All sub districts');
  }, [district]);

  const filtered = useMemo(() => {
    let list = (Array.isArray(sampleProperties) ? sampleProperties : []).filter((property) => {
      const priceValue = Number(String(property.price || '').replace(/[^0-9]/g, '')) || 0;
      const propertyDistrict = property.district || property.city || property.location || '';
      const propertySubDistrict = property.subDistrict || property.location || '';
      const matchesDistrict = district === 'All districts' || propertyDistrict === district;
      const matchesSubDistrict = subDistrict === 'All sub districts' || propertySubDistrict === subDistrict;
      const matchesType = type === 'All types' || property.type === type;
      const matchesPrice = priceValue >= minPrice && priceValue <= maxPrice;
      const matchesBhk = bhk === 'Any BHK' || `${property.bedrooms} BHK` === bhk;
      const matchesBathrooms = bathrooms === 'Any bathrooms' || `${property.bathrooms} bathrooms` === bathrooms;
      const areaValue = Number(String(property.area || '').replace(/[^0-9]/g, '')) || 0;
      const matchesArea = area === 'Any area' || (area === 'Under 1000 sqft' && areaValue < 1000) || (area === '1000 - 1400 sqft' && areaValue >= 1000 && areaValue <= 1400) || (area === '1400+ sqft' && areaValue > 1400);
      const matchesStatus = status === 'All status' || property.status === status;
      const matchesFurnished = !furnished || Boolean(property.furnished);
      const matchesParking = !parking || Boolean(property.parking);
      const matchesReady = !readyToMove || Boolean(property.readyToMove);
      const matchesAmenities = selectedAmenities.every((item) => (property.amenities || []).includes(item));
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery = !normalizedQuery || `${property.title || ''} ${property.location || ''} ${property.city || ''} ${property.district || ''} ${property.subDistrict || ''} ${property.type || ''}`.toLowerCase().includes(normalizedQuery);
      return matchesDistrict && matchesSubDistrict && matchesType && matchesPrice && matchesBhk && matchesBathrooms && matchesArea && matchesStatus && matchesFurnished && matchesParking && matchesReady && matchesAmenities && matchesQuery;
    });

    if (sort === 'price_asc') list = list.sort((a, b) => (Number(String(a.price || '').replace(/[^0-9]/g, '')) || 0) - (Number(String(b.price || '').replace(/[^0-9]/g, '')) || 0));
    if (sort === 'price_desc') list = list.sort((a, b) => (Number(String(b.price || '').replace(/[^0-9]/g, '')) || 0) - (Number(String(a.price || '').replace(/[^0-9]/g, '')) || 0));
    if (sort === 'area_asc') list = list.sort((a, b) => (Number(String(a.area || '').replace(/[^0-9]/g, '')) || 0) - (Number(String(b.area || '').replace(/[^0-9]/g, '')) || 0));
    if (sort === 'newest') list = list.sort((a, b) => String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true }));
    return list;
  }, [district, subDistrict, type, minPrice, maxPrice, bhk, bathrooms, area, status, furnished, parking, readyToMove, selectedAmenities, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const clearFilters = () => {
    setDistrict('All districts');
    setSubDistrict('All sub districts');
    setType('All types');
    setMinPrice(0);
    setMaxPrice(1000);
    setBhk('Any BHK');
    setBathrooms('Any bathrooms');
    setArea('Any area');
    setStatus('All status');
    setFurnished(false);
    setParking(false);
    setReadyToMove(false);
    setSelectedAmenities([]);
    setQuery('');
    setPage(1);
  };

  const filters = (
    <div className="space-y-7">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Filter size={18} className="text-sage" /><h2 className="text-lg font-semibold text-ink">Refine your search</h2></div><button type="button" onClick={clearFilters} className="text-xs font-bold uppercase tracking-[0.12em] text-sage">Clear all</button></div>
      <div><label className="field-label">District</label><select value={district} onChange={(event) => { setDistrict(event.target.value); setPage(1); }} className="field-control"><option value="All districts">All districts</option>{districtOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
      <div><label className="field-label">Sub district</label><select value={subDistrict} onChange={(event) => { setSubDistrict(event.target.value); setPage(1); }} className="field-control" disabled={district === 'All districts'}><option value="All sub districts">All sub districts</option>{subDistrictOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
      <div><label className="field-label">Property type</label><select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} className="field-control"><option>All types</option>{propertyTypeOptions.map((item) => <option key={item}>{item}</option>)}</select></div>
      <div><label className="field-label">Status</label><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="field-control"><option>All status</option><option>Available</option><option>Sold</option><option>Pending</option></select></div>
      <div><label className="field-label">BHK</label><select value={bhk} onChange={(event) => { setBhk(event.target.value); setPage(1); }} className="field-control"><option>Any BHK</option><option>2 BHK</option><option>3 BHK</option><option>4 BHK</option></select></div>
      <div><label className="field-label">Bathrooms</label><select value={bathrooms} onChange={(event) => { setBathrooms(event.target.value); setPage(1); }} className="field-control"><option>Any bathrooms</option><option>1 bathrooms</option><option>2 bathrooms</option></select></div>
      <div><label className="field-label">Area</label><select value={area} onChange={(event) => { setArea(event.target.value); setPage(1); }} className="field-control"><option>Any area</option><option>Under 1000 sqft</option><option>1000 - 1400 sqft</option><option>1400+ sqft</option></select></div>
      <div><label className="field-label">Budget range <span className="font-normal text-muted">(INR Lakh)</span></label><div className="grid grid-cols-2 gap-3"><input aria-label="Minimum price" type="number" min="0" value={minPrice} onChange={(event) => { setMinPrice(Number(event.target.value)); setPage(1); }} className="field-control" /><input aria-label="Maximum price" type="number" min="0" value={maxPrice} onChange={(event) => { setMaxPrice(Number(event.target.value)); setPage(1); }} className="field-control" /></div></div>
      <div><p className="field-label">Amenities</p><div className="space-y-3">{amenityOptions.map((item) => <label key={item} className="flex items-center gap-3 text-sm text-muted"><input type="checkbox" checked={selectedAmenities.includes(item)} onChange={(event) => { setSelectedAmenities((current) => event.target.checked ? [...current, item] : current.filter((value) => value !== item)); setPage(1); }} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />{item}</label>)}</div></div>
      <div className="space-y-3 border-t border-slate-100 pt-5"><label className="flex items-center gap-3 text-sm text-muted"><input type="checkbox" checked={furnished} onChange={(event) => setFurnished(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />Furnished</label><label className="flex items-center gap-3 text-sm text-muted"><input type="checkbox" checked={parking} onChange={(event) => setParking(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />Parking</label><label className="flex items-center gap-3 text-sm text-muted"><input type="checkbox" checked={readyToMove} onChange={(event) => setReadyToMove(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />Ready to move</label></div>
    </div>
  );

  return (
    <div className="-mx-4 -mt-8 min-h-screen bg-[#FFFEFE] pb-20 sm:-mx-6 lg:-mx-8">
      <section className="bg-ink px-6 py-20 text-white sm:px-10 lg:px-12"><div className="mx-auto max-w-7xl"><p className="eyebrow text-blue-100">The collection</p><h1 className="display-heading mt-4 max-w-2xl text-5xl leading-tight sm:text-6xl">Find a home with room for your life.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-white/65">Browse {sampleProperties.length} considered listings across Gujarat, filtered around what matters to you.</p></div></section>
      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-12">
        {location.state?.justSubmitted && <div className="mb-8 flex items-center justify-between gap-4 border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-primary"><span>Your enquiry has been received. A local property specialist will be in touch.</span><button type="button" aria-label="Dismiss confirmation" onClick={() => window.history.replaceState({}, '', '/buy')}><X size={18} /></button></div>}
        <div className="mb-8 flex flex-col gap-5 border-b border-stone-200 pb-8 lg:flex-row lg:items-end lg:justify-between"><SectionHeading eyebrow="Homes for you" title="Property collection" description="Use the filters to narrow your search, then save the spaces that feel right." /><button type="button" onClick={() => setMobileFilters(true)} className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-ink lg:hidden"><SlidersHorizontal size={17} /> Filters</button></div>
        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          <aside className="hidden self-start border border-stone-200 bg-white p-6 shadow-card lg:sticky lg:top-24 lg:block">{filters}</aside>
          <div className="space-y-7">
            <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-ink">{filtered.length} homes found</p><p className="mt-1 text-xs text-muted">Showing the best matches for your search</p></div><div className="flex flex-col gap-3 sm:flex-row"><label className="flex items-center gap-2 border border-stone-200 bg-white px-4 py-2.5 sm:min-w-[280px]"><Search size={17} className="text-sage" /><input aria-label="Search properties" placeholder="Search homes" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted" /></label><label className="flex items-center gap-2 border border-stone-200 bg-white px-4 py-2.5 text-sm text-muted"><span className="hidden sm:inline">Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)} className="border-0 bg-transparent p-0 text-sm font-semibold text-ink outline-none"><option value="relevance">Relevance</option><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="area_asc">Area</option></select><ChevronDown size={15} /></label></div></div>
            {loading ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="animate-pulse overflow-hidden rounded-[24px] border border-stone-200 bg-white"><div className="h-56 bg-slate-200" /><div className="space-y-3 p-5"><div className="h-4 w-24 rounded-full bg-slate-200" /><div className="h-6 w-3/4 rounded-full bg-slate-200" /><div className="h-4 w-full rounded-full bg-slate-200" /><div className="h-4 w-2/3 rounded-full bg-slate-200" /></div></div>)} </div> : paged.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{paged.map((property) => <PropertyCard key={property.id} property={property} />)}</div> : <div className="border border-stone-200 bg-white px-8 py-16 text-center"><Search size={30} className="mx-auto text-sage" /><h2 className="display-heading mt-5 text-2xl text-ink">No homes match those filters</h2><p className="mt-3 text-sm text-muted">Try widening your budget or searching another district.</p><button type="button" onClick={clearFilters} className="mt-6 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-white">Clear filters</button></div>}
            {!loading && <Pagination currentPage={page} pageCount={pageCount} onChange={setPage} />}
          </div>
        </div>
      </main>
      {mobileFilters && <div className="fixed inset-0 z-50 bg-ink/40 lg:hidden"><div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto bg-cream p-6"><div className="mb-6 flex justify-end"><button type="button" aria-label="Close filters" onClick={() => setMobileFilters(false)} className="rounded-full border border-stone-200 p-2 text-ink"><X size={19} /></button></div>{filters}<button type="button" onClick={() => setMobileFilters(false)} className="mt-8 w-full rounded-full bg-sage py-3.5 font-semibold text-white">Show {filtered.length} homes</button></div></div>}
    </div>
  );
}

export default BuyPage;
