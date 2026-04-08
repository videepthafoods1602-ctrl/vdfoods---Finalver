from pymongo import MongoClient

client = MongoClient('mongodb://admin:S_99_chi_231999@mongodb:27017/')
db = client['ecommerce_db']

for p in db.products.find({"dropdown": {"$regex": "\\|"}}):
    print(p)
