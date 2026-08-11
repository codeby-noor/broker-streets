import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, PlusCircle } from 'lucide-react';
import ProfileSubPageShell from '../components/ProfileSubPageShell';
import { getBuyerLeads, onBuyerLeadsChanged } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';

const sampleBuyerRequests = [{ id: 'b1', preferredState: 'Gujarat', preferredDistrict: 'Vadodara', preferredTaluka: 'Waghodia', preferredVillages: ['Nadiad'], propertyType: 'Agricultural Land', purpose: 'Investment', requirements: 'Near school and metro connectivity.', createdAt: '2026-08-01' }];

function ProfileRequirementsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [buyerRequests, setBuyerRequests] = useState(() => getBuyerLeads() || sampleBuyerRequests);

  useEffect(() => {
    const cleanup = onBuyerLeadsChanged(() => setBuyerRequests(getBuyerLeads() || sampleBuyerRequests));
    return cleanup;
  }, []);

  const formatDate = (value) => {
    if (!value) return t('profile.recentlyUpdated');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <ProfileSubPageShell title={t('profile.buyerRequirements')} description={t('profile.manageLandRequirements')}>
      <div className="profile-subpage-actions">
        <button type="button" onClick={() => navigate('/buyer-form')} className="profile-subpage-primary-button">
          <PlusCircle size={16} /> {t('profile.submitRequirement')}
        </button>
      </div>

      {buyerRequests.length ? (
        <div className="profile-subpage-grid profile-subpage-grid-single">
          {buyerRequests.map((request) => (
            <article key={request.id} className="profile-subpage-card floating-card">
              <div className="profile-subpage-card-body">
                <div className="profile-subpage-card-head">
                  <div>
                    <p className="profile-subpage-kicker">{t('profile.requirementLabel')} #{request.id}</p>
                    <h3>{request.propertyType === 'Agricultural Land' ? t('buyerForm.agriculturalLand') : request.propertyType === 'Non-Agricultural Land' ? t('buyerForm.nonAgriculturalLand') : request.propertyType || t('profile.landRequirementFallback')}</h3>
                  </div>
                  <span className="profile-status-badge active">{request.purpose || t('common.ready')}</span>
                </div>

                <div className="profile-subpage-meta-grid">
                  <div>
                    <span className="profile-subpage-label">{t('common.propertyType')}</span>
                    <span className="profile-subpage-value">{request.propertyType === 'Agricultural Land' ? t('buyerForm.agriculturalLand') : request.propertyType === 'Non-Agricultural Land' ? t('buyerForm.nonAgriculturalLand') : request.propertyType || '—'}</span>
                  </div>
                  <div>
                    <span className="profile-subpage-label">{t('buyerForm.purpose')}</span>
                    <span className="profile-subpage-value">{request.purpose || '—'}</span>
                  </div>
                  <div>
                    <span className="profile-subpage-label">{t('profile.districtLabel')}</span>
                    <span className="profile-subpage-value">{request.preferredDistrict || '—'}</span>
                  </div>
                  <div>
                    <span className="profile-subpage-label">{t('profile.talukaLabel')}</span>
                    <span className="profile-subpage-value">{request.preferredTaluka || '—'}</span>
                  </div>
                  <div className="profile-subpage-wide">
                    <span className="profile-subpage-label">{t('profile.villagesLabel')}</span>
                    <span className="profile-subpage-value">{Array.isArray(request.preferredVillages) ? request.preferredVillages.join(', ') : request.preferredVillages || '—'}</span>
                  </div>
                  <div className="profile-subpage-wide">
                    <span className="profile-subpage-label">{t('profile.requirementsLabel')}</span>
                    <span className="profile-subpage-value">{request.requirements || '—'}</span>
                  </div>
                  <div>
                    <span className="profile-subpage-label">{t('common.status')}</span>
                    <span className="profile-subpage-value">{request.status || t('dropdown.available')}</span>
                  </div>
                  <div>
                    <span className="profile-subpage-label">{t('profile.postedDateLabel')}</span>
                    <span className="profile-subpage-value">{formatDate(request.createdAt)}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="profile-empty-state">
          <BadgeCheck size={28} />
          <p>{t('profile.noBuyerRequirementsYet')}</p>
          <button type="button" onClick={() => navigate('/buyer-form')} className="profile-subpage-primary-button">{t('profile.submitRequirement')}</button>
        </div>
      )}
    </ProfileSubPageShell>
  );
}

export default ProfileRequirementsPage;
