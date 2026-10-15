#!/usr/bin/env python3
"""tp-lab: paintings printed on embossed toilet paper. Port 6140."""
import http.server, socketserver, sys, os
from http.server import ThreadingHTTPServer
import socket


class DualStack(ThreadingHTTPServer):
    """Bind BOTH stacks.

    On macOS `localhost` resolves to ::1 before 127.0.0.1. A v4-only server
    therefore refuses the browser's first connection, and Safari and Chrome do
    not always fall back -- the page just never loads, while curl (which does
    retry on v4) reports everything fine. That mismatch is why this looked like
    a dead server when it was serving perfectly.
    """
    address_family = socket.AF_INET6
    allow_reuse_address = True

    def server_bind(self):
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        super().server_bind()

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 6140

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a): pass
    def do_POST(self):
        # the shape editor saves the man's outlines next to the pages
        if self.path.split('?')[0] == '/save':
            n = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(n)
            with open('shade.json', 'wb') as f: f.write(body)
            self.send_response(200); self.end_headers(); self.wfile.write(b'ok'); return
        self.send_response(404); self.end_headers()

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with DualStack(("", PORT), H) as httpd:
    print(f"tp-lab  http://localhost:{PORT}")
    httpd.serve_forever()
