# FolioVerse — Frontend Architecture & Component Guide

**Document Version:** 1.0.0  
**Status:** Component Architecture Specification  
**Authority / Owner:** Bipronath Saha (bipronathsaha@gmail.com)

---

## 1. Frontend Architectural Overview

The FolioVerse frontend is a single-page application built using React 19 and Vite 8, styled with Tailwind CSS and a curated glassmorphism design token system. It communicates with the Django REST Framework backend through an Axios service layer.

```
frontend/src/
├── assets/
│   └── projects/
│       └── folioverse_logo.jpg       # High-resolution official brand logo
├── components/
│   ├── AdminDashboardModal.jsx       # Mobile-responsive store admin & inventory dashboard with live order tracking
│   ├── AuthModal.jsx                 # Role onboarding (Buyer vs Seller) & 1-click demo logins
│   ├── BookCard.jsx                  # Golden 3:4 portrait aspect ratio book card with Add to Cart & Buy
│   ├── BookDetailModal.jsx           # Detailed book viewer with instant buy action
│   ├── BookGrid.jsx                  # Responsive 1..5 column fluid book card grid
│   ├── BookModal.jsx                 # CRUD creation and modification modal
│   ├── BuyBookModal.jsx              # Concurrency-safe atomic checkout dialog with multi-payment choices
│   ├── CartDrawer.jsx                # Slide-out shopping cart drawer (Stripe, bKash, Nagad, Rocket, COD)
│   ├── ContactModal.jsx              # Contact Authority modal (routes to bipronathsaha@gmail.com)
│   ├── DeleteConfirmModal.jsx        # Deletion confirmation modal
│   ├── FilterBar.jsx                 # Horizontal category tabs & subcategory pills
│   ├── HeroSection.jsx               # Digital bookstore hero, role CTAs, and live stats
│   ├── Navbar.jsx                    # Decongested desktop header & mobile responsive drawer with Cart pill
│   ├── Pagination.jsx                # Sliding window pagination with ellipsis (for 200 pages)
│   └── Toast.jsx                     # Non-intrusive floating alert notifications
├── context/
│   ├── AuthContext.jsx               # Auth state machine (user, token, login, logout, register)
│   └── CartContext.jsx               # Cart state machine (items, quantities, subtotal, persistence)
├── services/
│   └── api.js                        # Axios instance with auth interceptors & endpoint mappings
├── App.jsx                           # Application orchestrator & modal coordinator
├── index.css                         # Custom glassmorphism design tokens & animations
└── main.jsx                          # React DOM entry point
```

---

## 2. Component Hierarchy & Responsibilities

### 2.1 `Navbar.jsx` (Decongested Desktop & Mobile Responsive)
- **Desktop Layout ($\ge 1024\text{px}$):**
  - Decongested architecture eliminating horizontal crowding.
  - **Left:** Official Logo with live stock indicator beacon (`2,000 In Stock`).
  - **Center:** Mega-dropdown for genres with active filter indicators + clear pill, quick literature filters (Bengali & English), Dashboard and Contact links.
  - **Right:** Standout **Cart trigger pill** with live item count badge and subtotal, **Sell a Book** button, and User Profile / Sign In controls.
- **Mobile Responsive Drawer ($< 1024\text{px}$):**
  - Proportional logo scaling, direct Cart button in header, and smooth animated hamburger toggle.
  - Mobile slide-out drawer featuring bookstore status, role onboarding cards, quick dashboard/contact buttons, wrapped genre pills, and user authentication actions with full touch safety ($\ge 44\text{px}$).

### 2.2 `CartDrawer.jsx` & `CartContext.jsx` (Shopping Cart & Multi-Payment Checkout)
- **State Management (`CartContext.jsx`):**
  - Persisted to browser `localStorage` (`folioverse_cart`).
  - Manages quantities, stock clamps, removals, and subtotal calculation.
- **Drawer UI (`CartDrawer.jsx`):**
  - Slide-out presentation with smooth backdrop blur.
  - Item list with book covers, titles, authors, quantity increment/decrement, and subtotal.
  - **3 Payment Options:**
    1. **Stripe (Credit / Debit Card):** Card number, expiry, CVC inputs with 256-bit encryption badge.
    2. **Mobile Banking (bKash / Nagad / Rocket):** Provider tabs, merchant numbers (`01712-345678`), copyable merchant number button, reference instructions, and Transaction ID (TrxID) input.
    3. **Cash on Delivery (COD):** No online payment required; doorstep cash handover with 2-3 day delivery notice.
  - Places order to backend `/api/orders/` atomically and renders a verified order receipt with Order Number (`FV-ORD-...`), payment status, customer details, and purchased books.

### 2.3 `BookCard.jsx` & Device Length / Ratio Scaling
- **Portrait Golden Aspect Ratio ($3:4$):** Standard book dimensions prevent cover image stretching or squishing on all devices.
- Uniform card heights across columns with flexbox column alignment.
- Dual purchase pathways: "Add to Cart" (quick feedback) and "Buy" (instant checkout).

### 2.2 `HeroSection.jsx`
- Replaces legacy multi-tenant SaaS text with digital book shop marketplace content.
- **Onboarding Cards:** Directly routes users to `Join as Book Buyer` or `Join as Book Seller`.
- **Marketplace Metrics:** 4 live cards:
  1. *Catalog Volume:* 2,000+ Books In Stock.
  2. *Curated Genres:* 5 Main Catalogs (Science, Tech, Lit, Fiction, Music).
  3. *Dual Literature:* বাংলা & English Classics.
  4. *Availability:* Live Stock Check with atomic checkout.

### 2.3 `AdminDashboardModal.jsx` (Mobile-Responsive Dashboard)
- **Tab 1: Overview & Metrics:** High-level inventory health cards and genre distribution progress bars.
- **Tab 2: Inventory Management:** Searchable list of books with quick stock adjustment (`+5 Restock`), Edit, and Delete controls. Renders compact touch-friendly cards on mobile devices without overflowing.
- **Tab 3: Orders & Transactions:** Feed of recently completed buyer transactions.

### 2.4 `ContactModal.jsx` (Authority Email Redirection)
- Accessible from both the navigation bar and footer.
- Displays target recipient: `bipronathsaha@gmail.com`.
- Encodes subject and message into an RFC 2368 `mailto:` link, redirects via `window.location.href`, and displays an in-app confirmation screen.

### 2.5 `AuthModal.jsx` (Role Selection & 1-Click Demo Logins)
- **Role Selection Cards:** Toggle between **Book Buyer** and **Book Seller** prior to account creation.
- **1-Click Demo Accounts:**
  - `Admin`: `admin / admin12345` (Superuser & staff dashboard access).
  - `Buyer Demo`: `buyer_demo / buyer12345` (Book buyer persona).
  - `Seller Demo`: `seller_demo / seller12345` (Book seller persona).

### 2.6 `Pagination.jsx` (Sliding Window for 200+ Pages)
- For 2,000 books at 10 items per page, `totalPages = 200`.
- Implements an intelligent sliding window: `[1, 2, ..., currentPage - 1, currentPage, currentPage + 1, ..., 199, 200]`.
- Features First (`<<`), Previous (`<`), Next (`>`), and Last (`>>`) controls.
- Provides a direct jump input (`Go to: [ ] Go`) that is compact on mobile screens.

---

## 3. Responsive Breakpoint Specification

FolioVerse enforces strict margin and alignment constraints across all device classes:

| Breakpoint | Target Screen Width | Layout & Adaptation |
| :--- | :--- | :--- |
| **Mini Mobile** | $320\text{px} - 375\text{px}$ (e.g., iPhone SE) | 1-column card grid, compact navbar with logo & hamburger, full-width slide-over drawer, no horizontal overflow |
| **Standard Mobile** | $376\text{px} - 639\text{px}$ (e.g., iPhone 14/15, Pixel) | 1-column cards with responsive image aspect ratio, touch-friendly tap targets ($\ge 44\text{px}$) |
| **Tablet** | $640\text{px} - 1023\text{px}$ (e.g., iPad, Galaxy Tab) | 2-column book grid, 2-column metrics cards, expandable drawer |
| **Desktop / Laptop** | $1024\text{px} - 1279\text{px}$ | 3-column book grid, desktop navbar with mega-dropdown, right action bar |
| **Wide Desktop** | $1280\text{px}+$ (e.g., 1080p, 1440p, 4K) | 4-column book grid, centered max-w-7xl container, enhanced glassmorphism blur |

---

## 4. Design System Tokens (`index.css`)

```css
/* Glassmorphism Design Tokens */
.glass-panel {
  background: rgba(11, 17, 33, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-card {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
```
