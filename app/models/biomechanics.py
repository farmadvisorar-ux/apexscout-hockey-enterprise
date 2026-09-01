from typing import List, Dict, Optional
from pydantic import BaseModel

class JointAngleData(BaseModel):
    hip_flexion_deg: float
    knee_extension_deg: float
    ankle_dorsiflexion_deg: float
    trunk_lean_deg: float
    edge_lean_deg: float

class SkatingKinematics(BaseModel):
    burst_0_15_mph_sec: float
    peak_speed_mph: float
    stride_frequency_hz: float
    stride_length_ft: float
    propulsion_force_n: float
    kinematic_efficiency_score: float  # 0 to 100
    joint_angles: JointAngleData

class ShootingKinematics(BaseModel):
    puck_release_speed_mph: float
    release_time_ms: float
    stick_flex_pct: float
    weight_transfer_velocity_fps: float
    shot_type: str

class BiomechanicalReport(BaseModel):
    prospect_id: str
    prospect_name: str
    position: str
    skating: SkatingKinematics
    shooting: ShootingKinematics
    nhl_comparable_mechanics: str
    diagnosis_strengths: List[str]
    biomechanical_flags: List[str]
    corrective_drills: List[str]
    coach_verdict: str
