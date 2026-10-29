import re
from urllib.parse import urlparse
from django.utils.html import escape
from rest_framework import serializers
from .models import Book


def sanitize_text(text: str) -> str:
    """
    Sanitizes user input to prevent Stored Cross-Site Scripting (XSS).
    Strips leading/trailing whitespace and escapes dangerous HTML characters.
    """
    if not text:
        return ''
    return escape(str(text).strip())


def validate_safe_url(url: str) -> str:
    """
    Validates URL scheme to prevent javascript: pseudo-protocol and internal SSRF vectors.
    """
    if not url or not str(url).strip():
        return ''
    cleaned = str(url).strip()
    parsed = urlparse(cleaned)
    if parsed.scheme.lower() not in ('http', 'https'):
        raise serializers.ValidationError("Cover image URL must use http or https protocol.")
    
    # Reject private IP and loopback SSRF targets
    hostname = (parsed.hostname or '').lower()
    if hostname in ('localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', '::1'):
        raise serializers.ValidationError("Internal and loopback URLs are not permitted.")
    return cleaned


class BookSerializer(serializers.ModelSerializer):
    """
    Serializer for the Book model with strict ownership lockdown and input sanitization.
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
        # Prevent Mass-Assignment of seller, status, and system timestamps
        read_only_fields = [
            'id',
            'seller',
            'seller_username',
            'status',
            'created_at',
            'updated_at',
        ]

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
        return sanitize_text(value)

    def validate_author(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Author cannot be empty.")
        return sanitize_text(value)

    def validate_description(self, value):
        return sanitize_text(value)

    def validate_cover_image(self, value):
        return validate_safe_url(value)


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
        read_only_fields = [
            'id',
            'order_number',
            'payment_status',
            'transaction_id',
            'status',
            'total_amount',
            'created_at',
            'updated_at',
        ]

    def validate_customer_name(self, value):
        return sanitize_text(value)

    def validate_customer_phone(self, value):
        return sanitize_text(value)

    def validate_shipping_address(self, value):
        return sanitize_text(value)


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

    def validate_name(self, value):
        return sanitize_text(value)

    def validate_contact(self, value):
        return sanitize_text(value)

    def validate_message(self, value):
        return sanitize_text(value)
