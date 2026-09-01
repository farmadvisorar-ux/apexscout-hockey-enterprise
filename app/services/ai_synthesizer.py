from typing import Dict, Any
from app.models.prospect import Prospect
from app.models.report import AISynthesisResponse

def synthesize_prospect_dossier(prospect: Prospect, focus_area: str = 'All-Around') -> AISynthesisResponse:
    g = prospect.grades
    t = prospect.transition_stats
    b = prospect.biometrics
    
    # Calculate executive narrative based on authentic grading
    skate_score = round((g.skating_speed + g.skating_agility + g.skating_edges) / 3, 1)
    iq_score = g.hockey_iq
    compete_score = g.compete_motor
    
    executive_summary = (
        f'{prospect.full_name} ({prospect.position}, {prospect.current_team}) is an elite {prospect.draft_status} prospect '
        f'displaying grade {skate_score}/80 mobility and grade {iq_score}/80 hockey sense. In {prospect.games_played} games, '
        f'he has generated {prospect.points} points ({prospect.points_per_game} PPG) while maintaining a {t.controlled_entry_success_pct}% '
        f'controlled zone entry rate and winning {t.puck_battle_win_pct}% of puck battles. '
        f'Multiple scouting reports consistently highlight his deceptive puck distribution and high-danger chance creation.'
    )
    
    strengths = []
    concerns = []
    
    if g.skating_speed >= 70:
        strengths.append(f'High-End Speed & Pace ({b.top_skating_speed_mph} MPH top speed)')
    if g.hockey_iq >= 75:
        strengths.append(f'Cerebral Processing & Ice Vision (Grade {g.hockey_iq}/80)')
    if g.puck_skills >= 75:
        strengths.append(f'Dynamic Stickhandling & Puck Protection (Grade {g.puck_skills}/80)')
    if t.puck_battle_win_pct >= 65:
        strengths.append(f'Dominant Wall Play & Puck Recovery ({t.puck_battle_win_pct}% battle win rate)')
    if g.shot_power >= 70 or g.shot_release >= 70:
        strengths.append(f'Lethal Shot Threat & Release Quickness (Grade {max(g.shot_power, g.shot_release)}/80)')
    if g.defensive_reliability >= 70:
        strengths.append(f'200-Foot Defensive Reliability & Stick Checking (Grade {g.defensive_reliability}/80)')
        
    if g.physicality < 55:
        concerns.append(f'Physical Frame & Strength ({b.weight_lbs} lbs): Needs core development for NHL-level net-front battles')
    if g.defensive_reliability < 60:
        concerns.append('Occasional defensive zone rotational lapses on delayed rushes')
    if g.compete_motor < 65:
        concerns.append('Motor consistency during back-to-back road stretches')
        
    if not concerns:
        concerns.append('Minor puck management risks when forcing low-percentage seam passes')
        
    # Projected ranges
    if prospect.consensus_rank <= 3:
        draft_range = 'Top 1-3 Overall (Franchise Tier)'
        tier_label = 'Tier 1 - Franchise Cornerstone'
        nhl_role = f'1st Line / #1 Pairing All-Situations Driver (PP1/PK1)'
        ncaa_role = f'Hobey Baker Finalist / Game 1 Impact Top-Line Anchor'
    elif prospect.consensus_rank <= 10:
        draft_range = 'Top 4-10 Overall (High Impact)'
        tier_label = 'Tier 1/2 - Top-Line / Top-Pair Ceiling'
        nhl_role = f'Top-6 Forward or Top-4 Defenseman with PP capability'
        ncaa_role = f'All-Conference 1st Team Contender / Immediate 30+ Pt Producer'
    elif prospect.consensus_rank <= 25:
        draft_range = 'Mid-to-Late 1st Round'
        tier_label = 'Tier 2 - Top-6 / Middle-6 Two-Way'
        nhl_role = f'Middle-6 Core Contributor with specialized PP or PK utility'
        ncaa_role = f'Top-6 Regular / Primary Penalty Killer & Zone-Exit Stabilizer'
    else:
        draft_range = '2nd Round - High-Ceiling Target'
        tier_label = 'Tier 3 - Developmental Prospect'
        nhl_role = f'Depth / Role Player with top-9 upside'
        ncaa_role = f'Valuable Roster Contributor with 2-3 Year Development Runway'
        
    divergence = (
        f'Scout Consensus Spread: Rank #{prospect.consensus_rank} (Regional: #{prospect.regional_rank or prospect.consensus_rank}, '
        f'Analytics: #{prospect.analytics_rank or prospect.consensus_rank}). Regional scout values his in-game poise, '
        f'while advanced models reward his {t.controlled_entries_per_60}/60 entry generation rate.'
    )
    
    return AISynthesisResponse(
        prospect_id=prospect.id,
        prospect_name=prospect.full_name,
        executive_summary=executive_summary,
        consensus_tier=tier_label,
        key_strengths=strengths,
        critical_concerns=concerns,
        nhl_role_projection=nhl_role,
        ncaa_impact_projection=ncaa_role,
        suggested_draft_range=draft_range,
        scout_divergence_summary=divergence
    )
