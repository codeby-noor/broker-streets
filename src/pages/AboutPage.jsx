import { useNavigate } from 'react-router-dom';
import { getSubmissionDestination } from '../utils/formNavigation';

function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      <section className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">About Broker Streets</h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          Broker Streets is built for home buyers and sellers who want a calm, clear experience. We focus on Gujarat cities and deliver property information in a way that is easy to read and act on.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-2xl font-semibold text-slate-900">Our mission</h2>
          <p className="mt-3 text-slate-600">Provide a trustworthy property search for mature buyers and sellers, with precise details, simple navigation, and local support.</p>
        </div>
        <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-2xl font-semibold text-slate-900">Why choose us</h2>
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            <li>• Verified property information</li>
            <li>• Easy filters and clear results</li>
            <li>• Friendly support for every step</li>
          </ul>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Ready to get started?</h2>
        <p className="mt-3 text-slate-600">Find a home or list your property in minutes.</p>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <button onClick={() => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'))} className="inline-flex items-center justify-center rounded-3xl bg-primary px-6 py-4 text-base font-semibold text-white">Browse homes</button>
          <button onClick={() => navigate(getSubmissionDestination('sellerFormSubmitted', '/seller-form', '/sell'))} className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-4 text-base font-semibold text-slate-900">Sell now</button>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
