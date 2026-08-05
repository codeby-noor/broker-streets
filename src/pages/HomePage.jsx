import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubmissionDestination } from '../utils/formNavigation';
import { sampleProperties } from '../utils/data';
import { onListingsChanged, readStorage, STORAGE_KEYS } from '../utils/storage';
import ContactModal from '../components/ContactModal';
import PropertyCard from '../components/PropertyCard';
import SectionHeading from '../components/SectionHeading';

const popularLandLocations = [
  { name: 'Vesu', region: 'Surat', listings: 145, image: 'https://images.unsplash.com/photo-1517511620798-cec17d428bc0?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Adajan', region: 'Surat', listings: 96, image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Piplod', region: 'Surat', listings: 88, image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Dumas', region: 'Surat', listings: 101, image: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Kamrej', region: 'Surat', listings: 63, image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Bardoli', region: 'Surat', listings: 52, image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Navsari City', region: 'Navsari', listings: 94, image: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Gandevi', region: 'Navsari', listings: 65, image: 'https://images.unsplash.com/photo-1547737699-6577b38d74bd?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Chikhli', region: 'Navsari', listings: 58, image: 'https://images.unsplash.com/photo-1542228262-3d0fbb325515?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Bilimora', region: 'Navsari', listings: 73, image: 'https://images.unsplash.com/photo-1548837257609-643056a9970c?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Jalalpore', region: 'Navsari', listings: 57, image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Amalsad', region: 'Navsari', listings: 48, image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=85' },
];

const faqs = [
  ['Are the land listings verified?', 'Every featured listing is reviewed for clear pricing, location, and property information before it appears on the platform.'],
  ['Can I reach the seller directly?', 'Yes. Use the contact details on any listing to connect with the seller or request assistance from our support team.'],
  ['Can I list agricultural and NA land?', 'Absolutely. Broker Streets supports both agricultural and non-agricultural land transactions across Gujarat.'],
  ['How are buyer requirements matched?', 'Our platform connects buyer preferences with verified land listings and trusted sellers across Surat and Navsari.'],
];

function HomePage() {
  const navigate = useNavigate();
  const [latestProperties, setLatestProperties] = useState([]);
  const [latestBuyerLeads, setLatestBuyerLeads] = useState([]);
  const [contactModal, setContactModal] = useState(null);
  const [faqOpen, setFaqOpen] = useState(0);

  const goToBuy = () => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'));
  const goToSell = () => navigate(getSubmissionDestination('sellerFormSubmitted', '/seller-form', '/sell'));

  useEffect(() => {
    const loadLatest = () => {
      try {
        const storedListings = readStorage(STORAGE_KEYS.listings, []);
        const latestListings = Array.isArray(storedListings) && storedListings.length
          ? storedListings.slice().sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
          : sampleProperties.slice(0, 6);
        setLatestProperties(latestListings.slice(0, 6));

        const buyers = readStorage(STORAGE_KEYS.buyerLeads, []);
        const sortedBuyers = Array.isArray(buyers)
          ? buyers.slice().sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0))
          : [];
        setLatestBuyerLeads(sortedBuyers.slice(0, 4));
      } catch (err) {
        setLatestProperties(sampleProperties.slice(0, 4));
        setLatestBuyerLeads([]);
      }
    };

    loadLatest();
    const cleanup = onListingsChanged(loadLatest);
    return cleanup;
  }, []);

  return (
    <div className="space-y-24 pb-20 bg-background text-text">
      <section className="relative overflow-hidden bg-[url('https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=1800&q=85')] bg-cover bg-center text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/20 to-slate-950/90" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow text-accentSoft">Invest in land. Invest in the future.</p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Gujarat's Trusted Agricultural & Non-Agricultural Land Marketplace</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">Discover verified farmland, investment plots, and non-agricultural land across Surat, Navsari, and Gujarat. Buy and sell with confidence.</p>
              <div className="mt-10 flex flex-wrap gap-4">
                <button type="button" onClick={goToBuy} className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-dark">Buy Properties</button>
                <button type="button" onClick={goToSell} className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20">Sell Your Land</button>
              </div>
            </div>
            <div className="rounded-[32px] border border-white/10 bg-white/10 p-8 shadow-glass backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.24em] text-white/70">Premium land marketplace</p>
              <div className="mt-6 grid gap-4">
                <div className="rounded-3xl bg-white/10 p-5 text-sm text-white/90">Verified listings, local context, and transparent land details.</div>
                <div className="rounded-3xl bg-white/10 p-5 text-sm text-white/90">Curated opportunities for agricultural and non-agricultural land investors.</div>
                <div className="rounded-3xl bg-white/10 p-5 text-sm text-white/90">Support for Surat and Navsari property transactions.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Verified Land Listings', value: '500+' },
            { label: 'Happy Buyers', value: '1200+' },
            { label: 'Trusted Sellers', value: '250+' },
            { label: 'Cities Covered', value: '15+' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
              <p className="text-3xl font-semibold text-ink">{stat.value}</p>
              <p className="mt-3 text-sm uppercase tracking-[0.16em] text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-12">
        <SectionHeading eyebrow="Featured" title="Featured Land Opportunities" description="Hand-picked agricultural and non-agricultural land with verified details." action={<button type="button" onClick={() => navigate('/buy')} className="inline-flex items-center gap-2 rounded-full border border-primary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5">View All Properties</button>} />
        <div className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {(latestProperties.length ? latestProperties.slice(0, 4) : sampleProperties.slice(0, 4)).map((property) => (
            <PropertyCard key={property.id} property={property} onContact={(data) => setContactModal({ type: 'seller', data })} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-card">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Latest Buyer Requirements</p>
              <h2 className="mt-3 text-3xl font-semibold text-ink">Helping buyers connect with trusted land owners across Gujarat.</h2>
              <p className="mt-4 text-sm leading-7 text-muted">Connect directly with verified buyers looking for agricultural and non-agricultural land.</p>
            </div>
            <button type="button" onClick={() => navigate('/buyer-requirements')} className="inline-flex items-center justify-center rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5">View All Requirements</button>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-2">
            {(latestBuyerLeads.length ? latestBuyerLeads.slice(0, 4) : [{ id: 'sample-1', userName: 'Verified Buyer', city: 'Surat', propertyType: 'Agricultural Land', budget: '₹1.1 Cr', requirements: 'Looking for 2+ acre farmland in Surat region.' }]).map((lead) => (
              <div key={lead.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card-hover">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-ink">{lead.userName || 'Buyer request'}</h3>
                    <p className="mt-2 text-sm text-muted">{lead.propertyType || 'Land'} • {lead.city || lead.district || 'Gujarat'}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">{lead.budget || 'Budget info'}</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted">{lead.requirements || 'Seeking quality land with transparent documentation and local access.'}</p>
                <div className="mt-6">
                  <button type="button" onClick={() => setContactModal({ type: 'buyer', data: lead })} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark">Contact Buyer</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-10 text-center">
            <p className="eyebrow">Popular Locations</p>
            <h2 className="mt-4 text-3xl font-semibold text-ink">Surat and Navsari neighbourhoods with premium land demand</h2>
            <p className="mt-4 text-sm leading-7 text-muted">Discover premium locations for agricultural and non-agricultural land investments.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {popularLandLocations.map((location) => (
              <button key={location.name} type="button" onClick={goToBuy} className="group overflow-hidden rounded-[32px] border border-transparent bg-white shadow-card transition hover:-translate-y-1 hover:border-primary/10 hover:shadow-card-hover">
                <div className="relative h-72 overflow-hidden">
                  <img src={location.image} alt={location.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="text-sm uppercase tracking-[0.16em] text-white/80">{location.region}</p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">{location.name}</h3>
                    <p className="mt-2 text-sm text-white/80">{location.listings} listings</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-10 shadow-card">
            <p className="eyebrow">Seller Section</p>
            <h2 className="mt-4 text-3xl font-semibold text-ink">List your land today and reach genuine buyers.</h2>
            <p className="mt-5 text-lg leading-8 text-muted">Seller listings are presented with clear land details, verified credentials, and local market context to attract serious buyers.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] bg-surface p-5">
                <p className="text-sm uppercase tracking-[0.16em] text-muted">Trusted reach</p>
                <p className="mt-3 text-lg font-semibold text-ink">250+ sellers</p>
              </div>
              <div className="rounded-[24px] bg-surface p-5">
                <p className="text-sm uppercase tracking-[0.16em] text-muted">Verified process</p>
                <p className="mt-3 text-lg font-semibold text-ink">Clear property reviews</p>
              </div>
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-primary p-10 text-white shadow-card">
            <p className="eyebrow text-accentSoft">Professional quote</p>
            <blockquote className="mt-6 text-3xl font-semibold leading-tight">Premium agricultural and non-agricultural land selected for serious buyers.</blockquote>
            <p className="mt-6 text-sm leading-7 text-white/80">Our team surfaces the most promising land opportunities with a focus on local clarity, strong documentation, and meaningful investment potential.</p>
          </div>
        </div>
      </section>

      <section className="bg-surface py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="eyebrow">Final quote</p>
          <blockquote className="mt-6 text-3xl font-semibold text-ink">Building trust through transparent land transactions.</blockquote>
          <p className="mt-6 text-sm leading-7 text-muted">Broker Streets brings a premium marketplace experience for buyers and sellers of land in Gujarat.</p>
        </div>
      </section>

      <ContactModal open={Boolean(contactModal)} onClose={() => setContactModal(null)} data={contactModal?.data || {}} title={contactModal?.type === 'seller' ? 'Contact Seller' : 'Contact Buyer'} />
    </div>
  );
}

export default HomePage;
