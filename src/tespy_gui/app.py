import http.server
import json
import logging
import os
import socket
import threading
import traceback
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


def _run_network(data: dict) -> dict:
    """Build and solve a TESPy network from the GUI export JSON.

    Parameters
    ----------
    data : dict
        The JSON produced by exportTESPy() on the frontend.

    Returns
    -------
    dict
        ``success``, ``converged``, and ``logs`` keys.
    """
    import tespy.components as comp_module
    from tespy.networks import Network
    from tespy.connections import Connection, PowerConnection

    log_lines: list[str] = []

    class _LogCapture(logging.Handler):
        def emit(self, record: logging.LogRecord) -> None:
            log_lines.append(self.format(record))

    handler = _LogCapture()
    handler.setFormatter(logging.Formatter("%(levelname)-8s %(message)s"))
    handler.setLevel(logging.DEBUG)

    tespy_logger = logging.getLogger("tespy")
    old_level = tespy_logger.level
    tespy_logger.setLevel(logging.DEBUG)
    tespy_logger.addHandler(handler)

    try:
        nw = Network(iterinfo=True)
        components: dict = {}

        # ── Components ──────────────────────────────────────────────────────
        for class_name, class_comps in data.get("Component", {}).items():
            cls = getattr(comp_module, class_name, None)
            if cls is None:
                raise ValueError(f"Unknown component type: {class_name!r}")
            for label, props in class_comps.items():
                comp = cls(label)
                if props:
                    comp.set_attr(**props)
                components[label] = comp

        # ── Connections ─────────────────────────────────────────────────────
        conn_class_map = {
            "Connection": Connection,
            "PowerConnection": PowerConnection,
        }
        conn_section = data.get("Connection", {})
        for conn_type, conns in conn_section.items():
            cls = conn_class_map.get(conn_type)
            if cls is None:
                log_lines.append(f"WARNING  Unknown connection type {conn_type!r}, skipping.")
                continue
            for label, conn_data in conns.items():
                src = components.get(conn_data["source"])
                tgt = components.get(conn_data["target"])
                if src is None or tgt is None:
                    raise ValueError(
                        f"Connection {label!r}: unknown component "
                        f"{conn_data['source']!r} or {conn_data['target']!r}"
                    )
                conn = cls(
                    src, conn_data["source_id"],
                    tgt, conn_data["target_id"],
                    label=label,
                )
                props = {
                    k: v for k, v in conn_data.items()
                    if k not in ("source", "target", "source_id", "target_id")
                }
                if props:
                    conn.set_attr(**props)
                nw.add_conns(conn)

        # ── Solve ────────────────────────────────────────────────────────────
        nw.solve("design")
        converged = not nw.lin_dep

        return {
            "success": True,
            "converged": converged,
            "logs": "\n".join(log_lines),
        }

    except Exception:
        return {
            "success": False,
            "converged": False,
            "logs": "\n".join(log_lines) + "\n" + traceback.format_exc(),
        }

    finally:
        tespy_logger.removeHandler(handler)
        tespy_logger.setLevel(old_level)


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

        def do_POST(self):
            path = urlparse(self.path).path
            if path == "/run":
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length)
                try:
                    payload = json.loads(body)
                    result = _run_network(payload)
                except Exception as exc:
                    result = {
                        "success": False,
                        "converged": False,
                        "logs": traceback.format_exc(),
                    }
                response = json.dumps(result).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(response)))
                self.end_headers()
                self.wfile.write(response)
                return
            self.send_error(404)

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
