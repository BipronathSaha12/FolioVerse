from django.db import models
from django.contrib.auth.models import User


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
            models.CheckConstraint(check=models.Q(price__gte=0), name='book_price_non_negative'),
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
        return f"{self.title} by {self.author} [{self.category} / {self.subcategory}] - ${self.price} ({self.status})"
