from typing import List, Optional
from pydantic import BaseModel

class PortalPlayer(BaseModel):
    id: str
    first_name: str
    last_name: str
    position: str
    shoots: str
    previous_team: str
    previous_conference: str  # 'Hockey East', 'Big Ten', 'NCHC', 'ECAC', 'CCHA', 'AHA'
    eligibility_remaining_years: int
    portal_entry_date: str
    status: str  # 'Open - High Priority', 'In Discussions', 'Committed', 'Evaluating'
    nil_bracket_estimate: str  # e.g. '$45,000 - $70,000'
    points_last_season: int
    games_last_season: int
    scholarship_target: float  # e.g. 1.0 (Full), 0.85, 0.50
    lead_recruiter: str
    visit_date: Optional[str] = None
    scout_eval_grade: int  # 20-80
    scouting_notes: str

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

class ScholarshipBudget(BaseModel):
    total_allowed: float = 18.0  # NCAA D1 Hockey limit
    allocated: float
    remaining: float
    total_committed_athletes: int
    walk_ons: int
    projected_roster_count: int
