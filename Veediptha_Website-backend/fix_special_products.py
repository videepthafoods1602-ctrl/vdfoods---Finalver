from api.models import MainCategory, Product

def fix_special_products():
    print("--- Fixing VD's Premium Special Products ---")
    
    # 1. Get the MainCategory
    try:
        mc = MainCategory.objects.get(id='69d5cf08eb0b13088b2c0e6f')
        print(f"Found MainCategory: {mc.name}")
    except MainCategory.DoesNotExist:
        print("Error: MainCategory not found!")
        return

    # 2. List of products that should be in this category
    products_names = [
        "Museli", "Immunity Booster", "Nippatu", "Bisibele Bath", "Pongal", 
        "Biryani Mix", "Tomato Bath Mix", "Pulavo Mix", "Kokam Puliogare", 
        "Special Pudi", "Jowar Kajjikai", "Kapli Kajjikai", "Pickle Masala", 
        "Moong Dal Dosa Mix", "Millet Payasam", "Black Urud Dal Payasam", 
        "Dark Chocolate", "Onion Peel Powder", "Garlic Peel Podi", 
        "Orange Fanta", "Masala Tea", "Adhirasam"
    ]

    mc_id_str = str(mc.id)
    count = 0
    
    for pname in products_names:
        # Use case-insensitive search for flexibility
        p = Product.objects.filter(name__icontains=pname).first()
        if p:
            # Update category_ids list
            current_ids = p.category_ids or []
            if mc_id_str not in current_ids:
                current_ids.append(mc_id_str)
                p.category_ids = current_ids
            
            # Clear subcategory_id so it shows up in MainCategory view
            p.subcategory_id = ""
            p.save()
            print(f"  [+] Updated: {p.name}")
            count += 1
        else:
            print(f"  [-] Not Found: {pname}")

    print(f"\nSuccessfully updated {count} products for 'VD's Premium Special'.")

if __name__ == "__main__":
    fix_special_products()
