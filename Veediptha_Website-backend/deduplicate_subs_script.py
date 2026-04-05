import os
import django
from django.db import transaction
from django.db.models import Count

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import SubCategory, Product

def deduplicate_subcategories():
    try:
        # Find subcategory names that appear more than once
        duplicates = (
            SubCategory.objects.values('name', 'main_category')
            .annotate(name_count=Count('id'))
            .filter(name_count__gt=1)
        )

        if not duplicates:
            print("✨ No duplicate subcategory records found.")
            return

        with transaction.atomic():
            for entry in duplicates:
                name = entry['name']
                main_cat_id = entry['main_category']
                
                # Get all records for this name under this main category
                subs = list(SubCategory.objects.filter(name=name, main_category_id=main_cat_id).order_by('id'))
                
                # We keep the first one and merge others into it
                target_sub = subs[0]
                others = subs[1:]
                
                print(f"🔄 Merging {len(others)} duplicates for subcategory: '{name}'")
                
                for other in others:
                    # Move products from 'other' to 'target_sub'
                    products_moved = Product.objects.filter(subcategory_id=other.id).update(subcategory_id=target_sub.id)
                    print(f"   ✅ Moved {products_moved} products from duplicate '{name}' (ID: {other.id})")
                    
                    # Delete the duplicate subcategory
                    other.delete()
                
                print(f"🗑️ Deleted duplicates for '{name}'. Only one remains.")

    except Exception as e:
        print(f"❌ Error during subcategory deduplication: {e}")

if __name__ == "__main__":
    deduplicate_subcategories()
