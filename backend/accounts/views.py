from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
from .throttles import AuthAnonRateThrottle, LoginIpRateThrottle, LoginCompositeRateThrottle


class RegisterView(APIView):
    """
    POST /api/register/
    Register a new user and return an authentication token.
    Publicly accessible with strict burst rate throttling.
    """
    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response(
                {
                    "message": "User registered successfully.",
                    "token": token.key,
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    POST /api/login/
    Authenticate user with username and password, return rotated auth token.
    Enforces composite IP + username throttling to stop credential stuffing.
    """
    permission_classes = [AllowAny]
    throttle_classes = [LoginCompositeRateThrottle, LoginIpRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            # Token Rotation: Invalidate previous token and issue a fresh one
            Token.objects.filter(user=user).delete()
            token = Token.objects.create(user=user)
            return Response(
                {
                    "message": "Login successful.",
                    "token": token.key,
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """
    GET /api/user/
    Retrieve authenticated user profile details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    POST /api/logout/
    Revoke user auth token and terminate session upon logout.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Invalidate all active tokens for this user
        Token.objects.filter(user=request.user).delete()
        if hasattr(request, 'session'):
            request.session.flush()
        return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
