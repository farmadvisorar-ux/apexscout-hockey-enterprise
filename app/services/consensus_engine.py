import statistics
from typing import List
from app.models.draft_board import ConsensusVariance, DraftTier, DraftBoardState
from app.models.prospect import Prospect

def calculate_consensus_variances(prospects: List[Prospect]) -> List[ConsensusVariance]:
    variances = []
    for p in prospects:
        reg = p.regional_rank if p.regional_rank is not None else p.consensus_rank
        ana = p.analytics_rank if p.analytics_rank is not None else p.consensus_rank
        ranks = [p.consensus_rank, reg, ana]
        
        # Calculate standard deviation
        stdev = round(statistics.stdev(ranks) if len(ranks) > 1 else 0.0, 2)
        
        # Determine divergence
        if reg <= p.consensus_rank - 3:
            div_type = 'Scout Bull'
            notes = f'Regional scout ranks {p.last_name} significantly higher (#{reg}) than consensus (#{p.consensus_rank}).'
        elif ana <= p.consensus_rank - 3:
            div_type = 'Analytics Bull'
            notes = f'Micro-stat models heavily favor {p.last_name} (#{ana}) over consensus (#{p.consensus_rank}).'
        elif reg >= p.consensus_rank + 3 or ana >= p.consensus_rank + 3:
            div_type = 'High Variance Caution'
            notes = f'Scouts have mixed opinions on upside vs floor. Wide ranking spread ({min(ranks)} to {max(ranks)}).'
        else:
            div_type = 'Consensus Lock'
            notes = f'High unanimity across scouts and analytics models (spread: {min(ranks)} - {max(ranks)}).'
            
        variances.append(ConsensusVariance(
            prospect_id=p.id,
            player_name=p.full_name,
            consensus_rank=p.consensus_rank,
            regional_scout_rank=reg,
            analytics_rank=ana,
            variance_score=stdev,
            divergence_type=div_type,
            notes=notes
        ))
    return sorted(variances, key=lambda x: x.variance_score, reverse=True)

def build_draft_board_state(prospects: List[Prospect]) -> DraftBoardState:
    t1_ids = [p.id for p in prospects if p.tier == 1]
    t2_ids = [p.id for p in prospects if p.tier == 2]
    t3_ids = [p.id for p in prospects if p.tier == 3]
    t4_ids = [p.id for p in prospects if p.tier >= 4]
    
    tiers = [
        DraftTier(tier_number=1, tier_name='Tier 1: Franchise Impact & Elite Top-Pair', description='Generational or elite top-line / top-pair upside. Clear game-breakers.', color_hex='#3b82f6', prospect_ids=t1_ids),
        DraftTier(tier_number=2, tier_name='Tier 2: Top-6 Forward / Top-4 Defenseman', description='Projected top-half lineup players with high probability NHL impact.', color_hex='#10b981', prospect_ids=t2_ids),
        DraftTier(tier_number=3, tier_name='Tier 3: Middle-6 / Specialist / High Ceiling', description='Solid middle-lineup projection with specialized tools.', color_hex='#f59e0b', prospect_ids=t3_ids),
        DraftTier(tier_number=4, tier_name='Tier 4: Depth Pipeline & Late-Round Flyers', description='Developmental prospects with specific high-end physical or tactical traits.', color_hex='#8b5cf6', prospect_ids=t4_ids),
    ]
    
    variances = calculate_consensus_variances(prospects)
    return DraftBoardState(
        id='board-2026-nhl',
        team_name='Organization War Room',
        season='2026-27',
        tiers=tiers,
        variances=variances
    )
