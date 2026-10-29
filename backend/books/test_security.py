"""
Integration and Security Regression Tests for FolioVerse.
Validates:
1. Layer 1: HTTP Security Headers and CSP enforcement.
2. Layer 2: Login throttling / rate limiting (HTTP 429) & token rotation.
3. Layer 3: Elimination of IDOR (User A cannot PATCH or DELETE User B's books/orders),
   mass-assignment protection, and contact privacy.
"""
from decimal import Decimal
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from books.models import Book, Order, OrderItem, ContactInquiry


class SecurityHardeningTests(TestCase):
    def setUp(self):
        # Clear cache before each test to ensure predictable rate limits
        cache.clear()
        self.client = APIClient()

        # Create test users: User A (Seller A), User B (Seller B), and Admin
        self.user_a = User.objects.create_user(
            username='seller_a',
            email='seller_a@example.com',
            password='Password123!'
        )
        self.token_a = Token.objects.create(user=self.user_a)

        self.user_b = User.objects.create_user(
            username='seller_b',
            email='seller_b@example.com',
            password='Password123!'
        )
        self.token_b = Token.objects.create(user=self.user_b)

        self.admin_user = User.objects.create_superuser(
            username='security_admin',
            email='admin@example.com',
            password='AdminPassword123!'
        )
        self.admin_token = Token.objects.create(user=self.admin_user)

        # Create Book owned by User A
        self.book_a = Book.objects.create(
            title="User A's Exclusive Novel",
            author="Author Alpha",
            price=Decimal('250.00'),
            published_date="2025-01-01",
            category="Fiction",
            subcategory="Thriller",
            language="English",
            condition="New",
            stock=15,
            seller=self.user_a
        )

    # -------------------------------------------------------------------------
    # Layer 1 Tests: Security Headers
    # -------------------------------------------------------------------------
    def test_security_headers_present(self):
        """
        Verify that all API responses include CSP, X-Content-Type-Options,
        X-Frame-Options, and Referrer-Policy headers.
        """
        response = self.client.get('/api/books/')
        self.assertIn('Content-Security-Policy', response.headers)
        self.assertIn("default-src 'self'", response.headers['Content-Security-Policy'])
        self.assertEqual(response.headers.get('X-Content-Type-Options'), 'nosniff')
        self.assertEqual(response.headers.get('X-Frame-Options'), 'DENY')
        self.assertEqual(response.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin')

    # -------------------------------------------------------------------------
    # Layer 2 Tests: Rate Limiting & Token Security
    # -------------------------------------------------------------------------
    def test_exceeding_login_attempts_triggers_429(self):
        """
        Verify that exceeding auth rate limit triggers HTTP 429 Too Many Requests.
        Rate is set to 5/minute for auth_login.
        """
        login_url = '/api/login/'
        payload = {
            "username": "seller_a",
            "password": "WrongPasswordAttempt"
        }

        # First 5 attempts should return 400 Bad Request (invalid credentials)
        for i in range(5):
            res = self.client.post(login_url, payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, f"Attempt {i+1} failed")

        # 6th attempt should be throttled
        throttled_response = self.client.post(login_url, payload, format='json')
        self.assertEqual(
            throttled_response.status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Expected HTTP 429 after exceeding login burst threshold"
        )
        self.assertIn('detail', throttled_response.data)

    def test_token_rotation_on_login(self):
        """
        Verify that logging in rotates the authentication token.
        """
        old_token_key = self.token_a.key
        res = self.client.post('/api/login/', {
            "username": "seller_a",
            "password": "Password123!"
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        new_token_key = res.data['token']
        self.assertNotEqual(old_token_key, new_token_key)
        self.assertFalse(Token.objects.filter(key=old_token_key).exists())
        self.assertTrue(Token.objects.filter(key=new_token_key, user=self.user_a).exists())

    def test_logout_revokes_token(self):
        """
        Verify that logout revokes the user's token immediately.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a.key}')
        logout_res = self.client.post('/api/logout/')
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        # Confirm old token is deleted from database
        self.assertFalse(Token.objects.filter(key=self.token_a.key).exists())

        # Attempting authenticated action with revoked token should yield 401
        check_res = self.client.get('/api/user/')
        self.assertEqual(check_res.status_code, status.HTTP_401_UNAUTHORIZED)

    # -------------------------------------------------------------------------
    # Layer 3 Tests: Zero-Trust Access Control & IDOR Prevention
    # -------------------------------------------------------------------------
    def test_user_b_cannot_patch_user_a_book(self):
        """
        IDOR Test: User B attempts to PATCH User A's book. Must return 403 Forbidden.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_b.key}')
        patch_payload = {
            "price": "199.99",
            "title": "Hacked Title by User B"
        }
        url = f'/api/books/{self.book_a.id}/'
        response = self.client.patch(url, patch_payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # Verify book in database remains untouched
        self.book_a.refresh_from_db()
        self.assertEqual(self.book_a.title, "User A's Exclusive Novel")
        self.assertEqual(self.book_a.price, Decimal('250.00'))

    def test_user_b_cannot_delete_user_a_book(self):
        """
        IDOR Test: User B attempts to DELETE User A's book. Must return 403 Forbidden.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_b.key}')
        url = f'/api/books/{self.book_a.id}/'
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Book.objects.filter(id=self.book_a.id).exists())

    def test_user_a_can_patch_and_delete_own_book(self):
        """
        Legitimate Owner Test: User A can successfully update and delete their own book.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a.key}')
        url = f'/api/books/{self.book_a.id}/'

        # User A updates own book
        patch_res = self.client.patch(url, {"price": "299.00"}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.book_a.refresh_from_db()
        self.assertEqual(self.book_a.price, Decimal('299.00'))

        # User A deletes own book
        del_res = self.client.delete(url)
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Book.objects.filter(id=self.book_a.id).exists())

    def test_admin_can_manage_any_book(self):
        """
        Admin Moderation Test: Store administrators can edit or delete any book.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        url = f'/api/books/{self.book_a.id}/'
        patch_res = self.client.patch(url, {"title": "Moderated by Admin"}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)

    def test_seller_cannot_be_spoofed_on_creation(self):
        """
        Mass Assignment Test: Creating a book with seller=User_B while authenticated as User_A
        must ignore client seller field and assign seller=User_A.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a.key}')
        payload = {
            "title": "Legitimate Novel",
            "author": "Author One",
            "price": "220.00",
            "published_date": "2025-02-01",
            "category": "Fiction",
            "subcategory": "Fantasy",
            "language": "English",
            "condition": "New",
            "stock": 10,
            "seller": self.user_b.id  # Attempt to spoof User B as seller
        }
        res = self.client.post('/api/books/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        new_book = Book.objects.get(id=res.data['id'])
        self.assertEqual(new_book.seller, self.user_a)

    def test_user_b_cannot_inspect_user_a_order(self):
        """
        Order IDOR Test: User B cannot retrieve or delete User A's order details.
        """
        order_a = Order.objects.create(
            order_number="ORD-TEST-001",
            user=self.user_a,
            customer_name="Seller A",
            customer_email="seller_a@example.com",
            customer_phone="01711111111",
            shipping_address="Dhaka, Bangladesh",
            payment_method="cod",
            total_amount=Decimal('500.00'),
            status="confirmed"
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_b.key}')
        res = self.client.get(f'/api/orders/{order_a.id}/')
        # Scoped queryset returns 404 (not found for this user)
        self.assertIn(res.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

    def test_user_b_cannot_update_status_of_user_a_order(self):
        """
        Order Status IDOR: User B cannot invoke update-status on User A's order.
        """
        order_a = Order.objects.create(
            order_number="ORD-TEST-002",
            user=self.user_a,
            customer_name="Seller A",
            customer_email="seller_a@example.com",
            customer_phone="01711111111",
            shipping_address="Dhaka, Bangladesh",
            payment_method="cod",
            total_amount=Decimal('500.00'),
            status="confirmed"
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_b.key}')
        res = self.client.post(
            f'/api/orders/{order_a.id}/update-status/',
            {"status": "delivered", "payment_status": "paid"},
            format='json'
        )
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_anonymous_cannot_list_contact_inquiries(self):
        """
        Privacy Test: Anonymous users cannot list or view contact inquiries.
        """
        ContactInquiry.objects.create(
            name="Confidential Customer",
            email="confidential@example.com",
            contact="01800000000",
            message="Private sensitive inquiry."
        )

        # Anonymous GET should be rejected (401/403)
        res = self.client.get('/api/contact/')
        self.assertIn(res.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_anonymous_can_submit_contact_inquiry(self):
        """
        Visitor Submission Test: Anonymous visitors can submit contact inquiries.
        """
        payload = {
            "name": "Jane Visitor",
            "email": "jane@example.com",
            "contact": "01722222222",
            "message": "Inquiry about your book catalog."
        }
        res = self.client.post('/api/contact/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ContactInquiry.objects.filter(email="jane@example.com").exists())

    def test_stored_xss_input_sanitization(self):
        """
        Input Sanitization Test: XSS payloads in book titles/descriptions are escaped.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a.key}')
        payload = {
            "title": "<script>alert('xss')</script>Malicious Title",
            "author": "Dr. <img src=x onerror=alert(1)>",
            "price": "250.00",
            "published_date": "2025-01-01",
            "category": "Fiction",
            "subcategory": "Thriller",
            "language": "English",
            "condition": "New",
            "stock": 5,
            "description": "<svg/onload=alert('stored')>Safe description"
        }
        res = self.client.post('/api/books/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        created_book = Book.objects.get(id=res.data['id'])
        self.assertNotIn('<script>', created_book.title)
        self.assertNotIn('<img', created_book.author)
        self.assertNotIn('<svg/onload', created_book.description)
