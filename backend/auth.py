from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets
import base64
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models import UserRole
from database import get_db
from config import get_settings

settings = get_settings()

# JWT token bearer
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash using PBKDF2-HMAC-SHA256

    Hash format: algorithm$iterations$salt$hash
    Example: pbkdf2_sha256$100000$base64salt$base64hash
    """
    try:
        # Parse the stored hash
        parts = hashed_password.split('$')
        if len(parts) != 4:
            return False

        algorithm, iterations, salt_b64, stored_hash = parts

        if algorithm != 'pbkdf2_sha256':
            return False

        # Decode salt from base64
        salt = base64.b64decode(salt_b64)

        # Hash the plain password with the same salt and iterations
        computed_hash = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt,
            int(iterations)
        )

        # Compare with stored hash
        stored_hash_bytes = base64.b64decode(stored_hash)
        return secrets.compare_digest(computed_hash, stored_hash_bytes)

    except Exception as e:
        print(f"Password verification error: {e}")
        return False


def get_password_hash(password: str) -> str:
    """
    Generate password hash using PBKDF2-HMAC-SHA256

    Returns hash in format: algorithm$iterations$salt$hash
    """
    # Generate a random salt
    salt = secrets.token_bytes(32)

    # Number of iterations (100,000 is recommended minimum)
    iterations = 100000

    # Hash the password
    hash_bytes = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        iterations
    )

    # Encode to base64 for storage
    salt_b64 = base64.b64encode(salt).decode('utf-8')
    hash_b64 = base64.b64encode(hash_bytes).decode('utf-8')

    # Return in storable format
    return f'pbkdf2_sha256${iterations}${salt_b64}${hash_b64}'


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


def decode_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db=Depends(get_db)
) -> dict:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    payload = decode_token(token)

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    # Fetch user from database
    try:
        response = db.table("users").select("*").eq("id", user_id).execute()
        if not response["data"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        user = response["data"][0]
        return user

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}"
        )


def require_role(required_roles: list[UserRole]):
    """Dependency to require specific user roles"""

    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")

        if user_role not in [role.value for role in required_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in required_roles]}"
            )

        return current_user

    return role_checker


# Common role dependencies
require_user = require_role([UserRole.USER, UserRole.PANTRY, UserRole.ADMIN])
require_pantry = require_role([UserRole.PANTRY, UserRole.ADMIN])
require_admin = require_role([UserRole.ADMIN])
