import { useEffect, useState } from 'react';
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
          {latestProperties.slice(0, 6).map((property) => (
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

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {latestBuyerLeads.length ? latestBuyerLeads.slice(0, 4).map((lead) => {
              const preferredVillages = Array.isArray(lead.preferredVillages) ? lead.preferredVillages : [];
              const visibleVillages = preferredVillages.slice(0, 3);
              const remainingVillages = preferredVillages.length - visibleVillages.length;
              const requirementsText = typeof lead.requirements === 'string' ? lead.requirements.trim() : '';
              const isExpanded = Boolean(expandedRequirements[lead.id]);
              const shouldClamp = requirementsText.length > 180;

              return (
                <article key={lead.id} className="group flex h-full min-h-[430px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-card-hover">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-green-600" />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-xl font-semibold leading-7 text-ink">{lead.userName || lead.name || lead.buyerName || 'Buyer request'}</h3>
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Verified Buyer
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">Posted on {formatSubmittedDate(lead)}</p>
                      </div>
                      <span className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getPropertyTypeBadgeClass(lead.propertyType)}`}>
                        {lead.propertyType || 'Land'}
                      </span>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPurposeBadgeClass(lead.purpose)}`}>
                        {lead.purpose || 'Other'}
                      </span>
                    </div>

                    <div className="mt-6 rounded-[20px] bg-slate-50 p-4">
                      <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                        <span className="text-base">📍</span>
                        {lead.district || 'District'} • {lead.taluka || 'Taluka'}
                      </p>
                    </div>

                    {preferredVillages.length ? (
                      <div className="mt-6">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Preferred Villages</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {visibleVillages.map((village) => (
                            <span key={village} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                              {village}
                            </span>
                          ))}
                          {remainingVillages > 0 ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-500">
                              +{remainingVillages} more
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {requirementsText ? (
                      <div className="mt-6 flex-1">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Additional Requirements</p>
                        <p
                          className={`mt-3 text-sm leading-7 text-slate-600 ${shouldClamp && !isExpanded ? 'overflow-hidden' : ''}`}
                          style={shouldClamp && !isExpanded ? { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : undefined}
                        >
                          {requirementsText}
                        </p>
                        {shouldClamp ? (
                          <button
                            type="button"
                            onClick={() => setExpandedRequirements((current) => ({ ...current, [lead.id]: !current[lead.id] }))}
                            className="mt-3 text-sm font-semibold text-primary transition hover:text-primary-dark"
                          >
                            {isExpanded ? 'Read Less' : 'Read More'}
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-8 border-t border-slate-100 pt-5">
                      <button
                        type="button"
                        onClick={() => setContactModal({ type: 'buyer', data: lead })}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-300 hover:from-emerald-700 hover:to-green-700"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5.75A2.75 2.75 0 0 1 5.75 3h2.07a1.5 1.5 0 0 1 1.42 1.02l.94 2.5a1.5 1.5 0 0 1-.27 1.57l-1.16 1.16a13.95 13.95 0 0 0 5.6 5.6l1.16-1.16a1.5 1.5 0 0 1 1.57-.27l2.5.94A1.5 1.5 0 0 1 21 9.18v2.07A2.75 2.75 0 0 1 18.25 14H17.5c-4.14 0-7.5-3.36-7.5-7.5V3.75" />
                        </svg>
                        Contact Buyer
                      </button>
                    </div>
                  </div>
                </article>
              );
            }) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600 md:col-span-2">
                No buyer requirements available right now.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="eyebrow">Popular Investment Locations</p>
            <h2 className="mt-4 text-3xl font-semibold text-ink">Explore high-demand agricultural and non-agricultural land locations across Surat and Navsari.</h2>
            <p className="mt-4 text-sm leading-7 text-muted">Discover verified listings in the most active land markets with premium infrastructure, strong connectivity, and investment momentum.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {popularLandLocations.map((location) => (
              <button key={location.slug} type="button" onClick={() => navigate(`/location/${location.slug}`)} className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-card-hover">
                <div className="relative h-72 overflow-hidden">
                  <img src={location.image} alt={location.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />
                  <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                    {location.district}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <div className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                      Agricultural & NA Land
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold text-white">{location.name}</h3>
                    <p className="mt-2 text-sm text-slate-200">{location.activeListings} Active Listings</p>
                  </div>
                </div>
                <div className="space-y-4 p-6">
                  <p className="text-sm leading-7 text-slate-600">{location.description}</p>
                  <div className="rounded-[18px] bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-500">Starting From</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-700">{location.startingPrice}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-700">{location.region} District</span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                      Explore Properties
                      <span aria-hidden="true">→</span>
                    </span>
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
