import os
import django
import re

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import MainCategory, SubCategory, Product

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text

DATA = [
    ("Premium", "Millet Rice Varieties", "Rice Varieties", "Mapilai Samba Rice"),
    ("Premium", "Millet Rice Varieties", "Rice Varieties", "Idli Rice"),
    ("Premium", "Millet Rice Varieties", "Rice Varieties", "IR 20 Idli Rice"),
    ("Premium", "Millet Rice Varieties", "Rice Varieties", "IR Raw Rice"),
    ("Premium", "Millet Rice Varieties", "Rice Varieties", "Kullakar Rice"),
    ("Premium", "Millet Rice Varieties", "Rice Varieties", "Kichili Samba Rice"),
    ("Premium", "Millet Rice Varieties", "Rice Varieties", "Thooyamalli Rice"),
    ("Premium", "Millet Rice Varieties", "Rice Varieties", "Aruvatham Kuruvai Rice"),
    ("Premium", "Millet Rice Varieties", "Rice Varieties", "Poongar Rice"),
    ("Premium", "Millet Rice Varieties", "Rice Varieties", "Hand-Pound Ponni Parboiled Rice"),
    ("Premium", "Millet Rice Varieties", "Rice Varieties", "Bamboo Rice"),
    ("Premium", "Millet Rice Varieties", "Millets", "Sorghum Millet"),
    ("Premium", "Millet Rice Varieties", "Millets", "Pearl Millet"),
    ("Premium", "Millet Rice Varieties", "Millets", "Finger Millet"),
    ("Premium", "Millet Rice Varieties", "Millets", "Foxtail Millet"),
    ("Premium", "Millet Rice Varieties", "Millets", "Little Millet"),
    ("Premium", "Millet Rice Varieties", "Millets", "Kodo Millet"),
    ("Premium", "Millet Rice Varieties", "Millets", "Barnyard Millet"),
    ("Premium", "Millet Rice Varieties", "Millets", "Proso Millet"),
    ("Premium", "Millet Rice Varieties", "Millets", "Browntop Millet"),
    ("Premium", "Millet Rice Varieties", "Millets", "Semi-polished Foxtail Millet"),
    ("Premium", "Millet Rice Varieties", "Millets", "Semi-polished Little Millet"),
    ("Premium", "Millet Rice Varieties", "Millets", "Semi-polished Kodo Millet"),
    ("Premium", "Millet Rice Varieties", "Millets", "Semi-polished Barnyard Millet"),
    ("Premium", "Millet Rice Varieties", "Millets", "Semi-polished Browntop Millet"),
    ("Premium", "Mix for Cooked Millet", "Mix for Cooked Millet", "VangiBath"),
    ("Premium", "Mix for Cooked Millet", "Mix for Cooked Millet", "Tomato Pachadi"),
    ("Premium", "Mix for Cooked Millet", "Mix for Cooked Millet", "Garlic Kaaram"),
    ("Premium", "Mix for Cooked Millet", "Mix for Cooked Millet", "Coriander Pachadi"),
    ("Premium", "Mix for Cooked Millet", "Mix for Cooked Millet", "Garlic Coriander Kaaram"),
    ("Premium", "Mix for Cooked Millet", "Mix for Cooked Millet", "Pudina Kaaram"),
    ("Premium", "Ready to eat", "museli", "Seeds muesli"),
    ("Premium", "Ready to eat", "museli", "Museli- choclate"),
    ("Premium", "Ready to eat", "museli", "Combined muesli"),
    ("Premium", "Ready to eat", "museli", "mixed berries museli"),
    ("Premium", "Ready to eat", "museli", "Dry fruits museli"),
    ("Premium", "Ready to eat", "museli", "Dry fruits-berries museli"),
    ("Premium", "Ready to eat", "museli", "VD spl. Museli"),
    ("Premium", "Ready to eat", "Traditional Diabetic Friendly Sweets", "Kajjikayyi"),
    ("Premium", "Ready to eat", "Traditional Diabetic Friendly Sweets", "Arisalu/Adhirasam"),
    ("Premium", "Ready to eat", "Traditional Diabetic Friendly Sweets", "Omega Rich Milk powder"),
    ("Premium", "Ready to eat", "Traditional Diabetic Friendly Sweets", "Omega Rich laddoo"),
    ("Premium", "Ready to eat", "Traditional Diabetic Friendly Sweets", "Iron Rich laddoo"),
    ("Premium", "Ready to eat", "Traditional Diabetic Friendly Sweets", "Gond laddu"),
    ("Premium", "Ready to eat", "Traditional Diabetic Friendly Sweets", "Foxtail urud dal laddu(sunnundalu)"),
    ("Premium", "Ready to eat", "Traditional Diabetic Friendly Sweets", "Sattu laddu"),
    ("Premium", "Ready to eat", "Traditional Diabetic Friendly Sweets", "Black urud dal (Minapa Sunnundalu)"),
    ("Premium", "Ready to eat", "Traditional Diabetic Friendly Sweets", "Black sesame laddu"),
    ("Premium", "Ready to eat", "Traditional Diabetic Friendly Sweets", "Jonna laddu"),
    ("Premium", "Ready to eat", "Traditional Diabetic Friendly Sweets", "Flaxseed laddu"),
    ("Premium", "Ready to eat", "Traditional Diabetic Friendly Sweets", "Dry coconut laddu"),
    ("Premium", "Ready to eat", "Traditional Diabetic Friendly Sweets", "Sprouted Ragi laddu"),
    ("Premium", "Ready to eat", "Traditional Diabetic Friendly Sweets", "Korra Bondi laddu"),
    ("Premium", "Ready to eat", "Traditional Diabetic Friendly Sweets", "Peanut laddu, sesame laddu"),
    ("Premium", "Ready to eat", "Traditional Diabetic Friendly Sweets", "Besan laddu"),
    ("Premium", "Ready to eat", "Traditional Savouries", "Mixture (Red Rice Mixture, Jonna mixture, Navaratna Mixture)"),
    ("Premium", "Ready to eat", "Traditional Savouries", "curry leaves powder"),
    ("Premium", "Ready to Mix", "Flours", "Ragi flour"),
    ("Premium", "Ready to Mix", "Flours", "Bajra flour"),
    ("Premium", "Ready to Mix", "Flours", "Jowar flour"),
    ("Premium", "Ready to Mix", "Flours", "Besan flour"),
    ("Premium", "Ready to Mix", "Flours", "Soaked Activated Jowar flour"),
    ("Premium", "Ready to Mix", "Flours", "Soaked Activated Pearl Millet flour"),
    ("Premium", "Ready to Mix", "Flours", "Soaked Activated Multi Grain flour"),
    ("Premium", "Ready to Mix", "Flours", "Soaked Activated Red Rice flour"),
    ("Premium", "Ready to Mix", "Flours", "Soaked Activated Black Rice Flour"),
    ("Premium", "Ready to Mix", "Flours", "Soaked Activated All Millet flour"),
    ("Premium", "Ready to Mix", "Flours", "Sprouted Ragi Flour"),
    ("Premium", "Ready to Mix", "Flours", "Sprouted Horsegram Flour"),
    ("Premium", "Ready to Mix", "Flours", "Sprouted Brown chana Flour"),
    ("Premium", "Ready to Mix", "Flours", "Sprouted Soya bean Flour"),
    ("Premium", "Ready to Mix", "Flours", "Sprouted Black urud dal Flour"),
    ("Premium", "Ready to Mix", "Flours", "Sprouted Greengram Flour"),
    ("Premium", "Ready to Mix", "Flours", "Sprouted Bajra Flour"),
    ("Premium", "Ready to Mix", "Flours", "Sprouted Jowar Flour"),
    ("Premium", "Ready to Mix", "Flours", "Sprouted Rajgira Flour"),
    ("Premium", "Ready to Mix", "Flours", "Sprouted Buckwheat Flour"),
    ("Premium", "Ready to Mix", "Flours", "Sprouted Millet Flour"),
    ("Premium", "Ready to Mix", "Flours", "Sprouted Emmer/khapli Flour"),
    ("Premium", "Ready to Mix", "Flours", "Almond flour"),
    ("Premium", "Ready to Mix", "Flours", "Red Rice Flour"),
    ("Premium", "Ready to Mix", "Flours", "Brown Rice Flour"),
    ("Premium", "Ready to Mix", "Flours", "Black Rice Flour"),
    ("Premium", "Ready to Mix", "Flours", "Gluten free Quinoa Flour"),
    ("Premium", "Ready to Mix", "Flours", "Gluten free Barnyard Flour"),
    ("Premium", "Ready to Mix", "Flours", "Gluten free Amaranth Flour"),
    ("Premium", "Ready to Mix", "Flours", "Gluten free Kodo millet Flour"),
    ("Premium", "Ready to Mix", "Poha", "jowar poha"),
    ("Premium", "Ready to Mix", "Poha", "Foxtail Poha"),
    ("Premium", "Ready to Mix", "Poha", "Kodo Poha"),
    ("Premium", "Ready to Mix", "Poha", "Bajra Poha"),
    ("Premium", "Ready to Mix", "Poha", "Ragi Poha"),
    ("Premium", "Ready to Mix", "Poha", "Red Rice Poha"),
    ("Premium", "Ready to Mix", "Rava", "Little Millet Rava"),
    ("Premium", "Ready to Mix", "Rava", "Foxtail Rava"),
    ("Premium", "Ready to Mix", "Rava", "Jowar Rava"),
    ("Premium", "Ready to Mix", "Rava", "Barnyard Rava"),
    ("Premium", "Ready to Mix", "Rava", "Khapli Rava"),
    ("Premium", "Spreads", "sweet spreads", "Orange jam"),
    ("Premium", "Spreads", "sweet spreads", "Blueberry jam"),
    ("Premium", "Spreads", "sweet spreads", "Strawberry jam"),
    ("Premium", "Spreads", "sweet spreads", "Mixed fruit jam"),
    ("Premium", "Tools", "Tools", "Ragi ball stick"),
    ("Premium", "Tools", "Tools", "Clay pots"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "VD's Museli"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Immunity Booster"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Herbal Masala Tea"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Bisibele Bath"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Pongal"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Biryani Mix"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Tomato Bath Mix"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Pulavo Mix"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Kokam Puliogare"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "VD's Special Pudi"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Jonna Kajjikai"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Kapli Kajjikai"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Pickle Masala"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Moong Dal Dosa Mix"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Millet Payasam"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Black urud dal Payasam"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Dark Chocalate"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Onion peel powder"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Garlic peel podi"),
    ("Premium", "VD's Premium Special", "VD's Premium Special", "Adhirasam/Aresalu"),
    ("Premium", "Women's Friendly", "Women friendly / Periods friendly", "Sesame ladoo"),
    ("Premium", "Women's Friendly", "Women friendly / Periods friendly", "Flax seeds ladoo"),
    ("Premium", "Women's Friendly", "Women friendly / Periods friendly", "Lemon zest Tea"),
    ("Premium", "Women's Friendly", "Women friendly / Periods friendly", "Pumpkin butter"),
    ("Premium", "Women's Friendly", "Women friendly / Periods friendly", "Palak Dosa mix / green leaf dosa"),
    ("Premium", "Women's Friendly", "Women friendly / Periods friendly", "Ginger Candy (Digestion Friendly)"),
    ("Premium", "Women's Friendly", "Women friendly / Periods friendly", "Amla Candy (Digestion Friendly)"),
    ("Premium", "Women's Friendly", "Women friendly / Periods friendly", "Bloating Friendly"),
]

def sync_data():
    results = {"main_categories": 0, "subcategories": 0, "products": 0, "existing": 0}
    
    for premium_brand, raw_main, raw_sub, raw_prod in DATA:
        # Clean inputs
        main_name = raw_main.strip()
        subcat_name = raw_sub.strip()
        prod_name = raw_prod.strip()

        # 1. MainCategory
        main_cat = MainCategory.objects.filter(name__iexact=main_name, shop_type='Premium').first()
        if not main_cat:
            main_cat = MainCategory.objects.create(
                name=main_name,
                shop_type='Premium',
                slug=f"premium-{slugify(main_name)}"
            )
            results["main_categories"] += 1
        
        # 2. SubCategory
        subcat = SubCategory.objects.filter(name__iexact=subcat_name, main_category=main_cat).first()
        if not subcat:
            subcat = SubCategory.objects.create(
                name=subcat_name,
                main_category=main_cat,
                slug=f"{slugify(main_name)}-{slugify(subcat_name)}"
            )
            results["subcategories"] += 1
        
        # 3. Product
        product = Product.objects.filter(name__iexact=prod_name, subcategory_id=str(subcat.id)).first()
        if not product:
            Product.objects.create(
                name=prod_name,
                description=f"Authentic {prod_name} from our Premium {main_name} collection.",
                price=0.00,
                stock=100,
                subcategory_id=str(subcat.id)
            )
            results["products"] += 1
        else:
            results["existing"] += 1

    print(f"🚀 Safe Triple-Layer Sync Complete:")
    print(f"   Created {results['main_categories']} Main Categories")
    print(f"   Created {results['subcategories']} Sub-Categories")
    print(f"   Injected {results['products']} New Heritage Products")
    print(f"   Verified {results['existing']} Existing Items (Skipped duplicates)")

if __name__ == "__main__":
    sync_data()
