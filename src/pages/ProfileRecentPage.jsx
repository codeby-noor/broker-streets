import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Search } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import ProfileSubPageShell from '../components/ProfileSubPageShell';
import { getRecentlyViewed, onRecentlyViewedChanged } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';

const sampleRecent = [{ id: 'r1', title: 'Premium Office Space', location: 'Rajkot', price: 7600000, viewedAt: '2 hours ago', image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80' }];

function ProfileRecentPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [recent, setRecent] = useState(() => getRecentlyViewed() || sampleRecent);

  useEffect(() => {
    const cleanup = onRecentlyViewedChanged(() => setRecent(getRecentlyViewed() || sampleRecent));
    return cleanup;
  }, []);

  return (
    <ProfileSubPageShell title={t('profile.recentlyViewed')} description={t('profile.recentVisitsTitle')}>
      {recent.length ? (
        <div className="profile-subpage-grid">
          {recent.map((item) => (
            <PropertyCard key={item.id} property={item} />
          ))}
        </div>
      ) : (
        <div className="profile-empty-state">
          <Eye size={28} />
          <p>{t('profile.noRecentViewsYet')}</p>
          <button type="button" onClick={() => navigate('/buy')} className="profile-subpage-primary-button">
            <Search size={15} /> {t('profile.browseProperties')}
          </button>
        </div>
      )}
    </ProfileSubPageShell>
  );
}

export default ProfileRecentPage;
