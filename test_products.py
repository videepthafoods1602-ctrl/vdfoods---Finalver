import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'Veediptha_Website-backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()
from products.models import Product
category_id = "69d40b59d421d5f99d42e9e7"
print("Total products:", Product.objects(category_ids=category_id).count())
for p in Product.objects(category_ids=category_id):
    print("NAME:", repr(p.name))
