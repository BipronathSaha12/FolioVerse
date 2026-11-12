"""
Asynchronous tasks for FolioVerse books app.
Handles inventory reconciliation and background synchronization.
"""
import logging

logger = logging.getLogger(__name__)

try:
    from celery import shared_task
except ImportError:
    def shared_task(func):
        return func


@shared_task
def sync_inventory_from_redis_to_db(book_id):
    """
    Asynchronously syncs inventory from Redis cache back to PostgreSQL.
    """
    from .models import Book
    from .redis_inventory import RedisInventoryManager

    cached_stock = RedisInventoryManager.get_stock(book_id)
    if cached_stock is not None:
        updated = Book.objects.filter(id=book_id).update(stock=cached_stock)
        logger.info(f"Asynchronously synced Book #{book_id} stock to {cached_stock} (rows: {updated})")
        return f"Synced Book #{book_id} stock to {cached_stock}"
    return f"Book #{book_id} had no cached stock in Redis"
