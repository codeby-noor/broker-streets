import { useEffect, useState } from 'react';
import { Camera, Save } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import ProfileSubPageShell from '../components/ProfileSubPageShell';
import { writeStorage } from '../utils/storage';

const initialProfileState = {
  name: '',
  mobile: '',
  whatsapp: '',
  email: '',
  state: 'Gujarat',
  district: '',
  subDistrict: '',
  address: '',
  joinedDate: '',
  memberId: '',
  profileImage: '',
};

function ProfileSettingsPage() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [profile, setProfile] = useState({ ...initialProfileState, ...user, joinedDate: user?.createdAt || '2026-01-15', memberId: user?.id || 'BS-1001' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    setProfile((current) => ({ ...current, ...user, joinedDate: user?.createdAt || current.joinedDate || '2026-01-15', memberId: user?.id || current.memberId || 'BS-1001' }));
  }, [user]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handleSaveProfile = () => {
    const nextUser = { ...user, ...profile, profileImage: profile.profileImage || user?.profileImage || '' };
    setUser(nextUser);
    setIsEditingProfile(false);
    writeStorage('broker-streets-profile-draft', nextUser);
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((current) => ({ ...current, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <ProfileSubPageShell title="Profile Settings" description="Keep your Broker Streets profile polished">
      <section className="profile-settings-panel">
        <div className="profile-settings-photo">
          <div className="profile-settings-avatar">
            {profile.profileImage ? <img src={profile.profileImage} alt="Profile preview" className="profile-settings-avatar-image" /> : <span>{(profile.name || 'U').charAt(0).toUpperCase()}</span>}
          </div>
          <div>
            <h2>{profile.name || 'Broker Streets User'}</h2>
            <p>{profile.email || 'Add an email to personalise your profile.'}</p>
            <label className="profile-photo-label">
              <Camera size={16} /> Upload Photo
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </label>
          </div>
        </div>

        <div className="profile-settings-form">
          {[
            ['name', 'Full Name', 'text'],
            ['mobile', 'Mobile', 'text'],
            ['email', 'Email', 'email'],
            ['address', 'Address', 'text'],
            ['district', 'District', 'text'],
            ['subDistrict', 'Taluka', 'text'],
          ].map(([field, label, type]) => (
            <label key={field} className="profile-settings-field">
              <span>{label}</span>
              {isEditingProfile ? (
                <input className="dashboard-input" type={type} name={field} value={profile[field] || ''} onChange={handleProfileChange} />
              ) : (
                <div className="profile-settings-readonly">{profile[field] || '—'}</div>
              )}
            </label>
          ))}
        </div>

        <div className="profile-settings-actions">
          {isEditingProfile ? (
            <>
              <button type="button" onClick={handleSaveProfile} className="profile-subpage-primary-button">
                <Save size={15} /> Save Changes
              </button>
              <button type="button" onClick={() => setIsEditingProfile(false)} className="profile-subpage-secondary-button">Cancel</button>
            </>
          ) : (
            <button type="button" onClick={() => setIsEditingProfile(true)} className="profile-subpage-primary-button">Edit Profile</button>
          )}
        </div>
      </section>
    </ProfileSubPageShell>
  );
}

export default ProfileSettingsPage;
