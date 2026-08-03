import { sampleProperties } from '../utils/data';
import { useLocation, useNavigate } from 'react-router-dom';
import SectionHeading from '../components/SectionHeading';
import PropertyCard from '../components/PropertyCard';

function SellPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const justSubmitted = location.state?.justSubmitted;
  const submittedData = location.state?.data;

  return (
    <div className="-mx-4 -mt-8 space-y-16 bg-[#FFFEFE] pb-20 sm:-mx-6 lg:-mx-8">
      <section className="bg-ink px-6 py-20 text-white sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl"><p className="eyebrow text-blue-100">Sell with Broker Streets</p>
        {justSubmitted && (
          <div className="mb-5 border border-blue-200/30 bg-white/10 p-4 text-center">
            <p className="text-lg font-semibold text-white">Thank you - your property request has been received.</p>
          </div>
        )}
        <h1 className="mt-4 max-w-2xl text-5xl font-bold leading-tight text-white sm:text-6xl">A clearer way to sell your property.</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-white/70">Share the essentials and let our local team help your property reach the right buyers.</p></div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 sm:grid-cols-3 lg:px-12"><div className="border border-slate-200 bg-white p-6 shadow-card"><strong className="block text-3xl text-primary">1,200+</strong><span className="mt-2 block text-sm text-muted">property enquiries</span></div><div className="border border-slate-200 bg-white p-6 shadow-card"><strong className="block text-3xl text-primary">14 days</strong><span className="mt-2 block text-sm text-muted">average first response</span></div><div className="border border-slate-200 bg-white p-6 shadow-card"><strong className="block text-3xl text-primary">4.8 / 5</strong><span className="mt-2 block text-sm text-muted">seller satisfaction</span></div></section>

      <section className="mx-auto max-w-7xl px-6 lg:px-12"><SectionHeading eyebrow="Why sellers choose us" title="Support that keeps the process moving" /><div className="mt-8 grid gap-4 md:grid-cols-3"><div className="border border-slate-200 bg-blue-50 p-6"><h2 className="text-lg font-semibold text-ink">Reach serious buyers</h2><p className="mt-3 text-sm leading-6 text-muted">Put your property in front of people who have already shared what they need.</p></div><div className="border border-slate-200 bg-blue-50 p-6"><h2 className="text-lg font-semibold text-ink">Clear next steps</h2><p className="mt-3 text-sm leading-6 text-muted">Get practical guidance on information, viewings, and buyer conversations.</p></div><div className="border border-slate-200 bg-blue-50 p-6"><h2 className="text-lg font-semibold text-ink">Local context</h2><p className="mt-3 text-sm leading-6 text-muted">Use our understanding of Gujarat markets to position your listing well.</p></div></div></section>

      {justSubmitted && (
        <section className="rounded-[30px] border border-slate-200 bg-white p-8 text-slate-700 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Submission received</h2>
          <p className="mt-3 text-base text-slate-600">Thanks. We will review your property details and reach out by phone within 1 business day.</p>
          {submittedData && (
            <div className="mt-4 text-sm text-slate-700">
              <p><strong>Owner:</strong> {submittedData.name}</p>
              <p><strong>Mobile:</strong> {submittedData.mobile}</p>
              <p><strong>City:</strong> {submittedData.city}</p>
              <p><strong>Type:</strong> {submittedData.type}</p>
            </div>
          )}
          <div className="mt-6 flex items-center gap-3">
            <button onClick={() => navigate('/add-property')} className="inline-flex items-center justify-center rounded-3xl bg-primary px-6 py-3 text-base font-semibold text-white">Add Another Property</button>
            <a href="mailto:help@brokerstreets.com" className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-900">Contact Support</a>
            <button onClick={() => navigate('/home')} className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-900">Back to Home</button>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 lg:px-12"><div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]"><div><SectionHeading eyebrow="Seller notes" title="Small details make a big difference" /><ul className="mt-6 space-y-4 text-sm leading-6 text-muted"><li className="flex gap-3"><span className="font-bold text-primary">01</span>Keep your expected price realistic for the neighbourhood.</li><li className="flex gap-3"><span className="font-bold text-primary">02</span>Add a clear map link so buyers can understand the location.</li><li className="flex gap-3"><span className="font-bold text-primary">03</span>Share the strongest features of the property in your notes.</li></ul></div><div><SectionHeading eyebrow="Recently sold" title="Local results" /><div className="mt-6 grid gap-4 sm:grid-cols-2">{sampleProperties.slice(0, 2).map((property) => <PropertyCard key={property.id} property={property} />)}</div></div></div></section>

      <section className="mx-6 bg-primary px-6 py-12 text-white sm:mx-10 lg:mx-auto lg:max-w-7xl lg:px-12"><div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-3xl font-bold">Ready to take the first step?</h2><p className="mt-2 text-white/75">Tell us about your property and our team will be in touch.</p></div><button type="button" onClick={() => navigate('/seller-form')} className="rounded-full bg-white px-6 py-3.5 font-semibold text-primary">Start Selling</button></div></section>
    </div>
  );
}

export default SellPage;
