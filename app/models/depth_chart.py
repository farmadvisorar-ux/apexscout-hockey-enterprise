from typing import List, Optional
from pydantic import BaseModel

class RosterSlot(BaseModel):
    position_slot: str  # '1LW', '1C', '1RW', '1LD', '1RD', 'G1', etc.
    player_id: Optional[str] = None
    player_name: str
    age: int
    contract_status: str  # 'NHL Roster', 'AHL Top Line', 'NCAA Junior', 'CHL', 'Draft Right (Unsigned)'
    current_overall: int  # 20-80
    projected_overall: int  # 20-80
    elc_slide_active: bool = False

class DepthChartProjection(BaseModel):
    team_name: str
    projected_season: str  # '2026-27', '2027-28', '2028-29'
    forward_lines: List[List[RosterSlot]]
    defense_pairs: List[List[RosterSlot]]
    goalies: List[RosterSlot]
    pipeline_prospects: List[RosterSlot]
