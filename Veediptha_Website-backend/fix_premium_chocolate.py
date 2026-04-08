from api.models import MainCategory, SubCategory, Product

def fix_premium_chocolate():
    print("--- Reorganizing Dark Chocolate Category Hierarchy (Again) ---")
    
    # 1. Get VD's Premium Special MainCategory
    mc_special = MainCategory.objects.filter(name='Vd\'s Premium Special').first()
    if not mc_special:
        print("Error: MainCategory 'Vd\'s Premium Special' not found.")
        return

    # 2. Delete the SubCategory "Dark Chocolate" created by mistake
    sub_cat = SubCategory.objects.filter(name='Dark Chocolate', main_category=mc_special).first()
    if sub_cat:
        sub_cat.delete()
        print(f"Deleted SubCategory 'Dark Chocolate' from under '{mc_special.name}'")

    # 3. Assign the base "Dark Chocolate" product directly to mc_special's category_ids
    base_prod = Product.objects.filter(name='Dark Chocolate').first()
    if base_prod:
        # Category ID match logic (ensure it's in the list)
        mc_id_str = str(mc_special.id)
        if mc_id_str not in base_prod.category_ids:
            base_prod.category_ids.append(mc_id_str)
            print(f"Added '{base_prod.name}' directly to '{mc_special.name}' MainCategory")
        
        # Ensure subcategory_id is cleared so it's not looking for a child
        base_prod.subcategory_id = ""
        base_prod.save()
        print(f"Saved product '{base_prod.name}' with direct MainCategory assignment.")
    else:
        print("Error: Base product 'Dark Chocolate' not found.")

if __name__ == "__main__":
    fix_premium_chocolate()
