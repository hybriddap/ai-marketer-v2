import logging

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
import requests

from posts.models import Post
from social.models import SocialMedia

TWOFA_ENCRYPTION_KEY = settings.TWOFA_ENCRYPTION_KEY

User = get_user_model()
logger = logging.getLogger(__name__)

def get_user_access_token(user_id):
    try:
        user = User.objects.get(id=user_id)
        if not user.access_token:
            logger.error(f"User {user_id} does not have an access token.")
            return None
        
        f = Fernet(TWOFA_ENCRYPTION_KEY) 
        token=user.access_token[1:]

        try:
            token_decrypted=f.decrypt(token)
            token_decoded=token_decrypted.decode()
            return token_decoded
        except (InvalidToken, Exception) as e:
            logger.error(f"Error decrypting token for user {user_id}: {str(e)}")
            return None
    except User.DoesNotExist:
        logger.error(f"User with id {user_id} does not exist.")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in get_user_access_token for user {user_id}: {str(e)}")
        return None

def get_facebook_data(access_token):
    url = f'https://graph.facebook.com/v22.0/me/accounts?access_token={access_token}'

    response = requests.get(url)
    if response.status_code != 200:
        return None

    metasData = response.json()
    if not metasData.get("data"):
        return None

    return metasData.get("data")[0]

def get_facebook_page_id(access_token):
    return get_facebook_data(access_token)["id"]
    
def sync_posts_from_meta(user_id, business, platform):
    get_posts = _get_meta_posts(user_id, platform)
    
    if get_posts.get("status") == False:
        logger.error(f"Error fetching posts: {get_posts.get('error')}")
        return get_posts
    
    posts_data = get_posts.get("message")
    if not posts_data:
        logger.warning(f"No posts data returned for {platform}")
        return Post.objects.none()

    for post_data in posts_data:
        link=post_data.get("permalink") if platform=='instagram' else post_data.get("permalink_url")
        if Post.objects.filter(
            business=business,
            platform__platform=platform,
            link=link
        ).exists():
            found_post=Post.objects.filter(
                business=business,
                platform__platform=platform,
                link=link
            ).first()
            comments = post_data.get("comments", 0)
            comment_count=len(post_data.get("comments").get("data")) if comments else 0
            found_post.comments= comment_count
            
            found_post.reactions=post_data.get("like_count", 0) if platform=='instagram' else post_data.get('likes').get('summary').get('total_count')
            found_post.save()
            continue
        
        # Create a new Post object
        image_url= _save_meta_image(post_data,platform)
        comments= post_data.get("comments", 0)
        comment_count=len(post_data.get("comments").get("data")) if comments else 0
        caption=post_data.get("caption") if platform=='instagram' else post_data.get("message")        

        post = Post(
            business=business,
            platform=SocialMedia.objects.get(business=business, platform=platform),
            caption=caption if caption else "",
            link=link,
            post_id=post_data.get("id"),
            posted_at=post_data.get("timestamp") if platform=='instagram' else post_data.get("created_time"),
            image=image_url,
            scheduled_at=None,
            status='Published',
            promotion=None,
            reactions=post_data.get("like_count", 0) if platform=='instagram' else post_data.get('likes').get('summary').get('total_count'),
            comments=comment_count
        )
        post.save()

    _remove_deleted_posts(platform,posts_data,business)
    return {"message": "Posts synced successfully", "status": True}

def _returnInstagramDetails(facebookPageID, access_token):
    url = f'https://graph.facebook.com/v22.0/{facebookPageID}?fields=instagram_business_account&access_token={access_token}'

    response = requests.get(url)
    data=response.json()
    if response.status_code != 200:
        return None

    insta_account_data = data.get("instagram_business_account")
    if not insta_account_data:
        return None
    
    return insta_account_data.get("id")

def _get_meta_posts(user_id, platform):
    token_decoded = get_user_access_token(user_id)
    if not token_decoded:
        return {"error": "Invalid or missing access token. Please reconnect your social account in Settings.", "status": False}
    
    facebookPageID = get_facebook_page_id(token_decoded)
    if not facebookPageID:
        return {"error": "Unable to retrieve Facebook Page ID. Please reconnect your social account in Settings.", "status": False}
    
    #For Facebook
    if platform == 'facebook':
        url = f'https://graph.facebook.com/v22.0/me/accounts?access_token={token_decoded}'
        
        response = requests.get(url)
        if response.status_code != 200:
            return {"error": f"Unable to retrieve page access token. {response.text}", "status": False}
        
        metasData = response.json()
        if not metasData.get("data"):
            return {"error": "Unable to retrieve page access token 2", "status": False}
        
        page_access_token = metasData.get("data")[0]["access_token"]
        url = f'https://graph.facebook.com/v22.0/{facebookPageID}/posts?fields=id,message,created_time,permalink_url,full_picture,likes.summary(true),comments.summary(true)&access_token={page_access_token}'
        
        response = requests.get(url)
        if response.status_code != 200:
            return {"error": f"Unable to fetch posts. {response.text}", "status": False}
        
        media_data = response.json()
        if not media_data.get("data"):
            return {"error": f"Unable to retrieve posts {response.text}", "status": False}
        
        posts_data = media_data.get("data")
        return {"message": posts_data, "status": True}
    
    #For Instagram
    instagram_account_id = _returnInstagramDetails(facebookPageID,token_decoded)
    if not instagram_account_id:    
        return {"error": "Unable to retrieve Insta ID", "status": False}
    
    url = f'https://graph.facebook.com/v22.0/{instagram_account_id}/media?fields=id,caption,media_type,media_url,timestamp,permalink,thumbnail_url,children,like_count,comments&access_token={token_decoded}'
    
    response = requests.get(url)
    if response.status_code != 200:
        return {"error": f"Unable to fetch posts. {response.text}", "status": False}
    
    media_data = response.json()
    if not media_data.get("data"):
        return {"error": f"Unable to retrieve posts {response.text}", "status": False}
    
    posts_data = media_data.get("data")
    return {"message": posts_data, "status": True}

def _save_meta_image(post_data, platform):
    media_type=post_data.get('media_type') if platform=="instagram" else "IMAGE"
    if media_type == "IMAGE" or media_type == "CAROUSEL_ALBUM":
        return post_data.get('media_url') if platform == "instagram" else post_data.get('full_picture')
    elif media_type == "VIDEO" and platform == "instagram":
        return post_data.get('thumbnail_url')
    else:
        return "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg"

def _remove_deleted_posts(platform, posts_data, business):
    platform_obj = SocialMedia.objects.get(business=business, platform=platform)

    links = [
        post_data.get("permalink") if platform == 'instagram' else post_data.get("permalink_url")
        for post_data in posts_data
    ]

    posts_not_in_links = Post.objects.filter(
        business=business,
        platform=platform_obj
    ).exclude(
        link__in=links
    )
    #Fetch posted posts
    posts_in_links = Post.objects.filter(
        business=business,
        platform=platform_obj,
        link__in=links
    )

    for post in posts_not_in_links:
        if (post.status=='Published'):
            post.delete()

    for post in posts_not_in_links:
        if(post.scheduled_at):
            if(post.scheduled_at < timezone.now()):
                post.status='Failed'
                post.save()
        for post2 in posts_in_links:
            if(post.caption==post2.caption):
                if abs((post.scheduled_at - post2.posted_at).total_seconds()) <= 60:
                    logger.error("Same post found!")
                    post.delete()