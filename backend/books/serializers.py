from rest_framework import serializers
from .models import Book


class BookSerializer(serializers.ModelSerializer):
    """
    Serializer for the Book model with input validation for marketplace buy/sell operations.
    """
    seller_username = serializers.ReadOnlyField(source='seller.username')

    class Meta:
        model = Book
        fields = [
            'id',
            'title',
            'author',
            'price',
            'published_date',
            'category',
            'subcategory',
            'language',
            'condition',
            'stock',
            'status',
            'isbn',
            'description',
            'cover_image',
            'seller',
            'seller_username',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at', 'seller_username']

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price must be a non-negative number.")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock count cannot be negative.")
        return value

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty.")
        return value.strip()

    def validate_author(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Author cannot be empty.")
        return value.strip()
