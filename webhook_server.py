import http.server, hashlib, hmac, json, os, subprocess

def load_secret():
    try:
        with open("/repo/webhooksecret.txt") as f:
            return f.read().strip()
    except Exception:
        return os.environ.get("WEBHOOK_SECRET", "")

SECRET = load_secret()
REPO = "/repo"
PORT = 9000

class Handler(http.server.BaseHTTPRequestHandler):
    def reply(self, code, msg):
        self.send_response(code); self.end_headers(); self.wfile.write(msg)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        sig = self.headers.get("X-Hub-Signature-256", "")
        expected = "sha256=" + hmac.new(SECRET.encode(), body, hashlib.sha256).hexdigest()
        if not SECRET or not hmac.compare_digest(sig, expected):
            return self.reply(401, b"bad signature")
        event = self.headers.get("X-GitHub-Event", "")
        if event == "ping":
            return self.reply(200, b"pong")
        if event != "push":
            return self.reply(200, b"ignored event")
        try:
            payload = json.loads(body.decode())
        except Exception:
            payload = {}
        if payload.get("ref", "") != "refs/heads/main":
            return self.reply(200, b"ignored ref")
        self.reply(200, b"deploying")
        self.deploy()

    def deploy(self):
        try:
            subprocess.run(["git", "pull", "origin", "main"], cwd=REPO, check=True)
            subprocess.run(["docker", "compose", "build", "app"], cwd=REPO, check=True)
            subprocess.run(["docker", "compose", "up", "-d", "app"], cwd=REPO, check=True)
            print("deploy finished OK")
        except Exception as e:
            print("deploy failed:", e)

    def log_message(self, fmt, *args):
        print(fmt % args)

if __name__ == "__main__":
    server = http.server.HTTPServer(("0.0.0.0", PORT), Handler)
    print("webhook listener on port", PORT)
    server.serve_forever()
