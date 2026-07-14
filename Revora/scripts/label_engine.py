import json

def compute_labels(rows: list[dict]) -> list[dict]:
    """Compute leakage-free decision_quality labels. Updates rows in-place.
    
    Adds columns:
    - decision_quality_v2: str (Terrible/Bad/Neutral/Good/Terrific)
    - decision_score: float (0-100 composite score)
    - decision_score_breakdown: str (JSON of component scores)
    """
    # 1. Counterfactual Baseline: Compute average profit/demand impact by category and time
    category_baselines = {}
    for row in rows:
        cat = str(row.get("category", "Unknown"))
        profit_lift = float(row.get("profit_lift_percent", 0) or 0)
        demand_change = float(row.get("demand_change_percent", 0) or 0)
        
        if cat not in category_baselines:
            category_baselines[cat] = {"profit_lifts": [], "demand_changes": []}
            
        category_baselines[cat]["profit_lifts"].append(profit_lift)
        category_baselines[cat]["demand_changes"].append(demand_change)
        
    avg_baselines = {}
    for cat, data in category_baselines.items():
        avg_baselines[cat] = {
            "profit": sum(data["profit_lifts"]) / len(data["profit_lifts"]) if data["profit_lifts"] else 0,
            "demand": sum(data["demand_changes"]) / len(data["demand_changes"]) if data["demand_changes"] else 0
        }

    for row in rows:
        cat = str(row.get("category", "Unknown"))
        profit_lift = float(row.get("profit_lift_percent", 0) or 0)
        demand_change = float(row.get("demand_change_percent", 0) or 0)
        price_change = float(row.get("price_change_percent", 0) or 0)
        inv = float(row.get("inventory_level", 0) or 0)
        stockout = inv <= 0
        comp_price = float(row.get("competitor_price", 0) or 0)
        unit_price = float(row.get("unit_price", 0) or 0)
        margin = float(row.get("margin_rate_before", 0) or 0.2)
        holiday = int(row.get("holiday_flag", 0) or 0)
        
        baseline_profit = avg_baselines.get(cat, {}).get("profit", 0)
        
        # Calculate individual score components (0-100)
        
        # 1. Profit Impact (30% weight) relative to baseline
        profit_diff = profit_lift - baseline_profit
        if profit_diff > 15: profit_score = 100
        elif profit_diff > 5: profit_score = 80
        elif profit_diff > -5: profit_score = 50
        elif profit_diff > -15: profit_score = 20
        else: profit_score = 0
            
        # 2. Demand Impact (25% weight)
        if demand_change > 20: demand_score = 100
        elif demand_change > 5: demand_score = 75
        elif demand_change > -5: demand_score = 50
        elif demand_change > -20: demand_score = 25
        else: demand_score = 0
            
        # 3. Competitive Positioning (15% weight)
        comp_score = 50
        if comp_price > 0:
            diff = (unit_price - comp_price) / comp_price
            if abs(diff) <= 0.05: comp_score = 80  # Aligned
            elif diff < -0.05: comp_score = 60    # Undercutting
            elif diff > 0.05 and profit_lift > 0: comp_score = 100 # Premium & successful
            elif diff > 0.05 and profit_lift <= 0: comp_score = 20 # Premium & failed
            
        # 4. Margin Preservation (20% weight)
        margin_score = 50
        if margin > 0.3: margin_score = 90
        elif margin > 0.15: margin_score = 70
        elif margin > 0.05: margin_score = 40
        else: margin_score = 10
            
        # 5. Inventory Efficiency (10% weight)
        inv_score = 50
        if stockout and price_change < 0:
            inv_score = 0 # Price decrease during stockout = Terrible
        elif stockout and price_change > 0:
            inv_score = 100 # Price increase during stockout = Good
        elif inv > 1000 and price_change < 0:
            inv_score = 90 # Price decrease during high inventory = Good
        elif inv > 1000 and price_change > 0:
            inv_score = 10 # Price increase during high inventory = Bad
            
        # Composite score
        decision_score = (profit_score * 0.30) + (demand_score * 0.25) + (comp_score * 0.15) + (margin_score * 0.20) + (inv_score * 0.10)
        
        # Map to label
        if stockout and price_change < 0:
            label = "Terrible"
        elif inv > 1000 and price_change > 0 and demand_change < 0:
            label = "Bad"
        elif decision_score >= 80:
            label = "Terrific"
        elif decision_score >= 60:
            label = "Good"
        elif decision_score >= 40:
            label = "Neutral"
        elif decision_score >= 20:
            label = "Bad"
        else:
            label = "Terrible"
            
        row["decision_quality_v2"] = label
        row["decision_score"] = round(decision_score, 2)
        row["decision_score_breakdown"] = json.dumps({
            "profit": profit_score,
            "demand": demand_score,
            "comp": comp_score,
            "margin": margin_score,
            "inv": inv_score
        })
        
    return rows
