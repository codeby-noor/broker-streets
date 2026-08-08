import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, MapPin, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSubmissionDestination } from '../utils/formNavigation';
import { sampleProperties } from '../utils/data';
import { popularLandLocations } from '../utils/locationData';
import { onListingsChanged, readStorage, STORAGE_KEYS } from '../utils/storage';
import ContactModal from '../components/ContactModal';
import PropertyCard from '../components/PropertyCard';
import SectionHeading from '../components/SectionHeading';

const faqs = [
  ['Are the land listings verified?', 'Every featured listing is reviewed for clear pricing, location, and property information before it appears on the platform.'],
  ['Can I reach the seller directly?', 'Yes. Use the contact details on any listing to connect with the seller or request assistance from our support team.'],
  ['Can I list agricultural and NA land?', 'Absolutely. Broker Streets supports both agricultural and non-agricultural land transactions across Gujarat.'],
  ['How are buyer requirements matched?', 'Our platform connects buyer preferences with verified land listings and trusted sellers across Surat and Navsari.'],
];

const formatSubmittedDate = (lead) => {
  const sourceDate = lead?.submittedAt || lead?.createdAt || lead?.date;
  if (!sourceDate) return 'Recently posted';

  const parsedDate = new Date(sourceDate);
  if (Number.isNaN(parsedDate.getTime())) return 'Recently posted';

  return parsedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getPropertyTypeBadgeClass = (propertyType) => {
  if (propertyType === 'Non-Agricultural Land') {
    return 'border-sky-200 bg-sky-50 text-sky-700';
  }
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
};

const getPurposeBadgeClass = (purpose) => {
  switch (purpose) {
    case 'Investment':
      return 'border-violet-200 bg-violet-50 text-violet-700';
    case 'Project':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'Personal Farm':
      return 'border-lime-200 bg-lime-50 text-lime-700';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-700';
  }
};

function HomePage() {
  const navigate = useNavigate();
  const [latestProperties, setLatestProperties] = useState([]);
  const [latestBuyerLeads, setLatestBuyerLeads] = useState([]);
  const [contactModal, setContactModal] = useState(null);
  const [faqOpen, setFaqOpen] = useState(0);
  const [expandedRequirements, setExpandedRequirements] = useState({});

  const goToBuy = () => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'));
  const goToSell = () => navigate(getSubmissionDestination('sellerFormSubmitted', '/seller-form', '/sell'));

  useEffect(() => {
    const loadLatest = () => {
      try {
        const storedListings = readStorage(STORAGE_KEYS.listings, []);
        const allListings = Array.isArray(storedListings) ? storedListings : [];
        const activeListings = allListings.filter((listing) => String(listing.status || 'Available').toLowerCase() !== 'sold');
        const sortedListings = activeListings.slice().sort((a, b) => new Date(b.updatedAt || b.createdAt || b.submittedAt || b.uploadedDate || 0) - new Date(a.updatedAt || a.createdAt || a.submittedAt || a.uploadedDate || 0));
        const fallbackListings = sampleProperties.filter((listing) => String(listing.status || 'Available').toLowerCase() !== 'sold');
        const combinedListings = [...sortedListings, ...fallbackListings.filter((item) => !sortedListings.some((listing) => String(listing.id) === String(item.id)))];
        setLatestProperties(combinedListings.slice(0, 6));

        const buyers = readStorage(STORAGE_KEYS.buyerLeads, []);
        const sortedBuyers = Array.isArray(buyers)
          ? buyers.slice().sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0))
          : [];
        setLatestBuyerLeads(sortedBuyers.slice(0, 4));
      } catch (err) {
        setLatestProperties(sampleProperties.slice(0, 6));
        setLatestBuyerLeads([]);
      }
    };

    loadLatest();
    const cleanup = onListingsChanged(loadLatest);
    return cleanup;
  }, []);

  const latestActiveProperties = latestProperties.slice(0, 6);
  const mobileQuickActions = [
    { label: 'Buy Land', description: 'Browse verified land listings', action: goToBuy },
    { label: 'Sell Land', description: 'List your land with confidence', action: goToSell },
    { label: 'Post Requirement', description: 'Share what you want to buy', action: () => navigate('/buyer-form') },
  ];

  const whyBrokerStreetsSection = useMemo(() => (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <div className="text-center">
          <p className="eyebrow">Why Broker Streets</p>
          <h2 className="mt-4 text-3xl font-semibold text-ink">A premium platform for land buyers and sellers in Gujarat.</h2>
          <p className="mt-4 text-sm leading-7 text-muted">Browse verified land opportunities, connect directly with sellers, and access local market clarity for Surat and Navsari.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: 'Verified Listings', description: 'Clear land details and seller credibility on every listing.' },
            { icon: MapPin, title: 'Local Expertise', description: 'Surat and Navsari focused land coverage with trusted routes.' },
            { icon: Users, title: 'Direct Contact', description: 'Speak directly to sellers and verified buyers.' },
            { icon: Sparkles, title: 'Premium Presentation', description: 'Professional listing cards and trusted market insights.' },
          ].map((item) => (
            <div key={item.title} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <item.icon size={24} className="text-primary" />
              <h3 className="mt-4 text-lg font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  ), []);

  const featuredSection = useMemo(() => (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
      <SectionHeading eyebrow="Featured" title="Featured Land Opportunities" description="Hand-picked agricultural and non-agricultural land with verified details." action={<button type="button" onClick={() => navigate('/buy')} className="inline-flex items-center gap-2 rounded-full border border-primary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5">View All Properties</button>} />
      <div className="mt-6 overflow-hidden sm:mt-10">
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6" aria-label="Featured properties carousel">
          {latestActiveProperties.map((property) => (
            <div key={property.id} className="min-w-[86%] snap-start sm:min-w-[42%] lg:min-w-[32%]">
              <PropertyCard property={property} onContact={(data) => setContactModal({ type: 'seller', data })} />
            </div>
          ))}
        </div>
      </div>
    </section>
  ), [latestActiveProperties, navigate]);

  const buyerRequirementsSection = useMemo(() => (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-card sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow">Latest Buyer Requirements</p>
            <h2 className="mt-3 text-3xl font-semibold text-ink">Helping buyers connect with trusted land owners across Gujarat.</h2>
            <p className="mt-4 text-sm leading-7 text-muted">Connect directly with verified buyers looking for agricultural and non-agricultural land.</p>
          </div>
          <button type="button" onClick={() => navigate('/buyer-requirements')} className="inline-flex items-center justify-center rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5">View All Requirements</button>
        </div>

        <div className="mt-8 overflow-hidden">
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
            {latestBuyerLeads.length ? latestBuyerLeads.slice(0, 4).map((lead) => {
              const preferredVillages = Array.isArray(lead.preferredVillages) ? lead.preferredVillages : [];
              const visibleVillages = preferredVillages.slice(0, 3);
              const requirementsText = typeof lead.requirements === 'string' ? lead.requirements.trim() : '';
              const isExpanded = Boolean(expandedRequirements[lead.id]);
              const shouldClamp = requirementsText.length > 140;

              return (
                <article key={lead.id} className="min-w-[86%] snap-start rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm transition duration-300 hover:-translate-y-1 sm:min-w-[42%]">
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-ink">{lead.userName || lead.name || lead.buyerName || 'Buyer request'}</h3>
                        <p className="mt-2 text-sm text-slate-500">{formatSubmittedDate(lead)}</p>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Verified Buyer
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPropertyTypeBadgeClass(lead.propertyType)}`}>
                        {lead.propertyType || 'Land'}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPurposeBadgeClass(lead.purpose)}`}>
                        {lead.purpose || 'Other'}
                      </span>
                    </div>

                    <div className="rounded-[20px] bg-white p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Location</p>
                      <p className="mt-2 text-sm text-slate-700">{lead.district || 'District'} • {lead.taluka || 'Taluka'}</p>
                    </div>

                    {visibleVillages.length ? (
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Preferred Villages</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {visibleVillages.map((village) => (
                            <span key={village} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">{village}</span>
                          ))}
                          {preferredVillages.length > visibleVillages.length ? (
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-500">+{preferredVillages.length - visibleVillages.length} more</span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {requirementsText ? (
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Requirements</p>
                        <p className={`mt-3 text-sm leading-6 text-slate-600 ${shouldClamp && !isExpanded ? 'overflow-hidden' : ''}`} style={shouldClamp && !isExpanded ? { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : undefined}>
                          {requirementsText}
                        </p>
                        {shouldClamp ? (
                          <button type="button" onClick={() => setExpandedRequirements((current) => ({ ...current, [lead.id]: !current[lead.id] }))} className="mt-3 text-sm font-semibold text-primary transition hover:text-primary-dark">
                            {isExpanded ? 'Read Less' : 'Read More'}
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    <button type="button" onClick={() => setContactModal({ type: 'buyer', data: lead })} className="mt-4 flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-700 hover:to-green-700">
                      <span>Contact Buyer</span>
                    </button>
                  </div>
                </article>
              );
            }) : (
              <div className="min-w-[86%] snap-start rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-600 sm:min-w-[42%]">No buyer requirements available right now.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  ), [expandedRequirements, latestBuyerLeads, navigate]);

  const popularLocationsSection = useMemo(() => (
    <section className="bg-surface py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="eyebrow">Popular Investment Locations</p>
          <h2 className="mt-4 text-3xl font-semibold text-ink">Explore high-demand agricultural and non-agricultural land locations across Surat and Navsari.</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5">
          {popularLandLocations.map((location) => (
            <article
              key={location.slug}
              className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-card-hover"
            >
              <div className="relative h-48 overflow-hidden sm:h-56 lg:h-64">
                <img src={location.image} alt={location.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                <h3 className="text-base font-semibold leading-6 text-slate-900 sm:text-lg lg:text-2xl">{location.name}</h3>
                <div className="mt-4">
                  <button
                    type="button"
                    aria-label={`Explore ${location.name} in ${location.district}`}
                    onClick={() => navigate(`/buy?district=${encodeURIComponent(location.district)}&taluka=${encodeURIComponent(location.name)}`)}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-dark sm:text-sm"
                  >
                    Explore <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  ), [navigate]);

  return (
    <div className="space-y-24 pb-20 bg-background text-text">
      <section className="relative overflow-hidden bg-[url('https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=1800&q=85')] bg-cover bg-center text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/20 to-slate-950/90" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow text-accentSoft">Invest in land. Invest in the future.</p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">Gujarat's trusted agricultural and non-agricultural land marketplace</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/85 sm:text-lg">Discover verified farmland, investment plots, and non-agricultural land across Surat, Navsari, and Gujarat. Buy and sell with confidence.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={goToBuy} className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark">Browse Properties</button>
                <button type="button" onClick={goToSell} className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/30 bg-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20">Post Your Land</button>
              </div>
            </div>
            <div className="rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-glass backdrop-blur-xl sm:p-8">
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

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {mobileQuickActions.map((action) => (
            <button key={action.label} type="button" onClick={action.action} className="group rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-ink">{action.label}</p>
                  <p className="mt-2 text-sm text-muted">{action.description}</p>
                </div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <ArrowRight size={20} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {featuredSection}
      {popularLocationsSection}
      {whyBrokerStreetsSection}
      {buyerRequirementsSection}

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
          <p className="eyebrow">Ready to find the right land?</p>
          <h2 className="mt-3 text-3xl font-semibold text-ink">Browse properties or post your requirement today.</h2>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={goToBuy} className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark">Browse Properties</button>
            <button type="button" onClick={() => navigate('/buyer-form')} className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5">Post Requirement</button>
          </div>
        </div>
      </section>

      <ContactModal open={Boolean(contactModal)} onClose={() => setContactModal(null)} data={contactModal?.data || {}} title={contactModal?.type === 'seller' ? 'Contact Seller' : 'Contact Buyer'} />
    </div>
  );
}

export default HomePage;
