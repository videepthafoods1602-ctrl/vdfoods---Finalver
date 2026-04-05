import json
from bson import ObjectId
from decimal import Decimal

def patch_json_encoder():
    """
    Patch json.JSONEncoder.default to handle ObjectId and Decimal.
    This is necessary because django-mongodb-backend calls json.dumps
    directly on raw MongoDB data in some cases (like JSONField conversion).
    """
    original_default = json.JSONEncoder.default

    def new_default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, Decimal):
            return float(obj)
        return original_default(self, obj)

    json.JSONEncoder.default = new_default

def patch_mongodb_operations():
    """
    Patch DatabaseOperations.convert_datetimefield_value and django.utils.timezone.is_aware
    to handle cases where value is a string or doesn't have timezone methods.
    """
    try:
        from django_mongodb_backend.operations import DatabaseOperations
        from django.utils import timezone
        import dateutil.parser

        # Patch is_aware globally to be extra safe
        original_is_aware = timezone.is_aware
        def safe_is_aware(value):
            if not hasattr(value, 'utcoffset'):
                return False
            return original_is_aware(value)
        timezone.is_aware = safe_is_aware

        original_convert = DatabaseOperations.convert_datetimefield_value
        def new_convert(self, value, expression, connection):
            if isinstance(value, str):
                try:
                    value = dateutil.parser.parse(value)
                except (ValueError, TypeError):
                    return value # Return as is if unparseable
            
            if value is not None and not hasattr(value, 'utcoffset'):
                return value

            try:
                return original_convert(self, value, expression, connection)
            except Exception:
                return value

        DatabaseOperations.convert_datetimefield_value = new_convert
    except Exception as e:
        print(f"Failed to apply operations patch: {e}")

def patch_auth_permissions():
    """
    Completely disable create_permissions during post_migrate.
    django_mongodb_backend fails when creating content types in bulk because 
    it doesn't return the PKs properly, making the instances unhashable or unsaved.
    """
    try:
        import django.contrib.auth.management
        # Override the function completely so that when the signal calls it, it does nothing
        django.contrib.auth.management.create_permissions = lambda *args, **kwargs: None
    except Exception as e:
        print(f"Failed to patch auth permissions: {e}")

# Apply patches
patch_json_encoder()
patch_mongodb_operations()
patch_auth_permissions()
