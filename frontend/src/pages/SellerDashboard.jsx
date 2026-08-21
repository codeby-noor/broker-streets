import { useEffect, useMemo, useState } from 'react';
import { Eye, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { onListingsChanged, readStorage, STORAGE_KEYS, writeStorage } from '../utils/storage';
import AsyncImage from '../components/AsyncImage';
import { useLanguage } from '../i18n/LanguageContext';
import { formatIndianPrice } from '../utils/format';

function SellerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [listings, setListings] = useState(() => readStorage(STORAGE_KEYS.listings, []));
  const [selectedListing, setSelectedListing] = useState(location.state?.listing || null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { t, getPropertyDisplayTitle } = useLanguage();
  const statusLabel = (status) => ({
    Available: t('profile.available'),
    Sold: t('profile.sold'),
    Pending: t('sellerDashboard.pending'),
  }[status] || status);

  useEffect(() => {
    const stored = readStorage(STORAGE_KEYS.listings, []);
    setListings(stored);
    if (!selectedListing && stored[0]) setSelectedListing(stored[0]);
  }, [location.state?.refreshed]);

  useEffect(() => {
    const cleanup = onListingsChanged(() => {
      const stored = readStorage(STORAGE_KEYS.listings, []);
      setListings(stored);
      setSelectedListing((current) => {
        if (!current) return stored[0] || null;
        return stored.find((item) => item.id === current.id) || stored[0] || null;
      });
    });
    return cleanup;
  }, []);

  const stats = useMemo(() => ({
    total: listings.length,
    available: listings.filter((listing) => listing.status === 'Available').length,
    sold: listings.filter((listing) => listing.status === 'Sold').length,
    pending: listings.filter((listing) => listing.status === 'Pending').length,
  }), [listings]);

  const handleDelete = () => {
    const nextListings = listings.filter((listing) => listing.id !== deleteTarget.id);
    writeStorage(STORAGE_KEYS.listings, nextListings);
    writeStorage(STORAGE_KEYS.lastProperty, nextListings[0] || null);
    setListings(nextListings);
    setSelectedListing(nextListings[0] || null);
    setDeleteTarget(null);
    toast.success(t('sellerDashboard.listingDeleted'));
  };

  const handleDuplicate = (listing) => {
    const duplicate = {
      ...listing,
      id: `listing-${Date.now()}`,
      title: `${listing.title} ${t('sellerDashboard.copySuffix')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const nextListings = [duplicate, ...listings];
    writeStorage(STORAGE_KEYS.listings, nextListings);
    setListings(nextListings);
    setSelectedListing(duplicate);
    toast.success(t('sellerDashboard.listingDuplicated'));
  };

  const handleToggleStatus = (listing) => {
    const nextListings = listings.map((item) =>
      item.id === listing.id
        ? { ...item, status: item.status === 'Sold' ? 'Available' : 'Sold', updatedAt: new Date().toISOString() }
        : item
    );
    writeStorage(STORAGE_KEYS.listings, nextListings);
    setListings(nextListings);
    setSelectedListing((current) => (current?.id === listing.id ? nextListings.find((item) => item.id === listing.id) : current));
    toast.success(`${t('sellerDashboard.listingMarked')} ${listing.status === 'Sold' ? t('profile.available') : t('profile.sold')}.`);
  };

  return (
    <div className="-mx-4 -mt-8 min-h-screen bg-cream px-3 pb-28 pt-6 sm:-mx-6 sm:px-6 sm:pb-20 sm:pt-10 lg:-mx-8 lg:px-8 dark:bg-dark-bg">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[32px] bg-[#1D5CA9] p-5 text-white shadow-card sm:p-10 dark:bg-dark-card dark:border dark:border-dark-border">
          <p className="eyebrow text-white/80">{t('sellerDashboard.eyebrow')}</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{t('sellerDashboard.title')}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">{t('sellerDashboard.description')}</p>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-4">
          {[
            { label: t('sellerDashboard.totalProperties'), value: stats.total },
            { label: t('profile.available'), value: stats.available },
            { label: t('profile.sold'), value: stats.sold },
            { label: t('sellerDashboard.pending'), value: stats.pending },
          ].map((item) => (
            <div key={item.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
              <span className="text-sm text-muted">{item.label}</span>
              <strong className="mt-2 block text-2xl text-ink">{item.value}</strong>
            </div>
          ))}
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-ink">{t('sellerDashboard.yourListings')}</h2>
          <button type="button" onClick={() => navigate('/seller-form')} className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-5 py-3 font-semibold text-primary hover:bg-primary/10"><Plus size={18} /> {t('profile.addProperty')}</button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {listings.map((listing) => (
              <article key={listing.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <AsyncImage property={listing} alt={listing.title} className="h-20 w-24 rounded-2xl object-cover" containerClassName="h-20 w-24 overflow-hidden rounded-2xl" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-ink">{getPropertyDisplayTitle(listing.title)}</h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${listing.status === 'Sold' ? 'bg-amber-500/15 text-amber-700' : listing.status === 'Pending' ? 'bg-slate-700/10 text-slate-700' : 'bg-success/15 text-success'}`}>{statusLabel(listing.status)}</span>
                      </div>
                      <p className="mt-2 flex items-center gap-2 text-sm text-muted"><MapPin size={14} className="text-primary" />{listing.address}, {listing.city}</p>
                      <p className="mt-2 text-sm text-muted">{formatIndianPrice(listing.price || listing.priceAmount)} • {listing.area}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => navigate(`/property/${listing.id}`)} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-ink sm:min-h-auto"><Eye size={16} /> {t('common.view')}</button>
                    <button type="button" onClick={() => navigate('/seller-form')} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-ink sm:min-h-auto"><Pencil size={16} /> {t('common.edit')}</button>
                    <button type="button" onClick={() => handleDuplicate(listing)} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-ink sm:min-h-auto">{t('common.duplicate')}</button>
                    <button type="button" onClick={() => handleToggleStatus(listing)} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-ink sm:min-h-auto">{listing.status === 'Sold' ? t('common.markAvailable') : t('common.markSold')}</button>
                    <button type="button" onClick={() => setDeleteTarget(listing)} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-red-200 px-3 py-2 text-sm font-semibold text-danger sm:min-h-auto"><Trash2 size={16} /> {t('common.delete')}</button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-card">
            <p className="eyebrow">{t('sellerDashboard.selectedListing')}</p>
            {selectedListing ? (
              <>
                <h3 className="mt-3 text-xl font-semibold text-ink">{getPropertyDisplayTitle(selectedListing.title)}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{selectedListing.description}</p>
                <div className="mt-6 space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="flex items-center justify-between"><span>{t('common.price')}</span><strong>{formatIndianPrice(selectedListing.price || selectedListing.priceAmount)}</strong></div>
                  <div className="flex items-center justify-between"><span>{t('common.area')}</span><strong>{selectedListing.area}</strong></div>
                  <div className="flex items-center justify-between"><span>{t('sellerDashboard.status')}</span><strong>{statusLabel(selectedListing.status)}</strong></div>
                  <div className="flex items-center justify-between"><span>{t('sellerDashboard.location')}</span><strong>{selectedListing.city}</strong></div>
                </div>
              </>
            ) : <p className="mt-3 text-sm text-muted">{t('sellerDashboard.selectListingHint')}</p>}
          </aside>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
          <div className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-xl font-semibold text-ink">{t('sellerDashboard.deleteTitle')}</h3>
            <p className="mt-3 text-sm leading-7 text-muted">{t('sellerDashboard.deleteDescription')}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">{t('common.cancel')}</button>
              <button type="button" onClick={handleDelete} className="rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white">{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerDashboard;
