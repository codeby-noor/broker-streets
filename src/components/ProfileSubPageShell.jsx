import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function ProfileSubPageShell({ title, description, children }) {
  const navigate = useNavigate();

  return (
    <div className="profile-subpage-shell">
      <div className="profile-subpage-topbar">
        <button type="button" onClick={() => navigate(-1)} className="profile-subpage-back">
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>
        <div className="profile-subpage-title-wrap">
          <h1 className="profile-subpage-title">{title}</h1>
          {description ? <p className="profile-subpage-description">{description}</p> : null}
        </div>
      </div>

      <div className="profile-subpage-content">
        {children}
      </div>
    </div>
  );
}

export default ProfileSubPageShell;
