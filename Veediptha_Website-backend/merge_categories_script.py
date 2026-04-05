import os
import django
from django.db import transaction

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import SubCategory, Product

def merge_subcategories():
    name_to_keep = "Hair & Massage oils"
    name_to_remove = "Hair oils & Massage oils"
    
    try:
        # Canonical target
        target_sub = SubCategory.objects.filter(name=name_to_keep).first()
        if not target_sub:
             target_sub = SubCategory.objects.filter(name__iexact=name_to_keep).first()
             
        if not target_sub:
            print(f"❌ Target '{name_to_keep}' not found. Cannot merge.")
            return

        with transaction.atomic():
            # Merging the specifically named duplicate
            duplicate = SubCategory.objects.filter(name=name_to_remove).first()
            if duplicate:
                Product.objects.filter(subcategory_id=str(duplicate.id)).update(subcategory_id=str(target_sub.id))
                duplicate.delete()
                print(f"✅ Merged '{name_to_remove}' into '{name_to_keep}'.")
            
            # Merging any other case-insensitive variations
            others = SubCategory.objects.exclude(id=target_sub.id).filter(name__iexact=name_to_keep)
            for other in others:
                Product.objects.filter(subcategory_id=str(other.id)).update(subcategory_id=str(target_sub.id))
                other.delete()
                print(f"✅ Merged case-insensitve variation into '{name_to_keep}'.")

            print("✨ Final database consolidation complete.")
            
    except Exception as e:
        print(f"❌ Error during merge: {e}")

if __name__ == "__main__":
    merge_subcategories()
