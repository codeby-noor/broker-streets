import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  MapPin,
  Users,
  Sparkles,
  Search,
  ArrowRight,
  Sprout,
  Building2,
  FileText,
  ScrollText,
  Landmark,
  Calculator,
  Compass,
  Scale,
  FileCheck,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getSubmissionDestination } from '../utils/formNavigation';
import { sampleProperties } from '../utils/data';
import { popularLandLocations } from '../utils/locationData';
import { onListingsChanged, readStorage, STORAGE_KEYS } from '../utils/storage';
import ContactModal from '../components/ContactModal';
import PropertyCard from '../components/PropertyCard';
import { useLanguage } from '../i18n/LanguageContext';

const governmentLinks = [
  { id: 1, titleKey: 'home.govLink1', icon: FileText, url: '' },
  { id: 2, titleKey: 'home.govLink2', icon: ScrollText, url: '' },
  { id: 3, titleKey: 'home.govLink3', icon: Landmark, url: '' },
  { id: 4, titleKey: 'home.govLink4', icon: ShieldCheck, url: '' },
  { id: 5, titleKey: 'home.govLink5', icon: Calculator, url: '' },
  { id: 6, titleKey: 'home.govLink6', icon: Sprout, url: '' },
  { id: 7, titleKey: 'home.govLink7', icon: Compass, url: '' },
  { id: 8, titleKey: 'home.govLink8', icon: Building2, url: '' },
  { id: 9, titleKey: 'home.govLink9', icon: Scale, url: '' },
  { id: 10, titleKey: 'home.govLink10', icon: FileCheck, url: '' },
  { id: 11, titleKey: 'home.govLink11', icon: BookOpen, url: '' },
  { id: 12, titleKey: 'home.govLink12', icon: HelpCircle, url: '' },
];

function HomePage() {
  const navigate = useNavigate();
  const { t, getPropertyDisplayTitle, isGujarati } = useLanguage();
  const [latestProperties, setLatestProperties] = useState([]);
  const [contactModal, setContactModal] = useState(null);

  // Search state
  const [searchType, setSearchType] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

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
      } catch (err) {
        setLatestProperties(sampleProperties.slice(0, 6));
      }
    };

    loadLatest();
    const cleanup = onListingsChanged(loadLatest);
    return cleanup;
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchType) params.set('type', searchType);
    if (searchLocation) {
      params.set('district', searchLocation);
      params.set('location', searchLocation);
    }
    navigate(`/buy?${params.toString()}`);
  };

  const latestActiveProperties = latestProperties.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 text-slate-900">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-4 sm:px-6 lg:space-y-8 lg:px-8">

        {/* 1. COMPACT HERO SECTION */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-sage">
                <Sparkles size={13} /> {t('app.subtitle')}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                {t('home.hero.title')}
              </h1>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                {t('home.hero.description')}
              </p>
              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={goToBuy}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-sage px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-sage-dark sm:flex-none"
                >
                  {t('home.hero.buyLand')}
                </button>
                <button
                  type="button"
                  onClick={goToSell}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:flex-none"
                >
                  {t('home.hero.sellLand')}
                </button>
              </div>
            </div>

            <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-100 sm:h-52 lg:h-60">
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85"
                alt="Agricultural & NA Land in Gujarat"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg bg-white/90 px-3 py-1.5 backdrop-blur-sm">
                <span className="text-xs font-semibold text-slate-900">
                  {t('home.verifiedListingTitle')}
                </span>
                <span className="text-[11px] font-bold text-sage">Surat & Navsari</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. USEFUL GOVERNMENT LINKS (3 COLUMNS X 4 ROWS = 12 CARDS) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Landmark size={18} className="text-sage" />
            <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              {t('home.usefulGovLinks')}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-3">
            {governmentLinks.map((item, index) => {
              const Icon = item.icon;
              const cardThemes = [
                { border: 'border-emerald-200/90 hover:border-emerald-400', cardBg: 'bg-emerald-50/90 hover:bg-emerald-100/90', iconBg: 'bg-emerald-200/70 text-emerald-800' },
                { border: 'border-sky-200/90 hover:border-sky-400', cardBg: 'bg-sky-50/90 hover:bg-sky-100/90', iconBg: 'bg-sky-200/70 text-sky-800' },
                { border: 'border-amber-200/90 hover:border-amber-400', cardBg: 'bg-amber-50/90 hover:bg-amber-100/90', iconBg: 'bg-amber-200/70 text-amber-800' },
                { border: 'border-violet-200/90 hover:border-violet-400', cardBg: 'bg-violet-50/90 hover:bg-violet-100/90', iconBg: 'bg-violet-200/70 text-violet-800' },
                { border: 'border-teal-200/90 hover:border-teal-400', cardBg: 'bg-teal-50/90 hover:bg-teal-100/90', iconBg: 'bg-teal-200/70 text-teal-800' },
                { border: 'border-orange-200/90 hover:border-orange-400', cardBg: 'bg-orange-50/90 hover:bg-orange-100/90', iconBg: 'bg-orange-200/70 text-orange-800' },
                { border: 'border-indigo-200/90 hover:border-indigo-400', cardBg: 'bg-indigo-50/90 hover:bg-indigo-100/90', iconBg: 'bg-indigo-200/70 text-indigo-800' },
                { border: 'border-cyan-200/90 hover:border-cyan-400', cardBg: 'bg-cyan-50/90 hover:bg-cyan-100/90', iconBg: 'bg-cyan-200/70 text-cyan-800' },
                { border: 'border-lime-200/90 hover:border-lime-400', cardBg: 'bg-lime-50/90 hover:bg-lime-100/90', iconBg: 'bg-lime-200/70 text-lime-800' },
                { border: 'border-rose-200/90 hover:border-rose-400', cardBg: 'bg-rose-50/90 hover:bg-rose-100/90', iconBg: 'bg-rose-200/70 text-rose-800' },
                { border: 'border-purple-200/90 hover:border-purple-400', cardBg: 'bg-purple-50/90 hover:bg-purple-100/90', iconBg: 'bg-purple-200/70 text-purple-800' },
                { border: 'border-blue-200/90 hover:border-blue-400', cardBg: 'bg-blue-50/90 hover:bg-blue-100/90', iconBg: 'bg-blue-200/70 text-blue-800' },
              ];
              const theme = cardThemes[index % cardThemes.length];
              const handleClick = () => {
                if (item.url) {
                  window.open(item.url, '_blank', 'noopener,noreferrer');
                } else {
                  toast.info(t('home.linkUpdateSoon'));
                }
              };
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={handleClick}
                  className={`group flex min-h-[96px] flex-col items-center justify-center rounded-2xl border ${theme.border} ${theme.cardBg} p-3.5 text-center shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.iconBg} transition-transform duration-300 group-hover:scale-110 shadow-2xs`}>
                    <Icon size={19} />
                  </div>
                  <span className="mt-2 text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                    {t(item.titleKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. SEARCH CARD */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Search size={16} className="text-sage" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('home.searchProperty')}
            </h2>
          </div>

          <form onSubmit={handleSearchSubmit} className="grid gap-2.5 sm:grid-cols-3">
            <div>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-sage focus:bg-white"
              >
                <option value="">{t('home.selectPropertyType')}</option>
                <option value="Agricultural Land">{t('buyerForm.agriculturalLand')}</option>
                <option value="Non-Agricultural Land">{t('buyerForm.nonAgriculturalLand')}</option>
              </select>
            </div>

            <div>
              <select
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-sage focus:bg-white"
              >
                <option value="">{t('home.selectLocation')}</option>
                <option value="Surat">{t('home.surat')}</option>
                <option value="Navsari">{t('home.navsari')}</option>
              </select>
            </div>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-sage px-4 text-xs font-bold text-white transition hover:bg-sage-dark"
            >
              <Search size={14} />
              <span>{t('home.searchProperty')}</span>
            </button>
          </form>
        </section>

        {/* 4. WE ONLY DEAL IN SECTION */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 sm:text-base">
            {t('home.weOnlyDealIn')}
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-xs transition duration-300 hover:border-emerald-300 sm:hover:-translate-y-0.5 sm:hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition duration-300 group-hover:scale-105">
                <Sprout size={22} />
              </div>
              <div className="mt-3">
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  {t('buyerForm.agriculturalLand')}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                  {isGujarati ? 'ખેતીની જમીન અને ફાર્મલૅન્ડ' : 'Farmland & agriculture'}
                </p>
              </div>
            </div>

            <div className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-xs transition duration-300 hover:border-sky-300 sm:hover:-translate-y-0.5 sm:hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 transition duration-300 group-hover:scale-105">
                <Building2 size={22} />
              </div>
              <div className="mt-3">
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  {t('buyerForm.nonAgriculturalLand')}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                  {isGujarati ? 'NA પ્લોટ અને કમર્શિયલ' : 'NA plots & investment'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. FEATURED PROPERTIES (COMPACT HORIZONTAL SWIPE) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                {t('home.featuredTitle')}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/buy')}
              className="inline-flex items-center gap-1 text-xs font-bold text-sage hover:underline"
            >
              <span>{t('home.viewAll')}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:px-0">
            {latestActiveProperties.map((property) => (
              <div key={property.id} className="w-[82%] flex-shrink-0 snap-start sm:w-[48%] md:w-[32%]">
                <PropertyCard property={property} compact={true} onContact={(data) => setContactModal({ type: 'seller', data })} />
              </div>
            ))}
          </div>
        </section>

        {/* 6. POPULAR LOCATIONS (COMPACT HORIZONTAL CHIPS) */}
        <section className="space-y-3">
          <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            {t('home.locations')}
          </h2>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
            {popularLandLocations.map((location) => (
              <button
                key={location.slug}
                type="button"
                onClick={() => navigate(`/buy?district=${encodeURIComponent(location.district)}&taluka=${encodeURIComponent(location.name)}`)}
                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs transition hover:border-sage/40 hover:bg-slate-50"
              >
                <MapPin size={13} className="text-sage" />
                <span>{t(location.name)}</span>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {location.district}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 7. WHY BROKER STREETS (COMPACT 2X2 GRID OF SMALL TRUST ITEMS) */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('home.whyBroker')}
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <ShieldCheck size={18} className="text-sage" />
              <h4 className="mt-1.5 text-xs font-bold text-slate-900">{t('home.verifiedListingTitle')}</h4>
              <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{t('home.verifiedListingDescription')}</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <MapPin size={18} className="text-sage" />
              <h4 className="mt-1.5 text-xs font-bold text-slate-900">{t('home.localExpertiseTitle')}</h4>
              <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{t('home.localExpertiseDescription')}</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <Users size={18} className="text-sage" />
              <h4 className="mt-1.5 text-xs font-bold text-slate-900">{t('home.directContactTitle')}</h4>
              <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{t('home.directContactDescription')}</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <Sparkles size={18} className="text-sage" />
              <h4 className="mt-1.5 text-xs font-bold text-slate-900">{t('home.trustedPlatformTitle')}</h4>
              <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{t('home.trustedPlatformDesc')}</p>
            </div>
          </div>
        </section>

        {/* 8. BUYER REQUIREMENTS (ONE COMPACT CARD) */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-sage">
                <Users size={12} /> {t('home.buyerRequirements')}
              </span>
              <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                {t('home.buyerLeadTitle')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('home.buyerLeadDescription')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/buyer-requirements')}
              className="inline-flex h-10 flex-shrink-0 items-center justify-center gap-1 rounded-xl border border-sage/30 bg-emerald-50/50 px-4 text-xs font-bold text-sage transition hover:bg-emerald-50"
            >
              <span>{t('home.viewRequirements')}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </section>

        {/* 9. SELL CTA (ONE COMPACT HORIZONTAL BAR) */}
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 sm:text-base">
              {t('home.wantToSellTitle')}
            </h3>
            <p className="text-xs text-slate-500">
              {t('home.wantToSellDesc')}
            </p>
          </div>
          <button
            type="button"
            onClick={goToSell}
            className="inline-flex h-10 flex-shrink-0 items-center justify-center gap-1.5 rounded-xl bg-sage px-5 text-xs font-bold text-white shadow-sm transition hover:bg-sage-dark"
          >
            <span>{t('home.hero.postLand')}</span>
            <ArrowRight size={14} />
          </button>
        </section>

      </main>

      <ContactModal
        open={Boolean(contactModal)}
        onClose={() => setContactModal(null)}
        data={contactModal?.data || {}}
        title={contactModal?.type === 'seller' ? t('buy.contactSeller') : t('home.buyerContactTitle')}
      />
    </div>
  );
}

export default HomePage;
