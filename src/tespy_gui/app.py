import http.server
import json
import os
import socket
import threading
import webbrowser
from urllib.parse import urlparse

import tespy
from platformdirs import user_cache_dir
from tespy.tools.schema import generate_component_schema
from tespy.tools.schema import generate_connection_schema

from tespy_gui import __staticpath__

_SCHEMA_ROUTES = {
    "/component.json": "component.json",
    "/connection.json": "connection.json",
}


def _cache_dir() -> str:
    path = os.path.join(user_cache_dir("tespy-gui", appauthor=False), tespy.__version__)
    os.makedirs(path, exist_ok=True)
    return path


def _ensure_schemas(cache: str) -> None:
    comp_path = os.path.join(cache, "component.json")
    if not os.path.exists(comp_path):
        with open(comp_path, "w", encoding="utf-8") as f:
            f.write(json.dumps(generate_component_schema(as_json=False), indent=2))

    conn_path = os.path.join(cache, "connection.json")
    if not os.path.exists(conn_path):
        with open(conn_path, "w", encoding="utf-8") as f:
            f.write(json.dumps(generate_connection_schema(as_json=False), indent=2))


def _make_handler(cache: str):
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(__staticpath__), **kwargs)

        def do_GET(self):
            path = urlparse(self.path).path
            if path in _SCHEMA_ROUTES:
                file_path = os.path.join(cache, _SCHEMA_ROUTES[path])
                with open(file_path, "rb") as f:
                    data = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
                return
            super().do_GET()

        def log_message(self, format, *args):
            pass

    return Handler


def _find_free_port(start: int = 8080, end: int = 8180) -> int:
    for port in range(start, end):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("", port))
                return port
            except OSError:
                continue
    raise RuntimeError("No free port available in range %d–%d" % (start, end))


def main():
    cache = _cache_dir()
    _ensure_schemas(cache)

    port = _find_free_port()
    server = http.server.HTTPServer(("", port), _make_handler(cache))
    url = f"http://localhost:{port}/flowsheet-designer.html"

    print(f"TESPy GUI  →  {url}  (TESPy {tespy.__version__})")
    print("Press Ctrl+C to stop.")

    threading.Timer(0.5, webbrowser.open, args=[url]).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.shutdown()


if __name__ == "__main__":
    main()
