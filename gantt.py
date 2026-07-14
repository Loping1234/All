import matplotlib.pyplot as plt
import pandas as pd
from datetime import datetime, timedelta

# Define the tasks and their timelines
tasks = [
    # Phase 1: Foundation
    {"Task": "Backend Fundamentals & Training", "Start": "2026-01-05", "End": "2026-01-18", "Project": "Foundation"},
    
    # Phase 2: TaskOps
    {"Task": "Architecture & Auth System (TaskOps)", "Start": "2026-01-19", "End": "2026-01-28", "Project": "TaskOps"},
    {"Task": "Task CRUD & RBAC (TaskOps)", "Start": "2026-01-29", "End": "2026-02-06", "Project": "TaskOps"},
    {"Task": "Real-time Sync & Teams (TaskOps)", "Start": "2026-02-07", "End": "2026-02-13", "Project": "TaskOps"},
    {"Task": "Analytics & Deployment (TaskOps)", "Start": "2026-02-14", "End": "2026-02-23", "Project": "TaskOps"},
    
    # Phase 3: NewsTV19
    {"Task": "Codebase Analysis & RSS Proxy (TV19)", "Start": "2026-02-24", "End": "2026-03-10", "Project": "NewsTV19"},
    {"Task": "Deduplication & Ingestion (TV19)", "Start": "2026-03-11", "End": "2026-03-24", "Project": "NewsTV19"},
    {"Task": "Async Metadata & Scraper (TV19)", "Start": "2026-03-25", "End": "2026-04-03", "Project": "NewsTV19"},
    {"Task": "Filtering & Search Module (TV19)", "Start": "2026-04-04", "End": "2026-04-12", "Project": "NewsTV19"},
    {"Task": "Audit & Optimization (TV19)", "Start": "2026-04-13", "End": "2026-04-19", "Project": "NewsTV19"},
    
    # Phase 4: Revora
    {"Task": "Tailwind v4 & UI Design (Revora)", "Start": "2026-04-20", "End": "2026-04-27", "Project": "Revora"},
    {"Task": "Demand Intelligence Engine (Revora)", "Start": "2026-04-28", "End": "2026-05-04", "Project": "Revora"},
    {"Task": "Bulk CSV Data Pipeline (Revora)", "Start": "2026-05-05", "End": "2026-05-12", "Project": "Revora"},
    {"Task": "Market Simulation Sandbox (Revora)", "Start": "2026-05-13", "End": "2026-05-20", "Project": "Revora"},
    {"Task": "Alpha Testing & Refinement (Revora)", "Start": "2026-05-21", "End": "2026-06-05", "Project": "Revora"}
]

df = pd.DataFrame(tasks)
df['Start'] = pd.to_datetime(df['Start'])
df['End'] = pd.to_datetime(df['End'])
df['Duration'] = (df['End'] - df['Start']).dt.days

# Sort tasks in reverse to show the earliest at the top
df = df.iloc[::-1]

# Set up colors for each project
colors = {
    'Foundation': '#94a3b8', # Slate
    'TaskOps': '#3b82f6',    # Blue
    'NewsTV19': '#10b981',   # Emerald
    'Revora': '#f43f5e'      # Rose
}

plt.figure(figsize=(12, 8))

for i, task in df.iterrows():
    plt.barh(task['Task'], task['Duration'], left=task['Start'], 
             color=colors[task['Project']], edgecolor='black', alpha=0.8)

# Formatting
plt.title('Internship Project Timeline (16 Weeks)', fontsize=16, fontweight='bold', pad=20)
plt.xlabel('Date', fontsize=12)
plt.grid(axis='x', linestyle='--', alpha=0.7)

# Adjust x-axis labels
plt.gca().xaxis_date()
plt.xticks(rotation=45)

# Add a legend
handles = [plt.Rectangle((0,0),1,1, color=colors[proj]) for proj in colors]
plt.legend(handles, colors.keys(), loc='lower right', frameon=True, shadow=True)

plt.tight_layout()
plt.savefig('gantt_chart.png', dpi=300)
print("Gantt chart saved as gantt_chart.png")