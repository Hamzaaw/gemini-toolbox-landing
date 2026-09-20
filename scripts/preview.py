"""Preview static pages using this repository's exact Vercel rewrite paths."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import argparse
import json

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / 'vercel.json').read_text())
REWRITES = {rule['source']: rule['destination'] for rule in CONFIG['rewrites']}
REDIRECTS = {rule['source']: rule['destination'] for rule in CONFIG['redirects'] if 'has' not in rule}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path):
        parsed = urlsplit(path)
        return super().translate_path(REWRITES.get(parsed.path, parsed.path))

    def send_head(self):
        parsed = urlsplit(self.path)
        if parsed.path in REDIRECTS:
            destination = REDIRECTS[parsed.path]
            if parsed.query:
                destination += '?' + parsed.query
            self.send_response(308)
            self.send_header('Location', destination)
            self.send_header('Content-Length', '0')
            self.end_headers()
            return None
        return super().send_head()

    def end_headers(self):
        # Match the production security policy; avoid long-lived development caches.
        for header in CONFIG['headers'][0]['headers']:
            self.send_header(header['key'], header['value'])
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8787)
    args = parser.parse_args()
    print(f'Preview: http://127.0.0.1:{args.port}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
