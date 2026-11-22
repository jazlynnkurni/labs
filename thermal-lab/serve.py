#!/usr/bin/env python3
# tiles-lab server: python3 serve.py [port]. like http.server, but nothing is cached,
# so every reload shows the file as it is on disk.
import sys, http.server, functools
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()
    def log_message(self, *a): pass
port = int(sys.argv[1]) if len(sys.argv) > 1 else 6450
http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(H, directory='.')).serve_forever()
