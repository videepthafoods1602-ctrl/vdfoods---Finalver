import os
import django
from django.db.models import Count

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import MainCategory, SubCategory, Product

def deduplicate_full():
    def normalize(s):
        import re
        return re.sub(r'\s+', ' ', s.lower().strip())

    STRICT_PREMIUM_MAINS = [
        "Millet Rice Varieties",
        "Mix for Cooked Millet",
        "Ready to eat",
        "Ready to Mix",
        "Spreads",
        "Tools",
        "VD's Premium Special",
        "Women's Friendly"
    ]

    print("🚀 Starting Deep Deduplication (Main & SubCategories)...")

    # 1. Deduplicate Main Categories for Premium
    norm_mains = [normalize(m) for m in STRICT_PREMIUM_MAINS]
    all_premium_mains = MainCategory.objects.filter(shop_type="VD's Premium Store")
    
    # Simple deduplication pass for Mains
    seen_mains = {}
    for m in all_premium_mains:
        norm_name = normalize(m.name)
        if norm_name not in seen_mains:
            seen_mains[norm_name] = m
        else:
            primary = seen_mains[norm_name]
            print(f"📦 Merging Main Category duplicate: {m.name}")
            # Move subcategories to primary
            SubCategory.objects.filter(main_category=m).update(main_category=primary)
            # Delete redundant main
            m.delete()

    # 2. Deduplicate SubCategories under EVERY MainCategory
    # (This fixes the 'Explore Ready to Eat' view shown in screenshot)
    for m in MainCategory.objects.all():
        seen_subs = {}
        target_subs = SubCategory.objects.filter(main_category=m)
        
        for s in target_subs:
            norm_sub = normalize(s.name)
            if norm_sub not in seen_subs:
                seen_subs[norm_sub] = s
            else:
                primary_s = seen_subs[norm_sub]
                print(f"   📦 Merging SubCategory duplicate: '{s.name}' under '{m.name}'")
                
                # Re-link products to primary subcategory
                prods_updated = Product.objects.filter(subcategory_id=str(s.id)).update(subcategory_id=str(primary_s.id))
                print(f"      🔹 Re-linked {prods_updated} products to primary SubCategory")
                
                # Delete redundant subcategory
                s.delete()

    print("✨ Full Deduplication Complete!")

if __name__ == "__main__":
    deduplicate_full()
