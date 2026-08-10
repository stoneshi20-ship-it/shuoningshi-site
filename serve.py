#!/usr/bin/env python3
"""
Static file server WITH HTTP Range support — so <video> scrubbing / seeking works locally.
(Python's built-in `python3 -m http.server` does NOT support Range, which breaks the progress bar.)

Usage:  python3 serve.py            # serves this folder on http://localhost:8765
        python3 serve.py 8000       # custom port

Not a backend — just serves the same static files, but honors Range requests.
"""
import http.server, socketserver, os, re, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765


class RangeHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path) or not os.path.isfile(path):
            return super().send_head()
        rng = self.headers.get("Range")
        if not rng:
            return super().send_head()
        m = re.match(r"bytes=(\d*)-(\d*)", rng.strip())
        if not m:
            return super().send_head()
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404); return None
        size = os.fstat(f.fileno()).st_size
        start = int(m.group(1)) if m.group(1) else 0
        end = int(m.group(2)) if m.group(2) else size - 1
        if start >= size:
            self.send_error(416); f.close(); return None
        end = min(end, size - 1)
        length = end - start + 1
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        self.send_header("Content-Length", str(length))
        self.end_headers()
        f.seek(start)
        self._range_remaining = length
        return f

    def copyfile(self, source, outputfile):
        rem = getattr(self, "_range_remaining", None)
        if rem is None:
            return super().copyfile(source, outputfile)
        self._range_remaining = None
        while rem > 0:
            chunk = source.read(min(65536, rem))
            if not chunk:
                break
            outputfile.write(chunk); rem -= len(chunk)


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    # ThreadingHTTPServer → concurrent requests, so seeking a large video isn't blocked by its own download
    with http.server.ThreadingHTTPServer(("", PORT), RangeHandler) as httpd:
        httpd.daemon_threads = True
        print("Serving (Range + threaded) at http://localhost:%d/  — Ctrl+C to stop" % PORT)
        httpd.serve_forever()
