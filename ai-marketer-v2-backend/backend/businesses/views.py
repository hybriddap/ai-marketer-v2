# backend/businesses/views.py
import base64
import json
import logging
import uuid
import time
import hmac
import hashlib
from collections import defaultdict

from django.conf import settings
from django.contrib.auth import get_user_model
from django.shortcuts import redirect
from rest_framework import status, viewsets
from rest_framework.decorators import (
    action,
    api_view,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Business
from .serializers import BusinessSerializer
from posts.models import Post
from sales.models import SalesDataPoint
from social.models import SocialMedia

from utils.discord_api import upload_image_file_to_discord
from utils.square_api import (
    exchange_code_for_token,
    fetch_and_save_square_sales_data,
    get_auth_url_values,
    get_square_client,
    get_square_locations,
    process_square_item,
)

User = get_user_model()
logger = logging.getLogger(__name__)

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        business = Business.objects.filter(owner=request.user).first()

        if not business:
            # Return consistent structure with null/empty values
            return Response({
                "business": None,
                "linked_platforms": [],
                "posts_summary": None
            })

        linked_platforms = []
        platforms = SocialMedia.objects.filter(business=business)

        for platform in platforms:
            published_count = Post.objects.filter(
                business=business,
                platform=platform,
                status="Published"
            ).count()

            linked_platforms.append({
                "key": platform.platform,
                "label": platform.get_platform_display(),
                "link": platform.link,
                "username": platform.username,
                "num_published": published_count,
            })

        posts = Post.objects.filter(business=business)

        posts_summary = {
            "num_scheduled": posts.filter(status="Scheduled").count(),
            "num_published": posts.filter(status="Published").count(),
            "num_failed": posts.filter(status="Failed").count(),
        }

        published_posts = posts.filter(status="Published").order_by("-posted_at")
        
        platforms_by_datetime = defaultdict(list)
        for post in published_posts:
            date_str = post.posted_at.strftime("%Y-%m-%dT%H:%M:%SZ")
            platforms_by_datetime[date_str].append(post.platform.platform)
        
        last_post_date = published_posts.first().posted_at.isoformat() if published_posts.exists() else None

        business_serializer = BusinessSerializer(business, context={'request': request})

        response_data = {
            "business": business_serializer.data,
            "linked_platforms": linked_platforms,
            "posts_summary": posts_summary,
            "post_activity": {
                "platforms_by_datetime": platforms_by_datetime,
                "last_post_date": last_post_date,
            }
        }

        return Response(response_data)


class BusinessDetailView(APIView):
    """
    API view for retrieving and updating business details.
    GET: Retrieve the authenticated user's business.
    PUT/PATCH: Update the business details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve business details for the authenticated user."""
        business = Business.objects.filter(owner=request.user).first()

        if not business:
            # Return structured empty response
            return Response({
                "name": None,
                "logo": None,
                "category": None,
                "target_customers": None,
                "vibe": None
            }, status=status.HTTP_200_OK)

        serializer = BusinessSerializer(business, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        """Update business details fully or create if doesn't exist."""
        return self._update_business(request)

    def patch(self, request):
        """Update business details partially."""
        return self._update_business(request, partial=True)

    def _update_business(self, request, partial=False):
        """Helper method for update operations."""
        business = Business.objects.filter(owner=request.user).first()

        # Handle file upload
        if 'logo' in request.FILES:        
            if settings.TEMP_MEDIA_DISCORD_WEBHOOK:
                logo = upload_image_file_to_discord(request.FILES['logo'])['image_url']
                if not logo:
                    return Response({"error": "Failed to upload logo"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                logo = request.FILES['logo']

            # Logo-only update or creation
            if not business:
                business = Business(owner=request.user)
                business.logo = logo
                business.save()
                serializer = BusinessSerializer(business, context={'request': request})
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                business.logo = logo
                business.save(update_fields=['logo'])
                return Response({"message": "Logo updated successfully"}, status=status.HTTP_200_OK)

        if request.data.get('logo_removed') == 'true' and business:
            if business.logo and not settings.TEMP_MEDIA_DISCORD_WEBHOOK:
                    business.logo.delete(save=False)

            business.logo = None
            business.save(update_fields=['logo'])
            return Response({"message": "Logo removed successfully"}, status=status.HTTP_200_OK)

        # Regular field update or creation
        if not business:
            serializer = BusinessSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                business = serializer.save(owner=request.user)            
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            serializer = BusinessSerializer(business, data=request.data, partial=partial, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

@api_view(['GET'])
@permission_classes([AllowAny])
def square_oauth_callback(request):
    """Create Square integration for the authenticated user's business."""
    logger.info("=== Square OAuth Callback (Sessionless) ===")

    received_state = request.query_params.get('state')
    if not received_state:
        logger.error("No state parameter received")
        return redirect(f"{settings.FRONTEND_BASE_URL}/settings/square?error=missing_state")
    
    try:
        padded_state = received_state + '=' * (4 - len(received_state) % 4)
        decoded_state = json.loads(base64.urlsafe_b64decode(padded_state).decode())

        logger.info(f"Decoded state keys: {list(decoded_state.keys())}")
    
    except Exception as e:
        logger.error(f"State decoding error: {e}")
        return redirect(f"{settings.FRONTEND_BASE_URL}/settings/square?error=invalid_state")
    
    is_valid, error_message = verify_secure_state(decoded_state)
    
    if not is_valid:
        logger.error(f"State verification failed: {error_message}")
        return redirect(f"{settings.FRONTEND_BASE_URL}/settings/square?error=state_invalid")
    
    logger.info("✅ State verification passed")
    
    user_id = decoded_state.get('user_id')
    
    error = request.query_params.get('error')
    if error:
        error_description = request.query_params.get('error_description')
        logger.error(f"OAuth error: {error} - {error_description}")

        if error == 'access_denied' and error_description == 'user_denied':
            return redirect(f"{settings.FRONTEND_BASE_URL}/settings/square?error=user_denied")
        else:
            return redirect(f"{settings.FRONTEND_BASE_URL}/settings/square?error={error}&error_description={error_description}")
        
    # Get the authorization code
    code = request.query_params.get('code')
    if not code:
        logger.error("No authorization code received")
        return redirect(f"{settings.FRONTEND_BASE_URL}/settings/square?error=missing_code")

    try:
        user = User.objects.get(id=user_id)
        business = Business.objects.filter(owner=user).first()
        
        if not business:
            logger.error(f"Business not found for user {user_id}")
            return redirect(f"{settings.FRONTEND_BASE_URL}/settings/square?error=business_not_found")
        
        logger.info(f"Found user: {user.email}, business: {business.name}")

    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return redirect(f"{settings.FRONTEND_BASE_URL}/settings/square?error=user_not_found")
    
    # Exchange code for access token
    logger.info("Exchanging code for access token")
    token_response = exchange_code_for_token(code)
    
    if 'access_token' not in token_response:
        logger.error(f"Token exchange failed: {token_response}")
        return redirect(f"{settings.FRONTEND_BASE_URL}/settings/square?error=token_error")

    # Save the access token to the business
    business.square_access_token = token_response['access_token']
    business.save()

    logger.info(f"✅ Access token saved for business: {business.name}")

    # After saving access token, fetch and save the sales data
    try:
        fetch_and_save_square_sales_data(business)
        logger.info("✅ Sales data fetched successfully")
    except Exception as e:
        logger.error(f"⚠️ Error fetching Square sales data: {e}")

    logger.info("🎉 Square OAuth callback completed successfully")
    return redirect(f"{settings.FRONTEND_BASE_URL}/settings/square?success=true")

class SquareViewSet(viewsets.ViewSet):
    """
    ViewSet for managing Square integration.
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Check if Square integration is connected for the authenticated user's business."""
        business = Business.objects.filter(owner=request.user).first()
        if not business:
            logger.warning("⚠️ User %s attempted to access posts without a business", request.user.email)
            return Response({"error": "Business not found"}, status=status.HTTP_404_NOT_FOUND)

        client = get_square_client(business)
        if not client:
            return Response({"square_connected": False, "business_name": None})
        
        locations = get_square_locations(client)
        if not locations:
            return Response({"square_connected": True, "business_name": None})
        
        return Response({
            "square_connected": True,
            "business_name": locations[0].get("name")
        })

    @action(detail=False, methods=['post'])
    def connect(self, request):
        """Connect Square integration for the authenticated user's business."""
        auth_url_values = get_auth_url_values()

        secure_state = generate_secure_state(request.user.id)
        
        encoded_state = base64.urlsafe_b64encode(json.dumps(secure_state).encode()).decode().rstrip("=")

        logger.info(f"Generated secure state for user {request.user.id}")

        auth_url = (
            f"{settings.SQUARE_BASE_URL}/oauth2/authorize"
            f"?client_id={auth_url_values['app_id']}"
            f"&scope=MERCHANT_PROFILE_READ+ITEMS_READ+ITEMS_WRITE+ORDERS_READ"
            f"&session=false&state={encoded_state}"
            f"&redirect_uri={auth_url_values['redirect_uri']}"
        )
        
        return Response({"link": auth_url}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def disconnect(self, request):
        """Disconnect Square integration for the authenticated user's business."""
        business = Business.objects.filter(owner=request.user).first()
        if not business:
            return Response({"error": "Business not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Remove the access token and disconnect the business
        business.square_access_token = None
        business.last_square_sync_at = None
        business.save()

        # Delete Square-originated sales data points
        SalesDataPoint.objects.filter(business=business, source="square").delete()
        
        return Response({"message": "Square integration deleted successfully"}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], url_path='items')
    def list_items(self, request):
        """Retrieve items from Square for the authenticated user's business."""
        business = Business.objects.filter(owner=request.user).first()
        if not business:
            return Response({"error": "Business not found"}, status=status.HTTP_404_NOT_FOUND)

        client = get_square_client(business)
        if not client:
            return Response({
                "square_connected": False,
                "items": [],
                "categories": []
            }, status=status.HTTP_200_OK)

        try:
            # Get catalog items
            catalog_api = client.catalog
            
            # Get categories
            categories_response = catalog_api.list_catalog(
                cursor=None,
                types=["CATEGORY"]
            )
            
            categories = []
            if categories_response.is_success():
                for obj in categories_response.body.get("objects", []):
                    if obj.get("type") == "CATEGORY" and "category_data" in obj:
                        categories.append({
                            "id": obj["id"],
                            "name": obj["category_data"]["name"]
                        })
            
            # Get items
            items_response = catalog_api.list_catalog(
                cursor=None,
                types=["ITEM"]
            )

            items = []
            if items_response.is_success():
                for obj in items_response.body.get("objects", []):
                    item = process_square_item(obj, output_format="detail")
                    if item:
                        items.append(item)
            
            return Response({
                "square_connected": True,
                "items": items,
                "categories": categories
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Square items fetch error: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['patch'], url_path='items/(?P<item_id>[^/.]+)')
    def update_item(self, request, item_id=None):
        """Update a menu item in Square."""
        business = Business.objects.filter(owner=request.user).first()
        if not business:
            return Response({"error": "Business not found"}, status=status.HTTP_404_NOT_FOUND)
        
        client = get_square_client(business)
        if not client:
            return Response({"error": "Square not connected"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            catalog_api = client.catalog

            # Get the item details
            item_response = catalog_api.retrieve_catalog_object(
                object_id=item_id, 
                include_related_objects=True
            )
            
            if not item_response.is_success():
                logger.error(f"Failed to retrieve item: {item_response.errors}")
                return Response({"error": "Failed to retrieve item details"}, status=status.HTTP_400_BAD_REQUEST)

            current_item = item_response.body["object"]
            latest_version = current_item["version"]
            current_item_data = current_item.get("item_data", {})
            
            # Get variation versions
            variation_versions = {
                variation["id"]: variation["version"]
                for variation in current_item_data.get("variations", [])
                if "id" in variation and "version" in variation
            }
            
            raw_variations = request.data.get("variations", [])
            formatted_variations = [
                {
                    "type": "ITEM_VARIATION",
                    "id": v["id"],
                    "version": variation_versions.get(v["id"]),
                    "item_variation_data": {
                        "item_id": item_id,
                        "name": v["name"],
                        "pricing_type": "FIXED_PRICING",
                        "price_money": v["price_money"],
                        **{k:v for k,v in current_item_data.get("variations", [])[0].get("item_variation_data", {}).items() 
                        if k not in ["name", "pricing_type", "price_money"]}
                    }
                }
                for v in raw_variations
            ]

            # Prepare the updated item
            updated_item = {
                "idempotency_key": str(uuid.uuid4()),
                "object": {
                    "type": "ITEM",
                    "id": item_id,
                    "version": latest_version,
                    "item_data": {
                        **current_item_data,
                        "name": request.data.get("name", current_item_data.get("name")),
                        "description": request.data.get("description", current_item_data.get("description", "")),
                        "variations": formatted_variations,
                    }
                }
            }
            logger.debug(f"Update request: {updated_item}")
            
            update_response = catalog_api.upsert_catalog_object(body=updated_item)
            if update_response.is_success():
                logger.info(f"Item {item_id} updated successfully")
                return Response({
                    "message": f"Item {item_id} updated successfully.",
                    "item": update_response.body
                }, status=status.HTTP_200_OK)
            else:
                logger.error(f"Failed to update item {item_id}: {update_response.errors}")
                return Response({
                    "error": "Update failed", 
                    "details": update_response.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(f"Square item update error: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def generate_secure_state(user_id):
    timestamp = str(int(time.time()))
    message = f"{user_id}:{timestamp}"
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    return {
        'user_id': user_id,
        'timestamp': timestamp,
        'signature': signature
    }


def verify_secure_state(state_data, max_age_seconds=300):
    try:
        user_id = state_data.get('user_id')
        timestamp = state_data.get('timestamp')
        received_signature = state_data.get('signature')
        
        if not all([user_id, timestamp, received_signature]):
            logger.error("Missing required fields in state")
            return False, "Invalid state structure"
        
        current_time = int(time.time())
        state_time = int(timestamp)
        
        if current_time - state_time > max_age_seconds:
            logger.error(f"State expired: {current_time - state_time} seconds old")
            return False, "State expired"
        
        message = f"{user_id}:{timestamp}"
        expected_signature = hmac.new(
            settings.SECRET_KEY.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(received_signature, expected_signature):
            logger.error("HMAC signature verification failed")
            return False, "Invalid signature"
        
        return True, "Valid"
        
    except Exception as e:
        logger.error(f"State verification error: {e}")
        return False, "Verification error"