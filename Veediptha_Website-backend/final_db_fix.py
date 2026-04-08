from api.models import MainCategory, Product

def fix_db():
    print("--- Fixing Categorization ---")
    
    # 1. Shift Dark Chocolate MainCategory from Premium to Normal
    mc_dark = MainCategory.objects.filter(name='Dark Chocolate').first()
    if mc_dark:
        mc_dark.shop_type = "VD's Store"
        mc_dark.save()
        print(f"Moved MainCategory '{mc_dark.name}' to Normal Store")
    
    # 2. Key Specialty MainCategory
    mc_special = MainCategory.objects.filter(name__icontains='Premium Special').first()
    if not mc_special:
        print("Error: Premium Special Category not found!")
        return

    # 3. Product Linkage
    p = Product.objects.filter(name__icontains='Dark Chocolate').first()
    if p:
        # Assign to Normal Category AND Premium Special Category
        ids = []
        if mc_dark: ids.append(str(mc_dark.id))
        ids.append(str(mc_special.id))
        
        p.category_ids = list(set(ids)) # Deduplicate
        p.subcategory_id = ''
        p.save()
        print(f"Updated Product '{p.name}' assignments: {p.category_ids}")

    print("\nCategorization fix complete.")

if __name__ == "__main__":
    fix_db()
