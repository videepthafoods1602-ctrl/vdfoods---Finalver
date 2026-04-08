from rest_framework import generics, status, permissions
from .permissions import IsRoleBasedAdminOrReadOnly
import datetime
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import (
    Page, Product, Category, Coupon, Story, Hero, Navigation, 
    WebsiteTheme, WebsiteBranding, WebsiteTypography, WebsiteFooter,
    Policy, Promotion, SupportTicket, Order, BulkOrder
)
from .currency_utils import get_usd_inr_rate
from .serializers import (
    PageSerializer, PageListSerializer, ProductSerializer, ProductLiteSerializer, CategorySerializer, 
    CouponSerializer, StorySerializer, HeroSerializer, NavigationSerializer,
    WebsiteThemeSerializer, WebsiteBrandingSerializer, WebsiteTypographySerializer,
    WebsiteFooterSerializer, PolicySerializer, OrderSerializer, PromotionSerializer,
    SupportTicketSerializer, StoryListSerializer, BulkOrderSerializer
)
from django.core.mail import send_mail
from django.conf import settings
from accounts.models import Favorite, ProductAnalytics
from django.db.models import F
import requests
import logging
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache

logger = logging.getLogger('api')

class PageListView(generics.ListAPIView):
    queryset = Page.objects.all()
    serializer_class = PageListSerializer
    permission_classes = [permissions.AllowAny]

class PageDetailView(generics.RetrieveAPIView):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    lookup_field = 'id'
    permission_classes = [permissions.AllowAny]

class ProductListView(generics.ListAPIView):
    serializer_class = ProductLiteSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Product.objects.all()
        category_id = self.request.query_params.get('category')
        if category_id:
            # Filter products where category_id matches exactly subcategory_id 
            # OR exists within the category_ids list
            # We fetch everything and filter in Python to avoid MongoDB-backend specific query limitations
            all_prods = list(queryset)
            filtered_prods = [
                p for p in all_prods 
                if (p.subcategory_id == category_id) or (category_id in (p.category_ids or []))
            ]
            return filtered_prods
        return queryset

class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = 'id'
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        response = super().get(request, *args, **kwargs)
        product_id = self.kwargs.get('id')
        if not product_id: return response
        analytics, _ = ProductAnalytics.objects.get_or_create(product_id=str(product_id))
        response.data['analytics'] = {'total_views': analytics.views, 'current_watching': analytics.current_watching}
        return response

class CategoryListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from .models import MainCategory, SubCategory
        
        main_cats = MainCategory.objects.filter(is_active=True).order_by('order', 'name')
        sub_cats = SubCategory.objects.filter(is_active=True).order_by('order', 'name')
        
        # Virtual Tier 1 Shops
        result = [
            {
                "id": "shop_premium",
                "_id": "shop_premium",
                "name": "VD's Premium Store",
                "slug": "vds-premium-store",
                "parent_id": None,
                "media_url": "/assets/vds_elite.png",
                "banner_image_url": "/assets/vds_elite.png",
                "subcategories": [],
                "is_active": True,
                "order": 1,
            },
            {
                "id": "shop_normal",
                "_id": "shop_normal",
                "name": "VD's Store",
                "slug": "vds-store",
                "parent_id": None,
                "media_url": "/assets/vds_base.png",
                "banner_image_url": "/assets/vds_base.png",
                "subcategories": [],
                "is_active": True,
                "order": 2,
            }
        ]
        
        for m in main_cats:
            # Determine Tier 1 parent based on explicit shop_type
            shop_type_lower = (m.shop_type or "").lower()
            
            # Simple, non-hardcoded routing based purely on database field
            if "premium" in shop_type_lower:
                shop_parent_id = "shop_premium"
            else:
                shop_parent_id = "shop_normal"
            
            subs = []
            for s in sub_cats:
                if str(s.main_category_id) == str(m.id):
                    subs.append({
                        "id": str(s.id),
                        "_id": str(s.id),
                        "name": s.name,
                        "slug": s.slug,
                        "parent_id": str(m.id),
                        "thumbnail_image_url": s.thumbnail,
                        "media_url": s.thumbnail,
                        "is_active": s.is_active,
                        "order": s.order,
                    })

            result.append({
                "id": str(m.id),
                "_id": str(m.id),
                "name": m.name,
                "slug": m.slug,
                "parent_id": shop_parent_id,
                "media_url": m.banner_image,
                "banner_image_url": m.banner_image,
                "subcategories": subs,
                "is_active": m.is_active,
                "order": m.order,
            })
            
            result.extend(subs)
            
        parent_id = request.query_params.get('parent')
        if parent_id:
            if parent_id == 'null':
                result = [r for r in result if r['parent_id'] is None]
            else:
                result = [r for r in result if r['parent_id'] == parent_id]
                
        return Response(result)

class CouponListView(generics.ListAPIView):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAuthenticated]

class ValidateCouponView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        code = request.data.get('code')
        try:
            coupon = Coupon.objects.get(code=code, is_active=True)
            return Response({"valid": True, "discount_value": float(coupon.discount_value)})
        except Coupon.DoesNotExist:
            return Response({"valid": False, "message": "Invalid code"}, status=400)

class StoryListView(generics.ListAPIView):
    queryset = Story.objects.all()
    serializer_class = StoryListSerializer
    permission_classes = [permissions.AllowAny]

class StoryDetailView(generics.RetrieveAPIView):
    queryset = Story.objects.all()
    serializer_class = StorySerializer
    lookup_field = 'id'
    permission_classes = [permissions.AllowAny]

class HeroView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        hero = Hero.objects.first() or Hero.objects.create(title="Welcome to Videeptha Foods")
        return Response(HeroSerializer(hero).data)

class ThemeView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        branding = WebsiteBranding.objects.first() or WebsiteBranding.objects.create(name="Videeptha Foods")
        typography = WebsiteTypography.objects.first() or WebsiteTypography.objects.create(name="Default Typography")
        footer = WebsiteFooter.objects.first() or WebsiteFooter.objects.create(name="Main Footer")
        theme = WebsiteTheme.objects.first() or WebsiteTheme.objects.create(name="Global Theme")
        
        return Response({
            "branding": WebsiteBrandingSerializer(branding).data,
            "typography": WebsiteTypographySerializer(typography).data,
            "footer": WebsiteFooterSerializer(footer).data,
            "theme": WebsiteThemeSerializer(theme).data
        })

class NavigationDetailView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        nav = Navigation.objects.first()
        if not nav: return Response({"items": []})
        return Response(NavigationSerializer(nav).data)

class PolicyListView(generics.ListAPIView):
    serializer_class = PolicySerializer
    permission_classes = [permissions.AllowAny]
    def get_queryset(self):
        return Policy.objects.filter(is_active=True).order_by('order')

class PromotionListView(generics.ListAPIView):
    serializer_class = PromotionSerializer
    permission_classes = [permissions.AllowAny]
    def get_queryset(self):
        return Promotion.objects.filter(is_active=True).order_by('order')

class OrderListView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return Order.objects.filter(user_id=str(self.request.user.id)).order_by('-created_at')
    def perform_create(self, serializer):
        serializer.save(user_id=str(self.request.user.id), order_number=f"ORD-{datetime.datetime.now().strftime('%Y%m%d')}-{datetime.datetime.now().microsecond}")

class BulkOrderListView(generics.ListCreateAPIView):
    serializer_class = BulkOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BulkOrder.objects.filter(user_id=str(self.request.user.id)).order_by('-created_at')

    def perform_create(self, serializer):
        # Generate order number
        order_num = f"BLK-{datetime.datetime.now().strftime('%Y%m%d')}-{datetime.datetime.now().microsecond}"
        instance = serializer.save(user_id=str(self.request.user.id), order_number=order_num)
        
        # Send automated email to management
        try:
            items_list = "\n".join([f"- {item.get('product_name')} (Qty: {item.get('quantity')})" for item in instance.items])
            address = instance.shipping_address
            address_str = f"{address.get('street_address')}, {address.get('city')}, {address.get('state')} {address.get('pincode')}"
            
            subject = f"NEW BULK ORDER: {order_num}"
            message = (
                f"A new bulk order has been placed by {self.request.user.email}.\n\n"
                f"Order Number: {order_num}\n"
                f"Total Amount: {instance.currency} {instance.total_amount}\n"
                f"Items:\n{items_list}\n\n"
                f"Shipping Address:\n{address_str}\n\n"
                f"Please review this request in the admin panel."
            )
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                ['videepthafoods1602@gmail.com'],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Error sending bulk order email: {str(e)}")

class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    def get_queryset(self):
        return Order.objects.filter(user_id=str(self.request.user.id))

class SupportTicketListView(generics.ListCreateAPIView):
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return SupportTicket.objects.filter(user_id=str(self.request.user.id)).order_by('-created_at')
    def perform_create(self, serializer):
        serializer.save(user_id=str(self.request.user.id))

class SupportTicketDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    def get_queryset(self):
        return SupportTicket.objects.filter(user_id=str(self.request.user.id))

class FavoriteListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        favorites = Favorite.objects.filter(user=request.user)
        return Response([f.product_id for f in favorites])

    def post(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"error": "product_id is required"}, status=400)
        Favorite.objects.get_or_create(user=request.user, product_id=product_id)
        return Response(status=201)

class FavoriteRemoveView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def delete(self, request, product_id):
        Favorite.objects.filter(user=request.user, product_id=product_id).delete()
        return Response(status=204)

class TrackProductEventView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        return Response({"status": "tracked"})

class AdminAnalyticsView(APIView):
    permission_classes = [IsRoleBasedAdminOrReadOnly]
    def get(self, request):
        analytics = ProductAnalytics.objects.all().order_by('-views')
        return Response([{"product_id": a.product_id, "views": a.views} for a in analytics])

class SeedAllView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        import os, traceback
        import pandas as pd
        from django.utils.text import slugify
        from .models import MainCategory, SubCategory, Product
        
        try:
            # Set correct path in current project to use the newest Excel version
            excel_path = r'd:\VDF_Foods\vdfoods---Finalver\Final_VideepthaProductssss.xlsx'
            if not os.path.exists(excel_path):
                return Response({"error": f"Excel file not found at {excel_path}"}, status=400)
            
            df = pd.read_excel(excel_path, sheet_name='All Products Mapping')
            # Normalize column names
            df.columns = [str(c).strip() for c in df.columns]
            cols = df.columns.tolist()
            
            shop_col = next((c for c in cols if 'Shop' in c), None)
            m_col = next((c for c in cols if 'Main' in c), None)
            s_col = next((c for c in cols if 'Sub' in c), None)
            p_col = next((c for c in cols if 'Prod' in c or 'Item' in c), None)
            
            if not shop_col or not m_col: 
                 return Response({"error": f"Required columns (Shop, Main Category) not found. Found: {cols}"}, status=400)

            # --- CLEAR DATABASE FOR FRESH START ---
            Product.objects.all().delete()
            MainCategory.objects.all().delete()
            SubCategory.objects.all().delete()
            
            counts = {"main": 0, "sub": 0, "products": 0}
            
            # Cache for categories to avoid redundant DB hits
            main_cat_cache = {}
            sub_cat_cache = {}
            products_to_create = []

            for _, row in df.iterrows():
                raw_shop = str(row[shop_col]).strip() if pd.notna(row[shop_col]) else ''
                if not raw_shop or raw_shop.lower() == 'nan': continue

                m_name = str(row[m_col]).strip() if pd.notna(row[m_col]) else ''
                if not m_name or m_name.lower() == 'nan': continue

                # --- CATEGORY NAME NORMALIZATION ---
                # Collapse "Gut Friendly" into "Gut friendly fruit drinks"
                if m_name.lower().strip() == 'gut friendly':
                    m_name = "Gut friendly fruit drinks"

                # Determine which shops this category should belong to
                target_shops = []
                
                # Trust the raw_shop from Excel/DB or fall back to VD's Store
                if raw_shop and "premium" in raw_shop.lower():
                    target_shops.append("VD's Premium Store")
                else:
                    target_shops.append("VD's Store")
                
                # If NOT in either list, default to Excel's raw_shop
                if not target_shops:
                    if raw_shop.lower() == 'premium': target_shops.append("VD's Premium Store")
                    else: target_shops.append("VD's Store")

                s_name = str(row[s_col]).strip() if s_col and pd.notna(row[s_col]) else ''
                p_name = str(row[p_col]).strip() if p_col and pd.notna(row[p_col]) else ''
                
                for shop_name in target_shops:
                    # --- SHOP-SPECIFIC SUB-CATEGORY FILTERING (TRUTH RULE) ---
                    # 1. Normal Shop: Millet Rice Varieties ONLY allows "Rice Varieties" sub-cat
                    if shop_name == "VD's Store" and m_name == "Millet Rice Varieties":
                        if s_name != "Rice Varieties":
                            continue

                    # 1. Main Category
                    m_key = (shop_name, m_name)
                    if m_key not in main_cat_cache:
                        main_cat = MainCategory.objects.create(
                            shop_type=shop_name,
                            name=m_name,
                            slug=slugify(f"{shop_name}-{m_name}")[:50],
                            banner_image=""
                        )
                        main_cat_cache[m_key] = main_cat
                        counts["main"] += 1
                    else:
                        main_cat = main_cat_cache[m_key]
                    
                    # 2. Subcategory
                    sub_cat = None
                    if s_name and s_name.lower() != 'nan' and s_name.strip().lower() != m_name.strip().lower():
                        s_key = (main_cat.id, s_name)
                        if s_key not in sub_cat_cache:
                            sub_cat = SubCategory.objects.create(
                                main_category=main_cat,
                                name=s_name,
                                slug=slugify(f"{shop_name}-{m_name}-{s_name}")[:50],
                                thumbnail=""
                            )
                            sub_cat_cache[s_key] = sub_cat
                            counts["sub"] += 1
                        else:
                            sub_cat = sub_cat_cache[s_key]
                    
                    # 3. Product Preparation
                    if p_name and p_name.lower() != 'nan':
                        sub_id = str(sub_cat.id) if sub_cat else ""
                        products_to_create.append(Product(
                            name=p_name,
                            price=0.0,
                            stock=100,
                            category_ids=[str(main_cat.id)],
                            subcategory_id=sub_id,
                            is_active=True
                        ))
                        counts["products"] += 1

            # Final Bulk Insert for speed
            if products_to_create:
                Product.objects.bulk_create(products_to_create)

            dump_path = r'd:\VDF_Foods\vdfoods---Finalver\seed_dump.json'
            # (JSON dump logic already handled above or needs to be re-run)
            
            # --- CONFLICT DETECTION: CATEGORIES IN BOTH SHOPS ---
            name_to_shops = {}
            for m in MainCategory.objects.all():
                if m.name not in name_to_shops: name_to_shops[m.name] = set()
                name_to_shops[m.name].add(m.shop_type)
            
            conflicts = [name for name, shops in name_to_shops.items() if len(shops) > 1]

            # --- DETAILED RECAP FOR DEBUGGING ---
            main_recap = []
            for m in MainCategory.objects.all():
                main_recap.append({"category": m.name, "shop": m.shop_type})

            return Response({
                "status": "Success", 
                "message": f"Seeded {counts['main']} main categories, {counts['sub']} subcategories, and {counts['products']} products.",
                "details": counts,
                "conflicts": conflicts,
                "mappings": main_recap,
                "dump_path": dump_path
            })
        except Exception as e:
            return Response({"error": str(e), "traceback": traceback.format_exc()}, status=500)

class FullHierarchyView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        import traceback
        try:
            from .models import Category, Product
            mains = Category.objects.filter(parent__isnull=True).order_by('name')
            hierarchy = []
            for m in mains:
                subs = []
                for s in m.subcategories.all().order_by('name'):
                    # Use a simpler filter to avoid MongoDB JSONField issues if any
                    prods = []
                    s_id_str = str(s.id)
                    all_prods = Product.objects.all()
                    for p in all_prods:
                        if s_id_str in p.category_ids:
                             prods.append(p.name)
                    
                    subs.append({"name": s.name, "products": prods})
                
                # Direct products
                direct_prods = []
                m_id_str = str(m.id)
                all_prods = Product.objects.all()
                for p in all_prods:
                    if m_id_str in p.category_ids:
                         direct_prods.append(p.name)
                
                hierarchy.append({
                    "main": m.name,
                    "subcategories": subs,
                    "direct_products": direct_prods
                })
            return Response(hierarchy)
        except Exception as e:
            return Response({"error": str(e), "traceback": traceback.format_exc()}, status=500)

class ListExcelCategoriesView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        import pandas as pd
        import os
        paths_to_try = [
            'c:\\Users\\hp\\OneDrive\\Desktop\\finalVDPFWebsite\\Final_Menu_Categories_Products.xlsx',
            'c:\\Users\\hp\\OneDrive\\Desktop\\finalVDPFWebsite\\Final_Menu_Category_Products.xlsx',
        ]
        excel_path = next((p for p in paths_to_try if os.path.exists(p)), None)
        if not excel_path: return Response({"error": "File not found"}, status=404)
        
        df = pd.read_excel(excel_path, sheet_name='All Products Mapping')
        m_col = next((c for c in df.columns if 'Main' in str(c)), None)
        if not m_col: return Response({"error": "Main column not found"}, status=400)
        
        # Strip and find unique mains
        unique_mains = []
        for x in df[m_col]:
             if pd.notna(x):
                  val = str(x).strip()
                  if val and val.lower() != 'nan' and val not in unique_mains:
                       unique_mains.append(val)
        
        return Response({
            "excel_rows": len(df),
            "found_mains": unique_mains,
            "mains_count": len(unique_mains)
        })

class InspectExcelTailView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        import pandas as pd
        import os
        paths_to_try = [
            'c:\\Users\\hp\\OneDrive\\Desktop\\finalVDPFWebsite\\Final_Menu_Categories_Products.xlsx'
        ]
        excel_path = next((p for p in paths_to_try if os.path.exists(p)), None)
        if not excel_path: return Response({"error": "File not found"}, status=404)
        
        df = pd.read_excel(excel_path, sheet_name='All Products Mapping')
        return Response(df.tail(30).fillna('').to_dict(orient='records'))

class DetectLocationView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        return Response({"country": "IN"})
