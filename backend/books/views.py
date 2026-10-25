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

from .models import Book, Order, OrderItem
from .serializers import BookSerializer, OrderSerializer, OrderItemSerializer
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
    - POST /api/orders/       (Create new order with Stripe, bKash, Nagad, Rocket, or COD)
    - GET /api/orders/        (List all orders for store admin and dashboard)
    - GET /api/orders/<id>/   (Retrieve single order with order items)
    """
    queryset = Order.objects.all().prefetch_related('items')
    serializer_class = OrderSerializer
    permission_classes = [permissions.AllowAny]
    ordering = ['-id']

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

        valid_payment_methods = ['stripe', 'bkash', 'nagad', 'rocket', 'cod']
        if payment_method not in valid_payment_methods:
            return Response(
                {"error": f"Invalid payment method '{payment_method}'. Must be one of: {', '.join(valid_payment_methods)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if payment_method in ['bkash', 'nagad', 'rocket'] and not transaction_id:
            return Response(
                {"error": f"Transaction ID (TrxID) is required for {payment_method.upper()} mobile payments."},
                status=status.HTTP_400_BAD_REQUEST
            )

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
                payment_status='paid' if payment_method in ['stripe', 'bkash', 'nagad', 'rocket'] else 'pending',
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
