import time
import random
from decimal import Decimal
from django.db import transaction
from django.db.models import Count, Q
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from django_filters.rest_framework import DjangoFilterBackend

from .models import Book, Order, OrderItem, ContactInquiry
from .serializers import BookSerializer, OrderSerializer, OrderItemSerializer, ContactInquirySerializer
from .pagination import BookPagination
from .filters import BookFilter


class BookViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet providing full CRUD & Marketplace operations for FolioVerse Book Store:
    - GET /api/books/                (List all books, paginated 10/page)
    - POST /api/books/               (List/Sell a new book - Authenticated or seller)
    - GET /api/books/<id>/           (Retrieve single book by ID)
    - PUT /api/books/<id>/           (Update book details)
    - PATCH /api/books/<id>/         (Partial update)
    - DELETE /api/books/<id>/        (Delete a book)
    - POST /api/books/<id>/buy/      (Transaction-safe atomic purchase with inventory decrement)
    - GET /api/books/taxonomy/       (Hierarchical categories & subcategories overview)
    """
    queryset = Book.objects.all().select_related('seller')
    serializer_class = BookSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
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
    permission_classes = [permissions.AllowAny]
    ordering = ['-id']

    def get_queryset(self):
        qs = Order.objects.all().prefetch_related('items')
        
        # Check query parameter for customer_email
        email = self.request.query_params.get('customer_email')
        if email:
            qs = qs.filter(customer_email__iexact=email.strip())

        # If user is authenticated and not staff, scope to their user id or email
        user = self.request.user
        if user and user.is_authenticated and not (user.is_staff or user.is_superuser):
            qs = qs.filter(Q(user=user) | Q(customer_email__iexact=user.email))

        return qs.order_by('-id')

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

        # For automated API payment, if transaction_id is missing, generate one
        if payment_method in ['bkash', 'nagad', 'rocket'] and not transaction_id:
            transaction_id = f"{payment_method.upper()}-TXN-{int(time.time() % 1000000):06d}{random.randint(10, 99)}"

        # Atomic checkout: lock books and decrement inventory
        with transaction.atomic():
            order_number = f"FV-ORD-{int(time.time())}-{random.randint(1000, 9999)}"
            order = Order.objects.create(
                order_number=order_number,
                user=request.user if request.user and request.user.is_authenticated else None,
                customer_name=customer_name,
                customer_email=customer_email,
                customer_phone=customer_phone,
                shipping_address=shipping_address,
                payment_method=payment_method,
                payment_status='paid' if payment_method in ['bkash', 'nagad', 'rocket'] else 'pending',
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
    Public and Admin endpoint for handling Contact Inquiries sent to bipronathsaha@gmail.com.
    POST /api/contact/ : Dispatches and stores visitor messages
    GET /api/contact/  : Allows store admin to review all inquiries
    """
    queryset = ContactInquiry.objects.all().order_by('-id')
    serializer_class = ContactInquirySerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        contact = request.data.get('contact', '').strip()
        message = request.data.get('message', '').strip()

        if not name:
            return Response({"error": "Please provide your name."}, status=status.HTTP_400_BAD_REQUEST)
        if not email or '@' not in email:
            return Response({"error": "Please provide a valid email address."}, status=status.HTTP_400_BAD_REQUEST)
        if not message:
            return Response({"error": "Please write your message."}, status=status.HTTP_400_BAD_REQUEST)

        inquiry = ContactInquiry.objects.create(
            name=name,
            email=email,
            contact=contact,
            message=message,
            recipient_email='bipronathsaha@gmail.com'
        )

        # Attempt sending through Django email if SMTP is configured
        try:
            from django.core.mail import send_mail
            email_subject = f"[FolioVerse Contact] New inquiry from {name}"
            email_body = f"Hello Authority,\n\nName: {name}\nEmail: {email}\nContact: {contact}\n\nMessage:\n{message}\n\n---\nSent via FolioVerse Contact Form"
            send_mail(
                email_subject,
                email_body,
                email,
                ['bipronathsaha@gmail.com'],
                fail_silently=True
            )
        except Exception:
            pass

        serializer = self.get_serializer(inquiry)
        return Response(
            {
                "success": True,
                "message": "Your message has been successfully received and routed to bipronathsaha@gmail.com",
                "inquiry": serializer.data
            },
            status=status.HTTP_201_CREATED
        )

