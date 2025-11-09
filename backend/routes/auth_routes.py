# routers/auth.py
from fastapi import APIRouter, Depends, Request, Response, status
from pydantic import BaseModel, EmailStr, Field
from typing import Any

from services.auth_service import AuthService
from utils.response_utils import standardize_response
from utils.decorators import handle_errors  # if this decorator is Flask-specific, see assumptions
from backend.middleware.auth import require_auth  # assume this is converted to a FastAPI dependency returning current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterPayload(BaseModel):
    username: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)


class LoginPayload(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterPayload, response: Response):
    """User registration endpoint"""
    data = payload.dict()
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    try:
        user = AuthService.register_user(username, email, password)

        # Create a very simple session cookie (Flask used session; here we set a cookie).
        # NOTE: For production use JWT or a proper session store.
        response.set_cookie(key="user_id", value=str(user.id), httponly=True, samesite="lax")

        return standardize_response(
            True,
            {"user": user.to_dict()},
            "Account created successfully! You can now sign in.",
            status_code=201,
        )
    except ValueError as e:
        return standardize_response(False, error=str(e), status_code=400)


@router.post("/login")
async def login(payload: LoginPayload, response: Response):
    """User login endpoint"""
    data = payload.dict()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    try:
        user = AuthService.login_user(username, password)

        # Set session cookie like above
        response.set_cookie(key="user_id", value=str(user.id), httponly=True, samesite="lax")

        return standardize_response(True, {"user": user.to_dict()}, "Login successful! Welcome back.")
    except ValueError as e:
        return standardize_response(False, error=str(e), status_code=401)


@router.post("/logout")
async def logout(response: Response):
    """User logout endpoint"""
    # Clear cookie by expiring it
    response.delete_cookie("user_id")
    return standardize_response(True, message="Logged out successfully")


@router.get("/me")
async def get_current_user(current_user=Depends(require_auth)):
    """Get current user information"""
    # require_auth dependency should return the current user object or raise HTTPException
    user_data = current_user.to_dict()
    return standardize_response(True, {"user": user_data}, "User information retrieved")


class ChangePasswordPayload(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)


@router.post("/change-password")
async def change_password(payload: ChangePasswordPayload, current_user=Depends(require_auth)):
    """Change user password"""
    data = payload.dict()
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    try:
        # Use current_user.id or an equivalent identifier
        AuthService.change_password(current_user.id, current_password, new_password)
        return standardize_response(True, message="Password changed successfully")
    except ValueError as e:
        return standardize_response(False, error=str(e), status_code=400)
