import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from datetime import datetime, timedelta

# --- Configuration ---
START_DATE = datetime(2025, 1, 5)

tasks = [
    # (Task Name, Start Week, Duration, Category)
    ("Backend Fundamentals Training",      1,  2, "Training"),
    
    ("TaskOps: System Architecture",       3,  1, "TaskOps"),
    ("TaskOps: Core Logic & RBAC",         4,  1, "TaskOps"),
    ("TaskOps: Analytics & Dashboard",     5,  1, "TaskOps"),
    ("TaskOps: Deployment & S3",           6,  1, "TaskOps"),
    
    ("TV19: RSS Feed Integration",         7,  2, "TV19 News"),
    ("TV19: Metadata Scraper logic",       9,  1, "TV19 News"),
    ("TV19: React + TS Frontend",         10,  2, "TV19 News"),
    
    ("Revora: Tailwind CSS v4 UI",        12,  1, "Revora"),
    ("Revora: Demand Intelligence",       13,  2, "Revora"),
    ("Revora: Simulation & CSV Pipeline", 15,  1, "Revora"),
    
    ("Final Project: System Integration", 16,  1, "Final Project"),
    ("Final Project: Production Release", 17,  1, "Final Project"),
]

# --- Modern Color Palette ---
COLORS = {
    "Training":      "#6366f1", # Indigo
    "TaskOps":       "#10b981", # Emerald
    "TV19 News":     "#f59e0b", # Amber
    "Revora":        "#ef4444", # Rose/Red
    "Final Project": "#8b5cf6"  # Violet
}

# --- Plot Setup ---
fig, ax = plt.subplots(figsize=(20, 10))
fig.patch.set_facecolor("#0f172a")
ax.set_facecolor("#1e293b")

num_tasks = len(tasks)
bar_height = 0.6

for i, (name, start_week, duration, category) in enumerate(tasks):
    y = num_tasks - i - 1
    ax.barh(y, duration, left=start_week - 1, height=bar_height,
            color=COLORS[category], alpha=0.9, zorder=3)
    ax.text(start_week - 1 + duration / 2, y, f"{duration}w",
            va="center", ha="center", fontsize=9, color="white", fontweight="bold")

# --- X and Y Axis Config ---
ax.set_yticks(range(num_tasks))
ax.set_yticklabels([t[0] for t in tasks], fontsize=10, color="#e2e8f0")
ax.set_xlim(0, 17)
ax.set_xticks(range(17))
ax.set_xticklabels([f"Wk {i}\n{(START_DATE + timedelta(weeks=i-1)).strftime('%d %b')}" for i in range(1, 18)], 
                   fontsize=8, color="#94a3b8")

# --- Grid & Spines ---
ax.xaxis.grid(True, color="#334155", linestyle="--", alpha=0.5, zorder=0)
for spine in ax.spines.values():
    spine.set_visible(False)

# --- Legend ---
patches = [mpatches.Patch(color=c, label=l) for l, c in COLORS.items()]
ax.legend(handles=patches, loc="upper right", facecolor="#1e293b", edgecolor="#334155", labelcolor="white")

plt.title("Internship Roadmap: Jan - May 2025", 
          fontsize=16, pad=20, color="white", fontweight="bold")
plt.tight_layout()
plt.show()
