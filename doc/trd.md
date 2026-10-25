# FolioVerse — Technical Requirements Document (TRD)

**Document Version:** 1.0.0  
**Status:** Technical Specification  
**Authority / Owner:** Bipronath Saha (bipronathsaha@gmail.com)

---

## 1. Scope & Technical Objectives
This document defines the interface specifications, data contracts, pagination schemas, filtering grammar, and testing requirements for the FolioVerse Book Store & Marketplace.

---

## 2. REST API Specification

### Base URL: `http://127.0.0.1:8000/api`

### 2.1 Authentication Endpoints

#### `POST /register/`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "username": "buyer_jane",
    "email": "jane@example.com",
    "password": "SecurePassword123!",
    "password_confirm": "SecurePassword123!"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "token": "a1b2c3d4e5f678901234567890abcdef12345678",
    "user_id": 14,
    "username": "buyer_jane",
    "email": "jane@example.com"
  }
  ```

#### `POST /login/`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "username": "admin",
    "password": "admin12345"
  }
  ```
- **Response `200 OK`:** Returns authentication token and user profile.

---

### 2.2 Book Store & Marketplace Endpoints

#### `GET /books/`
- **Access:** Public Read
- **Query Parameters:**
  | Parameter | Type | Description | Example |
  | :--- | :--- | :--- | :--- |
  | `page` | Integer | Page index (1-based) | `page=2` |
  | `page_size` | Integer | Items per page (default: 10, max: 100) | `page_size=10` |
  | `category` | String | Case-insensitive exact genre match | `category=Literature %26 Novel` |
  | `subcategory` | String | Case-insensitive subcategory substring | `subcategory=Bengali Literature` |
  | `language` | String | Language filter | `language=Bengali` |
  | `condition` | String | Condition choice (New, Like New, Good, Fair) | `condition=New` |
  | `in_stock` | Boolean | Returns books with `stock > 0` | `in_stock=true` |
  | `search` | String | Text search across title, author, description | `search=Rabindranath` |
  | `ordering` | String | Sort field (`price`, `-price`, `title`, `created_at`) | `ordering=-price` |

- **Response `200 OK` Schema:**
  ```json
  {
    "count": 2000,
    "total_pages": 200,
    "current_page": 1,
    "page_size": 10,
    "next": "http://127.0.0.1:8000/api/books/?page=2",
    "previous": null,
    "results": [
      {
        "id": 2000,
        "title": "Gitanjali",
        "author": "Rabindranath Tagore",
        "price": "14.50",
        "published_date": "1910-08-14",
        "category": "Literature & Novel",
        "subcategory": "Bengali Literature",
        "language": "Bengali",
        "condition": "New",
        "stock": 25,
        "status": "available",
        "isbn": "978-0143420583",
        "description": "Nobel Prize winning collection of poetry.",
        "cover_image": "https://images.unsplash.com/...",
        "seller": null,
        "seller_username": null,
        "created_at": "2026-10-25T11:58:11Z",
        "updated_at": "2026-10-25T11:58:11Z"
      }
    ]
  }
  ```

#### `POST /books/<id>/buy/`
- **Access:** Public Instant Checkout
- **Description:** Concurrency-safe atomic book purchase. Decrements inventory in PostgreSQL using `select_for_update()`.
- **Request Body:**
  ```json
  {
    "quantity": 2
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "message": "Successfully purchased 2 copy(ies) of 'Gitanjali'!",
    "order": {
      "book_id": 2000,
      "title": "Gitanjali",
      "author": "Rabindranath Tagore",
      "category": "Literature & Novel",
      "subcategory": "Bengali Literature",
      "quantity": 2,
      "unit_price": "14.50",
      "total_amount": "29.00",
      "remaining_stock": 23,
      "status": "available"
    }
  }
  ```
- **Error Responses:**
  - `HTTP 400 Bad Request` if `quantity > stock`:
    ```json
    {
      "error": "Insufficient stock. Only 1 item(s) available for 'Gitanjali'.",
      "available_stock": 1
    }
    ```
  - `HTTP 404 Not Found` if book ID does not exist.

#### `GET /books/taxonomy/`
- **Access:** Public
- **Description:** Returns live category and subcategory overview with total catalog size and in-stock counts.
- **Response `200 OK`:**
  ```json
  {
    "categories": {
      "Literature & Novel": {
        "subcategories": ["Bengali Literature", "English Literature", "World Classics", "Poetry & Plays", "Contemporary Novels"],
        "total_books": 1290
      },
      "Science": {
        "subcategories": ["Physics", "Astronomy & Cosmology", "Biology & Genetics", "Computer Science", "Environmental Science"],
        "total_books": 224
      },
      "Technology": {
        "subcategories": ["Artificial Intelligence & ML", "Web & Cloud Engineering", "Cybersecurity & Networks", "Software Architecture", "Mobile Development"],
        "total_books": 151
      },
      "Fiction": {
        "subcategories": ["Science Fiction", "Mystery & Detective", "Fantasy & Magic", "Psychological Thriller", "Historical Fiction"],
        "total_books": 249
      },
      "Music": {
        "subcategories": ["Music Theory & Composition", "History & World Music", "Biographies & Memoirs", "Instruments & Performance"],
        "total_books": 86
      }
    },
    "total_catalog_size": 2000,
    "in_stock_count": 1892
  }
  ```

#### `POST /books/`
- **Access:** Authenticated (Token required)
- **Description:** List a new book for sale. Automatically binds `seller` to authenticated user.
- **Request Body:**
  ```json
  {
    "title": "Clean Architecture",
    "author": "Robert C. Martin",
    "price": "34.00",
    "published_date": "2017-09-20",
    "category": "Technology",
    "subcategory": "Software Architecture",
    "language": "English",
    "condition": "New",
    "stock": 15,
    "isbn": "978-0134494166",
    "description": "A craftsman's guide to software structure and design.",
    "cover_image": "https://images.unsplash.com/..."
  }
  ```

---

## 3. Data Integrity & Validation Rules

1. **Price Validation:**
   - Evaluated at DRF serializer: `validate_price()` rejects negative floats.
   - Enforced at PostgreSQL level: `CONSTRAINT book_price_non_negative CHECK (price >= 0)`.
2. **Stock Validation:**
   - Serializer rejects `stock < 0`.
   - PostgreSQL constraint: `CONSTRAINT book_stock_non_negative CHECK (stock >= 0)`.
3. **Automatic Status Transitions:**
   - `stock == 0`: `status = 'sold'` (purchase button disabled, red badge).
   - `1 <= stock <= 3`: `status = 'low_stock'` (amber badge with pulse).
   - `stock > 3`: `status = 'available'` (green badge).

---

## 4. Test Strategy & Acceptance Matrix

| Test Case | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| `TC-01` | Public access to `GET /api/books/` | HTTP 200, 10 items returned, count = 2000 | **PASSED** |
| `TC-02` | Pagination page 2 `GET /api/books/?page=2` | HTTP 200, items 11..20, total_pages = 200 | **PASSED** |
| `TC-03` | Filter Bengali Literature | HTTP 200, all items have `language='Bengali'` | **PASSED** |
| `TC-04` | Filter in-stock only `?in_stock=true` | HTTP 200, only items with `stock > 0` | **PASSED** |
| `TC-05` | Atomic purchase of valid stock | HTTP 200, stock decrements by purchased qty | **PASSED** |
| `TC-06` | Over-purchase attempt (`qty > stock`) | HTTP 400 Bad Request with descriptive error | **PASSED** |
| `TC-07` | Unauthenticated book creation | HTTP 401 Unauthorized | **PASSED** |
| `TC-08` | Authenticated book creation | HTTP 201 Created with valid ID | **PASSED** |
| `TC-09` | Search by author / title | Sub-15ms filtered response | **PASSED** |
| `TC-10` | Taxonomy hierarchy stats | HTTP 200 with live category counts | **PASSED** |
