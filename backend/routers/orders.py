from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models import OrderCreate, OrderResponse, OrderUpdate, OrderStatus, UserRole
from database import get_db
from auth import get_current_user, require_pantry
from datetime import datetime

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/create", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Create a new order (users only)
    """
    try:
        # Only users can create orders
        if current_user["role"] != UserRole.USER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only users can place orders"
            )

        # Prepare order data
        order_items = [item.dict() for item in order_data.items]

        # Insert order
        response = db.table("orders").insert({
            "user_id": current_user["id"],
            "items": order_items,
            "location": order_data.location.value,
            "status": OrderStatus.PENDING.value
        })

        if not response["data"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create order"
            )

        order = response["data"][0]

        return OrderResponse(
            id=order["id"],
            user_id=order["user_id"],
            username=current_user["username"],
            items=order["items"],
            location=order["location"],
            status=order["status"],
            created_at=order["created_at"],
            completed_at=order.get("completed_at"),
            updated_at=order["updated_at"]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Order creation error: {str(e)}"
        )


@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Get orders based on user role
    - Users: Get their own orders
    - Pantry/Admin: Get all orders
    """
    try:
        query = db.table("orders").select("*")

        # Filter by user_id for regular users
        if current_user["role"] == UserRole.USER.value:
            query = query.eq("user_id", current_user["id"])

        # Order by created_at descending
        response = query.order("created_at", desc=True).execute()

        orders = []
        for order in response["data"]:
            # Fetch username separately for SQLite
            username = None
            if order.get("user_id"):
                user_response = db.table("users").select("username").eq("id", order["user_id"]).execute()
                if user_response["data"]:
                    username = user_response["data"][0]["username"]

            orders.append(OrderResponse(
                id=order["id"],
                user_id=order["user_id"],
                username=username,
                items=order["items"],
                location=order["location"],
                status=order["status"],
                created_at=order["created_at"],
                completed_at=order.get("completed_at"),
                updated_at=order["updated_at"]
            ))

        return orders

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching orders: {str(e)}"
        )


@router.get("/pending", response_model=List[OrderResponse])
async def get_pending_orders(
    current_user: dict = Depends(require_pantry),
    db=Depends(get_db)
):
    """
    Get all pending orders (pantry/admin only)
    """
    try:
        response = db.table("orders").select("*").eq("status", OrderStatus.PENDING.value).order("created_at").execute()

        orders = []
        for order in response["data"]:
            # Fetch username separately for SQLite
            username = None
            if order.get("user_id"):
                user_response = db.table("users").select("username").eq("id", order["user_id"]).execute()
                if user_response["data"]:
                    username = user_response["data"][0]["username"]

            orders.append(OrderResponse(
                id=order["id"],
                user_id=order["user_id"],
                username=username,
                items=order["items"],
                location=order["location"],
                status=order["status"],
                created_at=order["created_at"],
                completed_at=order.get("completed_at"),
                updated_at=order["updated_at"]
            ))

        return orders

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching pending orders: {str(e)}"
        )


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    update_data: OrderUpdate,
    current_user: dict = Depends(require_pantry),
    db=Depends(get_db)
):
    """
    Update order status (pantry/admin only)
    """
    try:
        # Prepare update data
        update_fields = {"status": update_data.status.value}

        # Set completed_at if status is completed
        if update_data.status == OrderStatus.COMPLETED:
            update_fields["completed_at"] = datetime.utcnow().isoformat()

        # Update order
        response = db.table("orders").update(update_fields).eq("id", order_id).execute()

        if not response["data"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        order = response["data"][0]

        # Fetch username
        user_response = db.table("users").select("username").eq("id", order["user_id"]).execute()
        username = user_response["data"][0]["username"] if user_response["data"] else None

        return OrderResponse(
            id=order["id"],
            user_id=order["user_id"],
            username=username,
            items=order["items"],
            location=order["location"],
            status=order["status"],
            created_at=order["created_at"],
            completed_at=order.get("completed_at"),
            updated_at=order["updated_at"]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating order: {str(e)}"
        )


@router.get("/history", response_model=List[OrderResponse])
async def get_order_history(
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Get order history
    - Users: Get their own order history
    - Pantry/Admin: Get all order history
    """
    try:
        query = db.table("orders").select("*")

        # Filter by user_id for regular users
        if current_user["role"] == UserRole.USER.value:
            query = query.eq("user_id", current_user["id"])

        # Order by created_at descending with pagination
        response = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()

        orders = []
        for order in response["data"]:
            # Fetch username separately for SQLite
            username = None
            if order.get("user_id"):
                user_response = db.table("users").select("username").eq("id", order["user_id"]).execute()
                if user_response["data"]:
                    username = user_response["data"][0]["username"]

            orders.append(OrderResponse(
                id=order["id"],
                user_id=order["user_id"],
                username=username,
                items=order["items"],
                location=order["location"],
                status=order["status"],
                created_at=order["created_at"],
                completed_at=order.get("completed_at"),
                updated_at=order["updated_at"]
            ))

        return orders

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching order history: {str(e)}"
        )
