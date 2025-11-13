from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from models import AnalyticsResponse, OrderStats, LocationStats, HourlyStats, OrderResponse, UserResponse, UserRole
from database import get_db
from auth import require_admin
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    current_user: dict = Depends(require_admin),
    db=Depends(get_db)
):
    """
    Get analytics dashboard data (admin only)
    """
    try:
        # Build date filter
        query = db.table("orders").select("*")

        if start_date:
            query = query.gte("created_at", start_date)
        if end_date:
            query = query.lte("created_at", end_date)

        # Fetch all orders
        response = query.execute()
        orders = response["data"]

        # Calculate statistics
        total_orders = len(orders)
        pending_orders = len([o for o in orders if o["status"] == "pending"])
        completed_orders = len([o for o in orders if o["status"] == "completed"])
        cancelled_orders = len([o for o in orders if o["status"] == "cancelled"])

        stats = OrderStats(
            total_orders=total_orders,
            pending_orders=pending_orders,
            completed_orders=completed_orders,
            cancelled_orders=cancelled_orders
        )

        # Location distribution
        location_counts = {}
        for order in orders:
            location = order["location"]
            location_counts[location] = location_counts.get(location, 0) + 1

        location_distribution = [
            LocationStats(location=loc, order_count=count)
            for loc, count in location_counts.items()
        ]

        # Hourly distribution
        hourly_counts = {}
        for order in orders:
            created_at = datetime.fromisoformat(order["created_at"].replace("Z", "+00:00"))
            hour = created_at.hour
            hourly_counts[hour] = hourly_counts.get(hour, 0) + 1

        hourly_distribution = [
            HourlyStats(hour=hour, order_count=count)
            for hour, count in sorted(hourly_counts.items())
        ]

        # Average completion time
        completion_times = []
        for order in orders:
            if order["status"] == "completed" and order.get("completed_at"):
                created = datetime.fromisoformat(order["created_at"].replace("Z", "+00:00"))
                completed = datetime.fromisoformat(order["completed_at"].replace("Z", "+00:00"))
                duration = (completed - created).total_seconds() / 60  # minutes
                completion_times.append(duration)

        avg_completion_time = (
            sum(completion_times) / len(completion_times)
            if completion_times else None
        )

        return AnalyticsResponse(
            stats=stats,
            location_distribution=location_distribution,
            hourly_distribution=hourly_distribution,
            avg_completion_time_minutes=avg_completion_time
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching analytics: {str(e)}"
        )


@router.get("/orders/all", response_model=List[OrderResponse])
async def get_all_orders(
    location: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(require_admin),
    db=Depends(get_db)
):
    """
    Get all orders with filters (admin only)
    """
    try:
        query = db.table("orders").select("*, users!orders_user_id_fkey(username)")

        # Apply filters
        if location:
            query = query.eq("location", location)
        if status:
            query = query.eq("status", status)

        # Order by created_at descending with pagination
        response = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()

        orders = []
        for order in response["data"]:
            orders.append(OrderResponse(
                id=order["id"],
                user_id=order["user_id"],
                username=order.get("users", {}).get("username") if order.get("users") else None,
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


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    current_user: dict = Depends(require_admin),
    db=Depends(get_db)
):
    """
    Get all users (admin only)
    """
    try:
        response = db.table("users").select("id, username, role, created_at").execute()

        users = []
        for user in response["data"]:
            users.append(UserResponse(
                id=user["id"],
                username=user["username"],
                role=user["role"],
                created_at=user["created_at"]
            ))

        return users

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching users: {str(e)}"
        )


@router.get("/stats/summary")
async def get_stats_summary(
    current_user: dict = Depends(require_admin),
    db=Depends(get_db)
):
    """
    Get quick summary statistics (admin only)
    """
    try:
        # Get counts
        orders_response = db.table("orders").select("id", count="exact").execute()
        users_response = db.table("users").select("id", count="exact").execute()
        pending_response = db.table("orders").select("id", count="exact").eq("status", "pending").execute()

        # Get today's orders
        today = datetime.utcnow().date().isoformat()
        today_response = db.table("orders").select("id", count="exact").gte("created_at", today).execute()

        return {
            "total_orders": orders_response["count"] or 0,
            "total_users": users_response["count"] or 0,
            "pending_orders": pending_response["count"] or 0,
            "today_orders": today_response["count"] or 0
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching summary stats: {str(e)}"
        )
