from django.db import transaction
from django.db.models import Count, Q
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from django_filters.rest_framework import DjangoFilterBackend

from .models import Book
from .serializers import BookSerializer
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
