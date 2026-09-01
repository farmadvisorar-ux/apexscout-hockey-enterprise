import math
import random
from typing import List, Dict, Optional, Any
from app.models.draft_sim import DraftPick, TradeEvaluationResult, DraftSimulationState
from app.models.prospect import Prospect

# Standard NHL Empirical Draft Pick Value Lookup (Top 64 Picks)
NHL_PICK_VALUES = {
    1: 1000, 2: 720, 3: 600, 4: 530, 5: 480, 6: 440, 7: 405, 8: 375, 9: 350, 10: 330,
    11: 310, 12: 295, 13: 280, 14: 268, 15: 256, 16: 245, 17: 235, 18: 226, 19: 218, 20: 210,
    21: 202, 22: 195, 23: 188, 24: 182, 25: 176, 26: 170, 27: 165, 28: 160, 29: 155, 30: 150,
    31: 146, 32: 142, 33: 138, 34: 134, 35: 130, 36: 126, 37: 122, 38: 118, 39: 114, 40: 110,
    41: 106, 42: 102, 43: 98, 44: 94, 45: 90, 46: 86, 47: 82, 48: 78, 49: 75, 50: 72,
    51: 69, 52: 66, 53: 63, 54: 60, 55: 57, 56: 54, 57: 51, 58: 48, 59: 45, 60: 42,
    61: 39, 62: 36, 63: 33, 64: 30
}

def get_pick_point_value(overall_pick: int) -> int:
    if overall_pick in NHL_PICK_VALUES:
        return NHL_PICK_VALUES[overall_pick]
    # Exponential decay for rounds 3-7
    val = round(30.0 * math.exp(-0.02 * (overall_pick - 64)))
    return max(val, 2)

NHL_TEAMS_ORDER = [
    ("San Jose Sharks", "SJS", "#006D75"),
    ("Chicago Blackhawks", "CHI", "#CF0A2C"),
    ("Anaheim Ducks", "ANA", "#F47A38"),
    ("Columbus Blue Jackets", "CBJ", "#002654"),
    ("Montreal Canadiens", "MTL", "#AF1E2D"),
    ("Utah Hockey Club", "UTA", "#6CACE4"),
    ("Ottawa Senators", "OTT", "#DA1A32"),
    ("Seattle Kraken", "SEA", "#96D8D2"),
    ("Calgary Flames", "CGY", "#C8102E"),
    ("New Jersey Devils", "NJD", "#CE1126"),
    ("Buffalo Sabres", "BUF", "#002654"),
    ("Philadelphia Flyers", "PHI", "#F74902"),
    ("Minnesota Wild", "MIN", "#154734"),
    ("Detroit Red Wings", "DET", "#CE1126"),
    ("St. Louis Blues", "STL", "#002F87"),
    ("Washington Capitals", "WSH", "#041E42"),
    ("New York Islanders", "NYI", "#00539B"),
    ("Vegas Golden Knights", "VGK", "#B4975A"),
    ("Los Angeles Kings", "LAK", "#111111"),
    ("Nashville Predators", "NSH", "#FFB81C"),
    ("Pittsburgh Penguins", "PIT", "#FCB514"),
    ("Toronto Maple Leafs", "TOR", "#00205B"),
    ("Colorado Avalanche", "COL", "#6F263D"),
    ("Boston Bruins", "BOS", "#FFB81C"),
    ("Tampa Bay Lightning", "TBL", "#002868"),
    ("Carolina Hurricanes", "CAR", "#CC0000"),
    ("Winnipeg Jets", "WPG", "#041E42"),
    ("Vancouver Canucks", "VAN", "#00205B"),
    ("Dallas Stars", "DAL", "#006847"),
    ("New York Rangers", "NYR", "#0038A8"),
    ("Edmonton Oilers", "EDM", "#041E42"),
    ("Florida Panthers", "FLA", "#041E42")
]

class DraftTradeEngine:
    def __init__(self, prospects: List[Prospect]):
        self.prospects = {p.id: p for p in prospects}
        self.drafted_ids = set()
        self.current_pick_index = 0
        self.user_team = "San Jose Sharks"
        self.time_remaining = 180
        self.is_paused = False
        self.draft_order = self._generate_initial_order()
        
    def _generate_initial_order(self) -> List[DraftPick]:
        order = []
        for i, (name, abbr, color) in enumerate(NHL_TEAMS_ORDER):
            overall = i + 1
            order.append(DraftPick(
                id=f"pick-{overall}",
                overall_pick=overall,
                round_num=1,
                pick_in_round=overall,
                team_name=name,
                team_abbr=abbr,
                team_color=color,
                is_user_team=(overall == 1), # Default user starts with #1
                selected_prospect_id=None,
                selected_prospect_name=None,
                selected_prospect_pos=None,
                point_value=get_pick_point_value(overall)
            ))
        return order

    def reset_draft(self):
        self.drafted_ids = set()
        self.current_pick_index = 0
        self.time_remaining = 180
        self.draft_order = self._generate_initial_order()
        return self.get_state()

    def get_state(self) -> DraftSimulationState:
        recent = [p for p in self.draft_order if p.selected_prospect_id]
        return DraftSimulationState(
            current_pick_index=self.current_pick_index,
            total_picks=len(self.draft_order),
            time_remaining_seconds=self.time_remaining,
            is_paused=self.is_paused,
            user_team=self.user_team,
            draft_order=self.draft_order,
            recent_selections=recent
        )

    def get_available_prospects(self) -> List[Prospect]:
        return [p for p in self.prospects.values() if p.id not in self.drafted_ids]

    def make_selection(self, prospect_id: str) -> Optional[DraftPick]:
        if self.current_pick_index >= len(self.draft_order):
            return None
            
        prospect = self.prospects.get(prospect_id)
        if not prospect or prospect_id in self.drafted_ids:
            return None
            
        pick = self.draft_order[self.current_pick_index]
        pick.selected_prospect_id = prospect.id
        pick.selected_prospect_name = prospect.full_name
        pick.selected_prospect_pos = prospect.position
        
        self.drafted_ids.add(prospect.id)
        self.current_pick_index += 1
        self.time_remaining = 180
        return pick

    def auto_pick_cpu(self) -> Optional[DraftPick]:
        if self.current_pick_index >= len(self.draft_order):
            return None
            
        available = self.get_available_prospects()
        if not available:
            return None
            
        # Top 3 available prospects by consensus
        sorted_avail = sorted(available, key=lambda x: x.consensus_rank)
        top_candidates = sorted_avail[:3]
        
        # Weighted choice favoring highest consensus
        chosen = random.choices(top_candidates, weights=[0.70, 0.20, 0.10] if len(top_candidates)==3 else [1.0])[0]
        return self.make_selection(chosen.id)

    def evaluate_trade(self, team_a_picks: List[int], team_b_picks: List[int], team_a_name: str = "User Team", team_b_name: str = "Trade Partner") -> TradeEvaluationResult:
        val_a = sum(get_pick_point_value(p) for p in team_a_picks)
        val_b = sum(get_pick_point_value(p) for p in team_b_picks)
        diff = val_a - val_b
        pct_diff = round((diff / max(val_b, 1)) * 100, 1)

        if abs(pct_diff) <= 8.0:
            rating = "Fair Market Value"
            verdict = "Balanced trade aligned with empirical NHL pick value standards."
            ai_rec = "ACCEPT / APPROVE: Fair swap with balanced surplus value."
        elif diff > 0:
            if pct_diff <= 25.0:
                rating = "Slight Overpay"
                verdict = f"{team_a_name} is giving up {diff} surplus points (+{pct_diff}% premium)."
                ai_rec = "CAUTION: Slight premium paid to move up; acceptable if targeting a Tier 1 franchise player."
            else:
                rating = "Significant Overpay"
                verdict = f"{team_a_name} is overpaying heavily (+{pct_diff}% over market value)."
                ai_rec = "REJECT / COUNTER: High overpay. Consider asking for a future 2nd or 3rd round pick back."
        else:
            rating = "A+ Value Steal"
            verdict = f"{team_a_name} gains {abs(diff)} surplus points (acquiring {abs(pct_diff)}% extra value)."
            ai_rec = "STRONG ACCEPT: Elite value capture for your organization."

        return TradeEvaluationResult(
            team_a_name=team_a_name,
            team_b_name=team_b_name,
            team_a_picks=team_a_picks,
            team_b_picks=team_b_picks,
            team_a_total_value=val_a,
            team_b_total_value=val_b,
            point_differential=diff,
            percentage_diff=pct_diff,
            fairness_rating=rating,
            verdict=verdict,
            ai_recommendation=ai_rec
        )
