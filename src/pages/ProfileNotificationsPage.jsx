import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import ProfileSubPageShell from '../components/ProfileSubPageShell';
import { getNotifications, onNotificationsChanged, writeStorage } from '../utils/storage';

const sampleNotifications = [
  { id: 'n1', type: 'Property Approved', message: 'Your flat listing was approved by admin.', read: false, createdAt: 'Today' },
  { id: 'n2', type: 'Buyer Interested', message: 'A buyer requested details for your villa.', read: true, createdAt: 'Yesterday' },
  { id: 'n3', type: 'Admin Messages', message: 'Please update your KYC documents.', read: false, createdAt: 'Yesterday' },
];

function ProfileNotificationsPage() {
  const [notifications, setNotifications] = useState(() => getNotifications() || sampleNotifications);

  useEffect(() => {
    const cleanup = onNotificationsChanged(() => setNotifications(getNotifications() || sampleNotifications));
    return cleanup;
  }, []);

  const markNotificationRead = (id) => {
    const next = notifications.map((item) => (item.id === id ? { ...item, read: true } : item));
    setNotifications(next);
    writeStorage('broker-streets-notifications', next);
  };

  const deleteNotification = (id) => {
    const next = notifications.filter((item) => item.id !== id);
    setNotifications(next);
    writeStorage('broker-streets-notifications', next);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    writeStorage('broker-streets-notifications', []);
  };

  return (
    <ProfileSubPageShell title="Notifications" description="Updates and account activity">
      <div className="profile-subpage-actions">
        <button type="button" onClick={handleClearNotifications} className="profile-subpage-secondary-button">Clear All</button>
      </div>

      {notifications.length ? (
        <div className="profile-subpage-grid profile-subpage-grid-single">
          {notifications.map((item) => (
            <article key={item.id} className={`profile-subpage-card floating-card ${item.read ? '' : 'unread-card'}`}>
              <div className="profile-subpage-card-body">
                <div className="profile-subpage-card-head compact-head">
                  <div>
                    <p className="profile-subpage-kicker">{item.createdAt || 'Update'}</p>
                    <h3>{item.type}</h3>
                  </div>
                  <span className={`profile-status-badge ${item.read ? 'inactive' : 'active'}`}>{item.read ? 'Read' : 'New'}</span>
                </div>
                <p className="profile-subpage-copy">{item.message}</p>
                <div className="profile-subpage-actions-row">
                  {!item.read ? (
                    <button type="button" onClick={() => markNotificationRead(item.id)} className="profile-subpage-row-button">
                      <CheckCheck size={15} /> Mark Read
                    </button>
                  ) : null}
                  <button type="button" onClick={() => deleteNotification(item.id)} className="profile-subpage-row-button danger">
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="profile-empty-state">
          <Bell size={28} />
          <p>No notifications</p>
        </div>
      )}
    </ProfileSubPageShell>
  );
}

export default ProfileNotificationsPage;
