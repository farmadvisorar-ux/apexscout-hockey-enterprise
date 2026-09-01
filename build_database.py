import random
from typing import List
from app.models.prospect import Prospect, ScoutGrades, Biometrics, TransitionStats, ShotEvent, VideoClip, ScoutReport
from app.models.ncaa_portal import PortalPlayer
from app.models.depth_chart import DepthChartProjection, RosterSlot

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
    raw_list = []
