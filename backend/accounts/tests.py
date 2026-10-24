from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token


class AccountsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/register/'
        self.login_url = '/api/login/'

    def test_register_user_success(self):
        """
        POST /api/register/
        Anyone can register. Should return token and user details.
        """
        payload = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "secretpassword123",
            "password_confirm": "secretpassword123"
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['username'], 'newuser')
        self.assertTrue(Token.objects.filter(user__username='newuser').exists())

    def test_register_duplicate_username_fails(self):
        User.objects.create_user(username='existinguser', email='exist@example.com', password='password123')
        payload = {
            "username": "existinguser",
            "email": "diff@example.com",
            "password": "secretpassword123"
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        """
        POST /api/login/
        Login and obtain an authentication token.
        """
        User.objects.create_user(username='loginuser', email='login@example.com', password='mypassword123')
        payload = {
            "username": "loginuser",
            "password": "mypassword123"
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['username'], 'loginuser')

    def test_login_invalid_credentials_fails(self):
        User.objects.create_user(username='loginuser', email='login@example.com', password='mypassword123')
        payload = {
            "username": "loginuser",
            "password": "wrongpassword"
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
