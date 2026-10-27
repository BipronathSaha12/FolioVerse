import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Book(models.Model):
    """
    Enriched Book Model for FolioVerse Digital Book Shop & Marketplace.
    Organized by hierarchical categories and subcategories:
    - Science (Physics, Astronomy, Biology, Computer Science, Environmental)
    - Technology (Artificial Intelligence, Web & Cloud, Cybersecurity, Software Architecture)
    - Fiction (Science Fiction, Mystery & Detective, Fantasy, Thriller, Historical)
    - Literature & Novel (Bengali Literature, English Literature, World Classics, Poetry)
    - Music (Music Theory, History & World Music, Biographies, Instruments)
    
    Includes robust inventory management, condition tracking, multi-language support (Bengali & English),
    and production-level database constraints to ensure data integrity during peak buy & sell traffic.
    """
    CATEGORY_CHOICES = [
        ('Science', 'Science'),
        ('Technology', 'Technology'),
        ('Fiction', 'Fiction'),
        ('Literature & Novel', 'Literature & Novel'),
        ('Music', 'Music'),
    ]

    CONDITION_CHOICES = [
        ('New', 'Brand New'),
        ('Like New', 'Used - Like New'),
        ('Good', 'Used - Good'),
        ('Fair', 'Used - Fair'),
    ]

    STATUS_CHOICES = [
        ('available', 'Available'),
        ('low_stock', 'Low Stock'),
        ('sold', 'Sold Out'),
    ]

    # Core assignment & bookstore fields
    title = models.CharField(max_length=255, db_index=True)
    author = models.CharField(max_length=255, db_index=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    published_date = models.DateField()

    # Taxonomy: Categories & Subcategories
    category = models.CharField(
        max_length=100,
        choices=CATEGORY_CHOICES,
        default='Literature & Novel',
        db_index=True
    )
    subcategory = models.CharField(
        max_length=100,
        default='English Literature',
        db_index=True,
        help_text="Subcategory (e.g. Bengali Literature, English Literature, AI, Physics, etc.)"
    )
    language = models.CharField(
        max_length=50,
        default='English',
        db_index=True,
        help_text="Language of the book (Bengali, English, etc.)"
    )

    # Buy / Sell Marketplace & Inventory fields
    condition = models.CharField(max_length=50, choices=CONDITION_CHOICES, default='New')
    stock = models.PositiveIntegerField(default=10, db_index=True, help_text="Available inventory units")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available', db_index=True)
    seller = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='listed_books')
    isbn = models.CharField(max_length=30, blank=True, default='')

    # Display & Metadata
    description = models.TextField(blank=True, default='')
    cover_image = models.URLField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-id']
        verbose_name = 'Book'
        verbose_name_plural = 'Books'
        indexes = [
            models.Index(fields=['category', 'subcategory']),
            models.Index(fields=['status', 'stock']),
            models.Index(fields=['author', 'title']),
            models.Index(fields=['price']),
            models.Index(fields=['language']),
        ]
        constraints = [
            models.CheckConstraint(check=models.Q(price__gte=180), name='book_price_min_180'),
            models.CheckConstraint(check=models.Q(stock__gte=0), name='book_stock_non_negative'),
        ]

    def save(self, *args, **kwargs):
        # Auto-update status based on inventory stock
        if self.stock == 0:
            self.status = 'sold'
        elif self.stock <= 3:
            self.status = 'low_stock'
        else:
            self.status = 'available'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} by {self.author} [{self.category} / {self.subcategory}] - ৳{self.price} ({self.status})"


class Order(models.Model):
    """
    Stores bookstore orders placed through single buy or multi-item cart checkout.
    Supports bKash, Nagad, Rocket, and Cash on Delivery (COD).
    """
    PAYMENT_CHOICES = [
        ('bkash', 'bKash Mobile Banking'),
        ('nagad', 'Nagad Mobile Banking'),
        ('rocket', 'Rocket Mobile Banking'),
        ('cod', 'Cash on Delivery (COD)'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending Payment'),
        ('paid', 'Paid'),
        ('failed', 'Payment Failed'),
    ]

    ORDER_STATUS_CHOICES = [
        ('confirmed', 'Order Confirmed'),
        ('processing', 'Processing Shipment'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    order_number = models.CharField(max_length=64, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=50, blank=True, default='')
    shipping_address = models.TextField()
    payment_method = models.CharField(max_length=30, choices=PAYMENT_CHOICES, default='cod', db_index=True)
    payment_status = models.CharField(max_length=30, choices=PAYMENT_STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, blank=True, default='')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=30, choices=ORDER_STATUS_CHOICES, default='confirmed')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-id']
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'

    def __str__(self):
        return f"Order {self.order_number} - {self.customer_name} ({self.payment_method}) - ৳{self.total_amount}"


class OrderItem(models.Model):
    """
    Line item inside an Order, capturing historical price, category, and book snapshot at purchase.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    book = models.ForeignKey(Book, on_delete=models.SET_NULL, null=True, blank=True, related_name='order_items')
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    category = models.CharField(max_length=100, default='Literature & Novel', blank=True, db_index=True)
    cover_image = models.URLField(max_length=500, blank=True, default='')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.quantity}x {self.title} [{self.category}] (৳{self.subtotal})"


class ContactInquiry(models.Model):
    """
    Inquiry submitted through the FolioVerse contact form, directed to bipronathsaha@gmail.com.
    """
    name = models.CharField(max_length=255)
    email = models.EmailField()
    contact = models.CharField(max_length=100)
    message = models.TextField()
    recipient_email = models.EmailField(default='bipronathsaha@gmail.com')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    is_resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ['-id']
        verbose_name = 'Contact Inquiry'
        verbose_name_plural = 'Contact Inquiries'

    def __str__(self):
        return f"Inquiry from {self.name} ({self.email}) at {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class PaymentTransaction(models.Model):
    """
    Manages state machine lifecycle for MFS Payment Gateway (bKash, Nagad, Rocket).
    Tracks session authorization, SMS OTP generation, expiration, validation attempts,
    masked security PIN verification, and gateway confirmation.
    """
    PROVIDER_CHOICES = [
        ('bkash', 'bKash'),
        ('nagad', 'Nagad'),
        ('rocket', 'Rocket'),
    ]

    STATUS_CHOICES = [
        ('INITIATED', 'Session Initiated'),
        ('OTP_SENT', 'OTP Dispatched'),
        ('OTP_VERIFIED', 'OTP Verified'),
        ('PAID', 'Payment Cleared'),
        ('FAILED', 'Payment Failed'),
        ('EXPIRED', 'Session Expired'),
        ('CANCELLED', 'Cancelled by User'),
    ]

    session_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='transactions')
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    customer_phone = models.CharField(max_length=20, blank=True, default='')
    otp_code = models.CharField(max_length=10, blank=True, default='')
    otp_expires_at = models.DateTimeField(null=True, blank=True)
    otp_attempts = models.PositiveIntegerField(default=0)
    pin_attempts = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='INITIATED', db_index=True)
    transaction_id = models.CharField(max_length=64, blank=True, default='', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-id']
        verbose_name = 'Payment Transaction'
        verbose_name_plural = 'Payment Transactions'

    def is_expired(self):
        from datetime import timedelta
        return timezone.now() > self.created_at + timedelta(minutes=10)

    def is_otp_valid(self, entered_otp):
        if not self.otp_code or not self.otp_expires_at:
            return False
        if timezone.now() > self.otp_expires_at:
            return False
        return self.otp_code.strip() == str(entered_otp).strip()

    def __str__(self):
        return f"MFS [{self.provider.upper()}] - Order {self.order.order_number} (৳{self.amount}) - Status: {self.status}"

