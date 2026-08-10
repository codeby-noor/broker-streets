# BACKEND_SPEC.md — Broker Streets Backend Living Specification

> **Version:** 1.0.0  
> **Last Updated:** 2026-08-07  
> **Status:** Phase 0 — Architecture Only (no implementation code)  
> **Frontend Commit:** Pre-monorepo baseline  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Backend Folder Structure](#2-backend-folder-structure)
3. [Technology Stack](#3-technology-stack)
4. [Environment Variables](#4-environment-variables)
5. [Response & Error Formats](#5-response--error-formats)
6. [Authentication Specification](#6-authentication-specification)
7. [MongoDB Schema Specification](#7-mongodb-schema-specification)
8. [API Specification](#8-api-specification)
9. [Validation Specification](#9-validation-specification)
10. [Upload Architecture](#10-upload-architecture)
11. [Middleware Specification](#11-middleware-specification)
12. [Admin Permissions](#12-admin-permissions)
13. [Security Checklist](#13-security-checklist)
14. [Deployment Architecture](#14-deployment-architecture)
15. [Coding Conventions](#15-coding-conventions)
16. [Implementation Order](#16-implementation-order)

---

## 1. Overview

Broker Streets is a Gujarat-focused agricultural and non-agricultural land marketplace. The frontend is a React 18 + Vite SPA that currently stores all data in `localStorage`. This specification defines the Node.js/Express backend that will replace localStorage with a MongoDB-backed API.

### Core User Flows (derived from frontend)

| Flow | Frontend Source | Description |
|---|---|---|
| **Registration** | `RegisterPage.jsx` | Name, mobile, email, city → creates user in localStorage, sends OTP |
| **Login** | `LoginPage.jsx` | Mobile number → looks up user, sends OTP |
| **OTP Verification** | `OTPPage.jsx` | 6-digit OTP → verifies, logs in user |
| **Buyer Form** | `BuyerForm.jsx` | State/district/taluka/villages/type/purpose/voice → creates buyer lead |
| **Seller Form** | `SellerForm.jsx` | Location/type/price/images/videos/PDF/map → creates listing + seller lead |
| **Browse Properties** | `BuyPage.jsx` | Filterable/sortable/paginated property grid |
| **Property Details** | `PropertyDetailsPage.jsx` | Full property view with gallery, docs, map, seller info |
| **Seller Dashboard** | `SellerDashboard.jsx` | CRUD on own listings |
| **Profile Dashboard** | `ProfileDashboard.jsx` | Profile edit, saved properties, recently viewed, notifications, buyer requirements |
| **Admin Panel** | `AdminApp.jsx` | Full CRM: properties, buyers, sellers, users, enquiries, categories, locations, notifications, settings |

---

## 2. Backend Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js                   # MongoDB connection (mongoose)
│   │   ├── env.js                  # Environment variable loader & validator
│   │   └── cors.js                 # CORS configuration
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Listing.js
│   │   ├── BuyerLead.js
│   │   ├── SellerLead.js
│   │   ├── Notification.js
│   │   ├── SavedProperty.js
│   │   ├── RecentlyViewed.js
│   │   ├── Enquiry.js
│   │   ├── Category.js
│   │   ├── Location.js
│   │   ├── AdminUser.js
│   │   ├── AdminSettings.js
│   │   └── OtpSession.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js          # Register, login, OTP, logout
│   │   ├── user.routes.js          # Profile CRUD, password change
│   │   ├── listing.routes.js       # Property listings CRUD
│   │   ├── buyerLead.routes.js     # Buyer requirements CRUD
│   │   ├── sellerLead.routes.js    # Seller submissions
│   │   ├── savedProperty.routes.js # Bookmark management
│   │   ├── recentlyViewed.routes.js# View history
│   │   ├── notification.routes.js  # Notification management
│   │   ├── location.routes.js      # Gujarat location data
│   │   ├── upload.routes.js        # File upload endpoints
│   │   └── admin/
│   │       ├── admin.auth.routes.js
│   │       ├── admin.dashboard.routes.js
│   │       ├── admin.property.routes.js
│   │       ├── admin.buyerLead.routes.js
│   │       ├── admin.sellerLead.routes.js
│   │       ├── admin.user.routes.js
│   │       ├── admin.enquiry.routes.js
│   │       ├── admin.category.routes.js
│   │       ├── admin.location.routes.js
│   │       ├── admin.notification.routes.js
│   │       ├── admin.settings.routes.js
│   │       └── admin.report.routes.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── listing.controller.js
│   │   ├── buyerLead.controller.js
│   │   ├── sellerLead.controller.js
│   │   ├── savedProperty.controller.js
│   │   ├── recentlyViewed.controller.js
│   │   ├── notification.controller.js
│   │   ├── location.controller.js
│   │   ├── upload.controller.js
│   │   └── admin/
│   │       ├── admin.auth.controller.js
│   │       ├── admin.dashboard.controller.js
│   │       ├── admin.property.controller.js
│   │       ├── admin.buyerLead.controller.js
│   │       ├── admin.sellerLead.controller.js
│   │       ├── admin.user.controller.js
│   │       ├── admin.enquiry.controller.js
│   │       ├── admin.category.controller.js
│   │       ├── admin.location.controller.js
│   │       ├── admin.notification.controller.js
│   │       ├── admin.settings.controller.js
│   │       └── admin.report.controller.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT verification
│   │   ├── admin.middleware.js      # Admin role check
│   │   ├── validate.middleware.js   # Request body validation
│   │   ├── upload.middleware.js     # Multer configuration
│   │   ├── rateLimiter.middleware.js# Rate limiting
│   │   └── errorHandler.middleware.js # Global error handler
│   │
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── user.validator.js
│   │   ├── listing.validator.js
│   │   ├── buyerLead.validator.js
│   │   ├── sellerLead.validator.js
│   │   └── enquiry.validator.js
│   │
│   ├── services/
│   │   ├── otp.service.js           # OTP generation, send, verify
│   │   ├── jwt.service.js           # Token sign/verify/refresh
│   │   ├── upload.service.js        # File storage abstraction
│   │   └── notification.service.js  # In-app notification creation
│   │
│   ├── utils/
│   │   ├── asyncHandler.js          # try/catch wrapper for controllers
│   │   ├── ApiError.js              # Custom error class
│   │   ├── ApiResponse.js           # Standardized response builder
│   │   └── constants.js             # Enums, magic strings
│   │
│   ├── data/
│   │   └── gujarat-villages.json    # Copied from frontend (location seed data)
│   │
│   └── app.js                       # Express app setup
│
├── server.js                        # Entry point (starts HTTP server)
├── package.json
├── .env.example
└── .gitignore
```

---

## 3. Technology Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Runtime | Node.js | ≥18 LTS | Long-term support |
| Framework | Express.js | ^4.18 | Industry standard, large ecosystem |
| Database | MongoDB | ≥6.0 | Document model matches frontend data shapes |
| ODM | Mongoose | ^8.0 | Schema validation, population, middleware |
| Authentication | JSON Web Token (jsonwebtoken) | ^9.0 | Stateless auth tokens |
| Validation | Joi | ^17.0 | Schema-based request validation |
| File Upload | Multer | ^1.4 | Multipart form handling |
| File Storage | Cloudinary / Local disk | — | Abstracted via service layer |
| Security | helmet, cors, express-rate-limit | — | HTTP hardening |
| OTP (dev) | Client-generated mock | — | Same as current frontend behavior |
| OTP (prod) | MSG91 / Twilio | — | SMS gateway integration |
| Logging | morgan + winston | — | Request + application logging |
| Environment | dotenv | ^16.0 | `.env` file loading |

---

## 4. Environment Variables

```env
# ──── Server ────
NODE_ENV=development
PORT=5000

# ──── Database ────
MONGODB_URI=mongodb://localhost:27017/broker-streets

# ──── JWT ────
JWT_SECRET=<random-256-bit-hex>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<random-256-bit-hex>
JWT_REFRESH_EXPIRES_IN=30d

# ──── OTP ────
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5
OTP_LOCK_MINUTES=10
ENABLE_REAL_SMS=false

# ──── SMS Gateway (production only) ────
SMS_PROVIDER=msg91
SMS_API_KEY=
SMS_SENDER_ID=BRKRST
SMS_TEMPLATE_ID=

# ──── File Upload ────
UPLOAD_PROVIDER=local
UPLOAD_MAX_IMAGE_SIZE_MB=5
UPLOAD_MAX_VIDEO_SIZE_MB=50
UPLOAD_MAX_DOCUMENT_SIZE_MB=10
UPLOAD_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
UPLOAD_ALLOWED_VIDEO_TYPES=video/mp4,video/webm
UPLOAD_ALLOWED_DOCUMENT_TYPES=application/pdf,image/jpeg,image/png,image/webp

# ──── Cloudinary (if UPLOAD_PROVIDER=cloudinary) ────
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ──── Admin ────
ADMIN_DEFAULT_EMAIL=admin@brokerstreets.com
ADMIN_DEFAULT_PASSWORD=<bcrypt-hashed>

# ──── CORS ────
CORS_ORIGIN=http://127.0.0.1:4173

# ──── Pexels (optional, frontend-only) ────
VITE_PEXELS_API_KEY=<key>
```

---

## 5. Response & Error Formats

### Success Response Envelope

```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

`meta` is only included for paginated list endpoints.

### Error Response Envelope

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [
    {
      "field": "mobile",
      "message": "Enter a valid 10-digit mobile number"
    }
  ],
  "stack": "Error stack trace (development only)"
}
```

### HTTP Status Code Usage

| Code | Usage |
|---|---|
| `200` | Success (GET, PUT, PATCH) |
| `201` | Created (POST) |
| `204` | No Content (DELETE) |
| `400` | Validation error / bad request |
| `401` | Unauthenticated |
| `403` | Forbidden (wrong role) |
| `404` | Resource not found |
| `409` | Conflict (e.g., duplicate mobile) |
| `413` | File too large |
| `415` | Unsupported media type |
| `422` | Unprocessable entity |
| `429` | Rate limited |
| `500` | Internal server error |

---

## 6. Authentication Specification

### 6.1 User Authentication (OTP-based)

The frontend implements a passwordless OTP flow. The backend must replicate this:

```
┌──────────┐    POST /api/auth/register     ┌──────────┐
│  Client  │ ─────────────────────────────▶  │  Server  │
│          │    { name, mobile, email, city } │          │
│          │ ◀───────────────────────────────  │          │
│          │    { success, message }          │          │
│          │                                  │          │
│          │    POST /api/auth/send-otp       │          │
│          │ ─────────────────────────────▶  │          │
│          │    { mobile }                   │          │
│          │ ◀───────────────────────────────  │          │
│          │    { success, expiresAt }        │          │
│          │                                  │          │
│          │    POST /api/auth/verify-otp     │          │
│          │ ─────────────────────────────▶  │          │
│          │    { mobile, otp }              │          │
│          │ ◀───────────────────────────────  │          │
│          │    { success, token,             │          │
│          │      refreshToken, user }       │          │
└──────────┘                                  └──────────┘
```

**Token Strategy:**
- `accessToken` — short-lived JWT (7d), sent in `Authorization: Bearer <token>` header
- `refreshToken` — long-lived JWT (30d), stored securely, used to obtain new access tokens
- Both tokens embed: `{ userId, mobile, role }`

**OTP Rules (from frontend `otpService.js`):**
- OTP length: 6 digits
- TTL: 5 minutes
- Max attempts: 5
- Lockout: 10 minutes after max attempts
- In development: OTP is returned in the response body and logged to console
- In production: OTP is sent via SMS gateway only

### 6.2 Admin Authentication

The current admin login accepts any email with `@` and password ≥ 4 chars. The backend will enforce:

- Fixed admin credentials via environment variables (`ADMIN_DEFAULT_EMAIL`, `ADMIN_DEFAULT_PASSWORD`)
- Bcrypt password hashing
- Separate `AdminUser` model to support multiple admins in the future
- Admin JWT includes `role: 'admin'`
- All `/api/admin/*` routes require admin middleware

---

## 7. MongoDB Schema Specification

### 7.1 User

**Source:** `RegisterPage.jsx` (L35-45), `useUserStore.js` (L4-15), `ProfileDashboard.jsx` (L69-81)

```
Collection: users
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | |
| `name` | String | ✅ | — | Full name |
| `mobile` | String | ✅ | — | Unique, 10 digits, indexed |
| `whatsapp` | String | — | `''` | |
| `email` | String | — | `''` | Optional, validated if provided |
| `city` | String | ✅ | — | |
| `state` | String | — | `'Gujarat'` | |
| `district` | String | — | `''` | |
| `subDistrict` | String | — | `''` | |
| `address` | String | — | `''` | From ProfileDashboard settings |
| `profileImage` | String | — | `''` | URL to uploaded profile image |
| `role` | String | — | `'user'` | Enum: `['user']` |
| `isActive` | Boolean | — | `true` | |
| `buyerFormSubmitted` | Boolean | — | `false` | Replaces localStorage flag |
| `sellerFormSubmitted` | Boolean | — | `false` | Replaces localStorage flag |
| `createdAt` | Date | auto | `Date.now` | |
| `updatedAt` | Date | auto | `Date.now` | |

**Indexes:** `{ mobile: 1 }` (unique), `{ email: 1 }` (sparse)

---

### 7.2 OtpSession

**Source:** `otpService.js` (L97-148, L150-222)

```
Collection: otpSessions
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | |
| `mobile` | String | ✅ | — | Indexed |
| `otp` | String | ✅ | — | Hashed in production |
| `expiresAt` | Date | ✅ | — | TTL index for auto-cleanup |
| `used` | Boolean | — | `false` | |
| `attempts` | Number | — | `0` | |
| `lockedUntil` | Date | — | `null` | |
| `createdAt` | Date | auto | `Date.now` | |

**Indexes:** `{ mobile: 1 }`, `{ expiresAt: 1 }` (TTL: 0 — auto-deletes expired docs)

---

### 7.3 Listing (Property)

**Source:** `SellerForm.jsx` (L83-137), `sampleProperties` in `data.js`, `AdminApp.jsx` seed data

```
Collection: listings
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | |
| `title` | String | ✅ | — | Auto-generated: `"${type} in ${village/taluka/district}"` |
| `type` | String | ✅ | — | Enum: `['Agricultural Land', 'Non-Agricultural Land']` |
| `propertyType` | String | — | — | Same as `type` (for compatibility) |
| `state` | String | — | `'Gujarat'` | |
| `district` | String | ✅ | — | |
| `subDistrict` | String | — | `''` | Taluka |
| `village` | String | — | `''` | |
| `address` | String | — | — | Computed: village, taluka, district, Gujarat |
| `city` | String | — | — | Alias for district |
| `location` | String | — | — | Alias for district |
| `priceAmount` | Number | — | `0` | Raw numeric price |
| `priceUnit` | String | — | `''` | Enum: `['Vigha', 'Sq.Yard (Var)', 'Sq.Ft', '']` |
| `price` | String | — | — | Formatted display price: `"₹1,25,000"` |
| `landArea` | String | — | — | Free text: `"4 Acres"`, `"540 sq yd"` |
| `mapLink` | String | — | `''` | Google Maps URL |
| `additionalDetails` | String | — | `''` | Description |
| `description` | String | — | — | Same as additionalDetails |
| `images` | [String] | — | `[]` | Array of uploaded image URLs |
| `videos` | [String] | — | `[]` | Array of uploaded video URLs |
| `propertyDocument` | Object | — | `null` | `{ name, url, type, size }` — 7/12 document |
| `status` | String | — | `'Available'` | Enum: `['Available', 'Pending', 'Sold']` |
| `verified` | Boolean | — | `false` | Set by admin |
| `featured` | Boolean | — | `false` | Set by admin |
| `userId` | ObjectId | ✅ | — | Ref: `User` — the seller |
| `ownerName` | String | — | — | Denormalized from user |
| `ownerMobile` | String | — | — | Denormalized from user |
| `ownerEmail` | String | — | — | Denormalized from user |
| `createdAt` | Date | auto | `Date.now` | |
| `updatedAt` | Date | auto | `Date.now` | |

**Indexes:** `{ userId: 1 }`, `{ district: 1, type: 1 }`, `{ status: 1 }`, `{ createdAt: -1 }`

---

### 7.4 BuyerLead

**Source:** `BuyerForm.jsx` (L155-166)

```
Collection: buyerLeads
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | |
| `userId` | ObjectId | ✅ | — | Ref: `User` |
| `userName` | String | — | — | Denormalized |
| `userMobile` | String | — | — | Denormalized |
| `userEmail` | String | — | — | Denormalized |
| `state` | String | — | `'Gujarat'` | |
| `district` | String | ✅ | — | |
| `taluka` | String | ✅ | — | |
| `preferredVillages` | [String] | ✅ | `[]` | Min 2 villages |
| `propertyType` | String | ✅ | — | Enum: `['Agricultural Land', 'Non-Agricultural Land']` |
| `purpose` | String | ✅ | — | Enum: `['Investment', 'Project', 'Personal Farm', 'Other']` |
| `requirements` | String | — | `''` | Free-text additional requirements |
| `voiceRecording` | String | — | `''` | URL to uploaded audio file |
| `status` | String | — | `'New'` | Enum: `['New', 'Hot', 'Contacted', 'Closed']` |
| `createdAt` | Date | auto | `Date.now` | |
| `updatedAt` | Date | auto | `Date.now` | |

**Indexes:** `{ userId: 1 }`, `{ district: 1 }`, `{ createdAt: -1 }`

---

### 7.5 SellerLead

**Source:** `SellerForm.jsx` (L83-93)

```
Collection: sellerLeads
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | |
| `listingId` | ObjectId | — | — | Ref: `Listing` — created simultaneously |
| `userId` | ObjectId | ✅ | — | Ref: `User` |
| `userName` | String | — | — | |
| `userMobile` | String | — | — | |
| `userEmail` | String | — | — | |
| `state` | String | — | `'Gujarat'` | |
| `district` | String | ✅ | — | |
| `subDistrict` | String | — | — | |
| `village` | String | — | — | |
| `type` | String | ✅ | — | Property type |
| `priceUnit` | String | — | — | |
| `priceAmount` | String | — | — | |
| `mapLink` | String | — | — | |
| `additionalDetails` | String | — | — | |
| `propertyImages` | [Object] | — | `[]` | `{ name, type, size }` metadata |
| `propertyVideos` | [Object] | — | `[]` | `{ name, type, size }` metadata |
| `propertyDocument` | Object | — | `null` | `{ name, type, size }` metadata |
| `status` | String | — | `'New'` | Enum: `['New', 'Reviewed', 'Approved', 'Rejected']` |
| `submittedAt` | Date | auto | `Date.now` | |

**Indexes:** `{ userId: 1 }`, `{ submittedAt: -1 }`

---

### 7.6 SavedProperty

**Source:** `storage.js` (L109-141)

```
Collection: savedProperties
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | |
| `userId` | ObjectId | ✅ | — | Ref: `User` |
| `listingId` | ObjectId | ✅ | — | Ref: `Listing` |
| `savedAt` | Date | auto | `Date.now` | |

**Indexes:** `{ userId: 1, listingId: 1 }` (unique compound)

---

### 7.7 RecentlyViewed

**Source:** `storage.js` (L143-156)

```
Collection: recentlyViewed
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | |
| `userId` | ObjectId | ✅ | — | Ref: `User` |
| `listingId` | ObjectId | ✅ | — | Ref: `Listing` |
| `viewedAt` | Date | auto | `Date.now` | |

**Indexes:** `{ userId: 1, viewedAt: -1 }`, max 20 per user (enforced in controller)

---

### 7.8 Notification

**Source:** `storage.js` (L206-215), `BuyerForm.jsx` (L169-175)

```
Collection: notifications
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | |
| `userId` | ObjectId | — | — | Ref: `User` (null for admin-global) |
| `type` | String | ✅ | — | e.g. `'Requirement submitted'`, `'Property Approved'` |
| `message` | String | ✅ | — | |
| `category` | String | — | `'general'` | Enum: `['buyer', 'seller', 'admin', 'general']` |
| `read` | Boolean | — | `false` | |
| `createdAt` | Date | auto | `Date.now` | |

**Indexes:** `{ userId: 1, read: 1, createdAt: -1 }`

---

### 7.9 Enquiry

**Source:** `AdminApp.jsx` seed data (L128-130)

```
Collection: enquiries
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | |
| `buyerId` | ObjectId | — | — | Ref: `User` |
| `sellerId` | ObjectId | — | — | Ref: `User` |
| `listingId` | ObjectId | — | — | Ref: `Listing` |
| `buyerName` | String | ✅ | — | |
| `sellerName` | String | — | — | |
| `propertyTitle` | String | — | — | |
| `message` | String | ✅ | — | |
| `phone` | String | — | — | |
| `email` | String | — | — | |
| `status` | String | — | `'Pending'` | Enum: `['Pending', 'Replied', 'Closed']` |
| `createdAt` | Date | auto | `Date.now` | |

**Indexes:** `{ buyerId: 1 }`, `{ sellerId: 1 }`, `{ listingId: 1 }`

---

### 7.10 Category

**Source:** `AdminApp.jsx` (L132, L628-650)

```
Collection: categories
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | |
| `name` | String | ✅ | — | Unique |
| `isActive` | Boolean | — | `true` | |
| `createdAt` | Date | auto | `Date.now` | |

**Indexes:** `{ name: 1 }` (unique)

---

### 7.11 Location

**Source:** `AdminApp.jsx` (L133), `locationData.js`, `gujarat-villages.json`

```
Collection: locations
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | |
| `state` | String | ✅ | — | |
| `cities` | [String] | — | `[]` | |
| `areas` | [String] | — | `[]` | |
| `createdAt` | Date | auto | `Date.now` | |

> **Note:** The cascading district/taluka/village data from `gujarat-villages.json` is served from a static JSON endpoint, not this model. This model is for the admin-managed location configuration.

---

### 7.12 AdminUser

**Source:** `AdminApp.jsx` (L158-212)

```
Collection: adminUsers
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | |
| `email` | String | ✅ | — | Unique |
| `password` | String | ✅ | — | Bcrypt hashed |
| `name` | String | — | `'Admin'` | |
| `role` | String | — | `'admin'` | Enum: `['admin', 'superadmin']` |
| `isActive` | Boolean | — | `true` | |
| `lastLogin` | Date | — | — | |
| `createdAt` | Date | auto | `Date.now` | |

**Indexes:** `{ email: 1 }` (unique)

---

### 7.13 AdminSettings

**Source:** `AdminApp.jsx` (L11-19, L705-729)

```
Collection: adminSettings
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | Singleton document |
| `siteName` | String | — | `'Broker Streets'` | |
| `contactEmail` | String | — | `'hello@brokerstreets.com'` | |
| `phone` | String | — | `'+91 98765 43210'` | |
| `address` | String | — | `'Ahmedabad, Gujarat'` | |
| `primaryColor` | String | — | `'#2563eb'` | |
| `secondaryColor` | String | — | `'#0f172a'` | |
| `footerText` | String | — | — | |
| `updatedAt` | Date | auto | `Date.now` | |

---

## 8. API Specification

### 8.1 Authentication Endpoints

| Method | Path | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | `{ name, mobile, email?, city }` | `{ success, message, user: { id, name, mobile } }` | Creates user, sends OTP |
| `POST` | `/api/auth/send-otp` | ❌ | `{ mobile }` | `{ success, expiresAt, otp? }` | `otp` only in dev mode |
| `POST` | `/api/auth/verify-otp` | ❌ | `{ mobile, otp }` | `{ success, token, refreshToken, user }` | Returns JWT pair + full user |
| `POST` | `/api/auth/resend-otp` | ❌ | `{ mobile }` | `{ success, expiresAt }` | Alias for send-otp |
| `POST` | `/api/auth/refresh-token` | ❌ | `{ refreshToken }` | `{ success, token, refreshToken }` | Issues new token pair |
| `POST` | `/api/auth/logout` | ✅ | — | `{ success }` | Invalidates refresh token |

---

### 8.2 User Endpoints

| Method | Path | Auth | Request Body / Query | Response | Notes |
|---|---|---|---|---|---|
| `GET` | `/api/users/me` | ✅ | — | `{ user }` | Current authenticated user profile |
| `PUT` | `/api/users/me` | ✅ | `{ name?, email?, whatsapp?, district?, subDistrict?, address? }` | `{ user }` | Update profile |
| `PUT` | `/api/users/me/profile-image` | ✅ | `multipart: profileImage` | `{ user }` | Upload profile photo |
| `PUT` | `/api/users/me/password` | ✅ | `{ currentPassword, newPassword }` | `{ success }` | Change password (future) |

---

### 8.3 Listing Endpoints

| Method | Path | Auth | Request Body / Query | Response | Notes |
|---|---|---|---|---|---|
| `GET` | `/api/listings` | ✅ | Query: `district, taluka, village, type, minPrice, maxPrice, landArea, status, sort, page, limit, search` | `{ data: [Listing], meta }` | Paginated, filtered |
| `GET` | `/api/listings/:id` | ✅ | — | `{ data: Listing }` | Full property details |
| `POST` | `/api/listings` | ✅ | `multipart: { state, district, subDistrict, village, type, priceUnit, priceAmount, mapLink, additionalDetails, images[], videos[], document }` | `{ data: Listing }` | Create listing + seller lead |
| `PUT` | `/api/listings/:id` | ✅ | Same as POST | `{ data: Listing }` | Owner only |
| `PATCH` | `/api/listings/:id/status` | ✅ | `{ status }` | `{ data: Listing }` | Toggle Available/Sold (owner) |
| `DELETE` | `/api/listings/:id` | ✅ | — | `204` | Owner only |
| `POST` | `/api/listings/:id/duplicate` | ✅ | — | `{ data: Listing }` | Duplicate listing (owner) |
| `GET` | `/api/listings/:id/similar` | ✅ | — | `{ data: [Listing] }` | Same type/district, max 4 |

---

### 8.4 Buyer Lead Endpoints

| Method | Path | Auth | Request Body / Query | Response | Notes |
|---|---|---|---|---|---|
| `GET` | `/api/buyer-leads` | ✅ | Query: `district, propertyType, purpose, sort, page, limit, search` | `{ data: [BuyerLead], meta }` | Paginated |
| `GET` | `/api/buyer-leads/me` | ✅ | — | `{ data: [BuyerLead] }` | Current user's buyer leads |
| `GET` | `/api/buyer-leads/:id` | ✅ | — | `{ data: BuyerLead }` | |
| `POST` | `/api/buyer-leads` | ✅ | `multipart: { state, district, taluka, preferredVillages[], propertyType, purpose, requirements?, voiceRecording? }` | `{ data: BuyerLead }` | Creates buyer lead + notification |
| `PUT` | `/api/buyer-leads/:id` | ✅ | Same as POST | `{ data: BuyerLead }` | Owner only |
| `DELETE` | `/api/buyer-leads/:id` | ✅ | — | `204` | Owner only |

---

### 8.5 Saved Properties Endpoints

| Method | Path | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| `GET` | `/api/saved-properties` | ✅ | — | `{ data: [Listing] }` | Populated listing data |
| `POST` | `/api/saved-properties` | ✅ | `{ listingId }` | `{ data: SavedProperty }` | Toggle save/unsave |
| `DELETE` | `/api/saved-properties/:listingId` | ✅ | — | `204` | Remove bookmark |
| `GET` | `/api/saved-properties/:listingId/check` | ✅ | — | `{ saved: boolean }` | Check if saved |

---

### 8.6 Recently Viewed Endpoints

| Method | Path | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| `GET` | `/api/recently-viewed` | ✅ | — | `{ data: [{ listing, viewedAt }] }` | Max 20, newest first |
| `POST` | `/api/recently-viewed` | ✅ | `{ listingId }` | `{ success }` | Add/update view timestamp |
| `DELETE` | `/api/recently-viewed/:listingId` | ✅ | — | `204` | Remove from history |

---

### 8.7 Notification Endpoints

| Method | Path | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| `GET` | `/api/notifications` | ✅ | — | `{ data: [Notification] }` | Current user's notifications |
| `PATCH` | `/api/notifications/:id/read` | ✅ | — | `{ data: Notification }` | Mark as read |
| `PATCH` | `/api/notifications/read-all` | ✅ | — | `{ success }` | Mark all as read |
| `DELETE` | `/api/notifications/:id` | ✅ | — | `204` | Delete notification |
| `DELETE` | `/api/notifications` | ✅ | — | `204` | Clear all notifications |

---

### 8.8 Location Data Endpoints

| Method | Path | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| `GET` | `/api/locations/gujarat` | ❌ | — | `{ data: { districts, subDistricts, villages } }` | Full cascading location data from JSON |
| `GET` | `/api/locations/popular` | ❌ | — | `{ data: [PopularLocation] }` | From `locationData.js` |
| `GET` | `/api/locations/:slug` | ❌ | — | `{ data: PopularLocation }` | Single location by slug |

---

### 8.9 Upload Endpoints

| Method | Path | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| `POST` | `/api/uploads/images` | ✅ | `multipart: images[]` | `{ data: [{ url, name }] }` | Max 10 images |
| `POST` | `/api/uploads/videos` | ✅ | `multipart: videos[]` | `{ data: [{ url, name }] }` | Max 3 videos |
| `POST` | `/api/uploads/documents` | ✅ | `multipart: document` | `{ data: { url, name, type } }` | Single 7/12 doc |
| `POST` | `/api/uploads/audio` | ✅ | `multipart: audio` | `{ data: { url, name } }` | Voice recording |
| `POST` | `/api/uploads/profile-image` | ✅ | `multipart: image` | `{ data: { url } }` | Profile photo |

---

### 8.10 Enquiry Endpoints

| Method | Path | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| `POST` | `/api/enquiries` | ✅ | `{ listingId, message, phone?, email? }` | `{ data: Enquiry }` | Buyer contacts seller |

---

### 8.11 Admin Endpoints

All admin endpoints are prefixed with `/api/admin` and require admin authentication.

#### Admin Auth

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/api/admin/auth/login` | ❌ | `{ email, password }` | `{ token, admin }` |
| `POST` | `/api/admin/auth/logout` | Admin | — | `{ success }` |

#### Admin Dashboard

| Method | Path | Auth | Response |
|---|---|---|---|
| `GET` | `/api/admin/dashboard/stats` | Admin | `{ totalProperties, activeProperties, soldProperties, pendingProperties, totalBuyers, totalSellers, totalEnquiries, registeredUsers }` |

#### Admin Properties (full CRUD)

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/admin/properties` | Admin | Paginated with search/filter/sort |
| `GET` | `/api/admin/properties/:id` | Admin | |
| `POST` | `/api/admin/properties` | Admin | Create from admin panel |
| `PUT` | `/api/admin/properties/:id` | Admin | Full edit |
| `PATCH` | `/api/admin/properties/:id/status` | Admin | Change status |
| `PATCH` | `/api/admin/properties/:id/featured` | Admin | Toggle featured |
| `PATCH` | `/api/admin/properties/:id/verified` | Admin | Toggle verified |
| `DELETE` | `/api/admin/properties/:id` | Admin | Hard delete |
| `DELETE` | `/api/admin/properties` | Admin | Bulk delete `{ ids: [] }` |
| `GET` | `/api/admin/properties/export` | Admin | CSV export |

#### Admin Buyer Leads

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/admin/buyer-leads` | Admin | Paginated with search/filter |
| `PATCH` | `/api/admin/buyer-leads/:id/status` | Admin | Update status |
| `DELETE` | `/api/admin/buyer-leads/:id` | Admin | |

#### Admin Seller Leads

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/admin/seller-leads` | Admin | Paginated with search |
| `PATCH` | `/api/admin/seller-leads/:id/status` | Admin | |
| `DELETE` | `/api/admin/seller-leads/:id` | Admin | |

#### Admin Users

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/admin/users` | Admin | Paginated with search |
| `PATCH` | `/api/admin/users/:id/status` | Admin | Toggle Active/Inactive |
| `GET` | `/api/admin/users/export` | Admin | CSV export |

#### Admin Enquiries

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/admin/enquiries` | Admin | Paginated with search/filter |
| `GET` | `/api/admin/enquiries/:id` | Admin | Enquiry details |
| `PATCH` | `/api/admin/enquiries/:id/status` | Admin | Update status |
| `DELETE` | `/api/admin/enquiries/:id` | Admin | Hard delete |

#### Admin Categories

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/admin/categories` | Admin | |
| `POST` | `/api/admin/categories` | Admin | `{ name }` |
| `DELETE` | `/api/admin/categories/:id` | Admin | |

#### Admin Locations

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/admin/locations` | Admin | |
| `POST` | `/api/admin/locations` | Admin | `{ state, cities, areas }` |
| `PUT` | `/api/admin/locations/:id` | Admin | |
| `DELETE` | `/api/admin/locations/:id` | Admin | |

#### Admin Notifications

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/admin/notifications` | Admin | |

#### Admin Settings

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/admin/settings` | Admin | Get singleton |
| `PUT` | `/api/admin/settings` | Admin | Update singleton |

#### Admin Reports

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/admin/reports/summary` | Admin | Aggregate statistics |

---

## 9. Validation Specification

### 9.1 Auth Validators

**Register:**
```
name: string, required, min 2, max 100
mobile: string, required, pattern /^[0-9]{10}$/
email: string, optional, valid email format
city: string, required, min 2, max 100
```

**Send OTP / Verify OTP:**
```
mobile: string, required, pattern /^[0-9]{10}$/
otp: string, required (verify only), pattern /^[0-9]{6}$/
```

### 9.2 Listing Validators

```
state: string, default 'Gujarat'
district: string, required
subDistrict: string, optional
village: string, optional
type: string, required, enum ['Agricultural Land', 'Non-Agricultural Land']
priceUnit: string, optional, enum ['Vigha', 'Sq.Yard (Var)', 'Sq.Ft']
priceAmount: number, optional, min 0
mapLink: string, optional, valid URL (must start with http)
additionalDetails: string, optional, max 2000
```

### 9.3 Buyer Lead Validators

```
state: string, required
district: string, required
taluka: string, required
preferredVillages: array of strings, required, min length 2
propertyType: string, required, enum ['Agricultural Land', 'Non-Agricultural Land']
purpose: string, required, enum ['Investment', 'Project', 'Personal Farm', 'Other']
requirements: string, optional, max 2000
```

### 9.4 User Profile Validators

```
name: string, optional, min 2, max 100
email: string, optional, valid email
whatsapp: string, optional
district: string, optional
subDistrict: string, optional
address: string, optional, max 500
```

---

## 10. Upload Architecture

### 10.1 File Types and Limits

| File Type | Max Size | Allowed MIME Types | Max Count | Endpoint |
|---|---|---|---|---|
| Property images | 5 MB each | jpeg, png, webp | 10 per listing | `/api/uploads/images` |
| Property videos | 50 MB each | mp4, webm | 3 per listing | `/api/uploads/videos` |
| 7/12 Document | 10 MB | pdf, jpeg, png, webp | 1 per listing | `/api/uploads/documents` |
| Voice recording | 10 MB | audio/webm, audio/mp3 | 1 per buyer lead | `/api/uploads/audio` |
| Profile image | 2 MB | jpeg, png, webp | 1 per user | `/api/uploads/profile-image` |

### 10.2 Storage Strategy

**Development:** Local disk (`backend/uploads/`) with Express static serving.

**Production:** Cloudinary (or equivalent) via an abstraction in `upload.service.js`:

```
UploadService
├── LocalUploadProvider    (saves to disk, serves via /uploads/*)
└── CloudinaryUploadProvider (uploads to Cloudinary, returns CDN URL)
```

The provider is selected by `UPLOAD_PROVIDER` env variable.

### 10.3 Upload Flow

1. Client sends `multipart/form-data` to upload endpoint
2. Multer middleware validates file type, size, count
3. `upload.service.js` delegates to the configured provider
4. Provider returns URL(s)
5. URLs are stored in the corresponding document (Listing, BuyerLead, User)

---

## 11. Middleware Specification

### 11.1 Auth Middleware (`auth.middleware.js`)

- Extracts `Authorization: Bearer <token>` header
- Verifies JWT signature and expiry
- Attaches `req.user = { userId, mobile, role }` to request
- Returns 401 if token is missing, invalid, or expired

### 11.2 Admin Middleware (`admin.middleware.js`)

- Runs after auth middleware
- Checks `req.user.role === 'admin'`
- Returns 403 if not admin

### 11.3 Validation Middleware (`validate.middleware.js`)

- Takes a Joi schema as argument
- Validates `req.body`, `req.query`, or `req.params`
- Returns 400 with structured `errors` array on failure

### 11.4 Upload Middleware (`upload.middleware.js`)

- Configures Multer with:
  - File size limits per type
  - File filter by MIME type
  - Memory storage (for cloud upload) or disk storage (for local)
- Exports named middleware functions: `uploadImages`, `uploadVideo`, `uploadDocument`, `uploadAudio`, `uploadProfileImage`

### 11.5 Rate Limiter (`rateLimiter.middleware.js`)

| Endpoint Group | Window | Max Requests |
|---|---|---|
| OTP send/resend | 15 min | 5 |
| Auth (register/login) | 15 min | 10 |
| API general | 15 min | 100 |
| File uploads | 15 min | 20 |
| Admin | 15 min | 200 |

### 11.6 Error Handler (`errorHandler.middleware.js`)

- Catches all errors from controllers
- Normalizes error format to the standard envelope
- Strips stack traces in production
- Handles Mongoose validation errors, duplicate key errors, cast errors
- Logs errors via winston

---

## 12. Admin Permissions

| Resource | List | View | Create | Edit | Delete | Status Change | Feature/Verify |
|---|---|---|---|---|---|---|---|
| Properties | ✅ | ✅ | ✅ | ✅ | ✅ (bulk) | ✅ | ✅ |
| Buyer Leads | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Seller Leads | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Users | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ (Active/Inactive) | ❌ |
| Enquiries | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Categories | ✅ | — | ✅ | ❌ | ✅ | ❌ | ❌ |
| Locations | ✅ | — | ✅ | ✅ | ✅ | ❌ | ❌ |
| Notifications | ✅ | — | ❌ | ❌ | ❌ | ❌ | ❌ |
| Settings | ✅ | — | ❌ | ✅ | ❌ | ❌ | ❌ |
| Reports | ✅ | — | ❌ | ❌ | ❌ | ❌ | ❌ |
| Dashboard | ✅ | — | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 13. Security Checklist

- [ ] **Helmet** — HTTP security headers on all responses
- [ ] **CORS** — Restrict to frontend origin (`CORS_ORIGIN` env var)
- [ ] **Rate Limiting** — Per-IP limits on OTP, auth, and upload routes
- [ ] **Input Sanitization** — Joi validation on all request bodies; strip unknown fields
- [ ] **NoSQL Injection** — Mongoose schema types prevent injection; use `express-mongo-sanitize`
- [ ] **XSS Prevention** — `helmet.contentSecurityPolicy()`, sanitize user-generated text
- [ ] **File Upload Validation** — Verify MIME type via magic bytes, not just extension
- [ ] **JWT Security** — Short expiry access tokens; refresh token rotation; httpOnly cookie option
- [ ] **Password Hashing** — Bcrypt with salt rounds ≥ 12 for admin passwords
- [ ] **OTP Hashing** — Hash OTP before storage in production
- [ ] **Error Masking** — No stack traces or internal details in production error responses
- [ ] **Sensitive Data** — Never log or return passwords, OTP values (in prod), JWT secrets
- [ ] **MongoDB Indexes** — Ensure all query-heavy fields are indexed to prevent slow-query DoS
- [ ] **File Size Limits** — Enforce at Multer level AND at reverse proxy (nginx) level
- [ ] **HTTPS** — Enforce HTTPS in production via reverse proxy

---

## 14. Deployment Architecture

### Development

```
┌──────────────────────┐     ┌──────────────────────┐
│  Frontend (Vite)     │     │  Backend (Express)    │
│  http://127.0.0.1:4173 │──▶│  http://127.0.0.1:5000│
│                      │     │                      │
│  Proxy: /api → :5000 │     │  MongoDB: localhost   │
└──────────────────────┘     └──────────────────────┘
```

Add Vite proxy config to `frontend/vite.config.js`:
```js
server: {
  proxy: {
    '/api': 'http://127.0.0.1:5000'
  }
}
```

### Production (Recommended)

```
┌────────────┐     ┌──────────────────────┐     ┌────────────────┐
│  CDN /     │     │  Node.js Server      │     │  MongoDB Atlas │
│  Vercel    │────▶│  (Railway / Render /  │────▶│                │
│  (frontend)│     │   DigitalOcean)       │     │                │
└────────────┘     └──────────────────────┘     └────────────────┘
                           │
                           ▼
                   ┌──────────────────┐
                   │  Cloudinary      │
                   │  (file storage)  │
                   └──────────────────┘
```

---

## 15. Coding Conventions

| Convention | Rule |
|---|---|
| **File naming** | `camelCase.js` for modules, `PascalCase.js` for models |
| **Exports** | Named exports for utilities, default export for models |
| **Async/await** | Always use async/await, never raw promises |
| **Error handling** | Use `asyncHandler` wrapper on all controller functions |
| **Controller pattern** | Thin controllers — business logic in services |
| **Route pattern** | `router.get('/', auth, validate(schema), controller.list)` |
| **Status codes** | Use constants from `utils/constants.js` |
| **Response format** | Always use `ApiResponse` class |
| **Mongoose queries** | Use `.lean()` for read-only queries |
| **Population** | Populate only necessary fields, never `populate('*')` |
| **Pagination** | Default `page=1, limit=10`, max `limit=100` |
| **Sorting** | Default `{ createdAt: -1 }` unless specified |
| **Environment** | Access env vars only through `config/env.js` |
| **Secrets** | Never commit `.env`, use `.env.example` as template |

---

## 16. Implementation Order

### Phase 1: Foundation
1. Project scaffolding (`package.json`, Express app, folder structure)
2. MongoDB connection (`config/db.js`)
3. Environment configuration (`config/env.js`, `.env.example`)
4. Global middleware (helmet, cors, morgan, error handler)
5. Utility classes (`ApiError`, `ApiResponse`, `asyncHandler`)

### Phase 2: Authentication
6. `User` model
7. `OtpSession` model
8. OTP service (generate, send, verify)
9. JWT service (sign, verify, refresh)
10. Auth routes + controllers (register, send-otp, verify-otp, refresh, logout)
11. Auth middleware
12. Rate limiting on auth routes

### Phase 3: Core Listings
13. `Listing` model
14. `SellerLead` model
15. Upload middleware (Multer config)
16. Upload service (local provider)
17. Listing CRUD routes + controllers
18. Seller lead creation (as part of listing creation)

### Phase 4: Buyer Features
19. `BuyerLead` model
20. Buyer lead CRUD routes + controllers
21. `SavedProperty` model + routes
22. `RecentlyViewed` model + routes
23. `Notification` model + routes

### Phase 5: User Profile
24. User profile routes (GET/PUT /me)
25. Profile image upload
26. Password change (future-proofing)

### Phase 6: Location Data
27. Static Gujarat location data endpoint
28. Popular locations endpoint
29. Location model + admin CRUD

### Phase 7: Admin Panel
30. `AdminUser` model + seed script
31. Admin auth routes
32. Admin middleware
33. Admin dashboard stats
34. Admin properties CRUD
35. Admin buyer leads management
36. Admin seller leads management
37. Admin users management
38. Admin enquiries management
39. Admin categories CRUD
40. Admin locations CRUD
41. Admin notifications view
42. Admin settings CRUD
43. Admin reports
44. CSV export endpoints

### Phase 8: Production Hardening
45. Cloudinary upload provider
46. Real SMS gateway integration
47. Input sanitization hardening
48. Comprehensive rate limiting
49. Logging infrastructure (winston)
50. Health check endpoint
51. Graceful shutdown handling

---

> **This is a living document.** Update it as implementation reveals new requirements or the frontend evolves.
