from rest_framework.routers import DefaultRouter
from .views import BookViewSet, OrderViewSet, ContactViewSet

router = DefaultRouter()
router.register(r'books', BookViewSet, basename='book')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'contact', ContactViewSet, basename='contact')

urlpatterns = router.urls
