from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from app.models.prospect import ScoutGrades

class HistoricalPlayer(BaseModel):
    id: str
    name: str
    draft_year: int
    draft_league: str
    draft_age: int
    position: str
    overall_grade: float
    points_per_game: float
    even_strength_pts_60: float
    controlled_entry_pct: float
    puck_battle_win_pct: float
    grades: ScoutGrades
    nhl_prime_stats: str
    nhl_accolades: str
    scouting_archetype: str

class TrajectoryForecast(BaseModel):
    player_name: str
    comparable_star: str
    similarity_score_pct: float
    ceiling_projection: str
    median_projection: str
    floor_projection: str
    projected_prime_ppg: float
    trajectory_verdict: str

class HeadToHeadComparison(BaseModel):
    player_a: Dict[str, Any]
    player_b: Dict[str, Any]
    similarity_score_pct: float
    tool_advantages: Dict[str, str] # e.g. {"skating": "player_a", "shot": "player_b"}
    ai_comparison_summary: str
    trajectory: TrajectoryForecast
