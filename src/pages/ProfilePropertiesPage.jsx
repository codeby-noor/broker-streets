import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Edit3, Eye, MapPin, PlusCircle, XCircle } from 'lucide-react';
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

import { formatIndianPrice, standardizePriceUnit } from '../utils/format';

const formatPriceWithUnit = (listing) => {
  const priceText = formatIndianPrice(listing?.price || listing?.priceAmount || 0);
  if (!listing?.priceUnit) return priceText;
  const stdUnit = standardizePriceUnit(listing.priceUnit);
  return `${priceText} per ${stdUnit}`;
};

function ProfilePropertiesPage() {
  const navigate = useNavigate();
  const { t, getPropertyDisplayTitle } = useLanguage();
  const [listings, setListings] = useState(() => readStorage(STORAGE_KEYS.listings, sampleListings));
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

  const changeStatus = (listing, nextStatus) => {
    const nextListings = listings.map((item) => {
      if (item.id !== listing.id) return item;
      return { ...item, status: nextStatus, updatedAt: new Date().toISOString() };
    });
    writeStorage(STORAGE_KEYS.listings, nextListings);
    setListings(nextListings);
  };

  const getStatusLabel = (status) => {
    if (status === 'Sold') return t('dropdown.sold');
    if (status === 'Unavailable') return t('dropdown.unavailable');
    return t('dropdown.available');
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
                  <span className={`profile-status-badge ${listing.status?.toLowerCase()}`}>{getStatusLabel(listing.status)}</span>
                </div>

                <div className="profile-subpage-meta-grid">
                  <div>
                    <span className="profile-subpage-label">{t('buy.price')}</span>
                    <span className="profile-subpage-value">{formatPriceWithUnit(listing)}</span>
                  </div>
                  <div>
                    <span className="profile-subpage-label">{t('common.area')}</span>
                    <span className="profile-subpage-value">{listing.area || t('common.notProvided')}</span>
                  </div>
                  <div>
                    <span className="profile-subpage-label">{t('common.status')}</span>
                    <span className="profile-subpage-value">{getStatusLabel(listing.status)}</span>
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
                    <div className="profile-subpage-status-actions">
                      <button
                        type="button"
                        onClick={() => changeStatus(listing, 'Available')}
                        className={`profile-status-action available ${listing.status === 'Available' ? 'active' : ''}`}
                      >
                        <CheckCircle2 size={14} /> {t('dropdown.available')}
                      </button>
                      <button
                        type="button"
                        onClick={() => changeStatus(listing, 'Unavailable')}
                        className={`profile-status-action unavailable ${listing.status === 'Unavailable' ? 'active' : ''}`}
                      >
                        <XCircle size={14} /> {t('dropdown.unavailable')}
                      </button>
                      <button
                        type="button"
                        onClick={() => changeStatus(listing, 'Sold')}
                        className={`profile-status-action sold ${listing.status === 'Sold' ? 'active' : ''}`}
                      >
                        <CheckCircle2 size={14} /> {t('dropdown.sold')}
                      </button>
                    </div>
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
