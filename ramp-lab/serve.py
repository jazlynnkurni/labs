#!/usr/bin/env python3
"""ramp-lab. Port 6500. No caching, and both IPv4 and IPv6, so localhost always
answers and an iPhone on the same Wi-Fi can open it too."""
import http.server, socket, sys, os
from http.server import ThreadingHTTPServer

class DualStack(ThreadingHTTPServer):
    address_family = socket.AF_INET6
    allow_reuse_address = True
    def server_bind(self):
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        super().server_bind()

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 6500
class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript'}
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a): pass
os.chdir(os.path.dirname(os.path.abspath(__file__)))
with DualStack(("", PORT), H) as httpd:
    print(f"ramp-lab  http://localhost:{PORT}")
    httpd.serve_forever()
