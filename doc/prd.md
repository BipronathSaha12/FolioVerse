# FolioVerse — Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Status:** Approved & Implemented  
**Author:** FolioVerse Engineering Team  
**Authority / Owner:** Bipronath Saha (bipronathsaha@gmail.com)

---

## 1. Executive Summary
**FolioVerse** is a modern, high-performance digital book shop and marketplace powered by Django REST Framework (DRF), PostgreSQL 16, React, and responsive glassmorphism UI design. The platform connects book readers and book sellers, providing an enriched catalog of **2,000+ verified books** structured across five core genres with deep subcategorization, atomic zero-overselling purchasing, seller self-listing, an administrative management dashboard, and direct authority inquiry routing.

---

## 2. Product Vision & Goals
- **Empower Readers & Buyers:** Enable readers worldwide to browse, search, and purchase books across Science, Technology, Fiction, Music, and Literature (highlighting authentic Bengali and English classics) with transparent live stock indicators.
- **Empower Book Sellers:** Allow independent authors and sellers to list new and used books into the marketplace with verified taxonomies, pricing, and condition ratings.
- **Production-Grade Concurrency & Data Integrity:** Eliminate overselling during high transaction volumes through atomic database locking (`select_for_update`) and PostgreSQL constraints.
- **Universal Mobile Accessibility:** Deliver an interface tailored to every viewport from 320px mini-smartphones to 4K desktop displays with toggleable menus and touch-friendly controls.
- **Authority Accessibility:** Provide direct, friction-free communication routing inquiries directly to the platform founder at `bipronathsaha@gmail.com`.

---

## 3. User Personas & User Journeys

### Persona A: Book Buyer (e.g., Sadia Rahman)
- **Goal:** Find specific books (e.g., Rabindranath Tagore's *Gitanjali* or Martin Kleppmann's *Designing Data-Intensive Applications*), verify stock, and purchase immediately.
- **Journey:**
  1. Visits homepage and chooses **"Join as Book Buyer"** or browses anonymously.
  2. Filters catalog by "Literature & Novel" $\rightarrow$ "Bengali Literature" or searches via live search bar.
  3. Inspects real-time stock tag (*In Stock*, *Low Stock*, or *Sold Out*).
  4. Clicks **Buy Now**, selects quantity, reviews cost breakdown, and completes order without overselling risk.

### Persona B: Book Seller (e.g., Tanvir Ahmed)
- **Goal:** List inventory for sale with fair pricing, condition ratings, and accurate categorization.
- **Journey:**
  1. Authenticates or chooses **"Join as Book Seller"**.
  2. Clicks **"List / Sell a Book"** from the navigation bar or mobile drawer.
  3. Enters book metadata (title, author, genre category, subcategory, language, condition, price, inventory units, cover URL).
  4. Publishes book to the live PostgreSQL marketplace instantly.

### Persona C: Store Administrator & Authority (e.g., Bipronath Saha)
- **Goal:** Monitor overall catalog distribution, inventory health, restock low-stock books, and receive user inquiries.
- **Journey:**
  1. Signs in with staff credentials (`admin / admin12345`).
  2. Opens the **Store Admin Dashboard** on mobile or desktop.
  3. Reviews real-time metrics (Total Catalog, Available Stock, Low Stock items, Category Breakdown).
  4. Restocks inventory using the 1-click `+5 Restock` control.
  5. Receives user inquiries routed to `bipronathsaha@gmail.com`.

---

## 4. Functional Requirements

### 4.1 Hierarchical Taxonomy & Catalog Structure
The catalog must strictly categorize every book into one of 5 main genres with dedicated subcategories:
1. **Literature & Novel:**
   - *Bengali Literature:* (Rabindranath Tagore, Kazi Nazrul Islam, Sarat Chandra Chattopadhyay, Bibhutibhushan Bandyopadhyay, Humayun Ahmed, Satyajit Ray, etc.; language: Bengali).
   - *English Literature:* (Shakespeare, Jane Austen, George Orwell, Charles Dickens, Virginia Woolf, James Joyce, etc.; language: English).
   - *World Classics:* (Tolstoy, Dostoevsky, Gabriel García Márquez, Victor Hugo, Franz Kafka, etc.).
   - *Poetry & Plays:* (T.S. Eliot, John Keats, Sylvia Plath, Robert Frost, etc.).
   - *Contemporary Novels:* (Khaled Hosseini, Yann Martel, Cormac McCarthy, Sally Rooney, etc.).
2. **Science:**
   - *Physics*, *Astronomy & Cosmology*, *Biology & Genetics*, *Computer Science*, *Environmental Science*.
3. **Technology:**
   - *Artificial Intelligence & ML*, *Software Architecture*, *Web & Cloud Engineering*, *Cybersecurity & Networks*, *Mobile Development*.
4. **Fiction:**
   - *Science Fiction*, *Fantasy & Magic*, *Mystery & Detective*, *Psychological Thriller*, *Historical Fiction*.
5. **Music:**
   - *Music Theory & Composition*, *Biographies & Memoirs*, *History & World Music*, *Instruments & Performance*.

### 4.2 Marketplace Buy & Sell Capabilities
- **Atomic Checkout (`POST /api/books/<id>/buy/`):**
  - Concurrency-safe atomic transaction inside PostgreSQL.
  - Decrements available stock immediately.
  - Prevents order if requested quantity exceeds current stock.
  - Automatically updates book status: `available` ($>3$), `low_stock` ($1..3$), `sold` ($=0$).
- **Book Listing (`POST /api/books/`):**
  - Allows authenticated users and sellers to list new titles.
  - Enforces non-negative price, non-negative stock, title, and author constraints.
- **Book Detail & Quick Actions:**
  - Full modal inspecting condition, language, published date, author, stock status, and ISBN-13.

### 4.3 Navigation & Client-Side UI
- **Branded Navbar:** Includes official logo (`src/assets/projects/folioverse_logo.jpg`), live inventory beacon, genre dropdown, dashboard button, and mobile hamburger drawer.
- **Mobile Responsive Drawer:** Slide-over navigation drawer locking body scroll, providing role choices, genre filters, and quick CTAs.
- **Client-Side Footer:** Displays brand identity, literature categories, and direct contact communication channels (Phone: `+8801559503222`, Email: `contact@folioverse.com`). **No raw developer API endpoints are exposed in the client-side footer.**

### 4.4 Contact Routing
- **Contact Modal:** Includes recipient's name, email address, contact number, and message box.
- **Direct Mailto Trigger:** Submitting routes inquiry directly to `bipronathsaha@gmail.com` with formatted inquiry content, and renders in-app confirmation with copy and reopen actions.

### 4.5 Store Admin Dashboard (Mobile Responsive)
- **Overview Tab:** Displays total catalog size (2,000 books), in-stock units, low-stock count, sold-out count, and category percentage bars.
- **Inventory Tab:** Searchable live catalog with status filtering, inline `+5 Restock` quick button, Edit, and Delete actions.
- **Orders Tab:** Activity log of completed transactions with order IDs, buyers, quantities, and totals.

### 4.6 10-Item Pagination with Sliding Window
- Enforces at least 10 books per page.
- For a 2,000-book catalog (200 pages), the pagination component displays an intelligent sliding window with ellipsis (`1, 2, ..., 15, 16, 17, ..., 199, 200`), first/last buttons, and a direct `Go to page` jump input.

---

## 5. Non-Functional Requirements
- **Performance:** Sub-15ms response times for paginated book queries via composite database indexes.
- **Scalability:** Easily handle catalog expansions up to 100,000 books without schema alteration.
- **Mobile Responsiveness:** Flawless rendering on viewports ranging from 320px to 2560px without horizontal overflow.
- **Security:** Token-based authentication, non-negative database check constraints, automated rate throttling (20 rpm anon / 50 rpm auth), and parameterized queries via Django ORM.
