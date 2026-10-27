from django.contrib import admin
from django.urls import path, include
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """
    FolioVerse Book Store API Root Overview.
    """
    return Response({
        "project": "FolioVerse Book Store REST API",
        "version": "1.0.0",
        "endpoints": {
            "register": request.build_absolute_uri("/api/register/"),
            "login": request.build_absolute_uri("/api/login/"),
            "user_profile": request.build_absolute_uri("/api/user/"),
            "logout": request.build_absolute_uri("/api/logout/"),
            "books_list_create": request.build_absolute_uri("/api/books/"),
            "book_detail": request.build_absolute_uri("/api/books/<id>/"),
        },
        "query_features": {
            "filter_by_author": "/api/books/?author=J.K. Rowling",
            "search_by_title": "/api/books/?search=Harry",
            "order_by_price_asc": "/api/books/?ordering=price",
            "order_by_price_desc": "/api/books/?ordering=-price",
            "pagination": "/api/books/?page=2",
        },
        "throttling": {
            "anonymous": "20 requests/minute",
            "authenticated": "50 requests/minute"
        }
    })


urlpatterns = [
    # Root health and API overview for direct browser clicks
    path('', api_root, name='root-overview'),
    path('health/', api_root, name='root-health'),
    path('admin/', admin.site.urls),

    # Standard /api/ namespace
    path('api/', api_root, name='api-root'),
    path('api/health/', api_root, name='api-health'),
    path('api/', include('accounts.urls')),
    path('api/', include('books.urls')),

    # Fallback routes without /api prefix for maximum client resilience
    path('', include('accounts.urls')),
    path('', include('books.urls')),
]
