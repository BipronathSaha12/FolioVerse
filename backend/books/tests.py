from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from datetime import date
from .models import Book


class BookStoreAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create user and auth token
        self.user = User.objects.create_user(username='tester', email='tester@example.com', password='password123')
        self.token = Token.objects.create(user=self.user)

        # Create sample books across categories and subcategories
        self.books = [
            # Bengali Literature
            Book.objects.create(
                title=f"Bengali Book {i}",
                author="Rabindranath Tagore" if i <= 2 else "Kazi Nazrul Islam",
                price=10.00 + i * 2,
                published_date=date(1910 + i, 1, 1),
                category="Literature & Novel",
                subcategory="Bengali Literature",
                language="Bengali",
                stock=15,
                condition="New",
                description=f"Bengali literature description {i}"
            )
            for i in range(1, 5)
        ] + [
            # English Literature
            Book.objects.create(
                title=f"English Classic {i}",
                author="George Orwell" if i == 1 else "Jane Austen",
                price=15.00 + i * 3,
                published_date=date(1940 + i, 1, 1),
                category="Literature & Novel",
                subcategory="English Literature",
                language="English",
                stock=20,
                condition="New",
                description=f"English classic description {i}"
            )
            for i in range(1, 4)
        ] + [
            # Science & Technology
            Book.objects.create(
                title=f"Science Book {i}",
                author="Stephen Hawking",
                price=25.00 + i * 5,
                published_date=date(1980 + i, 1, 1),
                category="Science",
                subcategory="Physics",
                language="English",
                stock=5,
                condition="Like New",
                description=f"Science physics description {i}"
            )
            for i in range(1, 4)
        ] + [
            # Out of stock book
            Book.objects.create(
                title="Sold Out Book",
                author="Rare Author",
                price=40.00,
                published_date=date(2000, 1, 1),
                category="Fiction",
                subcategory="Fantasy & Magic",
                language="English",
                stock=0,
                status="sold",
                condition="Good",
                description="Currently sold out book"
            ),
            # Low stock book
            Book.objects.create(
                title="Low Stock Book",
                author="Limited Author",
                price=30.00,
                published_date=date(2010, 1, 1),
                category="Music",
                subcategory="Music Theory & Composition",
                language="English",
                stock=2,
                status="low_stock",
                condition="New",
                description="Only 2 left"
            ),
            # Additional book to make total 13
            Book.objects.create(
                title="Technology Extra",
                author="Martin Kleppmann",
                price=50.00,
                published_date=date(2017, 3, 16),
                category="Technology",
                subcategory="Software Architecture",
                language="English",
                stock=10,
                condition="New",
                description="Software architecture"
            )
        ]

    def test_anyone_can_view_books_list_10_per_page(self):
        """
        Requirement: Anyone can view the list of books (unauthenticated).
        Requirement: Pagination displays at least 10 books per page.
        """
        response = self.client.get('/api/books/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 10)
        self.assertEqual(response.data['count'], 13)
        self.assertEqual(response.data['total_pages'], 2)

    def test_pagination_page_2(self):
        """
        Requirement: GET /api/books/?page=2 retrieves page 2 with remaining 3 books
        """
        response = self.client.get('/api/books/?page=2')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)
        self.assertEqual(response.data['current_page'], 2)

    def test_taxonomy_endpoint(self):
        """
        Requirement: GET /api/books/taxonomy/ returns hierarchical categories with stats
        """
        response = self.client.get('/api/books/taxonomy/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('categories', response.data)
        self.assertIn('Science', response.data['categories'])
        self.assertIn('Literature & Novel', response.data['categories'])
        self.assertIn('Technology', response.data['categories'])
        self.assertIn('Fiction', response.data['categories'])
        self.assertIn('Music', response.data['categories'])
        self.assertEqual(response.data['total_catalog_size'], 13)

    def test_filter_by_category_and_subcategory(self):
        """
        Requirement: Filter by Bengali Literature in Literature & Novel
        """
        response = self.client.get('/api/books/', {'category': 'Literature & Novel', 'subcategory': 'Bengali Literature'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 4)
        for b in response.data['results']:
            self.assertEqual(b['subcategory'], "Bengali Literature")
            self.assertEqual(b['language'], "Bengali")

    def test_filter_in_stock_only(self):
        """
        Requirement: Filter only available in-stock books
        """
        response = self.client.get('/api/books/?in_stock=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 13 total books minus 1 sold out book = 12
        self.assertEqual(response.data['count'], 12)
        for b in response.data['results']:
            self.assertGreater(b['stock'], 0)

    def test_atomic_buy_action_success(self):
        """
        Requirement: POST /api/books/<id>/buy/ decrements inventory safely
        """
        book = Book.objects.get(title="Bengali Book 1")
        initial_stock = book.stock

        response = self.client.post(f'/api/books/{book.id}/buy/', {'quantity': 2}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('order', response.data)
        self.assertEqual(response.data['order']['quantity'], 2)

        book.refresh_from_db()
        self.assertEqual(book.stock, initial_stock - 2)

    def test_atomic_buy_action_insufficient_stock(self):
        """
        Requirement: Purchasing more copies than in stock returns 400 Bad Request
        """
        book = Book.objects.get(title="Sold Out Book")
        self.assertEqual(book.stock, 0)

        response = self.client.post(f'/api/books/{book.id}/buy/', {'quantity': 1}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_unauthenticated_cannot_create_book(self):
        """
        Requirement: Only authenticated users can list/create books.
        """
        payload = {
            "title": "Unauthorized Book",
            "author": "Ghost",
            "price": "19.99",
            "published_date": "2026-01-01"
        }
        response = self.client.post('/api/books/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_can_create_book(self):
        """
        Requirement: Authenticated user creates book with Token Authentication.
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        payload = {
            "title": "Gitanjali Special Edition",
            "author": "Rabindranath Tagore",
            "price": "29.99",
            "published_date": "1910-08-14",
            "category": "Literature & Novel",
            "subcategory": "Bengali Literature",
            "language": "Bengali",
            "stock": 10,
            "condition": "New",
            "description": "Nobel winning poetry collection."
        }
        response = self.client.post('/api/books/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], "Gitanjali Special Edition")
        self.assertEqual(response.data['author'], "Rabindranath Tagore")
        self.assertEqual(response.data['subcategory'], "Bengali Literature")

    def test_retrieve_single_book(self):
        """
        Requirement: GET /api/books/<id>/
        """
        book = self.books[0]
        response = self.client.get(f'/api/books/{book.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], book.title)

    def test_update_book_put_and_patch(self):
        """
        Requirement: PUT and PATCH /api/books/<id>/
        """
        book = self.books[0]
        # Unauthenticated update should fail
        response = self.client.patch(f'/api/books/{book.id}/', {"price": "99.99"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticated PATCH
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        patch_res = self.client.patch(f'/api/books/{book.id}/', {"price": "99.99"}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        book.refresh_from_db()
        self.assertEqual(float(book.price), 99.99)

        # Authenticated PUT
        put_payload = {
            "title": "Bengali Book 1 Updated",
            "author": "Rabindranath Tagore",
            "price": "35.50",
            "published_date": "1912-01-01",
            "category": "Literature & Novel",
            "subcategory": "Bengali Literature",
            "language": "Bengali",
            "stock": 12,
            "condition": "New"
        }
        put_res = self.client.put(f'/api/books/{book.id}/', put_payload, format='json')
        self.assertEqual(put_res.status_code, status.HTTP_200_OK)
        book.refresh_from_db()
        self.assertEqual(book.title, "Bengali Book 1 Updated")

    def test_delete_book(self):
        """
        Requirement: DELETE /api/books/<id>/
        """
        book = self.books[-1]
        # Unauthenticated delete fails
        response = self.client.delete(f'/api/books/{book.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticated delete succeeds
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        del_res = self.client.delete(f'/api/books/{book.id}/')
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Book.objects.filter(id=book.id).exists())

    def test_search_by_author_and_title(self):
        """
        Requirement: Search works across titles and authors
        """
        response = self.client.get('/api/books/?search=Rabindranath')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_order_by_price_ascending_and_descending(self):
        """
        Requirement: GET /api/books/?ordering=price and GET /api/books/?ordering=-price
        """
        # Ascending
        asc_res = self.client.get('/api/books/?ordering=price')
        self.assertEqual(asc_res.status_code, status.HTTP_200_OK)
        prices = [float(b['price']) for b in asc_res.data['results']]
        self.assertEqual(prices, sorted(prices))

        # Descending
        desc_res = self.client.get('/api/books/?ordering=-price')
        self.assertEqual(desc_res.status_code, status.HTTP_200_OK)
        desc_prices = [float(b['price']) for b in desc_res.data['results']]
        self.assertEqual(desc_prices, sorted(desc_prices, reverse=True))

    def test_create_order_cart_stripe(self):
        """
        Test multi-item Cart purchase with Stripe Card Payment.
        """
        b1 = self.books[0]
        b2 = self.books[1]
        payload = {
            "customer_name": "Rahim Ahmed",
            "customer_email": "rahim@example.com",
            "customer_phone": "+8801712345678",
            "shipping_address": "House 12, Road 5, Dhanmondi, Dhaka",
            "payment_method": "stripe",
            "transaction_id": "ch_mock_stripe_987654",
            "items": [
                {"book_id": b1.id, "quantity": 1},
                {"book_id": b2.id, "quantity": 2},
            ]
        }
        res = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['payment_method'], 'stripe')
        self.assertEqual(res.data['payment_status'], 'paid')
        self.assertEqual(len(res.data['items']), 2)

    def test_create_order_cart_bkash(self):
        """
        Test multi-item Cart purchase with bKash Mobile Banking.
        """
        b1 = self.books[2]
        payload = {
            "customer_name": "Farhana Sultana",
            "customer_email": "farhana@example.com",
            "customer_phone": "+8801812345678",
            "shipping_address": "Agrabad C/A, Chittagong",
            "payment_method": "bkash",
            "transaction_id": "BKASH992837482",
            "items": [
                {"book_id": b1.id, "quantity": 1}
            ]
        }
        res = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['payment_method'], 'bkash')
        self.assertEqual(res.data['transaction_id'], 'BKASH992837482')
        self.assertEqual(res.data['payment_status'], 'paid')

    def test_create_order_cart_cod(self):
        """
        Test multi-item Cart purchase with Cash on Delivery (COD).
        """
        b1 = self.books[3]
        payload = {
            "customer_name": "Tanvir Hasan",
            "customer_email": "tanvir@example.com",
            "customer_phone": "+8801912345678",
            "shipping_address": "Zindabazar, Sylhet",
            "payment_method": "cod",
            "items": [
                {"book_id": b1.id, "quantity": 1}
            ]
        }
        res = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['payment_method'], 'cod')
        self.assertEqual(res.data['payment_status'], 'pending')
