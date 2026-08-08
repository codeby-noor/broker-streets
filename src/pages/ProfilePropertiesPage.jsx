import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Edit3, Eye, MapPin, PlusCircle, Trash2 } from 'lucide-react';
import AsyncImage from '../components/AsyncImage';
import ProfileSubPageShell from '../components/ProfileSubPageShell';
import { readStorage, STORAGE_KEYS, onListingsChanged, writeStorage } from '../utils/storage';

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

const formatDate = (value) => {
  if (!value) return 'Recently updated';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

function ProfilePropertiesPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState(() => readStorage(STORAGE_KEYS.listings, sampleListings));

  useEffect(() => {
    const cleanup = onListingsChanged(() => setListings(readStorage(STORAGE_KEYS.listings, sampleListings)));
    return cleanup;
  }, []);

  const handleDeleteListing = (listing) => {
    const nextListings = (readStorage(STORAGE_KEYS.listings, sampleListings) || []).filter((item) => item.id !== listing.id);
    writeStorage(STORAGE_KEYS.listings, nextListings);
    setListings(nextListings);
  };

  const handleToggleListingStatus = (listing) => {
    const nextListings = listings.map((item) => {
      if (item.id !== listing.id) return item;
      return { ...item, status: item.status === 'Sold' ? 'Available' : 'Sold', updatedAt: new Date().toISOString() };
    });
    writeStorage(STORAGE_KEYS.listings, nextListings);
    setListings(nextListings);
  };

  return (
    <ProfileSubPageShell title="My Properties" description="Your Listings">
      <div className="profile-subpage-actions">
        <button type="button" onClick={() => navigate('/seller-form')} className="profile-subpage-primary-button">
          <PlusCircle size={16} /> Add Property
        </button>
      </div>

      {listings.length ? (
        <div className="profile-subpage-grid">
          {listings.map((listing) => (
            <article key={listing.id} className="profile-subpage-card">
              <div className="profile-subpage-image-wrap">
                <AsyncImage property={listing} alt={listing.title} className="profile-card-image" containerClassName="profile-card-image-frame" />
              </div>
              <div className="profile-subpage-card-body">
                <div className="profile-subpage-card-head">
                  <div>
                    <h3>{listing.title}</h3>
                    <p className="profile-subpage-location">
                      <MapPin size={14} /> {listing.district || 'District'} • {listing.subDistrict || listing.taluka || 'Taluka'} • {listing.village || 'Village'}
                    </p>
                  </div>
                  <span className={`profile-status-badge ${listing.status?.toLowerCase()}`}>{listing.status}</span>
                </div>

                <div className="profile-subpage-meta-grid">
                  <div>
                    <span className="profile-subpage-label">Price</span>
                    <span className="profile-subpage-value">{formatCurrency(listing.price || listing.priceAmount || 0)}</span>
                  </div>
                  <div>
                    <span className="profile-subpage-label">Area</span>
                    <span className="profile-subpage-value">{listing.area || 'Area not specified'}</span>
                  </div>
                  <div>
                    <span className="profile-subpage-label">Status</span>
                    <span className="profile-subpage-value">{listing.status}</span>
                  </div>
                </div>

                <div className="profile-subpage-card-footer">
                  <span className="profile-subpage-date">{formatDate(listing.updatedAt || listing.submittedAt)}</span>
                  <div className="profile-subpage-actions-row">
                    <button type="button" onClick={() => navigate(`/property/${listing.id}`)} className="profile-subpage-row-button">
                      <Eye size={15} /> View
                    </button>
                    <button type="button" onClick={() => navigate('/seller-form', { state: { editProperty: listing } })} className="profile-subpage-row-button">
                      <Edit3 size={15} /> Edit
                    </button>
                    <button type="button" onClick={() => handleDeleteListing(listing)} className="profile-subpage-row-button danger">
                      <Trash2 size={15} /> Delete
                    </button>
                    <button type="button" onClick={() => handleToggleListingStatus(listing)} className="profile-subpage-row-button success">
                      <CheckCircle2 size={15} /> {listing.status === 'Sold' ? 'Mark Available' : 'Mark Sold'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="profile-empty-state">
          <p>No properties yet</p>
          <button type="button" onClick={() => navigate('/seller-form')} className="profile-subpage-primary-button">Create Listing</button>
        </div>
      )}
    </ProfileSubPageShell>
  );
}

export default ProfilePropertiesPage;
