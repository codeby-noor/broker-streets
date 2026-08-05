import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  UserCircle2,
  Building2,
  BadgeCheck,
  Bookmark,
  Eye,
  Bell,
  Settings,
  LifeBuoy,
  LogOut,
  Menu,
  Search,
  PlusCircle,
  Camera,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Sparkles,
  FileText,
  Image as ImageIcon,
  ChevronRight,
  Trash2,
  Edit3,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  CircleDollarSign,
  House,
  Upload,
} from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { readStorage, writeStorage, STORAGE_KEYS, getBuyerLeads, getNotifications, getSavedProperties, getRecentlyViewed, onBuyerLeadsChanged, onNotificationsChanged, onSavedPropertiesChanged, onRecentlyViewedChanged, removeBuyerLead, removeSavedProperty, onListingsChanged } from '../utils/storage';
import AsyncImage from '../components/AsyncImage';
import ContactModal from '../components/ContactModal';
import '../styles/profile-dashboard.css';

const sidebarItems = [
  { key: 'overview', label: 'Dashboard', icon: LayoutGrid },
  { key: 'profile', label: 'My Profile', icon: UserCircle2 },
  { key: 'properties', label: 'My Properties', icon: Building2 },
  { key: 'buyers', label: 'Buyer Requirements', icon: BadgeCheck },
  { key: 'saved', label: 'Saved Properties', icon: Bookmark },
  { key: 'recent', label: 'Recently Viewed', icon: Eye },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'help', label: 'Help & Support', icon: LifeBuoy },
];

const initialProfileState = {
  name: '',
  mobile: '',
  whatsapp: '',
  email: '',
  state: 'Gujarat',
  district: '',
  subDistrict: '',
  joinedDate: '',
  profileImage: '',
};

const sampleListings = [
  {
    id: 'p1',
    title: 'Luxury 3BHK Waterfront Apartment',
    type: 'Apartment',
    district: 'Ahmedabad',
    taluka: 'Bodakdev',
    price: 8900000,
    priceType: 'Sale',
    status: 'Approved',
    views: 182,
    enquiries: 24,
    favorites: 18,
    updatedAt: '2026-08-01',
    images: ['https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80'],
    documents: [{ name: 'Floor Plan.pdf', uploadedAt: '2026-07-22' }],
  },
  {
    id: 'p2',
    title: 'Modern Villa with Garden View',
    type: 'Villa',
    district: 'Surat',
    taluka: 'Adajan',
    price: 12500000,
    priceType: 'Sale',
    status: 'Pending',
    views: 96,
    enquiries: 9,
    favorites: 7,
    updatedAt: '2026-07-19',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80'],
    documents: [{ name: 'NOC.pdf', uploadedAt: '2026-07-16' }],
  },
];

const sampleBuyerRequests = [
  {
    id: 'b1',
    preferredState: 'Gujarat',
    preferredDistrict: 'Vadodara',
    preferredTaluka: 'Waghodia',
    propertyType: '2 BHK Apartment',
    budget: '₹55L – ₹70L',
    requirements: 'Near school and metro connectivity.',
    audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: '01:14',
  },
];

const sampleSaved = [
  { id: 's1', title: 'Sea-facing Penthouse', location: 'Bhavnagar', price: 9800000, image: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=900&q=80' },
];

const sampleRecent = [
  { id: 'r1', title: 'Premium Office Space', location: 'Rajkot', price: 7600000, viewedAt: '2 hours ago', image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80' },
];

const sampleNotifications = [
  { id: 'n1', type: 'Property Approved', message: 'Your flat listing was approved by admin.', read: false },
  { id: 'n2', type: 'Buyer Interested', message: 'A buyer requested details for your villa.', read: true },
  { id: 'n3', type: 'Admin Messages', message: 'Please update your KYC documents.', read: false },
];

const statConfigs = [
  { key: 'listed', label: 'Total Properties Listed', gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)', icon: Building2, countKey: 'listed' },
  { key: 'requests', label: 'Total Buyer Requests', gradient: 'linear-gradient(135deg, #0f766e, #14b8a6)', icon: BadgeCheck, countKey: 'requests' },
  { key: 'saved', label: 'Saved Properties', gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)', icon: Bookmark, countKey: 'saved' },
  { key: 'views', label: 'Property Views', gradient: 'linear-gradient(135deg, #ea580c, #fb923c)', icon: Eye, countKey: 'views' },
  { key: 'enquiries', label: 'Total Enquiries', gradient: 'linear-gradient(135deg, #be185d, #f472b6)', icon: Mail, countKey: 'enquiries' },
];

function ProfileDashboard() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const logout = useUserStore((state) => state.logout);
  const setUser = useUserStore((state) => state.setUser);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState({ ...initialProfileState, ...user, joinedDate: user.createdAt || '2026-01-15' });
  const [listings, setListings] = useState(() => readStorage(STORAGE_KEYS.listings, sampleListings));
  const [buyerRequests, setBuyerRequests] = useState(() => getBuyerLeads() || sampleBuyerRequests);
  const [saved, setSaved] = useState(() => getSavedProperties() || sampleSaved);
  const [recent, setRecent] = useState(() => getRecentlyViewed() || sampleRecent);
  const [notifications, setNotifications] = useState(() => getNotifications() || sampleNotifications);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [contactModal, setContactModal] = useState(null);
  const audioRefs = useRef({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setProfile((current) => ({ ...current, ...user, joinedDate: user.createdAt || current.joinedDate || '2026-01-15' }));
  }, [user]);

  useEffect(() => {
    const savedCleanup = onSavedPropertiesChanged(() => setSaved(getSavedProperties() || sampleSaved));
    const recentCleanup = onRecentlyViewedChanged(() => setRecent(getRecentlyViewed() || sampleRecent));
    const buyerLeadsCleanup = onBuyerLeadsChanged(() => setBuyerRequests(getBuyerLeads() || sampleBuyerRequests));
    const notificationsCleanup = onNotificationsChanged(() => setNotifications(getNotifications() || sampleNotifications));
    const listingsCleanup = onListingsChanged(() => setListings(readStorage(STORAGE_KEYS.listings, sampleListings)));

    return () => {
      savedCleanup();
      recentCleanup();
      buyerLeadsCleanup();
      notificationsCleanup();
      listingsCleanup();
    };
  }, []);

  const summary = useMemo(() => ({
    listed: listings.length,
    requests: buyerRequests.length,
    saved: saved.length,
    views: listings.reduce((sum, item) => sum + item.views, 0),
    enquiries: listings.reduce((sum, item) => sum + item.enquiries, 0),
  }), [buyerRequests.length, listings, saved.length]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handleSaveProfile = () => {
    const nextUser = { ...user, ...profile, profileImage: profile.profileImage || user.profileImage || '' };
    setUser(nextUser);
    setIsEditingProfile(false);
    writeStorage('broker-streets-profile-draft', nextUser);
  };

  const handleDeleteListing = (listing) => {
    const nextListings = (readStorage(STORAGE_KEYS.listings, sampleListings) || []).filter((item) => item.id !== listing.id);
    writeStorage(STORAGE_KEYS.listings, nextListings);
    setListings(nextListings);
    setDeleteTarget(null);
  };

  const handleDeleteBuyerRequest = (request) => {
    const next = removeBuyerLead(request.id);
    setBuyerRequests(next);
  };

  const markNotificationRead = (id) => {
    const next = notifications.map((item) => (item.id === id ? { ...item, read: true } : item));
    setNotifications(next);
    writeStorage(STORAGE_KEYS.notifications, next);
  };

  const deleteNotification = (id) => {
    const next = notifications.filter((item) => item.id !== id);
    setNotifications(next);
    writeStorage(STORAGE_KEYS.notifications, next);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePlayAudio = (id) => {
    const player = audioRefs.current[id];
    if (player) player.play();
  };

  const handlePauseAudio = (id) => {
    const player = audioRefs.current[id];
    if (player) player.pause();
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

  const renderSection = () => {
    if (loading) {
      return (
        <div className="dashboard-card">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-2/3 rounded-full bg-slate-200" />
            <div className="h-4 w-full rounded-full bg-slate-100" />
            <div className="h-24 rounded-3xl bg-slate-100" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-32 rounded-3xl bg-slate-100" />
              <div className="h-32 rounded-3xl bg-slate-100" />
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'profile') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div>
                <p className="eyebrow">My Profile</p>
                <h2 className="text-2xl font-semibold text-slate-900">Professional account overview</h2>
              </div>
              <button type="button" onClick={() => setIsEditingProfile((current) => !current)} className="dashboard-action-btn bg-slate-900 text-white">
                {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>
            <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-sky-400 text-3xl font-semibold text-white">
                  {profile.profileImage ? <img src={profile.profileImage} alt="Profile preview" className="h-full w-full object-cover" /> : <span>{(profile.name || 'U').charAt(0).toUpperCase()}</span>}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">{profile.name || 'Broker Streets User'}</h3>
                <p className="mt-2 text-sm text-slate-600">{profile.mobile || 'Add mobile number'}</p>
                <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  <Camera size={16} /> Upload Photo
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ['name', 'Full Name', 'text'],
                  ['mobile', 'Mobile', 'text'],
                  ['whatsapp', 'WhatsApp', 'text'],
                  ['email', 'Email', 'email'],
                  ['state', 'State', 'text'],
                  ['district', 'District', 'text'],
                  ['subDistrict', 'Sub District', 'text'],
                  ['joinedDate', 'Joined Date', 'text'],
                ].map(([field, label, type]) => (
                  <label key={field} className="space-y-2 text-sm font-medium text-slate-700">
                    <span>{label}</span>
                    {isEditingProfile ? (
                      <input className="dashboard-input" type={type} name={field} value={profile[field] || ''} onChange={handleProfileChange} />
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-800">{profile[field] || '—'}</div>
                    )}
                  </label>
                ))}
              </div>
            </div>
            {isEditingProfile && (
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={handleSaveProfile} className="dashboard-action-btn bg-primary text-white">Save Changes</button>
                <button type="button" onClick={() => setIsEditingProfile(false)} className="dashboard-action-btn bg-slate-100 text-slate-800">Cancel</button>
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    if (activeSection === 'properties') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div>
                <p className="eyebrow">My Properties</p>
                <h2 className="text-2xl font-semibold text-slate-900">Manage your listings</h2>
              </div>
              <button type="button" className="dashboard-action-btn bg-primary text-white flex items-center gap-2">
                <PlusCircle size={16} /> Add Property
              </button>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {listings.map((listing) => (
                <div key={listing.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-3 shadow-sm">
                  <div className="dashboard-image-grid">
                    <AsyncImage property={listing} alt={listing.title} className="h-full w-full object-cover rounded-xl" containerClassName="h-16 w-16 overflow-hidden rounded-xl" />
                    <div className="flex flex-col gap-2">
                      <div className="rounded-[22px] border border-slate-200 bg-white p-3">
                        <p className="text-sm font-semibold text-slate-900">{listing.title}</p>
                        <p className="mt-2 text-sm text-slate-600">{listing.type} • {listing.district}</p>
                      </div>
                      <div className="rounded-[22px] border border-slate-200 bg-white p-3 text-sm text-slate-600">
                        <p><span className="font-semibold text-slate-900">Price:</span> ₹{listing.price.toLocaleString()}</p>
                        <p className="mt-1"><span className="font-semibold text-slate-900">Status:</span> {listing.status}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['View', 'Edit', 'Delete', 'Share'].map((label) => (
                      <button key={label} type="button" className={`dashboard-action-btn ${label === 'Delete' ? 'bg-rose-50 text-rose-700' : 'bg-white text-slate-700'}`} onClick={() => label === 'Delete' ? setDeleteTarget(listing) : null}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">{listing.status}</span>
                    {listing.documents?.length ? <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">{listing.documents.length} Docs</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      );
    }

    if (activeSection === 'buyers') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div>
                <p className="eyebrow">Buyer Requirements</p>
                <h2 className="text-2xl font-semibold text-slate-900">Requirements captured from your buyers</h2>
              </div>
            </div>
            <div className="space-y-4">
              {buyerRequests.map((request) => (
                <div key={request.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      ['Preferred State', request.preferredState],
                      ['Preferred District', request.preferredDistrict],
                      ['Preferred Taluka', request.preferredTaluka],
                      ['Property Type', request.propertyType],
                      ['Budget', request.budget],
                      ['Additional Requirements', request.requirements],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">{label}</p>
                        <p className="mt-1">{value}</p>
                      </div>
                    ))}
                  </div>
                  {request.audio ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-sm font-semibold text-slate-900">Voice Recording</p>
                      <audio controls className="mt-3 w-full" ref={(el) => { if (el) audioRefs.current[request.id] = el; }}>
                        <source src={request.audio} />
                      </audio>
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => handlePlayAudio(request.id)} className="dashboard-action-btn bg-primary text-white">Play</button>
                        <button type="button" onClick={() => handlePauseAudio(request.id)} className="dashboard-action-btn bg-slate-100 text-slate-800">Pause</button>
                        <span className="rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">{request.duration}</span>
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => navigate('/buyer-requirements')} className="dashboard-action-btn bg-white text-slate-700">View</button>
                    <button type="button" onClick={() => handleDeleteBuyerRequest(request)} className="dashboard-action-btn bg-rose-50 text-rose-700">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      );
    }

    if (activeSection === 'saved') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div>
                <p className="eyebrow">Saved Properties</p>
                <h2 className="text-2xl font-semibold text-slate-900">Bookmarked listings</h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {saved.map((item) => (
                <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-3">
                  <AsyncImage property={item} alt={item.title} className="h-40 w-full rounded-[20px] object-cover" />
                  <div className="mt-3">
                    <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><MapPin size={16} /> {item.location}</p>
                    <p className="mt-2 text-sm font-semibold text-primary">₹{item.price.toLocaleString()}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => navigate(`/property/${item.id}`)} className="dashboard-action-btn bg-white text-slate-700">View Property</button>
                    <button type="button" onClick={() => setContactModal(item)} className="dashboard-action-btn bg-slate-900 text-white">Contact Seller</button>
                    <button type="button" onClick={() => { const next = removeSavedProperty(item.id); setSaved(next); }} className="dashboard-action-btn bg-rose-50 text-rose-700">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      );
    }

    if (activeSection === 'recent') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div>
                <p className="eyebrow">Recently Viewed</p>
                <h2 className="text-2xl font-semibold text-slate-900">Your latest property visits</h2>
              </div>
            </div>
            <div className="space-y-3">
              {recent.map((item) => (
                <div key={item.id} className="dashboard-list-item">
                  <div className="flex items-center gap-3">
                    <AsyncImage property={item} alt={item.title} className="h-14 w-14 rounded-2xl object-cover" containerClassName="h-14 w-14 overflow-hidden rounded-2xl" />
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-600">{item.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">₹{item.price.toLocaleString()}</p>
                    <p className="text-sm text-slate-500">Last viewed {item.viewedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      );
    }

    if (activeSection === 'notifications') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div>
                <p className="eyebrow">Notifications</p>
                <h2 className="text-2xl font-semibold text-slate-900">Stay on top of every update</h2>
              </div>
            </div>
            <div className="space-y-3">
              {notifications.map((item) => (
                <div key={item.id} className={`dashboard-list-item ${item.read ? 'bg-white' : 'bg-blue-50'}`}>
                  <div>
                    <p className="font-semibold text-slate-900">{item.type}</p>
                    <p className="text-sm text-slate-600">{item.message}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => markNotificationRead(item.id)} className="dashboard-action-btn bg-white text-slate-700">Mark as Read</button>
                    <button type="button" onClick={() => deleteNotification(item.id)} className="dashboard-action-btn bg-rose-50 text-rose-700">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      );
    }

    if (activeSection === 'settings') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div>
                <p className="eyebrow">Settings</p>
                <h2 className="text-2xl font-semibold text-slate-900">Control your account and preferences</h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">Account</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p>Change Name</p>
                  <p>Change Email</p>
                  <p>Change Phone</p>
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">Security</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p>Change Password</p>
                  <p>Logout from all devices</p>
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">Preferences</h3>
                <div className="mt-3 space-y-3 text-sm text-slate-700">
                  <label className="flex items-center justify-between"><span>Dark Mode</span><input type="checkbox" /></label>
                  <label className="flex items-center justify-between"><span>Notification Settings</span><input type="checkbox" defaultChecked /></label>
                  <label className="flex items-center justify-between"><span>Email Notifications</span><input type="checkbox" defaultChecked /></label>
                  <label className="flex items-center justify-between"><span>WhatsApp Notifications</span><input type="checkbox" defaultChecked /></label>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    if (activeSection === 'help') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div>
                <p className="eyebrow">Help & Support</p>
                <h2 className="text-2xl font-semibold text-slate-900">Everything you need in one place</h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {['FAQs', 'Contact Support', 'Privacy Policy', 'Terms & Conditions'].map((item) => (
                <div key={item} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{item}</p>
                  <p className="mt-2 text-sm text-slate-600">Helpful guidance for managing your account and listings with Broker Streets.</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div>
                <p className="eyebrow">Dashboard Overview</p>
                <h2 className="text-2xl font-semibold text-slate-900">Welcome back, {profile.name || 'there'}.</h2>
              </div>
              <button type="button" onClick={() => navigate('/add-property')} className="dashboard-action-btn bg-primary text-white flex items-center gap-2">
                <PlusCircle size={16} /> New Listing
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {statConfigs.map((stat) => {
                const Icon = stat.icon;
                const count = summary[stat.countKey];
                return (
                  <div key={stat.key} className="dashboard-stat-card" style={{ background: stat.gradient }}>
                    <div className="flex items-center justify-between">
                      <div className="dashboard-stat-card__icon"><Icon size={20} /></div>
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{stat.label}</p>
                      <p className="mt-2 text-3xl font-semibold">{count}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div>
                <p className="eyebrow">Account Snapshot</p>
                <h2 className="text-xl font-semibold text-slate-900">Profile details</h2>
              </div>
            </div>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center gap-2"><UserCircle2 size={16} /> {profile.name || 'Broker Streets User'}</div>
              <div className="flex items-center gap-2"><Mail size={16} /> {profile.email || 'No email added'}</div>
              <div className="flex items-center gap-2"><Phone size={16} /> {profile.mobile || 'No mobile added'}</div>
              <div className="flex items-center gap-2"><MapPin size={16} /> {profile.district || 'District not set'}, {profile.subDistrict || 'Sub district not set'}</div>
              <div className="flex items-center gap-2"><CalendarDays size={16} /> Joined {profile.joinedDate || '2026-01-15'}</div>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card__header">
            <div>
              <p className="eyebrow">Property Analytics</p>
              <h2 className="text-2xl font-semibold text-slate-900">Performance across your listings</h2>
            </div>
          </div>
          <div className="space-y-4">
            {listings.map((listing) => (
              <div key={listing.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{listing.title}</p>
                    <p className="text-sm text-slate-600">Last updated {listing.updatedAt}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{listing.status}</span>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  {[['Views', listing.views], ['Enquiries', listing.enquiries], ['Favorites', listing.favorites]].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-sm text-slate-600">{label}</p>
                      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-gradient-to-r from-primary to-sky-400" style={{ width: `${Math.min(100, listing.views / 2)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="dashboard-shell">
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="dashboard-sidebar__brand">
          <div className="dashboard-sidebar__brand-badge">BS</div>
          <div>
            <p className="text-lg font-semibold text-slate-900">Broker Streets</p>
            <p className="text-sm text-slate-500">Account Dashboard</p>
          </div>
        </div>
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} type="button" onClick={() => { setActiveSection(item.key); setSidebarOpen(false); }} className={`dashboard-sidebar__link ${activeSection === item.key ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button type="button" onClick={handleLogout} className="dashboard-sidebar__link dashboard-sidebar__link--logout">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen((current) => !current)} className="dashboard-toggle-pill lg:hidden">
              <Menu size={18} />
            </button>
            <div>
              <p className="text-sm font-semibold text-primary">Broker Streets</p>
              <h1 className="text-xl font-semibold text-slate-900">User Profile Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 md:flex">
              <Search size={16} />
              <span>Search properties</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              <ShieldCheck size={16} className="text-primary" /> Verified account
            </div>
          </div>
        </div>

        {renderSection()}
      </main>

      <AnimatePresence>
        {deleteTarget ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dashboard-modal-backdrop">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="dashboard-modal">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-rose-50 p-3 text-rose-600"><Trash2 size={20} /></div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Delete listing?</h3>
                  <p className="text-sm text-slate-600">This will remove the property from your dashboard instantly.</p>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setDeleteTarget(null)} className="dashboard-action-btn bg-slate-100 text-slate-700">Cancel</button>
                <button type="button" onClick={() => handleDeleteListing(deleteTarget)} className="dashboard-action-btn bg-rose-600 text-white">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <ContactModal open={Boolean(contactModal)} onClose={() => setContactModal(null)} data={contactModal || {}} title="Contact Seller" />
    </div>
  );
}

export default ProfileDashboard;
