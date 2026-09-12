from pydantic import BaseModel
from typing import Dict, List

class DashboardStatsResponse(BaseModel):
    total_reports: int
    pending_reports: int
    assigned_reports: int
    in_progress_reports: int
    resolved_reports: int
    high_critical_reports: int
    average_resolution_hours: float
    duplicates_prevented: int

class CategoryAnalytics(BaseModel):
    category: str
    count: int

class StatusAnalytics(BaseModel):
    status: str
    count: int

class PriorityAnalytics(BaseModel):
    level: str
    count: int
