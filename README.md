# FolioVerse — Enterprise Book Store REST API & Web Application

[![Django](https://img.shields.io/badge/Django-5.2-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.16-A30000?style=for-the-badge&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.2_Lua_Engine-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?style=for-the-badge&logo=react-router&logoColor=white)](https://reactrouter.com/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-49%2F49%20Passing-success?style=for-the-badge&logo=pytest&logoColor=white)](https://github.com/BipronathSaha12/FolioVerse)
[![Security Hardened](https://img.shields.io/badge/Security-4--Layer%20Hardened-blueviolet?style=for-the-badge&logo=shield&logoColor=white)](https://github.com/BipronathSaha12/FolioVerse)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge&logo=apache)](https://opensource.org/licenses/Apache-2.0)

A full-stack, enterprise-grade Book Store Management System and REST API. Built with **Django REST Framework (DRF)**, **PostgreSQL (Neon)**, **Redis**, **React 19**, **React Router v7**, and **Tailwind CSS v4**, featuring:
- **Read/Write Splitting & Redis Inventory Lua Engine**: Horizontal scale with database routing and atomic flash-sale stock reservation for 100k+ concurrent active shoppers.
- **First-Class User Roles & RBAC**: Database-authoritative role enums (`ADMIN`, `SELLER`, `BUYER`) eliminating client-side guessing.
- **Deep Linking with React Router v7**: Direct browser paths (`/books/:id`, `/cart`, `/checkout`) supporting bookmarks, native history, and SEO indexing.
- **4-Layer Defense-in-Depth Security**: Composite IP+Username rate throttling, zero-trust object permissions, Stored XSS sanitization, CSP, and HSTS headers.
- **Unified Dashboards & Fulfillment**: Dedicated portals for Store Administrators, Book Sellers, and Buyers with real-time order tracking, payment verification, and line item moderation.
- **Interactive MFS Payment Gateway**: Simulated carrier bKash, Nagad, and Rocket checkouts with dynamic QR code scanning, 6-digit SMS OTP verification, and 5-digit encrypted PIN settlement.

---

## 📖 Table of Contents
- [Project Overview](#-project-overview)
- [Enterprise Architecture & Concurrency](#-enterprise-architecture--concurrency)
  - [1. Read/Write Database Splitting](#1-readwrite-database-splitting)
  - [2. Redis Inventory Lua Engine (Flash-Sale Safe)](#2-redis-inventory-lua-engine-flash-sale-safe)
  - [3. First-Class User Roles (RBAC)](#3-first-class-user-roles-rbac)
  - [4. React Router v7 & Deep Linking](#4-react-router-v7--deep-linking)
- [4-Layer Security Hardening](#-4-layer-security-hardening)
- [Key Features & Dashboard Operations](#-key-features--dashboard-operations)
  - [1. Store Administrator Dashboard](#1-store-administrator-dashboard)
  - [2. Dedicated Seller Operations Portal](#2-dedicated-seller-operations-portal)
  - [3. Buyer Experience & Checkout](#3-buyer-experience--checkout)
  - [4. Interactive MFS Payment Gateway](#4-interactive-mfs-payment-gateway)
- [Architecture & Directory Structure](#-architecture--directory-structure)
- [Local Setup & Running the Project](#-local-setup--running-the-project)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Automated Testing & Security Suite (49 Tests)](#-automated-testing--security-suite-49-tests)
- [Production Deployment Guide (Neon + Render + Vercel)](#-production-deployment-guide-neon--render--vercel)
- [Demo Credentials](#-demo-credentials)
- [Documentation Directory](#-documentation-directory)

---

## 🌟 Project Overview

**FolioVerse** provides a secure, high-performance RESTful API paired with a modern, responsive web application:
- **Public Access**: Unauthenticated visitors can browse all books, search by title and author, filter by literature (Bengali & English), sort by price, view book details, submit contact inquiries, and register as a Buyer or Seller.
- **Zero-Trust Access**: Authenticated users holding a valid DRF Token perform role-specific operations (creating and moderating books, managing shopping carts, checking out with mobile banking, approving customer orders) while strictly prevented from IDOR tampering.
- **Over 2,000+ realistic book records** across 5 curated genres: Literature & Novel (Bengali & English), Science, Technology, Fiction, and Music.

---

## 🏗️ Enterprise Architecture & Concurrency

### 1. Read/Write Database Splitting
FolioVerse deploys a database router (`PrimaryReplicaRouter` in `backend/folioverse_api/db_router.py`) to decouple write operations from heavy catalog browsing:
- **`default` (Write Master)**: Handles all transactions, data mutations, order persistence, and row-level locks (`select_for_update`).
- **`read_replica` (Read Replicas)**: Serves catalog browsing, genre taxonomy, and search queries, unlocking horizontal scaling.

### 2. Redis Inventory Lua Engine (Flash-Sale Safe)
During flash sales on popular books, standard database transactions can suffer from lock contention. FolioVerse implements an atomic Redis Lua engine (`backend/books/redis_inventory.py`):
1. **Sub-Millisecond Reservation**: The Lua script atomically inspects and decrements stock in Redis memory.
2. **PostgreSQL Persistence**: The order and database stock updates are written inside an atomic transaction.
3. **Compensating Rollback**: If PostgreSQL persistence fails or times out, the engine automatically rolls back the reserved Redis stock, ensuring zero stock leakage.

### 3. First-Class User Roles (RBAC)
User permissions are strictly enforced through a database-backed enum on `UserProfile` (`accounts.models.py`):
```python
class Role(models.TextChoices):
    ADMIN = 'admin', 'Administrator'
    SELLER = 'seller', 'Book Seller'
    BUYER = 'buyer', 'Book Buyer'
```
Eliminates client-side privilege inference and enforces true enterprise role-based authorization across all endpoints.

### 4. React Router v7 & Deep Linking
Upgraded from monolithic modal state to first-class URL routing:
- `/`: Primary storefront with catalog search, genre filters, and hero banner.
- `/books/:id`: Deep-linkable book detail page with metadata, cover image, and instant buy.
- `/cart`: Full-page shopping cart view.
- `/checkout`: Dedicated checkout flow with shipping address and payment gateway selection.

---

## 🛡️ 4-Layer Security Hardening

FolioVerse has undergone comprehensive 4-layer application security engineering:

### Layer 1: Network, Transport & Edge Configuration
- **CORS Hardening**: Strict origins configured via `CORS_ALLOWED_ORIGINS` (no wildcards with credentials).
- **HTTP Security Headers**: Enforced via `SecurityHeadersMiddleware`:
  - `Content-Security-Policy`: Baseline `default-src 'self'`.
  - `X-Content-Type-Options: nosniff`: Neutralizes MIME-type sniffing.
  - `X-Frame-Options: DENY`: Prevents UI redressing and clickjacking.
  - `Referrer-Policy: strict-origin-when-cross-origin`: Minimizes referrer leakage.
  - `Permissions-Policy`: Restricts camera, microphone, and geolocation.
- **HTTPS & Transport Security**: `SECURE_SSL_REDIRECT`, `SECURE_PROXY_SSL_HEADER`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SESSION_COOKIE_HTTPONLY`, `SameSite=Lax`, and 1-year HSTS (`SECURE_HSTS_SECONDS = 31536000`).

### Layer 2: API Gateway & Authentication Hardening
- **Composite Rate Throttling**:
  - `LoginCompositeRateThrottle`: Combines Client IP + Username/Email (`f"{ip}:{username}"`) with a strict burst rate of `5/minute` to stop brute-force attacks.
  - `AuthAnonRateThrottle`: Limits registration bursts to `10/minute`.
- **Token Rotation & Session Termination**:
  - Automatically rotates authentication tokens on every login (older tokens are destroyed).
  - On `/api/logout/`, deletes active tokens and flushes server session states.

### Layer 3: Business Logic & Zero-Trust Access Control
- **Eliminating IDOR**:
  - `IsOwnerOrReadOnly` ensures users can NEVER modify or delete books listed by another seller (`HTTP 403 Forbidden`).
  - `IsOrderParticipantOrAdmin` scopes order querysets strictly to the authenticated buyer or item seller.
  - `IsContactManagerOrSubmitOnly` restricts contact message reading to store administrators.
- **Input Sanitization & Mass Assignment**:
  - Locked down `read_only_fields` on `BookSerializer` (`seller`, `seller_username`, `status`, `id`) and `UserSerializer` (`is_staff`, `is_superuser`).
  - Sanitized rich-text fields with `django.utils.html.escape()` to prevent Stored XSS.

### Layer 4: Secrets, Data & CI/CD Pipeline
- **Production Secret Validation**: Requires `SECRET_KEY` via environment variable when `DEBUG=False`.
- **Automated CI/CD Workflow (`.github/workflows/security-audit.yml`)**:
  - Runs `pip-audit -r backend/requirements.txt` for Python CVE scanning.
  - Runs `bandit -r backend/` for Static Application Security Testing (SAST).
  - Runs `python manage.py check --deploy` for production configuration checks.
  - Runs `npm audit --audit-level=high` for frontend dependency supply-chain security.

---

## 🚀 Key Features & Dashboard Operations

### 1. Store Administrator Dashboard
- **Executive Revenue Metrics**: Gross Platform Volume, Cleared Revenue, and Orders Pending Fulfillment computed using database SQL pushdown aggregations (`/api/orders/admin-summary/`).
- **Payment Method Settlement Breakdown**: Real-time order count and BDT revenue distribution across **bKash**, **Nagad**, **Rocket**, and **Cash on Delivery (COD)**.
- **Catalog Health**: Live book count, stock units in PostgreSQL, low stock alerts ($\le 3$), and out-of-stock counts.
- **User Demographics**: Count of registered buyers vs verified sellers.
- **Live Order Moderation**: Administrative action buttons to *Confirm Paid*, *Approve Processing*, *Mark Shipped*, and *Mark Delivered*.

### 2. Dedicated Seller Operations Portal
- **Incoming Buyer Orders**: Complete visibility into customer names, contact phone numbers, delivery addresses, ordered books, unit prices, and payment statuses.
- **Unified Catalog Attribution**: Store catalog books and unassigned items are linked to `seller_demo`, ensuring all customer purchases appear on the seller dashboard.
- **Fulfillment Pipeline**: Advance orders from `confirmed` $\rightarrow$ `processing` $\rightarrow$ `shipped` $\rightarrow$ `delivered`.
- **Catalog Moderation**: Inline price editor with minimum ৳180.00 floor validation and fast stock restock buttons.

### 3. Buyer Experience & Checkout
- Deep-linked catalog browsing with search and multi-genre filtering.
- Multi-item persistent shopping cart.
- Atomic Instant Buy (`/api/books/<id>/buy/`) and Cart Checkout (`/api/orders/`) persisting orders and order items in PostgreSQL.
- Buyer purchase history with tracking states.

### 4. Interactive MFS Payment Gateway
- Supports **bKash**, **Nagad**, and **Rocket**.
- Dynamic QR code generation with simulation of smartphone scanning.
- 6-digit carrier SMS OTP dispatch with auto-fill simulation.
- 5-digit encrypted PIN verification with masked PIN pad.
- Atomic settlement transitioning orders to `paid` with verified transaction IDs.

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
│   ├── backend.md                                  # DRF, PostgreSQL, Redis Lua engine & endpoints
│   ├── deployment_guide.md                         # Neon + Redis + Render + Vercel Deployment Manual
│   ├── frontend.md                                 # React 19, React Router v7 & Tailwind CSS v4
│   ├── paymentGatwayGuide.md                       # MFS Payment Gateway architecture
│   ├── seller_guide.md                             # Step-by-step Seller Operations manual
│   ├── system.md                                   # High-level architecture & ERD
│   ├── prd.md                                      # Product Requirements Document
│   └── trd.md                                      # Technical Requirements Document
│
├── backend/                                        # Django REST Framework Service
│   ├── manage.py                                   # Django management script
│   ├── requirements.txt                            # Python dependencies
│   ├── folioverse_api/                             # Core Django project config
│   │   ├── db_router.py                            # Read/Write splitting PrimaryReplicaRouter
│   │   ├── settings.py                             # Hardened settings & Redis cache config
│   │   ├── middleware.py                           # SecurityHeadersMiddleware (CSP, HSTS)
│   │   └── urls.py                                 # Main API routes
│   ├── accounts/                                   # Authentication & User Management App
│   │   ├── models.py                               # UserProfile with Role enum (admin, seller, buyer)
│   │   ├── serializers.py / views.py / urls.py
│   │   └── throttles.py                            # Composite IP+Username rate throttles
│   └── books/                                      # Books, Orders & Payments App
│       ├── models.py                               # Book, Order, OrderItem, PaymentTransaction
│       ├── payment_gateway.py                      # MFS Payment Gateway simulator
│       ├── redis_inventory.py                      # Redis Lua stock reservation & rollback
│       ├── permissions.py / serializers.py / views.py
│       ├── test_security.py                        # 14-test Security Hardening test suite
│       ├── tests.py                                # Core bookstore test suite (31 tests)
│       └── management/commands/
│           ├── seed_bookstore.py                   # 2,000-book catalog seeder
│           └── create_demo_accounts.py             # Provisions demo accounts & sample orders
│
└── frontend/                                       # React 19 + React Router v7 Client
    ├── index.html                                  # HTML entry point with SEO metadata
    ├── package.json                                # Node dependencies
    ├── vercel.json                                 # Vercel SPA routing rewrites
    ├── vite.config.js                              # Vite build configuration
    └── src/
        ├── App.jsx                                 # React Router v7 route declarations
        ├── services/api.js                         # Centralized Axios client
        ├── context/                                # Auth and Cart state contexts
        ├── pages/                                  # Deep-linked page components
        │   ├── HomePage.jsx                        # Main catalog view
        │   ├── BookDetailPage.jsx                  # /books/:id route
        │   ├── CartPage.jsx                        # /cart route
        │   └── CheckoutPage.jsx                    # /checkout route
        └── components/                             # UI components (Navbar, Cart, Modals, Portals)
```

---

## 💻 Local Setup & Running the Project

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL (or SQLite for local development)
- Redis server (or local Redis container / memory fallback)

### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1    # On Windows
# source venv/bin/activate     # On Linux / macOS

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Apply database migrations
python manage.py migrate

# Seed demo accounts and catalog
python manage.py create_demo_accounts
python manage.py seed_bookstore --target 2000

# Start backend server on port 8000
python manage.py runserver 127.0.0.1:8000
```
Backend API accessible at: `http://127.0.0.1:8000/api/`

### 2. Frontend Setup
In a new terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend accessible at: `http://localhost:5173/`

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
| `POST` | `/api/books/<id>/buy/` | Atomic buy & order generation | Public / Buyer (`AllowAny`) |
| `GET` | `/api/books/taxonomy/` | Category & subcategory breakdown | Public (`AllowAny`) |
| `GET` | `/api/orders/` | List orders (strictly user-scoped) | Authenticated (`IsOrderParticipantOrAdmin`) |
| `POST` | `/api/orders/` | Place cart order with atomic lock | Public / Buyer (`AllowAny`) |
| `GET` | `/api/orders/<id>/` | Retrieve order details & items | Order Owner or Admin (`IsOrderParticipantOrAdmin`) |
| `POST` | `/api/orders/<id>/update-status/` | Advance fulfillment status | Order Seller or Admin (`IsAuthenticated`) |
| `GET` | `/api/orders/buyer-summary/` | Buyer purchase analytics & metrics | Order Owner or Admin (`IsAuthenticated`) |
| `GET` | `/api/orders/seller-summary/` | Seller dashboard analytics & items | Authenticated Seller (`IsAuthenticated`) |
| `GET` | `/api/orders/admin-summary/` | Executive storewide analytics | Store Admin Only (`IsAdminUser`) |
| `POST` | `/api/orders/process-payment/` | Direct automated payment clearance | Public / Session (`AllowAny`) |
| `POST` | `/api/orders/gateway-initiate/` | Initiate MFS Payment Session | Public / Session (`AllowAny`) |
| `POST` | `/api/orders/gateway-send-otp/` | Dispatch simulated SMS OTP | Public / Session (`AllowAny`) |
| `POST` | `/api/orders/gateway-verify-otp/` | Verify 6-digit SMS OTP | Public / Session (`AllowAny`) |
| `POST` | `/api/orders/gateway-confirm-pin/` | Verify PIN & settle payment | Public / Session (`AllowAny`) |
| `POST` | `/api/contact/` | Submit visitor contact message | Public (`AllowAny`) |
| `GET` | `/api/contact/` | Review contact inquiries | Store Admin Only (`IsAdminUser`) |

---

## 🧪 Automated Testing & Security Suite (49 Tests)

Execute the complete automated test suite:

```bash
cd backend
python manage.py test books accounts
```

```text
Ran 49 tests in 220.14s

OK
Destroying test database for alias 'default'...
Found 49 test(s).
System check identified no issues (0 silenced).
```

### Coverage Breakdown:
- **`books.test_security` (14 Tests)**:
  - Verifies User B cannot `PATCH` or `DELETE` User A's book (`HTTP 403 Forbidden`).
  - Verifies rapid login attempts trigger `HTTP 429 Too Many Requests`.
  - Verifies token rotation on login and token revocation on logout.
  - Verifies User B cannot inspect or modify User A's order (`HTTP 404/403`).
  - Verifies anonymous users cannot list customer contact messages.
  - Verifies Stored XSS input sanitization.
  - Verifies CSP, HSTS, and frame protection security headers.
- **`books.tests` (31 Tests)**:
  - Verifies unauthenticated book browsing, search, author filter, literature filter, price ordering, and pagination.
  - Verifies atomic inventory decrement via Redis Lua scripting and DB persistence.
  - Verifies multi-item cart checkout rollback compensation when inventory is insufficient.
  - Verifies instant `/buy/` endpoint creates `Order` and `OrderItem` records in PostgreSQL.
  - Verifies `/api/orders/admin-summary/` aggregates gross volume, cleared revenue, and order counts.
  - Verifies `/api/orders/seller-summary/` provides incoming orders, customer details, and book covers.
- **`accounts.tests` (4 Tests)**:
  - Verifies user registration, duplicate username rejection, login authentication, and invalid credential handling.

---

## 🚀 Production Deployment Guide (Neon + Render + Vercel)

1. **Database**: [Neon](https://neon.tech/) Serverless PostgreSQL 16 with Connection Pooling.
2. **In-Memory Cache**: [Upstash Redis](https://upstash.com/) for flash-sale stock reservation.
3. **Backend API**: [Render](https://render.com/) Web Service (`backend` root directory, `build.sh` build command, Gunicorn WSGI).
4. **Frontend Web App**: [Vercel](https://vercel.com/) (`frontend` root directory, React Router v7 rewrites).

For complete step-by-step instructions, see [doc/deployment_guide.md](file:///f:/Projects/FolioVerse/doc/deployment_guide.md).

---

## 🔑 Demo Credentials

| Role | Username | Password | Purpose & Capabilities |
| :--- | :--- | :--- | :--- |
| **Store Administrator** | `admin` | `admin12345` | Global oversight, executive revenue analytics, payment method breakdown, and order moderation. |
| **Book Seller** | `seller_demo` | `seller12345` | Dedicated Seller Portal, incoming order review, fulfillment pipeline, and price floor moderation. |
| **Book Buyer** | `buyer_demo` | `buyer12345` | Catalog browsing, multi-item cart management, and MFS payment checkout. |

---

## 📚 Documentation Directory

Detailed engineering guides are available in the [doc/](file:///f:/Projects/FolioVerse/doc/) directory:
- [Backend Documentation](file:///f:/Projects/FolioVerse/doc/backend.md): DRF architecture, PostgreSQL, Redis Lua engine & endpoints.
- [Frontend Documentation](file:///f:/Projects/FolioVerse/doc/frontend.md): React 19, React Router v7, deep linking & components.
- [System Architecture](file:///f:/Projects/FolioVerse/doc/system.md): High-level system design, scalability, and entity-relationship model.
- [Seller Guide](file:///f:/Projects/FolioVerse/doc/seller_guide.md): Seller operations, order fulfillment, and pricing manual.
- [Deployment Guide](file:///f:/Projects/FolioVerse/doc/deployment_guide.md): Step-by-step Neon, Redis, Render, and Vercel setup.
- [Payment Gateway Guide](file:///f:/Projects/FolioVerse/doc/paymentGatwayGuide.md): MFS simulation lifecycle and security state machine.

---

## 📄 License

This project is licensed under the **Apache License, Version 2.0**. See the [LICENSE](file:///f:/Projects/FolioVerse/LICENSE) file for the full license text and patent grant details.

```text
Copyright 2026 Bipronath Saha (bipronathsaha@gmail.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```
