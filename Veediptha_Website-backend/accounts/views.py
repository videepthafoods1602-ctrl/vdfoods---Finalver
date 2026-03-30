import uuid
import random
import datetime
import hmac
import hashlib
import os
import base64
import json
import logging
import jwt
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import authenticate, get_user_model
from django.utils import timezone
from django.utils.translation import gettext as _
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import AdminProfile, CustomerProfile, OTPStore, PendingSignup, RefreshToken, Address, Favorite
from .serializers import UserSerializer, ProfileSerializer, AuthResponseSerializer, AddressSerializer
from .otp_utils import set_otp, verify_otp, clean_otp_for_user, clean_expired_otps
from .utils import get_currency_for_country
from .rate_limit import (
    check_rate_limit, record_attempt, reset_rate_limit, 
    LOGIN_ATTEMPTS_LIMIT, LOGIN_ATTEMPTS_WINDOW, 
    OTP_REQUEST_LIMIT, OTP_REQUEST_WINDOW
)
from .exceptions import (
    EmailAlreadyExistsException, UserNotFoundException, 
    InvalidCredentialsException, AccountLockedException, 
    DatabaseConnectionException
)
from .serializers import AdminProfileSerializer

User = get_user_model()
logger = logging.getLogger('accounts')

# --- Token Utilities ---

def generate_tokens(user, profile, request=None):
    """
    Generate Access (JWT) and Refresh (rotated) tokens.
    """
    ip = None
    ua = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        ua = request.META.get('HTTP_USER_AGENT')

    # 1. Access Token (JWT) - Short lived (10 minutes for production readiness)
    now_aware = timezone.now()
    exp_time = now_aware + datetime.timedelta(minutes=10)
    
    access_payload = {
        'user_id': str(user.id),
        'exp': int(exp_time.timestamp()),
        'iat': int(now_aware.timestamp()),
        'jti': str(uuid.uuid4()),
        'iss': 'videeptha-auth',
        'aud': 'videeptha-app',
        'type': 'access'
    }
    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256')
    
    # 2. Refresh Token - Long lived (7 days)
    refresh_token_raw = base64.urlsafe_b64encode(os.urandom(32)).decode()
    refresh_token_hash = hashlib.sha256(refresh_token_raw.encode()).hexdigest()
    
    # Store in DB
    RefreshToken.objects.create(
        user=user,
        token_hash=refresh_token_hash,
        expires_at=timezone.now() + datetime.timedelta(days=7),
        ip_address=ip,
        user_agent=ua
    )
    
    # Select Serializer based on profile type
    if isinstance(profile, AdminProfile):
        profile_data = AdminProfileSerializer(profile).data
    else:
        profile_data = ProfileSerializer(profile).data

    return {
        'access_token': access_token,
        'refresh_token': refresh_token_raw,
        'user': UserSerializer(user).data,
        'profile': profile_data
    }

# --- Signup Flow ---

class SignupInitView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': _('Email is required')}, status=status.HTTP_400_BAD_REQUEST)

        # Rate Limit
        is_allowed, attempts_left, retry_after = check_rate_limit(email, 'signup_init', OTP_REQUEST_LIMIT, OTP_REQUEST_WINDOW)
        if not is_allowed:
             return Response({'error': f'Too many attempts. Try again in {retry_after // 60} mins.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Check Existing Account
        if User.objects.filter(email__iexact=email).exists():
            return Response({'error': _('User with this email already exists')}, status=status.HTTP_400_BAD_REQUEST)

        # Generate OTP
        otp = str(random.randint(100000, 999999))
        otp_hash = hashlib.sha256(otp.encode()).hexdigest()
        expires_at = timezone.now() + datetime.timedelta(minutes=5)

        # Create/Update PendingSignup
        PendingSignup.objects.update_or_create(
            email=email,
            defaults={
                'otp_hash': otp_hash,
                'otp_expires_at': expires_at,
                'attempts': 0
            }
        )
        
        # Send Email
        msg = f"Verify your email to continue signup.\n\nOTP: {otp}\n\nValid for 5 minutes."
        try:
            if settings.EMAIL_HOST_USER:
                send_mail('Verify Email', msg, settings.EMAIL_HOST_USER, [email])
            print(f"--> [DEBUG] SIGNUP OTP TO {email}: {otp}")
        except Exception as e:
            logger.error(f"Signup email failed: {e}")

        record_attempt(email, 'signup_init', OTP_REQUEST_WINDOW)
        
        return Response({
            'message': 'Verification code sent.',
            'dev_otp': otp
        })

class SignupVerifyView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        if not email or not otp:
             return Response({'error': 'Email and OTP required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pending = PendingSignup.objects.get(email=email)
        except PendingSignup.DoesNotExist:
            return Response({'error': 'No pending signup found'}, status=status.HTTP_400_BAD_REQUEST)

        if not pending.is_valid():
            return Response({'error': 'OTP Expired'}, status=status.HTTP_400_BAD_REQUEST)

        if not hmac.compare_digest(pending.otp_hash, hashlib.sha256(otp.encode()).hexdigest()):
             pending.attempts += 1
             pending.save()
             return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

        # Success - signed token
        pre_signup_token = jwt.encode({
            'email': email,
            'type': 'pre_signup',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
        }, settings.SECRET_KEY, algorithm='HS256')

        return Response({'pre_signup_token': pre_signup_token})

class SignupCompleteView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        token = request.data.get('pre_signup_token')
        password = request.data.get('password')
        full_name = request.data.get('full_name')
        email_plain = request.data.get('email')
        
        # Location fields
        country = request.data.get('country', 'US')
        state = request.data.get('state')
        city = request.data.get('city')
        pincode = request.data.get('pincode')
        street = request.data.get('street_address')

        if not token or not password or not email_plain or not state or not city or not pincode:
             return Response({'error': 'Missing requirements (state, city, pincode are mandatory)'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            if payload.get('type') != 'pre_signup' or payload.get('email') != email_plain:
                raise jwt.InvalidTokenError
        except:
            return Response({'error': 'Invalid or expired session'}, status=status.HTTP_401_UNAUTHORIZED)

        pending = PendingSignup.objects.filter(email=email_plain).first()
        if not pending:
             return Response({'error': 'Registration session invalid'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            username = email_plain.split('@')[0] + "_" + str(random.randint(100, 999))
            user = User.objects.create_user(
                email=email_plain,
                username=username,
                password=password
            )
            profile = CustomerProfile.objects.create(user=user, plain_email=email_plain)
            profile.full_name = full_name
            profile.is_verified = True
            profile.profile_completed = True
            
            # Set Location & Currency
            profile.country_code = 'IN' if country.lower() in ['india', 'in'] else 'Global'
            profile.preferred_currency = get_currency_for_country(country)
            profile.save()

            # Save Initial Address
            Address.objects.create(
                user=user,
                address_type='both',
                is_default=True,
                full_name=full_name,
                phone=request.data.get('phone') or profile.phone or "", # Prioritize direct phone input
                street_address=street or "",
                city=city or "",
                state=state or "",
                pincode=pincode or "",
                country=country or "US"
            )

            pending.delete()
            return Response(generate_tokens(user, profile, request), status=status.HTTP_201_CREATED)
        except Exception as e:
            if 'user' in locals(): user.delete()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- Login Flows ---

class EmailLoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        print(f"DEBUG: Login Request Data: {request.data}")
        identifier = str(request.data.get('email', '')).strip()
        # Edge case: Doubled strings sometimes seen in logs (e.g. email@gmail.comemail@gmail.com)
        if "@" in identifier and identifier.count("@") > 1:
            mid = len(identifier) // 2
            if identifier[:mid] == identifier[mid:]:
                identifier = identifier[:mid]
                
        password = request.data.get('password')

        is_allowed, attempts_left, retry_after = check_rate_limit(identifier, 'login', LOGIN_ATTEMPTS_LIMIT, LOGIN_ATTEMPTS_WINDOW)
        if not is_allowed:
            return Response({'error': f'Too many attempts. Try again in {retry_after // 60} mins.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        user_obj = User.objects.filter(email__iexact=identifier).first() or User.objects.filter(username__iexact=identifier).first()
        if not user_obj:
            record_attempt(identifier, 'login', LOGIN_ATTEMPTS_WINDOW)
            print(f"DEBUG: User not found for identifier: {identifier}")
            return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(email=user_obj.email, password=password)
        print(f"DEBUG: Authenticate result for {identifier} (using {user_obj.email}): {user}")
        if user:
            # Check for deleted account
            if user.is_deleted:
                return Response({
                    'status': 'needs_reactivation',
                    'message': 'This account was previously scheduled for deletion.',
                    'email': user.email
                }, status=status.HTTP_202_ACCEPTED)

            # portal = 'website' | 'admin'
            portal = request.data.get('portal', 'website')
            print(f"DEBUG: Portal: {portal}, User is_staff: {user.is_staff}")
            
            # Strict Separation Logic
            if portal == 'admin' and not user.is_staff:
                print(f"DEBUG: Denied admin portal for non-staff {identifier}")
                return Response({'error': 'Unauthorized: Admin portal requires staff privileges.'}, status=status.HTTP_403_FORBIDDEN)
            if portal == 'website' and user.is_staff:
                print(f"DEBUG: Denied website portal for staff {identifier}")
                return Response({'error': 'Unauthorized: Admin account detected. Please use the admin portal.'}, status=status.HTTP_403_FORBIDDEN)

            reset_rate_limit(identifier, 'login')
            profile = getattr(user, 'admin_profile', None) if user.is_staff else getattr(user, 'customer_profile', None)
            
            if not profile:
                 if user.is_staff:
                     profile = AdminProfile.objects.create(user=user, plain_email=user.email)
                 else:
                     profile = CustomerProfile.objects.create(user=user, plain_email=user.email)
            
            profile.last_signin_at = timezone.now()
            profile.save()
            return Response(generate_tokens(user, profile, request))
        else:
            record_attempt(identifier, 'login', LOGIN_ATTEMPTS_WINDOW)
            return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        token = request.data.get('token')
        action = request.data.get('action', 'signin')

        # Mock check
        if token and token.startswith('mock_'):
            email = "testuser@gmail.com"
            name = "Test User"
            google_id = "123456789"
            picture = ""
        else:
            try:
                # Verify the ID token using Google's official library
                idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), settings.GOOGLE_CLIENT_ID)
                
                # Check issuer
                if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                    return Response({'error': 'Wrong issuer'}, status=status.HTTP_400_BAD_REQUEST)

                email = idinfo.get('email')
                name = idinfo.get('name')
                google_id = idinfo.get('sub')
                picture = idinfo.get('picture')
            except Exception as e:
                logger.error(f"Google Token Verification Failed: {e}")
                return Response({'error': 'Invalid Google ID Token'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if action == 'signup' and user: action = 'signin'

        # Portal logic
        portal = request.data.get('portal', 'website')

        if action == 'signin':
            if not user:
                return Response({'error': 'Account does not exist'}, status=status.HTTP_404_NOT_FOUND)
            
            # Strict Separation Logic
            if portal == 'admin' and not user.is_staff:
                return Response({'error': 'Unauthorized: Access denied for customers.'}, status=status.HTTP_403_FORBIDDEN)
            if portal == 'website' and user.is_staff:
                return Response({'error': 'Unauthorized: Please use the admin portal.'}, status=status.HTTP_403_FORBIDDEN)

            profile = user.profile
            if not profile: 
                if user.is_staff:
                    profile = AdminProfile.objects.create(user=user, plain_email=email)
                else:
                    profile = CustomerProfile.objects.create(user=user, plain_email=email)
            
            profile.google_id = google_id
            profile.full_name = name
            profile.avatar_url = picture
            profile.is_verified = True
            
            profile.last_signin_at = timezone.now()
            profile.save()

            if not profile.profile_completed:
                now_aware = timezone.now()
                pre_auth_token = jwt.encode({
                    'user_id': str(user.id),
                    'type': 'pre_auth',
                    'iss': 'videeptha-auth',
                    'aud': 'videeptha-app',
                    'exp': now_aware + datetime.timedelta(minutes=10),
                    'iat': now_aware,
                    'jti': str(uuid.uuid4())
                }, settings.SECRET_KEY, algorithm='HS256')
                return Response({
                    'status': 'needs_completion',
                    'pre_auth_token': pre_auth_token,
                    'full_name': name,
                    'email': email,
                    'avatar_url': picture,
                }, status=status.HTTP_202_ACCEPTED)

            if user.is_deleted:
                return Response({
                    'status': 'needs_reactivation',
                    'message': 'This account was previously scheduled for deletion.',
                    'email': user.email
                }, status=status.HTTP_202_ACCEPTED)

            return Response(generate_tokens(user, profile, request))

        elif action == 'signup':
            try:
                username = email.split('@')[0] + "_g"
                user = User.objects.create_user(email=email, username=username)
                user.set_unusable_password()
                user.save()
                
                profile = CustomerProfile.objects.create(
                    user=user, plain_email=email, google_id=google_id, 
                    full_name=name, avatar_url=picture, is_verified=True
                )
                
                pre_auth_token = jwt.encode({
                    'user_id': str(user.id),
                    'type': 'pre_auth',
                    'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
                }, settings.SECRET_KEY, algorithm='HS256')
                
                return Response({
                    'status': 'needs_completion',
                    'pre_auth_token': pre_auth_token,
                    'full_name': name,
                    'email': email,
                    'avatar_url': picture,
                }, status=status.HTTP_202_ACCEPTED)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CompleteProfileView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        token = request.data.get('pre_auth_token')
        phone = request.data.get('phone')
        full_name = request.data.get('full_name')
        
        # Location fields
        country = request.data.get('country', 'US')
        state = request.data.get('state')
        city = request.data.get('city')
        pincode = request.data.get('pincode')
        street = request.data.get('street_address')

        try:
            payload = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=['HS256'],
                options={"verify_aud": False, "verify_iss": False}
            )
            if payload.get('type') != 'pre_auth': raise jwt.InvalidTokenError
            user = User.objects.get(id=payload['user_id'])
            if hasattr(user, 'customer_profile'):
                profile = user.customer_profile
            elif hasattr(user, 'admin_profile'):
                profile = user.admin_profile
            else:
                raise Exception(f"No profile found for user {user.email}")
                
            profile.phone = phone
            profile.full_name = full_name
            profile.profile_completed = True
            
            # Set Location & Currency
            profile.country_code = 'IN' if country.lower() in ['india', 'in'] else 'Global'
            profile.preferred_currency = get_currency_for_country(country)
            profile.save()

            # Save Initial Address (Update if exists or create new)
            Address.objects.update_or_create(
                user=user,
                is_default=True,
                defaults={
                    'address_type': 'both',
                    'full_name': full_name,
                    'phone': phone or "",
                    'street_address': street or "",
                    'city': city or "",
                    'state': state or "",
                    'pincode': pincode or "",
                    'country': country or "US"
                }
            )
            return Response(generate_tokens(user, profile, request))
        except Exception as e:
            import traceback
            logger.error(f"CompleteProfileView Exception: {str(e)}\n{traceback.format_exc()}")
            return Response({'error': 'Invalid session'}, status=status.HTTP_401_UNAUTHORIZED)

# --- Token Management ---

class TokenRefreshView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        refresh_token = request.data.get('refresh_token')
        if not refresh_token: return Response({'error': 'Required'}, status=400)
        
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        try:
            token_obj = RefreshToken.objects.get(token_hash=token_hash)
            if not token_obj.is_valid():
                 return Response({'error': 'Invalid'}, status=401)
            
            user = token_obj.user
            profile = user.profile
            token_obj.revoked = timezone.now()
            token_obj.save()
            
            new_tokens = generate_tokens(user, profile, request)
            new_hash = hashlib.sha256(new_tokens['refresh_token'].encode()).hexdigest()
            new_token_obj = RefreshToken.objects.get(token_hash=new_hash)
            token_obj.replaced_by = new_token_obj
            token_obj.save()
            
            return Response(new_tokens)
        except:
            return Response({'error': 'Invalid'}, status=401)

class CartSyncView(APIView):
    """
    Synchronize the frontend cart data with the backend CustomerProfile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        if profile and hasattr(profile, 'cart_data'):
            return Response(profile.cart_data)
        return Response([])

    def post(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or not hasattr(profile, 'cart_data'):
            return Response({"error": "Profile not found or incompatible"}, status=400)
        
        # Allow both 'cart' and 'items' keys for compatibility
        cart_data = request.data.get('cart') or request.data.get('items') or []
        profile.cart_data = cart_data
        profile.save()
        return Response({"status": "synced", "count": len(cart_data)})

class LogoutView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        refresh_token = request.data.get('refresh_token')
        if not refresh_token: return Response({'error': 'Required'}, status=400)
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        RefreshToken.objects.filter(token_hash=token_hash).update(revoked=timezone.now())
        return Response({'message': 'OK'})

# --- Admin Management (RBAC) ---

class AdminListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        if not (request.user.is_staff or (profile and profile.user_type in ['super_admin', 'assistant_admin', 'product_manager'])):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        admins = User.objects.filter(is_staff=True)
        data = []
        for admin in admins:
            p = getattr(admin, 'profile', None)
            data.append({
                'id': str(admin.id),
                'username': admin.username,
                'email': admin.email,
                'full_name': p.full_name if p else None,
                'user_type': p.user_type if p else 'unknown',
                'is_active': admin.is_active,
                'is_superuser': admin.is_superuser
            })
        return Response(data)

class AdminCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        is_super = request.user.is_superuser or (getattr(request.user, 'profile', None) and request.user.profile.user_type == 'super_admin')
        if not is_super:
            return Response({'error': 'Super Admin privileges required.'}, status=status.HTTP_403_FORBIDDEN)
        
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        full_name = request.data.get('full_name')
        user_type = request.data.get('user_type', 'assistant_admin')

        if User.objects.filter(username=username).exists() or User.objects.filter(email=email).exists():
            return Response({'error': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            new_admin = User.objects.create_user(username=username, email=email, password=password)
            new_admin.is_staff = True
            if user_type == 'super_admin': new_admin.is_superuser = True
            new_admin.save()
            
            profile = AdminProfile.objects.create(user=new_admin, user_type=user_type, plain_email=email, is_verified=True, profile_completed=True)
            profile.full_name = full_name
            profile.save()
            return Response({'message': 'Admin created successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdminUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request, pk):
        is_super = request.user.is_superuser or (getattr(request.user, 'profile', None) and request.user.profile.user_type == 'super_admin')
        if not is_super: return Response({'error': 'Unauthorized'}, status=403)
        try:
            target_user = User.objects.get(pk=pk)
            target_profile = target_user.profile
            user_type = request.data.get('user_type')
            full_name = request.data.get('full_name')
            if user_type:
                target_profile.user_type = user_type
                target_user.is_superuser = (user_type == 'super_admin')
                target_user.save()
            if full_name: target_profile.full_name = full_name
            target_profile.save()
            return Response({'message': 'Updated'})
        except Exception as e: return Response({'error': str(e)}, status=400)

class AdminDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, pk):
        is_super = request.user.is_superuser or (getattr(request.user, 'profile', None) and request.user.profile.user_type == 'super_admin')
        if not is_super: return Response({'error': 'Unauthorized'}, status=403)
        if str(request.user.pk) == str(pk): return Response({'error': 'Cannot delete self'}, status=400)
        User.objects.filter(pk=pk).delete()
        return Response({'message': 'Deleted'})

# --- User Management (Soft Delete) ---

class UserDeleteView(APIView):
    """
    Soft delete user account: anonymize data, deactive account, 
    but preserve financial records (orders).
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        return self._do_delete(request)

    def post(self, request):
        return self._do_delete(request)

    def _do_delete(self, request):
        user = request.user
        user_id_str = str(user.id)
        reason = request.data.get('reason', 'No reason provided')
        
        # 1. Soft Delete - Deactivate and mark as deleted, but preserve data for grace period
        user.is_active = False
        user.is_deleted = True
        user.deleted_at = timezone.now()
        user.save()
        
        # 2. Cleanup sessions
        RefreshToken.objects.filter(user=user).update(revoked=timezone.now())
        
        logger.info(f"User {user_id_str} scheduled their account for deletion. Reason: {reason}. Tokens revoked.")
        return Response({'message': 'Your account has been scheduled for deletion and deactivated.'})

class ReactivateAccountView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        action = request.data.get('action') # 'restore' or 'wipe'
        
        user = User.objects.filter(email__iexact=email, is_deleted=True).first()
        if not user:
             return Response({'error': 'Account not found or not in deletion state'}, status=status.HTTP_404_NOT_FOUND)
        
        if action == 'restore':
            user.is_active = True
            user.is_deleted = False
            user.deleted_at = None
            user.save()
            
            profile = user.profile
            return Response(generate_tokens(user, profile, request))
            
        elif action == 'wipe':
            user_id_str = str(user.id)
            # Permanent Anonymization
            user.email = f"deleted_{user_id_str}@deleted.local"
            user.username = f"deleted_{user_id_str}"
            user.is_active = False # Keep inactive if wiping? Usually we start a new account.
            # Actually if they want to "start fresh", they should probably just be told to sign up again.
            # But the user said "clear all and start new".
            # So I'll anonymize the OLD one and then tell the frontend to proceed with signup?
            # Or just create a new user object for them?
            # Let's keep it simple: Wipe the current one's details and reactivate it as "fresh".
            
            profile = user.profile
            if profile:
                profile.full_name = "New User"
                if hasattr(profile, 'phone'): profile.phone = None
                if hasattr(profile, 'avatar_url'): profile.avatar_url = None
                if hasattr(profile, 'cart_data'): profile.cart_data = []
                profile.save()
            
            Address.objects.filter(user=user).delete()
            Favorite.objects.filter(user=user).delete()
            
            user.is_active = True
            user.is_deleted = False
            user.deleted_at = None
            user.save()
            
            return Response(generate_tokens(user, profile, request))
            
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

# --- Miscellanous ---

class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def _get_profile(self, user):
        if hasattr(user, 'customer_profile'): return user.customer_profile
        if hasattr(user, 'admin_profile'): return user.admin_profile
        return getattr(user, 'profile', None)

    def get(self, request):
        try:
            profile = self._get_profile(request.user)
            return Response({
                'user': UserSerializer(request.user).data,
                'profile': ProfileSerializer(profile).data if profile else None
            })
        except Exception as e:
            import traceback
            logger.error(f"UserDetailView GET Exception for {request.user.email}: {str(e)}\n{traceback.format_exc()}")
            return Response({'error': 'Internal server error while fetching profile'}, status=500)

    def patch(self, request):
        profile = self._get_profile(request.user)
        if not profile:
            return Response({'error': 'Profile not found'}, status=404)
        
        # Handle both nested 'profile' and flat data
        data = request.data.get('profile', request.data) if isinstance(request.data.get('profile'), dict) else request.data
        
        serializer = ProfileSerializer(profile, data=data, partial=True)
        if serializer.is_valid():
            # Explicitly handle fields that have setters on the model
            for attr in ['full_name', 'phone', 'avatar_url']:
                if attr in data:
                    setattr(profile, attr, data[attr])
            
            profile.save()

            # Sync phone to default address if updated
            if 'phone' in data:
                Address.objects.filter(user=request.user, is_default=True).update(enc_phone=profile._phone)
            
            return Response({
                'user': UserSerializer(request.user).data,
                'profile': ProfileSerializer(profile).data
            })
        return Response(serializer.errors, status=400)

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        user = User.objects.filter(email=email).first() or User.objects.filter(username=email).first()
        if user:
            otp = str(random.randint(100000, 999999))
            set_otp(user, otp, 'reset')
            try:
                if settings.EMAIL_HOST_USER:
                    send_mail('Reset Password', f"Code: {otp}", settings.EMAIL_HOST_USER, [email])
                logger.info(f"Reset OTP sent to {email}")
                print(f"--> [DEBUG] RESET OTP: {otp}")
            except Exception as e:
                logger.error(f"Failed to send reset email to {email}: {e}")
        else:
            logger.warning(f"Password reset requested for non-existent email: {email}")
        return Response({'message': 'If account exists, code sent.'})

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        password = request.data.get('new_password')
        user = User.objects.filter(email__iexact=email).first() or User.objects.filter(username__iexact=email).first()
        if user:
            valid, msg = verify_otp(user, otp)
            if valid:
                user.set_password(password)
                user.save()
                clean_otp_for_user(user)
                logger.info(f"Password reset successful for {email}")
                return Response({'message': 'Success'})
            else:
                logger.warning(f"OTP verification failed for {email}: {msg} (Input: {otp})")
                return Response({'error': msg or 'Invalid'}, status=400)
        else:
            logger.warning(f"Password reset confirm attempted for non-existent email: {email}")
        return Response({'error': 'Invalid'}, status=400)

# --- Password Change (Authenticated) ---

class ChangePasswordVerifyView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user
        mode = request.data.get('mode') # 'password', 'otp_request', 'otp_verify'
        
        if mode == 'password':
            old_password = request.data.get('old_password')
            if not old_password:
                return Response({'error': 'Current password required'}, status=status.HTTP_400_BAD_REQUEST)
            if user.check_password(old_password):
                token = jwt.encode({
                    'user_id': str(user.id),
                    'type': 'password_change_verified',
                    'exp': timezone.now() + datetime.timedelta(minutes=10)
                }, settings.SECRET_KEY, algorithm='HS256')
                return Response({'verification_token': token})
            return Response({'error': 'Invalid current password'}, status=status.HTTP_400_BAD_REQUEST)
            
        elif mode == 'otp_request':
            otp = str(random.randint(100000, 999999))
            set_otp(user, otp, 'password_change')
            try:
                if settings.EMAIL_HOST_USER:
                    send_mail('Security Verification', f"Your password change code is: {otp}", settings.EMAIL_HOST_USER, [user.email])
                print(f"--> [DEBUG] CHANGE PWD OTP: {otp}")
                return Response({'message': 'Verification code sent to your email.'})
            except Exception as e:
                logger.error(f"Failed to send change password otp: {e}")
                return Response({'error': 'Failed to send email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        elif mode == 'otp_verify':
            otp = request.data.get('otp')
            valid, msg = verify_otp(user, otp)
            if valid:
                token = jwt.encode({
                    'user_id': str(user.id),
                    'type': 'password_change_verified',
                    'exp': timezone.now() + datetime.timedelta(minutes=10)
                }, settings.SECRET_KEY, algorithm='HS256')
                return Response({'verification_token': token})
            return Response({'error': msg or 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({'error': 'Invalid mode'}, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordFinalizeView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        token = request.data.get('verification_token')
        new_password = request.data.get('new_password')
        
        if not token or not new_password:
            return Response({'error': 'Missing verification token or new password'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            if payload.get('type') != 'password_change_verified' or payload.get('user_id') != str(request.user.id):
                return Response({'error': 'Invalid or expired verification session'}, status=status.HTTP_401_UNAUTHORIZED)
            
            user = request.user
            user.set_password(new_password)
            user.save()
            
            # Logout other sessions by revoking tokens
            RefreshToken.objects.filter(user=user).update(revoked=timezone.now())
            
            logger.info(f"User {user.email} changed their password successfully.")
            return Response({'message': 'Password updated successfully. All other sessions have been logged out.'})
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Verification session expired. Please verify your identity again.'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': 'Invalid verification session'}, status=status.HTTP_401_UNAUTHORIZED)

# ── Account Unlock Flow ─────────────────────────────────────────────────────

class UnlockRequestView(APIView):
    """Send unlock OTP to the locked account's email."""
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            logger.warning(f"Unlock requested for non-existent email: {email}")
            return Response({'message': 'If account exists, unlock code sent.'})

        otp = str(random.randint(100000, 999999))
        set_otp(user, otp, 'unlock')
        try:
            if settings.EMAIL_HOST_USER:
                send_mail(
                    'Videeptha Foods — Unlock Your Account',
                    f'Your account unlock code is: {otp}\nThis code expires in 5 minutes.',
                    settings.EMAIL_HOST_USER,
                    [email]
                )
            print(f"--> [DEBUG] UNLOCK OTP: {otp}")
        except Exception as e:
            logger.error("Failed to send unlock email: %s", e)

        return Response({'message': 'Unlock code sent to your email.'})


class UnlockConfirmView(APIView):
    """Verify unlock OTP and clear the rate-limit lockout."""
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({'error': 'Account not found'}, status=status.HTTP_404_NOT_FOUND)

        valid, msg = verify_otp(user, otp)
        if not valid:
            return Response({'error': msg or 'Invalid or expired unlock code'}, status=status.HTTP_400_BAD_REQUEST)

        # Clear login rate limit so user can sign in again
        reset_rate_limit(email, 'login')
        clean_otp_for_user(user)

        return Response({'message': 'Account unlocked! You can now sign in.'})

class CartSyncView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        items = request.data.get('items', [])
        profile.cart_data = items
        profile.save()
        return Response({"status": "success", "cart_data": profile.cart_data})

class AddressListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        addresses = Address.objects.filter(user=request.user)
        return Response(AddressSerializer(addresses, many=True).data)

    def post(self, request):
        serializer = AddressSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AddressDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def get_object(self, pk, user):
        try:
            return Address.objects.get(pk=pk, user=user)
        except Address.DoesNotExist:
            return None

    def get(self, request, pk):
        addr = self.get_object(pk, request.user)
        if not addr: return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(AddressSerializer(addr).data)

    def put(self, request, pk):
        addr = self.get_object(pk, request.user)
        if not addr: return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = AddressSerializer(addr, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        addr = self.get_object(pk, request.user)
        if not addr: return Response(status=status.HTTP_404_NOT_FOUND)
        addr.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ReactivateAccountView(APIView):
    """Restore a soft-deleted account."""
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        mode = request.data.get('mode', 'restore') # 'restore' or 'fresh'

        user = User.objects.filter(email__iexact=email, is_deleted=True).first()
        if not user:
            return Response({'error': 'No deleted account found for this email'}, status=status.HTTP_404_NOT_FOUND)

        valid, msg = verify_otp(user, otp)
        if not valid:
            return Response({'error': msg or 'Invalid or expired code'}, status=status.HTTP_400_BAD_REQUEST)

        if mode == 'restore':
            user.is_active = True
            user.is_deleted = False
            user.save()
            clean_otp_for_user(user)
            return Response({'message': 'Account restored successfully! You can now log in.'})
        else:
            # Start fresh - permanently delete old and allow new signup
            user.delete() 
            return Response({'message': 'Old account cleared. You can now create a new account.'})
