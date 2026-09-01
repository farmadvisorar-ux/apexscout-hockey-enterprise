import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(__file__))

from app.main import app

client = TestClient(app)

def test_endpoints():
    # 1. Health / prospects
    p_res = client.get("/api/prospects")
    assert p_res.status_code == 200
    prospects = p_res.json()
    assert len(prospects) > 0
    first_p = prospects[0]
    assert "what_they_do" in first_p
    assert "how_they_do_it" in first_p
    assert "percentile_rankings" in first_p
    print(f"[OK] Prospects loaded: {len(prospects)} players with tactical analysis")

    # 2. ScoutWire channels
    ch_res = client.get("/api/scoutwire/channels")
    assert ch_res.status_code == 200
    channels = ch_res.json()
    assert len(channels) >= 4
    print(f"[OK] ScoutWire channels verified: {len(channels)} channels")

    # 3. ScoutWire messages
    m_res = client.get("/api/scoutwire/messages?channel_id=war-room")
    assert m_res.status_code == 200
    msgs = m_res.json()
    print(f"[OK] ScoutWire messages loaded: {len(msgs)} messages in war room")

    # 4. ScoutWire send voice memo
    send_payload = {
        "channel_id": "war-room",
        "sender_name": "Dave Morrison",
        "sender_role": "Director of Scouting",
        "text": "Evaluated McKenna against Spokane. 3 primary assists.",
        "audio_duration_sec": 74.0,
        "transcript": "Evaluated McKenna against Spokane. 3 primary assists.",
        "tagged_prospect_id": first_p["id"],
        "tagged_prospect_name": f"{first_p['first_name']} {first_p['last_name']}"
    }
    s_res = client.post("/api/scoutwire/send", json=send_payload)
    assert s_res.status_code == 200
    sent_msg = s_res.json()
    assert sent_msg["sender_name"] == "Dave Morrison"
    print("[OK] ScoutWire voice memo send verified")

    # 5. ScoutWire trigger quick action
    qa_res = client.post("/api/scoutwire/quick-action", json={
        "message_id": sent_msg["id"],
        "action_name": "Draft Priority 1",
        "prospect_id": first_p["id"]
    })
    assert qa_res.status_code == 200
    qa_data = qa_res.json()
    assert qa_data["success"] is True
    print(f"[OK] ScoutWire quick action verified: {qa_data.get('action')}")

    print("\nAll ScoutWire & ApexScout backend tests passed successfully!")

if __name__ == "__main__":
    test_endpoints()
