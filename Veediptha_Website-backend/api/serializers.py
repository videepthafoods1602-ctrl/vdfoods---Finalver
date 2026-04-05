from rest_framework import serializers
from .models import (
    Page, Product, Category, MainCategory, SubCategory, Coupon, WebsiteTheme, WebsiteBranding, 
    WebsiteTypography, WebsiteFooter, Story, Hero, Order, BulkOrder, Stock, 
    Promotion, SupportTicket
)
from bson import ObjectId
from decimal import Decimal
from collections.abc import Mapping

class MongoSerializer(serializers.Serializer):
    def to_representation(self, instance):
        ret = {}
        fields = self._readable_fields
        is_mapping = isinstance(instance, Mapping)

        for field in fields:
            try:
                if is_mapping:
                    val = instance.get(field.field_name, serializers.empty)
                    if val is serializers.empty and field.source and field.source != '*':
                        val = instance.get(field.source, serializers.empty)
                    
                    if val is serializers.empty:
                        attribute = field.get_attribute(instance)
                    else:
                        attribute = val
                else:
                    attribute = field.get_attribute(instance)
            except Exception:
                if field.default is not serializers.empty:
                    attribute = field.default
                elif field.allow_null:
                    attribute = None
                else:
                    continue
            
            if attribute is None:
                ret[field.field_name] = None
            else:
                ret[field.field_name] = field.to_representation(attribute)
        
        return self._convert_types(ret)

    def _convert_types(self, data, seen=None):
        if seen is None: seen = set()
        if id(data) in seen: return "[Circular]"
        if isinstance(data, (list, dict)): seen.add(id(data))

        if isinstance(data, list):
            return [self._convert_types(item, seen) for item in data]
        elif isinstance(data, dict):
            return {str(k) if isinstance(k, ObjectId) else k: self._convert_types(v, seen) for k, v in data.items()}
        elif isinstance(data, ObjectId):
            return str(data)
        elif isinstance(data, Decimal):
            return float(data)
        return data

class BlockSerializer(MongoSerializer):
    id = serializers.CharField()
    type = serializers.CharField()
    content = serializers.DictField(required=False, default={})
    styles = serializers.DictField(required=False, default={})
    animations = serializers.DictField(required=False, default={})
    visibility = serializers.DictField(required=False, default={"mobile": True, "tablet": True, "desktop": True})

class SectionSerializer(MongoSerializer):
    id = serializers.CharField()
    layout = serializers.CharField(required=False, default='default')
    styles = serializers.DictField(required=False, default={})
    blocks = BlockSerializer(many=True, required=False, default=[])
    order = serializers.IntegerField(required=False, default=0)

class PageSerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    name = serializers.CharField()
    slug = serializers.CharField()
    meta_title = serializers.CharField(required=False, allow_blank=True)
    meta_description = serializers.CharField(required=False, allow_blank=True)
    layout = serializers.CharField(default="default")
    is_active = serializers.BooleanField(default=True)
    status = serializers.CharField(default="draft")
    sections = SectionSerializer(many=True, required=False, default=[])
    version = serializers.IntegerField(default=1)

class PageListSerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    name = serializers.CharField()
    slug = serializers.CharField()
    meta_title = serializers.CharField(required=False, allow_blank=True)
    layout = serializers.CharField(default="default")
    is_active = serializers.BooleanField(default=True)
    status = serializers.CharField(default="draft")
    version = serializers.IntegerField(default=1)

class CategorySerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    name = serializers.CharField()
    slug = serializers.SlugField()
    parent = serializers.PrimaryKeyRelatedField(read_only=True)
    parent_id = serializers.CharField(source='parent.id', read_only=True)
    description = serializers.CharField(required=False, allow_blank=True)
    media_url = serializers.CharField(required=False, allow_blank=True)
    media_type = serializers.CharField(default="image")
    thumbnail_image_url = serializers.CharField(required=False, allow_blank=True)
    banner_image_url = serializers.CharField(required=False, allow_blank=True)
    banner_details = serializers.DictField(required=False, default={})
    order = serializers.IntegerField(required=False, default=0)
    is_active = serializers.BooleanField(default=True)
    subcategories = serializers.SerializerMethodField()

    def get_subcategories(self, obj):
        if hasattr(obj, 'subcategories'):
            return CategorySerializer(obj.subcategories.all(), many=True).data
        return []

class MainCategorySerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    shop_type = serializers.CharField()
    name = serializers.CharField()
    slug = serializers.SlugField()
    banner_image = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    order = serializers.IntegerField(required=False, default=0)
    is_active = serializers.BooleanField(default=True)
    subcategories = serializers.SerializerMethodField()

    def get_subcategories(self, obj):
        if hasattr(obj, 'subcategories'):
            return SubCategorySerializer(obj.subcategories.all(), many=True).data
        return []

class SubCategorySerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    main_category_id = serializers.CharField(source='main_category.id', read_only=True)
    name = serializers.CharField()
    slug = serializers.SlugField()
    thumbnail = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    order = serializers.IntegerField(required=False, default=0)
    is_active = serializers.BooleanField(default=True)

class ProductSerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    name = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    discount_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    stock = serializers.IntegerField()
    images = serializers.ListField(child=serializers.CharField())
    category_ids = serializers.ListField(child=serializers.CharField())
    subcategory_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    attributes = serializers.DictField()
    is_active = serializers.BooleanField(default=True)

class ProductLiteSerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    name = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    discount_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    stock = serializers.IntegerField()
    images = serializers.ListField(child=serializers.CharField())
    category_ids = serializers.ListField(child=serializers.CharField())
    subcategory_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    attributes = serializers.DictField(required=False, default=dict)
    is_active = serializers.BooleanField(default=True)

class CouponSerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    code = serializers.CharField()
    discount_type = serializers.CharField()
    discount_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    min_cart_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    expiry_date = serializers.DateTimeField(required=False, allow_null=True)
    is_active = serializers.BooleanField(default=True)

class WebsiteBrandingSerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    name = serializers.CharField()
    logo_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    ticker_text = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    ticker_style = serializers.DictField(required=False, default=dict)
    is_active = serializers.BooleanField(default=True)

class WebsiteTypographySerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    name = serializers.CharField()
    font_urls = serializers.DictField(required=False, default=dict)
    typography_settings = serializers.DictField(required=False, default=dict)
    is_active = serializers.BooleanField(default=True)

class WebsiteFooterSerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    name = serializers.CharField()
    footer_contact = serializers.DictField(required=False, default=dict)
    is_active = serializers.BooleanField(default=True)

class WebsiteThemeSerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    name = serializers.CharField()
    colors = serializers.DictField()
    dark_mode_colors = serializers.DictField(required=False)
    light_mode_colors = serializers.DictField(required=False)
    button_styles = serializers.DictField(required=False)
    global_background = serializers.DictField(required=False)
    bg_blur = serializers.IntegerField(required=False, default=0)
    bg_brightness = serializers.IntegerField(required=False, default=100)
    is_active = serializers.BooleanField(default=True)

class StorySerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    title = serializers.CharField()
    subtitle = serializers.CharField(required=False, allow_blank=True)
    thumbnailImage = serializers.CharField(required=False, allow_blank=True)
    heroImage = serializers.CharField(required=False, allow_blank=True)
    shortExcerpt = serializers.CharField(required=False, allow_blank=True)
    fullStoryContent = serializers.ListField(child=serializers.DictField())
    is_active = serializers.BooleanField(default=True)

class StoryListSerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    title = serializers.CharField()
    subtitle = serializers.CharField(required=False, allow_blank=True)
    thumbnailImage = serializers.CharField(required=False, allow_blank=True)
    heroImage = serializers.CharField(required=False, allow_blank=True)
    shortExcerpt = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(default=True)

class HeroSerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    title = serializers.CharField()
    subtitle = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    backgroundImage = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    videoUrl = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    bg_type = serializers.CharField(required=False, default='image')
    bg_gradient = serializers.DictField(required=False, default=dict)
    alignment = serializers.CharField(required=False, default='center')
    content_x = serializers.IntegerField(required=False, default=50)
    content_y = serializers.IntegerField(required=False, default=50)
    bg_blur = serializers.IntegerField(required=False, default=0)
    bg_brightness = serializers.IntegerField(required=False, default=100)
    title_font = serializers.CharField(required=False, default='Outfit')
    title_color = serializers.CharField(required=False, default='#ffffff')
    title_size = serializers.CharField(required=False, default='text-5xl')
    ctaText = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    ctaLink = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    secondaryCtaText = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    secondaryCtaLink = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    animation_type = serializers.CharField(required=False, default='fade-up')
    parallax_speed = serializers.FloatField(required=False, default=0.5)
    is_active = serializers.BooleanField(default=True)

class HeroLiteSerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField()
    subtitle = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    bg_type = serializers.CharField(default='image')
    ctaText = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    ctaLink = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    backgroundImage = serializers.CharField(required=False, allow_blank=True, allow_null=True)

class NavigationSerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    name = serializers.CharField()
    items = serializers.ListField(child=serializers.DictField())

class PolicySerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    title = serializers.CharField()
    slug = serializers.CharField()
    content = serializers.CharField(required=False, allow_blank=True, default='')
    order = serializers.IntegerField(default=0)
    is_active = serializers.BooleanField(default=True)
    updated_at = serializers.DateTimeField(read_only=True)

class OrderSerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    user_id = serializers.CharField(required=False)
    order_number = serializers.CharField(required=False)
    items = serializers.ListField(child=serializers.DictField())
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField()
    status = serializers.CharField(required=False, default='Received')
    shipping_address = serializers.DictField()
    device_location = serializers.DictField(required=False)
    created_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        return Order.objects.create(**validated_data)

class BulkOrderSerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    user_id = serializers.CharField(required=False)
    order_number = serializers.CharField(required=False)
    items = serializers.ListField(child=serializers.DictField())
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField()
    status = serializers.CharField(required=False, default='Bulk Order Received')
    shipping_address = serializers.DictField()
    bulk_status = serializers.CharField(required=False, default='Pending Manager Review')
    created_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        return BulkOrder.objects.create(**validated_data)

class StockSerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    product_id = serializers.CharField()
    current_quantity = serializers.IntegerField()
    low_stock_threshold = serializers.IntegerField()
    movements = serializers.ListField(child=serializers.DictField(), required=False)
    updated_at = serializers.DateTimeField(read_only=True)

class PromotionSerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    title = serializers.CharField()
    subtitle = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    ctaText = serializers.CharField(default="Learn More")
    ctaLink = serializers.CharField(default="/products")
    is_active = serializers.BooleanField(default=True)
    background_type = serializers.CharField(default="color")
    background_color = serializers.CharField(default="#ffffff")

class SupportTicketSerializer(MongoSerializer):
    id = serializers.CharField(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    user_id = serializers.CharField()
    issue_type = serializers.CharField()
    description = serializers.CharField()
    status = serializers.CharField(default="open")
    created_at = serializers.DateTimeField(read_only=True)
