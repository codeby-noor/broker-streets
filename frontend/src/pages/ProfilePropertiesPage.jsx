import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Edit3, Eye, MapPin, PlusCircle, Trash2 } from 'lucide-react';
import AsyncImage from '../components/AsyncImage';
import ProfileSubPageShell from '../components/ProfileSubPageShell';
import { readStorage, STORAGE_KEYS, onListingsChanged, writeStorage } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';

const sampleListings = [
  {
    id: 'p1',
    title: 'Luxury 3BHK Waterfront Apartment',
    type: 'Apartment',
    district: 'Ahmedabad',
    subDistrict: 'Bodakdev',
    village: 'Prahlad Nagar',
    price: 8900000,
    status: 'Available',
    views: 182,
    enquiries: 24,
    favorites: 18,
    updatedAt: '2026-08-01',
    images: ['https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80'],
  },
];

const formatCurrency = (value) => {
  const numeric = Number(value || 0);
  return `₹${numeric.toLocaleString('en-IN')}`;
};

function ProfilePropertiesPage() {
  const navigate = useNavigate();
  const { t, getPropertyDisplayTitle } = useLanguage();
  const [listings, setListings] = useState(() => readStorage(STORAGE_KEYS.listings, sampleListings));
  const [deleteModalTarget, setDeleteModalTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const cleanup = onListingsChanged(() => setListings(readStorage(STORAGE_KEYS.listings, sampleListings)));
    return cleanup;
  }, []);

  const formatDate = (value) => {
    if (!value) return t('profile.recentlyUpdated');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const confirmDeleteListing = () => {
    if (!deleteModalTarget) return;
    const nextListings = (readStorage(STORAGE_KEYS.listings, sampleListings) || []).filter((item) => item.id !== deleteModalTarget.id);
    writeStorage(STORAGE_KEYS.listings, nextListings);
    setListings(nextListings);
    setDeleteModalTarget(null);
  };

  const handleToggleListingStatus = (listing) => {
    const nextListings = listings.map((item) => {
      if (item.id !== listing.id) return item;
      return { ...item, status: item.status === 'Sold' ? 'Available' : 'Sold', updatedAt: new Date().toISOString() };
    });
    writeStorage(STORAGE_KEYS.listings, nextListings);
    setListings(nextListings);
  };

  const filteredListings = listings.filter((item) => {
    if (statusFilter === 'All') return true;
    return (item.status || 'Available').toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <ProfileSubPageShell title={t('profile.myProperties')} description={t('profile.manageListings')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">{t('common.status')}:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
          >
            <option value="All">{t('buy.allTypes')}</option>
            <option value="Available">{t('dropdown.available')}</option>
            <option value="Sold">{t('dropdown.sold')}</option>
            <option value="Unavailable">{t('dropdown.unavailable')}</option>
          </select>
        </div>
        <button type="button" onClick={() => navigate('/seller-form')} className="profile-subpage-primary-button">
          <PlusCircle size={16} /> {t('profile.addProperty')}
        </button>
      </div>

      {filteredListings.length ? (
        <div className="profile-subpage-grid">
          {filteredListings.map((listing) => (
            <article key={listing.id} className="profile-subpage-card">
              <div className="profile-subpage-image-wrap">
                <AsyncImage property={listing} alt={listing.title} className="profile-card-image" containerClassName="profile-card-image-frame" />
              </div>
              <div className="profile-subpage-card-body">
                <div className="profile-subpage-card-head">
                  <div>
                    <h3>{getPropertyDisplayTitle(listing.title)}</h3>
                    <p className="profile-subpage-location">
                      <MapPin size={14} /> {t(listing.district) || t('common.district')} • {t(listing.subDistrict || listing.taluka) || t('common.taluka')} • {t(listing.village) || t('common.village')}
                    </p>
                  </div>
                  <span className={`profile-status-badge ${listing.status?.toLowerCase()}`}>{listing.status === 'Sold' ? t('dropdown.sold') : listing.status === 'Unavailable' ? t('dropdown.unavailable') : t('dropdown.available')}</span>
                </div>

                <div className="profile-subpage-meta-grid">
                  <div>
                    <span className="profile-subpage-label">{t('buy.price')}</span>
                    <span className="profile-subpage-value">{formatCurrency(listing.price || listing.priceAmount || 0)}</span>
                  </div>
                  <div>
                    <span className="profile-subpage-label">{t('common.area')}</span>
                    <span className="profile-subpage-value">{listing.area || t('common.notProvided')}</span>
                  </div>
                  <div>
                    <span className="profile-subpage-label">{t('common.status')}</span>
                    <span className="profile-subpage-value">{listing.status === 'Sold' ? t('dropdown.sold') : listing.status === 'Unavailable' ? t('dropdown.unavailable') : t('dropdown.available')}</span>
                  </div>
                </div>

                <div className="profile-subpage-card-footer">
                  <span className="profile-subpage-date">{formatDate(listing.updatedAt || listing.submittedAt)}</span>
                  <div className="profile-subpage-actions-row">
                    <button type="button" onClick={() => navigate(`/property/${listing.id}`)} className="profile-subpage-row-button">
                      <Eye size={15} /> {t('common.view')}
                    </button>
                    <button type="button" onClick={() => navigate('/seller-form', { state: { editProperty: listing } })} className="profile-subpage-row-button">
                      <Edit3 size={15} /> {t('common.edit')}
                    </button>
                    <button type="button" onClick={() => handleToggleListingStatus(listing)} className="profile-subpage-row-button success">
                      <CheckCircle2 size={15} /> {listing.status === 'Sold' ? t('common.markAvailable') : t('common.markSold')}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="profile-empty-state">
          <p>{t('profile.noPropertiesYet')}</p>
          <button type="button" onClick={() => navigate('/seller-form')} className="profile-subpage-primary-button">{t('profile.createListing')}</button>
        </div>
      )}
    </ProfileSubPageShell>
  );
}

export default ProfilePropertiesPage;
