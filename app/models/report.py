from typing import List, Optional
from pydantic import BaseModel

class LiveShiftEvent(BaseModel):
    id: str
    prospect_id: str
    period: int
    game_clock: str
    event_type: str  # 'Controlled Entry', 'Entry Denial', 'Puck Battle Win', 'High Danger Pass', 'Turnover', 'Shot On Goal', 'Goal', 'Hit', 'Blown Coverage'
    notes: Optional[str] = None
    rating: int = 3  # 1 (Poor) to 5 (Elite)
    timestamp: str

class LiveScoutSession(BaseModel):
    id: str
    scout_name: str
    game: str
    arena: str
    date: str
    prospects_evaluated: List[str]
    events: List[LiveShiftEvent]

class AISynthesisRequest(BaseModel):
    prospect_id: str
    focus_area: Optional[str] = "All-Around"  # 'Offensive Upside', 'Defensive Reliability', 'Skating/Pace', 'Draft Projection'

class AISynthesisResponse(BaseModel):
    prospect_id: str
    prospect_name: str
    executive_summary: str
    consensus_tier: str
    key_strengths: List[str]
    critical_concerns: List[str]
    nhl_role_projection: str
    ncaa_impact_projection: str
    suggested_draft_range: str
    scout_divergence_summary: str
