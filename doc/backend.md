# FolioVerse — Backend DRF, PostgreSQL & Redis Architecture Guide

**Document Version:** 2.0.0  
**Status:** Enterprise Backend Architecture Specification  
**Authority / Owner:** Bipronath Saha (bipronathsaha@gmail.com)

---

## 1. Backend Architecture Overview

The FolioVerse backend is engineered using **Django 5.2** and **Django REST Framework 3.16** atop **PostgreSQL 16 (Neon Serverless)** and **Redis**. It is structured into two core modular applications:
1. `backend/accounts/`: User registration, Token Authentication, Profile management, and explicit **Role-Based Access Control (RBAC)** enum (`ADMIN`, `SELLER`, `BUYER`).
2. `backend/books/`: High-performance catalog browsing, read/write splitting, Redis-powered flash-sale inventory management, atomic checkout, mobile banking gateway suite, and SQL-pushdown dashboards for buyers, sellers, and administrators.

```text
backend/
├── accounts/
│   ├── models.py              # UserProfile with first-class Role enum (ADMIN, SELLER, BUYER)
│   ├── serializers.py         # User & registration serializers with role assignment
│   ├── throttles.py           # Composite IP+Username rate throttles (LoginCompositeRateThrottle)
│   ├── urls.py                # Auth routing (/api/register/, /api/login/, /api/user/)
│   ├── views.py               # Auth API views with token rotation & session termination
│   └── tests.py               # Auth and RBAC unit tests
├── books/
│   ├── management/
│   │   └── commands/
│   │       ├── create_demo_accounts.py # Provisions admin, buyer, seller demo accounts & sample orders
│   │       ├── seed_bookstore.py       # High-speed bulk generator for 2,000 categorized books
│   │       └── seed_books.py           # Base seed script
│   ├── filters.py             # Custom django-filter FilterSet
│   ├── models.py              # Enriched Book, Order, OrderItem, ContactInquiry, PaymentTransaction
│   ├── pagination.py          # 10-item PageNumberPagination with count optimization
│   ├── payment_gateway.py     # Interactive MFS payment gateway engine (bKash, Nagad, Rocket)
│   ├── permissions.py         # IsOwnerOrReadOnly, IsOrderParticipantOrAdmin, IsContactManagerOrSubmitOnly
│   ├── redis_inventory.py     # Redis Lua script atomic stock decrement engine & rollback compensator
│   ├── serializers.py         # XSS-sanitized serializers with locked fields & seller attribution
│   ├── test_security.py       # 14-test Security Hardening test suite (CORS, CSP, IDOR, Throttling)
│   ├── tests.py               # Core bookstore, order checkout, buy, and summary test suite (31 tests)
│   ├── urls.py                # REST router for books, orders, payments, taxonomy, and contact
│   └── views.py               # BookViewSet, OrderViewSet, ContactViewSet with SQL-pushdown summaries
├── folioverse_api/
│   ├── db_router.py           # PrimaryReplicaRouter for read/write splitting
│   ├── settings.py            # Hardened settings (CORS, CSP, Transport, Redis cache, Multi-DB)
│   ├── middleware.py          # SecurityHeadersMiddleware (CSP, HSTS, X-Frame-Options)
│   ├── urls.py                # Root URL dispatcher
│   └── wsgi.py / asgi.py
└── manage.py
```

---

## 2. Horizontal Scaling & Data Layer

### 2.1 Read/Write Database Splitting (`db_router.py`)
To enable horizontal scalability across read replicas while preserving absolute consistency for transactional writes:
- **`default` (Primary Write Master)**: Handles all `INSERT`, `UPDATE`, `DELETE`, schema migrations, and `select_for_update()` transactional queries.
- **`read_replica` (Read Replica Pool)**: Handles read-only catalog browsing (`SELECT` queries on `Book`, `Taxonomy`, and search filters).
- **`PrimaryReplicaRouter`**:
  ```python
  class PrimaryReplicaRouter:
      def db_for_read(self, model, **hints):
          # Catalog reads can be routed to read replicas when configured
          if model._meta.app_label == 'books' and not hints.get('for_write', False):
              return 'read_replica' if 'read_replica' in settings.DATABASES else 'default'
          return 'default'

      def db_for_write(self, model, **hints):
          return 'default'

      def allow_relation(self, obj1, obj2, **hints):
          return True

      def allow_migrate(self, db, app_label, model_name=None, **hints):
          return db == 'default'
  ```

### 2.2 Redis Lua Inventory Engine (`redis_inventory.py`)
To prevent database connection exhaustion and race conditions during high-volume flash sales (100k+ concurrent shoppers):
- **Atomic Lua Script**:
  ```lua
  local key = KEYS[1]
  local qty = tonumber(ARGV[1])
  local current = tonumber(redis.call('get', key) or '0')
  if current >= qty then
      local remaining = redis.call('decrby', key, qty)
      return {1, remaining}
  else
      return {0, current}
  end
  ```
- **Two-Phase Reservation & Compensation**:
  1. **Phase 1 (Redis Reservation)**: Atomic stock decrement is verified in sub-millisecond memory via Redis Lua script. If stock is insufficient, the request is immediately rejected before touching PostgreSQL.
  2. **Phase 2 (Database Persistence)**: Once reserved, database row updates and `Order`/`OrderItem` records are created in an atomic transaction.
  3. **Compensating Rollback**: If PostgreSQL persistence fails or encounters a deadlock, `RedisInventoryManager.rollback_stock(book_id, qty)` automatically restores Redis stock, ensuring zero stock leakage.

---

## 3. First-Class Role-Based Access Control (RBAC)

FolioVerse deprecates client-side username guessing in favor of an explicit, authoritative role enum stored in the database:

```python
class UserProfile(models.Model):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Administrator'
        SELLER = 'seller', 'Book Seller'
        BUYER = 'buyer', 'Book Buyer'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.BUYER)
    phone = models.CharField(max_length=20, blank=True, default='')
    address = models.TextField(blank=True, default='')
```

### Role Capabilities & Hierarchy:
- **`Administrator` (`admin`)**: Storewide governance, executive revenue analytics, complete order lifecycle moderation, user management, and contact message review.
- **`Book Seller` (`seller`)**: Dedicated merchant portal, catalog listing management, price floor moderation (minimum ৳180), stock replenishments, and incoming order fulfillment (`confirmed` $\rightarrow$ `processing` $\rightarrow$ `shipped` $\rightarrow$ `delivered`).
- **`Book Buyer` (`buyer`)**: Catalog browsing, multi-item persistent cart, instant buy, simulated mobile banking checkout, and personal order history.

---

## 4. Models & Database Engineering (`models.py`)

### 4.1 The `Book` Model
- Enriched with catalog taxonomy, stock constraints, pricing validation, and composite B-Tree indexes:
  - `(category, subcategory)`
  - `(status, stock)`
  - `(author, title)`
  - `(price)`
  - `(language)`
- Automatic status recalculation upon save:
  - `stock == 0` $\rightarrow$ `sold`
  - `stock <= 3` $\rightarrow$ `low_stock`
  - `stock > 3` $\rightarrow$ `available`
- Database-level check constraints: `price >= 0`, `stock >= 0`.

### 4.2 The `Order` and `OrderItem` Models
- **`Order`**:
  - `order_number`: Unique business tracking identifier (`FV-ORD-<timestamp>-<rand>`).
  - `user`: Foreign key to `auth.User` (nullable for guest checkout).
  - Customer demographics: `customer_name`, `customer_email`, `customer_phone`, `shipping_address`.
  - Payment details: `payment_method` (`bkash`, `nagad`, `rocket`, `cod`), `payment_status` (`pending`, `paid`, `failed`), `transaction_id`.
  - Status lifecycle: `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`.
  - Financials: `total_amount` (Decimal with precision 10, 2).
- **`OrderItem`**:
  - Captures historical pricing, book reference, quantity, line subtotal, title, author, category, cover image, and seller attribution.

### 4.3 The `PaymentTransaction` Model
- Session-based state machine for the MFS Payment Gateway simulator.
- Tracks `session_id` (UUID), `provider` (bKash/Nagad/Rocket), `status` (`INITIATED`, `OTP_SENT`, `OTP_VERIFIED`, `PAID`, `EXPIRED`, `FAILED`), 6-digit SMS OTP code with 2-minute expiration, PIN attempt counts, and generated TrxID.

---

## 5. High-Scale SQL Pushdown Summary Endpoints

FolioVerse rejects loading full querysets into Python memory. All dashboard analytics execute at the PostgreSQL query engine level using conditional aggregation filters:

### 5.1 Store Admin Summary (`GET /api/orders/admin-summary/`)
- Permission: `IsAdminUser`.
- Returns:
  - Gross Platform Sales Volume (`Sum('total_amount')`).
  - Cleared Revenue (`Sum('total_amount', filter=Q(payment_status='paid') | Q(status='delivered') | Q(payment_method__in=['bkash','nagad','rocket']))`).
  - Total Orders, Pending Fulfillments, and Completed Orders.
  - Real-time Payment Gateway Breakdown: Order count and total revenue grouped by `bKash`, `Nagad`, `Rocket`, and `COD`.
  - Catalog Health: Total catalog size, stock units, low stock count ($\le 3$), and out-of-stock count ($= 0$).
  - User Demographics: Registered buyers vs verified sellers.
  - Recent Orders: Complete order list with line items, contact info, and payment statuses.

### 5.2 Seller Portal Summary (`GET /api/orders/seller-summary/`)
- Permission: `IsAuthenticated` (Seller or Admin).
- Returns:
  - Total listed books and active inventory units.
  - Total sold copies and gross earnings attributed to this seller.
  - Pending orders requiring fulfillment.
  - Incoming order stream containing buyer name, phone, shipping address, line items, payment method, transaction ID, and current order status.

### 5.3 Buyer Dashboard Summary (`GET /api/orders/buyer-summary/`)
- Permission: `IsAuthenticated` (Scoped strictly to current user).
- Returns:
  - Total orders placed and total spent (gross vs cleared).
  - Total books ordered and cleared.
  - Database group-by aggregations of purchased books by genre/category with percentage distributions.
  - Chronological purchase history with delivery tracking states.

---

## 6. Interactive MFS Payment Gateway Suite

FolioVerse features an automated, carrier-authentic Mobile Financial Service (MFS) payment gateway simulator supporting **bKash**, **Nagad**, and **Rocket**:

| Action | Endpoint | Purpose |
| :--- | :--- | :--- |
| `initiate` | `POST /api/orders/gateway-initiate/` | Creates gateway session, dynamic QR payload, expiration timestamp. |
| `send-otp` | `POST /api/orders/gateway-send-otp/` | Dispatches 6-digit carrier SMS OTP with 2-minute validity. |
| `verify-otp` | `POST /api/orders/gateway-verify-otp/` | Validates OTP code against session state with 3-attempt lock. |
| `confirm-pin` | `POST /api/orders/gateway-confirm-pin/` | Validates encrypted MFS PIN, settles payment, generates authentic TrxID, and updates `Order.payment_status = 'paid'`. |
| `qr-scan` | `POST /api/orders/gateway-qr-scan/` | Simulates instant in-app QR approval from buyer's smartphone. |
| `cancel` | `POST /api/orders/gateway-cancel/` | Cancels active payment session safely. |

---

## 7. Automated Testing & Verification Suite

The backend test suite consists of **49 automated test cases** across `books.test_security`, `books.tests`, and `accounts.tests`:

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

### Coverage Highlights:
- **Security Hardening (14 tests)**: IDOR cross-tenant modification rejection, IP+Username composite login rate throttling (HTTP 429), token rotation, Stored XSS sanitization, CSP/HSTS header enforcement, contact message zero-trust access.
- **Bookstore Operations (31 tests)**: Pagination, multi-genre filtering, Bengali/English literature filters, atomic single-book buy (`/buy/`), Redis stock decrement, insufficient stock rollback compensation, `admin_summary` aggregations, and `seller_summary` fulfillment pipelines.
- **Accounts & RBAC (4 tests)**: Registration, duplicate username rejection, credential validation, and role assignment.
