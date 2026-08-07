function ContactPage() {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold text-slate-900">Contact us</h1>
      <p className="mt-4 text-base leading-7 text-slate-600">Need help with a property search or sale? Reach out and we’ll reply within one business day.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-800">Phone</p>
          <p className="mt-2 text-base text-slate-700">+91 98765 43210</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-800">Email</p>
          <p className="mt-2 text-base text-slate-700">support@brokerstreets.com</p>
        </div>
      </div>
      <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-semibold text-slate-800">Head office</p>
        <p className="mt-2 text-base text-slate-700">Ahmedabad, Gujarat</p>
      </div>
    </div>
  );
}

export default ContactPage;
