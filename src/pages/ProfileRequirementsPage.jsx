import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, MapPin, PlusCircle } from 'lucide-react';
import ProfileSubPageShell from '../components/ProfileSubPageShell';
import { getBuyerLeads, onBuyerLeadsChanged } from '../utils/storage';

const sampleBuyerRequests = [{ id: 'b1', preferredState: 'Gujarat', preferredDistrict: 'Vadodara', preferredTaluka: 'Waghodia', preferredVillages: ['Nadiad'], propertyType: 'Agricultural Land', purpose: 'Investment', requirements: 'Near school and metro connectivity.', createdAt: '2026-08-01' }];

const formatDate = (value) => {
  if (!value) return 'Recently updated';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

function ProfileRequirementsPage() {
  const navigate = useNavigate();
  const [buyerRequests, setBuyerRequests] = useState(() => getBuyerLeads() || sampleBuyerRequests);

  useEffect(() => {
    const cleanup = onBuyerLeadsChanged(() => setBuyerRequests(getBuyerLeads() || sampleBuyerRequests));
    return cleanup;
  }, []);

  return (
    <ProfileSubPageShell title="Buyer Requirements" description="Requirements captured from your buyers">
      <div className="profile-subpage-actions">
        <button type="button" onClick={() => navigate('/buyer-form')} className="profile-subpage-primary-button">
          <PlusCircle size={16} /> Create Requirement
        </button>
      </div>

      {buyerRequests.length ? (
        <div className="profile-subpage-grid profile-subpage-grid-single">
          {buyerRequests.map((request) => (
            <article key={request.id} className="profile-subpage-card floating-card">
              <div className="profile-subpage-card-body">
                <div className="profile-subpage-card-head">
                  <div>
                    <p className="profile-subpage-kicker">Requirement #{request.id}</p>
                    <h3>{request.propertyType || 'Land requirement'}</h3>
                  </div>
                  <span className="profile-status-badge active">{request.purpose || 'Ready'}</span>
                </div>

                <div className="profile-subpage-meta-grid">
                  <div>
                    <span className="profile-subpage-label">Property Type</span>
                    <span className="profile-subpage-value">{request.propertyType || '—'}</span>
                  </div>
                  <div>
                    <span className="profile-subpage-label">Purpose</span>
                    <span className="profile-subpage-value">{request.purpose || '—'}</span>
                  </div>
                  <div>
                    <span className="profile-subpage-label">District</span>
                    <span className="profile-subpage-value">{request.preferredDistrict || '—'}</span>
                  </div>
                  <div>
                    <span className="profile-subpage-label">Taluka</span>
                    <span className="profile-subpage-value">{request.preferredTaluka || '—'}</span>
                  </div>
                  <div className="profile-subpage-wide">
                    <span className="profile-subpage-label">Selected Villages</span>
                    <span className="profile-subpage-value">{Array.isArray(request.preferredVillages) ? request.preferredVillages.join(', ') : request.preferredVillages || '—'}</span>
                  </div>
                  <div className="profile-subpage-wide">
                    <span className="profile-subpage-label">Additional Requirements</span>
                    <span className="profile-subpage-value">{request.requirements || '—'}</span>
                  </div>
                  <div>
                    <span className="profile-subpage-label">Status</span>
                    <span className="profile-subpage-value">{request.status || 'Open'}</span>
                  </div>
                  <div>
                    <span className="profile-subpage-label">Submitted</span>
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
          <p>No buyer requirements yet</p>
          <button type="button" onClick={() => navigate('/buyer-form')} className="profile-subpage-primary-button">Create Requirement</button>
        </div>
      )}
    </ProfileSubPageShell>
  );
}

export default ProfileRequirementsPage;
