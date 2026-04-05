import os
import django

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import MainCategory, SubCategory, Product

def deduplicate_main_categories():
    print("🪄 Starting MainCategory Deduplication (Safe Mode)...")
    
    # Get all names that appear more than once
    names = [m.name for m in MainCategory.objects.all()]
    unique_names = set(names)
    
    for name in unique_names:
        matches = MainCategory.objects.filter(name__iexact=name).order_by('id')
        if matches.count() > 1:
            print(f"📦 Found {matches.count()} matches for '{name}'. Merging...")
            
            primary = matches[0]
            redundant = matches[1:]
            
            for extra in redundant:
                extra_id = str(extra.id)
                primary_id = str(primary.id)
                
                # 1. Update Subcategories
                SubCategory.objects.filter(main_category=extra).update(main_category=primary)
                
                # 2. Update Products (Safe Scan)
                all_prods = Product.objects.all()
                for p in all_prods:
                    if extra_id in p.category_ids:
                        new_ids = [primary_id if cid == extra_id else cid for cid in p.category_ids]
                        p.category_ids = list(set(new_ids))
                        p.save()
                        print(f"      🔹 Updated Product: {p.name}")
                
                extra.delete()
                print(f"   🗑️ Merged and deleted redundant ID: {extra_id}")
            
            print(f"   ✅ Fully consolidated into ID: {primary.id}")

def cleanup_subcategories():
    print("\n🪄 Starting SubCategory Deduplication...")
    # Clean up duplicate subcategories under the same parent
    mains = MainCategory.objects.all()
    for main in mains:
        sub_names = SubCategory.objects.filter(main_category=main).values_list('name', flat=True)
        unique_subs = set(sub_names)
        
        for s_name in unique_subs:
            s_matches = SubCategory.objects.filter(name__iexact=s_name, main_category=main).order_by('id')
            if s_matches.count() > 1:
                print(f"   📦 Found {s_matches.count()} sub-matches for '{s_name}' under '{main.name}'. Merging...")
                primary_s = s_matches[0]
                redundant_s = s_matches[1:]
                
                for extra_s in redundant_s:
                    extra_s_id = str(extra_s.id)
                    primary_s_id = str(primary_s.id)
                    
                    # Update Products to point to primary subcategory
                    Product.objects.filter(subcategory_id=extra_s_id).update(subcategory_id=primary_s_id)
                    
                    extra_s.delete()
                print(f"      ✅ Consolidated subcategories.")

if __name__ == "__main__":
    deduplicate_main_categories()
    cleanup_subcategories()
    print("\n✨ Database is now clean and unique!")
