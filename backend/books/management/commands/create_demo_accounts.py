from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token


class Command(BaseCommand):
    help = "Creates verified demo accounts for testing (Admin, Buyer, Seller)"

    def handle(self, *args, **options):
        accounts = [
            {
                "username": "admin",
                "email": "admin@folioverse.com",
                "password": "admin12345",
                "is_staff": True,
                "is_superuser": True,
                "role": "Administrator",
            },
            {
                "username": "buyer_demo",
                "email": "buyer@folioverse.com",
                "password": "buyer12345",
                "is_staff": False,
                "is_superuser": False,
                "role": "Book Buyer",
            },
            {
                "username": "seller_demo",
                "email": "seller@folioverse.com",
                "password": "seller12345",
                "is_staff": False,
                "is_superuser": False,
                "role": "Book Seller",
            },
        ]

        self.stdout.write("Provisioning demo accounts for FolioVerse...")

        for acc in accounts:
            user, created = User.objects.get_or_create(
                username=acc["username"],
                defaults={
                    "email": acc["email"],
                    "is_staff": acc["is_staff"],
                    "is_superuser": acc["is_superuser"],
                }
            )
            user.set_password(acc["password"])
            user.is_staff = acc["is_staff"]
            user.is_superuser = acc["is_superuser"]
            user.email = acc["email"]
            user.save()

            token, _ = Token.objects.get_or_create(user=user)
            action = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(
                f"[{action}] {acc['role']}: username='{acc['username']}', password='{acc['password']}' (Token: {token.key})"
            ))

        self.stdout.write(self.style.SUCCESS("All demo accounts are ready for testing!"))
