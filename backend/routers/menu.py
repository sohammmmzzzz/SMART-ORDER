from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models import MenuItem, MenuItemResponse
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/menu", tags=["Menu"])


@router.get("/items", response_model=MenuItemResponse)
async def get_menu_items(db=Depends(get_db)):
    """
    Get all available menu items
    Public endpoint - no authentication required
    """
    try:
        # Fetch all menu items
        response = db.table("menu_items").select("*").eq("available", True).order("category").execute()

        items = []
        categories = set()

        for item in response.data:
            items.append(MenuItem(
                id=item["id"],
                category=item["category"],
                name=item["name"],
                available=item["available"],
                image_url=item.get("image_url"),
                created_at=item["created_at"]
            ))
            categories.add(item["category"])

        return MenuItemResponse(
            items=items,
            categories=sorted(list(categories))
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching menu items: {str(e)}"
        )


@router.get("/categories")
async def get_categories(db=Depends(get_db)):
    """
    Get all menu categories
    """
    try:
        response = db.table("menu_items").select("category").execute()

        categories = sorted(list(set([item["category"] for item in response.data])))

        return {"categories": categories}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching categories: {str(e)}"
        )


@router.get("/items/{category}", response_model=List[MenuItem])
async def get_items_by_category(category: str, db=Depends(get_db)):
    """
    Get menu items by category
    """
    try:
        response = db.table("menu_items").select("*").eq("category", category).eq("available", True).execute()

        items = []
        for item in response.data:
            items.append(MenuItem(
                id=item["id"],
                category=item["category"],
                name=item["name"],
                available=item["available"],
                image_url=item.get("image_url"),
                created_at=item["created_at"]
            ))

        return items

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching items by category: {str(e)}"
        )
