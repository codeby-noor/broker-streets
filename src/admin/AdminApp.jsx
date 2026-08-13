import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import './admin.css';
import {
  writeStorage,
  appendAdminActivity,
  getAdminActivity,
  onAdminActivityChanged,
  onListingsChanged,
  onUsersChanged,
  onBuyerLeadsChanged,
  onSellerLeadsChanged,
  STORAGE_KEYS,
} from '../utils/storage';
import {
  clearMasterGroupSession,
  createMasterGroupSession,
  isApprovedMasterGroupMobile,
  isSuperAdminSession,
  readMasterGroupSession,
  sendMasterGroupOtp,
  verifyMasterGroupOtp,
} from './masterGroupAuth';
import { useLanguage } from '../i18n/LanguageContext';
import {
  ADMIN_NAMES,
  deriveUserRole,
  formatDate,
  formatDateTime,
  formatPrice,
  getAdminBuyerLeads,
  getAdminProperties,
  getAdminSellerLeads,
  getAdminUsers,
  getInitials,
  maskMobile,
  seedAdminDemoData,
} from './adminData';

function ProtectedAdminRoute({ children }) {
  const auth = readMasterGroupSession();
  return auth ? children : <Navigate to="login" replace />;
}

/* ---------------- STATUS / ROLE HELPERS ---------------- */
function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'available' || s === 'active' || s === 'login') return 'status-available status-active status-login';
  if (s === 'unavailable' || s === 'inactive') return 'status-unavailable status-inactive';
  if (s === 'sold') return 'status-sold';
  if (s === 'loggedout') return 'status-loggedout';
  return 'status-unavailable';
}

function roleBadgeClass(role) {
  const r = String(role || '').toLowerCase();
  if (r === 'buyer') return 'role-buyer';
  if (r === 'seller') return 'role-seller';
  if (r === 'buyer & seller') return 'role-both';
  return 'role-buyer';
}

/* ---------------- ADMIN LOGIN ---------------- */
function AdminLogin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mobile, setMobile] = useState('');
  const [step, setStep] = useState('mobile');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const auth = readMasterGroupSession();
    if (auth) navigate('/master-group', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleMobileChange = (event) => setMobile(event.target.value.replace(/\D/g, '').slice(0, 10));

  const requestOtp = (event) => {
    event.preventDefault();
    const sanitizedMobile = mobile.replace(/\D/g, '').slice(0, 10);
    if (!sanitizedMobile || sanitizedMobile.length !== 10) {
      toast.error(t('admin.mobilePlaceholder'));
      return;
    }
    if (!isApprovedMasterGroupMobile(sanitizedMobile)) {
      toast.error(t('admin.notAuthorized'));
      return;
    }
    setLoading(true);
    const result = sendMasterGroupOtp(sanitizedMobile);
    if (!result.success) {
      setLoading(false);
      toast.error(result.message);
      if (result.cooldownRemaining) setCooldown(result.cooldownRemaining);
      return;
    }
    setDevOtp(result.devOtp || null);
    setCooldown(30);
    setLoading(false);
    setStep('otp');
    toast.success('OTP sent successfully');
  };

  const verifyOtp = (event) => {
    event.preventDefault();
    const sanitizedMobile = mobile.replace(/\D/g, '').slice(0, 10);
    const enteredOtp = otp.replace(/\D/g, '').slice(0, 6);
    if (!enteredOtp) {
      toast.error(t('admin.otpPlaceholder'));
      return;
    }
    setLoading(true);
    const verification = verifyMasterGroupOtp({ mobile: sanitizedMobile, otp: enteredOtp });
    if (!verification.success) {
      setLoading(false);
      toast.error(verification.message);
      return;
    }
    const session = createMasterGroupSession(sanitizedMobile);
    // DEVELOPMENT-ONLY: record admin login activity. See storage.js notice.
    appendAdminActivity({
      id: `login-${Date.now()}`,
      mobile: sanitizedMobile,
      role: session.role,
      type: 'login',
      loginAt: new Date().toISOString(),
      status: 'Login',
      sessionInfo: t('admin.sessionStartedVia'),
    });
    setLoading(false);
    toast.success('Master Group authenticated successfully');
    navigate('/master-group', { replace: true });
  };

  const resendOtp = () => {
    if (cooldown > 0) return;
    const sanitizedMobile = mobile.replace(/\D/g, '').slice(0, 10);
    const result = sendMasterGroupOtp(sanitizedMobile);
    if (!result.success) {
      toast.error(result.message);
      if (result.cooldownRemaining) setCooldown(result.cooldownRemaining);
      return;
    }
    setDevOtp(result.devOtp || null);
    setCooldown(30);
    setOtp('');
    toast.success('OTP resent successfully');
  };

  const goBackToMobile = () => { setStep('mobile'); setOtp(''); setDevOtp(null); };

  return (
    <div className="admin-login-page">
      <div className="card form-card w-100" style={{ maxWidth: 480 }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="avatar mx-auto mb-3">BS</div>
            <h2 className="fw-bold page-title">{t('admin.loginTitle')}</h2>
            <p className="text-muted mb-0">{t('admin.loginSubtitle')}</p>
          </div>

          {step === 'mobile' ? (
            <form onSubmit={requestOtp}>
              <div className="mb-3">
                <label className="form-label fw-semibold">{t('admin.mobileLabel')}</label>
                <input className="form-control input-glow" type="tel" inputMode="numeric" maxLength={10} value={mobile} onChange={handleMobileChange} placeholder={t('admin.mobilePlaceholder')} />
              </div>
              <button className="btn btn-primary w-100 py-2" type="submit" disabled={loading}>
                {loading ? 'Sending OTP...' : t('admin.sendOtp')}
              </button>
              <div className="text-center mt-3 text-muted small">
                <span className="badge bg-primary-subtle text-primary">Local Demo</span>
              </div>
            </form>
          ) : (
            <form onSubmit={verifyOtp}>
              <div className="mb-3">
                <label className="form-label fw-semibold">{t('admin.otpTitle')}</label>
                <p className="text-muted small mb-2">{t('admin.otpSentTo')} {mobile}</p>
                <input className="form-control input-glow text-center" type="tel" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={t('admin.otpPlaceholder')} />
              </div>
              {devOtp ? (
                <div className="alert alert-warning py-2 small">
                  <strong>{t('admin.devOtp')}:</strong> <span className="font-monospace">{devOtp}</span>
                  <div className="text-muted">{t('admin.devOtpHint')}</div>
                </div>
              ) : null}
              <button className="btn btn-primary w-100 py-2" type="submit" disabled={loading}>
                {loading ? 'Verifying...' : t('admin.verifyLogin')}
              </button>
              <div className="d-flex justify-content-between align-items-center mt-3">
                <button className="btn btn-link p-0" type="button" onClick={goBackToMobile}>{t('admin.changeNumber')}</button>
                <button className="btn btn-link p-0" type="button" onClick={resendOtp} disabled={cooldown > 0}>
                  {cooldown > 0 ? `${t('admin.resendIn')} ${cooldown}s` : t('admin.resendOtp')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- DASHBOARD ---------------- */
function Dashboard() {
  const { t } = useLanguage();
  const [state, setState] = useState(() => ({
    properties: getAdminProperties(),
    users: getAdminUsers(),
    buyerLeads: getAdminBuyerLeads(),
    sellerLeads: getAdminSellerLeads(),
  }));

  useEffect(() => {
    const reload = () => setState({
      properties: getAdminProperties(),
      users: getAdminUsers(),
      buyerLeads: getAdminBuyerLeads(),
      sellerLeads: getAdminSellerLeads(),
    });
    const offListings = onListingsChanged(reload);
    const offUsers = onUsersChanged(reload);
    const offBuyers = onBuyerLeadsChanged(reload);
    const offSellers = onSellerLeadsChanged(reload);
    return () => { offListings(); offUsers(); offBuyers(); offSellers(); };
  }, []);

  const { properties, users, buyerLeads, sellerLeads } = state;
  const stats = useMemo(() => ({
    totalProperties: properties.length,
    availableProperties: properties.filter((p) => String(p.status).toLowerCase() === 'available').length,
    unavailableProperties: properties.filter((p) => String(p.status).toLowerCase() === 'unavailable').length,
    soldProperties: properties.filter((p) => String(p.status).toLowerCase() === 'sold').length,
    totalBuyers: buyerLeads.length,
    totalSellers: sellerLeads.length,
    registeredUsers: users.length,
  }), [properties, users, buyerLeads, sellerLeads]);

  // Properties grouped by city — EXPLICITLY limited to Surat and Navsari only.
  const cityData = useMemo(() => {
    const map = new Map();
    properties.forEach((p) => {
      const district = String(p.district || p.city || p.location || '').trim().toLowerCase();
      if (district === 'surat') map.set('Surat', (map.get('Surat') || 0) + 1);
      else if (district === 'navsari') map.set('Navsari', (map.get('Navsari') || 0) + 1);
    });
    return ['Surat', 'Navsari']
      .map((label) => ({ label, count: map.get(label) || 0 }))
      .filter((d) => d.count > 0);
  }, [properties]);

  // Property status counts for the donut chart
  const statusData = useMemo(() => {
    const available = properties.filter((p) => String(p.status).toLowerCase() === 'available').length;
    const unavailable = properties.filter((p) => String(p.status).toLowerCase() === 'unavailable').length;
    const sold = properties.filter((p) => String(p.status).toLowerCase() === 'sold').length;
    return [
      { label: t('admin.statusAvailable'), value: available, color: '#10b981' },
      { label: t('admin.statusUnavailable'), value: unavailable, color: '#94a3b8' },
      { label: t('admin.statusSold'), value: sold, color: '#ef4444' },
    ].filter((d) => d.value > 0);
  }, [properties, t]);

  const maxCityCount = Math.max(...cityData.map((d) => d.count), 1);
  const totalStatus = statusData.reduce((sum, d) => sum + d.value, 0);
  const totalCityProperties = properties.length;
  const donutRadius = 70;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let cumulative = 0;
  const donutSegments = statusData.map((d) => {
    const start = cumulative;
    cumulative += d.value;
    return { ...d, start, end: cumulative };
  });

  const statCards = [
    { key: 'total', label: t('admin.totalProperties'), value: stats.totalProperties, icon: '▦', tone: 'blue' },
    { key: 'available', label: t('admin.availableProperties'), value: stats.availableProperties, icon: '✓', tone: 'green' },
    { key: 'unavailable', label: t('admin.unavailableProperties'), value: stats.unavailableProperties, icon: '✕', tone: 'slate' },
    { key: 'sold', label: t('admin.soldProperties'), value: stats.soldProperties, icon: '★', tone: 'red' },
    { key: 'buyers', label: t('admin.totalBuyers'), value: stats.totalBuyers, icon: '◉', tone: 'indigo' },
    { key: 'sellers', label: t('admin.totalSellers'), value: stats.totalSellers, icon: '◈', tone: 'amber' },
    { key: 'users', label: t('admin.registeredUsers'), value: stats.registeredUsers, icon: '◎', tone: 'violet' },
  ];

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 page-title">{t('admin.dashboard')}</h2>
          <p className="text-muted mb-0">Overview of your land portfolio, buyers, sellers and registered users.</p>
        </div>
        <div className="text-end">
          <div className="fw-semibold">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Statistic cards — 2 per row on mobile, 4 + 3 on desktop */}
      <div className="row g-3 g-lg-4 mb-4 dashboard-stats-row">
        {statCards.map((card) => (
          <div className="col-6 col-xl-3" key={card.key}>
            <div className="card stat-card h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <span className={`stat-icon stat-icon-${card.tone}`}>{card.icon}</span>
                <div className="stat-copy">
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-value">{card.value}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Properties by City + Property Status Overview */}
      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <div className="card chart-card h-100">
            <div className="card-body">
              <h5 className="fw-semibold mb-1">{t('admin.propertiesByCity')}</h5>
              <p className="text-muted small mb-3">Properties grouped by city.</p>
              {cityData.length ? (
                <>
                  <div className="city-chart-wrap">
                    <div className="city-chart">
                      {cityData.map((d) => (
                        <div className="city-column" key={d.label}>
                          <div className="city-bar-count">{d.count}</div>
                          <div className="city-bar-track">
                            <div
                              className="city-bar-fill"
                              style={{ height: `${Math.max((d.count / maxCityCount) * 100, 10)}%` }}
                              data-city={d.label}
                              data-count={d.count}
                            >
                              <span className="city-bar-tooltip">{d.label}: {d.count} property</span>
                            </div>
                          </div>
                          <div className="city-bar-label">{d.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="city-grid-lines" aria-hidden="true">
                      <span style={{ bottom: '25%' }} />
                      <span style={{ bottom: '50%' }} />
                      <span style={{ bottom: '75%' }} />
                      <span style={{ bottom: '100%' }} />
                    </div>
                  </div>
                  <div className="city-summary">
                    <div className="city-summary-item">
                      <span className="city-summary-value">2</span>
                      <span className="city-summary-label">Total Cities</span>
                    </div>
                    <div className="city-summary-divider" />
                    <div className="city-summary-item">
                      <span className="city-summary-value">{totalCityProperties}</span>
                      <span className="city-summary-label">Total Properties</span>
                    </div>
                  </div>
                </>
              ) : <div className="admin-empty-state"><div className="empty-icon">▦</div><div className="empty-title">{t('admin.noPropertiesFound')}</div></div>}
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-6">
          <div className="card chart-card h-100">
            <div className="card-body">
              <h5 className="fw-semibold mb-1">{t('admin.propertyStatusOverview')}</h5>
              <p className="text-muted small mb-3">Current availability of all properties.</p>
              {totalStatus > 0 ? (
                <div className="donut-chart-wrap">
                  <div className="donut-chart">
                    <svg viewBox="0 0 180 180" width="180" height="180" role="img" aria-label={t('admin.propertyStatusOverview')}>
                      {donutSegments.map((seg) => (
                        <circle
                          key={seg.label}
                          cx="90"
                          cy="90"
                          r={donutRadius}
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="24"
                          strokeDasharray={`${(seg.value / totalStatus) * donutCircumference} ${donutCircumference}`}
                          strokeDashoffset={-(seg.start / totalStatus) * donutCircumference}
                          transform="rotate(-90 90 90)"
                        />
                      ))}
                      <text x="90" y="86" textAnchor="middle" className="donut-total">{totalStatus}</text>
                      <text x="90" y="104" textAnchor="middle" className="donut-total-label">Properties</text>
                    </svg>
                  </div>
                  <div className="donut-legend">
                    {donutSegments.map((seg) => (
                      <div className="donut-legend-item" key={seg.label}>
                        <span className="donut-legend-dot" style={{ background: seg.color }} />
                        <span className="donut-legend-label">{seg.label}</span>
                        <span className="donut-legend-value">{seg.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div className="admin-empty-state"><div className="empty-icon">◔</div><div className="empty-title">{t('admin.noPropertiesFound')}</div></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- PROPERTIES PAGE ---------------- */
function PropertiesPage({ navigate }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [type, setType] = useState('All');
  const [location, setLocation] = useState('All');
  const [sort, setSort] = useState('newest');
  const [viewing, setViewing] = useState(null);

  const properties = getAdminProperties();

  const locations = useMemo(() => {
    const set = new Set();
    properties.forEach((p) => { if (p.district) set.add(p.district); if (p.city) set.add(p.city); if (p.location) set.add(p.location); });
    return ['All', ...Array.from(set).sort()];
  }, [properties]);

  const types = useMemo(() => {
    const set = new Set();
    properties.forEach((p) => { if (p.type || p.propertyType) set.add(p.type || p.propertyType); });
    return ['All', ...Array.from(set).sort()];
  }, [properties]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return properties.filter((p) => {
      const haystack = `${p.title} ${p.name} ${p.sellerName} ${p.ownerName} ${p.sellerPhone} ${p.ownerMobile} ${p.district} ${p.taluka} ${p.subDistrict} ${p.village} ${p.city} ${p.location} ${p.id}`.toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      const matchesStatus = status === 'All' || String(p.status) === status;
      const matchesType = type === 'All' || (p.type || p.propertyType) === type;
      const matchesLocation = location === 'All' || p.district === location || p.city === location || p.location === location;
      return matchesQuery && matchesStatus && matchesType && matchesLocation;
    }).sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || a.submittedAt || a.uploadedDate || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || b.submittedAt || b.uploadedDate || 0);
      if (sort === 'price-high') return (parseNum(b.priceAmount) - parseNum(a.priceAmount));
      if (sort === 'price-low') return (parseNum(a.priceAmount) - parseNum(b.priceAmount));
      if (sort === 'location') return String(a.district || a.city).localeCompare(String(b.district || b.city));
      if (sort === 'status') return String(a.status).localeCompare(String(b.status));
      if (sort === 'oldest') return dateA - dateB;
      return dateB - dateA;
    });
  }, [properties, query, status, type, location, sort]);

  const parseNum = (v) => Number(String(v || '').replace(/[^\d]/g, '')) || 0;

  const clearFilters = () => { setQuery(''); setStatus('All'); setType('All'); setLocation('All'); setSort('newest'); };

  const changeStatus = (id, nextStatus) => {
    const current = getAdminProperties();
    const next = current.map((item) => (String(item.id) === String(id) ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() } : item));
    writeStorage(STORAGE_KEYS.listings, next);
    toast.success(t('admin.statusUpdated'));
  };

  const editProperty = (property) => {
    navigate('/master-group/add-property', { state: { editing: property } });
  };

  const row = (p) => (
    <tr key={p.id}>
      <td>
        <div className="fw-semibold">{p.title || p.name}</div>
        <div className="small text-muted">{p.id}</div>
      </td>
      <td>{p.sellerName || p.ownerName || '—'}</td>
      <td>{p.type || p.propertyType || '—'}</td>
      <td>{p.district || p.city || p.location || '—'}</td>
      <td>{formatPrice(p.price || p.priceAmount)}</td>
      <td><span className={`admin-status-badge ${statusBadgeClass(p.status)}`}>{p.status || '—'}</span></td>
      <td className="small text-muted">{formatDate(p.updatedAt || p.createdAt || p.submittedAt || p.uploadedDate)}</td>
      <td>
        <div className="btn-group btn-group-sm">
          <button className="btn btn-outline-secondary" onClick={() => setViewing(p)}>{t('admin.view')}</button>
          <button className="btn btn-outline-primary" onClick={() => editProperty(p)}>{t('admin.edit')}</button>
          <select className="form-select form-select-sm ms-2" style={{ width: 'auto' }} value={p.status} onChange={(e) => changeStatus(p.id, e.target.value)}>
            <option value="Available">{t('admin.statusAvailable')}</option>
            <option value="Unavailable">{t('admin.statusUnavailable')}</option>
            <option value="Sold">{t('admin.statusSold')}</option>
          </select>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="card table-card">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
          <div>
            <h4 className="fw-bold mb-1">{t('admin.properties')}</h4>
            <p className="text-muted mb-0">Search, filter, sort and manage listings in one place.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/master-group/add-property')}>{t('admin.addProperty')}</button>
        </div>

        <div className="row g-2 mb-3 admin-filters">
          <div className="col-12 col-md-4">
            <input className="form-control" placeholder={t('admin.searchPlaceholderProperties')} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="All">{t('admin.allStatus')}</option>
              <option value="Available">{t('admin.statusAvailable')}</option>
              <option value="Unavailable">{t('admin.statusUnavailable')}</option>
              <option value="Sold">{t('admin.statusSold')}</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="All">{t('admin.allTypes')}</option>
              {types.filter((x) => x !== 'All').map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="All">{t('admin.allLocations')}</option>
              {locations.filter((x) => x !== 'All').map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">{t('admin.newest')}</option>
              <option value="oldest">{t('admin.oldest')}</option>
              <option value="price-low">{t('admin.priceLowToHigh')}</option>
              <option value="price-high">{t('admin.priceHighToLow')}</option>
              <option value="location">{t('admin.location')}</option>
              <option value="status">{t('admin.status')}</option>
            </select>
          </div>
        </div>

        <div className="d-flex justify-content-end mb-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>{t('admin.clearFilters')}</button>
        </div>

        <div className="table-responsive admin-desktop-table">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>{t('admin.property')}</th>
                <th>{t('admin.owner')}</th>
                <th>{t('admin.type')}</th>
                <th>{t('admin.location')}</th>
                <th>{t('admin.price')}</th>
                <th>{t('admin.status')}</th>
                <th>{t('admin.date')}</th>
                <th>{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row)}
            </tbody>
          </table>
        </div>

        <div className="admin-mobile-list">
          {filtered.map((p) => (
            <div key={p.id} className="admin-mobile-card">
              <div className="card-head">
                <div className="fw-semibold">{p.title || p.name}</div>
                <span className={`admin-status-badge ${statusBadgeClass(p.status)}`}>{p.status || '—'}</span>
              </div>
              <div className="mt-2">
                <div className="row-label">{t('admin.owner')}</div>
                <div className="row-value">{p.sellerName || p.ownerName || '—'}</div>
                <div className="row-label mt-1">{t('admin.location')}</div>
                <div className="row-value">{p.district || p.city || p.location || '—'} • {p.type || p.propertyType || '—'}</div>
                <div className="row-label mt-1">{t('admin.price')}</div>
                <div className="row-value">{formatPrice(p.price || p.priceAmount)}</div>
                <div className="row-label mt-1">{t('admin.date')}</div>
                <div className="row-value">{formatDate(p.updatedAt || p.createdAt || p.submittedAt || p.uploadedDate)}</div>
              </div>
              <div className="d-flex gap-2 mt-2 flex-wrap">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setViewing(p)}>{t('admin.view')}</button>
                <button className="btn btn-outline-primary btn-sm" onClick={() => editProperty(p)}>{t('admin.edit')}</button>
                <select className="form-select form-select-sm ms-auto" style={{ width: 'auto' }} value={p.status} onChange={(e) => changeStatus(p.id, e.target.value)}>
                  <option value="Available">{t('admin.statusAvailable')}</option>
                  <option value="Unavailable">{t('admin.statusUnavailable')}</option>
                  <option value="Sold">{t('admin.statusSold')}</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {!filtered.length ? (
          <div className="admin-empty-state"><div className="empty-icon">▦</div><div className="empty-title">{t('admin.noPropertiesFound')}</div></div>
        ) : null}

        <div className="d-flex justify-content-between align-items-center mt-3">
          <span className="text-muted small">{filtered.length} listings</span>
        </div>
      </div>

      {viewing ? (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(2,6,23,0.65)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0"><h5 className="modal-title fw-bold">{viewing.title || viewing.name}</h5><button className="btn-close" onClick={() => setViewing(null)} /></div>
              <div className="modal-body p-4">
                <div className="admin-detail-row"><span className="detail-label">ID</span><span className="detail-value">{viewing.id}</span></div>
                <div className="admin-detail-row"><span className="detail-label">{t('admin.status')}</span><span className={`admin-status-badge ${statusBadgeClass(viewing.status)}`}>{viewing.status || '—'}</span></div>
                <div className="admin-detail-row"><span className="detail-label">{t('admin.type')}</span><span className="detail-value">{viewing.type || viewing.propertyType || '—'}</span></div>
                <div className="admin-detail-row"><span className="detail-label">{t('admin.location')}</span><span className="detail-value">{viewing.address || [viewing.village, viewing.subDistrict, viewing.district, viewing.state].filter(Boolean).join(', ') || '—'}</span></div>
                <div className="admin-detail-row"><span className="detail-label">{t('admin.price')}</span><span className="detail-value">{formatPrice(viewing.price || viewing.priceAmount)} {viewing.priceUnit || ''}</span></div>
                <div className="admin-detail-row"><span className="detail-label">{t('admin.area')}</span><span className="detail-value">{viewing.area || viewing.landArea || '—'}</span></div>
                <div className="admin-detail-row"><span className="detail-label">{t('admin.seller')}</span><span className="detail-value">{viewing.sellerName || viewing.ownerName || '—'}</span></div>
                <div className="admin-detail-row"><span className="detail-label">{t('admin.sellerMobile')}</span><span className="detail-value">{viewing.sellerPhone || viewing.ownerMobile || '—'}</span></div>
                <div className="admin-detail-row"><span className="detail-label">{t('admin.description')}</span><span className="detail-value">{viewing.description || '—'}</span></div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- ADD / EDIT PROPERTY PAGE ---------------- */
function AddPropertyPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const editing = location.state?.editing || null;
  const [form, setForm] = useState({
    id: editing?.id || '',
    title: editing?.title || editing?.name || '',
    type: editing?.type || editing?.propertyType || '',
    priceUnit: editing?.priceUnit || '',
    priceAmount: editing?.priceAmount || '',
    district: editing?.district || '',
    taluka: editing?.subDistrict || editing?.taluka || '',
    village: editing?.village || '',
    area: editing?.area || editing?.landArea || '',
    description: editing?.description || '',
    sellerName: editing?.sellerName || editing?.ownerName || '',
    sellerPhone: editing?.sellerPhone || editing?.ownerMobile || '',
    sellerEmail: editing?.sellerEmail || editing?.ownerEmail || '',
    status: editing?.status || 'Available',
    image: editing?.image || '',
  });

  const update = (field, value) => setForm((cur) => ({ ...cur, [field]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.district.trim() || !form.type || !form.sellerName.trim()) {
      toast.error('Please complete title, type, district and seller fields.');
      return;
    }
    const now = new Date().toISOString();
    const property = {
      id: form.id || `PROP-${Date.now()}`,
      title: form.title,
      name: form.title,
      type: form.type,
      propertyType: form.type,
      state: 'Gujarat',
      district: form.district,
      subDistrict: form.taluka,
      taluka: form.taluka,
      village: form.village,
      location: form.district,
      city: form.district,
      address: [form.village, form.taluka, form.district, 'Gujarat'].filter(Boolean).join(', '),
      price: form.priceAmount ? formatPrice(form.priceAmount) : 'Price on request',
      priceAmount: form.priceAmount,
      priceUnit: form.priceUnit,
      landArea: form.area,
      area: form.area,
      description: form.description,
      status: form.status,
      verified: true,
      image: form.image || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80',
      gallery: [form.image || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80'],
      images: [form.image || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80'],
      sellerName: form.sellerName,
      sellerPhone: form.sellerPhone,
      sellerEmail: form.sellerEmail,
      ownerName: form.sellerName,
      ownerMobile: form.sellerPhone,
      ownerEmail: form.sellerEmail,
      seller: { name: form.sellerName, phone: form.sellerPhone, email: form.sellerEmail },
      createdAt: editing?.createdAt || now,
      updatedAt: now,
      submittedAt: editing?.submittedAt || now,
      uploadedDate: editing?.uploadedDate || now,
    };
    const current = getAdminProperties();
    const exists = current.some((item) => String(item.id) === String(property.id));
    const next = exists ? current.map((item) => (String(item.id) === String(property.id) ? property : item)) : [property, ...current];
    writeStorage(STORAGE_KEYS.listings, next);
    toast.success(exists ? t('admin.propertyUpdated') : t('admin.propertySaved'));
    navigate('/master-group/properties');
  };

  return (
    <div className="card table-card">
      <div className="card-body">
        <h4 className="fw-bold mb-1">{editing ? t('admin.edit') : t('admin.addProperty')}</h4>
        <p className="text-muted mb-4">Create or update a land listing that will appear in the customer marketplace.</p>
        <form onSubmit={submit}>
          <div className="row g-3">
            <div className="col-12 col-md-6"><label className="form-label">{t('admin.title')} *</label><input className="form-control input-glow" value={form.title} onChange={(e) => update('title', e.target.value)} required /></div>
            <div className="col-12 col-md-6">
              <label className="form-label">{t('admin.propertyType')} *</label>
              <select className="form-select input-glow" value={form.type} onChange={(e) => update('type', e.target.value)} required>
                <option value="">Select type</option>
                <option value="Agricultural Land">Agricultural Land</option>
                <option value="Non-Agricultural Land">Non-Agricultural Land</option>
              </select>
            </div>
            <div className="col-6 col-md-3"><label className="form-label">{t('admin.price')}</label><input className="form-control input-glow" type="number" value={form.priceAmount} onChange={(e) => update('priceAmount', e.target.value)} placeholder="Amount" /></div>
            <div className="col-6 col-md-3">
              <label className="form-label">{t('admin.price')} Unit</label>
              <select className="form-select input-glow" value={form.priceUnit} onChange={(e) => update('priceUnit', e.target.value)}>
                <option value="">Unit</option>
                <option value="Vigha">Vigha</option>
                <option value="sq.yard (var)">Var (Sq.Yard)</option>
                <option value="Sq.Ft">Sq.Ft</option>
              </select>
            </div>
            <div className="col-12 col-md-6"><label className="form-label">{t('admin.location')} / {t('common.district')} *</label><input className="form-control input-glow" value={form.district} onChange={(e) => update('district', e.target.value)} placeholder="e.g. Surat, Navsari" required /></div>
            <div className="col-6 col-md-3"><label className="form-label">{t('common.taluka')}</label><input className="form-control input-glow" value={form.taluka} onChange={(e) => update('taluka', e.target.value)} placeholder="Taluka" /></div>
            <div className="col-6 col-md-3"><label className="form-label">{t('common.village')}</label><input className="form-control input-glow" value={form.village} onChange={(e) => update('village', e.target.value)} placeholder="Village" /></div>
            <div className="col-12 col-md-6"><label className="form-label">{t('admin.area')}</label><input className="form-control input-glow" value={form.area} onChange={(e) => update('area', e.target.value)} placeholder="e.g. 2 Vigha" /></div>
            <div className="col-12 col-md-6">
              <label className="form-label">{t('admin.status')}</label>
              <select className="form-select input-glow" value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option value="Available">{t('admin.statusAvailable')}</option>
                <option value="Unavailable">{t('admin.statusUnavailable')}</option>
                <option value="Sold">{t('admin.statusSold')}</option>
              </select>
            </div>
            <div className="col-12"><label className="form-label">{t('admin.description')}</label><textarea className="form-control input-glow" rows="3" value={form.description} onChange={(e) => update('description', e.target.value)} /></div>
            <div className="col-12 col-md-4"><label className="form-label">{t('admin.seller')} *</label><input className="form-control input-glow" value={form.sellerName} onChange={(e) => update('sellerName', e.target.value)} required /></div>
            <div className="col-12 col-md-4"><label className="form-label">{t('admin.sellerMobile')}</label><input className="form-control input-glow" type="tel" value={form.sellerPhone} onChange={(e) => update('sellerPhone', e.target.value.replace(/\D/g, '').slice(0, 10))} /></div>
            <div className="col-12 col-md-4"><label className="form-label">Email</label><input className="form-control input-glow" type="email" value={form.sellerEmail} onChange={(e) => update('sellerEmail', e.target.value)} /></div>
            <div className="col-12"><label className="form-label">Image URL</label><input className="form-control input-glow" value={form.image} onChange={(e) => update('image', e.target.value)} placeholder="https://..." /></div>
          </div>
          <div className="mt-4 d-flex justify-content-end gap-2">
            <button className="btn btn-outline-secondary" type="button" onClick={() => navigate('/master-group/properties')}>{t('admin.cancel')}</button>
            <button className="btn btn-primary" type="submit">{t('admin.saveProperty')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- USERS PAGE ---------------- */
function UsersPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('All');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('newest');
  const [detail, setDetail] = useState(null);

  const users = getAdminUsers();
  const buyerLeads = getAdminBuyerLeads();
  const sellerLeads = getAdminSellerLeads();
  const properties = getAdminProperties();

  const enriched = useMemo(() => users.map((u) => ({
    ...u,
    role: deriveUserRole(u, buyerLeads, sellerLeads, properties),
    buyerCount: buyerLeads.filter((l) => String(l.userMobile || '').replace(/\D/g, '') === String(u.mobile || '').replace(/\D/g, '') || String(l.userId || '') === String(u.id || '')).length,
    sellerCount: properties.filter((p) => String(p.sellerPhone || p.ownerMobile || '').replace(/\D/g, '') === String(u.mobile || '').replace(/\D/g, '') || String(p.userId || '') === String(u.id || '')).length,
  })), [users, buyerLeads, sellerLeads, properties]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter((u) => {
      const haystack = `${u.name} ${u.mobile} ${u.email} ${u.id}`.toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      const matchesRole = role === 'All' || u.role === role;
      const matchesStatus = status === 'All' || String(u.status) === status;
      return matchesQuery && matchesRole && matchesStatus;
    }).sort((a, b) => {
      if (sort === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sort === 'name-az') return String(a.name).localeCompare(String(b.name));
      if (sort === 'name-za') return String(b.name).localeCompare(String(a.name));
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [enriched, query, role, status, sort]);

  const clearFilters = () => { setQuery(''); setRole('All'); setStatus('All'); setSort('newest'); };

  const toggleStatus = (id) => {
    const current = getAdminUsers();
    const next = current.map((u) => (String(u.id) === String(id) ? { ...u, status: String(u.status) === 'Active' ? 'Inactive' : 'Active' } : u));
    writeStorage(STORAGE_KEYS.users, next);
    toast.success(t('admin.statusUpdated'));
  };

  return (
    <div className="card table-card">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
          <div>
            <h4 className="fw-bold mb-1">{t('admin.users')}</h4>
            <p className="text-muted mb-0">Manage all registered buyers and sellers.</p>
          </div>
        </div>

        <div className="row g-2 mb-3 admin-filters">
          <div className="col-12 col-md-4">
            <input className="form-control" placeholder={t('admin.searchPlaceholderUsers')} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="All">{t('admin.allRoles')}</option>
              <option value="Buyer">{t('admin.buyer')}</option>
              <option value="Seller">{t('admin.seller')}</option>
              <option value="Buyer & Seller">{t('admin.buyerAndSeller')}</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="All">{t('admin.allStatus')}</option>
              <option value="Active">{t('admin.active')}</option>
              <option value="Inactive">{t('admin.inactive')}</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">{t('admin.newest')}</option>
              <option value="oldest">{t('admin.oldest')}</option>
              <option value="name-az">{t('admin.nameAZ')}</option>
              <option value="name-za">{t('admin.nameZA')}</option>
            </select>
          </div>
          <div className="col-6 col-md-2 text-md-end">
            <button className="btn btn-outline-secondary w-100" onClick={clearFilters}>{t('admin.clearFilters')}</button>
          </div>
        </div>

        <div className="table-responsive admin-desktop-table">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>{t('admin.user')}</th>
                <th>{t('admin.mobile')}</th>
                <th>{t('admin.role')}</th>
                <th>{t('admin.location')}</th>
                <th>{t('admin.registeredDate')}</th>
                <th>{t('admin.status')}</th>
                <th>{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2"><span className="avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>{getInitials(u.name)}</span><span className="fw-semibold">{u.name}{u.isDemo ? <span className="admin-demo-badge">{t('admin.demoData')}</span> : null}</span></div>
                    <div className="small text-muted ms-0">{u.email || '—'}</div>
                  </td>
                  <td>{maskMobile(u.mobile)}</td>
                  <td><span className={`admin-role-badge ${roleBadgeClass(u.role)}`}>{u.role}</span></td>
                  <td>{u.city || u.district || '—'}</td>
                  <td className="small text-muted">{formatDate(u.createdAt)}</td>
                  <td><span className={`admin-status-badge ${statusBadgeClass(u.status)}`}>{u.status || '—'}</span></td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-secondary" onClick={() => setDetail(u)}>{t('admin.view')}</button>
                      <button className="btn btn-outline-warning" onClick={() => toggleStatus(u.id)}>{String(u.status) === 'Active' ? t('admin.deactivate') : t('admin.activate')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-mobile-list">
          {filtered.map((u) => (
            <div key={u.id} className="admin-mobile-card">
              <div className="card-head">
                <div className="d-flex align-items-center gap-2"><span className="avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>{getInitials(u.name)}</span><span className="fw-semibold">{u.name}{u.isDemo ? <span className="admin-demo-badge">{t('admin.demoData')}</span> : null}</span></div>
                <span className={`admin-status-badge ${statusBadgeClass(u.status)}`}>{u.status || '—'}</span>
              </div>
              <div className="mt-2">
                <span className={`admin-role-badge ${roleBadgeClass(u.role)}`}>{u.role}</span>
                <div className="row-label mt-2">{t('admin.mobile')}</div>
                <div className="row-value">{maskMobile(u.mobile)}</div>
                <div className="row-label mt-1">{t('admin.location')}</div>
                <div className="row-value">{u.city || u.district || '—'}</div>
                <div className="row-label mt-1">{t('admin.registeredDate')}</div>
                <div className="row-value">{formatDate(u.createdAt)}</div>
              </div>
              <div className="d-flex gap-2 mt-2">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setDetail(u)}>{t('admin.view')}</button>
                <button className="btn btn-outline-warning btn-sm" onClick={() => toggleStatus(u.id)}>{String(u.status) === 'Active' ? t('admin.deactivate') : t('admin.activate')}</button>
              </div>
            </div>
          ))}
        </div>

        {!filtered.length ? (
          <div className="admin-empty-state"><div className="empty-icon">◎</div><div className="empty-title">{t('admin.noUsersFound')}</div></div>
        ) : null}
      </div>

      {detail ? (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(2,6,23,0.65)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0"><h5 className="modal-title fw-bold">{t('admin.userDetails')}</h5><button className="btn-close" onClick={() => setDetail(null)} /></div>
              <div className="modal-body p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <span className="avatar" style={{ width: 52, height: 52, fontSize: '1.2rem' }}>{getInitials(detail.name)}</span>
                  <div>
                    <div className="fw-bold">{detail.name}{detail.isDemo ? <span className="admin-demo-badge">{t('admin.demoData')}</span> : null}</div>
                    <span className={`admin-role-badge ${roleBadgeClass(detail.role)}`}>{detail.role}</span>
                  </div>
                </div>
                <div className="admin-detail-row"><span className="detail-label">{t('admin.mobile')}</span><span className="detail-value">{detail.mobile}</span></div>
                <div className="admin-detail-row"><span className="detail-label">Email</span><span className="detail-value">{detail.email || '—'}</span></div>
                <div className="admin-detail-row"><span className="detail-label">{t('admin.registeredDate')}</span><span className="detail-value">{formatDate(detail.createdAt)}</span></div>
                <div className="admin-detail-row"><span className="detail-label">{t('admin.location')}</span><span className="detail-value">{detail.city || detail.district || '—'}</span></div>
                <div className="admin-detail-row"><span className="detail-label">{t('admin.accountStatus')}</span><span className={`admin-status-badge ${statusBadgeClass(detail.status)}`}>{detail.status || '—'}</span></div>
                <div className="admin-detail-row"><span className="detail-label">{t('admin.buyerRequirements')}</span><span className="detail-value">{detail.buyerCount || 0}</span></div>
                <div className="admin-detail-row"><span className="detail-label">{t('admin.listedProperties')}</span><span className="detail-value">{detail.sellerCount || 0}</span></div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-outline-secondary" onClick={() => setDetail(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- PROFILE PAGE ---------------- */
function ProfilePage() {
  const { t } = useLanguage();
  const session = readMasterGroupSession();
  const isSuper = isSuperAdminSession();
  const roleLabel = isSuper ? t('admin.superAdmin') : t('admin.masterGroupAdmin');
  const name = ADMIN_NAMES[session?.mobile] || 'Master Group Admin';

  return (
    <div className="card table-card">
      <div className="card-body">
        <h4 className="fw-bold mb-3">{t('admin.profile')}</h4>
        <div className="d-flex align-items-center gap-3 mb-4">
          <span className="avatar" style={{ width: 56, height: 56, fontSize: '1.3rem' }}>{getInitials(name)}</span>
          <div>
            <div className="h5 mb-1">{name}</div>
            <span className={`admin-role-badge ${isSuper ? 'role-both' : 'role-seller'}`}>{roleLabel}</span>
          </div>
        </div>
        <div className="admin-detail-row"><span className="detail-label">{t('admin.name')}</span><span className="detail-value">{name}</span></div>
        <div className="admin-detail-row"><span className="detail-label">{t('admin.role')}</span><span className="detail-value">{roleLabel}</span></div>
        <div className="admin-detail-row"><span className="detail-label">{t('admin.mobile')}</span><span className="detail-value">{maskMobile(session?.mobile)}</span></div>
        <div className="admin-detail-row"><span className="detail-label">{t('admin.accountStatus')}</span><span className={`admin-status-badge status-active`}>{t('admin.active')}</span></div>
      </div>
    </div>
  );
}

/* ---------------- ADMIN ACTIVITY PAGE ---------------- */
function AdminActivityPage() {
  const { t } = useLanguage();
  const [activity, setActivity] = useState(() => getAdminActivity());
  const [query, setQuery] = useState('');
  const [adminFilter, setAdminFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    const cleanup = onAdminActivityChanged(() => setActivity(getAdminActivity()));
    return cleanup;
  }, []);

  const admins = useMemo(() => {
    const map = new Map();
    activity.forEach((a) => {
      if (!map.has(a.mobile)) map.set(a.mobile, ADMIN_NAMES[a.mobile] || `+91 ${maskMobile(a.mobile)}`);
    });
    return ['All', ...Array.from(map.keys())];
  }, [activity]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activity.filter((a) => {
      const name = ADMIN_NAMES[a.mobile] || '';
      const haystack = `${name} ${a.mobile} ${a.role} ${a.id}`.toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      const matchesAdmin = adminFilter === 'All' || String(a.mobile) === adminFilter;
      const matchesStatus = statusFilter === 'All'
        || (statusFilter === 'Active' && a.status === 'Login')
        || (statusFilter === 'Logged Out' && String(a.status).toLowerCase().includes('logout'));
      return matchesQuery && matchesAdmin && matchesStatus;
    }).sort((a, b) => {
      const ta = new Date(a.loginAt || a.logoutAt || 0);
      const tb = new Date(b.loginAt || b.logoutAt || 0);
      return sort === 'oldest' ? ta - tb : tb - ta;
    });
  }, [activity, query, adminFilter, statusFilter, sort]);

  const clearFilters = () => { setQuery(''); setAdminFilter('All'); setStatusFilter('All'); setSort('newest'); };

  return (
    <div className="card table-card">
      <div className="card-body">
        <h4 className="fw-bold mb-1">{t('admin.adminActivityTitle')}</h4>
        <p className="text-muted mb-0">{t('admin.adminActivityDesc')}</p>
        <div className="mt-2 mb-3">
          <div className="alert alert-warning py-2 small mb-0">⚠️ {t('admin.devWarning')}</div>
        </div>

        <div className="row g-2 mb-3 admin-filters">
          <div className="col-12 col-md-4"><input className="form-control" placeholder={t('admin.search')} value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={adminFilter} onChange={(e) => setAdminFilter(e.target.value)}>
              <option value="All">{t('admin.filterByAdmin')}</option>
              {admins.filter((x) => x !== 'All').map((m) => <option key={m} value={m}>{ADMIN_NAMES[m] || maskMobile(m)}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">{t('admin.filterByActivityStatus')}</option>
              <option value="Active">{t('admin.active')}</option>
              <option value="Logged Out">{t('admin.loggedOut')}</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">{t('admin.newest')}</option>
              <option value="oldest">{t('admin.oldest')}</option>
            </select>
          </div>
          <div className="col-6 col-md-2 text-md-end">
            <button className="btn btn-outline-secondary w-100" onClick={clearFilters}>{t('admin.clearFilters')}</button>
          </div>
        </div>

        <div className="d-none d-md-block admin-desktop-table">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>{t('admin.admin')}</th>
                  <th>{t('admin.mobile')}</th>
                  <th>{t('admin.role')}</th>
                  <th>{t('admin.loginTime')}</th>
                  <th>{t('admin.logoutTime')}</th>
                  <th>{t('admin.status')}</th>
                  <th>{t('admin.sessionId')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id}>
                    <td className="fw-semibold">{ADMIN_NAMES[entry.mobile] || 'Admin'}</td>
                    <td>{maskMobile(entry.mobile)}</td>
                    <td><span className="admin-role-badge role-both">{entry.role === 'super-admin' ? t('admin.superAdmin') : t('admin.masterGroupAdmin')}</span></td>
                    <td>{formatDateTime(entry.loginAt)}</td>
                    <td>{formatDateTime(entry.logoutAt)}</td>
                    <td><span className={`admin-status-badge ${statusBadgeClass(entry.status)}`}>{entry.status === 'Login' ? t('admin.active') : t('admin.loggedOut')}</span></td>
                    <td className="small text-muted">{entry.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="d-md-none admin-mobile-list">
          {filtered.map((entry) => (
            <div key={entry.id} className="admin-mobile-card">
              <div className="card-head">
                <span className="fw-semibold">{ADMIN_NAMES[entry.mobile] || 'Admin'}</span>
                <span className={`admin-status-badge ${statusBadgeClass(entry.status)}`}>{entry.status === 'Login' ? t('admin.active') : t('admin.loggedOut')}</span>
              </div>
              <div className="mt-2">
                <div className="row-label">{t('admin.mobile')}</div>
                <div className="row-value">{maskMobile(entry.mobile)}</div>
                <div className="row-label mt-1">{t('admin.role')}</div>
                <div className="row-value">{entry.role === 'super-admin' ? t('admin.superAdmin') : t('admin.masterGroupAdmin')}</div>
                <div className="row-label mt-1">{t('admin.loginTime')}</div>
                <div className="row-value">{formatDateTime(entry.loginAt)}</div>
                <div className="row-label mt-1">{t('admin.logoutTime')}</div>
                <div className="row-value">{formatDateTime(entry.logoutAt)}</div>
                <div className="row-label mt-1">{t('admin.sessionId')}</div>
                <div className="row-value small">{entry.id}</div>
              </div>
            </div>
          ))}
        </div>

        {!filtered.length ? (
          <div className="admin-empty-state"><div className="empty-icon">◷</div><div className="empty-title">{t('admin.noActivityFound')}</div></div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- ADMIN SHELL ---------------- */
function AdminShell({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSuperAdmin = isSuperAdminSession();

  useEffect(() => {
    if (location.pathname === '/master-group') setSidebarOpen(false);
  }, [location.pathname]);

  // Route protection: only super-admin may access admin-activity
  useEffect(() => {
    if (location.pathname.includes('/admin-activity') && !isSuperAdmin) {
      navigate('/master-group', { replace: true });
    }
  }, [location.pathname, isSuperAdmin, navigate]);

  const baseNavItems = [
    { to: '/master-group', label: t('admin.dashboard'), icon: '▦' },
    { to: '/master-group/properties', label: t('admin.properties'), icon: '⌂' },
    { to: '/master-group/add-property', label: t('admin.addProperty'), icon: '+' },
    { to: '/master-group/users', label: t('admin.users'), icon: '◎' },
    { to: '/master-group/profile', label: t('admin.profile'), icon: '◍' },
  ];
  const superAdminItems = isSuperAdmin ? [{ to: '/master-group/admin-activity', label: t('admin.adminActivity'), icon: '◷' }] : [];
  const navItems = [...baseNavItems, ...superAdminItems];

  return (
    <div className="admin-app">
      {sidebarOpen ? <div className="sidebar-overlay d-lg-none" onClick={() => setSidebarOpen(false)} /> : null}
      <div className="admin-shell">
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="px-2 pb-3 border-bottom border-secondary-subtle mb-3">
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className="avatar">BS</div>
              <div>
                <div className="fw-bold">Broker Streets</div>
                <div className="small text-white-50">Master Group Portal</div>
              </div>
            </div>
          </div>
          <nav className="d-flex flex-column gap-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className="nav-link" onClick={() => setSidebarOpen(false)}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
            <button className="btn btn-outline-light mt-3" onClick={onLogout}>{t('admin.logout')}</button>
          </nav>
        </aside>

        <div className="admin-content">
          <header className="admin-topbar px-3 px-lg-4 py-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-light d-lg-none" onClick={() => setSidebarOpen(true)}>☰</button>
              <div>
                <div className="fw-semibold">{t('admin.welcomeBack')}</div>
                <div className="small text-muted">{t('admin.welcomeSubtitle')}</div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <NavLink to="/master-group/profile" className="btn btn-outline-secondary btn-sm">{t('admin.profile')}</NavLink>
            </div>
          </header>

          <div className="p-3 p-lg-4">
            <Routes>
              <Route path="" element={<Dashboard />} />
              <Route path="properties" element={<PropertiesPage navigate={navigate} />} />
              <Route path="add-property" element={<AddPropertyPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="profile" element={<ProfilePage />} />
              {isSuperAdmin ? <Route path="admin-activity" element={<AdminActivityPage />} /> : null}
              <Route path="*" element={<Navigate to="/master-group" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- ADMIN APP ---------------- */
export default function AdminApp() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Seed demo data ONCE so the panel looks populated during presentation
    seedAdminDemoData();
    const timer = setTimeout(() => setReady(true), 250);
    return () => clearTimeout(timer);
  }, []);

  const logout = () => {
    const session = readMasterGroupSession();
    if (session) {
      // DEVELOPMENT-ONLY: record admin logout activity. See storage.js notice.
      appendAdminActivity({
        id: `logout-${Date.now()}`,
        mobile: session.mobile,
        role: session.role,
        type: 'logout',
        logoutAt: new Date().toISOString(),
        status: 'Logout',
        sessionInfo: t('admin.sessionClosedVia'),
      });
    }
    clearMasterGroupSession();
    toast.info('Master Group logged out');
    navigate('/master-group/login');
  };

  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route
        path="*"
        element={
          !ready
            ? <div className="admin-app d-flex align-items-center justify-content-center"><div className="spinner-border text-primary" role="status" /></div>
            : (
              <ProtectedAdminRoute>
                <AdminShell onLogout={logout} />
              </ProtectedAdminRoute>
            )
        }
      />
    </Routes>
  );
}