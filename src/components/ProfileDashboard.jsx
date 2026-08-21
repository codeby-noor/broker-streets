import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import logo from '../assets/images/logo.png';
import {
  LayoutGrid,
  UserCircle2,
  Building2,
  BadgeCheck,
  Bookmark,
  Heart,
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
  ArrowLeft,
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
import { formatIndianPrice } from '../utils/format';
import '../styles/profile-dashboard.css';

const sidebarItems = [
  { key: 'overview', labelKey: 'profile.dashboard', icon: LayoutGrid },
  { key: 'settings', labelKey: 'profile.editProfile', icon: Settings },
  { key: 'properties', labelKey: 'profile.myProperties', icon: Building2 },
  { key: 'saved', labelKey: 'profile.likedProperties', icon: Heart },
  { key: 'recent', labelKey: 'profile.recentlyViewed', icon: Eye },
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
    title: 'Mango Farm Navsari',
    type: 'Agricultural Land',
    district: 'Navsari',
    subDistrict: 'Gandevi',
    village: 'Gandevi',
    price: 12500000,
    status: 'Available',
    views: 182,
    enquiries: 24,
    favorites: 18,
    updatedAt: '2026-08-01',
    images: ['https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80'],
    documents: [{ name: 'Title Deed.pdf', uploadedAt: '2026-07-22' }],
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
  { key: 'listed', labelKey: 'profile.propertiesListed', gradient: 'linear-gradient(135deg, #1D5CA9, rgba(29, 92, 169, 0.85))', icon: Building2, countKey: 'listed' },
  { key: 'sold', labelKey: 'profile.propertiesSold', gradient: 'linear-gradient(135deg, #1D5CA9, rgba(29, 92, 169, 0.85))', icon: House, countKey: 'sold' },
  { key: 'saved', labelKey: 'profile.savedProperties', gradient: 'linear-gradient(135deg, #1D5CA9, rgba(29, 92, 169, 0.85))', icon: Bookmark, countKey: 'saved' },
  { key: 'requests', labelKey: 'profile.buyerRequirements', gradient: 'linear-gradient(135deg, #1D5CA9, rgba(29, 92, 169, 0.85))', icon: BadgeCheck, countKey: 'requests' },
  { key: 'recent', labelKey: 'profile.recentlyViewed', gradient: 'linear-gradient(135deg, #1D5CA9, rgba(29, 92, 169, 0.85))', icon: Eye, countKey: 'recent' },
];

const formatCurrency = (value) => formatIndianPrice(value);

const formatDate = (value, fallback = '') => {
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
      title: t('profile.logout'),
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
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${listing.status === 'Sold' ? 'bg-amber-100 text-amber-700' : listing.status === 'Pending' ? 'bg-slate-200 text-slate-700' : 'bg-primary/10 text-primary'}`}>{listing.status}</span>
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
                        <button type="button" onClick={() => handleToggleListingStatus(listing)} className="dashboard-action-btn bg-primary/10 text-primary">{listing.status === 'Sold' ? t('common.markAvailable') : t('common.markSold')}</button>
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

    if (activeSection === 'saved') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div>
                <p className="eyebrow">{t('profile.likedProperties')}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{t('profile.likedProperties')}</h2>
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
            ) : renderEmptyState(t('profile.noSavedPropertiesYet'), t('profile.noSavedPropertiesDescription'), t('profile.browseProperties'), () => navigate('/buy'), <Heart size={20} />)}
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
                      <button type="button" onClick={() => handleSaveProperty(item)} className={`dashboard-action-btn ${isSavedProperty(item.id) ? 'bg-primary/10 text-primary' : 'bg-slate-900 text-white'}`}>{isSavedProperty(item.id) ? t('profile.savedBadge') : t('profile.saveAction')}</button>
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

    if (activeSection === 'settings') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div>
                <p className="eyebrow">{t('profile.title')}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{t('profile.editProfile')}</h2>
              </div>
            </div>

            <div className="mt-2 mb-4">
              <button type="button" onClick={() => setIsEditingProfile((value) => !value)} className="dashboard-action-btn bg-primary text-white inline-flex items-center gap-2">
                <Edit3 size={16} />
                <span>{isEditingProfile ? t('profile.cancelEdit') : t('profile.editProfile')}</span>
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary-dark text-3xl font-semibold text-white">
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
                  ['name', t('profile.fullNameLabel'), 'text'],
                  ['mobile', t('profile.mobileLabel'), 'text'],
                  ['email', t('profile.emailLabel'), 'email'],
                  ['address', t('profile.addressLabel'), 'text'],
                  ['district', t('common.district'), 'text'],
                  ['subDistrict', t('common.taluka'), 'text'],
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
      {/* Desktop Sticky Sidebar (Hidden on Mobile) */}
      <aside className="dashboard-sidebar hidden lg:flex">
        <div className="dashboard-sidebar__brand">
          <Link to="/home" className="flex items-center">
            <img src={logo} alt="Broker Streets logo" className="h-8 w-auto max-w-[180px] object-contain" />
          </Link>
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
            <button
              key={item.key}
              type="button"
              onClick={() => {
                if (item.key === 'logout') {
                  handleLogout();
                  return;
                }
                if (item.key === 'overview') {
                  navigate('/profile');
                } else {
                  navigate(navMap[item.key] || '/profile');
                }
                setSidebarOpen(false);
              }}
              className={`dashboard-sidebar__link ${activeSection === item.key ? 'active' : ''}`}
            >
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
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#1D5CA9]/20 bg-[#1D5CA9]/10 px-3.5 py-1.5 text-xs font-bold text-[#1D5CA9] transition hover:bg-[#1D5CA9]/20 active:scale-95 mb-3"
        >
          <ArrowLeft size={16} />
          <span>{t('common.back')}</span>
        </button>

        {/* Topbar */}
        <div className="dashboard-topbar flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Broker Streets</p>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{t('profile.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
              <ShieldCheck size={14} className="text-primary" />
              <span>{t('profile.verifiedAccount')}</span>
            </div>
          </div>
        </div>

        {/* Profile Hero Header Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6 mb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary/20 bg-slate-100 text-xl font-bold text-primary flex items-center justify-center shadow-inner">
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span>{(profile.name || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 truncate sm:text-2xl">{profile.name || t('profile.profileFallbackName')}</h2>
                  {(user?.verified || profile?.verified) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sage/10 border border-sage/20 px-2.5 py-0.5 text-xs font-bold text-sage">
                      <ShieldCheck size={12} />
                      {t('profile.verifiedBadge')}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">
                    <House size={12} /> {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5">
              <button
                type="button"
                onClick={() => { setIsEditingProfile(true); navigate('/profile/settings'); }}
                className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
              >
                {t('profile.editProfile')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/seller-form')}
                className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-primary px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-dark active:scale-[0.98]"
              >
                {t('profile.addListing')}
              </button>
            </div>
          </div>

          {/* 2-Column Summary Stat Cards */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
            {[
              { label: t('profile.propertiesListed'), value: summary.listed, icon: Building2 },
              { label: t('profile.propertiesSold'), value: summary.sold, icon: House },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 truncate">
                    <Icon size={14} className="text-primary flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <p className="mt-1.5 text-2xl font-bold text-slate-900">{item.value}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Compact Mobile Sticky Horizontal Navigation Bar */}
        <div className="sticky top-[53px] sm:top-[57px] z-30 mb-4 -mx-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-md backdrop-blur-md scrollbar-none lg:hidden">
          <div className="flex items-center gap-1.5 min-w-max">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.key;
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
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    if (item.key === 'overview') {
                      navigate('/profile');
                    } else {
                      navigate(navMap[item.key] || '/profile');
                    }
                  }}
                  className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                  <Icon size={14} className="flex-shrink-0" />
                  <span className="whitespace-nowrap">{t(item.labelKey)}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleLogout}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all"
            >
              <LogOut size={14} className="flex-shrink-0" />
              <span className="whitespace-nowrap">{t('profile.logout')}</span>
            </button>
          </div>
        </div>

        <section className="dashboard-mobile-action-list">
          <div className="dashboard-mobile-section-title">
            <span>{t('profile.myActivity')}</span>
          </div>
          {[
            { key: 'settings', icon: Settings, title: t('profile.editProfile'), description: t('profile.editProfile'), to: '/profile/settings' },
            { key: 'properties', icon: Building2, title: t('profile.myProperties'), description: t('profile.manageListedLand'), to: '/profile/properties' },
            { key: 'saved', icon: Heart, title: t('profile.likedProperties'), description: t('profile.shortlistedProperties'), to: '/profile/saved' },
            { key: 'recent', icon: Eye, title: t('profile.recentlyViewed'), description: t('profile.recentlyViewedDescription'), to: '/profile/recent' },
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
