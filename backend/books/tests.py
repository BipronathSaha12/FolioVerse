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

        # Create 12 sample books for pagination & filtering tests
        self.books = [
            Book.objects.create(
                title=f"Harry Potter {i}",
                author="J.K. Rowling" if i <= 3 else "Other Author",
                price=10.00 + i * 5,
                published_date=date(2000 + i, 1, 1),
                description=f"Description for book {i}"
            )
            for i in range(1, 13)
        ]

    def test_anyone_can_view_books_list(self):
        """
        Requirement: Anyone can view the list of books (unauthenticated).
        Requirement: Pagination displays 5 books per page.
        """
        response = self.client.get('/api/books/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 5)
        self.assertEqual(response.data['count'], 12)
        self.assertEqual(response.data['total_pages'], 3)

    def test_pagination_page_2(self):
        """
        Requirement: GET /api/books/?page=2
        """
        response = self.client.get('/api/books/?page=2')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 5)
        self.assertEqual(response.data['current_page'], 2)

    def test_unauthenticated_cannot_create_book(self):
        """
        Requirement: Only authenticated users can create books.
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
            "title": "Fantastic Beasts",
            "author": "J.K. Rowling",
            "price": "29.99",
            "published_date": "2016-11-18",
            "description": "Magical creatures textbook."
        }
        response = self.client.post('/api/books/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], "Fantastic Beasts")
        self.assertEqual(response.data['author'], "J.K. Rowling")

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
            "title": "Harry Potter 1 Updated",
            "author": "J.K. Rowling",
            "price": "35.50",
            "published_date": "2001-01-01"
        }
        put_res = self.client.put(f'/api/books/{book.id}/', put_payload, format='json')
        self.assertEqual(put_res.status_code, status.HTTP_200_OK)
        book.refresh_from_db()
        self.assertEqual(book.title, "Harry Potter 1 Updated")

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

    def test_filter_by_author(self):
        """
        Requirement: GET /api/books/?author=J.K. Rowling
        """
        response = self.client.get('/api/books/?author=J.K. Rowling')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)
        for item in response.data['results']:
            self.assertEqual(item['author'], "J.K. Rowling")

    def test_search_by_title(self):
        """
        Requirement: GET /api/books/?search=Harry
        """
        response = self.client.get('/api/books/?search=Harry')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 12)

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
