# FolioVerse — Frontend Web Client

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?style=for-the-badge&logo=react-router&logoColor=white)](https://reactrouter.com/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

The official frontend web application for **FolioVerse**, an enterprise-grade book store marketplace. Built with **React 19**, **React Router v7**, and **Tailwind CSS v4**, featuring real URL deep linking, role-based dashboards, a shopping cart drawer, and an interactive Mobile Financial Service (MFS) payment gateway simulator.

---

## 🌟 Key Features

- **React Router v7 Deep Linking**: Real browser paths (`/books/:id`, `/cart`, `/checkout`) support direct bookmarks, native history navigation, and SEO search indexing.
- **First-Class RBAC Portals**:
  - **Store Admin Dashboard**: Live sales volume, cleared payments, user demographics, payment gateway breakdown (bKash, Nagad, Rocket, COD), and administrative order moderation.
  - **Seller Portal**: Incoming orders with buyer contact credentials, delivery addresses, payment clearance status, and order fulfillment actions (`processing` $\rightarrow$ `shipped` $\rightarrow$ `delivered`).
  - **Buyer Dashboard**: Purchase history, delivery status tracking, and genre distribution analytics.
- **Interactive MFS Payment Gateway**: Simulated carrier bKash, Nagad, and Rocket checkouts with dynamic QR code scanning, 6-digit SMS OTP verification, and 5-digit encrypted PIN settlement.
- **Decongested Responsive Design**: Glassmorphism UI tokens, fluid portrait book cards (3:4 aspect ratio), and role-aware mobile navigation drawers.

---

## 📂 Project Structure

```text
frontend/src/
├── assets/                   # Static branding & logo assets
├── components/               # Reusable UI components (Navbar, Modals, BookCards, Drawers)
├── context/                  # AuthContext and CartContext state providers
├── pages/                    # React Router v7 page views
│   ├── HomePage.jsx          # Catalog browsing & hero showcase
│   ├── BookDetailPage.jsx    # Deep-linked book detail page (/books/:id)
│   ├── CartPage.jsx          # Full-page shopping cart (/cart)
│   └── CheckoutPage.jsx      # Multi-step checkout flow (/checkout)
├── services/
│   └── api.js                # Centralized Axios client with automatic token injection
├── App.jsx                   # Main routing definition
├── index.css                 # Tailwind CSS tokens & glassmorphism utilities
└── main.jsx                  # Application entry point
```

---

## 💻 Local Development

### Prerequisites
- Node.js 18+ and npm

### Installation & Launch
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend will start at: `http://localhost:5173/`

### Production Build
```bash
npm run build
```
Generates optimized, minified production assets into the `dist/` folder.

---

## 🚀 Environment Variables

Create a `.env` file in `frontend/`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```
In production (Vercel), point `VITE_API_BASE_URL` to your live Render backend URL:
```env
VITE_API_BASE_URL=https://folioverse-api.onrender.com/api
```
