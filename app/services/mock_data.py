import os
import json
import random
from typing import List
from app.models.prospect import Prospect, ScoutGrades, Biometrics, TransitionStats, ShotEvent, VideoClip, ScoutReport
from app.models.ncaa_portal import PortalPlayer
from app.models.depth_chart import DepthChartProjection, RosterSlot

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
JSON_PATH = os.path.join(PROJECT_ROOT, 'seed_players.json')

def generate_shot_events(prospect_id: str, count: int = 24) -> List[ShotEvent]:
    random.seed(hash(prospect_id))
    shots = []
    types = ['wrist', 'slap', 'snap', 'backhand', 'deflection', 'wrap']
    for i in range(count):
        is_slot = random.random() < 0.45
        if is_slot:
            x = round(random.uniform(64.0, 85.0), 1)
            y = round(random.uniform(-14.0, 14.0), 1)
            danger = 'high'
            xg = round(random.uniform(0.18, 0.48), 3)
            result = random.choices(['goal', 'saved', 'blocked'], weights=[0.35, 0.50, 0.15])[0]
        else:
            x = round(random.uniform(30.0, 86.0), 1)
            y = round(random.uniform(-36.0, 36.0), 1)
            danger = 'medium' if abs(y) < 22 and x > 52 else 'perimeter'
            xg = round(random.uniform(0.02, 0.14), 3)
            result = random.choices(['saved', 'blocked', 'missed', 'goal'], weights=[0.60, 0.20, 0.15, 0.05])[0]
        shots.append(ShotEvent(
            id=f'shot-{prospect_id}-{i+1}',
            x=x, y=y, period=random.choice([1, 2, 3]),
            time=f'{random.randint(1, 19):02d}:{random.randint(0, 59):02d}',
            shot_type=random.choice(types), result=result, xg=xg,
            is_rush=random.random() < 0.35, is_powerplay=random.random() < 0.28, danger_zone=danger
        ))
    return shots

def get_seed_prospects() -> List[Prospect]:
    if not os.path.exists(JSON_PATH):
        return []
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        raw_list = json.load(f)

    prospects = []
    for r in raw_list:
        pid, fn, ln, pos, hand, bdate, nat, flag, team, lg, dyear, dstat, ccom, gp, g, a, pts, pm, pim, ppg, hin, hdisp, wlbs, speed, grds, tier, crank, rrank, char_grd, med_grd, comp, role, ltier, tstat, sbadge = r
        # Calculate tactical what they do & how they do it based on position and top grades
        if 'D' in pos:
            what_they_do = f"Anchors the defensive transition and dictates blue-line pace. Controls {round(78.0 + (grds[5]+grds[10])/11, 1)}% of zone exits and neutralizes opposing rush entries."
            how_they_do_it = f"Utilizes an active stick and {grds[0]}/80 four-way mobility to close gaps rapidly. Under pressure, processes second-layer options within 0.8s, connecting on tape-to-tape transition passes ({round(3.0 + grds[4]/15, 1)} high-danger passes/60)."
        else:
            what_they_do = f"Drives high-danger offensive generation and dictates neutral zone transition. Successfully enters the offensive zone with control on {round(72.0 + (grds[3]+grds[5])/10, 1)}% of rushes."
            how_they_do_it = f"Attacks defenders' heels with deception, using {grds[3]}/80 puck handling and change of pace. Creates interior passing lanes through East-West weight shifts, maintaining a {round(45.0 + grds[9]*0.35, 1)}% battle win rate in dirty ice areas."

        percentiles = {
            "Controlled Entries": round(min(99.0, 70.0 + (grds[0] + grds[3]) * 0.2), 1),
            "High-Danger Passing": round(min(99.0, 68.0 + (grds[4] + grds[5]) * 0.2), 1),
            "Puck Protection": round(min(99.0, 65.0 + (grds[8] + grds[9]) * 0.22), 1),
            "Shot Generation": round(min(99.0, 67.0 + (grds[6] + grds[7]) * 0.2), 1),
            "Defensive Recovery": round(min(99.0, 60.0 + (grds[10] + grds[5]) * 0.24), 1)
        }

        memos = [
            {
                "id": f"memo-{pid}-1",
                "scout_name": "Dave Morrison (Chief Scout)",
                "duration_sec": 48.0,
                "date": "2026-02-28",
                "transcript": f"Live viewing confirmed {fn}'s elite habits. {what_they_do} Strong priority candidate for our draft board.",
                "audio_url": "/static/audio/sample_scout_memo.wav"
            }
        ]

        p = Prospect(
            id=pid, first_name=fn, last_name=ln, position=pos, shoots_catches=hand,
            birth_date=bdate, nationality=nat, flag_code=flag, current_team=team,
            league=lg, draft_year=dyear, draft_status=dstat, college_commitment=ccom,
            games_played=gp, goals=g, assists=a, points=pts, plus_minus=pm, penalty_minutes=pim, points_per_game=ppg,
            biometrics=Biometrics(height_in=hin, height_display=hdisp, weight_lbs=wlbs, top_skating_speed_mph=speed, wingspan_in=hin+2.0, body_fat_pct=8.2, standing_broad_jump_in=114.0, grip_strength_lbs=145),
            grades=ScoutGrades(skating_speed=grds[0], skating_agility=grds[1], skating_edges=grds[2], puck_skills=grds[3], passing_vision=grds[4], hockey_iq=grds[5], shot_release=grds[6], shot_power=grds[7], compete_motor=grds[8], physicality=grds[9], defensive_reliability=grds[10]),
            transition_stats=TransitionStats(
                controlled_entries_per_60=round(10.0 + (grds[3]+grds[1])/12, 1),
                controlled_entry_success_pct=round(72.0 + (grds[3]+grds[5])/10, 1),
                controlled_exits_per_60=round(8.0 + (grds[0]+grds[10])/11, 1),
                controlled_exit_success_pct=round(78.0 + (grds[5]+grds[10])/11, 1),
                entry_denials_per_60=round(3.0 + grds[10]/10, 1),
                puck_battle_win_pct=round(45.0 + grds[9]*0.35, 1),
                puck_recoveries_under_pressure=round(9.0 + grds[5]/10, 1),
                high_danger_passes_per_60=round(3.0 + grds[4]/15, 1)
            ),
            shots=generate_shot_events(pid, 24),
            video_clips=[
                VideoClip(id=f'v-{pid}-1', title='Dynamic Transition Breakout', timestamp='04:18', period=1, tag='Transition Rush', notes='Smooth acceleration beats first layer of pressure.'),
                VideoClip(id=f'v-{pid}-2', title='High-Danger In-Zone Playmaking', timestamp='12:44', period=2, tag='Power Play', notes='Precision distribution under heavy defensive pressure.')
            ],
            scout_reports=[
                ScoutReport(id=f'sr-{pid}-1', scout_name='Markus Lindell', scout_role='Head of Amateur & Pro Scouting', date='2026-02-15', game=f'{team} Scouting Report', overall_rating=round(sum(grds)/len(grds)), summary=f'High impact {pos} displaying pro-level pace, habits and hockey intelligence.', strengths=[f'Pace & Processing (IQ: {grds[5]}/80)', f'Puck Skills ({grds[3]}/80)', f'Compete Level ({grds[8]}/80)'], weaknesses=['Refining inside ice leverage'], nhl_comparable=comp, projected_role=role)
            ],
            tier=tier, consensus_rank=crank, regional_rank=rrank, analytics_rank=crank,
            character_grade=char_grd, medical_grade=med_grd,
            league_tier=ltier, team_status=tstat, status_badge=sbadge,
            what_they_do=what_they_do,
            how_they_do_it=how_they_do_it,
            percentile_rankings=percentiles,
            voice_memos=memos
        )
        prospects.append(p)
    return prospects

def get_seed_portal_players() -> List[PortalPlayer]:
    return [
        PortalPlayer(id='tp-01', first_name='Aidan', last_name='Thompson', position='C', shoots='L', previous_team='Denver', previous_conference='NCHC', eligibility_remaining_years=2, portal_entry_date='2026-03-28', status='Open - High Priority', nil_bracket_estimate=',000 - ,000', points_last_season=38, games_last_season=40, scholarship_target=1.0, lead_recruiter='Coach Hastings', visit_date='2026-04-12', scout_eval_grade=65, scouting_notes='Elite NCAA playmaking center with championship pedigree. 57% faceoff winner in tough NCHC matchups. Instantly transforms PP1.'),
        PortalPlayer(id='tp-02', first_name='Jack', last_name='Silich', position='RW', shoots='R', previous_team='Notre Dame', previous_conference='Big Ten', eligibility_remaining_years=3, portal_entry_date='2026-03-30', status='In Discussions', nil_bracket_estimate=',000 - ,000', points_last_season=22, games_last_season=36, scholarship_target=0.85, lead_recruiter='Coach Powers', visit_date='2026-04-15', scout_eval_grade=60, scouting_notes='Heavy physical winger with heavy right shot. Desires top-6 deployment and PP half-wall opportunity.'),
        PortalPlayer(id='tp-03', first_name='Brennan', last_name='Ali', position='C/LW', shoots='L', previous_team='Western Michigan', previous_conference='NCHC', eligibility_remaining_years=2, portal_entry_date='2026-03-24', status='Open - High Priority', nil_bracket_estimate=',000 - ,000', points_last_season=26, games_last_season=38, scholarship_target=0.75, lead_recruiter='Coach Carle', visit_date='2026-04-09', scout_eval_grade=60, scouting_notes='Detroit Red Wings draft pick. High-motor forechecker, great penalty killer, 190 lbs with relentless work ethic.'),
        PortalPlayer(id='tp-04', first_name='Tyler', last_name='Duke', position='LD', shoots='L', previous_team='Michigan', previous_conference='Big Ten', eligibility_remaining_years=1, portal_entry_date='2026-03-29', status='Evaluating', nil_bracket_estimate=',000 - ,000', points_last_season=18, games_last_season=39, scholarship_target=1.0, lead_recruiter='Coach Naurato', visit_date=None, scout_eval_grade=65, scouting_notes='Veteran shutdown mobile defenseman. High hockey IQ, gap closure is elite at collegiate level.'),
        PortalPlayer(id='tp-05', first_name='Gibson', last_name='Homer', position='G', shoots='L', previous_team='Arizona State', previous_conference='NCHC', eligibility_remaining_years=2, portal_entry_date='2026-03-31', status='Open - High Priority', nil_bracket_estimate=',000 - ,000', points_last_season=0, games_last_season=22, scholarship_target=0.80, lead_recruiter='Coach Jackson', visit_date='2026-04-18', scout_eval_grade=60, scouting_notes='.921 SV% with 2.14 GAA. 6\'5 frame, highly composed in net. Looking for guaranteed starter role.')
    ]

def get_seed_depth_chart() -> DepthChartProjection:
    return DepthChartProjection(
        team_name='Organization Roster and Pipeline War Room',
        projected_season='2026-27',
        forward_lines=[
            [
                RosterSlot(position_slot='1LW', player_id='p-01', player_name='Gavin McKenna', age=18, contract_status='ELC Projected', current_overall=72, projected_overall=80, elc_slide_active=True),
                RosterSlot(position_slot='1C', player_id='nhl-01', player_name='Connor McDavid', age=29, contract_status='NHL Signed', current_overall=80, projected_overall=80, elc_slide_active=False),
                RosterSlot(position_slot='1RW', player_id='nhl-07', player_name='David Pastrnak', age=29, contract_status='NHL Roster', current_overall=78, projected_overall=78, elc_slide_active=False)
            ],
            [
                RosterSlot(position_slot='2LW', player_id='p-11', player_name='Malcolm Spence', age=20, contract_status='NHL Roster', current_overall=68, projected_overall=72, elc_slide_active=False),
                RosterSlot(position_slot='2C', player_id='nhl-02', player_name='Connor Bedard', age=20, contract_status='NHL Signed', current_overall=76, projected_overall=80, elc_slide_active=False),
                RosterSlot(position_slot='2RW', player_id='nc-02', player_name='Ryan Leonard', age=21, contract_status='NHL Signed', current_overall=74, projected_overall=78, elc_slide_active=False)
            ],
            [
                RosterSlot(position_slot='3LW', player_id='nc-03', player_name='Gabe Perreault', age=21, contract_status='NHL Signed', current_overall=70, projected_overall=75, elc_slide_active=False),
                RosterSlot(position_slot='3C', player_id='nhl-03', player_name='Macklin Celebrini', age=20, contract_status='NHL Signed', current_overall=76, projected_overall=80, elc_slide_active=False),
                RosterSlot(position_slot='3RW', player_id='p-12', player_name='Benjamin Kevan', age=19, contract_status='NCAA Denver', current_overall=66, projected_overall=72, elc_slide_active=True)
            ],
            [
                RosterSlot(position_slot='4LW', player_id='nc-06', player_name='Sullivan Mack', age=26, contract_status='NHL Signed', current_overall=65, projected_overall=65, elc_slide_active=False),
                RosterSlot(position_slot='4C', player_id='p-06', player_name='Caleb Desnoyers', age=19, contract_status='ELC Signed', current_overall=68, projected_overall=74, elc_slide_active=True),
                RosterSlot(position_slot='4RW', player_id='p-15', player_name='Justin Poirier', age=20, contract_status='NHL Signed', current_overall=67, projected_overall=72, elc_slide_active=False)
            ]
        ],
        defense_pairs=[
            [
                RosterSlot(position_slot='1LD', player_id='nhl-05', player_name='Quinn Hughes', age=26, contract_status='NHL Signed', current_overall=80, projected_overall=80, elc_slide_active=False),
                RosterSlot(position_slot='1RD', player_id='nhl-04', player_name='Cale Makar', age=27, contract_status='NHL Signed', current_overall=80, projected_overall=80, elc_slide_active=False)
            ],
            [
                RosterSlot(position_slot='2LD', player_id='p-04', player_name='Matthew Schaefer', age=19, contract_status='NHL Signed', current_overall=74, projected_overall=80, elc_slide_active=False),
                RosterSlot(position_slot='2RD', player_id='eu-01', player_name='Axel Sandin Pellikka', age=21, contract_status='NHL Signed', current_overall=74, projected_overall=78, elc_slide_active=False)
            ],
            [
                RosterSlot(position_slot='3LD', player_id='nc-01', player_name='Zeev Buium', age=20, contract_status='NHL Signed', current_overall=72, projected_overall=78, elc_slide_active=False),
                RosterSlot(position_slot='3RD', player_id='p-02', player_name='Keaton Verhoeff', age=18, contract_status='Junior Rights', current_overall=70, projected_overall=78, elc_slide_active=True)
            ]
        ],
        goalies=[
            RosterSlot(position_slot='G1', player_id='nc-05', player_name='Trey Augustine', age=21, contract_status='NHL Signed', current_overall=74, projected_overall=79, elc_slide_active=False),
            RosterSlot(position_slot='G2', player_id='p-08', player_name='Joshua Ravensbergen', age=19, contract_status='WHL Signed', current_overall=70, projected_overall=77, elc_slide_active=True)
        ],
        pipeline_prospects=[
            RosterSlot(position_slot='C/W', player_id='p-07', player_name='Roger McQueen', age=19, contract_status='ELC Signed (WHL)', current_overall=68, projected_overall=74, elc_slide_active=True),
            RosterSlot(position_slot='RW', player_id='jr-01', player_name='William Moore', age=18, contract_status='USNTDP / Minnesota', current_overall=65, projected_overall=72, elc_slide_active=True),
            RosterSlot(position_slot='RD', player_id='uc-02', player_name='Declan Waddick', age=18, contract_status='Uncommitted Recruit', current_overall=64, projected_overall=70, elc_slide_active=True)
        ]
    )
