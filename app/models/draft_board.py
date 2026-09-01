from typing import List, Dict, Optional
from pydantic import BaseModel

class DraftTier(BaseModel):
    tier_number: int
    tier_name: str
    description: str
    color_hex: str
    prospect_ids: List[str]

class ConsensusVariance(BaseModel):
    prospect_id: str
    player_name: str
    consensus_rank: int
    regional_scout_rank: int
    analytics_rank: int
    variance_score: float  # Absolute standard deviation across scouts
    divergence_type: str  # 'Scout Bull' (Regional much higher), 'Analytics Bull' (Model loves, scouts low), 'Consensus Lock'
    notes: str

class DraftBoardState(BaseModel):
    id: str
    team_name: str
    season: str
    tiers: List[DraftTier]
    variances: List[ConsensusVariance]
