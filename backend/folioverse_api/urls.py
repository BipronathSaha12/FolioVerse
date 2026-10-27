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


from django.core.management import call_command
from books.models import Book


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def seed_database_api(request):
    """
    Automated endpoint to seed 2,000 books and demo accounts without requiring a paid Render shell.
    """
    try:
        call_command('create_demo_accounts')
        current_count = Book.objects.count()
        if current_count < 2000:
            call_command('seed_bookstore', target=2000)
            final_count = Book.objects.count()
            return Response({
                "status": "success",
                "message": f"Successfully seeded {final_count} books and verified all demo accounts!",
                "books_count": final_count,
            })
        return Response({
            "status": "success",
            "message": f"Database already contains {current_count} books. Demo accounts verified.",
            "books_count": current_count,
        })
    except Exception as e:
        return Response({
            "status": "error",
            "message": str(e)
        }, status=500)


urlpatterns = [
    # Root health and API overview for direct browser clicks
    path('', api_root, name='root-overview'),
    path('health/', api_root, name='root-health'),
    path('admin/', admin.site.urls),

    # Automated 1-Click Database Seeding (No paid shell needed)
    path('api/seed-database/', seed_database_api, name='api-seed-database'),
    path('seed-database/', seed_database_api, name='seed-database'),

    # Standard /api/ namespace
    path('api/', api_root, name='api-root'),
    path('api/health/', api_root, name='api-health'),
    path('api/', include('accounts.urls')),
    path('api/', include('books.urls')),

    # Fallback routes without /api prefix for maximum client resilience
    path('', include('accounts.urls')),
    path('', include('books.urls')),
]
