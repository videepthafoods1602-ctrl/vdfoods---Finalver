from api.models import MainCategory, Product
import os

def update():
    mc = MainCategory.objects.filter(name__icontains='Baby Food').first()
    if not mc:
        print("Category 'Baby Food' not found")
        return

    m_id_str = str(mc.id)
    print(f"Found category: {mc.name} ({m_id_str})")
    
    # Update category shop_type
    mc.shop_type = "VD's Premium Store"
    mc.save()
    print("Updated category shop_type")

    # Update products in this category
    all_prods = Product.objects.all()
    count = 0
    for p in all_prods:
        if m_id_str in p.category_ids:
            p.attributes['shop'] = "VD's Premium Store"
            p.save()
            count += 1
    
    print(f"Updated {count} products attributes")

if __name__ == '__main__':
    update()
