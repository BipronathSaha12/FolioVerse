# FolioVerse — Frontend React 19 & React Router v7 Architecture Guide

**Document Version:** 2.0.0  
**Status:** Component & Routing Architecture Specification  
**Authority / Owner:** Bipronath Saha (bipronathsaha@gmail.com)

---

## 1. Frontend Architectural Overview

The FolioVerse frontend is built using **React 19**, **React Router v7**, and **Vite 8**, styled with **Tailwind CSS v4** and a modern glassmorphism design token system. It replaces purely modal state with real deep-linkable URL paths (`/books/:id`, `/cart`, `/checkout`), enabling direct browser bookmarks, native history traversal, and SEO indexing while maintaining sub-second client-side transitions.

```text
frontend/src/
├── assets/
│   └── projects/
│       └── folioverse_logo.jpg       # High-resolution official brand logo
├── components/
│   ├── AdminDashboardModal.jsx       # Live DB executive admin dashboard with order moderation & MFS analytics
│   ├── BuyerDashboardModal.jsx       # Dedicated buyer account & purchase analytics portal
│   ├── SellerDashboardModal.jsx      # Dedicated seller operations portal (order fulfillment & catalog pricing)
│   ├── PaymentGatewayModal.jsx       # Interactive MFS payment gateway modal (QR, OTP, PIN)
│   ├── AuthModal.jsx                 # Role onboarding (Buyer vs Seller) & 1-click demo logins
│   ├── BookCard.jsx                  # Golden 3:4 portrait aspect ratio book card with Add to Cart & Buy
│   ├── BookDetailModal.jsx           # Modal fallback viewer for quick preview
│   ├── BookGrid.jsx                  # Responsive 1..5 column fluid book card grid
│   ├── BookModal.jsx                 # CRUD creation and modification modal
│   ├── BuyBookModal.jsx              # Concurrency-safe atomic checkout dialog with multi-payment choices
│   ├── CartDrawer.jsx                # Slide-out shopping cart drawer (bKash, Nagad, Rocket, COD)
│   ├── ContactModal.jsx              # Contact modal (routes to bipronathsaha@gmail.com)
│   ├── DeleteConfirmModal.jsx        # Deletion confirmation modal
│   ├── FilterBar.jsx                 # Horizontal category tabs & subcategory pills
│   ├── HeroSection.jsx               # Digital bookstore hero, role CTAs, and live stats
│   ├── Navbar.jsx                    # Responsive header with role-aware dashboard pills & Cart badge
│   ├── Pagination.jsx                # Sliding window pagination with direct page jump
│   └── Toast.jsx                     # Non-intrusive floating alert notifications
├── context/
│   ├── AuthContext.jsx               # Auth state machine (user, token, role, login, logout, register)
│   └── CartContext.jsx               # Cart state machine (items, quantities, subtotal, persistence)
├── pages/
│   ├── HomePage.jsx                  # Main catalog browsing, filtering, search, and hero showcase
│   ├── BookDetailPage.jsx            # Deep-linked book detail page (/books/:id) with metadata
│   ├── CartPage.jsx                  # Dedicated full-page shopping cart view (/cart)
│   └── CheckoutPage.jsx              # Standalone multi-step checkout view (/checkout)
├── services/
│   └── api.js                        # Axios instance with auth interceptors & endpoint mappings
├── App.jsx                           # React Router v7 routes orchestrator & modal coordinator
├── index.css                         # Custom glassmorphism design tokens & animations
└── main.jsx                          # React DOM entry point
```

---

## 2. React Router v7 & Deep Linking Architecture

FolioVerse upgraded from monolithic modal state to first-class URL routing via **React Router v7**:

### Route Definitions:
| Path | Component | Purpose |
| :--- | :--- | :--- |
| `/` | `HomePage` | Primary storefront, hero banner, multi-genre filtering, search bar, and 2,000-book catalog grid. |
| `/books/:id` | `BookDetailPage` | Dedicated, shareable book page with complete description, author info, condition, stock availability, and instant purchase. |
| `/cart` | `CartPage` | Dedicated full-page shopping cart view with item adjustment and order summary. |
| `/checkout` | `CheckoutPage` | Focused checkout flow with shipping address input, payment method selection, and MFS payment gateway launcher. |

### Benefits:
- **Direct Bookmarks & Sharing**: Users and sellers can share links directly to specific book listings (`https://folioverse.vercel.app/books/42`).
- **Browser History Support**: Native back and forward buttons work seamlessly without closing application state.
- **Search Engine Indexing**: Clean URLs enable search engines to crawl and index individual book titles.

---

## 3. Dedicated Dashboard Portals & Operations

### 3.1 Store Admin Dashboard (`AdminDashboardModal.jsx`)
Powered by the high-performance `/api/orders/admin-summary/` backend endpoint:
- **Tab 1: Overview & Metrics**:
  - **Gross Platform Volume**: Live database sum of all placed orders.
  - **Cleared Revenue**: Total amount settled via MFS or delivered cash on delivery.
  - **Order Tracking**: Total marketplace orders and orders currently pending fulfillment.
  - **Catalog Health**: Total books, total stock units in PostgreSQL, low stock alerts ($\le 3$), and out-of-stock counts.
  - **Platform User Base**: Active registered buyers vs verified store sellers.
  - **Payment Method Settlement Breakdown**: Real-time order count and BDT revenue distribution across **bKash**, **Nagad**, **Rocket**, and **COD**.
  - **Genre Distribution**: Visual progress bars showing book counts across the 5 main genres.
- **Tab 2: Inventory Management**:
  - Instant catalog search by title or author.
  - Quick `+5 Restock` button to add units directly with automatic status recalculation.
  - Edit and Delete listing controls.
- **Tab 3: Orders & Transactions**:
  - Complete list of live orders with customer name, email, phone number, and delivery address.
  - Payment method badges and payment clearance status (`PAID` in green, `PENDING` in amber) with transaction IDs.
  - Line items breakdown with book titles, authors, quantities, unit prices, and seller usernames.
  - **Administrative Moderation Actions**:
    - *Confirm Paid*: Instantly settles payment for COD or unconfirmed transactions.
    - *Approve Processing*: Advances order from `confirmed` $\rightarrow$ `processing`.
    - *Mark Shipped*: Dispatches parcel with courier (`processing` $\rightarrow$ `shipped`).
    - *Mark Delivered*: Confirms receipt and finalizes the order (`shipped` $\rightarrow$ `delivered`).
- **Tab 4: Customer Messages & Inquiries**:
  - Live review of inquiries submitted via the storefront contact form.

### 3.2 Seller Operations & Fulfillment Portal (`SellerDashboardModal.jsx`)
- Exclusively available for users with the `seller` role (`seller_demo`).
- **Top KPI Cards**: Sales Revenue earned by seller, Units Sold, Orders Needing Action, and Active Listings.
- **Tab 1: Incoming Orders & Fulfillment**:
  - Real-time customer orders for the seller's books (including store catalog books attributed to `seller_demo`).
  - Displays customer full name, delivery address, phone number, and payment status.
  - Direct fulfillment controls (`confirmed` $\rightarrow$ `processing` $\rightarrow$ `shipped` $\rightarrow$ `delivered`).
- **Tab 2: Catalog Management & Moderation**:
  - Searchable list of the seller's listed books.
  - **Inline Price Editor**: Edit prices with validation (minimum ৳180.00 price floor).
  - **Stock Controls**: Quick restock controls with live status badges.

### 3.3 Buyer Purchase & History Portal (`BuyerDashboardModal.jsx`)
- Accessible for users with the `buyer` role (`buyer_demo`).
- Powered by `/api/orders/buyer-summary/`.
- Displays total orders, total spent, cleared payments, and genre purchase distribution.
- Complete purchase history with tracking badges and order receipts.

---

## 4. Mobile Navigation & Responsive Drawer

The navigation system (`Navbar.jsx`) is engineered for seamless operation on devices from 320px smartphones to 4K displays:

- **Desktop Layout ($\ge 1024\text{px}$)**:
  - Official logo with live inventory indicator.
  - Mega-dropdown for genres with active filter indicators.
  - Role-specific dashboard button (Store Admin, Seller Portal, or Buyer Orders based on authenticated role).
  - Cart trigger pill with live item badge and total.
- **Mobile Responsive Drawer ($< 1024\text{px}$)**:
  - Header displays logo, cart button, and hamburger toggle.
  - Slide-out drawer features:
    - Role-aware quick actions: Directly opens the user's specific dashboard (**Admin Dashboard** for admins, **Seller Portal** for sellers, **My Orders** for buyers).
    - Wrapped genre category pills.
    - 1-Click demo login buttons and authentication controls.
    - All touch targets strictly follow WCAG accessibility guidelines ($\ge 44\text{px}$).

---

## 5. Centralized API Service (`services/api.js`)

All communication with the Django REST Framework backend routes through a centralized Axios client with automatic token injection:

```javascript
export const orderService = {
  createOrder: (data) => api.post('/orders/', data),
  getOrders: (params = {}) => api.get('/orders/', { params }),
  getOrder: (id) => api.get(`/orders/${id}/`),
  getBuyerSummary: (params = {}) => api.get('/orders/buyer-summary/', { params }),
  getSellerSummary: (params = {}) => api.get('/orders/seller-summary/', { params }),
  getAdminSummary: (params = {}) => api.get('/orders/admin-summary/', { params }),
  updateOrderStatus: (id, data) => api.post(`/orders/${id}/update-status/`, data),
  // MFS Interactive Gateway Suite
  gatewayInitiate: (data) => api.post('/orders/gateway-initiate/', data),
  gatewaySendOtp: (data) => api.post('/orders/gateway-send-otp/', data),
  gatewayVerifyOtp: (data) => api.post('/orders/gateway-verify-otp/', data),
  gatewayConfirmPin: (data) => api.post('/orders/gateway-confirm-pin/', data),
  gatewayQrScan: (data) => api.post('/orders/gateway-qr-scan/', data),
  gatewayCancel: (data) => api.post('/orders/gateway-cancel/', data),
};
```
