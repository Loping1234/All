import json
import numpy as np
import lightgbm as lgb
from collections import Counter
from datetime import date, datetime, timezone
import pickle
import csv
from pathlib import Path

# Need access to the same LABELS, we will just redefine them for simplicity
LABELS = ["Terrible", "Bad", "Neutral", "Good", "Terrific"]
LABEL_TO_INDEX = {label: index for index, label in enumerate(LABELS)}

def encode_categories(values):
    counts = Counter(str(value or "Unknown") for value in values)
    ordered = [value for value, _ in counts.most_common()]
    mapping = {value: index + 1 for index, value in enumerate(ordered)}
    return mapping

def split_time_holdout(X, y, dates, holdout_ratio=0.2):
    order = sorted(range(len(dates)), key=lambda index: dates[index])
    cutoff = max(1, int(len(order) * (1 - holdout_ratio)))
    train_idx = np.array(order[:cutoff], dtype=int)
    test_idx = np.array(order[cutoff:], dtype=int)
    return X[train_idx], X[test_idx], y[train_idx], y[test_idx], train_idx, test_idx

def classification_report(y_true, y_pred):
    confusion = np.zeros((len(LABELS), len(LABELS)), dtype=int)
    for actual, predicted in zip(y_true, y_pred):
        confusion[int(actual), int(predicted)] += 1

    per_class = {}
    f1_values = []
    for index, label in enumerate(LABELS):
        tp = confusion[index, index]
        fp = confusion[:, index].sum() - tp
        fn = confusion[index, :].sum() - tp
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        f1_values.append(f1)
        per_class[label] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "support": int(confusion[index, :].sum()),
        }

    accuracy = float(np.mean(y_true == y_pred)) if len(y_true) else 0.0
    return {
        "accuracy": round(accuracy, 4),
        "macro_f1": round(float(np.mean(f1_values)), 4),
        "per_class": per_class,
        "confusion_matrix": {
            "labels": LABELS,
            "values": confusion.tolist(),
        },
    }

def parse_float(value, default=0.0):
    try:
        return float(value) if value not in [None, ""] else default
    except ValueError:
        return default

def parse_date(value):
    try:
        return datetime.fromisoformat(value).date() if value else date(1900, 1, 1)
    except Exception:
        return date(1900, 1, 1)

def train_lgbm_model(rows, output_dir, feature_columns):
    matrix = []
    labels = []
    dates = []
    
    category_maps = {
        "source_dataset": encode_categories(row.get("source_dataset") for row in rows),
        "category": encode_categories(row.get("category") for row in rows),
        "customer_segment": encode_categories(row.get("customer_segment") for row in rows),
        "region": encode_categories(row.get("region") for row in rows),
    }

    for row in rows:
        enriched = dict(row)
        enriched["source_code"] = category_maps["source_dataset"].get(str(row.get("source_dataset") or "Unknown"), 0)
        enriched["category_code"] = category_maps["category"].get(str(row.get("category") or "Unknown"), 0)
        enriched["segment_code"] = category_maps["customer_segment"].get(str(row.get("customer_segment") or "Unknown"), 0)
        enriched["region_code"] = category_maps["region"].get(str(row.get("region") or "Unknown"), 0)
        
        matrix.append([parse_float(enriched.get(column), 0) for column in feature_columns])
        # Use decision_quality_v2 from the new label_engine
        label = row.get("decision_quality_v2", "Neutral")
        if label not in LABEL_TO_INDEX:
            label = "Neutral"
        labels.append(LABEL_TO_INDEX[label])
        dates.append(parse_date(row.get("date")))

    X = np.array(matrix, dtype=float)
    y = np.array(labels, dtype=int)
    
    medians = np.nanmedian(X, axis=0)
    medians = np.where(np.isfinite(medians), medians, 0)
    X = np.where(np.isfinite(X), X, medians)
    
    X_train, X_test, y_train, y_test, train_idx, test_idx = split_time_holdout(X, y, dates)

    majority = Counter(y_train.tolist()).most_common(1)[0][0]
    majority_pred = np.full_like(y_test, majority)
    baseline_majority = classification_report(y_test, majority_pred)

    model = lgb.LGBMClassifier(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=8,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    model_report = classification_report(y_test, y_pred)

    artifact = {
        "model_type": "LightGBM Classifier",
        "labels": LABELS,
        "feature_columns": feature_columns,
        "feature_medians": medians.tolist(),
        "category_maps": category_maps,
        "model": model,
        "note": "Offline ML decision-quality assistant using LightGBM.",
    }
    
    output_dir = Path(output_dir)
    model_path = output_dir / "decision_quality_model.joblib"
    
    import joblib
    joblib.dump(artifact, model_path)

    feature_importance = []
    for column, importance in sorted(zip(feature_columns, model.feature_importances_), key=lambda item: item[1], reverse=True):
        feature_importance.append({"feature": column, "importance": round(float(importance), 6)})

    importance_path = output_dir / "decision_quality_feature_importance.csv"
    with importance_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["feature", "importance"])
        writer.writeheader()
        writer.writerows(feature_importance)

    metrics = {
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "row_count": len(rows),
        "train_rows": int(len(y_train)),
        "test_rows": int(len(y_test)),
        "label_distribution": dict(Counter(row.get("decision_quality_v2", "Neutral") for row in rows)),
        "features_used": feature_columns,
        "model_implementation": "LightGBM",
        "artifact_format": "joblib",
        "model": model_report,
        "baselines": {
            "majority_class": baseline_majority,
        },
        "model_beats_majority_baseline": model_report["macro_f1"] > baseline_majority["macro_f1"],
    }
    metrics_path = output_dir / "decision_quality_metrics.json"
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    
    return model_path, metrics_path, importance_path, metrics
