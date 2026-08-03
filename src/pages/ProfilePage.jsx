import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';

function ProfilePage() {
  const navigate = useNavigate();
  const logout = useUserStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="space-y-10">
      <section className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">My profile</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">Manage your contact details and saved preferences for buying or selling.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-800">Name</p>
            <p className="mt-2 text-base text-slate-700">Vijay Patel</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-800">Phone</p>
            <p className="mt-2 text-base text-slate-700">+91 98765 43210</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-800">Preferred city</p>
            <p className="mt-2 text-base text-slate-700">Ahmedabad</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-800">Default search</p>
            <p className="mt-2 text-base text-slate-700">2 BHK apartment</p>
          </div>
        </div>
      </section>
      <section className="rounded-[30px] border border-slate-200 bg-slate-50 p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Recent activity</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>• Viewed 12 properties in Ahmedabad</li>
          <li>• Saved a 3 BHK villa near Surat</li>
          <li>• Asked for help selling a home in Vadodara</li>
        </ul>
        <button type="button" onClick={handleLogout} className="mt-8 rounded-3xl bg-primary px-6 py-4 text-base font-semibold text-white">
          Log out
        </button>
      </section>
    </div>
  );
}

export default ProfilePage;
