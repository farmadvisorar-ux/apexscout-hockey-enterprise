import os
import sys
import socket
import webbrowser
import threading
import time
import uvicorn

def find_available_port(start_port=8050, max_port=8090):
    for port in range(start_port, max_port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", port)) != 0:
                return port
    return start_port

def open_browser_delayed(url, delay=1.2):
    time.sleep(delay)
    print(f"\n🚀 Opening ApexScout Hockey Enterprise in your browser: {url}")
    webbrowser.open(url)

def main():
    port = find_available_port(8050)
    url = f"http://127.0.0.1:{port}"

    print("=" * 70)
    print("  🏒  APEXSCOUT HOCKEY ENTERPRISE - COMMAND CENTER")
    print("  Next-Gen Scouting, Draft War Room, NIL Optimizer & ScoutWire Hub")
    print("=" * 70)
    print(f"  Local Server running at: {url}")
    print("  Features ready:")
    print("   • High-Contrast Brightened UI with Instant Number Readability")
    print("   • Tactical 'What They Do & How They Do It' Player Breakdowns")
    print("   • AI 'Computer Brain' Draft Floor & Salary Cap Optimizer")
    print("   • ScoutWire™ Unlimited Voice Memos & Team Collaboration")
    print("=" * 70)
    print("  Press Ctrl+C in this terminal to stop the server.\n")

    # Open browser automatically in a background thread
    threading.Thread(target=open_browser_delayed, args=(url,), daemon=True).start()

    uvicorn.run("app.main:app", host="127.0.0.1", port=port, log_level="info")

if __name__ == "__main__":
    main()
