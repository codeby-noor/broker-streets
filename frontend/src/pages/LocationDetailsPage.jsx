import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import { sampleProperties } from '../utils/data';
import { getLocationBySlug } from '../utils/locationData';
import { readStorage, STORAGE_KEYS } from '../utils/storage';

const iconMap = {
  'Excellent road connectivity': '🛣️',
  'Agricultural potential': '🌾',
  'Industrial growth': '🏭',
  'Residential development': '🏡',
  'Nearby highways': '🛣️',
  'Railway connectivity': '🚆',
  'Markets': '🏪',
  'Schools and hospitals': '🏥',
  'Water availability': '💧',
  'Development potential': '📈',
  'High demand': '📈',
};

function LocationDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useMemo(() => getLocationBySlug(slug), [slug]);
  const [query, setQuery] = useState('');
  const [propertyType, setPropertyType] = useState('All');
  const [budget, setBudget] = useState('');
  const [area, setArea] = useState('');
  const [sort, setSort] = useState('latest');

  const allProperties = useMemo(() => {
    const storedListings = readStorage(STORAGE_KEYS.listings, []);
    const source = Array.isArray(storedListings) && storedListings.length ? storedListings : sampleProperties;
    return source.filter((property) => {
      const name = `${property?.title || ''} ${property?.address || ''} ${property?.district || ''} ${property?.location || ''}`.toLowerCase();
      const matchesQuery = !query || name.includes(query.toLowerCase());
      const matchesType = propertyType === 'All' || (property?.propertyType || property?.type || '').toLowerCase().includes(propertyType.toLowerCase());
      const matchesBudget = !budget || String(property?.price || '').toLowerCase().includes(budget.toLowerCase());
      const matchesArea = !area || String(property?.area || property?.landArea || '').toLowerCase().includes(area.toLowerCase());
      return matchesQuery && matchesType && matchesBudget && matchesArea;
    });
  }, [query, propertyType, budget, area]);

  const filteredProperties = useMemo(() => {
    const next = allProperties.filter((property) => {
      const locationText = `${property?.district || ''} ${property?.location || ''} ${property?.city || ''}`.toLowerCase();
      return locationText.includes((location?.name || '').toLowerCase()) || locationText.includes((location?.district || '').toLowerCase());
    });

    if (sort === 'price') {
      return [...next].sort((a, b) => String(a.price || '').localeCompare(String(b.price || '')));
    }

    return [...next].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }, [allProperties, location?.name, location?.district, sort]);

  if (!location) {
    return (
      <div className="min-h-screen bg-background px-6 py-20 text-text">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-card">
          <p className="eyebrow">Location not found</p>
          <h1 className="mt-4 text-3xl font-semibold text-ink">This location isn’t available right now.</h1>
          <button type="button" onClick={() => navigate('/home')} className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white">Go back home</button>
        </div>
      </div>
    );
  }

  const agriculturalCount = filteredProperties.filter((property) => String(property?.propertyType || property?.type || '').toLowerCase().includes('agricultural')).length;
  const nonAgriculturalCount = filteredProperties.filter((property) => String(property?.propertyType || property?.type || '').toLowerCase().includes('non-agricultural')).length;

  return (
    <div className="min-h-screen bg-background text-text">
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <img src={location.image} alt={location.name} className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/30" />
        <div className="relative mx-auto flex min-h-[520px] max-w-7xl flex-col justify-end px-6 py-24 sm:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="eyebrow text-accentSoft">Premium Land Marketplace</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">{location.name}, {location.district}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">{location.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">{location.activeListings} Verified Listings</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">{location.verifiedSellers} Verified Sellers</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">Trusted Marketplace</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-card">
            <p className="eyebrow">Location Overview</p>
            <h2 className="mt-4 text-3xl font-semibold text-ink">Why buyers and sellers are active in {location.name}</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">{location.description}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'District', value: location.district },
                { label: 'Property Types', value: location.propertyTypes.join(' • ') },
                { label: 'Total Listings', value: location.activeListings },
                { label: 'Agricultural Listings', value: agriculturalCount },
                { label: 'Non-Agricultural Listings', value: nonAgriculturalCount },
                { label: 'Average Price', value: location.averagePrice },
                { label: 'Highest Price', value: location.highestPrice },
                { label: 'Lowest Price', value: location.lowestPrice },
              ].map((stat) => (
                <div key={stat.label} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-lg font-semibold text-ink">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-card">
            <p className="eyebrow">Quick Statistics</p>
            <div className="mt-6 space-y-4">
              {[
                ['Verified Sellers', location.verifiedSellers],
                ['Active Buyers', location.activeBuyers],
                ['Properties Sold', location.propertiesSold],
                ['Available Listings', location.activeListings],
                ['Average Price', location.averagePrice],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-600">{label}</span>
                  <span className="text-lg font-semibold text-ink">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-12">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">Property Filters</p>
              <h2 className="mt-3 text-3xl font-semibold text-ink">Find premium land in {location.name}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search properties" className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" />
              <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none">
                <option value="All">Property Type</option>
                <option value="Agricultural">Agricultural Land</option>
                <option value="Non-Agricultural">Non-Agricultural Land</option>
              </select>
              <input value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Budget" className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" />
              <input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Land Area" className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" />
              <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none">
                <option value="latest">Latest</option>
                <option value="price">Price</option>
              </select>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredProperties.length ? filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} onContact={() => {}} />
            )) : <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-600 lg:col-span-3">No properties match these filters for this location right now.</div>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-12">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-card">
          <p className="eyebrow">Why Invest in This Location</p>
          <h2 className="mt-3 text-3xl font-semibold text-ink">A premium address for agricultural and non-agricultural growth</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {location.summary.map((item) => (
              <div key={item} className="rounded-[20px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-semibold text-ink">{iconMap[item] || '✨'} {item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-card">
            <p className="eyebrow">Location Highlights</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {['Road Connectivity', 'Nearby City', 'Industrial Zone', 'Agricultural Zone', 'Water Availability', 'Development Potential'].map((item) => (
                <div key={item} className="rounded-[20px] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-lg font-semibold text-ink">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-card">
            <p className="eyebrow">Google Map</p>
            <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200">
              <iframe title={location.name} className="h-[320px] w-full" src={`https://www.google.com/maps?q=${encodeURIComponent(location.mapQuery)}&output=embed`} loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-12">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-card">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="eyebrow">Looking to buy or sell land?</p>
              <h2 className="mt-3 text-3xl font-semibold text-ink">Connect with serious buyers and sellers in {location.name}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate('/buy')} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white">Browse Properties</button>
              <button type="button" onClick={() => navigate('/sell')} className="rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary">Post Your Property</button>
            </div>
          </div>
          <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Related Locations</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {location.relatedLocations.map((item) => (
                <button key={item} type="button" onClick={() => navigate(`/location/${item.toLowerCase().replace(/\s+/g, '-')}`)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">{item}</button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LocationDetailsPage;
