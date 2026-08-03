import { useMemo } from 'react';
import { ArrowLeft, Bath, BedDouble, Building2, CheckCircle2, Heart, MapPin, Maximize2, Phone, ShieldCheck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { sampleProperties } from '../utils/data';
import { getSubmissionDestination } from '../utils/formNavigation';
import PropertyCard from '../components/PropertyCard';
import SectionHeading from '../components/SectionHeading';

function PropertyDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const property = useMemo(() => sampleProperties.find((item) => item.id === id), [id]);
  const baseIndex = Math.max(0, (Number(id?.split('-')[1]) || 1) - 1);
  const gallery = property ? [property.image, sampleProperties[(baseIndex + 1) % sampleProperties.length].image, sampleProperties[(baseIndex + 2) % sampleProperties.length].image] : [];
  const similar = property ? sampleProperties.filter((item) => item.id !== property.id && item.location === property.location).slice(0, 3) : [];

  if (!property) {
    return <div className="border border-slate-200 bg-white p-8 shadow-card"><h1 className="text-3xl font-semibold text-ink">Property not found</h1><p className="mt-3 text-muted">The listing you requested is unavailable. Please return to browsing.</p><button type="button" onClick={() => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'))} className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">Back to listings</button></div>;
  }

  return (
    <div className="-mx-4 -mt-8 bg-[#FFFEFE] pb-20 sm:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12"><button type="button" onClick={() => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'))} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary"><ArrowLeft size={17} /> Back to properties</button></div>
      <main className="mx-auto max-w-7xl space-y-12 px-6 lg:px-12">
        <section className="grid gap-3 lg:grid-cols-[1.45fr_0.8fr]">
          <div className="relative h-[360px] overflow-hidden bg-slate-200 sm:h-[500px]"><img src={gallery[0]} alt={property.title} className="h-full w-full object-cover" /><div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-ink"><ShieldCheck size={15} className="text-primary" /> Verified listing</div><button type="button" aria-label="Save property" className="absolute right-5 top-5 rounded-full bg-white p-3 text-ink shadow-sm"><Heart size={18} /></button></div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1"><img src={gallery[1]} alt="Property interior" className="h-full min-h-[175px] w-full object-cover" /><img src={gallery[2]} alt="Property exterior" className="h-full min-h-[175px] w-full object-cover" /></div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <div><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="eyebrow">{property.type} - {property.location}</p><h1 className="mt-3 text-4xl font-bold text-ink sm:text-5xl">{property.title}</h1><p className="mt-4 flex items-center gap-2 text-muted"><MapPin size={17} className="text-primary" />{property.address}</p></div><p className="text-2xl font-bold text-ink">{property.price}</p></div><div className="mt-8 grid grid-cols-2 gap-3 border-y border-slate-200 py-5 sm:grid-cols-4"><div className="flex items-center gap-3"><BedDouble size={20} className="text-primary" /><span><strong className="block text-sm text-ink">{property.bedrooms} BHK</strong><small className="text-muted">Bedrooms</small></span></div><div className="flex items-center gap-3"><Bath size={20} className="text-primary" /><span><strong className="block text-sm text-ink">{property.bathrooms}</strong><small className="text-muted">Bathrooms</small></span></div><div className="flex items-center gap-3"><Maximize2 size={20} className="text-primary" /><span><strong className="block text-sm text-ink">{property.area}</strong><small className="text-muted">Built-up area</small></span></div><div className="flex items-center gap-3"><Building2 size={20} className="text-primary" /><span><strong className="block text-sm text-ink">{property.parking ? 'Yes' : 'No'}</strong><small className="text-muted">Parking</small></span></div></div><div className="mt-9"><h2 className="text-2xl font-semibold text-ink">About this property</h2><p className="mt-4 max-w-2xl leading-8 text-muted">{property.description}</p></div><div className="mt-9"><h2 className="text-2xl font-semibold text-ink">Amenities</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{['Lift access', '24/7 security', 'Power backup', 'Visitor parking', 'Water supply', 'Well-connected location'].map((item) => <div key={item} className="flex items-center gap-3 text-sm text-muted"><CheckCircle2 size={17} className="text-primary" />{item}</div>)}</div></div>
            <div className="mt-9"><h2 className="text-2xl font-semibold text-ink">Nearby essentials</h2><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="border border-slate-200 bg-blue-50 p-4"><strong className="block text-sm text-ink">Schools</strong><span className="mt-2 block text-sm text-muted">Within 2.4 km</span></div><div className="border border-slate-200 bg-blue-50 p-4"><strong className="block text-sm text-ink">Hospitals</strong><span className="mt-2 block text-sm text-muted">Within 3.1 km</span></div><div className="border border-slate-200 bg-blue-50 p-4"><strong className="block text-sm text-ink">Banks</strong><span className="mt-2 block text-sm text-muted">Within 1.2 km</span></div></div></div>
            <div className="mt-9 rounded-[24px] border border-slate-200 bg-slate-50 p-6"><h2 className="text-2xl font-semibold text-ink">Map & locality</h2><div className="mt-4 rounded-[20px] border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-muted">Map placeholder for {property.address} • Nearby transport, schools and daily essentials are highlighted here for buyers.</div></div>
          </div>
          <aside className="self-start border border-slate-200 bg-white p-6 shadow-card lg:sticky lg:top-24"><p className="eyebrow">Interested in this home?</p><h2 className="mt-3 text-2xl font-semibold text-ink">Talk to a local agent</h2><p className="mt-3 text-sm leading-6 text-muted">Get availability, viewing times, and answers to your questions.</p><button type="button" className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 font-semibold text-white hover:bg-sage-dark"><Phone size={17} /> Contact Seller</button><p className="mt-4 text-center text-xs text-muted">No commitment. Just useful guidance.</p></aside>
        </section>

        <section><SectionHeading eyebrow="You may also like" title="Similar properties" /><div className="mt-8 grid gap-5 md:grid-cols-3">{similar.map((item) => <PropertyCard key={item.id} property={item} />)}</div></section>
      </main>
    </div>
  );
}

export default PropertyDetailsPage;
