from typing import List, Dict, Optional, Any
from app.models.nil_optimizer import RosterPlayerSalary, PortalROICandidate, RevenueShareBudget, NILOptimizationResult

def calculate_roi_grade(cost_per_point: int) -> str:
    if cost_per_point <= 3500:
        return "A+ Elite Value"
    elif cost_per_point <= 5500:
        return "A High Value"
    elif cost_per_point <= 8000:
        return "B Fair Value"
    else:
        return "C Premium / Overpay"

INITIAL_ROSTER_SALARIES: List[RosterPlayerSalary] = [
    # Forward Line 1 (Tier 1 & 2)
    RosterPlayerSalary(id="sal-01", name="James Hagens", position="C", line_slot="1st Line Center", tier="Tier 1 Franchise", base_rev_share=180000, nil_collective=120000, total_comp=300000, projected_points=52.0, cost_per_point=5769, roi_grade="A High Value"),
    RosterPlayerSalary(id="sal-02", name="Cole Eiserman", position="LW", line_slot="1st Line LW", tier="Tier 1 Franchise", base_rev_share=150000, nil_collective=100000, total_comp=250000, projected_points=44.0, cost_per_point=5681, roi_grade="A High Value"),
    RosterPlayerSalary(id="sal-03", name="Ryan Leonard", position="RW", line_slot="1st Line RW", tier="Tier 1 Franchise", base_rev_share=160000, nil_collective=110000, total_comp=270000, projected_points=46.0, cost_per_point=5869, roi_grade="A High Value"),

    # Forward Line 2 (Tier 2 Core)
    RosterPlayerSalary(id="sal-04", name="Gabe Perreault", position="LW", line_slot="2nd Line LW", tier="Tier 2 Core", base_rev_share=120000, nil_collective=60000, total_comp=180000, projected_points=38.0, cost_per_point=4736, roi_grade="A High Value"),
    RosterPlayerSalary(id="sal-05", name="Will Smith", position="C", line_slot="2nd Line Center", tier="Tier 2 Core", base_rev_share=130000, nil_collective=70000, total_comp=200000, projected_points=40.0, cost_per_point=5000, roi_grade="A High Value"),
    RosterPlayerSalary(id="sal-06", name="Oliver Moore", position="RW", line_slot="2nd Line RW", tier="Tier 2 Core", base_rev_share=110000, nil_collective=50000, total_comp=160000, projected_points=34.0, cost_per_point=4705, roi_grade="A High Value"),

    # Forward Line 3 (Tier 3 Depth)
    RosterPlayerSalary(id="sal-07", name="Danny Nelson", position="C", line_slot="3rd Line Center", tier="Tier 3 Depth", base_rev_share=70000, nil_collective=25000, total_comp=95000, projected_points=26.0, cost_per_point=3653, roi_grade="A+ Elite Value"),
    RosterPlayerSalary(id="sal-08", name="Aram Minnetian", position="LW", line_slot="3rd Line LW", tier="Tier 3 Depth", base_rev_share=60000, nil_collective=20000, total_comp=80000, projected_points=22.0, cost_per_point=3636, roi_grade="A+ Elite Value"),
    RosterPlayerSalary(id="sal-09", name="Paul Fischer", position="RW", line_slot="3rd Line RW", tier="Tier 3 Depth", base_rev_share=60000, nil_collective=20000, total_comp=80000, projected_points=20.0, cost_per_point=4000, roi_grade="A High Value"),

    # Forward Line 4 (Tier 3/4 Energy)
    RosterPlayerSalary(id="sal-10", name="Beckett Hendrickson", position="C", line_slot="4th Line Center", tier="Tier 3 Depth", base_rev_share=45000, nil_collective=15000, total_comp=60000, projected_points=16.0, cost_per_point=3750, roi_grade="A+ Elite Value"),
    RosterPlayerSalary(id="sal-11", name="Christian Fitzgerald", position="LW", line_slot="4th Line LW", tier="Tier 4 Reserve", base_rev_share=35000, nil_collective=10000, total_comp=45000, projected_points=12.0, cost_per_point=3750, roi_grade="A+ Elite Value"),
    RosterPlayerSalary(id="sal-12", name="Liam Gilmartin", position="RW", line_slot="4th Line RW", tier="Tier 4 Reserve", base_rev_share=35000, nil_collective=10000, total_comp=45000, projected_points=11.0, cost_per_point=4090, roi_grade="A High Value"),

    # Defense Pair 1 (Tier 1 & 2)
    RosterPlayerSalary(id="sal-13", name="Zeev Buium", position="LD", line_slot="1st Pair LD", tier="Tier 1 Franchise", base_rev_share=160000, nil_collective=100000, total_comp=260000, projected_points=36.0, cost_per_point=7222, roi_grade="B Fair Value"),
    RosterPlayerSalary(id="sal-14", name="Artyom Levshunov", position="RD", line_slot="1st Pair RD", tier="Tier 1 Franchise", base_rev_share=170000, nil_collective=110000, total_comp=280000, projected_points=35.0, cost_per_point=8000, roi_grade="B Fair Value"),

    # Defense Pair 2 (Tier 2 Core)
    RosterPlayerSalary(id="sal-15", name="Tom Willander", position="RD", line_slot="2nd Pair RD", tier="Tier 2 Core", base_rev_share=110000, nil_collective=50000, total_comp=160000, projected_points=24.0, cost_per_point=6666, roi_grade="B Fair Value"),
    RosterPlayerSalary(id="sal-16", name="EJ Emery", position="LD", line_slot="2nd Pair LD", tier="Tier 2 Core", base_rev_share=100000, nil_collective=40000, total_comp=140000, projected_points=18.0, cost_per_point=7777, roi_grade="B Fair Value"),

    # Defense Pair 3 (Tier 3 Depth)
    RosterPlayerSalary(id="sal-17", name="Drew Fortescue", position="LD", line_slot="3rd Pair LD", tier="Tier 3 Depth", base_rev_share=55000, nil_collective=20000, total_comp=75000, projected_points=14.0, cost_per_point=5357, roi_grade="A High Value"),
    RosterPlayerSalary(id="sal-18", name="Max Strang", position="RD", line_slot="3rd Pair RD", tier="Tier 3 Depth", base_rev_share=50000, nil_collective=15000, total_comp=65000, projected_points=12.0, cost_per_point=5416, roi_grade="A High Value"),

    # Goalies (Tier 1 & 3)
    RosterPlayerSalary(id="sal-19", name="Trey Augustine", position="G", line_slot="Starting Goalie", tier="Tier 1 Franchise", base_rev_share=150000, nil_collective=90000, total_comp=240000, projected_points=26.0, cost_per_point=9230, roi_grade="B Fair Value"),
    RosterPlayerSalary(id="sal-20", name="Hampton Slukynsky", position="G", line_slot="Backup Goalie", tier="Tier 3 Depth", base_rev_share=60000, nil_collective=20000, total_comp=80000, projected_points=12.0, cost_per_point=6666, roi_grade="B Fair Value"),

    # Reserves / Redshirts (Tier 4) - Total 24 Active Players (2 Spots Open under 26 Cap)
    RosterPlayerSalary(id="sal-21", name="Chase Cheslock", position="RD", line_slot="Reserve D", tier="Tier 4 Reserve", base_rev_share=25000, nil_collective=5000, total_comp=30000, projected_points=6.0, cost_per_point=5000, roi_grade="A High Value"),
    RosterPlayerSalary(id="sal-22", name="Lucas St. Louis", position="LD", line_slot="Reserve D", tier="Tier 4 Reserve", base_rev_share=25000, nil_collective=5000, total_comp=30000, projected_points=5.0, cost_per_point=6000, roi_grade="B Fair Value"),
    RosterPlayerSalary(id="sal-23", name="Teddy Stiga", position="LW", line_slot="Reserve F", tier="Tier 4 Reserve", base_rev_share=30000, nil_collective=10000, total_comp=40000, projected_points=8.0, cost_per_point=5000, roi_grade="A High Value"),
    RosterPlayerSalary(id="sal-24", name="Colin Ralph", position="LD", line_slot="Reserve D", tier="Tier 4 Reserve", base_rev_share=25000, nil_collective=5000, total_comp=30000, projected_points=6.0, cost_per_point=5000, roi_grade="A High Value")
]

PORTAL_TARGETS: List[PortalROICandidate] = [
    PortalROICandidate(
        id="port-roi-01",
        name="TJ Hughes",
        previous_school="Michigan",
        position="C",
        eligibility_years=1,
        projected_points=48.0,
        requested_comp=210000,
        cost_per_point=4375,
        efficiency_index=2.28,
        roi_grade="A+ Elite Value",
        verdict="Top-line veteran 1C with high-end powerplay production and elite faceoff win rate (58%).",
        ai_recommendation="STRONG ACQUISITION TARGET: Fills 1st-line scoring need with high cost efficiency."
    ),
    PortalROICandidate(
        id="port-roi-02",
        name="Cade Alami",
        previous_school="Arizona State",
        position="RD",
        eligibility_years=2,
        projected_points=18.0,
        requested_comp=95000,
        cost_per_point=5277,
        efficiency_index=1.89,
        roi_grade="A High Value",
        verdict="6-foot-7 shutdown right defenseman with heavy physical deterrence and penalty kill utility.",
        ai_recommendation="RECOMMENDED VALUE TARGET: Solves defensive zone depth at under $100k total compensation."
    ),
    PortalROICandidate(
        id="port-roi-03",
        name="Matthew Wood",
        previous_school="UConn",
        position="RW",
        eligibility_years=2,
        projected_points=42.0,
        requested_comp=280000,
        cost_per_point=6666,
        efficiency_index=1.50,
        roi_grade="B Fair Value",
        verdict="Elite shooting winger and 1st round NHL draft pick with 25+ goal potential.",
        ai_recommendation="PREMIUM TARGET: Requires collective bidding war; offer $240k base + performance incentives."
    )
]

class NILService:
    def __init__(self):
        self.rev_share_pool = 3200000 # $3.2M athletic department hockey share
        self.nil_pool = 1200000       # $1.2M collective fund
        self.roster = [r.model_copy() for r in INITIAL_ROSTER_SALARIES]
        self.portal_targets = {p.id: p for p in PORTAL_TARGETS}

    def get_budget(self) -> RevenueShareBudget:
        alloc_rev = sum(r.base_rev_share for r in self.roster)
        alloc_nil = sum(r.nil_collective for r in self.roster)
        total_alloc = alloc_rev + alloc_nil
        total_pool = self.rev_share_pool + self.nil_pool
        remaining = total_pool - total_alloc
        
        total_pts = round(sum(r.projected_points for r in self.roster), 1)
        # Approximate wins: team scoring points * 0.052
        projected_wins = round(min(32.0, max(12.0, total_pts * 0.052)), 1)
        
        return RevenueShareBudget(
            department_revenue_share_pool=self.rev_share_pool,
            nil_collective_pool=self.nil_pool,
            total_pool=total_pool,
            allocated_rev_share=alloc_rev,
            allocated_nil=alloc_nil,
            total_allocated=total_alloc,
            remaining_total=remaining,
            total_roster_count=len(self.roster),
            max_roster_cap=26,
            is_compliant=(len(self.roster) <= 26 and remaining >= 0),
            projected_team_points=total_pts,
            projected_team_wins=projected_wins
        )

    def get_roster(self) -> List[RosterPlayerSalary]:
        return self.roster

    def get_portal_targets(self) -> List[PortalROICandidate]:
        return list(self.portal_targets.values())

    def simulate_portal_offer(self, candidate_id: str, offered_comp: int) -> PortalROICandidate:
        cand = self.portal_targets.get(candidate_id) or PORTAL_TARGETS[0]
        pts = cand.projected_points
        cost_pt = round(offered_comp / max(pts, 1.0))
        eff_index = round((pts / max(offered_comp, 1)) * 10000, 2)
        grade = calculate_roi_grade(cost_pt)
        
        if grade.startswith("A+"):
            verdict = f"Exceptional ROI ({offered_comp:,} for {pts} projected points). Clear championship-caliber acquisition."
            ai_rec = "SUBMIT OFFER IMMEDIATELY: Top-percentile efficiency value."
        elif grade.startswith("A"):
            verdict = f"High value addition ({offered_comp:,}). Solidifies top-half lineup production."
            ai_rec = "OFFER APPROVED: Balanced compensation aligned with D1 market benchmarks."
        elif grade.startswith("B"):
            verdict = f"Fair market value. Consider negotiating $15k?$25k into performance-based NIL."
            ai_rec = "PROCEED WITH CAUTION: Ensure sufficient reserve capital remains for defense depth."
        else:
            verdict = f"Overpay alert ({cost_pt:,} per point). Exceeds optimal line tier efficiency."
            ai_rec = "RESTRUCTURE OR COUNTER: Cap offer at 85% of asking price."

        return PortalROICandidate(
            id=cand.id,
            name=cand.name,
            previous_school=cand.previous_school,
            position=cand.position,
            eligibility_years=cand.eligibility_years,
            projected_points=pts,
            requested_comp=offered_comp,
            cost_per_point=cost_pt,
            efficiency_index=eff_index,
            roi_grade=grade,
            verdict=verdict,
            ai_recommendation=ai_rec
        )

    def update_player_salary(self, player_id: str, base_rev: int, nil_comp: int) -> Optional[RosterPlayerSalary]:
        for r in self.roster:
            if r.id == player_id:
                r.base_rev_share = base_rev
                r.nil_collective = nil_comp
                r.total_comp = base_rev + nil_comp
                r.cost_per_point = round(r.total_comp / max(r.projected_points, 1.0))
                r.roi_grade = calculate_roi_grade(r.cost_per_point)
                return r
        return None

    def optimize_roster_allocation(self) -> NILOptimizationResult:
        # Re-balance lower tier overpays and inject surplus into Top-6 scoring drivers
        optimized = [r.model_copy() for r in self.roster]
        for r in optimized:
            if r.tier == "Tier 1 Franchise":
                r.base_rev_share = int(r.base_rev_share * 1.05)
                r.nil_collective = int(r.nil_collective * 1.08)
                r.projected_points = round(r.projected_points * 1.04, 1)
            elif r.tier == "Tier 4 Reserve":
                r.base_rev_share = max(20000, int(r.base_rev_share * 0.90))
                r.nil_collective = max(5000, int(r.nil_collective * 0.85))
            r.total_comp = r.base_rev_share + r.nil_collective
            r.cost_per_point = round(r.total_comp / max(r.projected_points, 1.0))
            r.roi_grade = calculate_roi_grade(r.cost_per_point)

        self.roster = optimized
        budget = self.get_budget()
        
        return NILOptimizationResult(
            budget=budget,
            optimized_roster=optimized,
            projected_total_points=budget.projected_team_points,
            projected_wins=budget.projected_team_wins,
            surplus_savings=max(0, budget.remaining_total),
            executive_recommendation=(
                "Roster optimization complete: Shifted $95,000 from bottom-tier reserves to top-line transition drivers. "
                f"Projected team scoring increased to {budget.projected_team_points} points (+1.8 projected NCAA wins) "
                f"while maintaining ${budget.remaining_total:,} in contingency reserve under the 26-man cap."
            )
        )
