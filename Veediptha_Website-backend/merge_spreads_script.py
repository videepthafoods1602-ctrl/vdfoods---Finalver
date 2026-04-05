import os
import django
from django.db import transaction

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import MainCategory, SubCategory

def merge_spreads():
    name_to_keep = "Spreads & Sauces"
    names_to_merge = ["Spreads", "spreads", "Spreads & Sauces"]
    
    try:
        # Find or create the target main category
        target_mc = MainCategory.objects.filter(name__iexact=name_to_keep).first()
        if not target_mc:
            # If no "Spreads & Sauces", pick the first existing "Spreads" to be the target
            target_mc = MainCategory.objects.filter(name__iexact="Spreads").first()
            if target_mc:
                target_mc.name = name_to_keep
                target_mc.save()
        
        if not target_mc:
            print(f"❌ No 'Spreads' main category found to merge.")
            return

        print(f"✨ Target Main Category: {target_mc.name} (ID: {target_mc.id})")

        with transaction.atomic():
            # Find all other main categories that match our merge list
            others = MainCategory.objects.filter(name__in=names_to_merge).exclude(id=target_mc.id)
            
            for other in others:
                # Move all subcategories to the target
                subs_moved = SubCategory.objects.filter(main_category=other).update(main_category=target_mc)
                print(f"✅ Moved {subs_moved} subcategories from '{other.name}' to '{target_mc.name}'.")
                
                # Delete the redundant main category
                other.delete()
                print(f"🗑️ Deleted redundant main category: {other.name}")

            print("✨ Spreads consolidation complete.")
            
    except Exception as e:
        print(f"❌ Error during spreads merge: {e}")

if __name__ == "__main__":
    merge_spreads()
