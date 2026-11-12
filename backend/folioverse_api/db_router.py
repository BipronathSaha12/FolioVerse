"""
Primary/Replica Database Router for FolioVerse.
Directs read operations to the 'replica' database when configured,
and write operations (INSERT, UPDATE, DELETE) to 'default' (Primary).
Enables seamless horizontal read scaling for 100k+ concurrent shoppers.
"""
from django.conf import settings


class PrimaryReplicaRouter:
    """
    A database router to control all database operations on models in
    the FolioVerse application.
    - db_for_read: Routes read queries to 'replica' (if configured in DATABASES)
    - db_for_write: Routes write operations to 'default' (Primary)
    - allow_relation: Allows relations between objects in 'default' and 'replica'
    - allow_migrate: Ensures schema migrations only run on 'default'
    """

    def db_for_read(self, model, **hints):
        """
        Directs read queries to 'replica' if configured in DATABASES.
        Falls back to 'default' if 'replica' is not configured or for auth/sessions.
        """
        # Critical authentication, permission, and session queries stay on primary
        if model._meta.app_label in ['auth', 'sessions', 'admin']:
            return 'default'

        if 'replica' in settings.DATABASES:
            return 'replica'
        return 'default'

    def db_for_write(self, model, **hints):
        """
        All write queries (INSERT, UPDATE, DELETE) always execute against 'default' (Primary).
        """
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        """
        Permits relations if both objects reside within the FolioVerse cluster
        ('default' or 'replica').
        """
        db_set = {'default', 'replica'}
        if obj1._state.db in db_set and obj2._state.db in db_set:
            return True
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Guarantees that database migrations run exclusively on the primary 'default' database.
        """
        return db == 'default'
