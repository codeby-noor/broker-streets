import { Link, useNavigate } from 'react-router-dom';
import { getSubmissionDestination } from '../utils/formNavigation';

function BuyerSuccess() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Thank you</h1>
      <p className="mt-4 text-base text-slate-700">Your enquiry has been received. Our team will contact you shortly.</p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <button onClick={() => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'))} className="inline-flex items-center justify-center rounded-3xl bg-primary px-6 py-3 text-base font-semibold text-white">Browse Properties</button>
        <Link to="/home" className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-900">Back to Home</Link>
      </div>
    </div>
  );
}

export default BuyerSuccess;
