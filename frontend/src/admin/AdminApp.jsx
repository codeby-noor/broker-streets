import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import './admin.css';
import { readStorage, writeStorage } from '../utils/storage';

const ADMIN_AUTH_KEY = 'broker-streets-admin-auth';
const ADMIN_SETTINGS_KEY = 'broker-streets-admin-settings';

const defaultSettings = {
  siteName: 'Broker Streets',
  contactEmail: 'hello@brokerstreets.com',
  phone: '+91 98765 43210',
  address: 'Ahmedabad, Gujarat',
  primaryColor: '#2563eb',
  secondaryColor: '#0f172a',
  footerText: 'Premium real estate experiences with transparent, data-driven guidance.',
};

const seedProperties = [
  {
    id: 'PROP-1001',
    title: 'Azure Skyline Residence',
    sellerName: 'Ananya Shah',
    city: 'Ahmedabad',
    category: 'Apartment',
    propertyType: 'Residential',
    purpose: 'Sale',
    price: 8200000,
    area: 1425,
    bedrooms: 3,
    bathrooms: 2,
    balcony: 1,
    parking: 2,
    floor: 8,
    totalFloors: 12,
    facing: 'North-East',
    furnishing: 'Semi-Furnished',
    constructionAge: '2 Years',
    readyToMove: true,
    amenities: ['Pool', 'Gym', 'Security'],
    address: 'SG Highway',
    state: 'Gujarat',
    pincode: '380054',
    status: 'Available',
    featured: true,
    dateAdded: '2026-07-18',
    images: ['https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80'],
    description: 'Luxury apartment in the heart of the business corridor.',
  },
  {
    id: 'PROP-1002',
    title: 'Verdant Villa Park',
    sellerName: 'Rohan Mehta',
    city: 'Surat',
    category: 'Villa',
    propertyType: 'Residential',
    purpose: 'Sale',
    price: 15600000,
    area: 2480,
    bedrooms: 4,
    bathrooms: 4,
    balcony: 2,
    parking: 3,
    floor: 2,
    totalFloors: 2,
    facing: 'West',
    furnishing: 'Fully Furnished',
    constructionAge: '5 Years',
    readyToMove: true,
    amenities: ['Garden', 'Home Theatre', 'Backup'],
    address: 'Dumas Road',
    state: 'Gujarat',
    pincode: '395007',
    status: 'Pending',
    featured: false,
    dateAdded: '2026-07-22',
    images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80'],
    description: 'Spacious villa with modern interiors and private garden.',
  },
  {
    id: 'PROP-1003',
    title: 'Harbor Commercial Hub',
    sellerName: 'Mira Joshi',
    city: 'Vadodara',
    category: 'Commercial',
    propertyType: 'Commercial',
    purpose: 'Lease',
    price: 3200000,
    area: 2800,
    bedrooms: 0,
    bathrooms: 2,
    balcony: 2,
    parking: 8,
    floor: 3,
    totalFloors: 5,
    facing: 'South',
    furnishing: 'Unfurnished',
    constructionAge: '1 Year',
    readyToMove: true,
    amenities: ['Lift', 'CCTV', 'Parking'],
    address: 'Alkapuri',
    state: 'Gujarat',
    pincode: '390007',
    status: 'Sold',
    featured: true,
    dateAdded: '2026-06-14',
    images: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'],
    description: 'Premium office and retail space suitable for flagship stores.',
  },
];

const seedBuyerLeads = [
  { id: 'BL-1001', name: 'Vikram Rao', phone: '9876543210', email: 'vikram@example.com', city: 'Ahmedabad', budget: '₹80 Lakh', preferredArea: 'SG Highway', purpose: 'Investment', date: '2026-07-27', status: 'New' },
  { id: 'BL-1002', name: 'Neha Verma', phone: '9988776655', email: 'neha@example.com', city: 'Surat', budget: '₹1.2 Cr', preferredArea: 'Dumas', purpose: 'Home', date: '2026-07-24', status: 'Hot' },
];

const seedSellerLeads = [
  { id: 'SL-1001', ownerName: 'Deepak Patel', phone: '9123456780', email: 'deepak@example.com', propertyType: 'Villa', city: 'Ahmedabad', expectedPrice: '₹1.5 Cr', googleMapLink: 'https://maps.google.com', submissionDate: '2026-07-25', status: 'New' },
];

const seedUsers = [
  { id: 'USR-1001', profile: 'AR', name: 'Aarav Rathod', mobile: '9876123456', email: 'aarav@example.com', state: 'Gujarat', city: 'Ahmedabad', registrationDate: '2026-05-12', buyerCompleted: true, sellerCompleted: false, status: 'Active' },
  { id: 'USR-1002', profile: 'SK', name: 'Sonia Kapoor', mobile: '9765432108', email: 'sonia@example.com', state: 'Gujarat', city: 'Surat', registrationDate: '2026-06-18', buyerCompleted: true, sellerCompleted: true, status: 'Active' },
];

const seedEnquiries = [
  { id: 'ENQ-1001', buyer: 'Vikram Rao', seller: 'Ananya Shah', property: 'Azure Skyline Residence', message: 'Can I schedule a site visit this weekend?', phone: '9876543210', email: 'vikram@example.com', date: '2026-07-28', status: 'Pending' },
];

const seedCategories = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Office', 'Farm House', 'Bungalow'];
const seedLocations = [{ state: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara'], areas: ['SG Highway', 'Dumas', 'Alkapuri'] }];
const seedNotifications = [
  { id: 1, title: 'New buyer registered', detail: 'Vikram Rao completed the buyer form.', unread: true, createdAt: '2026-07-28' },
  { id: 2, title: 'Property updated', detail: 'Azure Skyline Residence was featured.', unread: false, createdAt: '2026-07-27' },
];

function createInitialData() {
  return {
    properties: readStorage('broker-streets-properties', seedProperties),
    buyerLeads: readStorage('broker-streets-buyer-leads', seedBuyerLeads),
    sellerLeads: readStorage('broker-streets-seller-leads', seedSellerLeads),
    users: readStorage('broker-streets-users', seedUsers),
    enquiries: readStorage('broker-streets-enquiries', seedEnquiries),
    categories: readStorage('broker-streets-categories', seedCategories),
    locations: readStorage('broker-streets-locations', seedLocations),
    notifications: readStorage('broker-streets-notifications', seedNotifications),
    settings: readStorage(ADMIN_SETTINGS_KEY, defaultSettings),
  };
}

function ProtectedAdminRoute({ children }) {
  const auth = readStorage(ADMIN_AUTH_KEY, null);
  return auth ? children : <Navigate to="login" replace />;
}

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (email.includes('@') && password.length >= 4) {
        writeStorage(ADMIN_AUTH_KEY, { email, remember });
        toast.success('Signed in successfully');
        navigate('/admin');
      } else {
        toast.error('Please enter a valid admin email and password');
      }
      setLoading(false);
    }, 700);
  };

  return (
    <div className="admin-app d-flex align-items-center justify-content-center px-3 py-5">
      <div className="card form-card w-100" style={{ maxWidth: 480 }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="avatar mx-auto mb-3">BS</div>
            <h2 className="fw-bold page-title">Broker Streets Admin</h2>
            <p className="text-muted mb-0">Secure, premium control center for your real estate CRM</p>
          </div>
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Admin Email</label>
              <input className="form-control input-glow" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@brokerstreets.com" />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Password</label>
              <input className="form-control input-glow" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
            </div>
            <div className="form-check mb-3">
              <input className="form-check-input" id="remember" type="checkbox" checked={remember} onChange={() => setRemember(!remember)} />
              <label className="form-check-label" htmlFor="remember">Remember me</label>
            </div>
            <button className="btn btn-primary w-100 py-2" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
          </form>
          <div className="d-flex justify-content-between align-items-center mt-3 text-muted small">
            <button className="btn btn-link p-0">Forgot Password?</button>
            <span className="badge bg-primary-subtle text-primary">Local Demo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ properties, buyerLeads, sellerLeads, users, enquiries, notifications }) {
  const stats = useMemo(() => ({
    totalProperties: properties.length,
    activeProperties: properties.filter((p) => p.status === 'Available').length,
    soldProperties: properties.filter((p) => p.status === 'Sold').length,
    pendingProperties: properties.filter((p) => p.status === 'Pending').length,
    totalBuyers: buyerLeads.length,
    totalSellers: sellerLeads.length,
    totalEnquiries: enquiries.length,
    newLeadsToday: 3,
    registeredUsers: users.length,
  }), []);

  const categoryData = ['Apartment', 'Villa', 'Commercial', 'Office', 'Plot'];
  const monthlyData = [18, 22, 27, 19, 31, 26];

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 page-title">Dashboard Overview</h2>
          <p className="text-muted mb-0">A polished real estate CRM view of your portfolio, contacts, and activity.</p>
        </div>
        <div className="text-end">
          <div className="fw-semibold">Today</div>
          <div className="text-muted small">{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {[
          ['Total Properties', stats.totalProperties, 'primary'],
          ['Active Properties', stats.activeProperties, 'success'],
          ['Sold Properties', stats.soldProperties, 'danger'],
          ['Pending Properties', stats.pendingProperties, 'warning'],
          ['Total Buyers', stats.totalBuyers, 'info'],
          ['Total Sellers', stats.totalSellers, 'secondary'],
          ['Total Enquiries', stats.totalEnquiries, 'dark'],
          ['New Leads Today', stats.newLeadsToday, 'primary'],
          ['Registered Users', stats.registeredUsers, 'success'],
        ].map(([label, value, tone]) => (
          <div className="col-12 col-md-6 col-xl-4" key={label}>
            <div className={`card dashboard-card text-white bg-${tone}`}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="small fw-semibold text-uppercase opacity-75">{label}</div>
                    <div className="display-6 fw-bold mt-2">{value}</div>
                  </div>
                  <span className="stat-pill">Live</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-6">
          <div className="card chart-card">
            <div className="card-body">
              <h5 className="fw-semibold mb-1">Properties by Category</h5>
              <p className="text-muted small mb-0">Portfolio mix across residential and commercial offerings.</p>
              <div className="chart-bars mt-4">
                {categoryData.map((item, index) => (
                  <div key={item} className="bar" style={{ height: `${40 + index * 20}px` }}><small>{item}</small></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-6">
          <div className="card chart-card">
            <div className="card-body">
              <h5 className="fw-semibold mb-1">Monthly Enquiries</h5>
              <p className="text-muted small mb-0">Momentum and demand across the year.</p>
              <div className="chart-bars mt-4">
                {monthlyData.map((value, index) => (
                  <div key={`${value}-${index}`} className="bar" style={{ height: `${value * 3}px` }}><small>0{index + 1}</small></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <div className="card table-card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-semibold mb-0">Recent Buyer Forms</h5>
                <span className="badge badge-soft">Updated</span>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr><th>Name</th><th>City</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {buyerLeads.slice(0, 3).map((lead) => (
                      <tr key={lead.id}><td>{lead.name}</td><td>{lead.city}</td><td><span className="badge bg-primary-subtle text-primary">{lead.status}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-6">
          <div className="card table-card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-semibold mb-0">Latest Added Properties</h5>
                <span className="badge badge-soft">Fresh</span>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr><th>Title</th><th>City</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {properties.slice(0, 3).map((property) => (
                      <tr key={property.id}><td>{property.title}</td><td>{property.city}</td><td><span className="badge bg-success-subtle text-success">{property.status}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertiesPage({ properties, setProperties, setModalState }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const filtered = useMemo(() => {
    const next = [...properties].filter((property) => {
      const matchesQuery = `${property.title} ${property.city} ${property.sellerName}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === 'All' || property.status === status;
      return matchesQuery && matchesStatus;
    });
    next.sort((a, b) => {
      if (sort === 'price-high') return b.price - a.price;
      if (sort === 'price-low') return a.price - b.price;
      if (sort === 'name') return a.title.localeCompare(b.title);
      return new Date(b.dateAdded) - new Date(a.dateAdded);
    });
    return next;
  }, [properties, query, status, sort]);

  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const updateStatus = (id, nextStatus) => {
    setProperties((current) => current.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
    toast.success(`Property marked as ${nextStatus}`);
  };

  const removeProperty = (id) => {
    setProperties((current) => current.filter((item) => item.id !== id));
    toast.info('Property removed');
  };

  return (
    <div className="card table-card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-1">Property Management</h4>
            <p className="text-muted mb-0">Search, filter, sort, and manage listings in one place.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModalState('property-form')}>+ Add Property</button>
        </div>
        <div className="row g-2 mb-3">
          <div className="col-12 col-md-4">
            <input className="form-control" placeholder="Search properties" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="All">All Status</option>
              <option value="Available">Available</option>
              <option value="Pending">Pending</option>
              <option value="Sold">Sold</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="price-high">Price High-Low</option>
              <option value="price-low">Price Low-High</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
          <div className="col-12 col-md-4 text-md-end">
            <button className="btn btn-outline-secondary me-2">Export CSV</button>
            <button className="btn btn-outline-danger">Bulk Delete</button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Title</th><th>Seller</th><th>City</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((property) => (
                <tr key={property.id}>
                  <td>
                    <div className="fw-semibold">{property.title}</div>
                    <div className="small text-muted">{property.id}</div>
                  </td>
                  <td>{property.sellerName}</td>
                  <td>{property.city}</td>
                  <td>{property.category}</td>
                  <td>₹{property.price.toLocaleString()}</td>
                  <td><span className="badge bg-info-subtle text-info">{property.status}</span></td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-secondary" onClick={() => setModalState('property-view', property)}>View</button>
                      <button className="btn btn-outline-primary" onClick={() => setModalState('property-form', property)}>Edit</button>
                      <button className="btn btn-outline-danger" onClick={() => removeProperty(property.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <span className="text-muted small">Showing {paged.length} of {filtered.length} listings</span>
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
            <button className="btn btn-outline-secondary" disabled={page * rowsPerPage >= filtered.length} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuyerLeadsPage({ buyerLeads, setBuyerLeads }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const filtered = useMemo(() => buyerLeads.filter((lead) => {
    const matches = `${lead.name} ${lead.city} ${lead.email}`.toLowerCase().includes(query.toLowerCase());
    return matches && (status === 'All' || lead.status === status);
  }), [buyerLeads, query, status]);

  const removeLead = (id) => {
    setBuyerLeads((current) => current.filter((item) => item.id !== id));
    toast.info('Lead removed');
  };

  return (
    <div className="card table-card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-1">Buyer Leads</h4>
            <p className="text-muted mb-0">Track high-intent buyers and follow up quickly.</p>
          </div>
          <button className="btn btn-outline-secondary">Export CSV</button>
        </div>
        <div className="row g-2 mb-3">
          <div className="col-12 col-md-6">
            <input className="form-control" placeholder="Search buyer leads" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="col-12 col-md-3">
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="All">All Status</option>
              <option value="New">New</option>
              <option value="Hot">Hot</option>
            </select>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>City</th><th>Budget</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name}</td><td>{lead.phone}</td><td>{lead.email}</td><td>{lead.city}</td><td>{lead.budget}</td><td><span className="badge bg-primary-subtle text-primary">{lead.status}</span></td>
                  <td><button className="btn btn-sm btn-outline-danger" onClick={() => removeLead(lead.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SellerLeadsPage({ sellerLeads, setSellerLeads }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => sellerLeads.filter((lead) => `${lead.ownerName} ${lead.city}`.toLowerCase().includes(query.toLowerCase())), [sellerLeads, query]);
  const removeLead = (id) => {
    setSellerLeads((current) => current.filter((item) => item.id !== id));
    toast.info('Seller lead removed');
  };

  return (
    <div className="card table-card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-1">Seller Leads</h4>
            <p className="text-muted mb-0">Review new seller submissions and reach out quickly.</p>
          </div>
          <button className="btn btn-outline-secondary">Export</button>
        </div>
        <div className="mb-3">
          <input className="form-control" placeholder="Search seller leads" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead><tr><th>Owner</th><th>Phone</th><th>Property</th><th>City</th><th>Expected Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.ownerName}</td><td>{lead.phone}</td><td>{lead.propertyType}</td><td>{lead.city}</td><td>{lead.expectedPrice}</td><td><span className="badge bg-warning-subtle text-warning">{lead.status}</span></td>
                  <td><button className="btn btn-sm btn-outline-danger" onClick={() => removeLead(lead.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UsersPage({ users, setUsers }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => users.filter((user) => `${user.name} ${user.email} ${user.city}`.toLowerCase().includes(query.toLowerCase())), [users, query]);
  const toggleStatus = (id) => {
    setUsers((current) => current.map((user) => user.id === id ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' } : user));
    toast.success('User status updated');
  };

  return (
    <div className="card table-card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-1">Registered Users</h4>
            <p className="text-muted mb-0">Manage account activity and onboarding completion.</p>
          </div>
          <button className="btn btn-outline-secondary">Export CSV</button>
        </div>
        <div className="mb-3">
          <input className="form-control" placeholder="Search users" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead><tr><th>Name</th><th>Mobile</th><th>Email</th><th>City</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td><div className="fw-semibold">{user.name}</div><div className="small text-muted">Buyer: {user.buyerCompleted ? 'Yes' : 'No'} / Seller: {user.sellerCompleted ? 'Yes' : 'No'}</div></td>
                  <td>{user.mobile}</td><td>{user.email}</td><td>{user.city}</td><td><span className="badge bg-success-subtle text-success">{user.status}</span></td>
                  <td><button className="btn btn-sm btn-outline-secondary" onClick={() => toggleStatus(user.id)}>Toggle</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EnquiriesPage({ enquiries, setEnquiries }) {
  const removeEnquiry = (id) => {
    setEnquiries((current) => current.filter((item) => item.id !== id));
    toast.info('Enquiry removed');
  };

  return (
    <div className="card table-card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-1">Enquiries</h4>
            <p className="text-muted mb-0">Review messages from buyers and sellers.</p>
          </div>
          <button className="btn btn-outline-secondary">Reply</button>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead><tr><th>Buyer</th><th>Seller</th><th>Property</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id}>
                  <td>{enquiry.buyer}</td><td>{enquiry.seller}</td><td>{enquiry.property}</td><td>{enquiry.message}</td><td><span className="badge bg-warning-subtle text-warning">{enquiry.status}</span></td>
                  <td><button className="btn btn-sm btn-outline-danger" onClick={() => removeEnquiry(enquiry.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CategoriesPage({ categories, setCategories }) {
  const [name, setName] = useState('');
  const addCategory = () => {
    if (!name.trim()) return;
    setCategories((current) => [...current, name.trim()]);
    setName('');
    toast.success('Category added');
  };
  return (
    <div className="card table-card">
      <div className="card-body">
        <h4 className="fw-bold mb-3">Categories</h4>
        <div className="row g-2 mb-3">
          <div className="col-12 col-md-8"><input className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="Add category" /></div>
          <div className="col-12 col-md-4"><button className="btn btn-primary w-100" onClick={addCategory}>Add Category</button></div>
        </div>
        <div className="row g-2">
          {categories.map((category) => <div key={category} className="col-12 col-md-4"><div className="border rounded-3 p-3">{category}</div></div>)}
        </div>
      </div>
    </div>
  );
}

function LocationsPage({ locations, setLocations }) {
  return (
    <div className="card table-card">
      <div className="card-body">
        <h4 className="fw-bold mb-3">Locations</h4>
        <div className="row g-3">
          {locations.map((location) => (
            <div key={location.state} className="col-12 col-md-6">
              <div className="border rounded-3 p-3">
                <h6 className="fw-semibold">{location.state}</h6>
                <p className="text-muted small mb-2">Cities: {location.cities.join(', ')}</p>
                <p className="text-muted small mb-0">Areas: {location.areas.join(', ')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationsPage({ notifications }) {
  return (
    <div className="card table-card">
      <div className="card-body">
        <h4 className="fw-bold mb-3">Notifications</h4>
        <div className="list-group">
          {notifications.map((item) => (
            <div key={item.id} className="list-group-item d-flex justify-content-between align-items-start">
              <div>
                <div className="fw-semibold">{item.title}</div>
                <div className="text-muted small">{item.detail}</div>
              </div>
              {item.unread ? <span className="badge bg-danger">New</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportsPage() {
  return (
    <div className="card table-card">
      <div className="card-body">
        <h4 className="fw-bold mb-3">Reports</h4>
        <p className="text-muted">Property, buyer, seller, and revenue reporting views are ready for expansion with richer charts and exports.</p>
      </div>
    </div>
  );
}

function SettingsPage({ settings, setSettings }) {
  const [form, setForm] = useState(settings);
  const save = () => {
    setSettings(form);
    writeStorage(ADMIN_SETTINGS_KEY, form);
    toast.success('Settings saved');
  };
  return (
    <div className="card table-card">
      <div className="card-body">
        <h4 className="fw-bold mb-3">Settings</h4>
        <div className="row g-3">
          <div className="col-12 col-md-6"><label className="form-label">Website Name</label><input className="form-control" value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} /></div>
          <div className="col-12 col-md-6"><label className="form-label">Contact Email</label><input className="form-control" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
          <div className="col-12 col-md-6"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="col-12 col-md-6"><label className="form-label">Address</label><input className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="col-12 col-md-6"><label className="form-label">Primary Color</label><input className="form-control" type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} /></div>
          <div className="col-12 col-md-6"><label className="form-label">Secondary Color</label><input className="form-control" type="color" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} /></div>
          <div className="col-12"><label className="form-label">Footer Content</label><textarea className="form-control" rows="3" value={form.footerText} onChange={(e) => setForm({ ...form, footerText: e.target.value })} /></div>
        </div>
        <button className="btn btn-primary mt-3" onClick={save}>Save Settings</button>
      </div>
    </div>
  );
}

function ProfilePage({ settings }) {
  return (
    <div className="card table-card">
      <div className="card-body">
        <h4 className="fw-bold mb-3">Admin Profile</h4>
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="avatar">AD</div>
          <div>
            <h5 className="mb-1">Admin Dashboard</h5>
            <p className="text-muted mb-0">{settings.siteName} · {settings.contactEmail}</p>
          </div>
        </div>
        <div className="border rounded-3 p-3">Activity log is ready for richer audit entries and role-based insights.</div>
      </div>
    </div>
  );
}

function AdminShell({ data, setData, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalState, setModalState] = useState(null);
  const [draft, setDraft] = useState(null);

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: '▦' },
    { to: '/admin/properties', label: 'Properties', icon: '⌂' },
    { to: '/admin/add-property', label: 'Add Property', icon: '+' },
    { to: '/admin/buyer-leads', label: 'Buyer Leads', icon: '◈' },
    { to: '/admin/seller-leads', label: 'Seller Leads', icon: '◈' },
    { to: '/admin/users', label: 'Users', icon: '◎' },
    { to: '/admin/enquiries', label: 'Enquiries', icon: '✉' },
    { to: '/admin/categories', label: 'Categories', icon: '☰' },
    { to: '/admin/locations', label: 'Locations', icon: '⌖' },
    { to: '/admin/reports', label: 'Reports', icon: '◷' },
    { to: '/admin/notifications', label: 'Notifications', icon: '🔔' },
    { to: '/admin/settings', label: 'Settings', icon: '⚙' },
    { to: '/admin/profile', label: 'Profile', icon: '◍' },
  ];

  const saveProperty = (event) => {
    event.preventDefault();
    const next = { ...(draft || {}), id: draft?.id || `PROP-${Date.now()}`, dateAdded: draft?.dateAdded || new Date().toISOString().slice(0, 10), status: draft?.status || 'Available', featured: draft?.featured || false, images: draft?.images || [] };
    setData((current) => {
      const list = current.properties.some((item) => item.id === next.id) ? current.properties.map((item) => item.id === next.id ? next : item) : [next, ...current.properties];
      return { ...current, properties: list };
    });
    toast.success(draft?.id ? 'Property updated' : 'Property saved');
    setModalState(null);
    setDraft(null);
  };

  const openCreate = () => {
    setDraft({ title: '', description: '', category: 'Apartment', propertyType: 'Residential', purpose: 'Sale', price: '', area: '', bedrooms: '', bathrooms: '', balcony: '', parking: '', floor: '', totalFloors: '', facing: 'North', furnishing: 'Semi-Furnished', constructionAge: 'New', readyToMove: true, amenities: [], address: '', city: '', state: '', pincode: '', googleMapsLink: '', latitude: '', longitude: '', sellerName: '', sellerPhone: '', sellerEmail: '', status: 'Available', featured: false, images: [] });
    setModalState('property-form');
  };

  useEffect(() => {
    if (location.pathname === '/admin') {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

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
                <div className="small text-white-50">Admin Console</div>
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
            <button className="btn btn-outline-light mt-3" onClick={onLogout}>Logout</button>
          </nav>
        </aside>

        <div className="admin-content">
          <header className="admin-topbar px-3 px-lg-4 py-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-light d-lg-none" onClick={() => setSidebarOpen(true)}>☰</button>
              <div>
                <div className="fw-semibold">Welcome back</div>
                <div className="small text-muted">Premium property operations studio</div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-outline-secondary btn-sm">🔔 3</button>
              <button className="btn btn-outline-secondary btn-sm">Profile</button>
            </div>
          </header>

          <div className="p-3 p-lg-4">
            <Routes>
              <Route path="" element={<Dashboard properties={data.properties} buyerLeads={data.buyerLeads} sellerLeads={data.sellerLeads} users={data.users} enquiries={data.enquiries} notifications={data.notifications} />} />
              <Route path="properties" element={<PropertiesPage properties={data.properties} setProperties={(updater) => setData((current) => ({ ...current, properties: typeof updater === 'function' ? updater(current.properties) : updater }))} setModalState={setModalState} />} />
              <Route path="add-property" element={<div className="card table-card"><div className="card-body"><h4 className="fw-bold mb-3">Add Property</h4><p className="text-muted">Use the property management form below to create new listings.</p><button className="btn btn-primary" onClick={openCreate}>Create Property</button></div></div>} />
              <Route path="buyer-leads" element={<BuyerLeadsPage buyerLeads={data.buyerLeads} setBuyerLeads={(updater) => setData((current) => ({ ...current, buyerLeads: typeof updater === 'function' ? updater(current.buyerLeads) : updater }))} />} />
              <Route path="seller-leads" element={<SellerLeadsPage sellerLeads={data.sellerLeads} setSellerLeads={(updater) => setData((current) => ({ ...current, sellerLeads: typeof updater === 'function' ? updater(current.sellerLeads) : updater }))} />} />
              <Route path="users" element={<UsersPage users={data.users} setUsers={(updater) => setData((current) => ({ ...current, users: typeof updater === 'function' ? updater(current.users) : updater }))} />} />
              <Route path="enquiries" element={<EnquiriesPage enquiries={data.enquiries} setEnquiries={(updater) => setData((current) => ({ ...current, enquiries: typeof updater === 'function' ? updater(current.enquiries) : updater }))} />} />
              <Route path="categories" element={<CategoriesPage categories={data.categories} setCategories={(updater) => setData((current) => ({ ...current, categories: typeof updater === 'function' ? updater(current.categories) : updater }))} />} />
              <Route path="locations" element={<LocationsPage locations={data.locations} setLocations={(updater) => setData((current) => ({ ...current, locations: typeof updater === 'function' ? updater(current.locations) : updater }))} />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="notifications" element={<NotificationsPage notifications={data.notifications} />} />
              <Route path="settings" element={<SettingsPage settings={data.settings} setSettings={(value) => setData((current) => ({ ...current, settings: value }))} />} />
              <Route path="profile" element={<ProfilePage settings={data.settings} />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </div>
        </div>
      </div>

      {modalState ? (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(2,6,23,0.65)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">{draft?.id ? 'Edit Property' : 'Add Property'}</h5>
                <button className="btn-close" onClick={() => { setModalState(null); setDraft(null); }} />
              </div>
              <div className="modal-body p-4">
                <form onSubmit={saveProperty}>
                  <div className="row g-3">
                    <div className="col-12 col-lg-8">
                      <div className="row g-3">
                        <div className="col-12"><label className="form-label">Property Title</label><input className="form-control input-glow" value={draft?.title || ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required /></div>
                        <div className="col-12"><label className="form-label">Description</label><textarea className="form-control input-glow" rows="3" value={draft?.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
                        <div className="col-12 col-md-6"><label className="form-label">Category</label><select className="form-select input-glow" value={draft?.category || 'Apartment'} onChange={(e) => setDraft({ ...draft, category: e.target.value })}><option>Apartment</option><option>Villa</option><option>Plot</option><option>Commercial</option><option>Office</option></select></div>
                        <div className="col-12 col-md-6"><label className="form-label">Property Type</label><input className="form-control input-glow" value={draft?.propertyType || ''} onChange={(e) => setDraft({ ...draft, propertyType: e.target.value })} /></div>
                        <div className="col-12 col-md-6"><label className="form-label">Purpose</label><input className="form-control input-glow" value={draft?.purpose || ''} onChange={(e) => setDraft({ ...draft, purpose: e.target.value })} /></div>
                        <div className="col-12 col-md-6"><label className="form-label">Price</label><input className="form-control input-glow" type="number" value={draft?.price || ''} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} /></div>
                        <div className="col-12 col-md-6"><label className="form-label">Area</label><input className="form-control input-glow" value={draft?.area || ''} onChange={(e) => setDraft({ ...draft, area: e.target.value })} /></div>
                        <div className="col-12 col-md-6"><label className="form-label">Bedrooms</label><input className="form-control input-glow" value={draft?.bedrooms || ''} onChange={(e) => setDraft({ ...draft, bedrooms: e.target.value })} /></div>
                        <div className="col-12 col-md-6"><label className="form-label">Bathrooms</label><input className="form-control input-glow" value={draft?.bathrooms || ''} onChange={(e) => setDraft({ ...draft, bathrooms: e.target.value })} /></div>
                        <div className="col-12 col-md-6"><label className="form-label">Balcony</label><input className="form-control input-glow" value={draft?.balcony || ''} onChange={(e) => setDraft({ ...draft, balcony: e.target.value })} /></div>
                        <div className="col-12 col-md-6"><label className="form-label">Parking</label><input className="form-control input-glow" value={draft?.parking || ''} onChange={(e) => setDraft({ ...draft, parking: e.target.value })} /></div>
                        <div className="col-12 col-md-6"><label className="form-label">Floor</label><input className="form-control input-glow" value={draft?.floor || ''} onChange={(e) => setDraft({ ...draft, floor: e.target.value })} /></div>
                        <div className="col-12 col-md-6"><label className="form-label">Total Floors</label><input className="form-control input-glow" value={draft?.totalFloors || ''} onChange={(e) => setDraft({ ...draft, totalFloors: e.target.value })} /></div>
                        <div className="col-12 col-md-6"><label className="form-label">Facing</label><input className="form-control input-glow" value={draft?.facing || ''} onChange={(e) => setDraft({ ...draft, facing: e.target.value })} /></div>
                        <div className="col-12 col-md-6"><label className="form-label">Furnishing</label><input className="form-control input-glow" value={draft?.furnishing || ''} onChange={(e) => setDraft({ ...draft, furnishing: e.target.value })} /></div>
                        <div className="col-12 col-md-6"><label className="form-label">Construction Age</label><input className="form-control input-glow" value={draft?.constructionAge || ''} onChange={(e) => setDraft({ ...draft, constructionAge: e.target.value })} /></div>
                        <div className="col-12 col-md-6"><label className="form-label">Ready To Move</label><select className="form-select input-glow" value={draft?.readyToMove ? 'true' : 'false'} onChange={(e) => setDraft({ ...draft, readyToMove: e.target.value === 'true' })}><option value="true">Yes</option><option value="false">No</option></select></div>
                        <div className="col-12"><label className="form-label">Amenities</label><input className="form-control input-glow" value={(draft?.amenities || []).join(', ')} onChange={(e) => setDraft({ ...draft, amenities: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} /></div>
                      </div>
                    </div>
                    <div className="col-12 col-lg-4">
                      <div className="row g-3">
                        <div className="col-12"><label className="form-label">Address</label><input className="form-control input-glow" value={draft?.address || ''} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></div>
                        <div className="col-12"><label className="form-label">City</label><input className="form-control input-glow" value={draft?.city || ''} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></div>
                        <div className="col-12"><label className="form-label">State</label><input className="form-control input-glow" value={draft?.state || ''} onChange={(e) => setDraft({ ...draft, state: e.target.value })} /></div>
                        <div className="col-12"><label className="form-label">Pincode</label><input className="form-control input-glow" value={draft?.pincode || ''} onChange={(e) => setDraft({ ...draft, pincode: e.target.value })} /></div>
                        <div className="col-12"><label className="form-label">Google Maps Link</label><input className="form-control input-glow" value={draft?.googleMapsLink || ''} onChange={(e) => setDraft({ ...draft, googleMapsLink: e.target.value })} /></div>
                        <div className="col-12"><label className="form-label">Seller Name</label><input className="form-control input-glow" value={draft?.sellerName || ''} onChange={(e) => setDraft({ ...draft, sellerName: e.target.value })} /></div>
                        <div className="col-12"><label className="form-label">Seller Phone</label><input className="form-control input-glow" value={draft?.sellerPhone || ''} onChange={(e) => setDraft({ ...draft, sellerPhone: e.target.value })} /></div>
                        <div className="col-12"><label className="form-label">Seller Email</label><input className="form-control input-glow" value={draft?.sellerEmail || ''} onChange={(e) => setDraft({ ...draft, sellerEmail: e.target.value })} /></div>
                        <div className="col-12"><label className="form-label">Property Status</label><select className="form-select input-glow" value={draft?.status || 'Available'} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option>Available</option><option>Sold</option><option>Pending</option></select></div>
                        <div className="col-12"><label className="form-check-label">Featured</label><input className="form-check-input ms-2" type="checkbox" checked={draft?.featured || false} onChange={(e) => setDraft({ ...draft, featured: e.target.checked })} /></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 d-flex justify-content-end gap-2">
                    <button className="btn btn-outline-secondary" type="button" onClick={() => { setModalState(null); setDraft(null); }}>Cancel</button>
                    <button className="btn btn-primary" type="submit">Save Property</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminApp() {
  const navigate = useNavigate();
  const [data, setData] = useState(createInitialData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 250);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    writeStorage('broker-streets-properties', data.properties);
    writeStorage('broker-streets-buyer-leads', data.buyerLeads);
    writeStorage('broker-streets-seller-leads', data.sellerLeads);
    writeStorage('broker-streets-users', data.users);
    writeStorage('broker-streets-enquiries', data.enquiries);
    writeStorage('broker-streets-categories', data.categories);
    writeStorage('broker-streets-locations', data.locations);
    writeStorage('broker-streets-notifications', data.notifications);
    writeStorage(ADMIN_SETTINGS_KEY, data.settings);
  }, [data]);

  const logout = () => {
    window.localStorage.removeItem(ADMIN_AUTH_KEY);
    toast.info('Admin logged out');
    navigate('/admin/login');
  };

  if (!ready) {
    return <div className="admin-app d-flex align-items-center justify-content-center"><div className="spinner-border text-primary" role="status" /></div>;
  }

  return (
  <Routes>
    <Route path="login" element={<AdminLogin />} />

    <Route
      path="*"
      element={
        <ProtectedAdminRoute>
          <AdminShell
            data={data}
            setData={setData}
            onLogout={logout}
          />
        </ProtectedAdminRoute>
      }
    />
  </Routes>
);
}
