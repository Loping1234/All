import random
import math
from datetime import datetime, date

def augment_rows(rows: list[dict], seed: int = 42) -> list[dict]:
    """Add synthetic columns to each row dict in-place and return the list."""
    rng = random.Random(seed)
    
    for row in rows:
        category = str(row.get("category", "")).lower()
        unit_price = float(row.get("unit_price", 0))
        
        # Category heuristics
        is_electronics = "electronic" in category or "computer" in category or "phone" in category
        is_grocery = "grocery" in category or "food" in category or "health" in category
        is_fashion = "fashion" in category or "cloth" in category or "apparel" in category
        
        # 1. Customer Behavior
        row["loyalty_score"] = rng.randint(0, 100)
        
        if is_electronics:
            row["cart_abandonment_rate"] = round(rng.uniform(0.6, 0.85), 2)
            row["return_rate"] = round(rng.uniform(0.05, 0.20), 2)
            row["page_views_before_purchase"] = int(math.exp(rng.uniform(1, 4)))
        elif is_grocery:
            row["cart_abandonment_rate"] = round(rng.uniform(0.15, 0.40), 2)
            row["return_rate"] = round(rng.uniform(0.0, 0.05), 2)
            row["page_views_before_purchase"] = int(math.exp(rng.uniform(0.5, 2)))
        elif is_fashion:
            row["cart_abandonment_rate"] = round(rng.uniform(0.5, 0.75), 2)
            row["return_rate"] = round(rng.uniform(0.15, 0.35), 2)
            row["page_views_before_purchase"] = int(math.exp(rng.uniform(1.5, 3.5)))
        else:
            row["cart_abandonment_rate"] = round(rng.uniform(0.4, 0.7), 2)
            row["return_rate"] = round(rng.uniform(0.05, 0.15), 2)
            row["page_views_before_purchase"] = int(math.exp(rng.uniform(1, 3)))
            
        row["search_volume_index"] = rng.randint(50, 200)
        # Skewed toward 3.5-4.5
        base_rating = rng.triangular(1.0, 5.0, 4.2)
        row["avg_rating"] = round(min(5.0, max(1.0, base_rating)), 1)
        row["review_count"] = int(rng.paretovariate(1.5) * 10)
        row["customer_lifetime_value"] = round(math.exp(rng.uniform(2.3, 9.2)), 2)

        # 2. Product Context
        row["lifecycle_stage"] = rng.choices(
            ["launch", "growth", "mature", "decline"], 
            weights=[0.1, 0.3, 0.5, 0.1]
        )[0]
        row["is_perishable"] = 1 if is_grocery else 0
        row["is_bundle"] = 1 if rng.random() < 0.15 else 0
        
        if is_electronics:
            row["substitute_count"] = rng.randint(2, 10)
        elif is_grocery:
            row["substitute_count"] = rng.randint(5, 25)
        else:
            row["substitute_count"] = rng.randint(0, 15)
            
        if unit_price < 20:
            row["brand_tier"] = "budget"
        elif unit_price < 100:
            row["brand_tier"] = rng.choices(["budget", "mid"], weights=[0.4, 0.6])[0]
        elif unit_price < 500:
            row["brand_tier"] = rng.choices(["mid", "premium"], weights=[0.7, 0.3])[0]
        else:
            row["brand_tier"] = rng.choices(["premium", "luxury"], weights=[0.6, 0.4])[0]

        # 3. Operational
        if is_electronics:
            row["lead_time_days"] = rng.randint(14, 90)
        elif is_grocery:
            row["lead_time_days"] = rng.randint(1, 7)
        else:
            row["lead_time_days"] = rng.randint(7, 30)
            
        row["warehouse_utilization"] = round(rng.uniform(0.3, 0.95), 2)
        row["reorder_point"] = int(row["lead_time_days"] * float(row.get("quantity_sold", 0) or 1) * rng.uniform(0.8, 1.2))
        
        qty = float(row.get("quantity_sold", 0) or 0)
        inv = float(row.get("inventory_level", 0) or 0)
        row["days_of_inventory"] = round(inv / qty, 1) if qty > 0 else 180.0
        row["supplier_reliability_score"] = round(rng.uniform(0.5, 1.0), 2)

        # 4. Decision Metadata
        row["pricing_strategy"] = rng.choices(
            ["cost_plus", "competitive", "value_based", "dynamic", "penetration", "skimming"],
            weights=[0.3, 0.3, 0.1, 0.2, 0.05, 0.05]
        )[0]
        
        reasons = [
            'Competitor undercut by 8%', 
            'Seasonal demand surge', 
            'Supplier cost increase 12%', 
            'Inventory clearance', 
            'New product launch premium',
            'Inflationary adjustment',
            'Margin optimization run'
        ]
        row["price_change_reason"] = rng.choice(reasons)
        
        row["approved_by_role"] = rng.choices(
            ["pricing_analyst", "category_manager", "vp_pricing", "automated_system"],
            weights=[0.4, 0.3, 0.05, 0.25]
        )[0]
        row["approval_confidence"] = round(rng.uniform(0.5, 1.0), 2)

        # 5. Elasticity & Sensitivity
        if is_grocery:
            row["estimated_elasticity"] = round(rng.uniform(-1.5, -0.5), 2)
        elif is_electronics:
            row["estimated_elasticity"] = round(rng.uniform(-3.0, -1.5), 2)
        elif row["brand_tier"] in ["luxury", "premium"]:
            row["estimated_elasticity"] = round(rng.uniform(-0.8, -0.3), 2)
        else:
            row["estimated_elasticity"] = round(rng.uniform(-2.0, -1.0), 2)
            
        row["cross_price_elasticity"] = round(rng.uniform(0.0, 0.5), 2)
        row["price_sensitivity_score"] = int(min(100, max(0, abs(row["estimated_elasticity"]) * 33 + rng.randint(-10, 10))))

    return rows
