from typing import List, Optional, Dict, Any
from app.models.prospect import Prospect, ScoutReport
from app.models.report import LiveShiftEvent
from app.models.ncaa_portal import PortalPlayer, ScholarshipBudget
from app.models.draft_board import DraftBoardState
from app.models.depth_chart import DepthChartProjection
from app.models.draft_sim import DraftPick, TradeEvaluationResult, DraftSimulationState
from app.models.benchmark import HistoricalPlayer, HeadToHeadComparison
from app.models.nil_optimizer import RosterPlayerSalary, PortalROICandidate, RevenueShareBudget, NILOptimizationResult
from app.models.biomechanics import BiomechanicalReport
from app.models.line_chemistry import ForwardLine, DefensePair, SpecialTeamsUnit, LineupEvaluationResponse
from app.services.mock_data import get_seed_prospects, get_seed_portal_players, get_seed_depth_chart
from app.services.consensus_engine import build_draft_board_state
from app.services.ai_synthesizer import synthesize_prospect_dossier
from app.services.rinkmic_parser import RinkMicParser
from app.services.draft_trade_engine import DraftTradeEngine
from app.services.benchmark_service import BenchmarkService
from app.services.nil_service import NILService
from app.services.biomechanics_service import BiomechanicsService
from app.services.chemistry_service import LineChemistryService

class ProspectService:
    def __init__(self):
        self._prospects: Dict[str, Prospect] = {p.id: p for p in get_seed_prospects()}
        self._portal_players: Dict[str, PortalPlayer] = {p.id: p for p in get_seed_portal_players()}
        self._live_events: List[LiveShiftEvent] = []
        self._depth_chart: DepthChartProjection = get_seed_depth_chart()
        self._rinkmic = RinkMicParser(list(self._prospects.values()))
        self._draft_engine = DraftTradeEngine(list(self._prospects.values()))
        self._benchmark_service = BenchmarkService(list(self._prospects.values()))
        self._nil_service = NILService()
        self._biomechanics_service = BiomechanicsService(list(self._prospects.values()))
        self._chemistry_service = LineChemistryService(list(self._prospects.values()))
        
    def list_prospects(self, league: Optional[str] = None, position: Optional[str] = None, 
                       tier: Optional[int] = None, search: Optional[str] = None,
                       status: Optional[str] = None) -> List[Prospect]:
        results = list(self._prospects.values())
        
        if league and league != 'ALL':
            l_up = league.upper()
            if l_up in ['FREE_AGENT', 'UNASSIGNED', 'LOOKING']:
                results = [p for p in results if p.team_status != 'Active Roster' or p.league_tier == 'FREE_AGENT']
            elif l_up in ['NCAA', 'COLLEGE']:
                results = [p for p in results if 'NCAA' in p.league.upper() or p.league_tier in ['NCAA_D1', 'NCAA_D3']]
            elif l_up in ['NCAA_D1', 'D1', 'NCAA-D1']:
                results = [p for p in results if p.league_tier == 'NCAA_D1' or (p.league.upper() == 'NCAA' and p.league_tier != 'NCAA_D3')]
            elif l_up in ['NCAA_D3', 'D3', 'NCAA-D3']:
                results = [p for p in results if p.league_tier == 'NCAA_D3' or 'D3' in p.league.upper()]
            elif l_up in ['CHL', 'MAJOR_JUNIOR']:
                results = [p for p in results if p.league.upper() in ['WHL', 'OHL', 'QMJHL']]
            elif l_up in ['EURO', 'EUROPE']:
                results = [p for p in results if p.league_tier == 'EURO' or p.league.upper() in ['SHL', 'LIIGA', 'KHL', 'NL', 'EURO']]
            elif l_up in ['JUNIOR_A', 'PREP']:
                results = [p for p in results if p.league.upper() in ['USHL', 'NAHL', 'BCHL']]
            else:
                results = [p for p in results if p.league.upper() == l_up or p.league_tier.upper() == l_up]

        if status and status != 'ALL':
            s_up = status.upper()
            if s_up == 'ACTIVE':
                results = [p for p in results if p.team_status == 'Active Roster']
            elif s_up in ['FREE_AGENT', 'LOOKING']:
                results = [p for p in results if p.team_status != 'Active Roster']
            elif s_up == 'PORTAL':
                results = [p for p in results if 'Portal' in p.team_status]
            elif s_up == 'UNCOMMITTED':
                results = [p for p in results if 'Uncommitted' in p.team_status]

        if position and position != 'ALL':
            if position in ['F', 'FORWARD']:
                results = [p for p in results if p.position in ['C', 'LW', 'RW']]
            elif position in ['D', 'DEFENSE']:
                results = [p for p in results if p.position in ['LD', 'RD']]
            else:
                results = [p for p in results if p.position == position]
        if tier:
            results = [p for p in results if p.tier == tier]
        if search:
            q = search.lower()
            results = [p for p in results if q in p.full_name.lower() or q in p.current_team.lower() or q in p.league.lower() or (p.status_badge and q in p.status_badge.lower()) or (p.college_commitment and q in p.college_commitment.lower())]
            
        return sorted(results, key=lambda p: p.consensus_rank)

    def get_prospect(self, prospect_id: str) -> Optional[Prospect]:
        return self._prospects.get(prospect_id)

    def update_tier(self, prospect_id: str, new_tier: int) -> Optional[Prospect]:
        if prospect_id in self._prospects:
            self._prospects[prospect_id].tier = new_tier
            return self._prospects[prospect_id]
        return None

    def add_live_event(self, event: LiveShiftEvent) -> LiveShiftEvent:
        self._live_events.insert(0, event)
        return event

    def get_live_events(self, prospect_id: Optional[str] = None) -> List[LiveShiftEvent]:
        if prospect_id:
            return [e for e in self._live_events if e.prospect_id == prospect_id]
        return self._live_events

    def get_draft_board(self) -> DraftBoardState:
        return build_draft_board_state(list(self._prospects.values()))

    def get_portal_players(self) -> List[PortalPlayer]:
        return list(self._portal_players.values())

    def update_portal_player(self, player_id: str, status: Optional[str] = None, 
                             scholarship: Optional[float] = None, visit_date: Optional[str] = None) -> Optional[PortalPlayer]:
        if player_id in self._portal_players:
            p = self._portal_players[player_id]
            if status:
                p.status = status
            if scholarship is not None:
                p.scholarship_target = scholarship
            if visit_date is not None:
                p.visit_date = visit_date
            return p
        return None

    def get_scholarship_budget(self) -> ScholarshipBudget:
        allocated = sum(p.scholarship_target for p in self._portal_players.values() if p.status in ['Committed', 'In Discussions'])
        allocated = round(11.5 + allocated, 2)
        remaining = round(max(0.0, 18.0 - allocated), 2)
        return ScholarshipBudget(
            total_allowed=18.0,
            allocated=allocated,
            remaining=remaining,
            total_committed_athletes=24,
            walk_ons=4,
            projected_roster_count=28
        )

    def get_depth_chart(self) -> DepthChartProjection:
        return self._depth_chart

    def generate_ai_synthesis(self, prospect_id: str, focus_area: str = 'All-Around'):
        prospect = self.get_prospect(prospect_id)
        if not prospect:
            return None
        synth = synthesize_prospect_dossier(prospect, focus_area)
        prospect.ai_synthesis = synth.executive_summary
        return synth

    def parse_rinkmic_audio(self, transcript: str, current_period: int = 1, current_clock: str = "12:00"):
        return self._rinkmic.parse_dictation(transcript, current_period, current_clock)

    def compile_rinkmic_report(self, prospect_id: str, scout_name: str, voice_memos: List[str]):
        prospect = self.get_prospect(prospect_id)
        if not prospect:
            return None
        report = self._rinkmic.compile_game_report(prospect, scout_name, voice_memos)
        prospect.scout_reports.insert(0, report)
        return report

    # Draft Floor Simulation Methods
    def get_draft_sim_state(self) -> DraftSimulationState:
        return self._draft_engine.get_state()

    def get_available_draft_prospects(self) -> List[Prospect]:
        return self._draft_engine.get_available_prospects()

    def make_draft_pick(self, prospect_id: str) -> Optional[DraftPick]:
        return self._draft_engine.make_selection(prospect_id)

    def auto_pick_cpu(self) -> Optional[DraftPick]:
        return self._draft_engine.auto_pick_cpu()

    def evaluate_draft_trade(self, team_a_picks: List[int], team_b_picks: List[int], team_a_name: str, team_b_name: str) -> TradeEvaluationResult:
        return self._draft_engine.evaluate_trade(team_a_picks, team_b_picks, team_a_name, team_b_name)

    def reset_draft_sim(self) -> DraftSimulationState:
        return self._draft_engine.reset_draft()

    # Time-Machine Benchmark Methods
    def list_historical_benchmarks(self) -> List[HistoricalPlayer]:
        return self._benchmark_service.list_historical_players()

    def compare_prospects_benchmarks(self, player_a_id: str, player_b_id: str) -> Optional[HeadToHeadComparison]:
        return self._benchmark_service.compare_players(player_a_id, player_b_id)

    # NCAA 2026/2027 NIL & Revenue-Share Methods
    def get_nil_budget(self) -> RevenueShareBudget:
        return self._nil_service.get_budget()

    def get_nil_roster(self) -> List[RosterPlayerSalary]:
        return self._nil_service.get_roster()

    def get_nil_portal_targets(self) -> List[PortalROICandidate]:
        return self._nil_service.get_portal_targets()

    def simulate_nil_offer(self, candidate_id: str, offered_comp: int) -> PortalROICandidate:
        return self._nil_service.simulate_portal_offer(candidate_id, offered_comp)

    def update_nil_player_salary(self, player_id: str, base_rev: int, nil_comp: int) -> Optional[RosterPlayerSalary]:
        return self._nil_service.update_player_salary(player_id, base_rev, nil_comp)

    def optimize_nil_roster(self) -> NILOptimizationResult:
        return self._nil_service.optimize_roster_allocation()

    # VisionLab Biomechanics Methods
    def get_biomechanics_report(self, prospect_id: str) -> Optional[BiomechanicalReport]:
        return self._biomechanics_service.get_prospect_report(prospect_id)

    def get_biomechanics_benchmarks(self) -> Dict:
        return self._biomechanics_service.get_benchmarks()

    def simulate_stride_mechanics(self, extension_angle_deg: float, cadence_hz: float, edge_lean_deg: float) -> Dict:
        return self._biomechanics_service.simulate_stride(extension_angle_deg, cadence_hz, edge_lean_deg)

    # LineChemistry Synergy Engine Methods
    def get_default_lineup(self) -> LineupEvaluationResponse:
        return self._chemistry_service.get_default_optimized_lineup()

    def evaluate_custom_lineup(self, forward_ids: List[List[str]], defense_ids: List[List[str]], goalie_ids: List[str]) -> LineupEvaluationResponse:
        return self._chemistry_service.evaluate_lineup(forward_ids, defense_ids, goalie_ids)

service = ProspectService()
