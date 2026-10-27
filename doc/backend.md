# FolioVerse — Backend DRF & PostgreSQL Architecture Guide

**Document Version:** 1.0.0  
**Status:** Backend Architecture Specification  
**Authority / Owner:** Bipronath Saha (bipronathsaha@gmail.com)

---

## 1. Backend Architecture Overview

The FolioVerse backend is engineered using **Django 5.2** and **Django REST Framework 3.16** atop **PostgreSQL 16**. It is structured into two core modular applications:
1. `backend/accounts/`: User registration, Token Authentication, and profile endpoints.
2. `backend/books/`: Catalog management, marketplace buy/sell actions, taxonomy aggregation, filtering, pagination, and concurrency safety.

```
backend/
├── accounts/
│   ├── serializers.py         # User & registration serializers
│   ├── urls.py                # Auth routing (/api/register/, /api/login/, /api/user/)
│   └── views.py               # Auth API views
├── books/
│   ├── management/
│   │   └── commands/
│   │       ├── create_demo_accounts.py # Provision admin, buyer, seller demo accounts
│   │       ├── seed_bookstore.py       # High-speed bulk generator for 2,000 categorized books
│   │       └── seed_books.py           # Base seed script
│   ├── migrations/
│   │   ├── 0001_initial.py
│   │   └── 0002_book_condition_book_isbn_book_language_book_seller_and_more.py
│   ├── filters.py             # Custom django-filter FilterSet
│   ├── models.py              # Enriched Book model with SQL constraints & composite indexes
│   ├── pagination.py          # 10-item PageNumberPagination
│   ├── serializers.py         # BookSerializer with non-negative validation
│   ├── tests.py               # 14 automated unit and integration tests
│   ├── urls.py                # REST router for /api/books/
│   └── views.py               # BookViewSet with atomic checkout & taxonomy endpoints
├── folioverse_api/
│   ├── settings.py            # DRF config, throttling rules, DB credentials, CORS
│   └── urls.py                # Root URL dispatcher
└── manage.py
```

---

## 2. Models & Database Engineering (`models.py`)

### 2.1 The `Book` Model
```python
class Book(models.Model):
    CATEGORY_CHOICES = [
        ('Science', 'Science'),
        ('Technology', 'Technology'),
        ('Fiction', 'Fiction'),
        ('Literature & Novel', 'Literature & Novel'),
        ('Music', 'Music'),
    ]

    CONDITION_CHOICES = [
        ('New', 'Brand New'),
        ('Like New', 'Used - Like New'),
        ('Good', 'Used - Good'),
        ('Fair', 'Used - Fair'),
    ]

    STATUS_CHOICES = [
        ('available', 'Available'),
        ('low_stock', 'Low Stock'),
        ('sold', 'Sold Out'),
    ]

    title = models.CharField(max_length=255, db_index=True)
    author = models.CharField(max_length=255, db_index=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    published_date = models.DateField()
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES, default='Literature & Novel', db_index=True)
    subcategory = models.CharField(max_length=100, default='English Literature', db_index=True)
    language = models.CharField(max_length=50, default='English', db_index=True)
    condition = models.CharField(max_length=50, choices=CONDITION_CHOICES, default='New')
    stock = models.PositiveIntegerField(default=10, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available', db_index=True)
    seller = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='listed_books')
    isbn = models.CharField(max_length=30, blank=True, default='')
    description = models.TextField(blank=True, default='')
    cover_image = models.URLField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-id']
        indexes = [
            models.Index(fields=['category', 'subcategory']),
            models.Index(fields=['status', 'stock']),
            models.Index(fields=['author', 'title']),
            models.Index(fields=['price']),
            models.Index(fields=['language']),
        ]
        constraints = [
            models.CheckConstraint(check=models.Q(price__gte=0), name='book_price_non_negative'),
            models.CheckConstraint(check=models.Q(stock__gte=0), name='book_stock_non_negative'),
        ]

    def save(self, *args, **kwargs):
        if self.stock == 0:
            self.status = 'sold'
        elif self.stock <= 3:
            self.status = 'low_stock'
        else:
            self.status = 'available'
        super().save(*args, **kwargs)
```

---

## 3. Views & Business Logic (`views.py`)

### 3.1 `BookViewSet`
Provides complete CRUD and marketplace operations:
- `perform_create`: Binds authenticated `seller=request.user` when listing books.
- `buy` (`POST /api/books/<id>/buy/`):
  - Wraps execution in `with transaction.atomic():`.
  - Executes `Book.objects.select_for_update().get(pk=pk)` to obtain an exclusive PostgreSQL row lock.
  - Decrements inventory: `book.stock -= quantity`.
  - Automatically invokes `book.save()`, recalculating availability status.
- `taxonomy` (`GET /api/books/taxonomy/`):
  - Returns category and subcategory overview with item counts.
  - Computes `total_catalog_size` and `in_stock_count` dynamically.

---

## 4. Query Filtering & Search (`filters.py`)

```python
class BookFilter(django_filters.FilterSet):
    author = django_filters.CharFilter(field_name='author', lookup_expr='icontains')
    title = django_filters.CharFilter(field_name='title', lookup_expr='icontains')
    category = django_filters.CharFilter(field_name='category', lookup_expr='iexact')
    subcategory = django_filters.CharFilter(field_name='subcategory', lookup_expr='icontains')
    language = django_filters.CharFilter(field_name='language', lookup_expr='iexact')
    condition = django_filters.CharFilter(field_name='condition', lookup_expr='iexact')
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock__gt=0, status__in=['available', 'low_stock'])
        return queryset
```

---

## 5. Management Commands

### 5.1 `create_demo_accounts`
Run via:
```bash
python manage.py create_demo_accounts
```
Provisions three verified accounts with pre-generated authentication tokens:
1. **Admin / Superuser:** `admin / admin12345` (`admin@folioverse.com`)
2. **Book Buyer:** `buyer_demo / buyer12345` (`buyer@folioverse.com`)
3. **Book Seller:** `seller_demo / seller12345` (`seller@folioverse.com`)

### 5.2 `seed_bookstore`
Run via:
```bash
python manage.py seed_bookstore --target 2000
```
Generates and bulk-inserts 2,000 production-ready books across all 5 genres:
- Literature & Novel (featuring 590+ Bengali Literature items, 400+ English classics, World Classics, Poetry).
- Science (Physics, Cosmology, Biology, Computer Science).
- Technology (AI & ML, Software Architecture, Cloud).
- Fiction (Sci-Fi, Fantasy, Mystery, Thriller).
- Music (Theory, Biographies, World Music, Instruments).

---

## 6. Order & Cart Checkout System (`Order`, `OrderItem`, `OrderViewSet`)

### 6.1 Database Schema
- **`Order` Model**:
  - `order_number`: Unique identifier (e.g., `FV-ORD-1792936212-2326`).
  - `user`: Foreign key to `auth.User` (nullable for guest buyers).
  - `customer_name`, `customer_email`, `customer_phone`, `shipping_address`.
  - `payment_method`: `stripe`, `bkash`, `nagad`, `rocket`, `cod`.
  - `payment_status`: `pending`, `paid`, `failed`.
  - `transaction_id`: TrxID for mobile payments or charge ID for Stripe.
  - `total_amount`: Total order charge.
  - `status`: `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`.
- **`OrderItem` Model**:
  - Line items capturing historical price, book reference, quantity, and subtotal.

### 6.2 REST Endpoints
- `POST /api/orders/`: Concurrency-safe atomic checkout across multiple items in cart. Locks books via `select_for_update()`, verifies stock, decrements inventory, and saves order.
- `GET /api/orders/`: Lists live orders with items and payment statuses for Store Admin Dashboard.
- `GET /api/orders/<id>/`: Detail view of single order with receipt.
- `GET /api/orders/my-orders/`: Returns personal order history for authenticated buyer.
- `GET /api/orders/seller-summary/`: Seller-specific aggregator returning total listed books, active stock count, low/out-of-stock counts, total sold units, sales revenue, and incoming orders containing the seller's books with buyer info and payment clearance status.
- `POST /api/orders/<id>/update-status/`: Seller and Admin action to transition order fulfillment (`confirmed` -> `processing` -> `shipped` -> `delivered`).

---

## 7. Automated Verification & Test Suite

The test suite across `backend/books/tests.py` and `backend/accounts/tests.py` verifies all requirements with **22 automated test cases**:
```bash
python manage.py test books accounts
```
Output:
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
Tested behaviors include:
1. User registration, password confirmation matching, token generation.
2. User authentication, invalid credentials rejection, token invalidation on logout.
3. 10-item pagination, page navigation, catalog volume validation.
4. Taxonomy endpoints and genre count aggregations.
5. Bengali & English literature filtering and subcategory searches.
6. Seller query filtering (`?seller=me`, `?seller=<username>`).
7. In-stock inventory filtering.
8. Atomic single-item buy with row lock (`select_for_update`).
9. Multi-item cart checkout with Credit Card (Stripe), bKash mobile banking, and Cash on Delivery (COD).
10. Inventory decrement and automatic status recalculation (`available` -> `low_stock` -> `sold`).
11. Over-purchase stock rejection.
12. Unauthenticated write rejection (HTTP 401).
13. Authenticated creation, single-item retrieval, PUT/PATCH updates, and price ordering.
