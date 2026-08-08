import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { readStorage, STORAGE_KEYS } from '../utils/storage';
import SectionHeading from '../components/SectionHeading';
import Pagination from '../components/Pagination';
import ContactModal from '../components/ContactModal';

const landTypes = ['All types', 'Agricultural Land', 'Non-Agricultural Land'];
const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

function BuyerRequirementsPage() {
  const navigate = useNavigate();
  const [buyerLeads, setBuyerLeads] = useState(() => readStorage(STORAGE_KEYS.buyerLeads, []));
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [landType, setLandType] = useState('All types');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [contactModal, setContactModal] = useState(null);

  useEffect(() => {
    const stored = readStorage(STORAGE_KEYS.buyerLeads, []);
    setBuyerLeads(Array.isArray(stored) ? stored : []);
    const handler = () => setBuyerLeads(readStorage(STORAGE_KEYS.buyerLeads, []));
    window.addEventListener('broker-streets-buyer-leads-changed', handler);
    return () => window.removeEventListener('broker-streets-buyer-leads-changed', handler);
  }, []);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return buyerLeads
      .filter((lead) => {
        const matchesCity = !city || String(lead.state || '').toLowerCase().includes(city.toLowerCase()) || String(lead.district || '').toLowerCase().includes(city.toLowerCase());
        const matchesDistrict = !district || String(lead.district || '').toLowerCase().includes(district.toLowerCase());
        const matchesType = !propertyType || String(lead.propertyType || '').toLowerCase().includes(propertyType.toLowerCase());
        const matchesLandType = landType === 'All types' || String(lead.propertyType || '').toLowerCase().includes(landType.toLowerCase());
        const matchesQuery = !normalizedQuery || `${lead.userName} ${lead.requirements} ${lead.propertyType} ${lead.district} ${lead.state}`.toLowerCase().includes(normalizedQuery);
        return matchesCity && matchesDistrict && matchesType && matchesLandType && matchesQuery;
      })
      .sort((a, b) => {
        if (sort === 'newest') return new Date(b.createdAt || b.submittedAt || 0) - new Date(a.createdAt || a.submittedAt || 0);
        return new Date(a.createdAt || a.submittedAt || 0) - new Date(b.createdAt || b.submittedAt || 0);
      });
  }, [buyerLeads, city, district, propertyType, landType, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const pagedLeads = filteredLeads.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, city, district, propertyType, landType, sort]);

  return (
    <div className="-mx-4 -mt-8 min-h-screen bg-[#FFFEFE] pb-20 sm:-mx-6 lg:-mx-8">
      <section className="bg-ink px-6 py-16 text-white sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow text-blue-100">Buyer requirements</p>
          <h1 className="mt-4 text-5xl font-bold">Explore what buyers are looking for.</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/70">Search and filter buyer requirements to match requests to your property inventory.</p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-12">
        <div className="mb-8 grid gap-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-card sm:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <SectionHeading eyebrow="Search requirements" title="Find buyer needs fast" description="Filter by location, type, and preference." />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <label className="block"><span className="field-label">State / City</span><input value={city} onChange={(event) => setCity(event.target.value)} className="field-control" placeholder="Ahmedabad" /></label>
                <label className="block"><span className="field-label">District</span><input value={district} onChange={(event) => setDistrict(event.target.value)} className="field-control" placeholder="Surat" /></label>
                <label className="block"><span className="field-label">Property type</span><input value={propertyType} onChange={(event) => setPropertyType(event.target.value)} className="field-control" placeholder="Agricultural Land" /></label>
              </div>
            </div>

            <div className="grid gap-4">
              <label className="block"><span className="field-label">Land sector</span><select value={landType} onChange={(event) => setLandType(event.target.value)} className="field-control"><option>All types</option>{landTypes.filter((item) => item !== 'All types').map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="block"><span className="field-label">Sort by</span><div className="relative"><select value={sort} onChange={(event) => setSort(event.target.value)} className="field-control pr-10"><option value="newest">Newest</option><option value="oldest">Oldest</option></select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /></div></label>
            </div>
          </div>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-ink">{filteredLeads.length} buyer requirements found</p>
          <div className="relative inline-flex min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 shadow-sm">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder="Search requirements"
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none"
            />
          </div>
        </div>

        <div className="space-y-6">
          {pagedLeads.map((lead) => {
            const villages = Array.isArray(lead.preferredVillages) ? lead.preferredVillages : [];
            const visibleVillages = villages.slice(0, 3);
            const extraCount = Math.max(0, villages.length - visibleVillages.length);
            const initials = lead.userName?.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'B';
            return (
              <article key={lead.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-sage text-lg font-bold text-white">{initials}</div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold text-ink">{lead.userName || 'Buyer request'}</h3>
                          {lead.verified ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Verified Buyer</span> : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{new Date(lead.createdAt || lead.submittedAt || '').toLocaleDateString() || 'Date unavailable'}</p>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:w-64">
                      <span className="rounded-full bg-slate-50 px-3 py-2 text-sm font-semibold text-ink">{lead.propertyType || 'Land request'}</span>
                      <span className="rounded-full bg-slate-50 px-3 py-2 text-sm font-semibold text-ink">{lead.purpose || 'Purpose not specified'}</span>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-500">Location</p>
                    <p className="mt-2 text-sm font-semibold text-ink">{[lead.district, lead.taluka].filter(Boolean).join(' • ') || 'Location not provided'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">Preferred Villages</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {visibleVillages.map((village) => (
                        <span key={village} className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{village}</span>
                      ))}
                      {extraCount > 0 ? <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">+{extraCount} more</span> : null}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">Requirements</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{lead.requirements || 'No additional requirements provided.'}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setContactModal(lead)}
                    className="w-full rounded-3xl bg-sage px-5 py-3 text-sm font-semibold text-white transition hover:bg-sage-dark"
                  >
                    Contact Buyer
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <Pagination currentPage={page} pageCount={pageCount} onChange={setPage} />
      </main>
      <ContactModal open={Boolean(contactModal)} onClose={() => setContactModal(null)} data={contactModal || {}} title="Contact Buyer" />
    </div>
  );
}

export default BuyerRequirementsPage;
