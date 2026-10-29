# FolioVerse — Enterprise Book Store REST API & Web Application

[![Django](https://img.shields.io/badge/Django-5.2-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.16-A30000?style=for-the-badge&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-36%2F36%20Passing-success?style=for-the-badge&logo=pytest&logoColor=white)](https://github.com/BipronathSaha12/FolioVerse)
[![Security Hardened](https://img.shields.io/badge/Security-4--Layer%20Hardened-blueviolet?style=for-the-badge&logo=shield&logoColor=white)](https://github.com/BipronathSaha12/FolioVerse)

A full-stack, enterprise-grade Book Store Management System and REST API. Built with **Django REST Framework (DRF)**, **PostgreSQL (Neon)**, **React 19**, and **Tailwind CSS**, featuring 4-Layer Defense-in-Depth Security Hardening, Role-Based Access Control (RBAC) with dedicated **Store Admin**, **Book Seller**, and **Book Buyer** portals, an interactive **MFS Payment Gateway** (bKash, Nagad, Rocket), and catalog price moderation.

---

## 📖 Table of Contents
- [Project Overview](#-project-overview)
- [4-Layer Security Hardening](#-4-layer-security-hardening)
- [Key Features & Operations](#-key-features--operations)
  - [1. Role-Based Access Control (RBAC)](#1-role-based-access-control-rbac)
  - [2. Buyer Experience & Atomic Checkout](#2-buyer-experience--atomic-checkout)
  - [3. Dedicated Seller Portal & Fulfillment](#3-dedicated-seller-portal--fulfillment)
  - [4. Interactive MFS Payment Gateway Simulator](#4-interactive-mfs-payment-gateway-simulator)
  - [5. Catalog Taxonomy & Search Filtering](#5-catalog-taxonomy--search-filtering)
- [Architecture & Directory Structure](#-architecture--directory-structure)
- [Local Setup & Running the Project](#-local-setup--running-the-project)
- [Operating the Application (Step-by-Step Guide)](#-operating-the-application-step-by-step-guide)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Automated Testing & Security Suite](#-automated-testing--security-suite)
- [Production Deployment Guide (Neon + Render + Vercel)](#-production-deployment-guide-neon--render--vercel)
- [Demo Credentials](#-demo-credentials)
- [Documentation Directory](#-documentation-directory)

---

## 🌟 Project Overview

**FolioVerse** provides a secure, high-performance RESTful API paired with a modern, responsive single-page application:
- **Public Access**: Unauthenticated visitors can browse all books, search by title, filter by author, filter by literature (Bengali & English), sort by price, view book details, submit contact inquiries, and register as a Buyer or Seller.
- **Zero-Trust Access**: Authenticated users holding a valid DRF Token can perform role-specific operations (create, update, moderate, delete books, manage shopping carts, checkout with mobile banking, and approve customer orders) while strictly prevented from IDOR tampering.
- **Over 2,000+ realistic book records** across 5 curated genres: Literature & Novel (Bengali & English), Science, Technology, Fiction, and Music.

---

## 🛡️ 4-Layer Security Hardening

FolioVerse has undergone comprehensive 4-layer application security engineering:

### Layer 1: Network, Transport & Edge Configuration
- **CORS Hardening**: Strict origins configured via `CORS_ALLOWED_ORIGINS` (no wildcards with credentials). Regex support for Vercel/Render preview environments.
- **HTTP Security Headers**: Enforced via `SecurityHeadersMiddleware`:
  - `Content-Security-Policy`: Baseline default-src `'self'`, frame-ancestors `'none'`.
  - `X-Content-Type-Options: nosniff`: Neutralizes MIME-type sniffing.
  - `X-Frame-Options: DENY`: Prevents UI redressing and clickjacking.
  - `Referrer-Policy: strict-origin-when-cross-origin`: Minimizes referrer leakage.
  - `Permissions-Policy`: Restricts camera, microphone, and geolocation.
- **HTTPS & Transport Security**: `SECURE_SSL_REDIRECT`, `SECURE_PROXY_SSL_HEADER`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SESSION_COOKIE_HTTPONLY`, `SameSite=Lax`, and 1-year HSTS (`SECURE_HSTS_SECONDS = 31536000`).

### Layer 2: API Gateway & Authentication Hardening
- **Composite Rate Throttling**:
  - `LoginCompositeRateThrottle`: Combines Client IP + Username/Email (`f"{ip}:{username}"`) with a strict burst rate of `5/minute` to stop credential stuffing.
  - `LoginIpRateThrottle`: Limits single-IP login attempts (`5/minute`).
  - `AuthAnonRateThrottle`: Limits registration bursts (`10/minute`).
- **Token Rotation & Session Termination**:
  - Automatically rotates authentication tokens on every login (older tokens are destroyed).
  - On `/api/logout/`, deletes active tokens and flushes server session states.

### Layer 3: Business Logic & Zero-Trust Access Control
- **Eliminating IDOR (Broken Object Level Authorization)**:
  - `IsOwnerOrReadOnly` ensures users can NEVER modify (`PUT`/`PATCH`) or `DELETE` books listed by another seller (`HTTP 403 Forbidden`).
  - `IsOrderParticipantOrAdmin` scopes order querysets strictly to the authenticated buyer or item seller; anonymous order listing is blocked to protect customer PII.
  - `IsContactManagerOrSubmitOnly` allows visitor contact submissions while restricting inquiry reading/moderation to store administrators.
  - Restricted `/api/seed-database/` to administrators or development mode.
- **Input Sanitization & Mass Assignment**:
  - Locked down `read_only_fields` on `BookSerializer` (`seller`, `seller_username`, `status`, `id`) and `UserSerializer` (`is_staff`, `is_superuser`).
  - Sanitized rich-text fields with `django.utils.html.escape()` to prevent Stored XSS.
  - Validated URLs against SSRF and `javascript:` pseudoprotocols.

### Layer 4: Secrets, Data & CI/CD Pipeline
- **Production Secret Validation**: Requires `SECRET_KEY` via environment variable when `DEBUG=False` (raises `ImproperlyConfigured` rather than falling back).
- **Hardened `.gitignore`**: Excludes all `.env*`, `*.pem`, `*.key`, and `*.cert` files while preserving example templates.
- **Automated CI/CD Workflow (`.github/workflows/security-audit.yml`)**:
  - Runs `pip-audit -r backend/requirements.txt` for Python CVE scanning.
  - Runs `bandit -r backend/` for Static Application Security Testing (SAST).
  - Runs `python manage.py check --deploy` for production configuration checks.
  - Runs `npm audit --audit-level=high` for frontend dependency supply-chain security.

---

## 🚀 Key Features & Operations

### 1. Role-Based Access Control (RBAC)
- **Store Admin (`admin`)**: Complete catalog oversight, user and inquiry management, store analytics, and global order moderation.
- **Book Seller (`seller_demo`)**: Merchant dashboard for observing incoming orders, inspecting buyer shipping details, managing inventory, editing prices, and progressing the fulfillment pipeline.
- **Book Buyer (`buyer_demo`)**: Catalog browsing, multi-item cart management, simulated MFS payment checkout, and personal order tracking.

### 2. Buyer Experience & Atomic Checkout
- Interactive multi-item cart with persistent storage.
- Atomic checkout using Django database transactions and row-level locking (`select_for_update`) to prevent inventory race conditions.
- Automatic inventory status transitions: `available` $\rightarrow$ `low_stock` ($\le 3$) $\rightarrow$ `sold` ($= 0$).

### 3. Dedicated Seller Portal & Fulfillment
- Order status lifecycle: `confirmed` $\rightarrow$ `processing` $\rightarrow$ `shipped` $\rightarrow$ `delivered`.
- Inline price editing with validation (enforces a minimum floor of ৳180).
- Inventory increment/decrement with real-time stock alert badges.

### 4. Interactive MFS Payment Gateway Simulator
- Multi-provider support for **bKash**, **Nagad**, and **Rocket**.
- Dynamic QR code generation for mobile banking simulation.
- 6-digit carrier SMS OTP dispatch with auto-fill simulation.
- 5-digit encrypted PIN verification with masked PIN pad.
- Atomic settlement transitioning orders to `paid` with verified transaction IDs.

### 5. Catalog Taxonomy & Search Filtering
- Real-time search by title, author, and description.
- Filtering by category (`Science`, `Technology`, `Fiction`, `Literature & Novel`, `Music`), subcategory, language, condition, and availability.
- Ordering by price (ascending/descending), published date, stock, and ID.

---

## 📂 Architecture & Directory Structure

```text
FolioVerse/
├── .github/
│   └── workflows/
│       └── security-audit.yml                      # Automated CI/CD security scanner
├── .env.example                                    # Root environment template
├── .gitignore                                      # Project-wide Git ignore (Hardened)
├── README.md                                       # Complete Project Documentation
├── render.yaml                                     # Render production service configuration
│
├── doc/                                            # Detailed Engineering Documentation
│   ├── backend.md                                  # DRF, PostgreSQL, concurrency & endpoints
│   ├── deployment_guide.md                         # Neon + Render + Vercel Deployment Manual
│   ├── frontend.md                                 # React 19, Tailwind CSS & components
│   ├── paymentGatwayGuide.md                       # MFS Payment Gateway architecture
│   ├── seller_guide.md                             # Step-by-step Seller Operations manual
│   ├── system.md                                   # High-level architecture & ERD
│   ├── prd.md                                      # Product Requirements Document
│   └── trd.md                                      # Technical Requirements Document
│
├── backend/                                        # Django REST Framework Service
│   ├── .env.example                                # Hardened backend environment template
│   ├── manage.py                                   # Django management script
│   ├── requirements.txt                            # Python dependencies
│   ├── folioverse_api/                             # Core Django project config
│   │   ├── settings.py                             # Hardened settings (CORS, CSP, Transport)
│   │   ├── middleware.py                           # SecurityHeadersMiddleware (CSP, HSTS)
│   │   ├── urls.py                                 # Main API routes & protected seed endpoint
│   │   ├── wsgi.py / asgi.py
│   ├── accounts/                                   # Authentication & User Management App
│   │   ├── models.py / serializers.py / views.py
│   │   ├── throttles.py                            # Composite IP+Username rate throttles
│   │   ├── urls.py                                 # /api/register/, /api/login/, /api/user/
│   │   └── tests.py                                # Auth unit tests
│   └── books/                                      # Books, Orders & Payments App
│       ├── models.py                               # Book, Order, OrderItem, ContactInquiry, PaymentTransaction
│       ├── permissions.py                          # IsOwnerOrReadOnly, IsOrderParticipantOrAdmin
│       ├── serializers.py                          # XSS-sanitized serializers with locked fields
│       ├── views.py                                # BookViewSet, OrderViewSet, ContactViewSet
│       ├── test_security.py                        # 14-test Security Hardening test suite
│       ├── tests.py                                # Core bookstore test suite (22 tests)
│       └── management/commands/
│           ├── seed_bookstore.py                   # 2,000-book catalog seeder
│           └── create_demo_accounts.py             # Provisions admin, seller, buyer accounts
│
└── frontend/                                       # React 19 + Tailwind CSS Client
    ├── index.html                                  # HTML entry point with SEO metadata
    ├── package.json                                # Node dependencies
    ├── vercel.json                                 # Vercel SPA routing rewrites
    ├── vite.config.js                              # Vite build configuration
    └── src/
        ├── App.jsx                                 # Root component & page routing
        ├── services/api.js                         # Centralized Axios client with token interceptor
        ├── context/                                # Auth, Cart, and Theme contexts
        └── components/                             # UI components (Navbar, Cart, Modals, Gateway)
```

---

## 💻 Local Setup & Running the Project

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL (or SQLite for quick local test)
- Mozilla Firefox or Google Chrome

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1
# On Linux / macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials or use local SQLite

# Apply database migrations
python manage.py migrate

# Seed demo accounts and catalog
python manage.py create_demo_accounts
python manage.py seed_bookstore --target 2000

# Start backend server on port 8000
python manage.py runserver 127.0.0.1:8000
```
Backend API will be accessible at: `http://127.0.0.1:8000/api/`

### 2. Frontend Setup
In a new terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```
Frontend Web Application will be accessible at: `http://127.0.0.1:5173/`

### 3. Launching via Firefox
On Windows:
```powershell
Start-Process "C:\Program Files\Mozilla Firefox\firefox.exe" "http://127.0.0.1:5173/"
```
On Linux / macOS:
```bash
firefox http://127.0.0.1:5173/
```

---

## 🕹️ Operating the Application (Step-by-Step Guide)

### Flow A: Buyer Experience (Browse & Purchase)
1. Open `http://127.0.0.1:5173/` in your browser.
2. Click **Login** in the top navigation bar.
3. Click the **"1-Click Buyer Login"** button (or enter `buyer_demo` / `buyer12345`).
4. Browse catalog tabs: **All Books**, **Literature & Novel**, **Science**, **Technology**, **Fiction**, or **Music**.
5. Use the search bar to search for titles (e.g., *"Rabindranath"*, *"Physics"*).
6. Click **Add to Cart** on any available book.
7. Click the **Cart** icon in the top right to open the drawer.
8. Click **Checkout**.
9. Select your preferred payment method (**bKash**, **Nagad**, or **Rocket**).
10. Click **Proceed to Payment**:
    - Step 1: Scan the generated dynamic QR code, or click **"Simulate App Scan"**.
    - Step 2: Receive the 6-digit SMS OTP, click **"Auto-Fill OTP"**, and verify.
    - Step 3: Enter the simulated 5-digit PIN and click **Confirm**.
11. View your instant order clearance receipt!
12. Click your avatar $\rightarrow$ **"My Orders"** to view your complete purchase analytics and order history.

### Flow B: Seller Operations (Fulfill Orders & Manage Catalog)
1. Log in using the **"1-Click Seller Login"** (or enter `seller_demo` / `seller12345`).
2. Notice the amber **Merchant Badge** in the top navigation bar.
3. Click **"Seller Portal"**:
   - **Metrics Overview**: View total books listed, total revenue earned, sold copies, and pending fulfillments.
   - **Incoming Orders**: Review customer full name, contact phone, delivery address, ordered books, and payment clearance status (`bKash Paid`, `COD Pending`).
   - **Fulfillment Pipeline**: Click **"Approve & Ship"** to advance orders from `confirmed` $\rightarrow$ `processing` $\rightarrow$ `shipped` $\rightarrow$ `delivered`.
   - **Catalog Moderation**: Use the inline price editor to adjust prices (validated to a minimum of ৳180).
   - **Stock Updates**: Quickly update available stock or add new book titles.

### Flow C: Store Administrator (Global Oversight)
1. Log in as administrator using `admin` / `admin12345`.
2. Inspect storewide metrics across all sellers, buyers, and order channels.
3. Moderate any book listing or update order states across the marketplace.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description | Auth & Permission Level |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/` | API Root and documentation index | Public (`AllowAny`) |
| `GET` | `/api/health/` | API health check endpoint | Public (`AllowAny`) |
| `POST` | `/api/register/` | Register new user account | Public (`AuthAnonRateThrottle: 10/min`) |
| `POST` | `/api/login/` | Authenticate & rotate token | Public (`LoginCompositeRateThrottle: 5/min`) |
| `GET` | `/api/user/` | Retrieve authenticated user profile | Authenticated (`IsAuthenticated`) |
| `POST` | `/api/logout/` | Revoke token and terminate session | Authenticated (`IsAuthenticated`) |
| `GET` | `/api/books/` | List books (paginated 10/page) | Public (`AllowAny`) |
| `POST` | `/api/books/` | List a new book for sale | Authenticated Seller (`IsAuthenticated`) |
| `GET` | `/api/books/<id>/` | Retrieve book detail by ID | Public (`AllowAny`) |
| `PUT` | `/api/books/<id>/` | Full update of book details | Book Owner or Admin (`IsOwnerOrReadOnly`) |
| `PATCH` | `/api/books/<id>/` | Partial update of book details | Book Owner or Admin (`IsOwnerOrReadOnly`) |
| `DELETE` | `/api/books/<id>/` | Delist/delete book | Book Owner or Admin (`IsOwnerOrReadOnly`) |
| `POST` | `/api/books/<id>/buy/` | Atomic single-book purchase | Public / Buyer (`AllowAny`) |
| `GET` | `/api/books/taxonomy/` | Category & subcategory breakdown | Public (`AllowAny`) |
| `GET` | `/api/orders/` | List orders (strictly user-scoped) | Authenticated (`IsOrderParticipantOrAdmin`) |
| `POST` | `/api/orders/` | Place cart order with atomic lock | Public / Buyer (`AllowAny`) |
| `GET` | `/api/orders/<id>/` | Retrieve order details & items | Order Owner or Admin (`IsOrderParticipantOrAdmin`) |
| `POST` | `/api/orders/<id>/update-status/` | Advance fulfillment status | Order Seller or Admin (`IsAuthenticated`) |
| `GET` | `/api/orders/buyer-summary/` | Buyer purchase analytics & metrics | Order Owner or Admin (`IsAuthenticated`) |
| `GET` | `/api/orders/seller-summary/` | Seller dashboard analytics & items | Authenticated Seller (`IsAuthenticated`) |
| `POST` | `/api/orders/gateway-initiate/` | Initiate MFS Payment Session | Public / Session (`AllowAny`) |
| `POST` | `/api/orders/gateway-send-otp/` | Dispatch simulated SMS OTP | Public / Session (`AllowAny`) |
| `POST` | `/api/orders/gateway-verify-otp/` | Verify 6-digit SMS OTP | Public / Session (`AllowAny`) |
| `POST` | `/api/orders/gateway-confirm-pin/` | Verify PIN & settle payment | Public / Session (`AllowAny`) |
| `POST` | `/api/contact/` | Submit visitor contact message | Public (`AllowAny`) |
| `GET` | `/api/contact/` | Review contact inquiries | Store Admin Only (`IsAdminUser`) |

---

## 🧪 Automated Testing & Security Suite

Execute the complete test suite (36 tests including 14 security regression tests):

```bash
cd backend
python manage.py test
```

### Test Suite Coverage:
- **`books.test_security` (14 Tests)**:
  - Verifies User B cannot `PATCH` or `DELETE` User A's book (`HTTP 403 Forbidden`).
  - Verifies rapid login attempts trigger `HTTP 429 Too Many Requests`.
  - Verifies token rotation on login and token revocation on logout.
  - Verifies User B cannot inspect or modify User A's order (`HTTP 404/403`).
  - Verifies anonymous users cannot list customer contact messages.
  - Verifies Stored XSS input sanitization.
  - Verifies CSP, HSTS, and frame protection security headers.
- **`books.tests` (18 Tests)**:
  - Verifies unauthenticated book browsing, search, author filter, literature filter, price ordering, and pagination.
  - Verifies atomic inventory decrement and out-of-stock validation.
- **`accounts.tests` (4 Tests)**:
  - Verifies user registration, duplicate username rejection, login authentication, and invalid credential handling.

---

## 🚀 Production Deployment Guide (Neon + Render + Vercel)

FolioVerse is architected for zero-cost, high-performance production deployment:

### 1. Database: Neon Serverless PostgreSQL
1. Create a free PostgreSQL 16 database at [neon.tech](https://neon.tech/).
2. Copy your **Pooled Connection String** (`DATABASE_URL`).

### 2. Backend API: Render Web Service
1. Connect your GitHub repository to [render.com](https://render.com/).
2. Create a Web Service with:
   - **Root Directory**: `backend`
   - **Build Command**: `bash build.sh`
   - **Start Command**: `gunicorn folioverse_api.wsgi:application --bind 0.0.0.0:$PORT`
3. Set Environment Variables:
   - `DEBUG`: `False`
   - `SECRET_KEY`: *(Generate a 64-character secret key)*
   - `ALLOWED_HOSTS`: `.onrender.com,localhost,127.0.0.1`
   - `CORS_ALLOWED_ORIGINS`: `https://folioverse.vercel.app,http://localhost:5173`
   - `SECURE_SSL_REDIRECT`: `True`
   - `SECURE_HSTS_SECONDS`: `31536000`
   - `DATABASE_URL`: *(Your Neon connection string)*

### 3. Frontend Web App: Vercel
1. Import your GitHub repository to [vercel.com](https://vercel.com/).
2. Set **Root Directory** to `frontend`.
3. Set Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-render-service.onrender.com/api`
4. Click **Deploy**. Vercel will build the SPA bundle with routing rewrites.

For complete details, see [doc/deployment_guide.md](file:///f:/Projects/FolioVerse/doc/deployment_guide.md).

---

## 🔑 Demo Credentials

| Role | Username | Password | Purpose & Capabilities |
| :--- | :--- | :--- | :--- |
| **Store Administrator** | `admin` | `admin12345` | Global oversight, inquiry moderation, and user management. |
| **Book Seller** | `seller_demo` | `seller12345` | Dedicated Seller Portal, order observation, fulfillment pipeline, and price floor moderation. |
| **Book Buyer** | `buyer_demo` | `buyer12345` | Catalog browsing, multi-item cart management, and MFS payment checkout. |

---

## 📚 Documentation Directory

Detailed specifications and architectural guides are available in the [doc/](file:///f:/Projects/FolioVerse/doc/) directory:
- [Deployment Guide](file:///f:/Projects/FolioVerse/doc/deployment_guide.md): Step-by-step Neon, Render, and Vercel setup.
- [Backend Documentation](file:///f:/Projects/FolioVerse/doc/backend.md): DRF architecture, serialization, atomic transactions.
- [Frontend Documentation](file:///f:/Projects/FolioVerse/doc/frontend.md): React 19 structure, Tailwind styles, and state management.
- [Payment Gateway Guide](file:///f:/Projects/FolioVerse/doc/paymentGatwayGuide.md): MFS simulation lifecycle and security state machine.
- [Seller Guide](file:///f:/Projects/FolioVerse/doc/seller_guide.md): Seller operations, fulfillment, and pricing manual.
- [System Architecture](file:///f:/Projects/FolioVerse/doc/system.md): High-level system design and entity-relationship model.
