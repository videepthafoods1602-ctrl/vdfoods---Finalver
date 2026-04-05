import os
import django

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import MainCategory, SubCategory

def list_cats():
    print("--- MAIN CATEGORIES ---")
    for mc in MainCategory.objects.all():
        print(f"[{mc.shop_type}] {mc.name} (ID: {mc.id})")
        subs = SubCategory.objects.filter(main_category=mc)
        for sc in subs:
            print(f"   -> Sub: {sc.name} (ID: {sc.id})")
    print("--- TOTALS ---")
    print(f"Main Categories: {MainCategory.objects.count()}")
    print(f"Sub Categories: {SubCategory.objects.count()}")

if __name__ == "__main__":
    list_cats()
