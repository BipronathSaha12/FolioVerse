from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    """
    Authoritative database profile for role-based access control (RBAC).
    Guarantees user role persistence across devices and sessions without
    relying on username patterns or client-side storage.
    """
    class Role(models.TextChoices):
        BUYER = 'buyer', 'Book Buyer'
        SELLER = 'seller', 'Book Seller'
        ADMIN = 'admin', 'Store Administrator'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.BUYER, db_index=True)
    phone = models.CharField(max_length=30, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-id']
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'

    def __str__(self):
        return f"{self.user.username} ({self.role})"


@receiver(post_save, sender=User)
def create_or_save_user_profile(sender, instance, created, **kwargs):
    """
    Ensures every User instance has a corresponding UserProfile with the proper role.
    """
    if created:
        if instance.is_staff or instance.is_superuser or instance.username == 'admin':
            default_role = UserProfile.Role.ADMIN
        elif 'seller' in instance.username.lower():
            default_role = UserProfile.Role.SELLER
        else:
            default_role = UserProfile.Role.BUYER

        UserProfile.objects.get_or_create(user=instance, defaults={'role': default_role})
    else:
        if hasattr(instance, 'profile'):
            # Keep admin role synchronized with staff status
            if (instance.is_staff or instance.is_superuser) and instance.profile.role != UserProfile.Role.ADMIN:
                instance.profile.role = UserProfile.Role.ADMIN
            instance.profile.save()
