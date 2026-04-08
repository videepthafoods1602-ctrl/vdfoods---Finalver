from api.models import MainCategory, SubCategory, Product
from django.utils.text import slugify

def reorganize_chocolate():
    print("--- Reorganizing Dark Chocolate Category Hierarchy ---")
    
    # 1. Update existing MainCategory to VD's Premium Store
    main_cat = MainCategory.objects.filter(name='Dark Chocolate').first()
    if main_cat:
        main_cat.shop_type = "VD's Premium Store"
        main_cat.save()
        print(f"Updated MainCategory 'Dark Chocolate' to shop_type: {main_cat.shop_type}")
    else:
        print("Error: MainCategory 'Dark Chocolate' not found.")
        return

    # 2. Get VD's Premium Special MainCategory
    premium_special = MainCategory.objects.filter(name__icontains='Premium Special').first()
    if not premium_special:
        print("Error: MainCategory 'Vd's Premium Special' not found.")
        return

    # 3. Create SubCategory "Dark Chocolate" under "VD's Premium Special"
    sub_cat, created = SubCategory.objects.get_or_create(
        main_category=premium_special,
        name="Dark Chocolate",
        defaults={
            'slug': slugify(f"Premium-Special-Dark-Chocolate"),
            'is_active': True
        }
    )
    if created:
        print(f"Created SubCategory 'Dark Chocolate' under '{premium_special.name}'")
    else:
        print(f"SubCategory 'Dark Chocolate' already exists under '{premium_special.name}'")

    # 4. Assign the base "Dark Chocolate" product to the new SubCategory
    base_prod = Product.objects.filter(name='Dark Chocolate').first()
    if base_prod:
        # Keep existing category_ids (MainCategory), add the SubCategory ID
        if str(sub_cat.id) != base_prod.subcategory_id:
            base_prod.subcategory_id = str(sub_cat.id)
            # Ensure it's active
            base_prod.is_active = True
            base_prod.save()
            print(f"Assigned '{base_prod.name}' to SubCategory '{sub_cat.name}' ({sub_cat.id})")
        else:
            print(f"'{base_prod.name}' is already assigned to SubCategory.")
    else:
        print("Error: Base product 'Dark Chocolate' not found.")

if __name__ == "__main__":
    reorganize_chocolate()
