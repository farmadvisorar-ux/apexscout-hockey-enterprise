import re
from typing import Dict, Any, List, Optional
from app.models.prospect import Prospect, ScoutReport
from app.models.report import LiveShiftEvent

class RinkMicParser:
    def __init__(self, prospects: List[Prospect]):
        self.prospects = prospects
        
    def parse_dictation(self, transcript: str, current_period: int = 1, current_clock: str = "12:00") -> Dict[str, Any]:
        text_lower = transcript.lower()
        
        # 1. Match Prospect
        matched_prospect = None
        for p in self.prospects:
            last_name = p.last_name.lower()
            first_name = p.first_name.lower()
            full_name = p.full_name.lower()
            if last_name in text_lower or full_name in text_lower or (first_name in text_lower and len(first_name) > 3):
                matched_prospect = p
                break
                
        # Fallback to first prospect if none explicitly mentioned
        if not matched_prospect and self.prospects:
            matched_prospect = self.prospects[0]

        # 2. Extract Period
        period = current_period
        p_match = re.search(r'(\d+)(st|nd|rd)?\s+period|period\s+(\d+)', text_lower)
        if p_match:
            digits = [g for g in p_match.groups() if g and g.isdigit()]
            if digits:
                period = int(digits[0])

        # 3. Extract Clock
        clock = current_clock
        clock_match = re.search(r'(\d{1,2})[:\.](\d{2})|at\s+(\d{1,2})\s+minutes', text_lower)
        if clock_match:
            if clock_match.group(1) and clock_match.group(2):
                clock = f"{int(clock_match.group(1)):02d}:{clock_match.group(2)}"
            elif clock_match.group(3):
                clock = f"{int(clock_match.group(3)):02d}:00"

        # 4. Classify Tactical Events
        events_found = []
        if any(w in text_lower for w in ["breakout", "controlled exit", "d-zone exit", "rim", "retrieval"]):
            events_found.append("Controlled Exit / Breakout")
        if any(w in text_lower for w in ["entry", "beat wide", "carry-in", "blue line carry"]):
            events_found.append("Controlled Entry")
        if any(w in text_lower for w in ["seam", "pass", "backdoor", "saucer", "feed", "cross-ice"]):
            events_found.append("High Danger Pass")
        if any(w in text_lower for w in ["battle", "wall", "pinned", "board win", "stripped"]):
            events_found.append("Puck Battle Win")
        if any(w in text_lower for w in ["shot", "wrister", "slap", "one-timer", "snapped"]):
            events_found.append("Slot Shot On Goal")
        if any(w in text_lower for w in ["goal", "scored", "shelved", "buried"]):
            events_found.append("Goal Scored!")
        if any(w in text_lower for w in ["turnover", "lost puck", "giveaway", "cough"]):
            events_found.append("Turnover Under Pressure")
        if any(w in text_lower for w in ["denial", "gap", "step up", "poke check", "interception"]):
            events_found.append("Entry Denial / Gap Control")

        primary_event = events_found[0] if events_found else "Tactical Observation"

        # 5. Extract Qualitative Grade Indicators
        strengths = []
        weaknesses = []
        
        if any(w in text_lower for w in ["edge", "speed", "pace", "quickness", "skating"]):
            strengths.append("High-end mobility and edge deception")
        if any(w in text_lower for w in ["vision", "poise", "smart", "iq", "anticipated"]):
            strengths.append("Exceptional ice vision and anticipation under pressure")
        if any(w in text_lower for w in ["release", "heavy shot", "laser", "wrist"]):
            strengths.append("Lethal shooting release quickness")
        if any(w in text_lower for w in ["heavy", "physical", "hit", "strength"]):
            strengths.append("Physical deterrence and inside-ice battle win rate")
            
        if any(w in text_lower for w in ["weak", "pushed off", "soft", "strength"]):
            weaknesses.append("Needs core strength for inside-ice net drives")
        if any(w in text_lower for w in ["lost man", "backcheck", "rotation", "coverage"]):
            weaknesses.append("Defensive rotational tracking consistency")

        return {
            "prospect_id": matched_prospect.id if matched_prospect else None,
            "prospect_name": matched_prospect.full_name if matched_prospect else "Unknown",
            "period": period,
            "game_clock": clock,
            "primary_event": primary_event,
            "all_events": events_found,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "original_transcript": transcript,
            "formatted_note": f"[P{period} {clock}] {transcript}"
        }

    def compile_game_report(self, prospect: Prospect, scout_name: str, voice_memos: List[str]) -> ScoutReport:
        parsed_notes = [self.parse_dictation(m) for m in voice_memos]
        
        all_strengths = []
        all_weaknesses = []
        summaries = []
        
        for n in parsed_notes:
            summaries.append(n["original_transcript"])
            all_strengths.extend(n["strengths"])
            all_weaknesses.extend(n["weaknesses"])
            
        unique_strengths = list(dict.fromkeys(all_strengths)) or ["Vision and Anticipation", "Controlled Transition Output"]
        unique_weaknesses = list(dict.fromkeys(all_weaknesses)) or ["Physical strength along wall battles"]
        
        compiled_summary = (
            f"Live In-Arena Voice Dictation Log by {scout_name}. Scout observations compiled across {len(voice_memos)} in-game shifts: "
            + " ".join(summaries)
        )
        
        return ScoutReport(
            id=f"sr-voice-{len(prospect.scout_reports)+1}",
            scout_name=f"{scout_name} (RinkMic Live)",
            scout_role="Live In-Arena Observer",
            date="2026-08-31",
            game=f"{prospect.current_team} In-Game Scouting Session",
            overall_rating=round(prospect.grades.overall_grade),
            summary=compiled_summary,
            strengths=unique_strengths[:3],
            weaknesses=unique_weaknesses[:2],
            nhl_comparable="Dynamic Playmaking Forward" if "W" in prospect.position or "C" in prospect.position else "Top-Pairing Two-Way D",
            projected_role="High-Impact NHL / Top-6 NCAA Contributor"
        )
