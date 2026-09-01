from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class ForwardLine(BaseModel):
    line_number: int  # 1, 2, 3, 4
    lw_id: Optional[str] = None
    c_id: Optional[str] = None
    rw_id: Optional[str] = None
    lw_name: str = 'Empty'
    c_name: str = 'Empty'
    rw_name: str = 'Empty'
    synergy_score: int = 75
    playstyle_tag: str = 'Balanced Attack'
    projected_xg_per_60: float = 3.2
    projected_xga_per_60: float = 2.1
    chemistry_notes: str = 'Balanced transition pace and shooting balance.'

class DefensePair(BaseModel):
    pair_number: int  # 1, 2, 3
    ld_id: Optional[str] = None
    rd_id: Optional[str] = None
    ld_name: str = 'Empty'
    rd_name: str = 'Empty'
    synergy_score: int = 78
    puck_moving_grade: int = 70
    rush_suppression_pct: float = 68.5
    handedness_balance: str = 'Natural L-R'
    chemistry_notes: str = 'High transition efficiency with balanced gap control.'

class SpecialTeamsUnit(BaseModel):
    unit_name: str  # 'PP1', 'PP2', 'PK1', 'PK2'
    formation: str  # '1-3-1 Umbrella', 'Overload', 'Box-and-One', 'Wedge'
    player_ids: List[str]
    player_names: List[str]
    effectiveness_pct: float
    tactical_role_breakdown: Dict[str, str]

class LineupEvaluationResponse(BaseModel):
    overall_chemistry_rating: int
    offensive_flow_score: int
    defensive_containment_score: int
    transition_pace_mph: float
    projected_win_differential: float
    cap_or_nil_used: float
    cap_or_nil_ceiling: float
    cap_compliant: bool
    roster_size: int
    forward_lines: List[ForwardLine]
    defense_pairs: List[DefensePair]
    goalies: List[str]
    special_teams: List[SpecialTeamsUnit]
    tactical_ai_insights: List[str]
