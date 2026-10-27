# FolioVerse — Enterprise Book Store REST API & Web Application

[![Django](https://img.shields.io/badge/Django-5.2-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.16-A30000?style=for-the-badge&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-22%2F22%20Passing-success?style=for-the-badge&logo=pytest&logoColor=white)](https://github.com/BipronathSaha12/FolioVerse)

A full-stack, enterprise-grade Book Store Management System and REST API developed for **Django Batch-9 Module-23 Assignment**. Built with **Django REST Framework (DRF)**, **PostgreSQL**, **React 19**, and **Tailwind CSS**, featuring Role-Based Access Control (RBAC) with dedicated **Store Admin**, **Book Seller**, and **Book Buyer** portals, an interactive **MFS Payment Gateway** (bKash, Nagad, Rocket), and catalog price moderation.

---

## 📖 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
  - [Role-Based Access Control (Admin, Seller, Buyer)](#1-role-based-access-control-rbac)
  - [Dedicated Seller Operations & Fulfillment Portal](#2-dedicated-seller-operations--fulfillment-portal)
  - [Interactive MFS Payment Gateway (Approach 3)](#3-interactive-mfs-payment-gateway-approach-3)
  - [Catalog Taxonomy & Price Moderation](#4-catalog-taxonomy--price-moderation)
- [Architecture & Directory Structure](#-architecture--directory-structure)
- [Tech Stack & Dependencies](#-tech-stack--dependencies)
- [Prerequisites](#-prerequisites)
- [Backend Setup & Installation](#-backend-setup--installation)
- [Frontend Setup & Installation](#-frontend-setup--installation)
- [Running the Project](#-running-the-project)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Filtering, Searching, Ordering & Pagination](#-filtering-searching-ordering--pagination)
- [API Throttling Limits](#-api-throttling-limits)
- [Testing the API (Automated Tests & Postman)](#-testing-the-api-automated-tests--postman)
- [Demo Credentials](#-demo-credentials)
- [Documentation Directory](#-documentation-directory)

---

## 🌟 Project Overview

**FolioVerse** provides a secure, high-performance RESTful API paired with a modern, responsive single-page application:
- **Public Access**: Unauthenticated visitors can browse all books, search by title, filter by author, filter by literature (Bengali & English), sort by price, view book details, and register as a Buyer or Seller.
- **Protected Actions**: Authenticated users holding a valid DRF Token can perform role-specific operations (create, update, moderate, delete books, manage shopping carts, checkout with mobile banking, and approve customer orders).
- **Core Assignment Requirements Satisfied**:
  - API & REST API Standards
  - `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` HTTP methods
  - `ModelViewSet` implementation with permission checks
  - Token-based Authentication (`Token <key>`)
  - Author Filtering (`?author=...`), Title Search (`?search=...`), Seller Filtering (`?seller=me`)
  - Ordering by Price (`?ordering=price` / `?ordering=-price`)
  - Pagination (customizable page size with sliding window pagination)
  - Rate Limiting / Throttling (Anon: 20 req/min, Authenticated: 50 req/min)
  - Comprehensive Postman Collection provided (`FolioVerse_BookStore.postman_collection.json`)

---

## 🚀 Key Features

### 1. Role-Based Access Control (RBAC)
FolioVerse clearly separates user responsibilities with distinct interface states:
- **Store Admin (`admin`)**: Storewide analytics, complete inventory controls, stock adjustments, and master order tracking.
- **Book Seller (`seller_demo`)**: Dedicated **Seller Dashboard** for real-time buyer order observation, customer contact inspection, order fulfillment approval, catalog listing, and inline price moderation. Seller interface omits buyer dashboard and cart lists to keep operations focused.
- **Book Buyer (`buyer_demo`)**: Catalog browsing, multi-item cart management, interactive payment checkout, and personal order tracking.

---

### 2. Dedicated Seller Operations & Fulfillment Portal
Accessible via the amber merchant badge in the top navigation:
- **Real-Time Order Observation**:
  - Inspect buyer details: customer full name, username, phone number, and email.
  - Delivery information: recipient shipping address and district.
  - Line items: specific titles ordered, author, quantities, and price breakdown.
  - Payment clearance badges: `bKash Paid`, `Nagad Paid`, `Rocket Paid`, `Card Paid`, or `Cash on Delivery (Pending)`.
- **Order Approval & Fulfillment Pipeline**:
  - Stage 1: `confirmed` $\rightarrow$ `processing` (*"Approve & Prepare Shipment"*)
  - Stage 2: `processing` $\rightarrow$ `shipped` (*"Dispatch with Courier"*)
  - Stage 3: `shipped` $\rightarrow$ `delivered` (*"Confirm Delivery"*)
- **Catalog Management & Price Moderation**:
  - **Inline Price Editor**: Adjust selling price directly with validation (enforces a minimum floor of ৳180).
  - **Stock Adjustment**: Fast `+` / `-` inventory updates with low-stock warnings.
  - **Add to Catalog**: Step-by-step listing modal for new books with categories, ISBN, and cover images.
  - **Delist Titles**: Remove discontinued or out-of-print books.

---

### 3. Interactive MFS Payment Gateway (Approach 3)
FolioVerse incorporates an interactive, sandbox-verified Mobile Financial Services (MFS) payment gateway:
- **Multi-Provider Support**: Seamless tabs for **bKash**, **Nagad**, and **Rocket**.
- **Dynamic QR Code Scanning**: Displays merchant QR code with 1-click camera scan simulation.
- **SMS OTP Verification**: Automatically generates a 6-digit test OTP with an auto-fill simulation.
- **Masked PIN Security**: 4-digit PIN pad with reveal toggle and security reminders.
- **Atomic Order Clearance**: On successful PIN entry, the backend clears the order atomically, transitions `payment_status='paid'`, assigns a verifiable `transaction_id`, and decrements inventory via row-level locking (`select_for_update`).
- **Alternative Methods**: Cash on Delivery (COD) and Credit/Debit Card options.

---

### 4. Catalog Taxonomy & Price Moderation
- Over **2,000+ realistic book records** across 5 curated genres:
  - **Literature & Novel**: Featuring 590+ Bengali classics (Rabindranath Tagore, Kazi Nazrul Islam, Humayun Ahmed) and 400+ English classics (Shakespeare, Austen, Orwell).
  - **Science**: Physics, Cosmology, Biology, Computer Science.
  - **Technology**: Artificial Intelligence, Cloud Computing, Software Architecture.
  - **Fiction**: Sci-Fi, Mystery, Thriller, Fantasy.
  - **Music**: Music Theory, Biographies, Instruments, World Traditions.

---

## 📂 Architecture & Directory Structure

```text
FolioVerse/
├── FolioVerse_BookStore.postman_collection.json    # Complete Postman Collection
├── .gitignore                                      # Project-wide Git ignore
├── README.md                                       # Comprehensive Documentation
│
├── doc/                                            # Detailed Engineering Documentation
│   ├── backend.md                                  # DRF, PostgreSQL, concurrency & endpoints
│   ├── frontend.md                                 # React 19, Tailwind CSS & components
│   ├── paymentGatwayGuide.md                       # MFS Payment Gateway architectural guide
│   ├── seller_guide.md                             # Step-by-step Seller Dashboard operations manual
│   ├── system.md                                   # High-level system architecture & ERD
│   ├── prd.md                                      # Product Requirements Document
│   └── trd.md                                      # Technical Requirements Document
│
├── backend/                                        # Django REST Framework Service
│   ├── .env                                        # Environment configuration
│   ├── .env.example                                # Sample environment file
│   ├── manage.py                                   # Django management script
│   ├── requirements.txt                            # Python dependencies
│   ├── venv/                                       # Python Virtual Environment
│   ├── folioverse_api/                             # Core Django project config
│   │   ├── settings.py                             # DRF, PostgreSQL, CORS, Throttling config
│   │   ├── urls.py                                 # Main API routes
│   │   ├── wsgi.py / asgi.py
│   ├── accounts/                                   # User Authentication App
│   │   ├── models.py / serializers.py / views.py
│   │   ├── urls.py                                 # Auth endpoints (/api/register/, /api/login/)
│   │   └── tests.py                                # Auth unit & integration tests
│   └── books/                                      # Books Management App
│       ├── models.py                               # Book, Order, OrderItem models
│       ├── serializers.py                          # Serializers with validation
│       ├── views.py                                # BookViewSet & OrderViewSet
│       ├── filters.py                              # django_filters with seller filter
│       ├── pagination.py                           # PageNumberPagination
│       ├── urls.py                                 # DefaultRouter for books & orders
│       ├── tests.py                                # Automated test suite (22 tests)
│       └── management/commands/
│           ├── seed_books.py                       # Base seed data script
│           ├── seed_bookstore.py                   # 2,000-book catalog seeder
│           └── create_demo_accounts.py             # Provisions admin, seller, buyer accounts
│
└── frontend/                                       # React.js + Tailwind CSS Client
    ├── index.html                                  # HTML entry point with SEO metadata
    ├── package.json                                # Node dependencies & scripts
    ├── vite.config.js                              # Vite + Tailwind configuration
    ├── public/                                     # Static assets & favicon
    └── src/
        ├── App.jsx                                 # Main application dashboard & modal coordinator
        ├── index.css                               # Glassmorphic styles & design tokens
        ├── context/
        │   ├── AuthContext.jsx                     # Token auth & RBAC state provider
        │   ├── CartContext.jsx                     # Persistent shopping cart state
        │   └── ThemeContext.jsx                    # Dark & Bright theme state
        ├── services/
        │   └── api.js                              # Axios client with Token interceptor
        └── components/
            ├── Navbar.jsx                          # Responsive header with Seller/Admin/Buyer pills
            ├── HeroSection.jsx                     # Hero banner with taxonomy metrics
            ├── FilterBar.jsx                       # Search, author, literature & sort controls
            ├── BookGrid.jsx / BookCard.jsx         # Responsive golden-ratio book card grid
            ├── SellerDashboardModal.jsx            # Dedicated Seller Operations & Fulfillment Portal
            ├── AdminDashboardModal.jsx             # Store Admin Inventory & Analytics Dashboard
            ├── BuyerDashboardModal.jsx             # Dedicated Buyer Orders & Tracking Portal
            ├── CartDrawer.jsx                      # Slide-out shopping cart drawer
            ├── PaymentGatewayModal.jsx             # Interactive MFS Payment Gateway (Approach 3)
            ├── BookModal.jsx                       # Create & Edit book modal
            ├── BookDetailModal.jsx                 # Full details modal with Buy button
            ├── DeleteConfirmModal.jsx              # Secure delete confirmation
            ├── AuthModal.jsx                       # Role onboarding & 1-click demo logins
            ├── ContactModal.jsx                    # Contact modal with email redirection
            ├── Pagination.jsx                      # Sliding window pagination
            └── Toast.jsx                           # Toast notifications
```

---

## 🛠 Tech Stack & Dependencies

### Backend Dependencies (`backend/requirements.txt`)
- `Django>=5.0,<6.0` (Django 5.2.18)
- `djangorestframework>=3.15.0` (DRF 3.16.0)
- `django-filter>=24.0` (Django Filter 26.2)
- `django-cors-headers>=4.3.1` (CORS handling for React)
- `psycopg2-binary>=2.9.9` (PostgreSQL adapter)
- `python-dotenv>=1.0.1` (Environment variable loader)

### Frontend Dependencies (`frontend/package.json`)
- `react`: `^19.3.1`
- `react-dom`: `^19.3.1`
- `axios`: `^1.20.0`
- `lucide-react`: `^1.61.0`
- `tailwindcss`: `^4.3.3`
- `@tailwindcss/vite`: `^4.3.3`
- `vite`: `^8.3.4`

---

## 📋 Prerequisites

Before running the project, ensure you have:
1. **Python 3.10+** installed.
2. **PostgreSQL** installed and running on port `5432`.
3. **Node.js 18+** and `npm` installed.

---

## ⚙ Backend Setup & Installation

### 1. Activate Virtual Environment
From the main `FolioVerse` directory:

**Windows (PowerShell):**
```powershell
.\backend\venv\Scripts\Activate.ps1
```
*(Or in Command Prompt: `backend\venv\Scripts\activate.bat`)*

**macOS / Linux:**
```bash
source backend/venv/bin/activate
```

### 2. Configure Environment Variables
Verify or edit `backend/.env` with your PostgreSQL database credentials:
```env
DEBUG=True
SECRET_KEY=django-insecure-folioverse-secret-key-drf-postgres-2026
ALLOWED_HOSTS=*

# PostgreSQL Database Configuration
DB_NAME=folioverse_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
```

### 3. Create Database & Apply Migrations
Ensure the database `folioverse_db` exists in PostgreSQL:
```sql
CREATE DATABASE folioverse_db;
```

Apply migrations:
```bash
python backend/manage.py migrate
```

### 4. Seed Demo Accounts & Books Catalog
```bash
# Provision verified Admin, Seller, and Buyer demo accounts
python backend/manage.py create_demo_accounts

# Seed 2,000 realistic books across 5 categories
python backend/manage.py seed_bookstore --target 2000
```

---

## 🎨 Frontend Setup & Installation

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Verify the production build:
   ```bash
   npm run build
   ```

---

## 🏃 Running the Project

### 1. Start Django Backend Server
With the virtual environment activated:
```bash
cd backend
python manage.py runserver 127.0.0.1:8000
```
- API Root: `http://127.0.0.1:8000/api/`
- Django Admin: `http://127.0.0.1:8000/admin/`

### 2. Start React Frontend Server
In a separate terminal:
```bash
cd frontend
npm run dev
```
- Frontend UI: `http://localhost:5173/`

---

## 🔌 API Endpoints Reference

### Authentication Endpoints (`/api/`)
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `POST` | `/api/register/` | Register new user & return DRF auth token | No |
| `POST` | `/api/login/` | Authenticate with username & password | No |
| `GET` | `/api/user/` | Retrieve authenticated user profile | **Yes** (`Token <key>`) |
| `POST` | `/api/logout/` | Invalidate current user auth token | **Yes** (`Token <key>`) |

### Books Catalog Endpoints (`/api/books/`)
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `GET` | `/api/books/` | List all books (Paginated, Filterable) | No |
| `POST` | `/api/books/` | Create a new book listing | **Yes** (`Token <key>`) |
| `GET` | `/api/books/<id>/` | Retrieve book details by ID | No |
| `PUT` | `/api/books/<id>/` | Update entire book record | **Yes** (`Token <key>`) |
| `PATCH`| `/api/books/<id>/` | Partially update book fields (e.g., price, stock) | **Yes** (`Token <key>`) |
| `DELETE`| `/api/books/<id>/` | Delete a book listing | **Yes** (`Token <key>`) |
| `GET` | `/api/books/taxonomy/` | Aggregated catalog counts & genres | No |
| `POST` | `/api/books/<id>/buy/` | Instant atomic purchase with row-level lock | **Yes** (`Token <key>`) |

### Orders & Seller Operations Endpoints (`/api/orders/`)
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `GET` | `/api/orders/` | List all orders (Admin access) | **Yes** (Admin) |
| `POST` | `/api/orders/` | Create multi-item order with payment method | Optional / Yes |
| `GET` | `/api/orders/<id>/` | Retrieve order details & receipt | **Yes** (`Token <key>`) |
| `GET` | `/api/orders/my-orders/` | Retrieve current buyer's order history | **Yes** (`Token <key>`) |
| `GET` | `/api/orders/seller-summary/` | Aggregate metrics & incoming buyer orders for seller | **Yes** (Seller/Admin) |
| `POST` | `/api/orders/<id>/update-status/`| Transition order fulfillment (`confirmed` $\rightarrow$ `processing` $\rightarrow$ `shipped` $\rightarrow$ `delivered`) | **Yes** (Seller/Admin) |

---

## 🔍 Filtering, Searching, Ordering & Pagination

FolioVerse supports rich querying via `django-filter` and DRF ordering:

- **Filter by Author**:
  ```http
  GET /api/books/?author=Humayun+Ahmed
  ```
- **Filter by Seller**:
  ```http
  GET /api/books/?seller=me
  GET /api/books/?seller=seller_demo
  ```
- **Filter by Literature**:
  ```http
  GET /api/books/?subcategory=Bengali+Literature
  GET /api/books/?subcategory=English+Literature
  ```
- **Search by Title**:
  ```http
  GET /api/books/?search=Harry
  ```
- **Order by Price (Ascending / Descending)**:
  ```http
  GET /api/books/?ordering=price
  GET /api/books/?ordering=-price
  ```
- **In-Stock Only Filter**:
  ```http
  GET /api/books/?in_stock=true
  ```

---

## ⏱ API Throttling Limits

Configured in `settings.py` via DRF `AnonRateThrottle` and `UserRateThrottle`:
- **Anonymous Visitors**: `20 requests/minute`
- **Authenticated Clients**: `50 requests/minute`

When exceeded, DRF issues `HTTP 429 Too Many Requests` with retry headers.

---

## 🧪 Testing the API

### 1. Automated Test Suite (22 Passing Tests)
Run the complete backend test suite across `accounts` and `books`:
```bash
python backend/manage.py test books accounts
```
```text
Creating test database for alias 'default'...
......................
----------------------------------------------------------------------
Ran 22 tests in 45.010s

OK
Destroying test database for alias 'default'...
Found 22 test(s).
System check identified no issues (0 silenced).
```
**Test Coverage Includes**:
- User registration, login, logout, and token retrieval.
- Book creation, listing, retrieval, partial update (PATCH), and deletion.
- Author filtering, title searching, and price ordering.
- Literature taxonomy filtering (Bengali & English Literature).
- Concurrency-safe atomic checkout with row locks (`select_for_update`).
- Multi-item cart checkout with bKash, Cash on Delivery (COD), and Card.
- Over-purchase inventory rejection and out-of-stock validation.
- Unauthenticated write rejection (HTTP 401).

### 2. Postman Collection
- Collection File: [`FolioVerse_BookStore.postman_collection.json`](file:///f:/Projects/FolioVerse/FolioVerse_BookStore.postman_collection.json)
- Import directly into Postman to test Authentication, Books CRUD, Taxonomy, and Orders.

---

## 🔑 Demo Credentials

| Role | Username | Password | Purpose & Capabilities |
|:---|:---|:---|:---|
| **Store Admin** | `admin` | `admin12345` | Master dashboard, full inventory restock/delete, all orders. |
| **Book Seller** | `seller_demo` | `seller12345` | Dedicated **Seller Dashboard**, customer order approval, inline price moderation, book catalog management. |
| **Book Buyer** | `buyer_demo` | `buyer12345` | Catalog purchasing, cart drawer, MFS payment gateway, order tracking. |

---

## 📚 Documentation Directory

Explore the dedicated architecture and operational guides in the [`doc/`](file:///f:/Projects/FolioVerse/doc/) folder:
- **[Payment Gateway Guide (`doc/paymentGatwayGuide.md`)](file:///f:/Projects/FolioVerse/doc/paymentGatwayGuide.md)**: Architectural breakdown of Approach 3 interactive MFS payment integration (QR scanning, SMS OTP, PIN verification, atomic clearance).
- **[Seller Operations Guide (`doc/seller_guide.md`)](file:///f:/Projects/FolioVerse/doc/seller_guide.md)**: Comprehensive manual for sellers on fulfilling buyer orders, managing payments, and moderating catalog prices.
- **[Backend Architecture (`doc/backend.md`)](file:///f:/Projects/FolioVerse/doc/backend.md)**: Models, endpoints, row-level locks, and concurrency design.
- **[Frontend Architecture (`doc/frontend.md`)](file:///f:/Projects/FolioVerse/doc/frontend.md)**: React 19 components, glassmorphism design tokens, and state management.
- **[System Architecture (`doc/system.md`)](file:///f:/Projects/FolioVerse/doc/system.md)**: Decoupled client-server design and database indexing specifications.

---

## 👨‍💻 Submission Verification Checklist

- [x] Backend built with **Django REST Framework (DRF)**
- [x] Database powered by **PostgreSQL** with composite indexing
- [x] Frontend in **React 19** + **Vite 8** + **Tailwind CSS 4**
- [x] Dedicated **Seller Dashboard** with real-time buyer order observation & approval
- [x] Role separation: Seller Dashboard omits buyer dashboard and cart lists
- [x] Inline price moderation (with minimum ৳180 validation) & stock management
- [x] Approach 3 **Interactive MFS Payment Gateway** (bKash, Nagad, Rocket, COD)
- [x] Virtual environment verified and tested
- [x] Git ignore (`.gitignore`) configured
- [x] Comprehensive `README.md` & `doc/` documentation updated
- [x] All **22 automated unit and integration tests passing**
- [x] Postman collection provided and verified
