"""软件库桌面客户端：输入服务器地址 -> 校验后端 -> 在窗口内打开网页。

只做客户端壳，不包含后端。支持 https 域名与局域网 http 地址，
登录仍在网页内完成，登录态由 WebView2 的持久化配置目录保存。
"""
from __future__ import annotations

import json
import os
import sys
import threading
import urllib.error
import urllib.parse
import urllib.request
import ipaddress
from pathlib import Path

import webview
from webview.menu import Menu, MenuAction

APP_NAME = "SoftwareHubClient"
APP_TITLE = "软件库"
VERSION = "1.0"


def resource_path(name: str) -> Path:
    base = getattr(sys, "_MEIPASS", None)
    if base:
        return Path(base) / name
    return Path(__file__).resolve().parent / name


def data_dir() -> Path:
    root = os.environ.get("APPDATA") or str(Path.home())
    path = Path(root) / APP_NAME
    path.mkdir(parents=True, exist_ok=True)
    return path


CONFIG_PATH = data_dir() / "config.json"
LAUNCHER_PATH = resource_path("launcher.html")


def load_config() -> dict:
    try:
        data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    return {}


def save_config(config: dict) -> None:
    try:
        tmp = CONFIG_PATH.with_suffix(".tmp")
        tmp.write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(tmp, CONFIG_PATH)
    except Exception:
        pass


def normalize_base(raw: str) -> tuple[str, list[str]]:
    """把用户输入整理成候选 base 地址列表（不含末尾斜杠）。"""
    text = (raw or "").strip()
    if not text:
        raise ValueError("请填写服务器地址")
    has_scheme = "://" in text
    parsed = urllib.parse.urlsplit(text if has_scheme else "//" + text)
    scheme_given = parsed.scheme.lower() if has_scheme else ""
    if scheme_given and scheme_given not in ("http", "https"):
        raise ValueError("只支持 http:// 或 https:// 地址")
    host = (parsed.netloc or "").strip().strip("/")
    if not host:
        raise ValueError("服务器地址格式不正确")
    if "@" in host or any(ch.isspace() for ch in host):
        raise ValueError("服务器地址格式不正确")
    path = parsed.path.rstrip("/")
    if scheme_given:
        schemes = [scheme_given]
    else:
        hostname = host.split(":")[0].strip("[]").lower()
        local = hostname in ("localhost", "0.0.0.0", "::1") or hostname.endswith(".local")
        try:
            ip = ipaddress.ip_address(hostname)
            local = ip.is_private or ip.is_loopback or ip.is_link_local
        except ValueError:
            local = local or "." not in hostname
        schemes = ["http", "https"] if local else ["https", "http"]
    base_path = host + path
    return base_path, [f"{scheme}://{base_path}" for scheme in schemes]


def probe(base: str) -> tuple[bool, str]:
    url = base + "/api/health"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": f"SoftwareHubClient/{VERSION}", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = resp.read(2048).decode("utf-8", "replace")
            if resp.status >= 400:
                return False, f"服务器返回 HTTP {resp.status}"
            try:
                data = json.loads(body)
            except Exception:
                return False, "该地址不是软件库服务（/api/health 返回内容无法识别）"
            if isinstance(data, dict) and data.get("status") == "ok":
                return True, ""
            return False, "该地址有服务，但不是软件库后端"
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return False, "该地址没有软件库服务（/api/health 不存在）"
        return False, f"服务器返回 HTTP {exc.code}"
    except urllib.error.URLError as exc:
        reason = getattr(exc, "reason", exc)
        text = str(reason)
        if "CERTIFICATE" in text.upper() or "certificate" in text:
            return False, "HTTPS 证书校验失败，请换用有效证书或局域网 http 地址"
        if "timed out" in text.lower() or "timeout" in text.lower():
            return False, "连接超时，请确认地址、端口和网络"
        return False, f"连不上服务器：{text}"
    except Exception as exc:  # noqa: BLE001
        return False, f"连接失败：{exc}"


class Api:
    def __init__(self) -> None:
        self._window: webview.Window | None = None
        self.config = load_config()

    def state(self) -> dict:
        config = load_config()
        return {
            "version": VERSION,
            "lastUrl": config.get("last_url", ""),
            "recent": [u for u in config.get("recent", []) if isinstance(u, str)][:6],
        }

    def connect(self, raw: str) -> dict:
        try:
            target, candidates = normalize_base(raw)
        except ValueError as exc:
            return {"ok": False, "error": str(exc)}
        errors = []
        for base in candidates:
            ok, message = probe(base)
            if ok:
                recent = [u for u in self.config.get("recent", []) if isinstance(u, str) and u != base]
                recent.insert(0, base)
                self.config = {"last_url": base, "recent": recent[:6]}
                save_config(self.config)
                return {"ok": True, "base": base}
            errors.append(f"{base}：{message}")
        return {"ok": False, "error": errors[0] if errors else "连接失败"}

    def open(self, base: str) -> dict:
        if not isinstance(base, str) or not base.startswith(("http://", "https://")):
            return {"ok": False}
        config = load_config()
        config["last_url"] = base.rstrip("/")
        save_config(config)
        self.config = config
        if self._window:
            target = base.rstrip("/") + "/"
            # 延迟跳转，先让 JS 侧的调用结果返回，避免页面销毁后回调报错
            threading.Timer(0.15, lambda: self._window.load_url(target)).start()
        return {"ok": True}

    def show_launcher(self) -> None:
        if self._window:
            self._window.load_url(LAUNCHER_PATH.resolve().as_uri())


def build_menu(api: Api) -> list[Menu]:
    def switch_server() -> None:
        api.show_launcher()

    def quit_app() -> None:
        if api._window:
            api._window.destroy()

    return [
        Menu(
            "服务器",
            [
                MenuAction("切换服务器", switch_server),
                MenuAction("退出", quit_app),
            ],
        )
    ]


def _debug_probe(window: webview.Window) -> None:
    """调试用：把页面内状态写到日志，便于排查 JS API 注入问题。"""
    import time

    time.sleep(4)
    log_path = data_dir() / "debug.json"
    result = {"error": "no result"}
    try:
        raw = window.evaluate_js(
            "JSON.stringify({"
            "api: !!(window.pywebview && window.pywebview.api),"
            "keys: window.pywebview && window.pywebview.api ? Object.keys(window.pywebview.api) : [],"
            "booted: !!window.__booted,"
            "errs: window.__errs || [],"
            "version: (document.getElementById('version') || {}).textContent || '',"
            "status: (document.getElementById('status') || {}).textContent || '',"
            "href: location.href"
            "})"
        )
        result = json.loads(raw) if raw else {"raw": raw}
    except Exception as exc:  # noqa: BLE001
        result = {"error": str(exc)}
    try:
        log_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass


def main() -> None:
    api = Api()
    window = webview.create_window(
        APP_TITLE,
        url=LAUNCHER_PATH.resolve().as_uri(),
        js_api=api,
        width=980,
        height=720,
        min_size=(720, 520),
        background_color="#f5f6f8",
    )
    api._window = window
    webview.start(
        func=_debug_probe if os.environ.get("SHUB_DEBUG") else None,
        args=(window,) if os.environ.get("SHUB_DEBUG") else None,
        private_mode=False,
        storage_path=str(data_dir() / "webview"),
        menu=build_menu(api),
        icon=str(resource_path("favicon.ico")) if resource_path("favicon.ico").exists() else None,
    )


if __name__ == "__main__":
    main()
