"""
Custom Object-Level and Role-Based Permissions for FolioVerse.
Eliminates Insecure Direct Object References (IDOR) and protects customer PII.
"""
from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission allowing:
    - Safe read methods (GET, HEAD, OPTIONS) to all users.
    - Write/Update/Delete operations (PUT, PATCH, DELETE) ONLY to the owner (seller) of the resource or staff.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # Read-only permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        # Staff/Superusers retain full moderation capability
        if request.user.is_staff or request.user.is_superuser:
            return True

        # Check ownership on seller or user attribute
        owner = getattr(obj, 'seller', None) or getattr(obj, 'user', None)
        return owner == request.user


class IsOrderParticipantOrAdmin(permissions.BasePermission):
    """
    Zero-Trust access control for Orders:
    - POST (create order): AllowAny to facilitate checkout.
    - GET (list): Requires authentication; querysets are strictly scoped.
    - GET (retrieve detail): Requires authentication and caller must be the buyer, a seller with an item in the order, or staff.
    - PUT / PATCH / DELETE: Strictly reserved for store administrators.
    """
    def has_permission(self, request, view):
        if view.action == 'create':
            return True
        # Gateway and atomic payment callbacks use session verification
        if view.action in [
            'process_payment',
            'gateway_initiate',
            'gateway_send_otp',
            'gateway_verify_otp',
            'gateway_confirm_pin',
            'gateway_qr_scan',
            'gateway_cancel',
        ]:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        # For updates/deletions on order, regular users cannot tamper
        if request.method not in permissions.SAFE_METHODS and view.action != 'update_status':
            return False

        # If calling update_status, must be seller of an item in the order or staff
        if view.action == 'update_status':
            is_order_seller = obj.items.filter(book__seller=request.user).exists()
            return is_order_seller

        # Buyer ownership check
        is_buyer = (obj.user == request.user) or (
            request.user.email and obj.customer_email.lower() == request.user.email.lower()
        )
        is_seller = obj.items.filter(book__seller=request.user).exists()
        return is_buyer or is_seller


class IsContactManagerOrSubmitOnly(permissions.BasePermission):
    """
    Restricts Contact Inquiries:
    - POST (submission): AllowAny for visitors.
    - GET, PUT, PATCH, DELETE: Strictly staff/admin to prevent customer PII leakage.
    """
    def has_permission(self, request, view):
        if view.action == 'create' or request.method == 'POST':
            return True
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser))

    def has_object_permission(self, request, view, obj):
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser))
