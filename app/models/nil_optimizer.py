from typing import List, Optional, Dict
from pydantic import BaseModel

class RosterPlayerSalary(BaseModel):
    id: str
    name: str
    position: str
    line_slot: str  # e.g. '1st Line Center', '1st Pair RD', 'Starting Goalie'
    tier: str       # 'Tier 1 Franchise', 'Tier 2 Core', 'Tier 3 Depth', 'Tier 4 Reserve'
    base_rev_share: int
    nil_collective: int
    total_comp: int
    projected_points: float
    cost_per_point: int
    roi_grade: str  # 'A+ Elite Value', 'A High Value', 'B Fair Value', 'C Low Value'

class PortalROICandidate(BaseModel):
    id: str
    name: str
    previous_school: str
    position: str
    eligibility_years: int
    projected_points: float
    requested_comp: int
    cost_per_point: int
    efficiency_index: float
    roi_grade: str
    verdict: str
    ai_recommendation: str

class RevenueShareBudget(BaseModel):
    department_revenue_share_pool: int
    nil_collective_pool: int
    total_pool: int
    allocated_rev_share: int
    allocated_nil: int
    total_allocated: int
    remaining_total: int
    total_roster_count: int
    max_roster_cap: int = 26
    is_compliant: bool = True
    projected_team_points: float
    projected_team_wins: float

class NILOptimizationResult(BaseModel):
    budget: RevenueShareBudget
    optimized_roster: List[RosterPlayerSalary]
    projected_total_points: float
    projected_wins: float
    surplus_savings: int
    executive_recommendation: str
