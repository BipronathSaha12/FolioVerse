# FolioVerse Book Store REST API & Web Application

A full-stack, enterprise-grade Book Store Management System and REST API developed for **Django Batch-9 Module-23 Assignment**. Built with **Django REST Framework (DRF)**, **PostgreSQL**, **React 19**, and **Tailwind CSS**.

---

## 📖 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Architecture & Directory Structure](#-architecture--directory-structure)
- [Tech Stack & Required Packages](#-tech-stack--required-packages)
- [Prerequisites](#-prerequisites)
- [Backend Setup & Installation](#-backend-setup--installation)
- [Frontend Setup & Installation](#-frontend-setup--installation)
- [Running the Project](#-running-the-project)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Filtering, Searching, Ordering & Pagination](#-filtering-searching-ordering--pagination)
- [API Throttling Limits](#-api-throttling-limits)
- [Testing the API (Automated Tests & Postman)](#-testing-the-api-automated-tests--postman)
- [Demo Credentials](#-demo-credentials)

---

## 🌟 Project Overview

**FolioVerse** provides a secure, high-performance RESTful API paired with a modern, responsive single-page application:
- **Public Access**: Unauthenticated visitors can browse all books, search by title, filter by author, sort by price, view book details, and register.
- **Protected Actions**: Authenticated users holding a valid DRF Token can create, update, partially update (PATCH), and delete books.
- **Assignment Topics**:
  - API & REST API Standards
  - `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` HTTP methods
  - `ModelViewSet` implementation
  - Token-based Authentication (`Token <key>`)
  - Filtering by Author (`?author=...`)
  - Searching by Title (`?search=...`)
  - Ordering by Price (`?ordering=price` / `?ordering=-price`)
  - Pagination (strictly 5 books per page, `?page=2`)
  - Rate Limiting / Throttling (Anon: 20 req/min, Authenticated: 50 req/min)
  - Postman Collection integration

---

## 🚀 Key Features

- **Robust DRF Backend**: Powered by `viewsets.ModelViewSet`, `django-filter`, and `rest_framework.authtoken`.
- **Relational PostgreSQL Database**: High-performance querying, indexing on title, author, and price fields.
- **Modern Responsive Frontend**:
  - React 19 with Vite 8 and Tailwind CSS 4.
  - Lucide icons, glassmorphism dark theme (`slate-950`).
  - Mobile drawer navigation and responsive grid layout across mobile, tablet, and desktop.
  - Interactive API explorer modal with copyable `curl` commands and live response status indicators.
  - One-click Postman Collection download directly from the interface.

---

## 📂 Architecture & Directory Structure

```text
FolioVerse/
├── 2026-07-07T13-37-33.761Z-Django Batch-9 Module-23 Assignment.pdf
├── FolioVerse_BookStore.postman_collection.json    # Complete Postman Collection
├── .gitignore                                      # Project-wide Git ignore
├── README.md                                       # Comprehensive Documentation
│
├── backend/                                        # Django REST Framework Service
│   ├── .env                                        # Environment configuration
│   ├── .env.example                                # Sample environment file
│   ├── manage.py                                   # Django management script
│   ├── requirements.txt                            # Python dependencies
│   ├── venv/                                       # Python Virtual Environment
│   ├── folioverse_api/                             # Core Django project config
│   │   ├── __init__.py
│   │   ├── settings.py                             # DRF, PostgreSQL, CORS, Throttling config
│   │   ├── urls.py                                 # Main API routes
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── accounts/                                   # User Authentication App
│   │   ├── models.py
│   │   ├── serializers.py                          # Register, Login & User serializers
│   │   ├── views.py                                # Register, Login, Logout & Profile views
│   │   ├── urls.py                                 # Auth endpoints (/api/register/, etc.)
│   │   └── tests.py                                # Auth unit & integration tests
│   └── books/                                      # Books Management App
│       ├── models.py                               # Book model (Title, Author, Price, Published Date)
│       ├── serializers.py                          # BookSerializer with validations
│       ├── views.py                                # BookViewSet (ModelViewSet)
│       ├── filters.py                              # django_filters FilterSet
│       ├── pagination.py                           # 5-item PageNumberPagination
│       ├── urls.py                                 # DefaultRouter for books API
│       ├── tests.py                                # 10 comprehensive Book API tests
│       └── management/commands/
│           └── seed_books.py                       # Realistic seed data script
│
└── frontend/                                       # React.js + Tailwind CSS Client
    ├── index.html                                  # HTML entry point with metadata
    ├── package.json                                # Node dependencies & scripts
    ├── vite.config.js                              # Vite + Tailwind v4 configuration
    ├── public/
    │   ├── FolioVerse_BookStore.postman_collection.json
    │   └── favicon.svg
    └── src/
        ├── App.jsx                                 # Main application dashboard
        ├── index.css                               # Tailwind directives & glassmorphic styles
        ├── context/
        │   └── AuthContext.jsx                     # Token auth state provider
        ├── services/
        │   └── api.js                              # Axios client with Token interceptor
        └── components/
            ├── Navbar.jsx                          # Responsive sticky navbar
            ├── HeroSection.jsx                     # Hero banner with metrics
            ├── FilterBar.jsx                       # Search, author filter & sort controls
            ├── BookGrid.jsx                        # Responsive book card grid
            ├── BookCard.jsx                        # Card display with badge & actions
            ├── BookModal.jsx                       # Create & Edit book modal
            ├── BookDetailModal.jsx                 # Full details modal
            ├── DeleteConfirmModal.jsx              # Secure delete confirmation
            ├── AuthModal.jsx                       # Sign In & Registration modal
            ├── ApiDocsModal.jsx                    # Interactive API reference & tester
            ├── Pagination.jsx                      # Page switcher (5 books per page)
            └── Toast.jsx                           # Toast notifications
```

---

## 🛠 Tech Stack & Required Packages

### Backend Dependencies (`backend/requirements.txt`)
- `Django>=5.0,<6.0` (Django 5.2.18)
- `djangorestframework>=3.15.0` (DRF 3.18.3)
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

### 1. Activate the Virtual Environment
From the main `FolioVerse` directory, activate the pre-configured virtual environment:

**On Windows (PowerShell):**
```powershell
.\backend\venv\Scripts\Activate.ps1
```
*(Or in Command Prompt: `backend\venv\Scripts\activate.bat`)*

**On macOS / Linux:**
```bash
source backend/venv/bin/activate
```

*(If creating a fresh virtual environment from scratch: `python -m venv backend/venv && pip install -r backend/requirements.txt`)*

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

### 3. Create the Database & Apply Migrations
Ensure the database `folioverse_db` exists in PostgreSQL:
```sql
CREATE DATABASE folioverse_db;
```

Apply migrations:
```bash
python backend/manage.py migrate
```

### 4. Seed Demo Data & Users
Populate the database with demo users and 15 realistic book records:
```bash
python backend/manage.py seed_books
```

---

## 🎨 Frontend Setup & Installation

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Verify the production build:
   ```bash
   npm run build
   ```

---

## 🏃 Running the Project

### 1. Run the Django Backend Server
With the virtual environment activated:
```bash
cd backend
python manage.py runserver 127.0.0.1:8000
```
- API Base URL: `http://127.0.0.1:8000/api/`
- Django Admin: `http://127.0.0.1:8000/admin/`

### 2. Run the React Frontend Development Server
In a separate terminal:
```bash
cd frontend
npm run dev
```
- Frontend UI: `http://localhost:5173/`

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `GET` | `/api/` | API Directory & Overview | No |
| `POST` | `/api/register/` | Register user & return token | No |
| `POST` | `/api/login/` | Authenticate & obtain token | No |
| `GET` | `/api/user/` | Get authenticated user profile | **Yes** (`Token <token>`) |
| `POST` | `/api/logout/` | Invalidate current user token | **Yes** (`Token <token>`) |
| `GET` | `/api/books/` | List all books (Paginated 5/page) | No |
| `POST` | `/api/books/` | Create a new book | **Yes** (`Token <token>`) |
| `GET` | `/api/books/<id>/` | Retrieve book by ID | No |
| `PUT` | `/api/books/<id>/` | Update entire book record | **Yes** (`Token <token>`) |
| `PATCH`| `/api/books/<id>/` | Partially update book fields | **Yes** (`Token <token>`) |
| `DELETE`| `/api/books/<id>/` | Delete a book | **Yes** (`Token <token>`) |

### Example Request Payloads

#### 1. Register User (`POST /api/register/`)
```json
{
  "username": "johndoe",
  "email": "john@folioverse.com",
  "password": "password123",
  "password_confirm": "password123"
}
```

#### 2. Login User (`POST /api/login/`)
```json
{
  "username": "admin",
  "password": "admin12345"
}
```

#### 3. Create Book (`POST /api/books/`)
```json
{
  "title": "Dune",
  "author": "Frank Herbert",
  "price": "21.95",
  "published_date": "1965-08-01",
  "description": "Set on the desert planet Arrakis.",
  "category": "Sci-Fi"
}
```

---

## 🔍 Filtering, Searching, Ordering & Pagination

All requirements from the assignment are fully supported:

- **Filter by Author**:
  ```http
  GET /api/books/?author=J.K. Rowling
  ```
- **Search by Title**:
  ```http
  GET /api/books/?search=Harry
  ```
- **Order by Price (Ascending)**:
  ```http
  GET /api/books/?ordering=price
  ```
- **Order by Price (Descending)**:
  ```http
  GET /api/books/?ordering=-price
  ```
- **Pagination (5 Books Per Page)**:
  ```http
  GET /api/books/?page=2
  ```
- **Combined Query Example**:
  ```http
  GET /api/books/?search=Harry&author=J.K.+Rowling&ordering=price&page=1
  ```

---

## ⏱ API Throttling Limits

Rate limits are configured in `settings.py` using DRF `AnonRateThrottle` and `UserRateThrottle`:
- **Anonymous Users**: `20 requests/minute`
- **Authenticated Users**: `50 requests/minute`

When a client exceeds this rate limit, DRF returns `HTTP 429 Too Many Requests` with retry details.

---

## 🧪 Testing the API

### 1. Run Automated Backend Tests
Run the complete test suite (14 passing tests):
```bash
python backend/manage.py test accounts books
```
```text
Creating test database for alias 'default'...
..............
----------------------------------------------------------------------
Ran 14 tests in 36.217s

OK
Destroying test database for alias 'default'...
```

### 2. Testing via Postman Collection
A complete Postman collection is included:
- File path: `FolioVerse_BookStore.postman_collection.json`
- In the Postman App:
  1. Click **Import**.
  2. Select `FolioVerse_BookStore.postman_collection.json`.
  3. The collection includes pre-configured collection variables:
     - `baseUrl`: `http://127.0.0.1:8000`
     - `authToken`: Pre-seeded admin token (automatically updated when executing the Login request).
  4. Run all requests under **Authentication** and **Books**.

---

## 🔑 Demo Credentials

| Role | Username | Password | Auth Token |
|:---|:---|:---|:---|
| **Admin** | `admin` | `admin12345` | `0107288f4315fd9f739dced5cdd99c9c0061fe4f` |
| **Demo User** | `demouser` | `demo12345` | `2a56949f3902ab8149b026ed732cdd73942d4f70` |

---

## 👨‍💻 Submission Checklist Verification

- [x] Backend built with **Django REST Framework (DRF)**
- [x] Database in **PostgreSQL**
- [x] Frontend in **React.js** + **Tailwind CSS**
- [x] Modern, professional UI/UX and fully responsive for mobile, tablet, and desktop
- [x] `backend/` and `frontend/` separated in the main `FolioVerse` directory
- [x] Virtual environment verified and tested
- [x] Git ignore (`.gitignore`) configured
- [x] Comprehensive `README.md` documentation
- [x] All 14 DRF unit and integration tests passing
- [x] Postman collection provided and verified
