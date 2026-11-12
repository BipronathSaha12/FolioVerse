# FolioVerse — Production Deployment Guide
### Neon (PostgreSQL) + Redis + Render (Django REST API) + Vercel (React Frontend)

**Document Version:** 2.0.0  
**Authority / Owner:** Bipronath Saha (bipronathsaha@gmail.com)

This guide provides complete instructions for deploying FolioVerse across the modern serverless cloud stack:
- **Database**: [Neon](https://neon.tech/) Serverless PostgreSQL 16 with Connection Pooling & Read Replicas
- **In-Memory Cache**: [Upstash Redis](https://upstash.com/) or Render Redis for flash-sale stock reservation
- **Backend API**: [Render](https://render.com/) Web Service (Python 3.11 + Gunicorn + WhiteNoise)
- **Frontend SPA**: [Vercel](https://vercel.com/) (React 19 + React Router v7 + Vite 8 + Tailwind CSS v4)
- **CI/CD Security**: GitHub Actions Automated Vulnerability Audit (`pip-audit`, `bandit`, `npm audit`)

---

## 🗄️ Step 1: Provision Neon Serverless PostgreSQL

1. **Sign Up / Log In**: Go to [neon.tech](https://neon.tech/) and sign in with GitHub or email.
2. **Create New Project**:
   - **Project Name**: `folioverse-db`
   - **Postgres Version**: `16` (or latest)
   - **Region**: Frankfurt (`eu-central-1`) or Oregon (`us-west-2`).
3. **Retrieve Pooled Connection String**:
   - Locate **Connection Details** on the Neon dashboard.
   - Check **Pooled connection** (recommended for web services).
   - Copy the URI:
     ```text
     postgresql://<username>:<password>@<ep-pooler-id>.neon.tech/<dbname>?sslmode=require
     ```
   - Keep this `DATABASE_URL` for Step 3.

---

## ⚡ Step 2: Provision Redis (Upstash or Render Redis)

For atomic flash-sale stock reservation via Lua scripts:
1. **Option A (Upstash - Recommended Serverless)**:
   - Go to [upstash.com](https://upstash.com/) and create a free Redis database.
   - Copy the `redis://...` or `rediss://...` connection string.
2. **Option B (Render Redis)**:
   - In Render, click **New +** $\rightarrow$ **Redis**.
   - Copy the internal connection URL.

---

## ⚙️ Step 3: Deploy Django Backend on Render

1. **Create Web Service**:
   - In [render.com](https://render.com/), click **New +** $\rightarrow$ **Web Service**.
   - Connect your GitHub repository: `https://github.com/BipronathSaha12/FolioVerse.git`.
2. **Service Configuration**:
   - **Name**: `folioverse-api`
   - **Branch**: `main`
   - **Root Directory**: `backend` *(CRITICAL: must be set to `backend`)*
   - **Runtime**: `Python 3`
   - **Build Command**: `bash build.sh`
   - **Start Command**: `gunicorn folioverse_api.wsgi:application --bind 0.0.0.0:$PORT`
   - **Instance Type**: `Free` or `Starter`
3. **Environment Variables**:

   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `PYTHON_VERSION` | `3.11.7` | Python runtime version |
   | `DEBUG` | `False` | Disables debug mode in production |
   | `SECRET_KEY` | *(Generate a 64-character secret key)* | Mandatory when `DEBUG=False` |
   | `ALLOWED_HOSTS` | `.onrender.com,localhost,127.0.0.1` | Constrains host header attacks |
   | `CORS_ALLOWED_ORIGINS` | `https://your-frontend.vercel.app,http://localhost:5173` | Strict trusted origins |
   | `SECURE_SSL_REDIRECT` | `True` | Forces HTTPS redirection |
   | `SECURE_HSTS_SECONDS` | `31536000` | 1-year HSTS header enforcement |
   | `DATABASE_URL` | *(Paste your Neon pooled connection string)* | Primary write database |
   | `REPLICA_DATABASE_URL` | *(Optional read replica connection string)* | Enables read/write splitting |
   | `REDIS_URL` | *(Paste your Redis connection URL)* | Flash-sale stock reservation engine |

4. **Deploy**:
   - Click **Create Web Service**.
   - Render runs `build.sh` (installs packages, collects WhiteNoise static files, applies migrations) and starts Gunicorn.
   - Verify health: `https://folioverse-api.onrender.com/api/` should return HTTP 200 OK.

---

## 🌱 Step 4: Seed Demo Accounts & Books on Neon

In your Render Web Service dashboard, click **Shell** in the left menu and execute:
```bash
python manage.py create_demo_accounts
python manage.py seed_bookstore --target 2000
```
This provisions:
- `admin` / `admin12345` (Administrator)
- `seller_demo` / `seller12345` (Book Seller)
- `buyer_demo` / `buyer12345` (Book Buyer)
- 2,000 categorized catalog books with seller attribution.

---

## 🎨 Step 5: Deploy React Frontend on Vercel

1. **Import Project**:
   - Go to [vercel.com](https://vercel.com/) and click **Add New...** $\rightarrow$ **Project**.
   - Select the `FolioVerse` repository.
2. **Configure Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
3. **Environment Variable**:
   - `VITE_API_BASE_URL`: `https://your-render-service.onrender.com/api`
4. **Deploy**:
   - Click **Deploy**. Vercel will build the SPA bundle with React Router v7 rewrites configured via `vercel.json`.

---

## 🔒 Step 6: Post-Deployment Verification Checklist

1. [ ] Check frontend loads at `https://folioverse.vercel.app/`.
2. [ ] Test deep linking: navigate directly to `/books/1`, `/cart`, and `/checkout`.
3. [ ] Test 1-click login for `admin`, `seller_demo`, and `buyer_demo`.
4. [ ] In Seller Portal, confirm incoming orders display customer contact, payment status, and fulfillment buttons.
5. [ ] In Store Admin Dashboard, confirm executive sales volume and live order moderation buttons work.
6. [ ] Complete a test checkout with MFS (bKash/Nagad/Rocket) and verify TrxID is generated and marked PAID.
