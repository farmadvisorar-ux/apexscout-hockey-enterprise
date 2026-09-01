from typing import List, Optional
from pydantic import BaseModel

class DraftPick(BaseModel):
    id: str
    overall_pick: int
    round_num: int
    pick_in_round: int
    team_name: str
    team_abbr: str
    team_color: str
    is_user_team: bool = False
    selected_prospect_id: Optional[str] = None
    selected_prospect_name: Optional[str] = None
    selected_prospect_pos: Optional[str] = None
    point_value: int

class TradeEvaluationResult(BaseModel):
    team_a_name: str
    team_b_name: str
    team_a_picks: List[int]
    team_b_picks: List[int]
    team_a_total_value: int
    team_b_total_value: int
    point_differential: int
    percentage_diff: float
    fairness_rating: str  # 'A+ Value Steal', 'Fair Market Value', 'Slight Overpay', 'Significant Overpay'
    verdict: str
    ai_recommendation: str

class DraftSimulationState(BaseModel):
    current_pick_index: int
    total_picks: int
    time_remaining_seconds: int
    is_paused: bool
    user_team: str
    draft_order: List[DraftPick]
    recent_selections: List[DraftPick]
