from api.models import Category
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

print("ALL TOP-LEVEL CATEGORIES:")
cats = Category.objects.filter(parent=None)
for c in cats:
    children = Category.objects.filter(parent=c).count()
    print(f"- {c.name} (ID: {c.id}) | Children: {children}")
