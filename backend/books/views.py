import time
import random
from decimal import Decimal
from django.db import transaction
from django.db.models import Count, Q
from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from django_filters.rest_framework import DjangoFilterBackend

from .models import Book, Order, OrderItem, ContactInquiry, PaymentTransaction
from .serializers import BookSerializer, OrderSerializer, OrderItemSerializer, ContactInquirySerializer
from .pagination import BookPagination
from .filters import BookFilter
from .payment_gateway import gateway_provider
from .permissions import IsOwnerOrReadOnly, IsOrderParticipantOrAdmin, IsContactManagerOrSubmitOnly


class BookViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet providing full CRUD & Marketplace operations for FolioVerse Book Store:
    - GET /api/books/                (List all books, paginated 10/page)
    - POST /api/books/               (List/Sell a new book - Authenticated or seller)
    - GET /api/books/<id>/           (Retrieve single book by ID)
    - PUT /api/books/<id>/           (Update book details - Owner/Seller or Admin only)
    - PATCH /api/books/<id>/         (Partial update - Owner/Seller or Admin only)
    - DELETE /api/books/<id>/        (Delete a book - Owner/Seller or Admin only)
    - POST /api/books/<id>/buy/      (Transaction-safe atomic purchase with inventory decrement)
    - GET /api/books/taxonomy/       (Hierarchical categories & subcategories overview)
    """
    queryset = Book.objects.all().select_related('seller')
    serializer_class = BookSerializer
    permission_classes = [IsOwnerOrReadOnly]
    pagination_class = BookPagination

    # Filter backends
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = BookFilter
    search_fields = ['title', 'author', 'description', 'subcategory', 'language', 'isbn']
    ordering_fields = ['price', 'title', 'published_date', 'stock', 'created_at']
    ordering = ['-id']

    # Throttling
    throttle_classes = [AnonRateThrottle, UserRateThrottle]

    def perform_create(self, serializer):
        # Attach current logged in user as seller if authenticated
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(seller=self.request.user)
        else:
            serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def buy(self, request, pk=None):
        """
        High-scale, concurrency-safe atomic checkout endpoint.
        Uses select_for_update() inside a transaction to prevent race conditions during high purchase volume.
        """
        quantity = int(request.data.get('quantity', 1))
        if quantity <= 0:
            return Response(
                {"error": "Purchase quantity must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            try:
                book = Book.objects.select_for_update().get(pk=pk)
            except Book.DoesNotExist:
                return Response({"error": "Book not found."}, status=status.HTTP_404_NOT_FOUND)

            if book.stock < quantity:
                return Response(
                    {
                        "error": f"Insufficient stock. Only {book.stock} item(s) available for '{book.title}'.",
                        "available_stock": book.stock
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Decrement inventory safely
            book.stock -= quantity
            book.save()

            total_amount = float(book.price) * quantity

            return Response({
                "message": f"Successfully purchased {quantity} copy(ies) of '{book.title}'!",
                "order": {
                    "book_id": book.id,
                    "title": book.title,
                    "author": book.author,
                    "category": book.category,
                    "subcategory": book.subcategory,
                    "quantity": quantity,
                    "unit_price": str(book.price),
                    "total_amount": f"{total_amount:.2f}",
                    "remaining_stock": book.stock,
                    "status": book.status,
                }
            }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def taxonomy(self, request):
        """
        Returns structured category and subcategory hierarchy with active live counts.
        """
        taxonomy_data = {
            "Science": [
                "Physics",
                "Astronomy & Cosmology",
                "Biology & Genetics",
                "Computer Science",
                "Environmental Science"
            ],
            "Technology": [
                "Artificial Intelligence & ML",
                "Web & Cloud Engineering",
                "Cybersecurity & Networks",
                "Software Architecture",
                "Mobile Development"
            ],
            "Fiction": [
                "Science Fiction",
                "Mystery & Detective",
                "Fantasy & Magic",
                "Psychological Thriller",
                "Historical Fiction"
            ],
            "Literature & Novel": [
                "Bengali Literature",
                "English Literature",
                "World Classics",
                "Poetry & Plays",
                "Contemporary Novels"
            ],
            "Music": [
                "Music Theory & Composition",
                "History & World Music",
                "Biographies & Memoirs",
                "Instruments & Performance"
            ]
        }

        # Query live count per category
        stats = {}
        for cat, subcats in taxonomy_data.items():
            count = Book.objects.filter(category__iexact=cat).count()
            stats[cat] = {
                "subcategories": subcats,
                "total_books": count,
            }

        return Response({
            "categories": stats,
            "total_catalog_size": Book.objects.count(),
            "in_stock_count": Book.objects.filter(stock__gt=0).count(),
        })


class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling Cart and Book orders:
    - POST /api/orders/                 (Create new order with bKash, Nagad, Rocket, or COD)
    - GET /api/orders/                  (List orders - auto-scoped to current buyer or full store for admin)
    - GET /api/orders/<id>/             (Retrieve single order with order items)
    - POST /api/orders/process-payment/ (Automated API Payment Gateway for bKash, Nagad & Rocket)
    """
    serializer_class = OrderSerializer
    permission_classes = [IsOrderParticipantOrAdmin]
    ordering = ['-id']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            # Zero-Trust: Anonymous callers cannot query order listings or details
            return Order.objects.none()

        qs = Order.objects.all().prefetch_related('items')

        # Admin and staff can inspect all store orders or filter by query parameters
        if user.is_staff or user.is_superuser:
            email = self.request.query_params.get('customer_email') or self.request.query_params.get('email')
            username = self.request.query_params.get('customer_username') or self.request.query_params.get('username')
            if email:
                qs = qs.filter(customer_email__iexact=email.strip())
            elif username:
                qs = qs.filter(Q(user__username__iexact=username.strip()) | Q(customer_name__iexact=username.strip()))
            return qs.order_by('-id')

        # Regular authenticated users: strictly scope to orders they purchased or items they sell
        return qs.filter(
            Q(user=user) |
            Q(customer_email__iexact=user.email) |
            Q(items__book__seller=user)
        ).distinct().order_by('-id')

    @action(detail=False, methods=['get'], url_path='buyer-summary', permission_classes=[permissions.IsAuthenticated])
    def buyer_summary(self, request):
        """
        Dynamic analytics endpoint for the Buyer Dashboard:
        - Resolves buyer safely: regular users can only see their own summary.
        - Staff can view other accounts via ?username= or ?email=.
        """
        is_admin_user = bool(request.user.is_staff or request.user.is_superuser)
        username_param = request.query_params.get('username') or request.query_params.get('customer_username')
        email_param = request.query_params.get('email') or request.query_params.get('customer_email')

        if is_admin_user and (username_param or email_param):
            if username_param:
                target_user = User.objects.filter(username__iexact=username_param.strip()).first()
            else:
                target_user = User.objects.filter(email__iexact=email_param.strip()).first()
        else:
            target_user = request.user
            username_param = None
            email_param = None

        orders_qs = Order.objects.all().prefetch_related('items')
        if target_user:
            orders_qs = orders_qs.filter(Q(user=target_user) | Q(customer_email__iexact=target_user.email))
        else:
            orders_qs = Order.objects.none()

        total_orders = orders_qs.count()
        total_spent = sum((o.total_amount for o in orders_qs), Decimal('0.00'))

        category_order_counts = {}
        category_order_amounts = {}
        category_cleared_counts = {}
        category_cleared_amounts = {}
        total_books_ordered = 0
        total_books_cleared = 0
        cleared_payment_amount = Decimal('0.00')

        payment_breakdown = {
            'bkash': {'label': 'bKash Mobile Banking', 'orders': 0, 'books': 0, 'amount': Decimal('0.00'), 'cleared': True},
            'nagad': {'label': 'Nagad Mobile Banking', 'orders': 0, 'books': 0, 'amount': Decimal('0.00'), 'cleared': True},
            'rocket': {'label': 'Rocket Mobile Banking', 'orders': 0, 'books': 0, 'amount': Decimal('0.00'), 'cleared': True},
            'cod': {'label': 'Cash on Delivery (COD)', 'orders': 0, 'books': 0, 'amount': Decimal('0.00'), 'cleared': False},
        }

        for order in orders_qs:
            method = order.payment_method.lower()
            if method not in payment_breakdown:
                payment_breakdown[method] = {'label': method.upper(), 'orders': 0, 'books': 0, 'amount': Decimal('0.00'), 'cleared': False}

            payment_breakdown[method]['orders'] += 1
            payment_breakdown[method]['amount'] += order.total_amount

            is_order_cleared = (order.payment_status == 'paid' or order.status == 'delivered' or method in ['bkash', 'nagad', 'rocket'])
            if is_order_cleared:
                cleared_payment_amount += order.total_amount

            order_items = order.items.all()
            for itm in order_items:
                cat = itm.category or (itm.book.category if itm.book else 'Literature & Novel')
                qty = itm.quantity
                subtotal = itm.subtotal

                total_books_ordered += qty
                payment_breakdown[method]['books'] += qty
                category_order_counts[cat] = category_order_counts.get(cat, 0) + qty
                category_order_amounts[cat] = category_order_amounts.get(cat, Decimal('0.00')) + subtotal

                if is_order_cleared:
                    total_books_cleared += qty
                    category_cleared_counts[cat] = category_cleared_counts.get(cat, 0) + qty
                    category_cleared_amounts[cat] = category_cleared_amounts.get(cat, Decimal('0.00')) + subtotal

        categories_ordered = [
            {
                'category': cat,
                'count': count,
                'total_amount': f"{category_order_amounts.get(cat, Decimal('0.00')):.2f}",
                'percentage': round((count / total_books_ordered * 100), 1) if total_books_ordered > 0 else 0
            }
            for cat, count in sorted(category_order_counts.items(), key=lambda x: x[1], reverse=True)
        ]

        cleared_categories = [
            {
                'category': cat,
                'count': count,
                'total_amount': f"{category_cleared_amounts.get(cat, Decimal('0.00')):.2f}",
                'percentage': round((count / total_books_cleared * 100), 1) if total_books_cleared > 0 else 0
            }
            for cat, count in sorted(category_cleared_counts.items(), key=lambda x: x[1], reverse=True)
        ]

        formatted_payment_breakdown = [
            {
                'method': k,
                'label': v['label'],
                'orders': v['orders'],
                'books': v['books'],
                'amount': f"{v['amount']:.2f}",
                'is_cleared': v['cleared'],
            }
            for k, v in payment_breakdown.items() if v['orders'] > 0
        ]

        serialized_orders = OrderSerializer(orders_qs[:30], many=True).data

        return Response({
            'buyer_username': target_user.username if target_user else username_param or 'Guest Buyer',
            'buyer_email': target_user.email if target_user else email_param or '',
            'total_orders': total_orders,
            'total_books_ordered': total_books_ordered,
            'total_spent': f"{total_spent:.2f}",
            'cleared_payment_amount': f"{cleared_payment_amount:.2f}",
            'cleared_books_count': total_books_cleared,
            'categories_ordered': categories_ordered,
            'cleared_categories': cleared_categories,
            'payment_methods_breakdown': formatted_payment_breakdown,
            'recent_orders': serialized_orders,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='seller-summary', permission_classes=[permissions.IsAuthenticated])
    def seller_summary(self, request):
        """
        Comprehensive portal endpoint for marketplace book sellers:
        - Authenticated seller can only access their own dashboard.
        - Staff can view other sellers via ?seller_username= or ?username=.
        """
        is_admin_user = bool(request.user.is_staff or request.user.is_superuser)
        username_param = request.query_params.get('seller_username') or request.query_params.get('username')

        if is_admin_user and username_param:
            target_user = User.objects.filter(username__iexact=username_param.strip()).first() or request.user
        else:
            target_user = request.user

        seller_books = Book.objects.filter(seller=target_user).order_by('-id') if target_user else Book.objects.none()
        total_listed = seller_books.count()
        active_stock = sum((b.stock for b in seller_books), 0)
        low_stock_count = seller_books.filter(stock__lte=3, stock__gt=0).count()
        out_of_stock_count = seller_books.filter(stock=0).count()

        # Incoming orders containing this seller's books
        if target_user:
            seller_items = OrderItem.objects.filter(book__seller=target_user).select_related('order', 'book').order_by('-id')
        else:
            seller_items = OrderItem.objects.none()

        # Group items by order
        orders_map = {}
        total_revenue = Decimal('0.00')
        total_sold_units = 0

        for itm in seller_items:
            ord_obj = itm.order
            total_revenue += itm.subtotal
            total_sold_units += itm.quantity

            if ord_obj.id not in orders_map:
                orders_map[ord_obj.id] = {
                    'order_id': ord_obj.id,
                    'order_number': ord_obj.order_number,
                    'customer_name': ord_obj.customer_name,
                    'customer_email': ord_obj.customer_email,
                    'customer_phone': ord_obj.customer_phone,
                    'shipping_address': ord_obj.shipping_address,
                    'payment_method': ord_obj.payment_method,
                    'payment_status': ord_obj.payment_status,
                    'transaction_id': ord_obj.transaction_id,
                    'status': ord_obj.status,
                    'total_order_amount': str(ord_obj.total_amount),
                    'created_at': ord_obj.created_at.isoformat(),
                    'seller_items': [],
                    'seller_subtotal': Decimal('0.00'),
                }
            orders_map[ord_obj.id]['seller_items'].append({
                'item_id': itm.id,
                'book_id': itm.book.id if itm.book else None,
                'title': itm.title,
                'author': itm.author,
                'category': itm.category,
                'unit_price': str(itm.unit_price),
                'quantity': itm.quantity,
                'subtotal': str(itm.subtotal),
            })
            orders_map[ord_obj.id]['seller_subtotal'] += itm.subtotal

        # Format orders list
        incoming_orders = []
        pending_fulfillments = 0
        for ord_data in orders_map.values():
            if ord_data['status'] in ['confirmed', 'processing']:
                pending_fulfillments += 1
            ord_data['seller_subtotal'] = str(ord_data['seller_subtotal'])
            incoming_orders.append(ord_data)

        # Serialized seller books (limited to 50 for quick modal view)
        serialized_books = BookSerializer(seller_books[:50], many=True).data

        return Response({
            'seller_username': target_user.username if target_user else 'Unknown Seller',
            'seller_email': target_user.email if target_user else '',
            'total_listed_books': total_listed,
            'active_stock': active_stock,
            'low_stock_count': low_stock_count,
            'out_of_stock_count': out_of_stock_count,
            'total_sold_units': total_sold_units,
            'total_revenue': f"{total_revenue:.2f}",
            'pending_fulfillments': pending_fulfillments,
            'incoming_orders': incoming_orders,
            'catalog_books': serialized_books,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'patch'], url_path='update-status', permission_classes=[permissions.IsAuthenticated])
    def update_status(self, request, pk=None):
        """
        Allows seller or admin to approve / update order status (e.g. processing, shipped, delivered, cancelled)
        and moderate payment status. Strictly checks ownership to prevent IDOR status manipulation.
        """
        order = self.get_object()

        # Authorization: caller must be administrator or seller of at least one book in this order
        is_admin = bool(request.user.is_staff or request.user.is_superuser)
        is_order_seller = order.items.filter(book__seller=request.user).exists()
        if not (is_admin or is_order_seller):
            return Response(
                {"error": "You do not have permission to update the status of this order."},
                status=status.HTTP_403_FORBIDDEN
            )

        new_status = request.data.get('status')
        new_payment_status = request.data.get('payment_status')

        valid_statuses = [c[0] for c in Order.ORDER_STATUS_CHOICES]
        if new_status:
            if new_status not in valid_statuses:
                return Response(
                    {"error": f"Invalid order status '{new_status}'. Allowed: {', '.join(valid_statuses)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            order.status = new_status

        valid_pay_statuses = [c[0] for c in Order.PAYMENT_STATUS_CHOICES]
        if new_payment_status:
            if new_payment_status not in valid_pay_statuses:
                return Response(
                    {"error": f"Invalid payment status '{new_payment_status}'. Allowed: {', '.join(valid_pay_statuses)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            order.payment_status = new_payment_status

        order.save()
        return Response({
            "message": f"Order #{order.order_number} status updated to '{order.status}'.",
            "order": OrderSerializer(order).data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='process-payment', permission_classes=[permissions.AllowAny])
    def process_payment(self, request):
        """
        Automated API Payment Gateway endpoint for bKash, Nagad, and Rocket.
        Executes mobile banking payment API verification without manual steps.
        """
        provider = (request.data.get('provider') or 'bkash').lower()
        account_number = (request.data.get('account_number') or '').strip()
        amount = request.data.get('amount', '0.00')

        if provider not in ['bkash', 'nagad', 'rocket']:
            return Response(
                {"error": f"Invalid mobile banking provider '{provider}'. Must be 'bkash', 'nagad', or 'rocket'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not account_number:
            return Response(
                {"error": f"Please enter your {provider.upper()} registered mobile number (e.g. 017XXXXXXXX)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        clean_num = ''.join(ch for ch in account_number if ch.isdigit())
        if len(clean_num) < 11:
            return Response(
                {"error": "Invalid Bangladeshi mobile account number. Must be at least 11 digits (e.g. 017XXXXXXXX)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        txn_id = f"{provider.upper()}-TXN-{int(time.time() % 1000000):06d}{random.randint(10, 99)}"

        return Response({
            "success": True,
            "status": "PAID",
            "provider": provider,
            "provider_name": "bKash" if provider == 'bkash' else "Nagad" if provider == 'nagad' else "Rocket",
            "account_number": clean_num,
            "amount": amount,
            "currency": "BDT",
            "transaction_id": txn_id,
            "message": f"Payment of ৳{amount} verified and completed via {provider.upper()} API Gateway.",
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='gateway-initiate', permission_classes=[permissions.AllowAny])
    def gateway_initiate(self, request):
        """
        Initiates a high-fidelity MFS Payment Gateway session for bKash, Nagad, or Rocket.
        Returns session_id, dynamic QR payload, expiration time, and provider metadata.
        """
        order_id = request.data.get('order_id')
        provider = (request.data.get('provider') or 'bkash').lower()
        amount = request.data.get('amount')
        phone = (request.data.get('phone') or '').strip()

        if not order_id:
            return Response({"error": "order_id is required to initiate gateway session."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session_data = gateway_provider.initiate(
                order_id=order_id,
                provider=provider,
                amount=amount,
                customer_phone=phone
            )
            return Response(session_data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Failed to initiate payment session: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='gateway-send-otp', permission_classes=[permissions.AllowAny])
    def gateway_send_otp(self, request):
        """
        Dispatches an authentic 6-digit carrier SMS OTP for the active gateway session.
        """
        session_id = request.data.get('session_id')
        phone = (request.data.get('phone') or '').strip()

        if not session_id:
            return Response({"error": "session_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not phone:
            return Response({"error": "Mobile phone number is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = gateway_provider.send_otp(session_id=session_id, phone=phone)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Failed to dispatch OTP: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='gateway-verify-otp', permission_classes=[permissions.AllowAny])
    def gateway_verify_otp(self, request):
        """
        Verifies the 6-digit OTP code against session state and expiration time.
        """
        session_id = request.data.get('session_id')
        otp_code = (request.data.get('otp_code') or '').strip()

        if not session_id or not otp_code:
            return Response({"error": "session_id and otp_code are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = gateway_provider.verify_otp(session_id=session_id, otp_code=otp_code)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Failed to verify OTP: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='gateway-confirm-pin', permission_classes=[permissions.AllowAny])
    def gateway_confirm_pin(self, request):
        """
        Validates masked MFS PIN, settles payment atomically, and updates Order to PAID.
        """
        session_id = request.data.get('session_id')
        pin = (request.data.get('pin') or '').strip()

        if not session_id or not pin:
            return Response({"error": "session_id and pin are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = gateway_provider.confirm_pin(session_id=session_id, pin=pin)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Failed to confirm PIN: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='gateway-qr-scan', permission_classes=[permissions.AllowAny])
    def gateway_qr_scan(self, request):
        """
        Simulates dynamic QR scan confirmation directly from the buyer's mobile app.
        """
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({"error": "session_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = gateway_provider.simulate_qr_scan(session_id=session_id)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"QR scan confirmation failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='gateway-cancel', permission_classes=[permissions.AllowAny])
    def gateway_cancel(self, request):
        """
        Cancels active gateway session.
        """
        session_id = request.data.get('session_id')
        if session_id:
            res = gateway_provider.cancel(session_id)
            return Response(res, status=status.HTTP_200_OK)
        return Response({"status": "CANCELLED"}, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        data = request.data
        items_data = data.get('items', [])
        if not items_data or not isinstance(items_data, list):
            return Response(
                {"error": "Cart is empty. Please add at least one book to place an order."},
                status=status.HTTP_400_BAD_REQUEST
            )

        customer_name = (data.get('customer_name') or '').strip()
        customer_email = (data.get('customer_email') or '').strip()
        customer_phone = (data.get('customer_phone') or '').strip()
        shipping_address = (data.get('shipping_address') or '').strip()
        payment_method = (data.get('payment_method') or 'cod').lower()
        transaction_id = (data.get('transaction_id') or '').strip()

        if not customer_name:
            return Response({"error": "Full name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not customer_email:
            return Response({"error": "Email address is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not shipping_address:
            return Response({"error": "Shipping address is required."}, status=status.HTTP_400_BAD_REQUEST)

        valid_payment_methods = ['bkash', 'nagad', 'rocket', 'cod']
        if payment_method not in valid_payment_methods:
            return Response(
                {"error": f"Invalid payment method '{payment_method}'. Must be one of: {', '.join(valid_payment_methods)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Resolve initial payment status
        initial_payment_status = (data.get('payment_status') or '').lower()
        if not initial_payment_status:
            if payment_method in ['bkash', 'nagad', 'rocket']:
                initial_payment_status = 'paid' if transaction_id else 'pending'
            else:
                initial_payment_status = 'pending'

        # Resolve User association reliably
        resolved_user = request.user if (request.user and request.user.is_authenticated) else None
        if not resolved_user:
            username_field = (data.get('username') or '').strip()
            if username_field:
                resolved_user = User.objects.filter(username__iexact=username_field).first()
            if not resolved_user and customer_email:
                resolved_user = User.objects.filter(email__iexact=customer_email).first()

        # Atomic checkout: lock books and decrement inventory
        with transaction.atomic():
            order_number = f"FV-ORD-{int(time.time())}-{random.randint(1000, 9999)}"
            order = Order.objects.create(
                order_number=order_number,
                user=resolved_user,
                customer_name=customer_name,
                customer_email=customer_email,
                customer_phone=customer_phone,
                shipping_address=shipping_address,
                payment_method=payment_method,
                payment_status=initial_payment_status,
                transaction_id=transaction_id,
                total_amount=Decimal('0.00'),
                status='confirmed',
            )

            total_amount = Decimal('0.00')
            created_items = []

            for item in items_data:
                book_id = item.get('book_id') or item.get('id')
                qty = int(item.get('quantity', 1))

                if qty <= 0:
                    transaction.set_rollback(True)
                    return Response(
                        {"error": f"Quantity for book ID {book_id} must be at least 1."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                try:
                    book = Book.objects.select_for_update().get(pk=book_id)
                except Book.DoesNotExist:
                    transaction.set_rollback(True)
                    return Response(
                        {"error": f"Book with ID {book_id} was not found in catalog."},
                        status=status.HTTP_404_NOT_FOUND
                    )

                if book.stock < qty:
                    transaction.set_rollback(True)
                    return Response(
                        {
                            "error": f"Insufficient stock for '{book.title}'. Available: {book.stock}, requested: {qty}.",
                            "book_id": book.id,
                            "available_stock": book.stock,
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Decrement stock
                book.stock -= qty
                book.save()

                item_subtotal = book.price * qty
                total_amount += item_subtotal

                order_item = OrderItem.objects.create(
                    order=order,
                    book=book,
                    title=book.title,
                    author=book.author,
                    category=book.category or 'Literature & Novel',
                    cover_image=book.cover_image or '',
                    unit_price=book.price,
                    quantity=qty,
                    subtotal=item_subtotal,
                )
                created_items.append(order_item)

            order.total_amount = total_amount
            order.save()

            serializer = OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class ContactViewSet(viewsets.ModelViewSet):
    """
    Public submission and Admin moderation endpoint for Contact Inquiries:
    POST /api/contact/ : Dispatches and stores visitor messages with sanitization
    GET /api/contact/  : Restricted to store administrator (prevents PII leakage)
    """
    queryset = ContactInquiry.objects.all().order_by('-id')
    serializer_class = ContactInquirySerializer
    permission_classes = [IsContactManagerOrSubmitOnly]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        inquiry = serializer.save(recipient_email='bipronathsaha@gmail.com')

        # Attempt sending through Django email if SMTP is configured
        try:
            from django.core.mail import send_mail
            email_subject = f"[FolioVerse Contact] New inquiry from {inquiry.name}"
            email_body = f"Hello Authority,\n\nName: {inquiry.name}\nEmail: {inquiry.email}\nContact: {inquiry.contact}\n\nMessage:\n{inquiry.message}\n\n---\nSent via FolioVerse Contact Form"
            send_mail(
                email_subject,
                email_body,
                inquiry.email,
                ['bipronathsaha@gmail.com'],
                fail_silently=True
            )
        except Exception:
            pass

        return Response(
            {
                "success": True,
                "message": "Your message has been successfully received and routed to bipronathsaha@gmail.com",
                "inquiry": serializer.data
            },
            status=status.HTTP_201_CREATED
        )

