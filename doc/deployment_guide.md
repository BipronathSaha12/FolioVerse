# FolioVerse — Production Deployment Guide
### Neon (Serverless PostgreSQL) + Render (Django REST API) + Vercel (React Frontend)

This guide provides step-by-step instructions for deploying FolioVerse across the modern serverless cloud stack:
- **Database**: [Neon](https://neon.tech/) Serverless PostgreSQL 16 with Connection Pooling
- **Backend API**: [Render](https://render.com/) Web Service (Python 3.11 + Gunicorn + WhiteNoise)
- **Frontend SPA**: [Vercel](https://vercel.com/) (React 19 + Vite + Tailwind CSS)
- **CI/CD Security**: GitHub Actions Automated Vulnerability Audit (`pip-audit`, `bandit`, `npm audit`)

---

## 🗄️ Step 1: Provision Neon Serverless PostgreSQL

1. **Sign Up / Log In**: Go to [neon.tech](https://neon.tech/) and sign in with GitHub or your email.
2. **Create New Project**:
   - **Project Name**: `folioverse-db`
   - **Postgres Version**: `16` (or latest)
   - **Region**: Choose the region closest to your users or Render service (e.g., `Frankfurt (eu-central-1)` or `Oregon (us-west-2)`).
3. **Retrieve Pooled Connection String**:
   - In your Neon project dashboard, locate the **Connection Details** box.
   - Select **Connection string** and check **Pooled connection** (recommended for web services).
   - Copy the URI, which looks like:
     ```text
     postgresql://<username>:<password>@<ep-pooler-id>.neon.tech/<dbname>?sslmode=require
     ```
   - *Keep this `DATABASE_URL` handy for Step 2.*

---

## ⚙️ Step 2: Deploy Django Backend on Render

1. **Sign Up / Log In**: Go to [render.com](https://render.com/) and connect your GitHub account.
2. **Create New Web Service**:
   - Click **New +** $\rightarrow$ **Web Service**.
   - Select **Build and deploy from a Git repository**.
   - Connect your **`FolioVerse`** repository.
3. **Configure the Service Settings**:
   - **Name**: `folioverse-api` (or your chosen service name)
   - **Region**: Same or close to your Neon database region.
   - **Branch**: `main`
   - **Root Directory**: `backend` *(CRITICAL: must be set to `backend`)*
   - **Runtime**: `Python 3`
   - **Build Command**: `bash build.sh`
   - **Start Command**: `gunicorn folioverse_api.wsgi:application --bind 0.0.0.0:$PORT`
   - **Instance Type**: `Free` (or Starter)
4. **Configure Environment Variables (Hardened)**:
   Click **Advanced** $\rightarrow$ **Add Environment Variable** and add the following:

   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `PYTHON_VERSION` | `3.11.7` | Standard Python runtime |
   | `DEBUG` | `False` | Disables debug mode in production |
   | `SECRET_KEY` | *(Click "Generate" or paste a strong 64-char key)* | Production secret (mandatory when `DEBUG=False`) |
   | `ALLOWED_HOSTS` | `.onrender.com,localhost,127.0.0.1` | Constrains host header attacks |
   | `CORS_ALLOWED_ORIGINS` | `https://your-frontend.vercel.app,http://localhost:5173` | Strict trusted origins |
   | `SECURE_SSL_REDIRECT` | `True` | Forces HTTPS redirection |
   | `SECURE_HSTS_SECONDS` | `31536000` | 1-year HSTS header enforcement |
   | `DATABASE_URL` | *(Paste your Neon pooled connection string from Step 1)* | Automatically parsed by `dj-database-url` |

5. **Deploy**:
   - Click **Create Web Service**.
   - Render runs `bash build.sh` (installs dependencies, collects static files with WhiteNoise, and applies all migrations to Neon), then launches Gunicorn.
   - Once deployed, copy your backend URL (e.g., `https://folioverse-api.onrender.com`).
   - Verify health check in your browser: `https://folioverse-api.onrender.com/api/` should return HTTP 200 OK!

---

## 🌱 Step 3: Seed Demo Accounts & Books on Neon

Your Neon database now has all tables created by the migrations. To populate the demo accounts and 2,000 books:

### Option A: Using Render Shell (Recommended)
1. In your Render Web Service dashboard, click **Shell** in the left menu.
2. Run:
   ```bash
   python manage.py create_demo_accounts
   python manage.py seed_bookstore --target 2000
   ```
3. Done! All admin, seller, buyer accounts and realistic catalog records are seeded.

### Option B: From Your Local Machine
You can also run the seeding commands from your local machine pointing to Neon:
```powershell
# PowerShell
$env:DATABASE_URL="postgresql://<username>:<password>@<ep-pooler-id>.neon.tech/<dbname>?sslmode=require"
python backend/manage.py create_demo_accounts
python backend/manage.py seed_bookstore --target 2000
```

---

## 🎨 Step 4: Deploy React Frontend on Vercel

1. **Sign Up / Log In**: Go to [vercel.com](https://vercel.com/) and sign in with GitHub.
2. **Add New Project**:
   - Click **Add New...** $\rightarrow$ **Project**.
   - Select your **`FolioVerse`** repository from GitHub.
3. **Configure Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend`.
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
4. **Configure Environment Variables**:
   Under **Environment Variables**, add:

   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://folioverse-api.onrender.com/api` *(replace with your actual Render URL)* |

5. **Deploy**:
   - Click **Deploy**.
   - Vercel installs dependencies and builds the Vite bundle with `frontend/vercel.json` SPA routing rewrites.
   - In ~1 minute, your live production site will be active (e.g., `https://folioverse.vercel.app`)!

---

## 🔒 Step 5: Post-Deployment Security & CORS Finalization

1. Return to your **Render Web Service** dashboard $\rightarrow$ **Environment Variables**.
2. Update `CORS_ALLOWED_ORIGINS` to include your newly generated Vercel domain:
   ```text
   CORS_ALLOWED_ORIGINS=https://folioverse.vercel.app,https://your-custom-domain.com
   ```
3. Render will automatically redeploy with the updated CORS policy.

---

## ✅ Step 6: End-to-End Verification Checklist

1. **Catalog Browsing**: Open your Vercel URL. Books and genre tabs should load smoothly with active live counts.
2. **Search & Filter**: Search for a title, filter by Bengali/English literature, test price sorting.
3. **Seller Operations**:
   - Click **Login** $\rightarrow$ Click **"1-Click Seller Login"** (or use `seller_demo` / `seller12345`).
   - Click the amber **Seller Dashboard** button in the navbar.
   - Moderate book prices and inspect buyer orders.
4. **Buyer Checkout**:
   - Log in as buyer (`buyer_demo` / `buyer12345`).
   - Add books to cart, click **Checkout**, select **bKash / Nagad / Rocket**, complete simulated OTP & PIN.
   - Verify atomic order confirmation!
5. **Security Regression Tests**:
   - Automated CI workflow runs on GitHub (`.github/workflows/security-audit.yml`).
