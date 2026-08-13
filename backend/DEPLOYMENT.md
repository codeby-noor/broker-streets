# Railway Deployment Runbook — Broker Streets Backend

This runbook outlines step-by-step instructions for deploying the Broker Streets Node.js/Express backend to Railway with MongoDB Atlas for database persistence and Cloudinary for file storage.

---

## 1. Production Environment Variables

All environment variables must be configured in your Railway project under **Settings > Environment Variables**.

| Variable | Description | Source / How to Obtain |
|---|---|---|
| `NODE_ENV` | Must be set to `production`. | Set manually to `production`. |
| `PORT` | HTTP port for Express server. | Railway sets `PORT` automatically (defaults to 5000 locally). |
| `MONGODB_URI` | MongoDB Atlas connection string. | MongoDB Atlas > Database > Connect > Connect your application. |
| `CORS_ORIGIN` | Comma-separated list of allowed frontend origins. | Your deployed frontend domain (e.g. `https://broker-streets-web.up.railway.app`). |
| `JWT_SECRET` | 64-character random hex string for signing access tokens. | Generate via `openssl rand -hex 32`. |
| `JWT_EXPIRES_IN` | Access token expiration duration. | Set to `7d` (or desired lifespan). |
| `JWT_REFRESH_SECRET` | 64-character random hex string for refresh tokens. | Generate via `openssl rand -hex 32`. |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration duration. | Set to `30d`. |
| `ENABLE_REAL_SMS` | Must be `true` in production to prevent fatal boot crash. | Set to `true`. |
| `SMS_PROVIDER` | SMS Gateway provider name. | Set to `msg91` (or `twilio`). |
| `SMS_API_KEY` | Production SMS Gateway API key. | MSG91 Dashboard > API Keys. |
| `SMS_SENDER_ID` | Approved 6-character sender ID. | MSG91 Dashboard > Sender IDs (e.g., `BRKRST`). |
| `SMS_TEMPLATE_ID` | Approved DLT OTP SMS template ID. | MSG91 Dashboard > Templates. |
| `UPLOAD_PROVIDER` | Must be `cloudinary` in production (ephemeral filesystem). | Set to `cloudinary`. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name. | Cloudinary Console Dashboard. |
| `CLOUDINARY_API_KEY` | Cloudinary account API key. | Cloudinary Console Dashboard. |
| `CLOUDINARY_API_SECRET` | Cloudinary account API secret. | Cloudinary Console Dashboard. |
| `ADMIN_DEFAULT_EMAIL` | Initial admin account email for seeding on first boot. | Set to your primary admin email (e.g. `admin@brokerstreets.com`). |
| `ADMIN_DEFAULT_PASSWORD` | Initial admin account password for seeding on first boot. | Strong password (e.g. `Admin@2026_SecureKey!`). |

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

> **Warning:** Railway containers use an ephemeral filesystem. If `UPLOAD_PROVIDER` is set to `local` in production, `env.js` will throw a fatal error on boot to prevent data loss.

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

---

## 5. Post-Deploy Smoke Checklist

After deployment completes, run the automated smoke test script against your live domain:

```bash
node scripts/smoke-test.js https://your-railway-backend.up.railway.app
```

Or manually verify using `curl` or Postman:

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
     "data": { "status": "healthy", "timestamp": "2026-..." }
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
