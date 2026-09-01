from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class ScoutGrades(BaseModel):
    skating_speed: int = Field(50, ge=20, le=80)
    skating_agility: int = Field(50, ge=20, le=80)
    skating_edges: int = Field(50, ge=20, le=80)
    puck_skills: int = Field(50, ge=20, le=80)
    passing_vision: int = Field(50, ge=20, le=80)
    hockey_iq: int = Field(50, ge=20, le=80)
    shot_release: int = Field(50, ge=20, le=80)
    shot_power: int = Field(50, ge=20, le=80)
    compete_motor: int = Field(50, ge=20, le=80)
    physicality: int = Field(50, ge=20, le=80)
    defensive_reliability: int = Field(50, ge=20, le=80)
    faceoffs: Optional[int] = Field(None, ge=20, le=80)
    
    @property
    def overall_grade(self) -> float:
        grades = [
            self.skating_speed, self.skating_agility, self.skating_edges,
            self.puck_skills, self.passing_vision, self.hockey_iq,
            self.shot_release, self.shot_power, self.compete_motor,
            self.physicality, self.defensive_reliability
        ]
        return round(sum(grades) / len(grades), 1)

class ShotEvent(BaseModel):
    id: str
    x: float  # -100 to 100 on NHL 200ft rink
    y: float  # -42.5 to 42.5 on NHL 85ft rink
    period: int
    time: str
    shot_type: str  # 'wrist', 'slap', 'snap', 'backhand', 'deflection', 'wrap'
    result: str  # 'goal', 'saved', 'blocked', 'missed'
    xg: float  # Expected goals
    is_rush: bool = False
    is_powerplay: bool = False
    danger_zone: str = "medium"  # 'high', 'medium', 'perimeter'

class TransitionStats(BaseModel):
    controlled_entries_per_60: float
    controlled_entry_success_pct: float
    controlled_exits_per_60: float
    controlled_exit_success_pct: float
    entry_denials_per_60: float
    puck_battle_win_pct: float
    puck_recoveries_under_pressure: float
    high_danger_passes_per_60: float

class Biometrics(BaseModel):
    height_in: int
    height_display: str
    weight_lbs: int
    wingspan_in: Optional[float] = None
    body_fat_pct: Optional[float] = None
    top_skating_speed_mph: float
    standing_broad_jump_in: Optional[float] = None
    grip_strength_lbs: Optional[int] = None

class VideoClip(BaseModel):
    id: str
    title: str
    timestamp: str
    period: int
    tag: str
    notes: str
    thumbnail_color: str = "#1e293b"

class ScoutReport(BaseModel):
    id: str
    scout_name: str
    scout_role: str
    date: str
    game: str
    overall_rating: int
    summary: str
    strengths: List[str]
    weaknesses: List[str]
    nhl_comparable: str
    projected_role: str

class Prospect(BaseModel):
    id: str
    first_name: str
    last_name: str
    position: str
    shoots_catches: str
    birth_date: str
    nationality: str
    flag_code: str
    current_team: str
    league: str
    draft_year: int
    draft_status: str
    college_commitment: Optional[str] = None
    headshot_url: Optional[str] = None
    
    games_played: int
    goals: int
    assists: int
    points: int
    plus_minus: int
    penalty_minutes: int
    points_per_game: float
    
    biometrics: Biometrics
    grades: ScoutGrades
    transition_stats: TransitionStats
    shots: List[ShotEvent]
    video_clips: List[VideoClip]
    scout_reports: List[ScoutReport]
    
    tier: int = 1
    consensus_rank: int
    regional_rank: Optional[int] = None
    analytics_rank: Optional[int] = None
    character_grade: str = "A"
    medical_grade: str = "Clean"
    league_tier: str = "CHL" # 'NHL', 'NCAA_D1', 'NCAA_D3', 'ACHA', 'WHL', 'OHL', 'QMJHL', 'USHL', 'NAHL', 'EURO', 'PRO'
    team_status: str = "Active Roster" # 'Active Roster', 'Free Agent (Looking for Team)', 'Transfer Portal', 'Uncommitted Junior'
    status_badge: Optional[str] = "Active"

    what_they_do: Optional[str] = None
    how_they_do_it: Optional[str] = None
    percentile_rankings: Optional[Dict[str, float]] = None
    voice_memos: Optional[List[Dict[str, Any]]] = None

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
