import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl rounded-[30px] border border-slate-200 bg-white p-10 text-center shadow-sm">
      <h1 className="text-4xl font-semibold text-slate-900">404</h1>
      <p className="mt-4 text-lg text-slate-600">The page you are looking for could not be found.</p>
      <Link to="/" className="mt-8 inline-flex rounded-3xl bg-primary px-6 py-4 text-base font-semibold text-white">Return home</Link>
    </div>
  );
}

export default NotFoundPage;
