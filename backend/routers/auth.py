from fastapi import APIRouter, Depends, HTTPException, status
from models import LoginRequest, TokenResponse, UserCreate, UserResponse, UserRole
from database import get_db
from auth import verify_password, get_password_hash, create_access_token, get_current_user
from datetime import timedelta
from config import get_settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest, db=Depends(get_db)):
    """
    Authenticate user and return JWT token
    """
    try:
        # Fetch user from database
        response = db.table("users").select("*").eq("username", login_data.username).execute()

        if not response["data"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )

        user = response["data"][0]

        # Verify password
        if not verify_password(login_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )

        # Create access token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": user["id"], "role": user["role"]},
            expires_delta=access_token_expires
        )

        return TokenResponse(
            access_token=access_token,
            user_id=user["id"],
            username=user["username"],
            role=user["role"]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login error: {str(e)}"
        )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db=Depends(get_db)):
    """
    Register a new user
    """
    try:
        # Check if username already exists
        existing = db.table("users").select("id").eq("username", user_data.username).execute()

        if existing["data"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )

        # Hash password
        password_hash = get_password_hash(user_data.password)

        # Insert user
        response = db.table("users").insert({
            "username": user_data.username,
            "password_hash": password_hash,
            "role": user_data.role.value
        })

        if not response["data"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )

        user = response["data"][0]

        return UserResponse(
            id=user["id"],
            username=user["username"],
            role=user["role"],
            created_at=user["created_at"]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration error: {str(e)}"
        )


@router.get("/verify-token")
async def verify_token(current_user: dict = Depends(get_current_user)):
    """
    Verify JWT token and return user info
    """
    return {
        "valid": True,
        "user": {
            "id": current_user["id"],
            "username": current_user["username"],
            "role": current_user["role"]
        }
    }


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout (token invalidation happens client-side)
    """
    return {"message": "Logged out successfully"}
