from models.user import user_storage
from utils.validators import validate_email
import logging

logger = logging.getLogger(__name__)

class AuthService:
    """Authentication service for handling user operations"""
    
    @staticmethod
    def register_user(username, email, password):
        """Register a new user"""
        # Validation
        if not username or not email or not password:
            raise ValueError("All fields are required")
        
        if len(username) < 3:
            raise ValueError("Username must be at least 3 characters long")
        
        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters long")
        
        if not validate_email(email):
            raise ValueError("Please enter a valid email address")
        
        try:
            user = user_storage.create_user(username, email, password)
            logger.info(f"New user registered: {username}")
            return user
        except ValueError as e:
            raise e
    
    @staticmethod
    def login_user(username, password):
        """Login user with credentials"""
        if not username or not password:
            raise ValueError("Username and password are required")
        
        user = user_storage.get_user_by_credentials(username)
        if not user:
            raise ValueError("Invalid username or password")
        
        if not user.verify_password(password):
            raise ValueError("Invalid username or password")
        
        user.update_last_login()
        logger.info(f"User logged in: {user.username}")
        return user
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID"""
        return user_storage.get_user_by_id(user_id)
    
    @staticmethod
    def change_password(user_id, current_password, new_password):
        """Change user password"""
        if not current_password or not new_password:
            raise ValueError("Current and new passwords are required")
        
        if len(new_password) < 6:
            raise ValueError("New password must be at least 6 characters long")
        
        user = user_storage.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        if not user.verify_password(current_password):
            raise ValueError("Current password is incorrect")
        
        # Update password
        user.password = user._hash_password(new_password)
        logger.info(f"Password changed for user: {user.username}")
        return True
