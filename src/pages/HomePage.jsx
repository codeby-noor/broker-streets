import { useEffect, useState } from 'react';
import { ArrowRight, Building2, ChevronDown, ChevronLeft, ChevronRight, Home, KeyRound, MapPin, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSubmissionDestination } from '../utils/formNavigation';
import { popularCities, sampleProperties } from '../utils/data';
import PropertyCard from '../components/PropertyCard';
import SectionHeading from '../components/SectionHeading';

const heroSlides = [
  { title: 'Find a place that feels like yours.', copy: 'Thoughtful homes, honest details, and local guidance across Gujarat.', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=85' },
  { title: 'A better way to move home.', copy: 'Explore calm, considered spaces chosen for how you want to live.', image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1800&q=85' },
  { title: 'Your next chapter starts here.', copy: 'From first search to final viewing, we keep property simple.', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1800&q=85' }
];

const propertyTypes = [
  { label: 'Apartment', icon: Building2, copy: 'City living, made easy' },
  { label: 'Villa', icon: Home, copy: 'Room to grow into' },
  { label: 'Plot', icon: MapPin, copy: 'Build something of your own' },
  { label: 'Farm House', icon: Sparkles, copy: 'Space to slow down' },
  { label: 'Commercial', icon: KeyRound, copy: 'Spaces for what is next' },
  { label: 'Office', icon: Building2, copy: 'Workplaces that work better' }
];

const faqs = [
  ['Are the listings verified?', 'Every featured listing is reviewed for clear pricing, location, and property information before it appears in our collection.'],
  ['Can I speak with a local agent?', 'Yes. Use the contact details on any property page and our local support team will help arrange the next step.'],
  ['Do you list properties outside Gujarat?', 'Broker Streets currently focuses on Gujarat, with Ahmedabad, Surat, Vadodara, and Rajkot as our core markets.'],
  ['How does selling a property work?', 'Share your property details through the seller form. Our team reviews the information and follows up with guidance.']
];

function HomePage() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [search, setSearch] = useState('');
  const [faqOpen, setFaqOpen] = useState(0);
  const goToBuy = () => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'));
  const goToSell = () => navigate(getSubmissionDestination('sellerFormSubmitted', '/seller-form', '/sell'));

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % heroSlides.length), 6000);
    return () => window.clearInterval(timer);
  }, []);

  const current = heroSlides[slide];

  return (
    <div className="-mx-4 -mt-8 space-y-24 pb-12 sm:-mx-6 lg:-mx-8">
      <section className="relative min-h-[590px] overflow-hidden bg-ink text-white">
        <img src={current.image} alt="Featured home interior" className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(25,29,24,0.88)_0%,rgba(25,29,24,0.56)_48%,rgba(25,29,24,0.12)_100%)]" />
        <div className="relative mx-auto flex min-h-[590px] max-w-7xl items-end px-6 pb-20 sm:px-10 lg:px-12">
          <div className="max-w-2xl">
            <p className="eyebrow text-blue-100">Broker Streets / Gujarat</p>
            <h1 className="display-heading mt-5 max-w-xl text-5xl leading-[1.02] text-white sm:text-7xl">{current.title}</h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-white/80">{current.copy}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={goToBuy} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-semibold text-white transition hover:bg-sage-dark">Buy Property <ArrowRight size={18} /></button>
              <button type="button" onClick={goToSell} className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10">Sell your property</button>
            </div>
          </div>
          <div className="absolute bottom-8 right-6 flex items-center gap-2 sm:right-10 lg:right-12">
            <button type="button" aria-label="Previous slide" onClick={() => setSlide((slide - 1 + heroSlides.length) % heroSlides.length)} className="rounded-full border border-white/40 p-3 text-white hover:bg-white/10"><ChevronLeft size={18} /></button>
            <span className="px-2 text-sm text-white/80">0{slide + 1} / 0{heroSlides.length}</span>
            <button type="button" aria-label="Next slide" onClick={() => setSlide((slide + 1) % heroSlides.length)} className="rounded-full border border-white/40 p-3 text-white hover:bg-white/10"><ChevronRight size={18} /></button>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-36 max-w-6xl px-6 sm:-mt-28 lg:px-0">
        <div className="border border-stone-200 bg-cream p-4 shadow-card sm:p-6">
          <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-4 text-sm font-semibold"><span className="border-b-2 border-sage px-4 pb-3 text-ink">Buy a property</span><button type="button" onClick={goToSell} className="px-4 pb-3 text-muted hover:text-ink">Sell a property</button></div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
            <label className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-5 py-3.5"><Search size={19} className="text-sage" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by city, neighbourhood or landmark" className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-ink outline-none placeholder:text-muted" /></label>
            <select className="rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm text-ink"><option>Property type</option><option>Apartment</option><option>Villa</option><option>Plot</option></select>
            <select className="rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm text-ink"><option>Budget</option><option>Under INR 50 Lakh</option><option>INR 50 Lakh - INR 1 Cr</option></select>
            <button type="button" onClick={goToBuy} className="inline-flex items-center justify-center gap-2 rounded-full bg-sage px-6 py-3.5 font-semibold text-white hover:bg-sage-dark">Search homes <ArrowRight size={17} /></button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-12"><SectionHeading eyebrow="A considered collection" title="Homes worth coming home to" description="Browse a handpicked collection of properties with the details you need to make a confident decision." action={<button type="button" onClick={goToBuy} className="inline-flex items-center gap-2 font-semibold text-sage">View all homes <ArrowRight size={17} /></button>} /><div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{sampleProperties.slice(0, 6).map((property) => <PropertyCard key={property.id} property={property} />)}</div></section>

      <section className="bg-blue-50 py-20"><div className="mx-auto max-w-7xl px-6 lg:px-12"><SectionHeading eyebrow="Explore locally" title="Popular places to live" description="Start with the neighbourhoods people are watching, moving to, and growing with." /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{popularCities.map((city) => <button key={city.name} type="button" onClick={goToBuy} className="group relative h-72 overflow-hidden text-left text-white"><img src={city.image} alt={city.name} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" /><span className="absolute bottom-6 left-6"><strong className="display-heading block text-2xl">{city.name}</strong><span className="mt-1 block text-sm text-white/75">{city.count}</span></span></button>)}</div></div></section>

      <section className="mx-auto max-w-7xl px-6 lg:px-12"><SectionHeading eyebrow="Find your fit" title="Browse by property type" description="Whether you are searching for your first apartment or a space for your next idea, begin here." /><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{propertyTypes.map(({ label, icon: Icon, copy }) => <button key={label} type="button" onClick={goToBuy} className="group flex min-h-44 flex-col justify-between border border-stone-200 bg-white p-6 text-left shadow-card transition hover:border-sage hover:bg-sage hover:text-white"><Icon size={27} className="text-clay transition group-hover:text-white" /><span><strong className="block text-lg">{label}</strong><span className="mt-1 block text-sm text-muted group-hover:text-white/70">{copy}</span></span></button>)}</div></section>

      <section className="bg-ink py-20 text-white"><div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-12"><div><p className="eyebrow text-blue-100">The Broker Streets difference</p><h2 className="display-heading mt-4 text-4xl leading-tight sm:text-5xl">Property search, with a little more care.</h2><p className="mt-6 max-w-md leading-7 text-white/65">We believe finding a home should feel considered, not chaotic. That means useful information, local context, and someone to help when you need it.</p></div><div className="grid gap-x-8 gap-y-10 sm:grid-cols-2"><div><ShieldCheck className="text-blue-100" /><h3 className="mt-4 text-lg font-semibold">Clarity at every step</h3><p className="mt-2 text-sm leading-6 text-white/60">Straightforward property facts, pricing, and next steps.</p></div><div><MapPin className="text-blue-100" /><h3 className="mt-4 text-lg font-semibold">Local knowledge</h3><p className="mt-2 text-sm leading-6 text-white/60">A grounded view of the places that make Gujarat home.</p></div><div><Sparkles className="text-blue-100" /><h3 className="mt-4 text-lg font-semibold">Curated listings</h3><p className="mt-2 text-sm leading-6 text-white/60">A collection designed to be browsed, not battled through.</p></div><div><KeyRound className="text-blue-100" /><h3 className="mt-4 text-lg font-semibold">Human support</h3><p className="mt-2 text-sm leading-6 text-white/60">Friendly guidance from first enquiry to viewing.</p></div></div></div></section>

      <section className="mx-auto max-w-7xl px-6 lg:px-12"><SectionHeading eyebrow="A simple beginning" title="How it works" /><div className="mt-10 grid gap-8 md:grid-cols-3"><div className="border-t-2 border-sage pt-5"><span className="text-sm font-bold text-sage">01</span><h3 className="mt-4 text-xl font-semibold text-ink">Tell us what you need</h3><p className="mt-3 leading-7 text-muted">Set your city, budget, and the kind of place you have in mind.</p></div><div className="border-t-2 border-sage pt-5"><span className="text-sm font-bold text-sage">02</span><h3 className="mt-4 text-xl font-semibold text-ink">Explore with context</h3><p className="mt-3 leading-7 text-muted">Compare real property details without the usual noise.</p></div><div className="border-t-2 border-sage pt-5"><span className="text-sm font-bold text-sage">03</span><h3 className="mt-4 text-xl font-semibold text-ink">Take the next step</h3><p className="mt-3 leading-7 text-muted">Save a favourite, ask a question, or arrange a viewing.</p></div></div></section>

      <section className="bg-blue-50 py-20"><div className="mx-auto max-w-5xl px-6 text-center"><p className="eyebrow">A few kind words</p><blockquote className="display-heading mt-6 text-3xl leading-tight text-ink sm:text-5xl">"The whole process felt calm and considered. I could actually understand what I was looking at."</blockquote><p className="mt-6 text-sm font-semibold text-sage">Riya Shah - Ahmedabad homeowner</p></div></section>

      <section className="mx-auto max-w-4xl px-6"><SectionHeading eyebrow="Need to know" title="Frequently asked questions" /><div className="mt-8 divide-y divide-stone-200 border-y border-stone-200">{faqs.map(([question, answer], index) => <div key={question}><button type="button" onClick={() => setFaqOpen(faqOpen === index ? -1 : index)} className="flex w-full items-center justify-between gap-6 py-5 text-left text-base font-semibold text-ink">{question}<ChevronDown size={19} className={`shrink-0 transition ${faqOpen === index ? 'rotate-180 text-sage' : 'text-muted'}`} /></button>{faqOpen === index && <p className="max-w-2xl pb-5 pr-10 leading-7 text-muted">{answer}</p>}</div>)}</div></section>

      <section className="mx-6 overflow-hidden bg-clay px-6 py-16 text-white sm:mx-10 lg:mx-auto lg:max-w-7xl lg:px-16"><div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between"><div><p className="eyebrow text-white/70">Your next move</p><h2 className="display-heading mt-3 max-w-xl text-4xl leading-tight sm:text-5xl">Ready to find your place?</h2><p className="mt-4 max-w-lg text-white/75">Start with a better way to browse homes across Gujarat.</p></div><button type="button" onClick={goToBuy} className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-cream px-6 py-3.5 font-semibold text-ink hover:bg-white">Explore properties <ArrowRight size={18} /></button></div></section>
    </div>
  );
}

export default HomePage;
