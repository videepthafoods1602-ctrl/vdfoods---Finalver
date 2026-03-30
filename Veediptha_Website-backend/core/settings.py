import os
import environ
from datetime import timedelta
from pathlib import Path
import mongoengine
import core.monkey_patch

# Initialize environ
env = environ.Env()
# reading .env file
environ.Env.read_env(env_file=os.path.join(Path(__file__).resolve().parent.parent, '.env'))


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY', default='django-insecure-c+tya5^h$(p40^c5(qtf-ljfh#!ei6xa@+uc#3fptg98vr-*p6')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env.bool('DEBUG', default=True)

ALLOWED_HOSTS = ['videepthamdfoods.com', '187.77.186.154', 'localhost', '127.0.0.1']
# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt',
    
    # Local apps
    'api',
    'accounts',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ALLOW_ALL_ORIGINS = True 
CORS_ALLOW_CREDENTIALS = True

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# MongoEngine connection
MONGODB_URI = env('MONGODB_URI', default=None)
MONGODB_DB = env('MONGODB_DB', default='ecommerce_db')
MONGODB_HOST = env('MONGODB_HOST', default='localhost')
MONGODB_PORT = env.int('MONGODB_PORT', default=27017)

if MONGODB_URI:
    # Ensure the database name is used
    if '?' in MONGODB_URI:
        # If there's a query string, insert database name before it
        base, query = MONGODB_URI.split('?', 1)
        if not base.endswith('/'):
            uri_with_db = f"{base}/{MONGODB_DB}?{query}"
        else:
            uri_with_db = f"{base}{MONGODB_DB}?{query}"
    else:
        # No query string
        if not MONGODB_URI.endswith('/'):
            uri_with_db = f"{MONGODB_URI}/{MONGODB_DB}"
        else:
            uri_with_db = f"{MONGODB_URI}{MONGODB_DB}"
    
    mongoengine.connect(host=uri_with_db)
else:
    mongoengine.connect(
        db=MONGODB_DB,
        host=MONGODB_HOST,
        port=MONGODB_PORT,
    )

# Database
# Using django-mongodb-backend for MongoDB as the primary database
DATABASES = {
    'default': {
        'ENGINE': 'django_mongodb_backend',
        'NAME': MONGODB_DB,
        'HOST': MONGODB_URI or f"mongodb://{MONGODB_HOST}:{MONGODB_PORT}/",
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator' },
]

AUTH_USER_MODEL = 'accounts.User'

# Encryption Secrets (Ported from trial_1 architecture)
import base64
ENCRYPTION_KEY = env('ENCRYPTION_KEY', default=base64.urlsafe_b64encode(os.urandom(32)).decode())
ENCRYPTION_MASTER_SECRET = env('ENCRYPTION_MASTER_SECRET', default='dev-master-secret-change-in-production')
ENCRYPTION_HMAC_SECRET = env('ENCRYPTION_HMAC_SECRET', default='dev-hmac-secret-change-in-production')
ENCRYPTION_SESSION_SECRET = env('ENCRYPTION_SESSION_SECRET', default='dev-session-secret-change-in-production')


# DRF configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'accounts.authentication.JWTAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'COERCE_DECIMAL_TO_STRING': False,
    'DEFAULT_RENDERER_CLASSES': (
        'core.renderers.MongoJSONRenderer',
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ),
}

# Cache configuration - Use Redis if URL is provided, otherwise fallback to LocMemCache for development
REDIS_URL = env('REDIS_URL', default=None)

if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            }
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
        }
    }

# Simple JWT settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=10),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ISSUER': 'videeptha-auth',
    'AUDIENCE': 'videeptha-app',
}

# Production Security
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[
        'https://videepthamdfoods.com',
        'http://videepthamdfoods.com',
        'http://localhost:5173',
        'http://localhost:8000'
    ])
    CSRF_TRUSTED_ORIGINS = [
        'https://videepthamdfoods.com',
        'http://videepthamdfoods.com'
    ]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django_mongodb_backend.fields.ObjectIdAutoField'
SILENCED_SYSTEM_CHECKS = ['mongodb.E001']

# ── Email (Gmail SMTP) ─────────────────────────────────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = f'Videeptha Foods <{env("EMAIL_HOST_USER", default="noreply@videepthafoods.com")}>'

# ── Google OAuth ───────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID = env('GOOGLE_CLIENT_ID', default='')

# ── Logging ───────────────────────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'debug.log'),
            'formatter': 'verbose',
        },
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'accounts': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}

# Increase upload limit to 50MB for video base64 strings
DATA_UPLOAD_MAX_MEMORY_SIZE = 52428800
