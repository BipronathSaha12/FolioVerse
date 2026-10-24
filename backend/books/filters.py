import django_filters
from .models import Book


class BookFilter(django_filters.FilterSet):
    """
    FilterSet for Book model.
    Enables:
    - Filter by Author: ?author=J.K. Rowling (case-insensitive substring/icontains or exact)
    - Filter by Min/Max Price: ?min_price=10&max_price=50
    """
    author = django_filters.CharFilter(field_name='author', lookup_expr='icontains')
    title = django_filters.CharFilter(field_name='title', lookup_expr='icontains')
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    class Meta:
        model = Book
        fields = ['author', 'title', 'min_price', 'max_price']
