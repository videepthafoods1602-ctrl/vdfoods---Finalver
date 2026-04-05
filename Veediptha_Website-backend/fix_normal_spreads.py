import os
import django

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import MainCategory, SubCategory, Product

def fix_spreads():
    # 1. Find the Normal Spreads main category
    # The name in the DB might be 'Spreads' or 'Spreads & Sauces'
    main_cat = MainCategory.objects.filter(name__icontains='Spreads', shop_type="VD's Store").first()
    
    if not main_cat:
        # Try finding by name without shop_type restriction just in case
        main_cat = MainCategory.objects.filter(name__icontains='Spreads').first()
    
    if not main_cat:
        print("❌ Could not find a 'Spreads' main category for the normal store.")
        return

    print(f"✨ Found Main Category: {main_cat.name} (Shop: {main_cat.shop_type})")

    # List of subcategories to ensure exist
    subs_to_add = [
        "Mayonnaise",
        "Vegan Mayonnaise",
        "Vegan Butter",
        "Sweet Spreads",
        "Sauce",
        "Vegan Sauce"
    ]

    for sub_name in subs_to_add:
        sub, created = SubCategory.objects.get_or_create(
            name=sub_name,
            main_category=main_cat,
            defaults={'slug': f"spreads-{sub_name.lower().replace(' ', '-')}"}
        )
        if created:
            print(f"✅ Created sub-category: {sub_name}")
        else:
            print(f"ℹ️ Sub-category already exists: {sub_name}")

    print("✨ Normal Store Spreads fix complete!")

if __name__ == "__main__":
    fix_spreads()
