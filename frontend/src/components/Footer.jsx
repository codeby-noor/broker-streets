import { Link } from 'react-router-dom';
import logo from '../assets/images/logo.png';

function Footer() {
  return (
    <footer className="border-t border-slate-200/70 bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-sm text-center sm:text-left">
          <Link to="/home" className="inline-flex items-center gap-3">
            <img src={logo} alt="Broker Streets logo" className="h-10 w-auto object-contain" />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600">
            Broker Streets helps people buy and sell property with a simple, trustworthy experience.
          </p>
        </div>
        <div className="grid gap-6 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-800">Support</p>
            <p className="mt-3 text-sm text-slate-600">help@brokerstreets.com</p>
            <p className="text-sm text-slate-600">+91 98765 43210</p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-800">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link to="/about" className="hover:text-primary">About</Link></li>
              <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-800">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Privacy</li>
              <li>Terms</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
