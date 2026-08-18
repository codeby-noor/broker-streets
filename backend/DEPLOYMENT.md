# Railway Deployment Runbook — Broker Streets Backend

This runbook outlines step-by-step instructions for deploying the Broker Streets Node.js/Express backend to Railway with MongoDB Atlas for database persistence, Clerk for regular user auth, and Cloudinary for file storage.

---

## 1. Production Environment Variables

Configure the following environment variables in your Railway project under **Settings > Environment Variables**:

| Variable | Required in Prod | Description | Source / How to Obtain |
|---|---|---|---|
| `NODE_ENV` | Yes | Must be set to `production`. | Set manually to `production`. |
| `PORT` | Auto | HTTP port for Express server. | Set automatically by Railway (defaults to 5000). |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string. | MongoDB Atlas > Database > Connect > Connect your application. |
| `CORS_ORIGIN` | Yes | Allowed frontend origins (comma-separated). | Your deployed frontend domain (e.g. `https://broker-streets-web.up.railway.app`). |
| `CLERK_PUBLISHABLE_KEY` | Yes | Clerk Publishable Key for authentication. | Clerk Dashboard > API Keys (`pk_test_...` or `pk_live_...`). |
| `CLERK_SECRET_KEY` | Yes | Clerk Secret Key for backend authentication. | Clerk Dashboard > API Keys (`sk_test_...` or `sk_live_...`). |
| `CLERK_WEBHOOK_SECRET` | Yes | Clerk Webhook signing secret for `svix` verification. | Clerk Dashboard > Webhooks > Endpoint Signing Secret (`whsec_...`). |
| `UPLOAD_PROVIDER` | Yes | Must be set to `cloudinary` in production. | Set manually to `cloudinary`. |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary account cloud name. | Cloudinary Console Dashboard. |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary account API key. | Cloudinary Console Dashboard. |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary account API secret. | Cloudinary Console Dashboard. |
| `ADMIN_DEFAULT_MOBILE` | Yes | Initial Super Admin mobile number for first-boot seeding. | 10-digit mobile number you control (e.g. `9876543210`). |
| `ADMIN_DEFAULT_NAME` | Yes | Initial Super Admin display name. | Display name (e.g. `Super Admin`). |
| `JWT_SECRET` | Recommended | 64-character random string for admin access tokens. | Generate via `openssl rand -hex 32`. |
| `JWT_REFRESH_SECRET` | Recommended | 64-character random string for admin refresh tokens. | Generate via `openssl rand -hex 32`. |

### SMS Configuration (Pending DLT Approval — Leave Unset)

> [!NOTE]
> `ENABLE_REAL_SMS`, `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_SENDER_ID`, `SMS_TEMPLATE_ID`, and `MSG91_AUTH_KEY` are **not required yet**. Leave them unset while MSG91 DLT registration is pending.
> When unset or `ENABLE_REAL_SMS=false`, admin OTPs are mocked and logged server-side in Railway container logs only — they are never returned in client API responses.

---

## 2. MongoDB Atlas Setup

1. **Create Cluster**:
   - Log into [MongoDB Atlas](https://cloud.mongodb.com).
   - Create a new M0 Free Cluster or Dedicated Cluster in your preferred region (e.g. `ap-south-1` Mumbai).

2. **Network Access**:
   - Navigate to **Security > Network Access**.
   - Click **Add IP Address** and add `0.0.0.0/0` (Allow Access from Anywhere) to permit connections from Railway's dynamic IP ranges.

3. **Database User**:
   - Navigate to **Security > Database Access**.
   - Click **Add New Database User**, choose **Password** authentication, and set a username & secure password. Grant `readWriteAnyDatabase` or `dbAdmin` on `broker-streets`.

4. **Connection String**:
   - Click **Database > Connect > Drivers**.
   - Copy the connection string format:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/broker-streets?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database credentials and set this as the `MONGODB_URI` environment variable in Railway.

---

## 3. Cloudinary Setup

1. Log into [Cloudinary Console](https://cloudinary.com/console).
2. On the main Dashboard, locate your **Cloud name**, **API Key**, and **API Secret**.
3. Set `UPLOAD_PROVIDER=cloudinary`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in Railway.

> [!WARNING]
> Railway containers use an ephemeral filesystem. If `UPLOAD_PROVIDER` is set to `local` in production, `env.js` will throw a fatal error on boot to prevent data loss.

---

## 4. Railway Deployment Setup

1. Log into [Railway](https://railway.app) and create a new project.
2. Select **Deploy from GitHub repo** and choose `codeby-noor/broker-streets`.
3. Set the **Root Directory** to `backend`.
4. Configure Build and Start commands:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (runs `node server.js`)
5. Configure Health Check Path:
   - Go to **Settings > Healthcheck Path** and enter `/health`.
6. Add all mandatory environment variables listed in Section 1 above.
7. Trigger deployment. Railway will automatically build, run database seeding/migrations, and start the service.

> [!IMPORTANT]
> **Admin Account Seeding & First Login**:
> `ADMIN_DEFAULT_MOBILE` and `ADMIN_DEFAULT_NAME` seed the initial super admin account on first boot. Ensure `ADMIN_DEFAULT_MOBILE` is set to a real phone number you control before first deploy.
> Since real SMS is not yet enabled, the super admin OTP will be output to Railway server logs (`[MOCK MSG91 SMS] OTP for ... is XXXXXX`). Check the Railway deploy log stream to read the OTP and complete first login at `/master-group`.

---

## 5. Post-Deploy Smoke Checklist

After deployment completes, verify the live backend endpoints:

1. **Root Health Check**:
   ```bash
   curl -i https://your-railway-backend.up.railway.app/health
   ```
   *Expected Response:* `200 OK`
   ```json
   {
     "statusCode": 200,
     "success": true,
     "message": "Server is healthy",
     "data": { "status": "healthy" }
   }
   ```

2. **API Health Check**:
   ```bash
   curl -i https://your-railway-backend.up.railway.app/api/health
   ```
   *Expected Response:* `200 OK` with `"API is healthy"`.

3. **Public Read Endpoint**:
   ```bash
   curl -i https://your-railway-backend.up.railway.app/api/listings
   ```
   *Expected Response:* `200 OK` returning `{ success: true, data: [...], meta: {...} }`.

---

## 6. Rollback Plan

If a deployment introduces a critical bug or regression, perform a one-click rollback in Railway:
1. Open your project on Railway and click on the Backend service.
2. Navigate to the **Deployments** tab.
3. Locate the previous stable deployment build.
4. Click the three dots (`...`) next to that deployment and select **Redeploy**.
Railway will immediately route incoming traffic back to the previously functioning container image without downtime.
