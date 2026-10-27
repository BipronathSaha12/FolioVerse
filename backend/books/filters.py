import django_filters
from .models import Book


class BookFilter(django_filters.FilterSet):
    """
    Enhanced FilterSet for FolioVerse Digital Book Shop.
    Enables:
    - Filter by Category: ?category=Literature & Novel
    - Filter by Subcategory: ?subcategory=Bengali Literature or English Literature
    - Filter by Language: ?language=Bengali
    - Filter by Condition: ?condition=New
    - Filter by Availability/Status: ?status=available
    - Filter by In-Stock: ?in_stock=true
    - Filter by Author: ?author=J.K. Rowling
    - Filter by Min/Max Price: ?min_price=10&max_price=50
    """
    author = django_filters.CharFilter(field_name='author', lookup_expr='icontains')
    title = django_filters.CharFilter(field_name='title', lookup_expr='icontains')
    category = django_filters.CharFilter(field_name='category', lookup_expr='iexact')
    subcategory = django_filters.CharFilter(field_name='subcategory', lookup_expr='icontains')
    language = django_filters.CharFilter(field_name='language', lookup_expr='iexact')
    condition = django_filters.CharFilter(field_name='condition', lookup_expr='iexact')
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    seller = django_filters.CharFilter(method='filter_seller')

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock__gt=0, status__in=['available', 'low_stock'])
        return queryset

    def filter_seller(self, queryset, name, value):
        if value == 'me' and self.request and self.request.user and self.request.user.is_authenticated:
            return queryset.filter(seller=self.request.user)
        if value:
            return queryset.filter(seller__username__iexact=value.strip())
        return queryset

    class Meta:
        model = Book
        fields = [
            'author',
            'title',
            'category',
            'subcategory',
            'language',
            'condition',
            'status',
            'in_stock',
            'min_price',
            'max_price',
            'seller',
        ]
