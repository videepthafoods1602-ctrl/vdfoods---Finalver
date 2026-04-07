from django.db import models
import uuid
from django.utils import timezone
from django_mongodb_backend.fields import ObjectIdAutoField

class Block(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    type = models.CharField(max_length=50)
    content = models.JSONField(default=dict, blank=True)
    styles = models.JSONField(default=dict, blank=True)
    animations = models.JSONField(default=dict, blank=True)
    visibility = models.JSONField(default=dict, blank=True)

    class Meta:
        abstract = True

class Section(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    layout = models.CharField(max_length=50)
    styles = models.JSONField(default=dict, blank=True)
    blocks = models.JSONField(default=list, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        abstract = True

class Page(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    meta_title = models.CharField(max_length=255, blank=True, null=True)
    meta_description = models.TextField(blank=True, null=True)
    layout = models.CharField(max_length=50, default="default")
    is_active = models.BooleanField(default=True)
    status = models.CharField(max_length=20, default="draft")
    sections = models.JSONField(default=list, blank=True)
    version = models.IntegerField(default=1)

    class Meta:
        db_table = 'pages'

    def __str__(self):
        return self.name

class Category(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='subcategories')
    description = models.TextField(blank=True, null=True)
    media_url = models.CharField(max_length=255, blank=True, null=True)
    media_type = models.CharField(max_length=20, default="image")
    thumbnail_image_url = models.CharField(max_length=500, blank=True, null=True)
    banner_image_url = models.CharField(max_length=500, blank=True, null=True)
    banner_details = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'categories'

    def __str__(self):
        return self.name

class MainCategory(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    shop_type = models.CharField(max_length=50, default="Normal", db_column="shop") # "Premium" or "Normal"
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    banner_image = models.CharField(max_length=500, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'main_categories'

    def __str__(self):
        return f"{self.shop_type} - {self.name}"

class SubCategory(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    main_category = models.ForeignKey(MainCategory, null=True, blank=True, on_delete=models.CASCADE, related_name='subcategories')
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    thumbnail = models.CharField(max_length=500, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'sub_categories'

    def __str__(self):
        return self.name

class Product(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.IntegerField()
    images = models.JSONField(default=list)
    category_ids = models.JSONField(default=list)
    subcategory_id = models.CharField(max_length=100, blank=True, null=True)
    attributes = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'products'

    def __str__(self):
        return self.name

class Coupon(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=20)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_cart_value = models.DecimalField(max_digits=10, decimal_places=2)
    expiry_date = models.DateTimeField(null=True, blank=True)
    usage_limit = models.IntegerField(null=True, blank=True)
    usage_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    applied_to = models.JSONField(default=dict)

    class Meta:
        db_table = 'coupons'

    def __str__(self):
        return self.code

class WebsiteBranding(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    name = models.CharField(max_length=255, default="Videeptha Foods")
    logo_url = models.CharField(max_length=500, blank=True, null=True)
    ticker_text = models.JSONField(default=list, blank=True)
    ticker_style = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'website_branding'

    def __str__(self):
        return f"Branding: {self.name}"

class WebsiteTypography(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    name = models.CharField(max_length=100, default="Default Typography")
    font_urls = models.JSONField(default=dict, blank=True)
    typography_settings = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'website_typography'

    def __str__(self):
        return self.name

class WebsiteFooter(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    name = models.CharField(max_length=100, default="Main Footer")
    footer_contact = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'website_footer'

    def __str__(self):
        return self.name

class WebsiteTheme(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    colors = models.JSONField(default=dict)
    dark_mode_colors = models.JSONField(default=dict, blank=True, null=True)
    light_mode_colors = models.JSONField(default=dict, blank=True, null=True)
    button_styles = models.JSONField(default=dict, blank=True, null=True)
    global_background = models.JSONField(default=dict, blank=True, null=True)
    bg_blur = models.IntegerField(default=0)
    bg_brightness = models.IntegerField(default=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'website_theme'

    def __str__(self):
        return self.name

class Story(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True, null=True)
    thumbnailImage = models.CharField(max_length=255, blank=True, null=True)
    heroImage = models.CharField(max_length=255, blank=True, null=True)
    shortExcerpt = models.TextField(blank=True, null=True)
    fullStoryContent = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'stories'

    def __str__(self):
        return self.title

class Hero(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    backgroundImage = models.CharField(max_length=5000000, blank=True, null=True)
    videoUrl = models.TextField(blank=True, null=True)
    bg_type = models.CharField(max_length=50, default='image')
    bg_gradient = models.JSONField(default=dict)
    alignment = models.CharField(max_length=50, default='center')
    content_x = models.IntegerField(default=50)
    content_y = models.IntegerField(default=50)
    bg_blur = models.IntegerField(default=0)
    bg_brightness = models.IntegerField(default=100)
    title_font = models.CharField(max_length=100, default='Outfit')
    title_color = models.CharField(max_length=50, default='#ffffff')
    title_size = models.CharField(max_length=50, default='text-5xl')
    subtitle_font = models.CharField(max_length=100, default='Outfit')
    subtitle_size = models.CharField(max_length=50, default='text-xl')
    subtitle_color = models.CharField(max_length=50, default='#ffffff')
    description_color = models.CharField(max_length=50, default='#ffffff')
    ctaText = models.CharField(max_length=100, blank=True, null=True)
    ctaLink = models.CharField(max_length=255, blank=True, null=True)
    secondaryCtaText = models.CharField(max_length=100, blank=True, null=True)
    secondaryCtaLink = models.CharField(max_length=255, blank=True, null=True)
    animation_type = models.CharField(max_length=50, default='fade-up')
    parallax_speed = models.FloatField(default=0.5)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'heroes'

    def __str__(self):
        return self.title

class Navigation(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    items = models.JSONField(default=list)

    class Meta:
        db_table = 'navigation'

    def __str__(self):
        return self.name

class Policy(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    content = models.TextField(blank=True, default='')
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'policies'

    def __str__(self):
        return self.title

class Order(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    user_id = models.CharField(max_length=100)
    order_number = models.CharField(max_length=50, unique=True)
    items = models.JSONField(default=list)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10)
    status = models.CharField(max_length=20)
    shipping_address = models.JSONField(default=dict)
    payment_details = models.JSONField(default=dict, blank=True, null=True)
    device_location = models.JSONField(default=dict, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'orders'

    def __str__(self):
        return self.order_number

class BulkOrder(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    user_id = models.CharField(max_length=100)
    order_number = models.CharField(max_length=50, unique=True)
    items = models.JSONField(default=list)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10)
    status = models.CharField(max_length=40, default='Bulk Order Received')
    shipping_address = models.JSONField(default=dict)
    bulk_status = models.CharField(max_length=40, default='Pending Manager Review')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bulk_orders'

    def __str__(self):
        return f"BULK-{self.order_number}"

class Stock(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    product_id = models.CharField(max_length=100, unique=True)
    current_quantity = models.IntegerField()
    low_stock_threshold = models.IntegerField()
    movements = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'website_stock'

    def __str__(self):
        return f"Stock for {self.product_id}"

class Promotion(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    ctaText = models.CharField(max_length=100, default="Learn More")
    ctaLink = models.CharField(max_length=255, default="/products")
    title_font = models.CharField(max_length=100, default="Outfit")
    title_size = models.CharField(max_length=100, default="text-6xl")
    title_color = models.CharField(max_length=20, default="#ffffff")
    subtitle_font = models.CharField(max_length=100, default="Outfit")
    subtitle_size = models.CharField(max_length=100, default="text-xs")
    subtitle_color = models.CharField(max_length=20, default="#4ade80")
    target_type = models.CharField(max_length=20, default="all")
    target_ids = models.JSONField(default=list, blank=True)
    coupon_code = models.CharField(max_length=50, blank=True, null=True)
    background_type = models.CharField(max_length=20, default="color")
    background_image = models.CharField(max_length=255, blank=True, null=True)
    background_video = models.CharField(max_length=255, blank=True, null=True)
    background_color = models.CharField(max_length=20, default="#ffffff")
    background_gradient = models.JSONField(default=dict, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'promotions'

    def __str__(self):
        return self.title

class SupportTicket(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    user_id = models.CharField(max_length=100)
    issue_type = models.CharField(max_length=100)
    description = models.TextField()
    other_description = models.TextField(blank=True, null=True)
    media_urls = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, default="open")
    conversations = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'website_support_tickets'

    def __str__(self):
        return f"Ticket {self.id} ({self.status})"