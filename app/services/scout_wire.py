import os
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "scoutwire_messages.json")

INITIAL_CHANNELS = [
    {
        "id": "war-room",
        "name": "🔥 2026 War Room & Draft Board",
        "topic": "Live draft targets, trade packages, cap balancing",
        "unread_count": 2
    },
    {
        "id": "coaching-staff",
        "name": "🏒 Coaches & Bench Strategy",
        "topic": "Line chemistry, powerplay units, remote coaching notes",
        "unread_count": 1
    },
    {
        "id": "prospect-evals",
        "name": "🎙️ Scout Audio Reports & Memos",
        "topic": "Unlimited voice scouting notes with instant transcripts",
        "unread_count": 3
    },
    {
        "id": "college-ncaa-acha",
        "name": "🎓 College Hub (NCAA & ACHA)",
        "topic": "Collegiate talent, transfer portal, free agent recruitment",
        "unread_count": 0
    }
]

INITIAL_MESSAGES = [
    {
        "id": "msg-001",
        "channel_id": "prospect-evals",
        "sender_name": "Dave Morrison",
        "sender_role": "Director of Amateur Scouting",
        "sender_avatar": "DM",
        "text": "Just wrapped up live viewings of James Hagens and Anton Frondell. Detailed 90-second voice breakdown attached below with full transition data.",
        "audio_url": "/static/audio/sample_scout_memo.wav",
        "audio_duration_sec": 84.5,
        "transcript": "Hagens' ability to change pace through the neutral zone is unmatched in this class. He enters the offensive zone with control on 78.4% of rushes. Frondell plays a heavier pro-style two-way game that fits our middle-six center vacancy immediately.",
        "tagged_prospect_id": "p-001",
        "tagged_prospect_name": "James Hagens (C - Boston College / NCAA D1)",
        "quick_actions": ["Draft Priority 1", "Request Video Reel"],
        "created_at": "2026-08-31T20:15:00"
    },
    {
        "id": "msg-002",
        "channel_id": "war-room",
        "sender_name": "Elena Rostova",
        "sender_role": "European Head Scout",
        "sender_avatar": "ER",
        "text": "RankNet is charging double for their European package. Our raw data models on SHL & Liiga prospects are significantly deeper on shot generation percentiles.",
        "audio_url": None,
        "audio_duration_sec": 0,
        "transcript": None,
        "tagged_prospect_id": "p-002",
        "tagged_prospect_name": "Anton Frondell (C - Djurgårdens / SHL)",
        "quick_actions": ["Tag for Draft Board", "Compare vs RinkNet"],
        "created_at": "2026-08-31T21:05:00"
    },
    {
        "id": "msg-003",
        "channel_id": "college-ncaa-acha",
        "sender_name": "Markus Lindgren",
        "sender_role": "Collegiate & Junior Talent Scout",
        "sender_avatar": "ML",
        "text": "Here's the quick voice note on the ACHA & NCAA D3 standouts for our camp invitation list. No 60-second cutoff here thankfully!",
        "audio_url": "/static/audio/sample_college_memo.wav",
        "audio_duration_sec": 112.0,
        "transcript": "We should offer trial runs and camp invites to the top 3 scoring wingers in the ACHA D1 tournament. Their puck retrieval numbers and net-front battle win rate exceeded 64%.",
        "tagged_prospect_id": "p-007",
        "tagged_prospect_name": "Logan Hensler (RD - Wisconsin / NCAA D1)",
        "quick_actions": ["Send Trial Run Offer", "Add to Camp Roster"],
        "created_at": "2026-08-31T21:40:00"
    }
]

class ScoutWireService:
    def __init__(self):
        self.channels = INITIAL_CHANNELS
        self.messages: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    self.messages = json.load(f)
                    return
            except Exception:
                pass
        self.messages = INITIAL_MESSAGES
        self._save()

    def _save(self):
        try:
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(self.messages, f, indent=2)
        except Exception:
            pass

    def get_channels(self) -> List[Dict[str, Any]]:
        return self.channels

    def get_messages(self, channel_id: Optional[str] = None, prospect_id: Optional[str] = None) -> List[Dict[str, Any]]:
        msgs = self.messages
        if channel_id:
            msgs = [m for m in msgs if m.get("channel_id") == channel_id]
        if prospect_id:
            msgs = [m for m in msgs if m.get("tagged_prospect_id") == prospect_id]
        return sorted(msgs, key=lambda x: x.get("created_at", ""), reverse=False)

    def send_message(
        self,
        channel_id: str,
        sender_name: str,
        sender_role: str,
        text: str,
        audio_url: Optional[str] = None,
        audio_duration_sec: float = 0.0,
        transcript: Optional[str] = None,
        tagged_prospect_id: Optional[str] = None,
        tagged_prospect_name: Optional[str] = None,
        quick_action: Optional[str] = None
    ) -> Dict[str, Any]:
        msg_id = f"msg-{uuid.uuid4().hex[:8]}"
        initials = "".join([part[0].upper() for part in sender_name.split()[:2]]) or "SC"
        
        actions = []
        if quick_action:
            actions.append(quick_action)
        else:
            actions = ["Draft Priority", "Request Video Reel"]

        msg = {
            "id": msg_id,
            "channel_id": channel_id,
            "sender_name": sender_name,
            "sender_role": sender_role,
            "sender_avatar": initials,
            "text": text,
            "audio_url": audio_url,
            "audio_duration_sec": audio_duration_sec,
            "transcript": transcript or (text if audio_url else None),
            "tagged_prospect_id": tagged_prospect_id,
            "tagged_prospect_name": tagged_prospect_name,
            "quick_actions": actions,
            "created_at": datetime.now().isoformat()
        }
        self.messages.append(msg)
        self._save()
        return msg

    def trigger_quick_action(self, message_id: str, action_name: str, prospect_id: Optional[str] = None) -> Dict[str, Any]:
        action_responses = {
            "Draft Priority 1": "⭐ Player tagged as Priority 1 on the War Room Big Board.",
            "Send Trial Run Offer": "✉️ Trial Run & Evaluation Agreement sent to player representative.",
            "Request Video Reel": "🎥 Video coordinator notified: Rush & entry breakdown queued.",
            "Trade Inquiry": "🤝 Trade Package simulation launched in the War Room.",
            "Add to Camp Roster": "📋 Added to 2026 Prospects Camp Roster (Invite List)."
        }
        resp_text = action_responses.get(action_name, f"✓ Action '{action_name}' executed successfully.")
        
        # Add automated confirmation message
        self.send_message(
            channel_id="war-room",
            sender_name="ApexScout AI Bot",
            sender_role="War Room Automation",
            text=f"**Action Executed:** {action_name} for {prospect_id or 'selected prospect'}. {resp_text}",
            quick_action="View in Big Board"
        )

        return {
            "success": True,
            "action": action_name,
            "confirmation": resp_text
        }

scout_wire = ScoutWireService()
