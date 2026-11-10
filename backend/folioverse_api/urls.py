from django.contrib import admin
from django.urls import path, include
from django.db import connection
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check_api(request):
    """
    Production Liveness and Readiness Probe for Render/Vercel/Kubernetes.
    Verifies that the API worker, database connection, and cache backend are functional.
    """
    health = {
        "status": "healthy",
        "service": "folioverse-api",
        "version": "1.0.0",
        "database": "connected",
        "cache": "connected",
    }
    status_code = 200

    # Test Database Connectivity
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            cursor.fetchone()
    except Exception as e:
        health["database"] = f"unhealthy: {str(e)}"
        health["status"] = "degraded"
        status_code = 503

    # Test Cache Readiness
    try:
        cache.set("folioverse_health_probe", "ok", timeout=10)
        cached_val = cache.get("folioverse_health_probe")
        if cached_val != "ok":
            health["cache"] = "degraded: read verification failed"
            health["status"] = "degraded"
            status_code = 503
    except Exception as e:
        health["cache"] = f"unhealthy: {str(e)}"
        health["status"] = "degraded"
        status_code = 503

    return Response(health, status=status_code)


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
            "health": request.build_absolute_uri("/api/health/"),
        },
        "query_features": {
            "filter_by_author": "/api/books/?author=J.K. Rowling",
            "search_by_title": "/api/books/?search=Harry",
            "order_by_price_asc": "/api/books/?ordering=price",
            "order_by_price_desc": "/api/books/?ordering=-price",
            "pagination": "/api/books/?page=2",
        },
        "throttling": {
            "anonymous": "30 requests/minute",
            "authenticated": "60 requests/minute"
        }
    })


from django.core.management import call_command
from django.conf import settings
from rest_framework import permissions
from books.models import Book


@api_view(['POST'])
def seed_database_api(request):
    """
    Automated endpoint to seed demo accounts and catalog.
    Restricted to store administrators or development environments.
    """
    is_admin = bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser))
    if not (settings.DEBUG or is_admin):
        return Response({
            "status": "error",
            "message": "Database seeding is disabled in production for non-administrative users."
        }, status=403)

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
    # Root API overview and production health/readiness probes
    path('', api_root, name='root-overview'),
    path('health/', health_check_api, name='root-health'),
    path('healthz/', health_check_api, name='root-healthz'),
    path('admin/', admin.site.urls),

    # Automated 1-Click Database Seeding (No paid shell needed)
    path('api/seed-database/', seed_database_api, name='api-seed-database'),
    path('seed-database/', seed_database_api, name='seed-database'),

    # Standard /api/ namespace
    path('api/', api_root, name='api-root'),
    path('api/health/', health_check_api, name='api-health'),
    path('api/healthz/', health_check_api, name='api-healthz'),
    path('api/', include('accounts.urls')),
    path('api/', include('books.urls')),

    # Fallback routes without /api prefix for maximum client resilience
    path('', include('accounts.urls')),
    path('', include('books.urls')),
]
