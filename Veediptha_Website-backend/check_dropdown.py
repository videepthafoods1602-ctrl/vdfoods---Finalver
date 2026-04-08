from pymongo import MongoClient

client = MongoClient('mongodb://admin:S_99_chi_231999@mongodb:27017/')
db = client['ecommerce_db']

for coll_name in db.list_collection_names():
    coll = db[coll_name]
    doc = coll.find_one({"dropdown": {"$exists": True}})
    if doc:
        print(f"Found 'dropdown' in collection: {coll_name}")
        print(doc)
