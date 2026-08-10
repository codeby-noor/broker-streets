import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Trash2,
  Edit3,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  House,
  FileText,
  XCircle,
} from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import {
  readStorage,
  writeStorage,
  STORAGE_KEYS,
  getBuyerLeads,
  getNotifications,
  getSavedProperties,
  getRecentlyViewed,
  onBuyerLeadsChanged,
  onNotificationsChanged,
  onSavedPropertiesChanged,
  onRecentlyViewedChanged,
  removeBuyerLead,
  removeSavedProperty,
  onListingsChanged,
  toggleSavedProperty,
} from '../utils/storage';
import AsyncImage from '../components/AsyncImage';
import ContactModal from '../components/ContactModal';
import { useLanguage } from '../i18n/LanguageContext';
import '../styles/profile-dashboard.css';

const sidebarItems = [
  { key: 'overview', labelKey: 'profile.dashboard', icon: LayoutGrid },
  { key: 'properties', labelKey: 'profile.myProperties', icon: Building2 },
  { key: 'saved', labelKey: 'profile.savedProperties', icon: Bookmark },
  { key: 'buyers', labelKey: 'profile.buyerRequirements', icon: BadgeCheck },
  { key: 'recent', labelKey: 'profile.recentlyViewed', icon: Eye },
  { key: 'notifications', labelKey: 'profile.notifications', icon: Bell },
  { key: 'settings', labelKey: 'profile.profileSettings', icon: Settings },
  { key: 'password', labelKey: 'profile.changePassword', icon: ShieldCheck },
  { key: 'help', labelKey: 'profile.helpSupport', icon: LifeBuoy },
];

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
    documents: [{ name: 'Floor Plan.pdf', uploadedAt: '2026-07-22' }],
  },
  {
    id: 'p2',
    title: 'Modern Villa with Garden View',
    type: 'Villa',
    district: 'Surat',
    subDistrict: 'Adajan',
    village: 'Vesu',
    price: 12500000,
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
    preferredVillages: ['Nadiad'],
    propertyType: 'Agricultural Land',
    purpose: 'Investment',
    requirements: 'Near school and metro connectivity.',
    audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: '01:14',
    createdAt: '2026-08-01',
  },
];

const sampleSaved = [
  { id: 's1', title: 'Sea-facing Penthouse', location: 'Bhavnagar', price: 9800000, image: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=900&q=80' },
];

const sampleRecent = [
  { id: 'r1', title: 'Premium Office Space', location: 'Rajkot', price: 7600000, viewedAt: '2 hours ago', image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80' },
];

const sampleNotifications = [
  { id: 'n1', type: 'Property Approved', message: 'Your flat listing was approved by admin.', read: false, createdAt: 'Today' },
  { id: 'n2', type: 'Buyer Interested', message: 'A buyer requested details for your villa.', read: true, createdAt: 'Yesterday' },
  { id: 'n3', type: 'Admin Messages', message: 'Please update your KYC documents.', read: false, createdAt: 'Yesterday' },
];

const statConfigs = [
  { key: 'listed', labelKey: 'profile.propertiesListed', gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)', icon: Building2, countKey: 'listed' },
  { key: 'sold', labelKey: 'profile.propertiesSold', gradient: 'linear-gradient(135deg, #0f766e, #14b8a6)', icon: House, countKey: 'sold' },
  { key: 'saved', labelKey: 'profile.savedProperties', gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)', icon: Bookmark, countKey: 'saved' },
  { key: 'requests', labelKey: 'profile.buyerRequirements', gradient: 'linear-gradient(135deg, #ea580c, #fb923c)', icon: BadgeCheck, countKey: 'requests' },
  { key: 'recent', labelKey: 'profile.recentlyViewed', gradient: 'linear-gradient(135deg, #be185d, #f472b6)', icon: Eye, countKey: 'recent' },
];

const formatCurrency = (value) => {
  const numeric = Number(value || 0);
  return `₹${numeric.toLocaleString('en-IN')}`;
};

const formatDate = (value, fallback = 'Recently updated') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getRoleLabel = (userData, listingsData, requestsData, t) => {
  const hasSeller = (listingsData?.length || 0) > 0;
  const hasBuyer = (requestsData?.length || 0) > 0;
  if (hasSeller && hasBuyer) return t('profile.roleBuyerAndSeller');
  if (hasSeller) return t('profile.roleSeller');
  if (hasBuyer) return t('profile.roleBuyer');
  return userData?.role || t('profile.roleDefault');
};

function ProfileDashboard() {
  const navigate = useNavigate();
  const { t, getPropertyDisplayTitle } = useLanguage();
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const logout = useUserStore((state) => state.logout);
  const setUser = useUserStore((state) => state.setUser);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState({ ...initialProfileState, ...user, joinedDate: user?.createdAt || '2026-01-15', memberId: user?.id || 'BS-1001' });
  const [listings, setListings] = useState(() => readStorage(STORAGE_KEYS.listings, sampleListings));
  const [buyerRequests, setBuyerRequests] = useState(() => getBuyerLeads() || sampleBuyerRequests);
  const [saved, setSaved] = useState(() => getSavedProperties() || sampleSaved);
  const [recent, setRecent] = useState(() => getRecentlyViewed() || sampleRecent);
  const [notifications, setNotifications] = useState(() => getNotifications() || sampleNotifications);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [contactModal, setContactModal] = useState(null);
  const [selectedBuyerRequest, setSelectedBuyerRequest] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
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
    setProfile((current) => ({ ...current, ...user, joinedDate: user?.createdAt || current.joinedDate || '2026-01-15', memberId: user?.id || current.memberId || 'BS-1001' }));
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
    sold: listings.filter((item) => item.status === 'Sold').length,
    requests: buyerRequests.length,
    saved: saved.length,
    recent: recent.length,
  }), [buyerRequests.length, listings, recent.length, saved.length]);

  const roleLabel = useMemo(() => getRoleLabel(user, listings, buyerRequests, t), [buyerRequests, listings, t, user]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handleSaveProfile = () => {
    const nextUser = { ...user, ...profile, profileImage: profile.profileImage || user?.profileImage || '' };
    setUser(nextUser);
    setIsEditingProfile(false);
    writeStorage('broker-streets-profile-draft', nextUser);
    toast.success(t('profile.profileUpdated'));
  };

  const handleDeleteListing = (listing) => {
    const nextListings = (readStorage(STORAGE_KEYS.listings, sampleListings) || []).filter((item) => item.id !== listing.id);
    writeStorage(STORAGE_KEYS.listings, nextListings);
    setListings(nextListings);
    setDeleteTarget(null);
    setConfirmAction(null);
    toast.success(t('profile.propertyRemoved'));
  };

  const handleDuplicateListing = (listing) => {
    const duplicate = {
      ...listing,
      id: `listing-${Date.now()}`,
      title: `${listing.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const nextListings = [duplicate, ...listings];
    writeStorage(STORAGE_KEYS.listings, nextListings);
    setListings(nextListings);
    toast.success(t('profile.propertyDuplicated'));
  };

  const handleToggleListingStatus = (listing) => {
    const nextListings = listings.map((item) => (item.id === listing.id ? { ...item, status: item.status === 'Sold' ? 'Available' : 'Sold', updatedAt: new Date().toISOString() } : item));
    writeStorage(STORAGE_KEYS.listings, nextListings);
    setListings(nextListings);
    toast.success(`${t('profile.listingMarked')} ${listings.find((item) => item.id === listing.id)?.status === 'Sold' ? t('profile.available') : t('profile.sold')}.`);
  };

  const handleSaveProperty = (property) => {
    const next = toggleSavedProperty(property);
    setSaved(next);
    toast.success(isSavedProperty(property.id) ? t('profile.savedRemoved') : t('profile.savedAdded'));
  };

  const handleRemoveSavedProperty = (id) => {
    const next = removeSavedProperty(id);
    setSaved(next);
    toast.success(t('profile.savedRemoved'));
  };

  const handleRemoveRecentlyViewed = (id) => {
    const next = recent.filter((item) => item.id !== id);
    setRecent(next);
    writeStorage(STORAGE_KEYS.recentlyViewed, next);
    toast.success(t('profile.recentRemoved'));
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

  const handleClearNotifications = () => {
    setNotifications([]);
    writeStorage(STORAGE_KEYS.notifications, []);
    toast.success(t('profile.notificationsCleared'));
  };

  const handleMarkAllRead = () => {
    const next = notifications.map((item) => ({ ...item, read: true }));
    setNotifications(next);
    writeStorage(STORAGE_KEYS.notifications, next);
    toast.success(t('profile.notificationsMarkedRead'));
  };

  const handleLogout = () => {
    setConfirmAction({
      title: 'Logout',
      description: t('profile.logoutConfirm'),
      onConfirm: () => {
        logout();
        setConfirmAction(null);
        navigate('/login');
        toast.success(t('profile.loggedOut'));
      },
    });
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

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error(t('profile.passwordLength'));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('profile.passwordMismatch'));
      return;
    }
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    toast.success(t('profile.passwordUpdated'));
  };

  const isSavedProperty = (id) => saved.some((item) => String(item.id) === String(id));

  const renderEmptyState = (title, description, actionLabel, onAction, icon) => (
    <div className="dashboard-empty-state">
      <div className="dashboard-empty-icon">{icon}</div>
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {actionLabel ? (
        <button type="button" onClick={onAction} className="dashboard-action-btn bg-primary text-white mt-4">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );

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

    if (activeSection === 'properties') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div>
                <p className="eyebrow">{t('profile.myProperties')}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{t('profile.manageListings')}</h2>
              </div>
              <button type="button" onClick={() => navigate('/seller-form')} className="dashboard-action-btn bg-primary text-white flex items-center gap-2">
                <PlusCircle size={16} /> {t('profile.addProperty')}
              </button>
            </div>
            {listings.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {listings.map((listing) => (
                  <div key={listing.id} className="dashboard-property-card">
                    <AsyncImage property={listing} alt={listing.title} className="h-full w-full object-cover rounded-[24px]" containerClassName="h-48 w-full overflow-hidden rounded-[24px]" />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{getPropertyDisplayTitle(listing.title)}</h3>
                          <p className="mt-2 text-sm text-slate-600">{listing.district || t('common.district')} • {listing.subDistrict || listing.taluka || t('common.taluka')} • {listing.village || t('common.village')}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${listing.status === 'Sold' ? 'bg-amber-100 text-amber-700' : listing.status === 'Pending' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>{listing.status}</span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                          <p className="font-semibold text-slate-900">{t('common.propertyType')}</p>
                          <p className="mt-1">{listing.type || t('propertyDetails.propertyTypeFallback')}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                          <p className="font-semibold text-slate-900">{t('common.area')}</p>
                          <p className="mt-1">{listing.area || t('common.notProvided')}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                        <div>
                          <p className="font-semibold text-slate-900">{formatCurrency(listing.price || listing.priceAmount || 0)}</p>
                          <p className="text-slate-500">{formatDate(listing.updatedAt || listing.submittedAt)}</p>
                        </div>
                        <div className="flex items-center gap-2 text-primary">
                          <CheckCircle2 size={16} />
                          <span className="font-semibold">{t('common.ready')}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => navigate(`/property/${listing.id}`)} className="dashboard-action-btn bg-white text-slate-700">{t('common.view')}</button>
                        <button type="button" onClick={() => navigate('/seller-form', { state: { editProperty: listing } })} className="dashboard-action-btn bg-slate-900 text-white">{t('common.edit')}</button>
                        <button type="button" onClick={() => handleDuplicateListing(listing)} className="dashboard-action-btn bg-primary/10 text-primary">{t('common.duplicate')}</button>
                        <button type="button" onClick={() => handleToggleListingStatus(listing)} className="dashboard-action-btn bg-emerald-50 text-emerald-700">{listing.status === 'Sold' ? t('common.markAvailable') : t('common.markSold')}</button>
                        <button type="button" onClick={() => setDeleteTarget(listing)} className="dashboard-action-btn bg-rose-50 text-rose-700">{t('common.delete')}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : renderEmptyState(t('profile.noPropertiesYet'), t('profile.noPropertiesDescription'), t('profile.createListing'), () => navigate('/seller-form'), <Building2 size={20} />)}
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
                <p className="eyebrow">{t('buyerRequirements.heroTitle')}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{t('buyerRequirements.heroDescription')}</h2>
              </div>
            </div>
            {buyerRequests.length ? (
              <div className="space-y-4">
                {buyerRequests.map((request) => (
                  <div key={request.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t('profile.requirementLabel')} #{request.id}</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900">{request.propertyType || t('profile.landRequirementFallback')}</h3>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{request.purpose || t('common.ready')}</span>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {[
                        [t('profile.districtLabel'), request.preferredDistrict],
                        [t('profile.talukaLabel'), request.preferredTaluka],
                        [t('profile.villagesLabel'), Array.isArray(request.preferredVillages) ? request.preferredVillages.join(', ') : request.preferredVillages || '—'],
                        [t('common.submit'), formatDate(request.createdAt, t('profile.recentlyUpdated'))],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                          <p className="font-semibold text-slate-900">{label}</p>
                          <p className="mt-1">{value}</p>
                        </div>
                      ))}
                    </div>
                    {request.audio && typeof request.audio === 'string' && !request.audio.toLowerCase().startsWith('blob:') ? (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-sm font-semibold text-slate-900">{t('buyerForm.voiceRecording')}</p>
                        <audio controls className="mt-3 w-full" ref={(el) => { if (el) audioRefs.current[request.id] = el; }}>
                          <source src={request.audio} />
                        </audio>
                      </div>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setSelectedBuyerRequest(request)} className="dashboard-action-btn bg-white text-slate-700">{t('common.view')}</button>
                      <button type="button" onClick={() => navigate('/buyer-form', { state: { editLead: request } })} className="dashboard-action-btn bg-slate-900 text-white">{t('common.edit')}</button>
                      <button type="button" onClick={() => setConfirmAction({ title: t('profile.deleteRequirementTitle'), description: t('profile.deleteRequirementDescription'), onConfirm: () => { const next = removeBuyerLead(request.id); setBuyerRequests(next); setConfirmAction(null); toast.success(t('profile.requirementDeleted')); } })} className="dashboard-action-btn bg-rose-50 text-rose-700">{t('common.clear')}</button>
                      <button type="button" onClick={() => setContactModal({ ...request, modalTitle: t('contact.modalTitle') })} className="dashboard-action-btn bg-primary/10 text-primary">{t('profile.contactBuyer')}</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : renderEmptyState(t('profile.noBuyerRequirementsYet'), t('profile.noBuyerRequirementsDescription'), t('profile.submitRequirement'), () => navigate('/buyer-form'), <BadgeCheck size={20} />)}
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
                <p className="eyebrow">{t('profile.savedProperties')}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{t('profile.savedListingsTitle')}</h2>
              </div>
            </div>
            {saved.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {saved.map((item) => (
                  <div key={item.id} className="dashboard-property-card">
                    <AsyncImage property={item} alt={item.title} className="h-full w-full object-cover rounded-[24px]" containerClassName="h-48 w-full overflow-hidden rounded-[24px]" />
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-slate-900">{getPropertyDisplayTitle(item.title) || t('profile.savedListingFallback')}</h3>
                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><MapPin size={16} /> {item.location || item.district || t('profile.locationPending')}</p>
                      <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                        <div>
                          <p className="font-semibold text-slate-900">{item.type || item.propertyType || t('propertyDetails.propertyTypeFallback')}</p>
                          <p className="text-slate-500">{item.area || item.landArea || t('common.notProvided')}</p>
                        </div>
                        <p className="text-lg font-semibold text-primary">{formatCurrency(item.price || item.priceAmount || 0)}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => navigate(`/property/${item.id}`)} className="dashboard-action-btn bg-white text-slate-700">{t('common.viewDetails')}</button>
                        <button type="button" onClick={() => handleRemoveSavedProperty(item.id)} className="dashboard-action-btn bg-rose-50 text-rose-700">{t('common.remove')}</button>
                        <button type="button" onClick={() => setContactModal({ ...item, modalTitle: t('contact.modalTitle') })} className="dashboard-action-btn bg-slate-900 text-white">{t('common.contactSeller')}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : renderEmptyState(t('profile.noSavedPropertiesYet'), t('profile.noSavedPropertiesDescription'), t('profile.browseProperties'), () => navigate('/buy'), <Bookmark size={20} />)}
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
                <p className="eyebrow">{t('profile.recentlyViewed')}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{t('profile.recentVisitsTitle')}</h2>
              </div>
            </div>
            {recent.length ? (
              <div className="space-y-3">
                {recent.map((item) => (
                  <div key={item.id} className="dashboard-list-item flex-col sm:flex-row">
                    <div className="flex items-center gap-3">
                      <AsyncImage property={item} alt={item.title} className="h-14 w-14 rounded-2xl object-cover" containerClassName="h-14 w-14 overflow-hidden rounded-2xl" />
                      <div>
                        <p className="font-semibold text-slate-900">{getPropertyDisplayTitle(item.title)}</p>
                        <p className="text-sm text-slate-600">{item.location || item.district || t('profile.locationPending')}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-slate-500">{t('profile.viewedLabel')} {formatDate(item.viewedAt, t('profile.recentlyUpdated'))}</p>
                      <button type="button" onClick={() => navigate(`/property/${item.id}`)} className="dashboard-action-btn bg-white text-slate-700">{t('common.viewAgain')}</button>
                      <button type="button" onClick={() => handleSaveProperty(item)} className={`dashboard-action-btn ${isSavedProperty(item.id) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-white'}`}>{isSavedProperty(item.id) ? t('profile.savedBadge') : t('profile.saveAction')}</button>
                      <button type="button" onClick={() => setContactModal({ ...item, modalTitle: t('contact.modalTitle') })} className="dashboard-action-btn bg-primary/10 text-primary">{t('common.contactSeller')}</button>
                      <button type="button" onClick={() => handleRemoveRecentlyViewed(item.id)} className="dashboard-action-btn bg-rose-50 text-rose-700">{t('common.remove')}</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : renderEmptyState(t('profile.noRecentViewsYet'), t('profile.noRecentViewsDescription'), t('profile.browseLand'), () => navigate('/buy'), <Eye size={20} />)}
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
                <p className="eyebrow">{t('profile.notifications')}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{t('profile.notificationsTitle')}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleMarkAllRead} className="dashboard-action-btn bg-slate-100 text-slate-800">{t('profile.markAllRead')}</button>
                <button type="button" onClick={handleClearNotifications} className="dashboard-action-btn bg-rose-50 text-rose-700">{t('profile.clearAll')}</button>
              </div>
            </div>
            {notifications.length ? (
              <div className="space-y-3">
                {['Today', 'Yesterday'].map((label) => {
                  const items = notifications.filter((item) => (item.createdAt || '').includes(label));
                  if (!items.length) return null;
                  return (
                    <div key={label} className="space-y-2">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
                      {items.map((item) => (
                        <div key={item.id} className={`dashboard-list-item ${item.read ? 'bg-white' : 'bg-blue-50'}`}>
                          <div>
                            <p className="font-semibold text-slate-900">{item.type}</p>
                            <p className="text-sm text-slate-600">{item.message}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => markNotificationRead(item.id)} className="dashboard-action-btn bg-white text-slate-700">{t('profile.markRead')}</button>
                            <button type="button" onClick={() => deleteNotification(item.id)} className="dashboard-action-btn bg-rose-50 text-rose-700">{t('common.clear')}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : renderEmptyState(t('profile.noNotificationsYet'), t('profile.noNotificationsDescription'), null, null, <Bell size={20} />)}
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
                <p className="eyebrow">{t('profile.profileSettings')}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{t('profile.profileSettingsTitle')}</h2>
              </div>
              <button type="button" onClick={() => setIsEditingProfile((value) => !value)} className="dashboard-action-btn bg-primary text-white">{isEditingProfile ? t('profile.cancelEdit') : t('profile.editProfile')}</button>
            </div>
            <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-sky-400 text-3xl font-semibold text-white">
                  {profile.profileImage ? <img src={profile.profileImage} alt="Profile preview" className="h-full w-full object-cover" /> : <span>{(profile.name || 'U').charAt(0).toUpperCase()}</span>}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">{profile.name || t('profile.profileFallbackName')}</h3>
                <p className="mt-2 text-sm text-slate-600">{profile.email || t('profile.profileFallbackEmail')}</p>
                <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  <Camera size={16} /> {t('profile.uploadPhotoLabel')}
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ['name', 'Full Name', 'text'],
                  ['mobile', 'Mobile', 'text'],
                  ['email', 'Email', 'email'],
                  ['address', 'Address', 'text'],
                  ['district', 'District', 'text'],
                  ['subDistrict', 'Taluka', 'text'],
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
                <button type="button" onClick={handleSaveProfile} className="dashboard-action-btn bg-primary text-white">{t('profile.saveChanges')}</button>
                <button type="button" onClick={() => setIsEditingProfile(false)} className="dashboard-action-btn bg-slate-100 text-slate-800">{t('common.back')}</button>
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    if (activeSection === 'password') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div>
                <p className="eyebrow">{t('profile.changePassword')}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{t('profile.passwordTitle')}</h2>
              </div>
            </div>
            <form onSubmit={handlePasswordSubmit} className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>{t('profile.currentPassword')}</span>
                <input type="password" className="dashboard-input" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>{t('profile.newPassword')}</span>
                <input type="password" className="dashboard-input" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                <span>{t('profile.confirmPassword')}</span>
                <input type="password" className="dashboard-input" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
              </label>
              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button type="submit" className="dashboard-action-btn bg-primary text-white">{t('profile.savePassword')}</button>
                <button type="button" onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })} className="dashboard-action-btn bg-slate-100 text-slate-800">{t('common.clear')}</button>
              </div>
            </form>
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
                <p className="eyebrow">{t('profile.helpSupport')}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{t('profile.helpTitle')}</h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { title: t('profile.faqs'), description: t('profile.faqDescription'), action: () => toast.info(t('profile.faqSoon')) },
                { title: t('profile.contactSupport'), description: t('profile.supportDescription'), action: () => { window.location.href = 'mailto:support@brokerstreets.in'; } },
                { title: t('profile.privacyPolicy'), description: t('profile.privacyDescription'), action: () => toast.info(t('profile.privacySoon')) },
                { title: t('profile.termsConditions'), description: t('profile.termsDescription'), action: () => toast.info(t('profile.termsSoon')) },
              ].map((item) => (
                <button key={item.title} type="button" onClick={item.action} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-1 hover:border-primary">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <div className="dashboard-shell">
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="dashboard-sidebar__brand">
          <div className="dashboard-sidebar__brand-badge">BS</div>
          <div>
            <p className="text-lg font-semibold text-slate-900">Broker Streets</p>
            <p className="text-sm text-slate-500">{t('profile.accountDashboard')}</p>
          </div>
        </div>
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const navMap = {
            properties: '/profile/properties',
            saved: '/profile/saved',
            buyers: '/profile/requirements',
            recent: '/profile/recent',
            notifications: '/profile/notifications',
            settings: '/profile/settings',
            help: '/contact',
            password: '/profile/settings',
          };
          return (
            <button key={item.key} type="button" onClick={() => { if (item.key === 'logout') { handleLogout(); return; } if (item.key === 'overview') { navigate('/profile'); } else { navigate(navMap[item.key] || '/profile'); } setSidebarOpen(false); }} className={`dashboard-sidebar__link ${activeSection === item.key ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{t(item.labelKey)}</span>
            </button>
          );
        })}
        <button type="button" onClick={handleLogout} className="dashboard-sidebar__link dashboard-sidebar__link--logout">
          <LogOut size={18} />
          <span>{t('profile.logout')}</span>
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
              <h1 className="text-xl font-semibold text-slate-900">{t('profile.title')}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/buy')} className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 md:flex">
              <Search size={16} />
              <span>{t('profile.searchProperties')}</span>
            </button>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              <ShieldCheck size={16} className="text-primary" /> {t('profile.verifiedAccount')}
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="dashboard-hero">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="dashboard-avatar">
                {profile.profileImage ? <img src={profile.profileImage} alt="Profile" className="h-full w-full object-cover" /> : <span>{(profile.name || 'U').charAt(0).toUpperCase()}</span>}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold text-slate-900">{profile.name || t('profile.profileFallbackName')}</h2>
                  {user?.verified || profile?.verified ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">{t('profile.verifiedBadge')}</span> : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                    <House size={14} /> {roleLabel}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { setIsEditingProfile(true); navigate('/profile/settings'); }} className="dashboard-action-btn bg-white text-slate-700">{t('profile.editProfile')}</button>
              <button type="button" onClick={() => navigate('/seller-form')} className="dashboard-action-btn bg-primary text-white">{t('profile.addListing')}</button>
            </div>
          </div>
          <div className="dashboard-stat-summary-grid mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {[
              { label: t('profile.propertiesListed'), value: summary.listed, icon: Building2 },
              { label: t('profile.propertiesSold'), value: summary.sold, icon: House },
              { label: t('profile.savedProperties'), value: summary.saved, icon: Bookmark },
              { label: t('profile.buyerRequirements'), value: summary.requests, icon: BadgeCheck },
              { label: t('profile.recentlyViewed'), value: summary.recent, icon: Eye },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="dashboard-summary-card rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-5 text-sm shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Icon size={15} className="text-primary" />
                    <span>{item.label}</span>
                  </div>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        <section className="dashboard-mobile-action-list">
          <div className="dashboard-mobile-section-title">
            <span>{t('profile.myActivity')}</span>
          </div>
          {[
            { key: 'properties', icon: Building2, title: t('profile.myProperties'), description: t('profile.manageListedLand'), to: '/profile/properties' },
            { key: 'saved', icon: Bookmark, title: t('profile.savedProperties'), description: t('profile.shortlistedProperties'), to: '/profile/saved' },
            { key: 'buyers', icon: BadgeCheck, title: t('profile.buyerRequirements'), description: t('profile.manageLandRequirements'), to: '/profile/requirements' },
            { key: 'recent', icon: Eye, title: t('profile.recentlyViewed'), description: t('profile.recentlyViewedDescription'), to: '/profile/recent' },
            { key: 'notifications', icon: Bell, title: t('profile.notifications'), description: t('profile.notificationsDescription'), to: '/profile/notifications' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} type="button" onClick={() => navigate(item.to)} className="dashboard-mobile-action-row">
                <span className="dashboard-mobile-action-icon"><Icon size={18} /></span>
                <span className="dashboard-mobile-action-copy">
                  <span className="dashboard-mobile-action-title">{item.title}</span>
                  <span className="dashboard-mobile-action-description">{item.description}</span>
                </span>
                <span className="dashboard-mobile-action-chevron"><ChevronRight size={17} /></span>
              </button>
            );
          })}
        </section>

        <section className="dashboard-mobile-account-list">
          <div className="dashboard-mobile-section-title">
            <span>{t('profile.account')}</span>
          </div>
          <button type="button" onClick={() => navigate('/profile/settings')} className="dashboard-mobile-account-row">
            <span className="dashboard-mobile-account-icon"><Settings size={18} /></span>
            <span className="dashboard-mobile-account-copy">
              <span className="dashboard-mobile-account-title">{t('profile.profileSettings')}</span>
            </span>
            <span className="dashboard-mobile-action-chevron"><ChevronRight size={17} /></span>
          </button>
          <button type="button" onClick={() => navigate('/contact')} className="dashboard-mobile-account-row">
            <span className="dashboard-mobile-account-icon"><LifeBuoy size={18} /></span>
            <span className="dashboard-mobile-account-copy">
              <span className="dashboard-mobile-account-title">{t('profile.helpSupport')}</span>
            </span>
            <span className="dashboard-mobile-action-chevron"><ChevronRight size={17} /></span>
          </button>
          <button type="button" onClick={() => navigate('/about')} className="dashboard-mobile-account-row">
            <span className="dashboard-mobile-account-icon"><UserCircle2 size={18} /></span>
            <span className="dashboard-mobile-account-copy">
              <span className="dashboard-mobile-account-title">{t('profile.aboutBrokerStreets')}</span>
            </span>
            <span className="dashboard-mobile-action-chevron"><ChevronRight size={17} /></span>
          </button>
          <button type="button" onClick={handleLogout} className="dashboard-mobile-logout-row">
            <span className="dashboard-mobile-account-icon"><LogOut size={18} /></span>
            <span className="dashboard-mobile-account-copy">
              <span className="dashboard-mobile-account-title">{t('profile.logout')}</span>
            </span>
          </button>
        </section>
      </main>

      {sidebarOpen ? <div className="dashboard-sidebar-backdrop" onClick={() => setSidebarOpen(false)} /> : null}

      <AnimatePresence>
        {confirmAction ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dashboard-modal-backdrop">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="dashboard-modal">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-rose-50 p-3 text-rose-600"><Trash2 size={20} /></div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{confirmAction.title}</h3>
                  <p className="text-sm text-slate-600">{confirmAction.description}</p>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setConfirmAction(null)} className="dashboard-action-btn bg-slate-100 text-slate-700">{t('common.cancel')}</button>
                <button type="button" onClick={confirmAction.onConfirm} className="dashboard-action-btn bg-rose-600 text-white">{t('common.confirm')}</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dashboard-modal-backdrop">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="dashboard-modal">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-rose-50 p-3 text-rose-600"><Trash2 size={20} /></div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{t('profile.deleteListingModalTitle')}</h3>
                  <p className="text-sm text-slate-600">{t('profile.deleteListingModalDesc')}</p>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setDeleteTarget(null)} className="dashboard-action-btn bg-slate-100 text-slate-700">{t('common.cancel')}</button>
                <button type="button" onClick={() => handleDeleteListing(deleteTarget)} className="dashboard-action-btn bg-rose-600 text-white">{t('common.delete')}</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedBuyerRequest ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dashboard-modal-backdrop">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="dashboard-modal">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t('profile.requirementLabel')}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{selectedBuyerRequest.propertyType || t('profile.landRequirementFallback')}</h3>
                </div>
                <button type="button" onClick={() => setSelectedBuyerRequest(null)} className="rounded-full bg-slate-100 p-2 text-slate-700"><XCircle size={18} /></button>
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><span className="font-semibold text-slate-900">{t('profile.districtLabel')}:</span> {selectedBuyerRequest.preferredDistrict || '—'}</div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><span className="font-semibold text-slate-900">{t('profile.talukaLabel')}:</span> {selectedBuyerRequest.preferredTaluka || '—'}</div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><span className="font-semibold text-slate-900">{t('profile.villagesLabel')}:</span> {Array.isArray(selectedBuyerRequest.preferredVillages) ? selectedBuyerRequest.preferredVillages.join(', ') : selectedBuyerRequest.preferredVillages || '—'}</div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><span className="font-semibold text-slate-900">{t('profile.purposeLabel')}:</span> {selectedBuyerRequest.purpose || '—'}</div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><span className="font-semibold text-slate-900">{t('profile.requirementsLabel')}:</span> {selectedBuyerRequest.requirements || '—'}</div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <ContactModal open={Boolean(contactModal)} onClose={() => setContactModal(null)} data={contactModal || {}} title={contactModal?.modalTitle || t('buy.contactSeller')} />
    </div>
  );
}

export default ProfileDashboard;
