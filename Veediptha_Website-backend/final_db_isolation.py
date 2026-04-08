import os
import pymongo
from bson import ObjectId

# MongoDB Connection
MONGO_URI = os.environ.get("MONGODB_URI", "mongodb://admin:S_99_chi_231999@mongodb:27017/")
client = pymongo.MongoClient(MONGO_URI)
db = client["ecommerce_db"]

# The list of categories that should ONLY be in VD's Premium Store
PREMIUM_ONLY_KEYWORDS = [
    "Spreads", "Roti", "Pulao Mix", "Ready To Cook", "Ready To Eat", "Ready To Mix",
    "Herbal Tea", "Millet Rice Varieties", "Kid's Combo", "Mix For Cooked Millet",
    "Pickles", "Cold Pressed Oil", "Cooking Oil", "Our Kitchen Premium Masalas",
    "Masalas", "Candies", "Honey", "Salt & Sugar", "Pulses", "Unpolished Rice",
    "Wheat Products", "Biryani Mix", "Energy Drinks", "Diabetic Friendly",
    "Dark Chocolate", "Women's Friendly", "Periods Friendly", "Baby Food",
    "Gut Friendly", "Fruit Drinks", "Milk Mix", "Dry Fruit Mix", "At Pocket",
    "Body Relax", "Mouth Freshner", "Dryfruitspecial", "Instant Chutneys & Podi's",
    "Vd's Premium Special", "Payasam", "Stories", "Tools"
]

def isolate_shops():
    print("Starting final database shop isolation...")
    
    # Get all main categories
    main_cats = list(db.main_categories.find())
    
    for cat in main_cats:
        name = cat.get("name", "")
        # Check if the name matches any premium keywords (case insensitive partial match)
        is_premium = any(key.lower() in name.lower() for key in PREMIUM_ONLY_KEYWORDS)
        
        target_shop = "VD's Premium Store" if is_premium else "VD's Store"
        
        res = db.main_categories.update_one(
            {"_id": cat["_id"]},
            {
                "$set": {"shop": target_shop}, 
                "$unset": {"shop_type": ""}  # Clean up the previous mistake
            }
        )
        
        if res.modified_count > 0:
            print(f"Updated: {name} -> {target_shop}")
        else:
            print(f"Verified: {name} already correctly set to {target_shop}")

    print("DB Isolation complete.")

if __name__ == "__main__":
    isolate_shops()
