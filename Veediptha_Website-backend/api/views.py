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
    queryset = Product.objects.all()
    serializer_class = ProductLiteSerializer
    permission_classes = [permissions.AllowAny]

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

class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Category.objects.all().order_by('order', 'name')
        parent_id = self.request.query_params.get('parent')
        if parent_id:
            if parent_id == 'null':
                queryset = queryset.filter(parent__isnull=True)
            else:
                queryset = queryset.filter(parent_id=parent_id)
        return queryset

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
        from django.utils.text import slugify
        from .models import Category, Product
        try:
            import pandas as pd
        except ImportError:
            return Response({"error": "pandas is not installed"}, status=500)
            
        try:
            excel_path = next((p for p in [
                'c:\\Users\\hp\\OneDrive\\Desktop\\finalVDPFWebsite\\Final_Menu_Categories_Products.xlsx',
                'c:\\Users\\hp\\OneDrive\\Desktop\\finalVDPFWebsite\\Final_Menu_Category_Products.xlsx'
            ] if os.path.exists(p)), None)
            
            if not excel_path: return Response({"error": "Excel file not found"}, status=400)
            
            df = pd.read_excel(excel_path, sheet_name='All Products Mapping')
            # Normalize column names
            df.columns = [str(c).strip() for c in df.columns]
            cols = df.columns.tolist()
            
            m_col = next((c for c in cols if 'Main' in c), None)
            s_col = next((c for c in cols if 'Sub' in c), None)
            p_col = next((c for c in cols if 'Prod' in c or 'Item' in c), None)
            
            if not m_col: return Response({"error": "Main Category column not found"}, status=400)

            # Clear DB
            Product.objects.all().delete()
            # Clear categories in order (child then parent)
            Category.objects.filter(parent__isnull=False).delete()
            Category.objects.filter(parent__isnull=True).delete()
            
            counts = {"main": 0, "sub": 0, "products": 0}
            
            for _, row in df.iterrows():
                m_name = str(row[m_col]).strip() if pd.notna(row[m_col]) else ''
                s_name = str(row[s_col]).strip() if s_col and pd.notna(row[s_col]) else ''
                p_name = str(row[p_col]).strip() if p_col and pd.notna(row[p_col]) else ''
                
                if not m_name or m_name.lower() == 'nan': continue
                
                # 1. Main Category
                main_cat, created = Category.objects.get_or_create(
                    name=m_name,
                    parent=None,
                    defaults={'slug': slugify(m_name)}
                )
                if created: counts["main"] += 1
                
                # 2. Subcategory
                target_cat = main_cat
                if s_name and s_name.lower() != 'nan':
                     sub_cat, created = Category.objects.get_or_create(
                         name=s_name,
                         parent=main_cat,
                         defaults={'slug': slugify(f"{m_name}-{s_name}")[:50]}
                     )
                     if created: counts["sub"] += 1
                     target_cat = sub_cat
                
                # 3. Product
                if p_name and p_name.lower() != 'nan':
                    Product.objects.create(
                        name=p_name,
                        price=0.0,
                        stock=100,
                        category_ids=[str(target_cat.id)],
                        is_active=True
                    )
                    counts["products"] += 1
            
            return Response({"status": "Fresh seeding complete", "counts": counts})
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
