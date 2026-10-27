#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Collect static assets for WhiteNoise
python manage.py collectstatic --no-input

# Run database migrations
python manage.py migrate

# Provision verified demo accounts (Admin, Seller, Buyer)
python manage.py create_demo_accounts

# Seed book catalog if database is empty (2,000 books)
python manage.py seed_bookstore --target 2000
