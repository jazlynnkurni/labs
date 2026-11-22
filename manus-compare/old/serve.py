#!/usr/bin/env python3
"""iphone-lab. Port 6100. No caching, because a lab is edited every few seconds."""
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
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 6100
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a): pass
os.chdir(os.path.dirname(os.path.abspath(__file__)))

with DualStack(("", PORT), H) as httpd:
    print(f"iphone-lab  http://localhost:{PORT}")
    httpd.serve_forever()
