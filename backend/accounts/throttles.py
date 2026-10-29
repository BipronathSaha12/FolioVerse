"""
Granular Throttling Classes for FolioVerse API Gateway.
Provides composite IP + username brute-force protection and strict auth burst limits.
"""
from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle


class AuthAnonRateThrottle(AnonRateThrottle):
    """
    Limits unauthenticated requests on registration and credential endpoints.
    Rate: 'auth_anon' (e.g. 10/min)
    """
    scope = 'auth_anon'


class LoginIpRateThrottle(AnonRateThrottle):
    """
    Strict burst rate throttle for login attempts originating from a single IP.
    Rate: 'auth_login' (5/min)
    """
    scope = 'auth_login'


class LoginCompositeRateThrottle(SimpleRateThrottle):
    """
    Composite Rate Throttle combining Client IP address and Target Username/Email.
    Prevents both distributed brute force against a single account and single-IP credential stuffing.
    Rate: 'auth_login_composite' (5/min)
    """
    scope = 'auth_login_composite'

    def get_cache_key(self, request, view):
        if request.method != 'POST':
            return None

        ident = self.get_ident(request)
        username = ''
        if hasattr(request, 'data') and isinstance(request.data, dict):
            raw_username = request.data.get('username') or request.data.get('email') or ''
            username = str(raw_username).strip().lower()

        if not username:
            # Fallback to pure IP if username not yet extracted
            return self.cache_format % {
                'scope': self.scope,
                'ident': ident
            }

        # Composite key: IP + target account identifier
        composite_ident = f"{ident}:{username}"
        return self.cache_format % {
            'scope': self.scope,
            'ident': composite_ident
        }
