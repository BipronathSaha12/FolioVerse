from django.db import models


class Book(models.Model):
    """
    Book model for FolioVerse Book Store API.
    Required fields from assignment:
    - title
    - author
    - price
    - published_date
    """
    title = models.CharField(max_length=255, db_index=True)
    author = models.CharField(max_length=255, db_index=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    published_date = models.DateField()
    
    # Supplementary fields for enhanced UI/UX display
    description = models.TextField(blank=True, default='')
    cover_image = models.URLField(max_length=500, blank=True, default='')
    category = models.CharField(max_length=100, blank=True, default='Fiction')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-id']
        verbose_name = 'Book'
        verbose_name_plural = 'Books'

    def __str__(self):
        return f"{self.title} by {self.author} (${self.price})"
