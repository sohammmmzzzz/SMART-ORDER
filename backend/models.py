from pydantic import BaseModel, Field, UUID4
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration"""
    USER = "user"
    PANTRY = "pantry"
    ADMIN = "admin"


class OrderStatus(str, Enum):
    """Order status enumeration"""
    PENDING = "pending"
    PREPARING = "preparing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Location(str, Enum):
    """Available locations"""
    CONFERENCE_1 = "Conference 1"
    CONFERENCE_2 = "Conference 2"
    CONFERENCE_3 = "Conference 3"
    CONFERENCE_4 = "Conference 4"
    MAIN_CONFERENCE = "Main Conference"


# Authentication Models
class LoginRequest(BaseModel):
    """Login request payload"""
    username: str
    password: str


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    role: UserRole


class UserCreate(BaseModel):
    """User creation payload"""
    username: str
    password: str
    role: UserRole = UserRole.USER


class UserResponse(BaseModel):
    """User response model"""
    id: str
    username: str
    role: UserRole
    created_at: datetime


# Menu Models
class MenuItem(BaseModel):
    """Menu item model"""
    id: Optional[str] = None
    category: str
    name: str
    available: bool = True
    image_url: Optional[str] = None
    created_at: Optional[datetime] = None


class MenuItemResponse(BaseModel):
    """Menu item response"""
    items: List[MenuItem]
    categories: List[str]


# Order Models
class OrderItem(BaseModel):
    """Individual order item"""
    item_id: str
    name: str
    category: str
    quantity: int = 1


class OrderCreate(BaseModel):
    """Order creation payload"""
    items: List[OrderItem]
    location: Location


class OrderUpdate(BaseModel):
    """Order update payload"""
    status: OrderStatus


class OrderResponse(BaseModel):
    """Order response model"""
    id: str
    user_id: str
    username: Optional[str] = None
    items: List[Dict[str, Any]]
    location: str
    status: OrderStatus
    created_at: datetime
    completed_at: Optional[datetime] = None
    updated_at: datetime


# Admin Models
class OrderStats(BaseModel):
    """Order statistics"""
    total_orders: int
    pending_orders: int
    completed_orders: int
    cancelled_orders: int


class LocationStats(BaseModel):
    """Location-based statistics"""
    location: str
    order_count: int


class HourlyStats(BaseModel):
    """Hourly order statistics"""
    hour: int
    order_count: int


class AnalyticsResponse(BaseModel):
    """Analytics dashboard response"""
    stats: OrderStats
    location_distribution: List[LocationStats]
    hourly_distribution: List[HourlyStats]
    avg_completion_time_minutes: Optional[float] = None


class OrderHistoryFilter(BaseModel):
    """Order history filter parameters"""
    location: Optional[str] = None
    status: Optional[OrderStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    user_id: Optional[str] = None
    limit: int = 100
    offset: int = 0
