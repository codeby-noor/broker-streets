import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Search } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import ProfileSubPageShell from '../components/ProfileSubPageShell';
import { getSavedProperties, onSavedPropertiesChanged } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';

const sampleSaved = [{ id: 's1', title: 'Sea-facing Penthouse', location: 'Bhavnagar', price: 9800000, image: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=900&q=80' }];

function ProfileSavedPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [saved, setSaved] = useState(() => getSavedProperties() || sampleSaved);

  useEffect(() => {
    const cleanup = onSavedPropertiesChanged(() => setSaved(getSavedProperties() || sampleSaved));
    return cleanup;
  }, []);

  return (
    <ProfileSubPageShell title={t('profile.savedProperties')} description={t('profile.shortlistedProperties')}>
      {saved.length ? (
        <div className="profile-subpage-grid">
          {saved.map((item) => (
            <PropertyCard key={item.id} property={item} />
          ))}
        </div>
      ) : (
        <div className="profile-empty-state">
          <Bookmark size={28} />
          <p>{t('profile.noSavedPropertiesYet')}</p>
          <button type="button" onClick={() => navigate('/buy')} className="profile-subpage-primary-button">
            <Search size={15} /> {t('profile.browseProperties')}
          </button>
        </div>
      )}
    </ProfileSubPageShell>
  );
}

export default ProfileSavedPage;
