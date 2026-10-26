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
        if value < 180:
            raise serializers.ValidationError("Price must be at least ৳180 BDT.")
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


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import OrderItem
        model = OrderItem
        fields = ['id', 'book', 'title', 'author', 'category', 'cover_image', 'unit_price', 'quantity', 'subtotal']
        read_only_fields = ['id', 'title', 'author', 'category', 'cover_image', 'unit_price', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        from .models import Order
        model = Order
        fields = [
            'id',
            'order_number',
            'customer_name',
            'customer_email',
            'customer_phone',
            'shipping_address',
            'payment_method',
            'payment_status',
            'transaction_id',
            'total_amount',
            'status',
            'items',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'order_number', 'total_amount', 'created_at', 'updated_at']


class ContactInquirySerializer(serializers.ModelSerializer):
    class Meta:
        from .models import ContactInquiry
        model = ContactInquiry
        fields = [
            'id',
            'name',
            'email',
            'contact',
            'message',
            'recipient_email',
            'created_at',
            'is_resolved',
        ]
        read_only_fields = ['id', 'recipient_email', 'created_at', 'is_resolved']

