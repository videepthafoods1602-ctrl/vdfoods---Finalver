from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views as website_views
from .upload_views import ImageUploadView

urlpatterns = [
    # Auth & Tokens
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('accounts/', include('accounts.urls')),
    
    # Public CMS
    path('pages/', website_views.PageListView.as_view(), name='page-list'),
    path('pages/<str:id>/', website_views.PageDetailView.as_view(), name='page-detail'),
    path('products/', website_views.ProductListView.as_view(), name='product-list'),
    path('products/<str:id>/', website_views.ProductDetailView.as_view(), name='product-detail'),
    path('categories/', website_views.CategoryListView.as_view(), name='category-list'),
    path('coupons/', website_views.CouponListView.as_view(), name='coupon-list'),
    path('coupons/validate/', website_views.ValidateCouponView.as_view(), name='coupon-validate'),
    path('stories/', website_views.StoryListView.as_view(), name='story-list'),
    path('stories/<str:id>/', website_views.StoryDetailView.as_view(), name='story-detail'),
    path('hero/', website_views.HeroView.as_view(), name='hero'),
    path('navigation/', website_views.NavigationDetailView.as_view(), name='navigation'),
    path('theme/', website_views.ThemeView.as_view(), name='theme'),
    path('policies/', website_views.PolicyListView.as_view(), name='policy-list'),
    
    # Customer Logic
    path('orders/', website_views.OrderListView.as_view(), name='order-list'),
    path('orders/<str:id>/', website_views.OrderDetailView.as_view(), name='order-detail'),
    path('bulk-orders/', website_views.BulkOrderListView.as_view(), name='bulk-order-list'),
    path('promotions/', website_views.PromotionListView.as_view(), name='promotion-list'),
    path('support-tickets/', website_views.SupportTicketListView.as_view(), name='support-ticket-list'),
    path('support-tickets/<str:id>/', website_views.SupportTicketDetailView.as_view(), name='support-ticket-detail'),
    
    # Utility
    path('location/detect/', website_views.DetectLocationView.as_view(), name='location-detect'),
    path('upload/', ImageUploadView.as_view(), name='image-upload'),
    
    # Favorites & Analytics
    path('favorites/', website_views.FavoriteListView.as_view(), name='favorite-list'),
    path('favorites/<str:product_id>/', website_views.FavoriteRemoveView.as_view(), name='favorite-remove'),
    path('track-event/', website_views.TrackProductEventView.as_view(), name='track-event'),
    path('admin/analytics/', website_views.AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('seed-all/', website_views.SeedAllView.as_view(), name='seed-all'),
    path('hierarchy/', website_views.FullHierarchyView.as_view(), name='hierarchy'),
    path('excel-categories/', website_views.ListExcelCategoriesView.as_view(), name='excel-categories'),
    path('excel-tail/', website_views.InspectExcelTailView.as_view(), name='excel-tail'),
]
