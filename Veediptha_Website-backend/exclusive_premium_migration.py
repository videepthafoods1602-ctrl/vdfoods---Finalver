import os
import pymongo
from bson import ObjectId

# MongoDB Connection
MONGO_URI = os.environ.get("MONGODB_URI", "mongodb://admin:S_99_chi_231999@mongodb:27017/")
client = pymongo.MongoClient(MONGO_URI)
db = client["ecommerce_db"]

# Improved mapping based on actual DB names
MAPPING = {
    "Spreads": "Spreads",
    "Millet Roti": "Premium Roti",
    "Pulao Mix": "Pulao Mix",
    "Ready to Cook": "Ready To Cook",
    "Ready to Eat": "Ready To Eat",
    "Ready to Mix": "Ready To Mix",
    "Herbal Tea": "Herbal Tea",
    "Millet Rice Varieties": "Millet Rice Varieties",
    "Kid's Combo": "Kid's Combo",
    "Mix for Cooked Millet": "Mix For Cooked Millet",
    "Pickles": "Pickles",
    "Cold Pressed Oils": "Cooking Oil / Cold Pressed Oil",
    "Spices": "Our Kitchen Premium Masalas",
    "Millet Cookies": "Candies", # Guessing based on similar items
    "Wheat Products": "Biryani Mix", # Guessing
    "Normal Tea": "Energy Drinks", # Guessing
}

EXTENDED_LIST = [
    "Diabetic Friendly", "Dark Chocolate", "Women's Friendly/ Periods Friendly",
    "Baby Food", "Gut Friendly Fruit Drinks", "Milk Mix - Dry Fruit Mix", "At Pocket",
    "Body Relax", "Mouth Freshner", "Dryfruitspecial", "Instant Chutneys & Podi's",
    "Vd's Premium Special", "Payasam"
]

def migrate_to_premium():
    print("Starting refined migration...")
    
    # Process Mapping
    for user_term, db_name in MAPPING.items():
        res = db.main_categories.update_many(
            {"name": {"$regex": f"^{db_name}$", "$options": "i"}},
            {"$set": {"shop_type": "VD's Premium Store"}}
        )
        if res.modified_count > 0:
            print(f"Mapped: {user_term} -> {db_name} (Updated)")
        else:
            print(f"Mapped: {user_term} -> {db_name} (Not updated or already set)")

    # Process Extended List (All these should probably be Premium too)
    for name in EXTENDED_LIST:
        res = db.main_categories.update_many(
            {"name": {"$regex": f"^{name}$", "$options": "i"}},
            {"$set": {"shop_type": "VD's Premium Store"}}
        )
        if res.modified_count > 0:
            print(f"Extended: {name} (Updated)")

    print("Migration complete.")

if __name__ == "__main__":
    migrate_to_premium()
