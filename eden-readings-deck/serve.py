#!/usr/bin/env python3
"""Serve the Clover deck at http://localhost:6500 for presenting.

python3 serve.py [port]

Three things the stock `python -m http.server` got wrong, each of which made the deck load only partly:
- It bound 127.0.0.1 only. macOS resolves `localhost` to ::1 first, so the browser's first connection
  was sometimes refused and files went missing. This binds IPv6 and IPv4 together.
- It spoke HTTP/1.0, a new connection per file. With ~60 images and ~40 videos asked for at once, the
  browser's six connections clogged. This keeps connections alive (HTTP/1.1) and serves each on a thread.
- It ignored Range requests, so every video came down whole and restarting one re-fetched all of it.
  This answers Range with 206 Partial Content, which is how browsers stream and seek video.
deck.html is never cached, so a rebuild shows on reload; media is cached, so slides never refetch it.
"""
import http.server, os, re, socket, sys
from http.server import ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 6500
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class DualStack(ThreadingHTTPServer):
    address_family = socket.AF_INET6
    allow_reuse_address = True
    daemon_threads = True
    request_queue_size = 128

    def server_bind(self):
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        super().server_bind()


class Handler(http.server.SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      '.mp4': 'video/mp4', '.webm': 'video/webm', '.otf': 'font/otf', '.woff2': 'font/woff2',
                      '.svg': 'image/svg+xml', '.js': 'text/javascript', '.css': 'text/css'}

    def end_headers(self):
        html = self.path.split('?')[0].endswith(('.html', '/'))
        self.send_header('Cache-Control', 'no-store' if html else 'public, max-age=86400')
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def send_head(self):
        self._remaining = None                    # one handler serves many requests on a kept-alive connection
        rng = self.headers.get('Range')
        path = self.translate_path(self.path)
        if not rng or os.path.isdir(path) or not os.path.isfile(path):
            return super().send_head()
        m = re.match(r'bytes=(\d*)-(\d*)$', rng.strip())
        size = os.path.getsize(path)
        if not m or (m.group(1) == '' and m.group(2) == ''):
            return super().send_head()
        if m.group(1) == '':                      # the last N bytes
            start, end = max(0, size - int(m.group(2))), size - 1
        else:
            start = int(m.group(1))
            end = min(int(m.group(2)), size - 1) if m.group(2) else size - 1
        if start >= size or start > end:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return None
        f = open(path, 'rb')
        f.seek(start)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()
        self._remaining = end - start + 1
        return f

    def copyfile(self, src, dst):
        left = getattr(self, '_remaining', None)
        if left is None:
            return super().copyfile(src, dst)
        self._remaining = None
        while left > 0:
            buf = src.read(min(256 * 1024, left))
            if not buf:
                break
            dst.write(buf)
            left -= len(buf)

    def do_POST(self):
        """The disc editor saves its layout here; this is the only thing the server will write."""
        if self.path.split('?')[0] != '/save-discs':
            self.send_error(404); return
        import json
        n = int(self.headers.get('Content-Length') or 0)
        try:
            data = json.loads(self.rfile.read(n) or b'{}')
            assert isinstance(data, dict)
        except Exception:
            self.send_error(400); return
        with open('discs.json', 'w') as f:
            json.dump(data, f, indent=1)
        self.send_response(204); self.send_header('Content-Length', '0'); self.end_headers()

    def log_message(self, *a):
        pass


if __name__ == '__main__':
    with DualStack(('', PORT), Handler) as httpd:
        print(f'Clover deck  http://localhost:{PORT}/deck.html')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
