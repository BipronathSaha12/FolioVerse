from rest_framework import viewsets, permissions, filters
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from django_filters.rest_framework import DjangoFilterBackend

from .models import Book
from .serializers import BookSerializer
from .pagination import BookPagination
from .filters import BookFilter


class BookViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet providing full CRUD operations for Book model:
    - GET /api/books/            (List all books, paginated)
    - POST /api/books/           (Create a new book - Authenticated only)
    - GET /api/books/<id>/       (Retrieve single book by ID)
    - PUT /api/books/<id>/       (Update a book - Authenticated only)
    - PATCH /api/books/<id>/     (Partially update a book - Authenticated only)
    - DELETE /api/books/<id>/    (Delete a book - Authenticated only)

    Features:
    - Permissions: Anyone can view (safe methods), authenticated users can create/update/delete.
    - Filtering: Filter by author (?author=J.K. Rowling)
    - Searching: Search by title (?search=Harry)
    - Ordering: Order by price (?ordering=price or ?ordering=-price)
    - Pagination: 5 books per page (?page=2)
    - Throttling: Anon 20 req/min, Authenticated 50 req/min
    """
    queryset = Book.objects.all()
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
    search_fields = ['title']
    ordering_fields = ['price', 'title', 'published_date', 'created_at']
    ordering = ['-id']

    # Throttling
    throttle_classes = [AnonRateThrottle, UserRateThrottle]
