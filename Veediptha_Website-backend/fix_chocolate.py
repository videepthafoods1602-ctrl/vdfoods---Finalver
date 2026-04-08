from api.models import Product, MainCategory, SubCategory
import sys

def fix_chocolate():
    print("--- Fixing Dark Chocolate ---")
    # 1. Find the base product with typo
    base_prod = Product.objects.filter(name__icontains='Chocalate').first()
    if not base_prod:
        print("Error: Could not find product with 'Chocalate'")
        return

    # 2. Correct the name and category
    old_name = base_prod.name
    base_prod.name = "Dark Chocolate"
    
    # Target Category: Dark Chocolate
    target_cat = MainCategory.objects.filter(name__icontains='Dark Chocolate').first()
    if target_cat:
        # Replace category_ids
        base_prod.category_ids = [str(target_cat.id)]
        print(f"Assigned '{base_prod.name}' to category '{target_cat.name}' ({target_cat.id})")
    else:
        print("Warning: Could not find target category 'Dark Chocolate'")

    base_prod.save()
    print(f"Renamed '{old_name}' to '{base_prod.name}'")

    # 3. Handle individual flavor products
    # We want to inactivate them so skip them in the list if they are now variants
    flavors = base_prod.attributes.get('dropdown_options', [])
    if flavors:
        count = 0
        for flavor_name in flavors:
            # Find individual products matching these flavor names
            individual = Product.objects.filter(name=flavor_name).first()
            if individual and individual.id != base_prod.id:
                individual.is_active = False
                individual.save()
                count += 1
        print(f"Inactivated {count} individual flavor products to favor the dropdown view.")

if __name__ == "__main__":
    fix_chocolate()
