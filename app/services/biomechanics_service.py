from typing import Dict, List, Optional
from app.models.biomechanics import JointAngleData, SkatingKinematics, ShootingKinematics, BiomechanicalReport
from app.models.prospect import Prospect

GOLD_STANDARDS = {
    "mcdavid": {
        "athlete": "Connor McDavid",
        "burst_0_15_mph_sec": 1.38,
        "peak_speed_mph": 25.4,
        "stride_frequency_hz": 3.45,
        "extension_angle_deg": 44.5,
        "edge_lean_deg": 52.0,
        "note": "Gold Standard: Unmatched horizontal ground-reaction force and low recovery heel-kick."
    },
    "makar": {
        "athlete": "Cale Makar",
        "burst_0_15_mph_sec": 1.44,
        "peak_speed_mph": 23.9,
        "stride_frequency_hz": 3.20,
        "extension_angle_deg": 42.0,
        "edge_lean_deg": 58.5,
        "note": "Gold Standard: Open-hip 10-and-2 Mohawk lateral deception with elite inside edge bite."
    },
    "matthews": {
        "athlete": "Auston Matthews",
        "puck_release_speed_mph": 91.2,
        "release_time_ms": 110.0,
        "stick_flex_pct": 28.5,
        "note": "Gold Standard: Drag-and-pull inside release angle manipulation with maximum stick flex loading."
    }
}

PROSPECT_KINEMATICS: Dict[str, BiomechanicalReport] = {
    "p-01": BiomechanicalReport(
        prospect_id="p-01",
        prospect_name="Gavin McKenna",
        position="LW / C",
        skating=SkatingKinematics(
            burst_0_15_mph_sec=1.42,
            peak_speed_mph=23.8,
            stride_frequency_hz=3.35,
            stride_length_ft=7.4,
            propulsion_force_n=820.0,
            kinematic_efficiency_score=94.5,
            joint_angles=JointAngleData(
                hip_flexion_deg=52.0,
                knee_extension_deg=44.0,
                ankle_dorsiflexion_deg=22.0,
                trunk_lean_deg=38.0,
                edge_lean_deg=54.5
            )
        ),
        shooting=ShootingKinematics(
            puck_release_speed_mph=86.5,
            release_time_ms=125.0,
            stick_flex_pct=24.0,
            weight_transfer_velocity_fps=18.5,
            shot_type="Snap / Quick Release"
        ),
        nhl_comparable_mechanics="Connor McDavid / Jack Hughes (Hyper-Agile Edge Loading)",
        diagnosis_strengths=[
            "Near-perfect 44.0? leg extension angle maximizes horizontal propulsion force.",
            "Minimal vertical head displacement (under 1.2 inches) during top-speed strides.",
            "Elite 54.5? edge lean allows razor-sharp directional changes without scrubbing speed."
        ],
        biomechanical_flags=[
            "Slight asymmetrical left ankle dorsiflexion (-3?) when crossing over right-to-left."
        ],
        corrective_drills=[
            "Single-leg eccentric Bulgarian split squats with resistance band tethering.",
            "Low-stance overspeed bungee crossovers to balance bilateral edge bite."
        ],
        coach_verdict="Franchise Tier 1 Skating Mechanics. Generates NHL top-quartile acceleration directly off neutral-zone receptions."
    ),
    "p-02": BiomechanicalReport(
        prospect_id="p-02",
        prospect_name="Keaton Verhoeff",
        position="RD",
        skating=SkatingKinematics(
            burst_0_15_mph_sec=1.58,
            peak_speed_mph=22.4,
            stride_frequency_hz=2.85,
            stride_length_ft=8.2,
            propulsion_force_n=960.0,
            kinematic_efficiency_score=88.0,
            joint_angles=JointAngleData(
                hip_flexion_deg=46.0,
                knee_extension_deg=41.0,
                ankle_dorsiflexion_deg=18.0,
                trunk_lean_deg=34.0,
                edge_lean_deg=48.0
            )
        ),
        shooting=ShootingKinematics(
            puck_release_speed_mph=94.2,
            release_time_ms=155.0,
            stick_flex_pct=31.0,
            weight_transfer_velocity_fps=22.0,
            shot_type="Heavy Slap Shot / One-Timer"
        ),
        nhl_comparable_mechanics="Victor Hedman / Colton Parayko (Heavy Lever Stride & Cannon Release)",
        diagnosis_strengths=[
            "Exceptional 8.2-foot stride length driven by 6-foot-4 frame and 960N ground force.",
            "Elite slap shot velocity (94.2 MPH) with massive stick flex loading (31.0%)."
        ],
        biomechanical_flags=[
            "Lower stride frequency (2.85 Hz) causes slower 0-15 MPH burst (1.58s) vs smaller forwards.",
            "High recovery heel-kick on backward-to-forward pivot transitions."
        ],
        corrective_drills=[
            "High-cadence stride box jumps and quick-feet ladder acceleration drills.",
            "Short-radius blue-line pivot recovery work focusing on lower heel recovery path."
        ],
        coach_verdict="Pro-Ready Heavy Lever Mechanics. Once top speed is attained, momentum and reach are virtually impossible to separate from the puck."
    )
}

class BiomechanicsService:
    def __init__(self, prospects: List[Prospect]):
        self.prospects = {p.id: p for p in prospects}

    def get_prospect_report(self, prospect_id: str) -> Optional[BiomechanicalReport]:
        if prospect_id in PROSPECT_KINEMATICS:
            return PROSPECT_KINEMATICS[prospect_id]
        
        # Synthesize fallback biomechanical data for other prospects
        p = self.prospects.get(prospect_id)
        if not p:
            return None
        
        is_d = "D" in p.position
        speed_mph = p.biometrics.top_skating_speed_mph or (22.8 if is_d else 23.4)
        burst_sec = round(3.8 - (speed_mph * 0.1), 2)
        
        return BiomechanicalReport(
            prospect_id=p.id,
            prospect_name=p.full_name,
            position=p.position,
            skating=SkatingKinematics(
                burst_0_15_mph_sec=burst_sec,
                peak_speed_mph=speed_mph,
                stride_frequency_hz=3.10,
                stride_length_ft=7.6,
                propulsion_force_n=850.0,
                kinematic_efficiency_score=float(p.grades.skating_speed + 15),
                joint_angles=JointAngleData(
                    hip_flexion_deg=50.0,
                    knee_extension_deg=43.0,
                    ankle_dorsiflexion_deg=20.0,
                    trunk_lean_deg=36.0,
                    edge_lean_deg=51.0
                )
            ),
            shooting=ShootingKinematics(
                puck_release_speed_mph=float(p.grades.shot_power + 15),
                release_time_ms=135.0,
                stick_flex_pct=26.0,
                weight_transfer_velocity_fps=19.0,
                shot_type="Wrist / Quick Snap"
            ),
            nhl_comparable_mechanics="Modern NHL Pro Stride",
            diagnosis_strengths=[
                f"Consistent knee extension angle (43.0?) providing stable {speed_mph} MPH top speed.",
                "Smooth weight transfer on off-wing shooting angles."
            ],
            biomechanical_flags=[
                "Trunk upright posture on long shifts; core fatigue indicator."
            ],
            corrective_drills=[
                "Rotational core anti-extension holds and weighted slideboard endurance."
            ],
            coach_verdict="Strong foundational kinematic profile capable of adapting to pro-pace transitions."
        )

    def get_benchmarks(self) -> Dict:
        return GOLD_STANDARDS

    def simulate_stride(self, extension_angle_deg: float, cadence_hz: float, edge_lean_deg: float) -> Dict:
        # Dynamic kinematic physics calculation
        # Optimal extension angle is 44 deg
        angle_penalty = abs(44.0 - extension_angle_deg) * 0.04
        burst_sec = round(max(1.32, 1.75 - (cadence_hz * 0.12) + angle_penalty), 2)
        peak_speed = round(min(26.0, (cadence_hz * 6.2) + (edge_lean_deg * 0.08) - (angle_penalty * 2.0)), 1)
        eff_score = round(max(50.0, min(99.0, 100.0 - (angle_penalty * 25.0) + (edge_lean_deg * 0.1))), 1)

        notes = []
        if extension_angle_deg < 40.0:
            notes.append("Short extension: Not maximizing ground-contact impulse force.")
        elif extension_angle_deg > 48.0:
            notes.append("Over-extension: Knee lock creates recovery lag and wasted vertical energy.")
        else:
            notes.append("Optimal extension: Maximum horizontal impulse vector.")

        if edge_lean_deg > 53.0:
            notes.append("Elite edge bite: Sharp turn radius without speed decay.")

        return {
            "burst_0_15_mph_sec": burst_sec,
            "peak_speed_mph": peak_speed,
            "kinematic_efficiency_score": eff_score,
            "analysis_notes": notes
        }
