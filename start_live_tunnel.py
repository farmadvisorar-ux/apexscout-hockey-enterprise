import os
import sys
import re
import time
import subprocess
import threading

CLOUDFLARED_PATH = r"C:\Users\Admin\.gemini\antigravity\scratch\wayback-deployer\backend\cloudflared.exe"
PORT = 8050

def start_backend():
    print(f"[1/2] Starting ApexScout Uvicorn backend on port {PORT}...")
    subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(PORT)],
        cwd=os.path.dirname(__file__)
    )

def start_tunnel():
    print(f"[2/2] Launching Cloudflare Tunnel pointing to http://127.0.0.1:{PORT}...")
    cmd = [CLOUDFLARED_PATH, "tunnel", "--url", f"http://127.0.0.1:{PORT}"]
    
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    tunnel_url = None
    url_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")

    for line in iter(proc.stdout.readline, ''):
        match = url_pattern.search(line)
        if match:
            tunnel_url = match.group(0)
            break

    if tunnel_url:
        with open(os.path.join(os.path.dirname(__file__), "live_public_url.txt"), "w", encoding="utf-8") as f:
            f.write(tunnel_url)
            
        print("\n" + "=" * 70)
        print("APEXSCOUT HOCKEY ENTERPRISE IS LIVE ON THE WEB!")
        print("=" * 70)
        print(f"LIVE_PUBLIC_URL: {tunnel_url}")
        print("=" * 70)
        print("Share this link with anyone on mobile, desktop, or tablet!\n")
    else:
        print("Could not parse tunnel URL.")

    # Keep tunnel alive
    proc.wait()

if __name__ == "__main__":
    start_backend()
    time.sleep(2)
    start_tunnel()
