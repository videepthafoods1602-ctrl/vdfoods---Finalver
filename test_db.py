import sys
import os

# Add backend dir to python path
sys.path.append(os.path.join(os.getcwd(), 'Veediptha_Website-backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from products.models import Product
category_id = "69d40b59d421d5f99d42e9e7"
products = Product.objects(category_ids=category_id)
for p in products:
    print(p.name)
