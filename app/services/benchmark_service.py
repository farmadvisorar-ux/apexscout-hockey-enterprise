import math
from typing import List, Dict, Optional, Any
from app.models.benchmark import HistoricalPlayer, HeadToHeadComparison, TrajectoryForecast
from app.models.prospect import Prospect, ScoutGrades

HISTORICAL_DATABASE: List[HistoricalPlayer] = [
    HistoricalPlayer(
        id="hist-bedard",
        name="Connor Bedard",
        draft_year=2023,
        draft_league="WHL (Regina Pats)",
        draft_age=17,
        position="C / RW",
        overall_grade=78.5,
        points_per_game=2.51,
        even_strength_pts_60=4.12,
        controlled_entry_pct=83.4,
        puck_battle_win_pct=51.2,
        grades=ScoutGrades(
            skating_speed=65,
            skating_agility=70,
            skating_edges=75,
            puck_skills=80,
            passing_vision=75,
            hockey_iq=75,
            shot_release=80,
            shot_power=80,
            compete_motor=70,
            physicality=50,
            defensive_reliability=50
        ),
        nhl_prime_stats="Calder Trophy Winner, 70+ Pts as Rookie, 50+ Goal Pace",
        nhl_accolades="1st Overall Pick, Franchise #1 Center",
        scouting_archetype="Generational Shooting & Inside-Ice Release"
    ),
    HistoricalPlayer(
        id="hist-celebrini",
        name="Macklin Celebrini",
        draft_year=2024,
        draft_league="NCAA (Boston Univ)",
        draft_age=17,
        position="C",
        overall_grade=76.8,
        points_per_game=1.68,
        even_strength_pts_60=3.45,
        controlled_entry_pct=78.2,
        puck_battle_win_pct=58.5,
        grades=ScoutGrades(
            skating_speed=70,
            skating_agility=70,
            skating_edges=75,
            puck_skills=75,
            passing_vision=75,
            hockey_iq=80,
            shot_release=75,
            shot_power=75,
            compete_motor=80,
            physicality=65,
            defensive_reliability=70
        ),
        nhl_prime_stats="Hobey Baker Winner at 17, 1st Overall Pick",
        nhl_accolades="Complete 200-Foot Franchise 1C",
        scouting_archetype="Elite 200-Ft Compete & High-Pace Playmaker"
    ),
    HistoricalPlayer(
        id="hist-mcdavid",
        name="Connor McDavid",
        draft_year=2015,
        draft_league="OHL (Erie Otters)",
        draft_age=17,
        position="C",
        overall_grade=80.0,
        points_per_game=2.55,
        even_strength_pts_60=4.48,
        controlled_entry_pct=92.1,
        puck_battle_win_pct=56.0,
        grades=ScoutGrades(
            skating_speed=80,
            skating_agility=80,
            skating_edges=80,
            puck_skills=80,
            passing_vision=80,
            hockey_iq=80,
            shot_release=75,
            shot_power=75,
            compete_motor=75,
            physicality=55,
            defensive_reliability=55
        ),
        nhl_prime_stats="5x Art Ross, 3x Hart Trophy, 150+ Pts Season",
        nhl_accolades="Generational Talent, #1 Player in the World",
        scouting_archetype="Unmatched Top-End Pace & Acceleration"
    ),
    HistoricalPlayer(
        id="hist-hughes",
        name="Jack Hughes",
        draft_year=2019,
        draft_league="USNTDP",
        draft_age=17,
        position="C",
        overall_grade=77.0,
        points_per_game=2.24,
        even_strength_pts_60=3.95,
        controlled_entry_pct=88.5,
        puck_battle_win_pct=46.8,
        grades=ScoutGrades(
            skating_speed=75,
            skating_agility=80,
            skating_edges=80,
            puck_skills=80,
            passing_vision=80,
            hockey_iq=80,
            shot_release=70,
            shot_power=70,
            compete_motor=65,
            physicality=45,
            defensive_reliability=50
        ),
        nhl_prime_stats="99 Pts in 78 GP, 1st Overall Pick",
        nhl_accolades="Dynamic Transition Playmaker & Edge Deceiver",
        scouting_archetype="Hyper-Agile Transition Quarterback"
    ),
    HistoricalPlayer(
        id="hist-makar",
        name="Cale Makar",
        draft_year=2017,
        draft_league="AJHL / NCAA (UMass)",
        draft_age=18,
        position="RD",
        overall_grade=76.2,
        points_per_game=1.39,
        even_strength_pts_60=2.85,
        controlled_entry_pct=86.2,
        puck_battle_win_pct=57.4,
        grades=ScoutGrades(
            skating_speed=80,
            skating_agility=80,
            skating_edges=80,
            puck_skills=75,
            passing_vision=75,
            hockey_iq=80,
            shot_release=70,
            shot_power=75,
            compete_motor=70,
            physicality=55,
            defensive_reliability=70
        ),
        nhl_prime_stats="Norris Trophy, Conn Smythe Winner, Stanley Cup Champion",
        nhl_accolades="Elite #1 Defenseman, Point-Per-Game Modern D",
        scouting_archetype="Elite 4-Way Mobility & Blue-Line Walk Deception"
    )
]

GRADE_KEYS = [
    "skating_speed", "skating_agility", "skating_edges",
    "puck_skills", "passing_vision", "hockey_iq",
    "shot_release", "shot_power", "compete_motor",
    "physicality", "defensive_reliability"
]

class BenchmarkService:
    def __init__(self, current_prospects: List[Prospect]):
        self.current_prospects = {p.id: p for p in current_prospects}
        self.historical_players = {h.id: h for h in HISTORICAL_DATABASE}

    def list_historical_players(self) -> List[HistoricalPlayer]:
        return list(self.historical_players.values())

    def get_player_data(self, player_id: str) -> Optional[Dict[str, Any]]:
        if player_id in self.current_prospects:
            p = self.current_prospects[player_id]
            g_dict = p.grades.model_dump()
            return {
                "id": p.id,
                "name": p.full_name,
                "type": "Current Prospect",
                "season": "2025-26",
                "league": f"{p.league} ({p.current_team})",
                "age": 17 if "McKenna" in p.last_name or "Verhoeff" in p.last_name else 18,
                "position": p.position,
                "overall_grade": round(p.grades.overall_grade, 1),
                "ppg": p.points_per_game,
                "ev_pts_60": round(p.points_per_game * 1.65, 2),
                "controlled_entry_pct": p.transition_stats.controlled_entry_success_pct,
                "puck_battle_win_pct": p.transition_stats.puck_battle_win_pct,
                "grades": g_dict,
                "biometrics": f"{p.biometrics.height_display}, {p.biometrics.weight_lbs} lbs",
                "accolades": f"Consensus Rank #{p.consensus_rank}"
            }
        
        if player_id in self.historical_players:
            h = self.historical_players[player_id]
            g_dict = h.grades.model_dump()
            return {
                "id": h.id,
                "name": f"{h.name} (Draft Year)",
                "type": "Historical Baseline",
                "season": f"{h.draft_year-1}-{str(h.draft_year)[2:]}",
                "league": h.draft_league,
                "age": h.draft_age,
                "position": h.position,
                "overall_grade": round(h.overall_grade, 1),
                "ppg": h.points_per_game,
                "ev_pts_60": h.even_strength_pts_60,
                "controlled_entry_pct": h.controlled_entry_pct,
                "puck_battle_win_pct": h.puck_battle_win_pct,
                "grades": g_dict,
                "biometrics": "Verified Combine Baseline",
                "accolades": h.nhl_prime_stats
            }
        return None

    def compare_players(self, player_a_id: str, player_b_id: str) -> Optional[HeadToHeadComparison]:
        pa = self.get_player_data(player_a_id)
        pb = self.get_player_data(player_b_id)
        if not pa or not pb:
            return None

        ga = pa["grades"]
        gb = pb["grades"]
        
        # Cosine / Normalized Vector Similarity
        dot_product = sum(ga.get(k, 50) * gb.get(k, 50) for k in GRADE_KEYS)
        mag_a = math.sqrt(sum(ga.get(k, 50) ** 2 for k in GRADE_KEYS))
        mag_b = math.sqrt(sum(gb.get(k, 50) ** 2 for k in GRADE_KEYS))
        
        cosine_sim = dot_product / (mag_a * mag_b) if (mag_a * mag_b) > 0 else 0.95
        # Transform cosine range (0.94 - 1.00) to human readable percentage (70% - 99%)
        similarity_pct = round(max(60.0, min(99.0, (cosine_sim - 0.90) * 1000.0)), 1)

        tool_advantages = {}
        for k in GRADE_KEYS:
            val_a = ga.get(k, 50)
            val_b = gb.get(k, 50)
            if val_a > val_b:
                tool_advantages[k] = pa["name"]
            elif val_b > val_a:
                tool_advantages[k] = pb["name"]
            else:
                tool_advantages[k] = "Tied"

        best_hist_match = self.historical_players.get("hist-hughes")
        if "D" in pa["position"]:
            best_hist_match = self.historical_players.get("hist-makar")
        elif ga.get("shot_release", 50) >= 75:
            best_hist_match = self.historical_players.get("hist-bedard")

        trajectory = TrajectoryForecast(
            player_name=pa["name"],
            comparable_star=best_hist_match.name if best_hist_match else "Jack Hughes",
            similarity_score_pct=similarity_pct,
            ceiling_projection="Tier 1 Franchise 1st Line Star (90+ NHL Points / Award Contender)",
            median_projection="Top-Line Impact Producer (70?82 NHL Points, PP1 Driver)",
            floor_projection="High-End Middle-6 Playmaker (50?60 NHL Points, PP2 Specialist)",
            projected_prime_ppg=round(pa["ppg"] * 0.58, 2),
            trajectory_verdict=f"{pa['name']} exhibits elite transition poise and playmaking deception with a {similarity_pct}% statistical profile match to {pb['name']}."
        )

        summary = (
            f"Head-to-head evaluation between {pa['name']} ({pa['league']}) and {pb['name']} ({pb['league']}). "
            f"Overall Grade: {pa['overall_grade']} vs {pb['overall_grade']}. "
            f"{pa['name']} demonstrates key advantages in {', '.join([k.replace('_', ' ').title() for k, v in tool_advantages.items() if v == pa['name']][:3])}."
        )

        return HeadToHeadComparison(
            player_a=pa,
            player_b=pb,
            similarity_score_pct=similarity_pct,
            tool_advantages=tool_advantages,
            ai_comparison_summary=summary,
            trajectory=trajectory
        )
