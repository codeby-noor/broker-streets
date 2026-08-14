import { readStorage, writeStorage, STORAGE_KEYS } from '../utils/storage';

/**
 * ADMIN DEMO DATA + HELPERS
 * =========================
 * Demo fallback data is used ONLY when the real application storage is empty.
 * Every demo record is clearly marked with `isDemo: true` so it can be
 * visually separated from real user data. Demo data is seeded exactly once
 * (guarded by a flag) so it never duplicates on reload.
 */

export const ADMIN_DEMO_FLAG = 'broker-streets-admin-demo-seeded';

export const ADMIN_NAMES = {
    '9876543210': 'Super Admin',
    '9123456780': 'Admin 1',
    '9988776655': 'Admin 2',
};

const DEMO_IMAGE = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80';

export const ADMIN_DEMO_PROPERTIES = [
    {
        id: 'DEMO-PROP-1001',
        title: 'Agricultural Land in Bardoli',
        name: 'Agricultural Land in Bardoli',
        type: 'Agricultural Land',
        propertyType: 'Agricultural Land',
        state: 'Gujarat',
        district: 'Surat',
        subDistrict: 'Bardoli',
        taluka: 'Bardoli',
        village: 'Bardoli',
        location: 'Surat',
        city: 'Surat',
        address: 'Bardoli, Surat, Gujarat',
        price: '₹24 Lakh',
        priceAmount: '2400000',
        priceUnit: 'Vigha',
        landArea: '2 Vigha',
        area: '2 Vigha',
        description: 'Fertile agricultural land with excellent road connectivity and water availability.',
        status: 'Available',
        verified: true,
        image: DEMO_IMAGE,
        gallery: [DEMO_IMAGE],
        images: [DEMO_IMAGE],
        sellerName: 'Rakesh Patel',
        sellerPhone: '9876500005',
        sellerEmail: 'rakesh@example.com',
        ownerName: 'Rakesh Patel',
        ownerMobile: '9876500005',
        ownerEmail: 'rakesh@example.com',
        createdAt: '2026-07-20T09:00:00.000Z',
        updatedAt: '2026-07-20T09:00:00.000Z',
        submittedAt: '2026-07-20T09:00:00.000Z',
        uploadedDate: '2026-07-20T09:00:00.000Z',
        isDemo: true,
    },
    {
        id: 'DEMO-PROP-1002',
        title: 'Non-Agricultural Land in Kamrej',
        name: 'Non-Agricultural Land in Kamrej',
        type: 'Non-Agricultural Land',
        propertyType: 'Non-Agricultural Land',
        state: 'Gujarat',
        district: 'Surat',
        subDistrict: 'Kamrej',
        taluka: 'Kamrej',
        village: 'Kamrej',
        location: 'Surat',
        city: 'Surat',
        address: 'Kamrej, Surat, Gujarat',
        price: '₹32 Lakh',
        priceAmount: '3200000',
        priceUnit: 'Vigha',
        landArea: '1.5 Vigha',
        area: '1.5 Vigha',
        description: 'NA plot near the highway with strong investment potential and easy access.',
        status: 'Available',
        verified: true,
        image: DEMO_IMAGE,
        gallery: [DEMO_IMAGE],
        images: [DEMO_IMAGE],
        sellerName: 'Mehul Shah',
        sellerPhone: '9876500006',
        sellerEmail: 'mehul@example.com',
        ownerName: 'Mehul Shah',
        ownerMobile: '9876500006',
        ownerEmail: 'mehul@example.com',
        createdAt: '2026-07-18T10:30:00.000Z',
        updatedAt: '2026-07-18T10:30:00.000Z',
        submittedAt: '2026-07-18T10:30:00.000Z',
        uploadedDate: '2026-07-18T10:30:00.000Z',
        isDemo: true,
    },
    {
        id: 'DEMO-PROP-1003',
        title: 'Agricultural Land in Gandevi',
        name: 'Agricultural Land in Gandevi',
        type: 'Agricultural Land',
        propertyType: 'Agricultural Land',
        state: 'Gujarat',
        district: 'Navsari',
        subDistrict: 'Gandevi',
        taluka: 'Gandevi',
        village: 'Gandevi',
        location: 'Navsari',
        city: 'Navsari',
        address: 'Gandevi, Navsari, Gujarat',
        price: '₹18 Lakh',
        priceAmount: '1800000',
        priceUnit: 'Vigha',
        landArea: '3 Vigha',
        area: '3 Vigha',
        description: 'Well-watered farmland ideal for sugarcane and seasonal crops.',
        status: 'Sold',
        verified: true,
        image: DEMO_IMAGE,
        gallery: [DEMO_IMAGE],
        images: [DEMO_IMAGE],
        sellerName: 'Jignesh Desai',
        sellerPhone: '9876500007',
        sellerEmail: 'jignesh@example.com',
        ownerName: 'Jignesh Desai',
        ownerMobile: '9876500007',
        ownerEmail: 'jignesh@example.com',
        createdAt: '2026-07-15T08:00:00.000Z',
        updatedAt: '2026-07-15T08:00:00.000Z',
        submittedAt: '2026-07-15T08:00:00.000Z',
        uploadedDate: '2026-07-15T08:00:00.000Z',
        isDemo: true,
    },
    {
        id: 'DEMO-PROP-1004',
        title: 'Non-Agricultural Land in Chikhli',
        name: 'Non-Agricultural Land in Chikhli',
        type: 'Non-Agricultural Land',
        propertyType: 'Non-Agricultural Land',
        state: 'Gujarat',
        district: 'Navsari',
        subDistrict: 'Chikhli',
        taluka: 'Chikhli',
        village: 'Chikhli',
        location: 'Navsari',
        city: 'Navsari',
        address: 'Chikhli, Navsari, Gujarat',
        price: '₹21 Lakh',
        priceAmount: '2100000',
        priceUnit: 'Vigha',
        landArea: '1 Vigha',
        area: '1 Vigha',
        description: 'NA plot with road access, suitable for small commercial or residential use.',
        status: 'Available',
        verified: true,
        image: DEMO_IMAGE,
        gallery: [DEMO_IMAGE],
        images: [DEMO_IMAGE],
        sellerName: 'Priya Shah',
        sellerPhone: '9876500002',
        sellerEmail: 'priya@example.com',
        ownerName: 'Priya Shah',
        ownerMobile: '9876500002',
        ownerEmail: 'priya@example.com',
        createdAt: '2026-07-12T14:00:00.000Z',
        updatedAt: '2026-07-12T14:00:00.000Z',
        submittedAt: '2026-07-12T14:00:00.000Z',
        uploadedDate: '2026-07-12T14:00:00.000Z',
        isDemo: true,
    },
    {
        id: 'DEMO-PROP-1005',
        title: 'Agricultural Land in Bilimora',
        name: 'Agricultural Land in Bilimora',
        type: 'Agricultural Land',
        propertyType: 'Agricultural Land',
        state: 'Gujarat',
        district: 'Navsari',
        subDistrict: 'Gandevi',
        taluka: 'Gandevi',
        village: 'Bilimora',
        location: 'Navsari',
        city: 'Navsari',
        address: 'Bilimora, Navsari, Gujarat',
        price: '₹26 Lakh',
        priceAmount: '2600000',
        priceUnit: 'Vigha',
        landArea: '2.5 Vigha',
        area: '2.5 Vigha',
        description: 'Productive farmland close to Bilimora town with good market access.',
        status: 'Unavailable',
        verified: true,
        image: DEMO_IMAGE,
        gallery: [DEMO_IMAGE],
        images: [DEMO_IMAGE],
        sellerName: 'Mehul Shah',
        sellerPhone: '9876500006',
        sellerEmail: 'mehul@example.com',
        ownerName: 'Mehul Shah',
        ownerMobile: '9876500006',
        ownerEmail: 'mehul@example.com',
        createdAt: '2026-07-10T09:30:00.000Z',
        updatedAt: '2026-07-10T09:30:00.000Z',
        submittedAt: '2026-07-10T09:30:00.000Z',
        uploadedDate: '2026-07-10T09:30:00.000Z',
        isDemo: true,
    },
    {
        id: 'DEMO-PROP-1006',
        title: 'Agricultural Land in Amalsad',
        name: 'Agricultural Land in Amalsad',
        type: 'Agricultural Land',
        propertyType: 'Agricultural Land',
        state: 'Gujarat',
        district: 'Navsari',
        subDistrict: 'Gandevi',
        taluka: 'Gandevi',
        village: 'Amalsad',
        location: 'Navsari',
        city: 'Navsari',
        address: 'Amalsad, Navsari, Gujarat',
        price: '₹15 Lakh',
        priceAmount: '1500000',
        priceUnit: 'Vigha',
        landArea: '2 Vigha',
        area: '2 Vigha',
        description: 'Low-entry agricultural land with strong future appreciation potential.',
        status: 'Available',
        verified: true,
        image: DEMO_IMAGE,
        gallery: [DEMO_IMAGE],
        images: [DEMO_IMAGE],
        sellerName: 'Jignesh Desai',
        sellerPhone: '9876500007',
        sellerEmail: 'jignesh@example.com',
        ownerName: 'Jignesh Desai',
        ownerMobile: '9876500007',
        ownerEmail: 'jignesh@example.com',
        createdAt: '2026-07-08T12:00:00.000Z',
        updatedAt: '2026-07-08T12:00:00.000Z',
        submittedAt: '2026-07-08T12:00:00.000Z',
        uploadedDate: '2026-07-08T12:00:00.000Z',
        isDemo: true,
    },
];

export const ADMIN_DEMO_USERS = [
    { id: 'DEMO-USR-1001', name: 'Rahul Patel', mobile: '9876500001', whatsapp: '', email: 'rahul@example.com', city: 'Surat', state: 'Gujarat', district: 'Surat', subDistrict: '', profileImage: '', createdAt: '2026-07-15T10:00:00.000Z', status: 'Active', isDemo: true },
    { id: 'DEMO-USR-1002', name: 'Priya Shah', mobile: '9876500002', whatsapp: '', email: 'priya@example.com', city: 'Navsari', state: 'Gujarat', district: 'Navsari', subDistrict: '', profileImage: '', createdAt: '2026-07-14T11:00:00.000Z', status: 'Active', isDemo: true },
    { id: 'DEMO-USR-1003', name: 'Amit Desai', mobile: '9876500003', whatsapp: '', email: 'amit@example.com', city: 'Bardoli', state: 'Gujarat', district: 'Surat', subDistrict: 'Bardoli', profileImage: '', createdAt: '2026-07-12T09:00:00.000Z', status: 'Active', isDemo: true },
    { id: 'DEMO-USR-1004', name: 'Neha Joshi', mobile: '9876500004', whatsapp: '', email: 'neha@example.com', city: 'Kamrej', state: 'Gujarat', district: 'Surat', subDistrict: 'Kamrej', profileImage: '', createdAt: '2026-07-10T15:00:00.000Z', status: 'Active', isDemo: true },
    { id: 'DEMO-USR-1005', name: 'Rakesh Patel', mobile: '9876500005', whatsapp: '', email: 'rakesh@example.com', city: 'Gandevi', state: 'Gujarat', district: 'Navsari', subDistrict: 'Gandevi', profileImage: '', createdAt: '2026-07-08T10:30:00.000Z', status: 'Active', isDemo: true },
    { id: 'DEMO-USR-1006', name: 'Mehul Shah', mobile: '9876500006', whatsapp: '', email: 'mehul@example.com', city: 'Chikhli', state: 'Gujarat', district: 'Navsari', subDistrict: 'Chikhli', profileImage: '', createdAt: '2026-07-06T13:00:00.000Z', status: 'Active', isDemo: true },
    { id: 'DEMO-USR-1007', name: 'Jignesh Desai', mobile: '9876500007', whatsapp: '', email: 'jignesh@example.com', city: 'Bilimora', state: 'Gujarat', district: 'Navsari', subDistrict: 'Gandevi', profileImage: '', createdAt: '2026-07-04T16:00:00.000Z', status: 'Active', isDemo: true },
];

export const ADMIN_DEMO_BUYER_LEADS = [
    {
        id: 'DEMO-BL-1001',
        userId: 'DEMO-USR-1001',
        userName: 'Rahul Patel',
        userMobile: '9876500001',
        userEmail: 'rahul@example.com',
        state: 'Gujarat',
        district: 'Surat',
        taluka: 'Bardoli',
        preferredVillages: ['Bardoli', 'Kamrej'],
        propertyType: 'Agricultural Land',
        purpose: 'Investment',
        requirements: 'Looking for 2-3 vigha agricultural land with water source and road access.',
        createdAt: '2026-07-18T11:00:00.000Z',
        isDemo: true,
    },
    {
        id: 'DEMO-BL-1002',
        userId: 'DEMO-USR-1004',
        userName: 'Neha Joshi',
        userMobile: '9876500004',
        userEmail: 'neha@example.com',
        state: 'Gujarat',
        district: 'Navsari',
        taluka: 'Gandevi',
        preferredVillages: ['Gandevi', 'Chikhli'],
        propertyType: 'Non-Agricultural Land',
        purpose: 'Project',
        requirements: 'Need NA plot near Gandevi for a small commercial project.',
        createdAt: '2026-07-16T09:30:00.000Z',
        isDemo: true,
    },
    {
        id: 'DEMO-BL-1003',
        userId: 'DEMO-USR-1003',
        userName: 'Amit Desai',
        userMobile: '9876500003',
        userEmail: 'amit@example.com',
        state: 'Gujarat',
        district: 'Surat',
        taluka: 'Kamrej',
        preferredVillages: ['Kamrej', 'Bardoli'],
        propertyType: 'Agricultural Land',
        purpose: 'Personal Farm',
        requirements: 'Searching for farmland for a personal farm with good soil quality.',
        createdAt: '2026-07-14T14:00:00.000Z',
        isDemo: true,
    },
];

export const ADMIN_DEMO_SELLER_LEADS = [
    {
        id: 'DEMO-SL-1001',
        userId: 'DEMO-USR-1005',
        userName: 'Rakesh Patel',
        userMobile: '9876500005',
        userEmail: 'rakesh@example.com',
        ownerName: 'Rakesh Patel',
        ownerMobile: '9876500005',
        ownerEmail: 'rakesh@example.com',
        state: 'Gujarat',
        district: 'Surat',
        subDistrict: 'Bardoli',
        village: 'Bardoli',
        type: 'Agricultural Land',
        priceUnit: 'Vigha',
        priceAmount: '2400000',
        additionalDetails: '2 vigha fertile land with road access and water source.',
        submittedAt: '2026-07-20T09:00:00.000Z',
        isDemo: true,
    },
    {
        id: 'DEMO-SL-1002',
        userId: 'DEMO-USR-1006',
        userName: 'Mehul Shah',
        userMobile: '9876500006',
        userEmail: 'mehul@example.com',
        ownerName: 'Mehul Shah',
        ownerMobile: '9876500006',
        ownerEmail: 'mehul@example.com',
        state: 'Gujarat',
        district: 'Surat',
        subDistrict: 'Kamrej',
        village: 'Kamrej',
        type: 'Non-Agricultural Land',
        priceUnit: 'Vigha',
        priceAmount: '3200000',
        additionalDetails: 'NA plot near highway with strong investment potential.',
        submittedAt: '2026-07-18T10:30:00.000Z',
        isDemo: true,
    },
];

/**
 * Seed demo data ONLY when the real application storage is empty.
 * Guarded by a flag so it never runs twice or duplicates records.
 */
export function seedAdminDemoData() {
    try {
        if (readStorage(ADMIN_DEMO_FLAG, false)) return;

        const listings = readStorage(STORAGE_KEYS.listings, []);
        if (!Array.isArray(listings) || listings.length === 0) {
            writeStorage(STORAGE_KEYS.listings, ADMIN_DEMO_PROPERTIES);
        }

        const users = readStorage(STORAGE_KEYS.users, []);
        if (!Array.isArray(users) || users.length === 0) {
            writeStorage(STORAGE_KEYS.users, ADMIN_DEMO_USERS);
        }

        const buyerLeads = readStorage(STORAGE_KEYS.buyerLeads, []);
        if (!Array.isArray(buyerLeads) || buyerLeads.length === 0) {
            writeStorage(STORAGE_KEYS.buyerLeads, ADMIN_DEMO_BUYER_LEADS);
        }

        const sellerLeads = readStorage(STORAGE_KEYS.sellerLeads, []);
        if (!Array.isArray(sellerLeads) || sellerLeads.length === 0) {
            writeStorage(STORAGE_KEYS.sellerLeads, ADMIN_DEMO_SELLER_LEADS);
        }

        writeStorage(ADMIN_DEMO_FLAG, true);
    } catch {
        // Never block the admin panel because of demo seeding
    }
}

export function getAdminProperties() {
    const listings = readStorage(STORAGE_KEYS.listings, []);
    return Array.isArray(listings) ? listings : [];
}

export function getAdminUsers() {
    const users = readStorage(STORAGE_KEYS.users, []);
    return Array.isArray(users) ? users : [];
}

export function getAdminBuyerLeads() {
    const leads = readStorage(STORAGE_KEYS.buyerLeads, []);
    return Array.isArray(leads) ? leads : [];
}

export function getAdminSellerLeads() {
    const leads = readStorage(STORAGE_KEYS.sellerLeads, []);
    return Array.isArray(leads) ? leads : [];
}

/**
 * Derive a user's role from their activity across the app.
 * Adapts to the existing data structure instead of creating duplicate records.
 */
export function deriveUserRole(user, buyerLeads, sellerLeads, listings) {
    const mobile = String(user.mobile || '').replace(/\D/g, '');
    const id = String(user.id || '');

    const isBuyer = buyerLeads.some((lead) => {
        const leadMobile = String(lead.userMobile || '').replace(/\D/g, '');
        const leadUserId = String(lead.userId || '');
        return (mobile && leadMobile === mobile) || (id && leadUserId === id);
    });

    const isSeller = sellerLeads.some((lead) => {
        const leadMobile = String(lead.userMobile || lead.ownerMobile || '').replace(/\D/g, '');
        const leadUserId = String(lead.userId || '');
        return (mobile && leadMobile === mobile) || (id && leadUserId === id);
    }) || listings.some((listing) => {
        const listingMobile = String(listing.sellerPhone || listing.ownerMobile || '').replace(/\D/g, '');
        const listingUserId = String(listing.userId || '');
        return (mobile && listingMobile === mobile) || (id && listingUserId === id);
    });

    if (isBuyer && isSeller) return 'Buyer & Seller';
    if (isBuyer) return 'Buyer';
    if (isSeller) return 'Seller';
    return 'Buyer';
}

export function maskMobile(mobile) {
    const digits = String(mobile || '').replace(/\D/g, '');
    if (digits.length !== 10) return mobile || '—';
    return `${digits.slice(0, 3)}******${digits.slice(-2)}`;
}

export function formatPrice(value) {
    if (value === undefined || value === null || value === '') return '—';
    const num = Number(String(value).replace(/[^\d]/g, ''));
    if (!num) return String(value);
    return `₹${num.toLocaleString('en-IN')}`;
}

export function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function getInitials(name) {
    return String(name || '?')
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';
}