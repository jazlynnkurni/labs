#!/usr/bin/env python3
"""serve.py: static files plus POST /save, which writes a JSON body to the named file (ant.json, pear.json)."""
import json, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ALLOWED = {'ant.json', 'pear.json'}

class H(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()
    def do_POST(self):
        name = self.path.split('/save/')[-1] if '/save/' in self.path else 'ant.json'
        if name not in ALLOWED: self.send_response(403); self.end_headers(); return
        body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        data = json.loads(body)
        with open(name, 'w') as f: json.dump(data, f, indent=1)
        self.send_response(200); self.end_headers(); self.wfile.write(b'ok')
    def log_message(self, *a): pass

port = int(sys.argv[1]) if len(sys.argv) > 1 else 6220
ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
