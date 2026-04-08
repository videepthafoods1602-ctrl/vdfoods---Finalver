import os
import pymongo
from bson import ObjectId
from collections import Counter

# MongoDB Connection
MONGO_URI = os.environ.get("MONGODB_URI", "mongodb://admin:S_99_chi_231999@mongodb:27017/")
client = pymongo.MongoClient(MONGO_URI)
db = client["ecommerce_db"]

def sync_shops():
    print("Starting smart shop synchronization from product data...")
    
    # Get all products
    products = list(db.products.find())
    
    # Map MainCategory -> List of Shop values found in its products
    cat_shop_map = {}
    
    for p in products:
        m_id = p.get("main_category_id")
        # Handle attributes.shop (it might be nested or a flat field depending on import)
        shop = p.get("attributes", {}).get("shop") or p.get("shop")
        
        if m_id and shop:
            if m_id not in cat_shop_map:
                cat_shop_map[m_id] = []
            cat_shop_map[m_id].append(shop)
            
    # Update MainCategories based on majority vote of its products
    updated_count = 0
    for m_id, shops in cat_shop_map.items():
        if not shops: continue
        
        # Most common shop for this category
        target_shop = Counter(shops).most_common(1)[0][0]
        
        # Consistent naming for the shop field
        if "premium" in target_shop.lower():
            final_shop = "VD's Premium Store"
        else:
            final_shop = "VD's Store"
            
        res = db.main_categories.update_one(
            {"_id": ObjectId(m_id) if isinstance(m_id, str) else m_id},
            {"$set": {"shop": final_shop}}
        )
        
        if res.modified_count > 0:
            cat_name = db.main_categories.find_one({"_id": ObjectId(m_id) if isinstance(m_id, str) else m_id}).get("name")
            print(f"Synced: {cat_name} -> {final_shop}")
            updated_count += 1
            
    print(f"Sync complete. {updated_count} categories updated.")

if __name__ == "__main__":
    sync_shops()
