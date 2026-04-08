from api.models import MainCategory, Product

def finalize_chocolate():
    print("--- Finalizing Dark Chocolate Categorization ---")
    
    # 1. Update existing Dark Chocolate MainCategory to Normal Store
    # This removes the tile from Premium and adds it to Normal
    mc_dark = MainCategory.objects.filter(name='Dark Chocolate').first()
    if mc_dark:
        mc_dark.shop_type = "VD's Store"
        mc_dark.save()
        print(f"  [+] MainCategory 'Dark Chocolate' moved to Normal Store (ID: {mc_dark.id})")
    else:
        # Fallback create if missing
        mc_dark = MainCategory.objects.create(
            name='Dark Chocolate', 
            shop_type="VD's Store",
            slug='dark-chocolate-normal'
        )
        print(f"  [+] Created missing MainCategory 'Dark Chocolate' for Normal Store (ID: {mc_dark.id})")

    # 2. Key Specialty MainCategory
    try:
        mc_special = MainCategory.objects.get(id='69d5cf08eb0b13088b2c0e6f')
    except MainCategory.DoesNotExist:
        print("  [-] Error: Premium Special Category not found!")
        return

    # 3. Update the Product
    p = Product.objects.filter(name__icontains='Dark Chocolate').first()
    if p:
        # Assign it to both: Normal MainCategory AND Premium Special MainCategory
        p.category_ids = [str(mc_dark.id), str(mc_special.id)]
        p.subcategory_id = ""
        p.save()
        print(f"  [+] Product 'Dark Chocolate' updated with cross-store category IDs.")
    else:
        print("  [-] Product 'Dark Chocolate' not found!")

    print("\nCategorization complete.")

if __name__ == "__main__":
    finalize_chocolate()
