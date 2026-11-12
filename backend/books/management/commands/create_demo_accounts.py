from decimal import Decimal
import time
import random
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from accounts.models import UserProfile
from books.models import Book, Order, OrderItem


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

            # Assign explicit, authoritative database role
            profile, _ = UserProfile.objects.get_or_create(user=user)
            if acc["username"] == "seller_demo":
                profile.role = UserProfile.Role.SELLER
            elif acc["username"] == "admin":
                profile.role = UserProfile.Role.ADMIN
            else:
                profile.role = UserProfile.Role.BUYER
            profile.save()

            token, _ = Token.objects.get_or_create(user=user)
            action = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(
                f"[{action}] {acc['role']}: username='{acc['username']}', password='{acc['password']}' (Token: {token.key})"
            ))

        # Ensure seller_demo owns catalog books if unassigned
        seller_user = User.objects.filter(username="seller_demo").first()
        if seller_user:
            unassigned_count = Book.objects.filter(seller__isnull=True).count()
            if unassigned_count > 0:
                Book.objects.filter(seller__isnull=True).update(seller=seller_user)
                self.stdout.write(self.style.SUCCESS(f"Assigned {unassigned_count} catalog books to seller_demo."))

        # Seed sample demo orders if none exist
        if Order.objects.count() == 0:
            buyer_user = User.objects.filter(username="buyer_demo").first()
            sample_books = list(Book.objects.all()[:3])
            if sample_books and buyer_user and seller_user:
                # 1. Paid bKash order
                b1 = sample_books[0]
                ord1 = Order.objects.create(
                    order_number=f"FV-ORD-{int(time.time())}-1001",
                    user=buyer_user,
                    customer_name=buyer_user.get_full_name() or "Tariqul Islam",
                    customer_email=buyer_user.email,
                    customer_phone="01711223344",
                    shipping_address="House 42, Road 11, Banani, Dhaka-1213",
                    payment_method="bkash",
                    payment_status="paid",
                    transaction_id=f"BKASH-TXN-{int(time.time() % 1000000):06d}88",
                    total_amount=Decimal(str(b1.price)) * 2,
                    status="confirmed",
                )
                OrderItem.objects.create(
                    order=ord1,
                    book=b1,
                    title=b1.title,
                    author=b1.author,
                    category=b1.category or "Literature & Novel",
                    cover_image=b1.cover_image or "",
                    unit_price=b1.price,
                    quantity=2,
                    subtotal=Decimal(str(b1.price)) * 2,
                )

                # 2. Cash on Delivery order
                if len(sample_books) > 1:
                    b2 = sample_books[1]
                    ord2 = Order.objects.create(
                        order_number=f"FV-ORD-{int(time.time())}-1002",
                        user=buyer_user,
                        customer_name="Nusrat Jahan",
                        customer_email="nusrat@example.com",
                        customer_phone="01822334455",
                        shipping_address="Flat 4B, Green Road, Dhanmondi, Dhaka-1205",
                        payment_method="cod",
                        payment_status="pending",
                        transaction_id="",
                        total_amount=Decimal(str(b2.price)),
                        status="confirmed",
                    )
                    OrderItem.objects.create(
                        order=ord2,
                        book=b2,
                        title=b2.title,
                        author=b2.author,
                        category=b2.category or "Academic & Science",
                        cover_image=b2.cover_image or "",
                        unit_price=b2.price,
                        quantity=1,
                        subtotal=Decimal(str(b2.price)),
                    )
                self.stdout.write(self.style.SUCCESS("Seeded sample verified orders for demo dashboards."))

        self.stdout.write(self.style.SUCCESS("All demo accounts are ready for testing!"))
