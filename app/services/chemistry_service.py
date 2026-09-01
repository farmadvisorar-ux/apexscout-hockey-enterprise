from typing import List, Dict, Optional, Any
from app.models.prospect import Prospect
from app.models.line_chemistry import ForwardLine, DefensePair, SpecialTeamsUnit, LineupEvaluationResponse

class LineChemistryService:
    def __init__(self, prospects: List[Prospect]):
        self._prospects_map: Dict[str, Prospect] = {p.id: p for p in prospects}

    def _get_player(self, pid: Optional[str]) -> Optional[Prospect]:
        if not pid:
            return None
        return self._prospects_map.get(pid)

    def calculate_triad_synergy(self, lw_id: Optional[str], c_id: Optional[str], rw_id: Optional[str], line_num: int) -> ForwardLine:
        lw = self._get_player(lw_id)
        c = self._get_player(c_id)
        rw = self._get_player(rw_id)

        lw_name = lw.full_name if lw else 'Open LW'
        c_name = c.full_name if c else 'Open Center'
        rw_name = rw.full_name if rw else 'Open RW'

        if not lw or not c or not rw:
            return ForwardLine(
                line_number=line_num, lw_id=lw_id, c_id=c_id, rw_id=rw_id,
                lw_name=lw_name, c_name=c_name, rw_name=rw_name,
                synergy_score=60, playstyle_tag='Incomplete Triad',
                projected_xg_per_60=2.1, projected_xga_per_60=2.8,
                chemistry_notes='Roster slot unassigned. Line efficiency reduced.'
            )

        # Calculate Archetype Synergy
        # Scores based on vision, puck skills, shot release, speed, compete
        avg_speed = (lw.grades.skating_speed + c.grades.skating_speed + rw.grades.skating_speed) / 3.0
        avg_iq = (lw.grades.hockey_iq + c.grades.hockey_iq + rw.grades.hockey_iq) / 3.0
        avg_skills = (lw.grades.puck_skills + c.grades.puck_skills + rw.grades.puck_skills) / 3.0
        avg_shot = (lw.grades.shot_release + c.grades.shot_release + rw.grades.shot_release) / 3.0
        avg_compete = (lw.grades.compete_motor + c.grades.compete_motor + rw.grades.compete_motor) / 3.0

        synergy = int(min(99, max(50, (avg_iq * 0.35 + avg_skills * 0.25 + avg_speed * 0.20 + avg_compete * 0.20) * 1.18)))

        # Handedness Bonus
        is_natural_wings = (lw.shoots_catches == 'L' and rw.shoots_catches == 'R')
        if is_natural_wings:
            synergy = min(99, synergy + 3)

        if avg_iq >= 75 and avg_skills >= 75:
            tag = 'Elite In-Zone Carousel'
            notes = f'Generational playmaking & spatial processing. High-danger xG surge.'
        elif avg_speed >= 74 and avg_compete >= 74:
            tag = 'High-Pace Rush & Heavy Forecheck'
            notes = f'Top-end zone exit velocity with heavy physical puck retrieval.'
        elif avg_shot >= 74:
            tag = 'Precision Sniper Triad'
            notes = f'High conversion rate on slot transitions and half-wall feeds.'
        else:
            tag = 'Structured 200-Foot Unit'
            notes = f'Defensive containment with disciplined puck management.'

        xg = round(2.4 + (avg_skills + avg_iq) / 45.0, 2)
        xga = round(max(1.4, 3.2 - (avg_iq + avg_compete) / 60.0), 2)

        return ForwardLine(
            line_number=line_num, lw_id=lw_id, c_id=c_id, rw_id=rw_id,
            lw_name=lw_name, c_name=c_name, rw_name=rw_name,
            synergy_score=synergy, playstyle_tag=tag,
            projected_xg_per_60=xg, projected_xga_per_60=xga,
            chemistry_notes=notes
        )

    def calculate_pair_synergy(self, ld_id: Optional[str], rd_id: Optional[str], pair_num: int) -> DefensePair:
        ld = self._get_player(ld_id)
        rd = self._get_player(rd_id)

        ld_name = ld.full_name if ld else 'Open LD'
        rd_name = rd.full_name if rd else 'Open RD'

        if not ld or not rd:
            return DefensePair(
                pair_number=pair_num, ld_id=ld_id, rd_id=rd_id,
                ld_name=ld_name, rd_name=rd_name,
                synergy_score=55, puck_moving_grade=55, rush_suppression_pct=52.0,
                handedness_balance='Unbalanced',
                chemistry_notes='Defensive slot unassigned.'
            )

        avg_speed = (ld.grades.skating_speed + rd.grades.skating_speed) / 2.0
        avg_iq = (ld.grades.hockey_iq + rd.grades.hockey_iq) / 2.0
        avg_def = (ld.grades.defensive_reliability + rd.grades.defensive_reliability) / 2.0
        avg_phys = (ld.grades.physicality + rd.grades.physicality) / 2.0

        synergy = int(min(99, max(50, (avg_iq * 0.4 + avg_def * 0.3 + avg_speed * 0.2 + avg_phys * 0.1) * 1.16)))

        handedness = 'Natural L-R' if (ld.shoots_catches == 'L' and rd.shoots_catches == 'R') else 'Dual Left-Shot'
        if handedness == 'Natural L-R':
            synergy = min(99, synergy + 4)

        puck_moving = int((ld.grades.puck_skills + rd.grades.passing_vision + avg_iq) / 3.0)
        suppression = round(min(92.0, max(45.0, 50.0 + (avg_def * 0.35) + (avg_phys * 0.15))), 1)

        notes = f'Clean gap control, {handedness} balance, {suppression}% entry denial rate.'

        return DefensePair(
            pair_number=pair_num, ld_id=ld_id, rd_id=rd_id,
            ld_name=ld_name, rd_name=rd_name,
            synergy_score=synergy, puck_moving_grade=puck_moving,
            rush_suppression_pct=suppression,
            handedness_balance=handedness,
            chemistry_notes=notes
        )

    def evaluate_lineup(self, forward_ids: List[List[str]], defense_ids: List[List[str]], goalie_ids: List[str]) -> LineupEvaluationResponse:
        f_lines: List[ForwardLine] = []
        for i, line in enumerate(forward_ids):
            lw = line[0] if len(line) > 0 else None
            c = line[1] if len(line) > 1 else None
            rw = line[2] if len(line) > 2 else None
            f_lines.append(self.calculate_triad_synergy(lw, c, rw, i + 1))

        d_pairs: List[DefensePair] = []
        for j, pair in enumerate(defense_ids):
            ld = pair[0] if len(pair) > 0 else None
            rd = pair[1] if len(pair) > 1 else None
            d_pairs.append(self.calculate_pair_synergy(ld, rd, j + 1))

        # Overall ratings
        avg_f_syn = sum(f.synergy_score for f in f_lines) / max(1, len(f_lines))
        avg_d_syn = sum(d.synergy_score for d in d_pairs) / max(1, len(d_pairs))
        overall_chem = int(avg_f_syn * 0.6 + avg_d_syn * 0.4)

        off_flow = int(sum(f.projected_xg_per_60 for f in f_lines) * 7.5)
        def_contain = int(sum(d.rush_suppression_pct for d in d_pairs) / max(1, len(d_pairs)))

        win_diff = round((off_flow - 70) * 0.15 + (def_contain - 65) * 0.12, 1)

        # Special Teams setup
        pp1_names = [f_lines[0].lw_name, f_lines[0].c_name, f_lines[0].rw_name, d_pairs[0].ld_name, d_pairs[0].rd_name]
        special_teams = [
            SpecialTeamsUnit(
                unit_name='PP1', formation='1-3-1 Umbrella',
                player_ids=[p for p in (forward_ids[0] if forward_ids else []) + (defense_ids[0] if defense_ids else []) if p],
                player_names=pp1_names,
                effectiveness_pct=26.8,
                tactical_role_breakdown={'Half-Wall QB': pp1_names[0], 'Bumper Pivot': pp1_names[1], 'Flank Trigger': pp1_names[2], 'Point QB': pp1_names[3], 'Net-Front Screen': pp1_names[4]}
            ),
            SpecialTeamsUnit(
                unit_name='PK1', formation='Diamond Aggressive Box',
                player_ids=[p for p in (forward_ids[2] if len(forward_ids)>2 else [])[:2] + (defense_ids[1] if len(defense_ids)>1 else []) if p],
                player_names=[f_lines[2].c_name, f_lines[2].lw_name, d_pairs[1].ld_name, d_pairs[1].rd_name] if len(f_lines)>2 and len(d_pairs)>1 else ['PK Forward 1', 'PK Forward 2', 'PK LD', 'PK RD'],
                effectiveness_pct=86.4,
                tactical_role_breakdown={'Lead Pressure': 'F1', 'Passing Lane Guard': 'F2', 'Crease Clearing LD': 'D1', 'Net-Front Battler RD': 'D2'}
            )
        ]

        insights = [
            f'Top forward unit ({f_lines[0].playstyle_tag}) generated a peak {f_lines[0].synergy_score}% synergy rating.',
            f'Natural Left-Right handedness balance on top pair yields {d_pairs[0].rush_suppression_pct}% controlled entry denial.',
            f'Projected 5v5 goal differential ranks in the top 92nd percentile against standard division competition.'
        ]

        goalie_names = [self._prospects_map[gid].full_name for gid in goalie_ids if gid in self._prospects_map]
        if not goalie_names:
            goalie_names = ['Starting NHL/NCAA Goaltender', 'Backup Tandem Goaltender']

        return LineupEvaluationResponse(
            overall_chemistry_rating=overall_chem,
            offensive_flow_score=min(99, off_flow),
            defensive_containment_score=min(99, def_contain),
            transition_pace_mph=23.4,
            projected_win_differential=win_diff,
            cap_or_nil_used=82.4,
            cap_or_nil_ceiling=88.0,
            cap_compliant=True,
            roster_size=20,
            forward_lines=f_lines,
            defense_pairs=d_pairs,
            goalies=goalie_names,
            special_teams=special_teams,
            tactical_ai_insights=insights
        )

    def get_default_optimized_lineup(self) -> LineupEvaluationResponse:
        f_ids = [
            ['p-01', 'nhl-01', 'nhl-07'],  # Line 1: McKenna - McDavid - Pastrnak
            ['p-11', 'nhl-02', 'nc-02'],   # Line 2: Spence - Bedard - Leonard
            ['nc-03', 'nhl-03', 'p-12'],   # Line 3: Perreault - Celebrini - Kevan
            ['nc-06', 'p-06', 'p-15']      # Line 4: Mack - Desnoyers - Poirier
        ]
        d_ids = [
            ['nhl-05', 'nhl-04'],          # Pair 1: Q. Hughes - Makar
            ['p-04', 'eu-01'],             # Pair 2: Schaefer - Sandin Pellikka
            ['nc-01', 'p-02']              # Pair 3: Buium - Verhoeff
        ]
        g_ids = ['nc-05', 'p-08']          # Augustine, Ravensbergen

        return self.evaluate_lineup(f_ids, d_ids, g_ids)
