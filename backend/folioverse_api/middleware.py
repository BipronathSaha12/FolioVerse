"""
Security Headers Middleware for FolioVerse API.
Enforces defense-in-depth HTTP response headers including Content-Security-Policy (CSP),
Permissions-Policy, HSTS, and Frame/MIME protection.
"""
from django.conf import settings


class SecurityHeadersMiddleware:
    """
    Appends security headers to all HTTP responses.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Baseline Content-Security-Policy
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https: http://localhost:* http://127.0.0.1:*",
            "frame-ancestors 'none'",
            "object-src 'none'",
            "base-uri 'self'",
        ]
        response.headers.setdefault('Content-Security-Policy', "; ".join(csp_directives))

        # Permissions-Policy
        response.headers.setdefault(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=(self)'
        )

        # Content Type and Frame Options
        response.headers.setdefault('X-Content-Type-Options', 'nosniff')
        response.headers.setdefault('X-Frame-Options', 'DENY')
        response.headers.setdefault('Referrer-Policy', 'strict-origin-when-cross-origin')

        # Strict-Transport-Security in production
        if not settings.DEBUG:
            hsts_seconds = getattr(settings, 'SECURE_HSTS_SECONDS', 31536000)
            response.headers.setdefault(
                'Strict-Transport-Security',
                f'max-age={hsts_seconds}; includeSubDomains; preload'
            )

        return response
