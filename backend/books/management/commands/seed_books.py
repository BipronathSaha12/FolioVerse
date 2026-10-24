from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from books.models import Book
from datetime import date


class Command(BaseCommand):
    help = "Seeds database with demo users and realistic book data"

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        # 1. Create Demo Admin and Users
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@folioverse.com",
                "is_staff": True,
                "is_superuser": True,
            }
        )
        if created:
            admin_user.set_password("admin12345")
            admin_user.save()
            token, _ = Token.objects.get_or_create(user=admin_user)
            self.stdout.write(self.style.SUCCESS(f"Created admin user: admin / admin12345 (Token: {token.key})"))
        else:
            token, _ = Token.objects.get_or_create(user=admin_user)
            self.stdout.write(f"Admin user already exists (Token: {token.key})")

        demo_user, u_created = User.objects.get_or_create(
            username="demouser",
            defaults={
                "email": "demo@folioverse.com",
            }
        )
        if u_created:
            demo_user.set_password("demo12345")
            demo_user.save()
            demo_token, _ = Token.objects.get_or_create(user=demo_user)
            self.stdout.write(self.style.SUCCESS(f"Created demo user: demouser / demo12345 (Token: {demo_token.key})"))
        else:
            demo_token, _ = Token.objects.get_or_create(user=demo_user)
            self.stdout.write(f"Demo user already exists (Token: {demo_token.key})")

        # 2. Books Seed Data
        books_data = [
            {
                "title": "Harry Potter and the Sorcerer's Stone",
                "author": "J.K. Rowling",
                "price": 19.99,
                "published_date": date(1997, 6, 26),
                "description": "The boy who lived embarks on his first magical adventure at Hogwarts School of Witchcraft and Wizardry.",
                "cover_image": "https://images.unsplash.com/photo-1618666012174-83b441c0bc76?w=600&auto=format&fit=crop&q=80",
                "category": "Fantasy",
            },
            {
                "title": "Harry Potter and the Chamber of Secrets",
                "author": "J.K. Rowling",
                "price": 22.50,
                "published_date": date(1998, 7, 2),
                "description": "Dark secrets and ancient monsters haunt the stone corridors of Hogwarts during Harry's second year.",
                "cover_image": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80",
                "category": "Fantasy",
            },
            {
                "title": "Harry Potter and the Prisoner of Azkaban",
                "author": "J.K. Rowling",
                "price": 24.99,
                "published_date": date(1999, 7, 8),
                "description": "Sirius Black escapes Azkaban prison, and terrifying Dementors encircle the castle grounds.",
                "cover_image": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
                "category": "Fantasy",
            },
            {
                "title": "1984",
                "author": "George Orwell",
                "price": 14.50,
                "published_date": date(1949, 6, 8),
                "description": "A haunting dystopian classic depicting totalitarian control, omnipresent surveillance, and perpetual war.",
                "cover_image": "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&auto=format&fit=crop&q=80",
                "category": "Dystopian",
            },
            {
                "title": "The Great Gatsby",
                "author": "F. Scott Fitzgerald",
                "price": 12.99,
                "published_date": date(1925, 4, 10),
                "description": "The tragic and glamorous story of Jay Gatsby and his obsessive pursuit of the American Dream in the Roaring Twenties.",
                "cover_image": "https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=600&auto=format&fit=crop&q=80",
                "category": "Classic",
            },
            {
                "title": "The Fellowship of the Ring",
                "author": "J.R.R. Tolkien",
                "price": 28.00,
                "published_date": date(1954, 7, 29),
                "description": "Frodo Baggins inherits the One Ring of Sauron and sets out on an epic quest to destroy it in Mount Doom.",
                "cover_image": "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=600&auto=format&fit=crop&q=80",
                "category": "Fantasy",
            },
            {
                "title": "To Kill a Mockingbird",
                "author": "Harper Lee",
                "price": 15.20,
                "published_date": date(1960, 7, 11),
                "description": "A profound tale of racial injustice, empathy, and youthful innocence in the American Deep South.",
                "cover_image": "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80",
                "category": "Classic",
            },
            {
                "title": "Murder on the Orient Express",
                "author": "Agatha Christie",
                "price": 16.75,
                "published_date": date(1934, 1, 1),
                "description": "Detective Hercule Poirot unravels an ingenious murder on an isolated snowbound luxury train.",
                "cover_image": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80",
                "category": "Mystery",
            },
            {
                "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
                "author": "Robert C. Martin",
                "price": 42.99,
                "published_date": date(2008, 8, 1),
                "description": "Essential principles, patterns, and practical exercises for writing readable, maintainable software.",
                "cover_image": "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=600&auto=format&fit=crop&q=80",
                "category": "Technology",
            },
            {
                "title": "Design Patterns: Elements of Reusable Object-Oriented Software",
                "author": "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
                "price": 49.99,
                "published_date": date(1994, 10, 21),
                "description": "The seminal Gang of Four reference outlining 23 timeless object-oriented software design patterns.",
                "cover_image": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&auto=format&fit=crop&q=80",
                "category": "Technology",
            },
            {
                "title": "Brave New World",
                "author": "Aldous Huxley",
                "price": 13.50,
                "published_date": date(1932, 1, 1),
                "description": "A futuristic World State where citizens are engineered, conditioned, and lulled into passive complacency.",
                "cover_image": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80",
                "category": "Dystopian",
            },
            {
                "title": "The Hobbit",
                "author": "J.R.R. Tolkien",
                "price": 21.00,
                "published_date": date(1937, 9, 21),
                "description": "Bilbo Baggins is swept into an epic adventure with Gandalf and thirteen dwarves to reclaim the Lonely Mountain.",
                "cover_image": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop&q=80",
                "category": "Fantasy",
            },
            {
                "title": "The Casual Vacancy",
                "author": "J.K. Rowling",
                "price": 18.00,
                "published_date": date(2012, 9, 27),
                "description": "A darkly comic, thought-provoking tale about the sudden death of a councilor in a quaint English town.",
                "cover_image": "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=600&auto=format&fit=crop&q=80",
                "category": "Fiction",
            },
            {
                "title": "Pride and Prejudice",
                "author": "Jane Austen",
                "price": 11.50,
                "published_date": date(1813, 1, 28),
                "description": "The timeless romantic drama between the spirited Elizabeth Bennet and proud Mr. Fitzwilliam Darcy.",
                "cover_image": "https://images.unsplash.com/photo-1463320726281-696a485928c7?w=600&auto=format&fit=crop&q=80",
                "category": "Romance",
            },
            {
                "title": "Sapiens: A Brief History of Humankind",
                "author": "Yuval Noah Harari",
                "price": 27.50,
                "published_date": date(2014, 9, 4),
                "description": "An exploration of human history from the Stone Age to the present, exploring how biology and history define us.",
                "cover_image": "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&auto=format&fit=crop&q=80",
                "category": "Non-Fiction",
            }
        ]

        created_count = 0
        for b_data in books_data:
            book, created = Book.objects.get_or_create(
                title=b_data["title"],
                author=b_data["author"],
                defaults=b_data
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} new books (Total books: {Book.objects.count()})."))
