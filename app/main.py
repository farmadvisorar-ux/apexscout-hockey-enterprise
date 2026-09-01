import os
from typing import Optional, List, Dict
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.services.prospect_service import service
from app.models.prospect import Prospect, ScoutReport
from app.models.report import LiveShiftEvent, AISynthesisRequest, AISynthesisResponse
from app.models.draft_board import DraftBoardState
from app.models.ncaa_portal import PortalPlayer, ScholarshipBudget
from app.models.depth_chart import DepthChartProjection
from app.models.draft_sim import DraftPick, TradeEvaluationResult, DraftSimulationState
from app.models.benchmark import HistoricalPlayer, HeadToHeadComparison
from app.models.nil_optimizer import RosterPlayerSalary, PortalROICandidate, RevenueShareBudget, NILOptimizationResult
from app.models.biomechanics import BiomechanicalReport
from app.models.line_chemistry import ForwardLine, DefensePair, SpecialTeamsUnit, LineupEvaluationResponse

app = FastAPI(
    title="ApexScout Hockey Enterprise API",
    description="Enterprise-Grade Scouting, Recruiting, and Draft Intelligence for NHL & NCAA Organizations",
    version="2.5.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "microphone=(self), geolocation=(), camera=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

current_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(current_dir, "static")
templates_dir = os.path.join(current_dir, "templates")

if not os.path.exists(static_dir):
    os.makedirs(static_dir, exist_ok=True)
if not os.path.exists(templates_dir):
    os.makedirs(templates_dir, exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/robots.txt", response_class=HTMLResponse)
async def robots():
    return HTMLResponse(content="User-agent: *\nAllow: /\n", media_type="text/plain")

@app.get("/favicon.ico")
async def favicon():
    return HTMLResponse(content="", status_code=204)

@app.get("/", response_class=HTMLResponse)
async def index():
    index_file = os.path.join(templates_dir, "index.html")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>ApexScout Hockey Enterprise</h1>")

@app.get("/api/prospects", response_model=List[Prospect])
async def list_prospects(
    league: Optional[str] = None,
    position: Optional[str] = None,
    tier: Optional[int] = None,
    search: Optional[str] = None,
    status: Optional[str] = None
):
    return service.list_prospects(league=league, position=position, tier=tier, search=search, status=status)

@app.get("/api/prospects/{prospect_id}", response_model=Prospect)
async def get_prospect(prospect_id: str):
    prospect = service.get_prospect(prospect_id)
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect not found")
    return prospect

class TierUpdateRequest(BaseModel):
    tier: int

@app.patch("/api/prospects/{prospect_id}/tier", response_model=Prospect)
async def update_prospect_tier(prospect_id: str, payload: TierUpdateRequest):
    updated = service.update_tier(prospect_id, payload.tier)
    if not updated:
        raise HTTPException(status_code=404, detail="Prospect not found")
    return updated

@app.get("/api/draft-board", response_model=DraftBoardState)
async def get_draft_board():
    return service.get_draft_board()

@app.get("/api/portal", response_model=List[PortalPlayer])
async def get_portal_players():
    return service.get_portal_players()

class PortalUpdateRequest(BaseModel):
    status: Optional[str] = None
    scholarship_target: Optional[float] = None
    visit_date: Optional[str] = None

@app.patch("/api/portal/{player_id}", response_model=PortalPlayer)
async def update_portal_player(player_id: str, payload: PortalUpdateRequest):
    updated = service.update_portal_player(
        player_id, 
        status=payload.status, 
        scholarship=payload.scholarship_target,
        visit_date=payload.visit_date
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Portal player not found")
    return updated

@app.get("/api/scholarships", response_model=ScholarshipBudget)
async def get_scholarships():
    return service.get_scholarship_budget()

@app.get("/api/depth-chart", response_model=DepthChartProjection)
async def get_depth_chart():
    return service.get_depth_chart()

@app.post("/api/live-events", response_model=LiveShiftEvent)
async def add_live_event(event: LiveShiftEvent):
    return service.add_live_event(event)

@app.get("/api/live-events", response_model=List[LiveShiftEvent])
async def get_live_events(prospect_id: Optional[str] = None):
    return service.get_live_events(prospect_id=prospect_id)

@app.post("/api/synthesize", response_model=AISynthesisResponse)
async def synthesize_dossier(req: AISynthesisRequest):
    result = service.generate_ai_synthesis(req.prospect_id, req.focus_area or "All-Around")
    if not result:
        raise HTTPException(status_code=404, detail="Prospect not found for AI synthesis")
    return result

# RinkMic NLP Dictation Endpoints
class RinkMicParseRequest(BaseModel):
    transcript: str
    current_period: Optional[int] = 1
    current_clock: Optional[str] = "12:00"

@app.post("/api/rinkmic/parse")
async def parse_rinkmic_audio(req: RinkMicParseRequest):
    parsed = service.parse_rinkmic_audio(req.transcript, req.current_period or 1, req.current_clock or "12:00")
    return parsed

class RinkMicCompileRequest(BaseModel):
    prospect_id: str
    scout_name: Optional[str] = "Regional Scout"
    voice_memos: List[str]

@app.post("/api/rinkmic/compile-report", response_model=ScoutReport)
async def compile_rinkmic_report(req: RinkMicCompileRequest):
    report = service.compile_rinkmic_report(req.prospect_id, req.scout_name or "Regional Scout", req.voice_memos)
    if not report:
        raise HTTPException(status_code=404, detail="Prospect not found to compile report")
    return report

# Draft Floor Simulation & Trade Machine Endpoints
@app.get("/api/draft-sim/state", response_model=DraftSimulationState)
async def get_draft_sim_state():
    return service.get_draft_sim_state()

@app.get("/api/draft-sim/available", response_model=List[Prospect])
async def get_available_draft_prospects():
    return service.get_available_draft_prospects()

class MakePickRequest(BaseModel):
    prospect_id: str

@app.post("/api/draft-sim/make-pick", response_model=DraftPick)
async def make_draft_pick(req: MakePickRequest):
    pick = service.make_draft_pick(req.prospect_id)
    if not pick:
        raise HTTPException(status_code=400, detail="Invalid pick or prospect already drafted")
    return pick

@app.post("/api/draft-sim/auto-pick", response_model=DraftPick)
async def auto_pick_cpu():
    pick = service.auto_pick_cpu()
    if not pick:
        raise HTTPException(status_code=400, detail="No picks remaining or no available prospects")
    return pick

class TradeEvalRequest(BaseModel):
    team_a_picks: List[int]
    team_b_picks: List[int]
    team_a_name: Optional[str] = "User Team"
    team_b_name: Optional[str] = "Trade Partner"

@app.post("/api/draft-sim/evaluate-trade", response_model=TradeEvaluationResult)
async def evaluate_trade(req: TradeEvalRequest):
    return service.evaluate_draft_trade(req.team_a_picks, req.team_b_picks, req.team_a_name or "User Team", req.team_b_name or "Trade Partner")

@app.post("/api/draft-sim/reset", response_model=DraftSimulationState)
async def reset_draft_sim():
    return service.reset_draft_sim()

# Time-Machine Benchmark & Comparator Endpoints
@app.get("/api/benchmarks/historical", response_model=List[HistoricalPlayer])
async def get_historical_benchmarks():
    return service.list_historical_benchmarks()

class CompareRequest(BaseModel):
    player_a_id: str
    player_b_id: str

@app.post("/api/benchmarks/compare", response_model=HeadToHeadComparison)
async def compare_players(req: CompareRequest):
    comp = service.compare_prospects_benchmarks(req.player_a_id, req.player_b_id)
    if not comp:
        raise HTTPException(status_code=404, detail="One or both players not found for comparison")
    return comp

# NCAA 2026/2027 NIL & Revenue-Share Endpoints
@app.get("/api/nil/budget", response_model=RevenueShareBudget)
async def get_nil_budget():
    return service.get_nil_budget()

@app.get("/api/nil/roster", response_model=List[RosterPlayerSalary])
async def get_nil_roster():
    return service.get_nil_roster()

@app.get("/api/nil/portal-targets", response_model=List[PortalROICandidate])
async def get_nil_portal_targets():
    return service.get_nil_portal_targets()

class SimulateOfferRequest(BaseModel):
    candidate_id: str
    offered_comp: int

@app.post("/api/nil/simulate-offer", response_model=PortalROICandidate)
async def simulate_portal_offer(req: SimulateOfferRequest):
    return service.simulate_nil_offer(req.candidate_id, req.offered_comp)

class UpdateSalaryRequest(BaseModel):
    player_id: str
    base_rev_share: int
    nil_collective: int

@app.post("/api/nil/update-salary", response_model=RosterPlayerSalary)
async def update_player_salary(req: UpdateSalaryRequest):
    updated = service.update_nil_player_salary(req.player_id, req.base_rev_share, req.nil_collective)
    if not updated:
        raise HTTPException(status_code=404, detail="Player not found to update salary")
    return updated

@app.post("/api/nil/optimize", response_model=NILOptimizationResult)
async def optimize_nil_roster():
    return service.optimize_nil_roster()

# VisionLab Optical Tracking & Biomechanics Endpoints
@app.get("/api/biomechanics/prospect/{prospect_id}", response_model=BiomechanicalReport)
async def get_prospect_biomechanics(prospect_id: str):
    report = service.get_biomechanics_report(prospect_id)
    if not report:
        raise HTTPException(status_code=404, detail="Prospect biomechanics data not found")
    return report

@app.get("/api/biomechanics/benchmarks")
async def get_biomechanics_benchmarks():
    return service.get_biomechanics_benchmarks()

class StrideSimRequest(BaseModel):
    extension_angle_deg: float
    cadence_hz: float
    edge_lean_deg: float

@app.post("/api/biomechanics/simulate")
async def simulate_stride_mechanics(req: StrideSimRequest):
    return service.simulate_stride_mechanics(req.extension_angle_deg, req.cadence_hz, req.edge_lean_deg)

# LineChemistry Synergy Engine Endpoints
class CustomLineupRequest(BaseModel):
    forward_ids: List[List[str]]
    defense_ids: List[List[str]]
    goalie_ids: List[str]

@app.get("/api/chemistry/current", response_model=LineupEvaluationResponse)
async def get_current_chemistry():
    return service.get_default_lineup()

@app.post("/api/chemistry/evaluate", response_model=LineupEvaluationResponse)
async def evaluate_custom_lineup(req: CustomLineupRequest):
    return service.evaluate_custom_lineup(req.forward_ids, req.defense_ids, req.goalie_ids)

# ScoutWire Voice & Team Collaboration Endpoints
from app.services.scout_wire import scout_wire

class SendMessageRequest(BaseModel):
    channel_id: str = "war-room"
    sender_name: str = "Director of Hockey Ops"
    sender_role: str = "Front Office"
    text: str
    audio_url: Optional[str] = None
    audio_duration_sec: float = 0.0
    transcript: Optional[str] = None
    tagged_prospect_id: Optional[str] = None
    tagged_prospect_name: Optional[str] = None
    quick_action: Optional[str] = None

@app.get("/api/scoutwire/channels")
async def get_scoutwire_channels():
    return scout_wire.get_channels()

@app.get("/api/scoutwire/messages")
async def get_scoutwire_messages(channel_id: Optional[str] = None, prospect_id: Optional[str] = None):
    return scout_wire.get_messages(channel_id=channel_id, prospect_id=prospect_id)

@app.post("/api/scoutwire/send")
async def send_scoutwire_message(req: SendMessageRequest):
    return scout_wire.send_message(
        channel_id=req.channel_id,
        sender_name=req.sender_name,
        sender_role=req.sender_role,
        text=req.text,
        audio_url=req.audio_url,
        audio_duration_sec=req.audio_duration_sec,
        transcript=req.transcript,
        tagged_prospect_id=req.tagged_prospect_id,
        tagged_prospect_name=req.tagged_prospect_name,
        quick_action=req.quick_action
    )

class QuickActionRequest(BaseModel):
    message_id: str
    action_name: str
    prospect_id: Optional[str] = None

@app.post("/api/scoutwire/quick-action")
async def trigger_scoutwire_quick_action(req: QuickActionRequest):
    return scout_wire.trigger_quick_action(req.message_id, req.action_name, req.prospect_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8050, reload=True)
