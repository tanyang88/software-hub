"""软件大全 - 后端服务（仅依赖 Python 标准库）

功能：
- 分类 / 软件的增删改查、关键字搜索、多种排序、分页
- 管理员登录（会话 Cookie）、账号安全（改用户名 / 改密码）
- 站点设置（站点名称、网站标题、网站图标、外观主题、语言）
- 备份与恢复（导出 / 导入 zip）
- 图标上传与静态资源托管

数据全部保存在 DATA_DIR 下的 SQLite 文件中，容器重启不丢。
"""

import hashlib
import hmac
import io
import json
import math
import os
import re
import secrets
import sqlite3
import sys
import threading
import time
import urllib.parse
import uuid
import zipfile
from datetime import date, datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
# 拼音排序键模块与本文件同目录，显式加入 sys.path，避免依赖启动方式
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
import pinyin  # noqa: E402  汉字 -> 拼音排序键（无第三方依赖）
STATIC_DIR = BASE_DIR / "static"
DATA_DIR = Path(os.environ.get("DATA_DIR", BASE_DIR.parent / "data")).resolve()
UPLOAD_DIR = DATA_DIR / "uploads"
DB_PATH = DATA_DIR / "app.db"
PORT = int(os.environ.get("PORT", "8080"))
HOST = os.environ.get("HOST", "0.0.0.0")

SESSION_COOKIE = "hub_session"
SESSION_HOURS = 12
SESSION_HOURS_REMEMBER = 24 * 30
DEFAULT_ADMIN_USER = os.environ.get("ADMIN_USER", "admin")
DEFAULT_ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")

DEFAULT_SETTINGS = {
    "site_name": "软件库",
    "site_title": "软件库",
    "site_tagline": "专属于你的软件收藏",
    "site_icon": "/static/favicon.svg",
    "theme": "system",
    "language": "zh-CN",
    "hot_window": "7",  # 热门统计时间窗：7 / 30 / off（关闭热门排序）
    "hot_board": "1",  # 是否在顶部操作栏显示热门榜入口：1 / 0
    "search_highlight": "1",  # 搜索结果是否高亮关键词：1 / 0
}

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
}

ALLOWED_UPLOAD_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}

SORT_OPTIONS = {
    "default": "s.id DESC",
    "updated": "COALESCE(NULLIF(s.updated_at, ''), s.created_at) DESC, s.id DESC",
    "oldest": "s.id ASC",
    "name_asc": "s.name_sort COLLATE NOCASE ASC, s.id ASC",
    "name_desc": "s.name_sort COLLATE NOCASE DESC, s.id ASC",
    "hot": "s.hot_score DESC, s.id DESC",
}

# 热门打分：行为权重 + 近 7 天 / 近 30 天加权（指数衰减）
HOT_WEIGHTS = {"link_click": 1.0, "icon_click": 0.6, "focus_view": 0.4, "search_hit": 0.3}
HOT_STAT_COLUMNS = {
    "link_click": "link_clicks",
    "icon_click": "icon_clicks",
    "focus_view": "focus_views",
    "search_hit": "search_hits",
}
EVENT_TYPES = ("link_click", "icon_click", "focus_view", "search")

# 热门统计时间窗（可在设置页切换）：7 = 近期为主 + 中期趋势，30 = 纯 30 天窗口，off = 关闭热门排序
HOT_WINDOW_MODES = {
    "7": ((0.6, 7, 7.0), (0.4, 30, 14.0)),
    "30": ((1.0, 30, 14.0),),
    "off": (),
}

# 防刷：同一 IP 对同一条链接 / 图标 / 搜索词，10 秒内只计一次
EVENT_THROTTLE_SECONDS = 10.0
_EVENT_THROTTLE = {}
_EVENT_THROTTLE_LOCK = threading.Lock()
_EVENT_THROTTLE_MAX = 5000

# 置顶卡片永远排在最前，且不受排序影响
PINNED_FIRST = "s.pinned DESC, "

# 支持系统与授权方式（与前端选项保持一致）
PLATFORM_KEYS = ("windows", "mac", "linux", "android", "ios", "harmonyos")
LICENSE_KEYS = ("free", "subscription", "onetime", "metered", "freemium")


class AuthError(Exception):
    """未登录或登录失效"""


# ----------------------------------------------------------------------------
# 密码与会话
# ----------------------------------------------------------------------------
def hash_password(password, salt=None, iterations=200_000):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return "pbkdf2_sha256$%d$%s$%s" % (iterations, salt, digest.hex())


def verify_password(password, stored):
    try:
        scheme, iterations, salt, digest = stored.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False
        candidate = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), salt.encode("utf-8"), int(iterations)
        ).hex()
        return hmac.compare_digest(candidate, digest)
    except (ValueError, TypeError):
        return False


def now_str():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# ----------------------------------------------------------------------------
# 数据库
# ----------------------------------------------------------------------------
def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _today_str():
    return date.today().isoformat()


def bump_stat(conn, software_id, event_type, delta=1):
    """给某个软件当天对应行为的计数 +delta"""
    column = HOT_STAT_COLUMNS.get(event_type)
    if not column or not software_id:
        return
    today = _today_str()
    conn.execute(
        "INSERT OR IGNORE INTO software_stats (software_id, date) VALUES (?, ?)",
        (software_id, today),
    )
    conn.execute(
        "UPDATE software_stats SET %s = %s + ? WHERE software_id = ? AND date = ?"
        % (column, column),
        (delta, software_id, today),
    )


def _decayed_sum(rows, days, tau):
    """窗口内按天计数做指数衰减加权求和"""
    today = date.today()
    total = 0.0
    for row in rows:
        try:
            age = (today - date.fromisoformat(row["date"])).days
        except ValueError:
            continue
        if age < 0 or age > days:
            continue
        weight = math.exp(-age / tau)
        total += weight * (
            row["link_clicks"] * HOT_WEIGHTS["link_click"]
            + row["icon_clicks"] * HOT_WEIGHTS["icon_click"]
            + row["focus_views"] * HOT_WEIGHTS["focus_view"]
            + row["search_hits"] * HOT_WEIGHTS["search_hit"]
        )
    return total


def hot_window_mode(conn=None):
    """读取设置里的热门时间窗，非法值回退 7 天"""
    own = conn is None
    if own:
        conn = connect()
    try:
        row = conn.execute("SELECT value FROM settings WHERE key = 'hot_window'").fetchone()
        mode = (row["value"] if row else "7") or "7"
        return mode if mode in HOT_WINDOW_MODES else "7"
    finally:
        if own:
            conn.close()


def compute_hot_score(conn, software_id):
    """按当前时间窗配置计算热度分并写回 software.hot_score"""
    mode = hot_window_mode(conn)
    parts = HOT_WINDOW_MODES.get(mode, ())
    if not parts:
        conn.execute("UPDATE software SET hot_score = 0 WHERE id = ?", (software_id,))
        return 0.0
    max_days = max(p[1] for p in parts)
    rows = conn.execute(
        "SELECT date, link_clicks, icon_clicks, focus_views, search_hits "
        "FROM software_stats WHERE software_id = ? AND date >= ?",
        (software_id, (date.today() - timedelta(days=max_days)).isoformat()),
    ).fetchall()
    score = 0.0
    for weight, days, tau in parts:
        score += weight * _decayed_sum(rows, days, tau)
    conn.execute("UPDATE software SET hot_score = ? WHERE id = ?", (round(score, 6), software_id))
    return score


def recompute_all_hot(conn):
    for row in conn.execute("SELECT id FROM software").fetchall():
        compute_hot_score(conn, row["id"])


def _event_throttled(ip, key):
    """同一 IP + 同一目标 10 秒内只计一次"""
    if not ip:
        return False
    composite = ip + "|" + key
    now = time.time()
    with _EVENT_THROTTLE_LOCK:
        if len(_EVENT_THROTTLE) > _EVENT_THROTTLE_MAX:
            cutoff = now - 60
            for k in [k for k, v in _EVENT_THROTTLE.items() if v < cutoff]:
                _EVENT_THROTTLE.pop(k, None)
        last = _EVENT_THROTTLE.get(composite)
        if last is not None and (now - last) < EVENT_THROTTLE_SECONDS:
            return True
        _EVENT_THROTTLE[composite] = now
        return False


def hot_overview():
    """热门榜：Top 10 软件 + 搜索词 Top 20 + 近 7 天趋势"""
    conn = connect()
    try:
        mode = hot_window_mode(conn)
        top = conn.execute(
            "SELECT id, name, logo, hot_score FROM software "
            "ORDER BY hot_score DESC, id DESC LIMIT 10"
        ).fetchall()
        since = (date.today() - timedelta(days=29)).isoformat()
        searches = conn.execute(
            "SELECT term, SUM(hits) AS hits FROM search_terms WHERE date >= ? "
            "GROUP BY term ORDER BY hits DESC, term ASC LIMIT 20",
            (since,),
        ).fetchall()

        trend_days = []
        today = date.today()
        for offset in range(6, -1, -1):
            trend_days.append((today - timedelta(days=offset)).isoformat())
        stats = {}
        for row in conn.execute(
            "SELECT date, SUM(link_clicks) AS lc, SUM(icon_clicks) AS ic, "
            "SUM(focus_views) AS fv, SUM(search_hits) AS sh "
            "FROM software_stats WHERE date >= ? GROUP BY date",
            (trend_days[0],),
        ).fetchall():
            stats[row["date"]] = row
        terms = {}
        for row in conn.execute(
            "SELECT date, SUM(hits) AS hits FROM search_terms WHERE date >= ? GROUP BY date",
            (trend_days[0],),
        ).fetchall():
            terms[row["date"]] = row["hits"]

        trend = []
        for day in trend_days:
            row = stats.get(day)
            link_clicks = row["lc"] if row else 0
            icon_clicks = row["ic"] if row else 0
            focus_views = row["fv"] if row else 0
            search_hits = row["sh"] if row else 0
            total = link_clicks + icon_clicks + focus_views + search_hits
            trend.append(
                {
                    "date": day,
                    "link_clicks": link_clicks,
                    "icon_clicks": icon_clicks,
                    "focus_views": focus_views,
                    "search_hits": search_hits,
                    "search_terms": terms.get(day, 0),
                    "total": total,
                }
            )

        return {
            "window": mode,
            "items": [
                {
                    "id": r["id"],
                    "name": r["name"],
                    "logo": r["logo"],
                    "hot_score": round(r["hot_score"] or 0, 3),
                }
                for r in top
            ],
            "searches": [{"term": r["term"], "hits": r["hits"]} for r in searches],
            "trend": trend,
            "total_events": sum(t["total"] for t in trend),
        }
    finally:
        conn.close()


def record_event(body, ip=""):
    """记录一次前端行为；写原始事件 + 当天汇总 + 刷新该软件热度分"""
    event_type = (body.get("type") or "").strip()
    if event_type not in EVENT_TYPES:
        raise ValueError("不支持的事件类型")
    field = (body.get("field") or "").strip()[:40]
    keyword = (body.get("keyword") or "").strip()[:60]

    conn = connect()
    try:
        software_id = None
        raw_id = body.get("software_id")
        if raw_id not in (None, "", 0):
            try:
                software_id = int(raw_id)
            except (TypeError, ValueError):
                software_id = None

        if event_type == "search":
            if not keyword:
                return {"ok": True}
            if _event_throttled(ip, "search:" + keyword.lower()):
                return {"ok": True, "throttled": True}
            conn.execute(
                "INSERT INTO events (type, keyword) VALUES (?, ?)", (event_type, keyword)
            )
            today = _today_str()
            conn.execute(
                "INSERT OR IGNORE INTO search_terms (term, date) VALUES (?, ?)", (keyword, today)
            )
            conn.execute(
                "UPDATE search_terms SET hits = hits + 1 WHERE term = ? AND date = ?",
                (keyword, today),
            )
            # 被搜索命中：名称包含关键词的软件各加一次搜索热度（最多 20 个）
            matched = conn.execute(
                "SELECT id FROM software WHERE name LIKE ? LIMIT 20", ("%" + keyword + "%",)
            ).fetchall()
            for row in matched:
                bump_stat(conn, row["id"], "search_hit")
                compute_hot_score(conn, row["id"])
        else:
            if not software_id:
                return {"ok": True}
            if not conn.execute(
                "SELECT 1 FROM software WHERE id = ?", (software_id,)
            ).fetchone():
                return {"ok": True}
            if _event_throttled(ip, "%s:%s:%s" % (event_type, software_id, field)):
                return {"ok": True, "throttled": True}
            conn.execute(
                "INSERT INTO events (type, software_id, field) VALUES (?, ?, ?)",
                (event_type, software_id, field),
            )
            bump_stat(conn, software_id, event_type)
            compute_hot_score(conn, software_id)

        conn.commit()
        return {"ok": True}
    finally:
        conn.close()


def init_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    conn = connect()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            );

            CREATE TABLE IF NOT EXISTS software (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                name_sort TEXT NOT NULL DEFAULT '',
                description TEXT NOT NULL DEFAULT '',
                logo TEXT NOT NULL DEFAULT '',
                url_home TEXT NOT NULL DEFAULT '',
                url_github TEXT NOT NULL DEFAULT '',
                url_release TEXT NOT NULL DEFAULT '',
                url_doc TEXT NOT NULL DEFAULT '',
                downloads TEXT NOT NULL DEFAULT '[]',
                platforms TEXT NOT NULL DEFAULT '{}',
                licenses TEXT NOT NULL DEFAULT '[]',
                extra_links TEXT NOT NULL DEFAULT '[]',
                url_home_label TEXT NOT NULL DEFAULT '',
                url_home_text TEXT NOT NULL DEFAULT '',
                url_github_label TEXT NOT NULL DEFAULT '',
                url_github_text TEXT NOT NULL DEFAULT '',
                url_release_label TEXT NOT NULL DEFAULT '',
                url_release_text TEXT NOT NULL DEFAULT '',
                url_doc_label TEXT NOT NULL DEFAULT '',
                url_doc_text TEXT NOT NULL DEFAULT '',
                pinned INTEGER NOT NULL DEFAULT 0,
                card_color TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
                updated_at TEXT NOT NULL DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS software_categories (
                software_id INTEGER NOT NULL,
                category_id INTEGER NOT NULL,
                PRIMARY KEY (software_id, category_id),
                FOREIGN KEY (software_id) REFERENCES software(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_sc_category ON software_categories(category_id);

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            );
            """
        )

        # 兼容旧库：补 updated_at 字段
        columns = [r["name"] for r in conn.execute("PRAGMA table_info(software)").fetchall()]
        if "updated_at" not in columns:
            conn.execute("ALTER TABLE software ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''")
        conn.execute(
            "UPDATE software SET updated_at = created_at WHERE updated_at = '' OR updated_at IS NULL"
        )
        # 兼容旧库：置顶、卡片自定义背景色
        if "pinned" not in columns and "category_id" not in columns:
            conn.execute("ALTER TABLE software ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0")
        if "card_color" not in columns and "category_id" not in columns:
            conn.execute("ALTER TABLE software ADD COLUMN card_color TEXT NOT NULL DEFAULT ''")
        if "licenses" not in columns and "category_id" not in columns:
            conn.execute("ALTER TABLE software ADD COLUMN licenses TEXT NOT NULL DEFAULT '[]'")

        # 兼容旧库：single category_id -> 多分类关联表 software_categories
        if "category_id" in columns:
            migrate_to_multi_categories(conn)

        # 兼容旧库：中文按拼音排序用的派生列（name_sort 由 pinyin.key 生成）
        if "name_sort" not in columns:
            conn.execute("ALTER TABLE software ADD COLUMN name_sort TEXT NOT NULL DEFAULT ''")
            columns.append("name_sort")
        # 兼容旧库：卡片自定义链接（名称 + 链接，存 JSON 数组）
        if "extra_links" not in columns:
            conn.execute("ALTER TABLE software ADD COLUMN extra_links TEXT NOT NULL DEFAULT '[]'")
            columns.append("extra_links")
        # 兼容旧库：四个固定链接的自定义名称 / 显示文字
        for key in ("url_home", "url_github", "url_release", "url_doc"):
            for suffix in ("label", "text"):
                column = f"{key}_{suffix}"
                if column not in columns:
                    conn.execute(
                        f"ALTER TABLE software ADD COLUMN {column} TEXT NOT NULL DEFAULT ''"
                    )
                    columns.append(column)
        pending = conn.execute("SELECT id, name FROM software WHERE name_sort = ''").fetchall()
        for r in pending:
            conn.execute(
                "UPDATE software SET name_sort = ? WHERE id = ?", (pinyin.key(r["name"]), r["id"])
            )

        # 热门排序：热度分派生列 + 行为事件表 + 按天汇总表
        if "hot_score" not in columns:
            conn.execute("ALTER TABLE software ADD COLUMN hot_score REAL NOT NULL DEFAULT 0")
            columns.append("hot_score")
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                software_id INTEGER,
                field TEXT NOT NULL DEFAULT '',
                keyword TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            );
            CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
            CREATE INDEX IF NOT EXISTS idx_events_software ON events(software_id, created_at);
            CREATE TABLE IF NOT EXISTS software_stats (
                software_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                link_clicks INTEGER NOT NULL DEFAULT 0,
                icon_clicks INTEGER NOT NULL DEFAULT 0,
                focus_views INTEGER NOT NULL DEFAULT 0,
                search_hits INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (software_id, date)
            );
            CREATE TABLE IF NOT EXISTS search_terms (
                term TEXT NOT NULL,
                date TEXT NOT NULL,
                hits INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (term, date)
            );
            """
        )
        recompute_all_hot(conn)

        normalize_uncategorized(conn)

        for key, value in DEFAULT_SETTINGS.items():
            conn.execute(
                "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (key, value)
            )
        # 副标题留空的旧库补上默认文案
        conn.execute(
            "UPDATE settings SET value = ? WHERE key = 'site_tagline' AND value = ''",
            (DEFAULT_SETTINGS["site_tagline"],),
        )

        if conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
            conn.execute(
                "INSERT INTO users (username, password_hash) VALUES (?, ?)",
                (DEFAULT_ADMIN_USER, hash_password(DEFAULT_ADMIN_PASSWORD)),
            )

        conn.commit()
    finally:
        conn.close()


def normalize_uncategorized(conn):
    """「未分类」是虚拟分类（不落库），把库里同名的旧分类清掉，
    其下的软件没有其它归类时自然显示在「未分类」里。"""
    ids = [r["id"] for r in conn.execute("SELECT id FROM categories WHERE name = '未分类'").fetchall()]
    if not ids:
        return
    marks = ",".join("?" * len(ids))
    conn.execute("DELETE FROM software_categories WHERE category_id IN (%s)" % marks, ids)
    conn.execute("DELETE FROM categories WHERE id IN (%s)" % marks, ids)


def migrate_to_multi_categories(conn):
    """把旧的 software.category_id 拆表迁移到 software_categories（软件可属多个分类）。

    迁移后 software 表不再有 category_id 字段；没有挂任何分类的软件即「未分类」。
    """
    conn.execute("PRAGMA legacy_alter_table = ON")
    conn.execute("PRAGMA foreign_keys = OFF")
    try:
        links = conn.execute(
            "SELECT s.id AS software_id, s.category_id AS category_id FROM software s "
            "JOIN categories c ON c.id = s.category_id"
        ).fetchall()
        conn.execute("DROP INDEX IF EXISTS idx_software_category")
        conn.execute("DROP TABLE IF EXISTS software_categories")
        conn.execute("ALTER TABLE software RENAME TO software_legacy")
        conn.executescript(
            """
            CREATE TABLE software (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                name_sort TEXT NOT NULL DEFAULT '',
                description TEXT NOT NULL DEFAULT '',
                logo TEXT NOT NULL DEFAULT '',
                url_home TEXT NOT NULL DEFAULT '',
                url_github TEXT NOT NULL DEFAULT '',
                url_release TEXT NOT NULL DEFAULT '',
                url_doc TEXT NOT NULL DEFAULT '',
                downloads TEXT NOT NULL DEFAULT '[]',
                platforms TEXT NOT NULL DEFAULT '{}',
                licenses TEXT NOT NULL DEFAULT '[]',
                extra_links TEXT NOT NULL DEFAULT '[]',
                url_home_label TEXT NOT NULL DEFAULT '',
                url_home_text TEXT NOT NULL DEFAULT '',
                url_github_label TEXT NOT NULL DEFAULT '',
                url_github_text TEXT NOT NULL DEFAULT '',
                url_release_label TEXT NOT NULL DEFAULT '',
                url_release_text TEXT NOT NULL DEFAULT '',
                url_doc_label TEXT NOT NULL DEFAULT '',
                url_doc_text TEXT NOT NULL DEFAULT '',
                pinned INTEGER NOT NULL DEFAULT 0,
                card_color TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
                updated_at TEXT NOT NULL DEFAULT ''
            );

            CREATE TABLE software_categories (
                software_id INTEGER NOT NULL,
                category_id INTEGER NOT NULL,
                PRIMARY KEY (software_id, category_id),
                FOREIGN KEY (software_id) REFERENCES software(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_sc_category ON software_categories(category_id);
            """
        )
        conn.execute(
            """INSERT INTO software
               (id, name, description, logo, url_home, url_github, url_release,
                url_doc, downloads, platforms, created_at, updated_at)
               SELECT id, name, description, logo, url_home, url_github, url_release,
                      url_doc, downloads, platforms, created_at, updated_at
               FROM software_legacy"""
        )
        for link in links:
            conn.execute(
                "INSERT OR IGNORE INTO software_categories (software_id, category_id) VALUES (?, ?)",
                (link["software_id"], link["category_id"]),
            )
        conn.execute("DROP TABLE software_legacy")
    finally:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA legacy_alter_table = OFF")


# 说明：默认不再预置任何分类，也没有示例软件；侧栏固定提供「全部软件」与「未分类」。


# ----------------------------------------------------------------------------
# 设置
# ----------------------------------------------------------------------------
def get_settings():
    conn = connect()
    try:
        rows = conn.execute("SELECT key, value FROM settings").fetchall()
        result = dict(DEFAULT_SETTINGS)
        result.update({r["key"]: r["value"] for r in rows})
        return result
    finally:
        conn.close()


def update_settings(body):
    allowed = set(DEFAULT_SETTINGS.keys())
    conn = connect()
    try:
        for key, value in body.items():
            if key not in allowed:
                continue
            conn.execute(
                "INSERT INTO settings (key, value) VALUES (?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (key, str(value)[:500]),
            )
        conn.commit()
        # 时间窗改了要按新窗口重算全部热度
        if "hot_window" in body:
            recompute_all_hot(conn)
            conn.commit()
    finally:
        conn.close()
    return get_settings()


# ----------------------------------------------------------------------------
# 认证
# ----------------------------------------------------------------------------
def find_user(username):
    conn = connect()
    try:
        return conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    finally:
        conn.close()


def create_session(user_id, remember):
    token = secrets.token_hex(32)
    hours = SESSION_HOURS_REMEMBER if remember else SESSION_HOURS
    expires = (datetime.now() + timedelta(hours=hours)).strftime("%Y-%m-%d %H:%M:%S")
    conn = connect()
    try:
        conn.execute(
            "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
            (token, user_id, expires),
        )
        conn.execute("DELETE FROM sessions WHERE expires_at < ?", (now_str(),))
        conn.commit()
    finally:
        conn.close()
    return token, hours


def session_username(token):
    if not token:
        return None
    conn = connect()
    try:
        row = conn.execute(
            """SELECT u.username FROM sessions s JOIN users u ON u.id = s.user_id
               WHERE s.token = ? AND s.expires_at > ?""",
            (token, now_str()),
        ).fetchone()
        return row["username"] if row else None
    finally:
        conn.close()


def delete_session(token):
    if not token:
        return
    conn = connect()
    try:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
    finally:
        conn.close()


def change_account(username, current_password, new_username, new_password):
    if not current_password:
        raise ValueError("请输入当前密码")
    user = find_user(username)
    if not user or not verify_password(current_password, user["password_hash"]):
        raise ValueError("当前密码不正确")

    new_username = (new_username or "").strip() or username
    new_password = new_password or ""
    if new_password and len(new_password) < 6:
        raise ValueError("新密码至少 6 位")

    conn = connect()
    try:
        if new_username != username:
            exists = conn.execute(
                "SELECT 1 FROM users WHERE username = ? AND id <> ?", (new_username, user["id"])
            ).fetchone()
            if exists:
                raise ValueError("该用户名已被占用")
        conn.execute(
            "UPDATE users SET username = ?, password_hash = ? WHERE id = ?",
            (
                new_username,
                hash_password(new_password) if new_password else user["password_hash"],
                user["id"],
            ),
        )
        conn.commit()
    finally:
        conn.close()
    return new_username


# ----------------------------------------------------------------------------
# 分类 / 软件
# ----------------------------------------------------------------------------
def row_category(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "sort_order": row["sort_order"],
        "count": row["count"] if "count" in row.keys() else None,
    }


def row_software(row):
    return {
        "id": row["id"],
        "category_ids": [],
        "category_names": [],
        "name": row["name"],
        "description": row["description"],
        "logo": row["logo"],
        "url_home": row["url_home"],
        "url_github": row["url_github"],
        "url_release": row["url_release"],
        "url_doc": row["url_doc"],
        "downloads": json.loads(row["downloads"] or "[]"),
        "extra_links": json.loads(row["extra_links"] or "[]") if "extra_links" in row.keys() else [],
        "url_home_label": row["url_home_label"] if "url_home_label" in row.keys() else "",
        "url_home_text": row["url_home_text"] if "url_home_text" in row.keys() else "",
        "url_github_label": row["url_github_label"] if "url_github_label" in row.keys() else "",
        "url_github_text": row["url_github_text"] if "url_github_text" in row.keys() else "",
        "url_release_label": row["url_release_label"] if "url_release_label" in row.keys() else "",
        "url_release_text": row["url_release_text"] if "url_release_text" in row.keys() else "",
        "url_doc_label": row["url_doc_label"] if "url_doc_label" in row.keys() else "",
        "url_doc_text": row["url_doc_text"] if "url_doc_text" in row.keys() else "",
        "platforms": json.loads(row["platforms"] or "{}"),
        "licenses": json.loads(row["licenses"] or "[]") if "licenses" in row.keys() else [],
        "pinned": bool(row["pinned"]) if "pinned" in row.keys() else False,
        "card_color": row["card_color"] if "card_color" in row.keys() else "",
        "created_at": row["created_at"],
        "updated_at": row["updated_at"] if "updated_at" in row.keys() else "",
    }


def list_categories():
    conn = connect()
    try:
        rows = conn.execute(
            """SELECT c.id, c.name, c.sort_order,
                      (SELECT COUNT(DISTINCT sc.software_id)
                         FROM software_categories sc WHERE sc.category_id = c.id) AS count
               FROM categories c
               ORDER BY c.sort_order ASC, c.id ASC"""
        ).fetchall()
        total = conn.execute("SELECT COUNT(*) FROM software").fetchone()[0]
        uncategorized = conn.execute(
            """SELECT COUNT(*) FROM software s
               WHERE NOT EXISTS (SELECT 1 FROM software_categories sc WHERE sc.software_id = s.id)"""
        ).fetchone()[0]
        return {
            "items": [row_category(r) for r in rows],
            "total": total,
            "uncategorized": uncategorized,
        }
    finally:
        conn.close()


def attach_categories(conn, items):
    """给每条软件补上所属分类（软件可同时属于多个分类）"""
    if not items:
        return items
    ids = [item["id"] for item in items]
    rows = conn.execute(
        """SELECT sc.software_id, c.id, c.name
           FROM software_categories sc JOIN categories c ON c.id = sc.category_id
           WHERE sc.software_id IN (%s)
           ORDER BY c.sort_order ASC, c.id ASC""" % ",".join("?" * len(ids)),
        ids,
    ).fetchall()
    grouped = {}
    for row in rows:
        grouped.setdefault(row["software_id"], []).append({"id": row["id"], "name": row["name"]})
    for item in items:
        cats = grouped.get(item["id"], [])
        item["categories"] = cats
        item["category_ids"] = [c["id"] for c in cats]
        item["category_names"] = [c["name"] for c in cats]
    return items


def parse_category_ids(body, conn):
    """接受 category_ids 数组（兼容旧的单个 category_id），返回去重后的合法分类 id 列表"""
    raw = body.get("category_ids")
    if raw is None:
        raw = body.get("category_id")
    if raw is None:
        return []
    if not isinstance(raw, (list, tuple, set)):
        raw = [raw]
    clean = []
    for value in raw:
        if value in (None, "", "all", "uncategorized"):
            continue
        try:
            cid = int(value)
        except (TypeError, ValueError):
            continue
        if cid not in clean:
            clean.append(cid)
    for cid in clean:
        if not conn.execute("SELECT 1 FROM categories WHERE id = ?", (cid,)).fetchone():
            raise ValueError("分类不存在")
    return clean


def parse_software_payload(body, conn):
    name = (body.get("name") or "").strip()
    if not name:
        raise ValueError("软件名称不能为空")
    category_ids = parse_category_ids(body, conn)

    downloads = body.get("downloads") or []
    if not isinstance(downloads, list):
        raise ValueError("下载列表格式不正确")
    clean_downloads = []
    for item in downloads:
        if not isinstance(item, dict):
            continue
        text = (item.get("text") or "").strip()
        link = (item.get("link") or "").strip()
        label = (item.get("label") or "").strip()[:60]
        if text and link:
            row = {"text": text, "link": link}
            if label:
                row["label"] = label
            clean_downloads.append(row)

    # 其他链接：自定义名称 + 链接，可多条
    extra_links = body.get("extra_links") or []
    if not isinstance(extra_links, list):
        raise ValueError("其他链接格式不正确")
    clean_extra_links = []
    for item in extra_links:
        if not isinstance(item, dict):
            continue
        text = (item.get("text") or "").strip()[:30]
        link = (item.get("link") or "").strip()
        label = (item.get("label") or "").strip()[:60]
        if text and link:
            row = {"text": text, "link": link}
            if label:
                row["label"] = label
            clean_extra_links.append(row)

    platforms = body.get("platforms") or {}
    if not isinstance(platforms, dict):
        platforms = {}
    clean_platforms = {k: bool(platforms.get(k)) for k in PLATFORM_KEYS}

    licenses = body.get("licenses") or []
    if not isinstance(licenses, list):
        licenses = []
    clean_licenses = []
    for value in licenses:
        key = str(value).strip()
        if key in LICENSE_KEYS and key not in clean_licenses:
            clean_licenses.append(key)

    def text(field):
        return (body.get(field) or "").strip()

    card_color = text("card_color")
    if card_color and not re.fullmatch(r"#[0-9a-fA-F]{3,8}", card_color):
        card_color = ""

    return {
        "category_ids": category_ids,
        "name": name,
        "description": text("description"),
        "logo": text("logo"),
        "url_home": text("url_home"),
        "url_github": text("url_github"),
        "url_release": text("url_release"),
        "url_doc": text("url_doc"),
        "url_home_label": text("url_home_label")[:30],
        "url_home_text": text("url_home_text")[:60],
        "url_github_label": text("url_github_label")[:30],
        "url_github_text": text("url_github_text")[:60],
        "url_release_label": text("url_release_label")[:30],
        "url_release_text": text("url_release_text")[:60],
        "url_doc_label": text("url_doc_label")[:30],
        "url_doc_text": text("url_doc_text")[:60],
        "downloads": clean_downloads,
        "extra_links": clean_extra_links,
        "platforms": clean_platforms,
        "licenses": clean_licenses,
        "card_color": card_color,
    }


def search_relevance_clause(q):
    """搜索结果的相关度排序：名称完全一致 > 名称忽略空格/连字符后一致
    > 名称前缀 > 名称包含 > 名称忽略符号后包含 > 只在简介命中"""
    ql = q.lower()
    compact = re.sub(r"[\s\-_]+", "", ql)
    sql = (
        "CASE "
        "WHEN lower(trim(s.name)) = ? THEN 100 "
        "WHEN lower(replace(replace(replace(trim(s.name), ' ', ''), '-', ''), '_', '')) = ? THEN 95 "
        "WHEN lower(s.name) LIKE ? THEN 80 "
        "WHEN lower(s.name) LIKE ? THEN 60 "
        "WHEN lower(replace(replace(replace(s.name, ' ', ''), '-', ''), '_', '')) LIKE ? THEN 55 "
        "ELSE 30 END"
    )
    params = [ql, compact, ql + "%", "%" + ql + "%", "%" + compact + "%"]
    return sql, params


def list_software(query):
    try:
        page = max(1, int(query.get("page", ["1"])[0]))
    except ValueError:
        page = 1
    try:
        page_size = int(query.get("page_size", ["20"])[0])
    except ValueError:
        page_size = 20
    page_size = min(max(page_size, 1), 120)

    category_id = query.get("category_id", ["all"])[0]
    q = (query.get("q", [""])[0] or "").strip()
    sort = query.get("sort", ["default"])[0]
    platform = (query.get("platform", [""])[0] or "").strip()
    license_key = (query.get("license", [""])[0] or "").strip()
    if sort == "hot" and hot_window_mode() == "off":
        sort = "default"  # 关闭热门统计时，按默认排序兜底
    order_by = SORT_OPTIONS.get(sort, SORT_OPTIONS["default"])

    where = []
    params = []
    order_params = []
    if q:
        compact_q = re.sub(r"[\s\-_]+", "", q.lower())
        where.append(
            "(s.name LIKE ? OR s.description LIKE ? OR "
            "lower(replace(replace(replace(s.name, ' ', ''), '-', ''), '_', '')) LIKE ?)"
        )
        like = "%" + q + "%"
        params.extend([like, like, "%" + compact_q + "%"])
    elif category_id == "uncategorized":
        where.append(
            "NOT EXISTS (SELECT 1 FROM software_categories sc WHERE sc.software_id = s.id)"
        )
    elif category_id and category_id != "all":
        try:
            where.append(
                "EXISTS (SELECT 1 FROM software_categories sc "
                "WHERE sc.software_id = s.id AND sc.category_id = ?)"
            )
            params.append(int(category_id))
        except ValueError:
            pass

    # 支持系统筛选：platforms 是 {"windows": true, ...} 的 JSON
    if platform in PLATFORM_KEYS:
        where.append("json_extract(s.platforms, '$." + platform + "') = 1")
    # 授权方式筛选：licenses 是 ["free", "onetime", ...] 的 JSON 数组
    if license_key in LICENSE_KEYS:
        where.append("EXISTS (SELECT 1 FROM json_each(s.licenses) je WHERE je.value = ?)")
        params.append(license_key)

    where_sql = ("WHERE " + " AND ".join(where)) if where else ""
    # 有搜索词时，名称相关的卡片优先，置顶/所选排序只作为次级规则
    if q:
        relevance_sql, order_params = search_relevance_clause(q)
        final_order = relevance_sql + " DESC, " + PINNED_FIRST + order_by
    else:
        final_order = PINNED_FIRST + order_by

    conn = connect()
    try:
        total = conn.execute(f"SELECT COUNT(*) FROM software s {where_sql}", params).fetchone()[0]
        offset = (page - 1) * page_size
        rows = conn.execute(
            f"""SELECT s.* FROM software s
                {where_sql}
                ORDER BY {final_order}
                LIMIT ? OFFSET ?""",
            params + order_params + [page_size, offset],
        ).fetchall()
        pages = max(1, (total + page_size - 1) // page_size)
        if page > pages and total > 0:
            page = pages
        items = attach_categories(conn, [row_software(r) for r in rows])
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": pages,
            "sort": sort if sort in SORT_OPTIONS else "default",
            "q": q,
            "platform": platform if platform in PLATFORM_KEYS else "",
            "license": license_key if license_key in LICENSE_KEYS else "",
        }
    finally:
        conn.close()


def save_category_links(conn, software_id, category_ids):
    conn.execute("DELETE FROM software_categories WHERE software_id = ?", (software_id,))
    for cid in category_ids:
        conn.execute(
            "INSERT OR IGNORE INTO software_categories (software_id, category_id) VALUES (?, ?)",
            (software_id, cid),
        )


def fetch_software(conn, software_id):
    row = conn.execute("SELECT * FROM software WHERE id = ?", (software_id,)).fetchone()
    if not row:
        raise LookupError("软件不存在")
    return attach_categories(conn, [row_software(row)])[0]


def create_software(body):
    conn = connect()
    try:
        values = parse_software_payload(body, conn)
        cur = conn.execute(
            """INSERT INTO software
               (name, name_sort, description, logo, url_home, url_github, url_release,
                url_doc, downloads, extra_links, platforms, licenses, card_color,
                url_home_label, url_home_text, url_github_label, url_github_text,
                url_release_label, url_release_text, url_doc_label, url_doc_text,
                updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                       datetime('now', 'localtime'))""",
            (
                values["name"],
                pinyin.key(values["name"]),
                values["description"],
                values["logo"],
                values["url_home"],
                values["url_github"],
                values["url_release"],
                values["url_doc"],
                json.dumps(values["downloads"], ensure_ascii=False),
                json.dumps(values["extra_links"], ensure_ascii=False),
                json.dumps(values["platforms"], ensure_ascii=False),
                json.dumps(values["licenses"], ensure_ascii=False),
                values["card_color"],
                values["url_home_label"],
                values["url_home_text"],
                values["url_github_label"],
                values["url_github_text"],
                values["url_release_label"],
                values["url_release_text"],
                values["url_doc_label"],
                values["url_doc_text"],
            ),
        )
        save_category_links(conn, cur.lastrowid, values["category_ids"])
        conn.commit()
        return fetch_software(conn, cur.lastrowid)
    finally:
        conn.close()


def update_software(software_id, body):
    conn = connect()
    try:
        if not conn.execute("SELECT id FROM software WHERE id = ?", (software_id,)).fetchone():
            raise LookupError("软件不存在")
        values = parse_software_payload(body, conn)
        conn.execute(
            """UPDATE software SET name = ?, name_sort = ?, description = ?, logo = ?,
               url_home = ?, url_github = ?, url_release = ?, url_doc = ?,
               downloads = ?, extra_links = ?, platforms = ?, licenses = ?, card_color = ?,
               url_home_label = ?, url_home_text = ?, url_github_label = ?, url_github_text = ?,
               url_release_label = ?, url_release_text = ?, url_doc_label = ?, url_doc_text = ?,
               updated_at = datetime('now', 'localtime')
               WHERE id = ?""",
            (
                values["name"],
                pinyin.key(values["name"]),
                values["description"],
                values["logo"],
                values["url_home"],
                values["url_github"],
                values["url_release"],
                values["url_doc"],
                json.dumps(values["downloads"], ensure_ascii=False),
                json.dumps(values["extra_links"], ensure_ascii=False),
                json.dumps(values["platforms"], ensure_ascii=False),
                json.dumps(values["licenses"], ensure_ascii=False),
                values["card_color"],
                values["url_home_label"],
                values["url_home_text"],
                values["url_github_label"],
                values["url_github_text"],
                values["url_release_label"],
                values["url_release_text"],
                values["url_doc_label"],
                values["url_doc_text"],
                software_id,
            ),
        )
        save_category_links(conn, software_id, values["category_ids"])
        conn.commit()
        return fetch_software(conn, software_id)
    finally:
        conn.close()


def set_pinned(software_id, pinned):
    conn = connect()
    try:
        if not conn.execute("SELECT id FROM software WHERE id = ?", (software_id,)).fetchone():
            raise LookupError("软件不存在")
        conn.execute(
            "UPDATE software SET pinned = ? WHERE id = ?",
            (1 if pinned else 0, software_id),
        )
        conn.commit()
        return fetch_software(conn, software_id)
    finally:
        conn.close()


def delete_software(software_id, category_id=None):
    """删除软件卡片。

    - 带 category_id：只解除该分类下的归属（卡片在其他分类里保留）；
      解除后如果这个软件已经不属于任何分类，整条记录一并删除。
    - 不带 category_id：删除所有分类下的卡片。
    """
    conn = connect()
    try:
        if not conn.execute("SELECT id FROM software WHERE id = ?", (software_id,)).fetchone():
            raise LookupError("软件不存在")
        if category_id is None:
            conn.execute("DELETE FROM software WHERE id = ?", (software_id,))
            conn.commit()
            return {"scope": "all", "memberships_left": 0}

        conn.execute(
            "DELETE FROM software_categories WHERE software_id = ? AND category_id = ?",
            (software_id, category_id),
        )
        left = conn.execute(
            "SELECT COUNT(*) FROM software_categories WHERE software_id = ?", (software_id,)
        ).fetchone()[0]
        if left == 0:
            conn.execute("DELETE FROM software WHERE id = ?", (software_id,))
        conn.commit()
        return {"scope": "category", "memberships_left": left}
    finally:
        conn.close()


def _parse_id_list(body):
    ids = body.get("ids") if isinstance(body, dict) else None
    if not isinstance(ids, list) or not ids:
        raise ValueError("请先选择要操作的卡片")
    clean = []
    for value in ids:
        try:
            clean.append(int(value))
        except (TypeError, ValueError):
            raise ValueError("卡片 id 不合法")
    return clean


def bulk_move_software(body):
    """批量把卡片移动到指定分类。

    - to_category_id：目标分类，卡片若已在其中则保持不变；
    - from_category_id：当前所在分类（在「全部软件 / 未分类」视图下不传），
      传了就同时把卡片从这个分类里移出，即「移动」而不是「也加入」。
    """
    ids = _parse_id_list(body)
    try:
        to_id = int(body.get("to_category_id"))
    except (TypeError, ValueError):
        raise ValueError("请选择要移动到的分类")
    from_raw = body.get("from_category_id")
    from_id = None
    if from_raw not in (None, "", "all", "uncategorized"):
        try:
            from_id = int(from_raw)
        except (TypeError, ValueError):
            from_id = None

    conn = connect()
    try:
        if not conn.execute("SELECT id FROM categories WHERE id = ?", (to_id,)).fetchone():
            raise LookupError("目标分类不存在")
        moved = 0
        for sid in ids:
            if not conn.execute("SELECT id FROM software WHERE id = ?", (sid,)).fetchone():
                continue
            conn.execute(
                "INSERT OR IGNORE INTO software_categories (software_id, category_id) VALUES (?, ?)",
                (sid, to_id),
            )
            if from_id and from_id != to_id:
                conn.execute(
                    "DELETE FROM software_categories WHERE software_id = ? AND category_id = ?",
                    (sid, from_id),
                )
            conn.execute(
                "UPDATE software SET updated_at = datetime('now', 'localtime') WHERE id = ?",
                (sid,),
            )
            moved += 1
        conn.commit()
        return {"ok": True, "moved": moved, "to_category_id": to_id}
    finally:
        conn.close()


def bulk_copy_software(body):
    """批量把卡片复制到指定分类（相当于给卡片多挂一个分类）。

    与 bulk_move_software 的差别只在于：不删除原来的分类归属，
    因此原分类下的卡片继续保留，同时出现/关联到 to_category_id。
    """
    ids = _parse_id_list(body)
    try:
        to_id = int(body.get("to_category_id"))
    except (TypeError, ValueError):
        raise ValueError("请选择要复制到的分类")

    conn = connect()
    try:
        if not conn.execute("SELECT id FROM categories WHERE id = ?", (to_id,)).fetchone():
            raise LookupError("目标分类不存在")
        copied = 0
        existed = 0
        for sid in ids:
            if not conn.execute("SELECT id FROM software WHERE id = ?", (sid,)).fetchone():
                continue
            if conn.execute(
                "SELECT 1 FROM software_categories WHERE software_id = ? AND category_id = ?",
                (sid, to_id),
            ).fetchone():
                existed += 1
                continue
            conn.execute(
                "INSERT OR IGNORE INTO software_categories (software_id, category_id) VALUES (?, ?)",
                (sid, to_id),
            )
            conn.execute(
                "UPDATE software SET updated_at = datetime('now', 'localtime') WHERE id = ?",
                (sid,),
            )
            copied += 1
        conn.commit()
        return {
            "ok": True,
            "copied": copied,
            "existed": existed,
            "to_category_id": to_id,
        }
    finally:
        conn.close()


def bulk_delete_software(body):
    """批量删除卡片。

    - 带 category_id：只把卡片从该分类移除（其他分类下保留），
      移除后不再属于任何分类的整条记录一并删除（即归入「未分类」）。
    - 不带 category_id：删除所有分类下的卡片。
    """
    ids = _parse_id_list(body)
    cat_raw = body.get("category_id")
    cat_id = None
    if cat_raw not in (None, "", "all", "uncategorized"):
        try:
            cat_id = int(cat_raw)
        except (TypeError, ValueError):
            cat_id = None

    conn = connect()
    try:
        removed = 0
        deleted = 0
        for sid in ids:
            if not conn.execute("SELECT id FROM software WHERE id = ?", (sid,)).fetchone():
                continue
            if cat_id is None:
                conn.execute("DELETE FROM software WHERE id = ?", (sid,))
                deleted += 1
                continue
            conn.execute(
                "DELETE FROM software_categories WHERE software_id = ? AND category_id = ?",
                (sid, cat_id),
            )
            left = conn.execute(
                "SELECT COUNT(*) FROM software_categories WHERE software_id = ?", (sid,)
            ).fetchone()[0]
            if left == 0:
                conn.execute("DELETE FROM software WHERE id = ?", (sid,))
                deleted += 1
            else:
                removed += 1
        conn.commit()
        return {"ok": True, "removed": removed, "deleted": deleted}
    finally:
        conn.close()


def create_category(body):
    name = (body.get("name") or "").strip()
    if not name:
        raise ValueError("分类名称不能为空")
    if len(name) > 20:
        raise ValueError("分类名称不能超过 20 个字")
    conn = connect()
    try:
        next_order = conn.execute("SELECT COALESCE(MAX(sort_order), -1) + 1 FROM categories").fetchone()[0]
        try:
            cur = conn.execute("INSERT INTO categories (name, sort_order) VALUES (?, ?)", (name, next_order))
        except sqlite3.IntegrityError:
            raise ValueError("该分类已存在")
        conn.commit()
        return {"id": cur.lastrowid, "name": name, "sort_order": next_order, "count": 0}
    finally:
        conn.close()


def reorder_categories(body):
    """按前端拖拽得到的 id 顺序重写 sort_order。"""
    ids = body.get("ids") if isinstance(body, dict) else None
    if not isinstance(ids, list) or not ids:
        raise ValueError("缺少分类顺序")
    clean = []
    for value in ids:
        try:
            clean.append(int(value))
        except (TypeError, ValueError):
            raise ValueError("分类顺序不合法")
    conn = connect()
    try:
        existing = {r["id"] for r in conn.execute("SELECT id FROM categories").fetchall()}
        if not set(clean).issubset(existing):
            raise ValueError("分类顺序包含不存在的分类")
        for index, cid in enumerate(clean):
            conn.execute("UPDATE categories SET sort_order = ? WHERE id = ?", (index, cid))
        # 未提交的剩余分类顺延到末尾，保证顺序稳定
        rest = sorted(existing - set(clean))
        for offset, cid in enumerate(rest, start=len(clean)):
            conn.execute("UPDATE categories SET sort_order = ? WHERE id = ?", (offset, cid))
        conn.commit()
        return {"ok": True, "ids": clean}
    finally:
        conn.close()


def rename_category(category_id, body):
    name = (body.get("name") or "").strip()
    if not name:
        raise ValueError("分类名称不能为空")
    if len(name) > 20:
        raise ValueError("分类名称不能超过 20 个字")
    conn = connect()
    try:
        if not conn.execute("SELECT id FROM categories WHERE id = ?", (category_id,)).fetchone():
            raise LookupError("分类不存在")
        try:
            conn.execute("UPDATE categories SET name = ? WHERE id = ?", (name, category_id))
        except sqlite3.IntegrityError:
            raise ValueError("该分类已存在")
        conn.commit()
        return {"id": category_id, "name": name}
    finally:
        conn.close()


def delete_category(category_id):
    """删除分类：分类下的卡片若还属于其他分类，只从本分类移除；
    若不再属于任何分类，则自动落到「未分类」。"""
    conn = connect()
    try:
        row = conn.execute("SELECT id FROM categories WHERE id = ?", (category_id,)).fetchone()
        if not row:
            raise LookupError("分类不存在")
        members = conn.execute(
            "SELECT software_id FROM software_categories WHERE category_id = ?", (category_id,)
        ).fetchall()
        conn.execute("DELETE FROM software_categories WHERE category_id = ?", (category_id,))
        orphaned = 0
        for m in members:
            left = conn.execute(
                "SELECT COUNT(*) FROM software_categories WHERE software_id = ?",
                (m["software_id"],),
            ).fetchone()[0]
            if left == 0:
                orphaned += 1
        conn.execute("DELETE FROM categories WHERE id = ?", (category_id,))
        conn.commit()
        return {"removed_memberships": len(members), "to_uncategorized": orphaned}
    finally:
        conn.close()


# ----------------------------------------------------------------------------
# 备份 / 恢复
# ----------------------------------------------------------------------------
def build_backup():
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(DB_PATH, "app.db")
        for file in UPLOAD_DIR.glob("*"):
            if file.is_file():
                zf.write(file, "uploads/" + file.name)
    return buffer.getvalue()


def restore_backup(raw):
    if not raw:
        raise ValueError("备份文件为空")
    db_bytes = None
    upload_names = []

    if raw[:4] == b"PK\x03\x04":
        try:
            with zipfile.ZipFile(io.BytesIO(raw)) as zf:
                names = zf.namelist()
                for name in names:
                    if name in ("app.db", "./app.db"):
                        db_bytes = zf.read(name)
                    elif name.startswith("uploads/") and not name.endswith("/"):
                        upload_names.append(name)
        except zipfile.BadZipFile:
            raise ValueError("压缩包已损坏")
    else:
        db_bytes = raw

    if not db_bytes or not db_bytes.startswith(b"SQLite format 3"):
        raise ValueError("备份文件中没有有效的数据库")

    tmp_path = DATA_DIR / "app.db.restore.tmp"
    tmp_path.write_bytes(db_bytes)
    os.replace(tmp_path, DB_PATH)

    init_db()

    if raw[:4] == b"PK\x03\x04" and upload_names:
        with zipfile.ZipFile(io.BytesIO(raw)) as zf:
            UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            for name in upload_names:
                target = UPLOAD_DIR / Path(name).name
                target.write_bytes(zf.read(name))

    conn = connect()
    try:
        conn.execute("DELETE FROM sessions")
        conn.commit()
    finally:
        conn.close()


# ----------------------------------------------------------------------------
# HTTP
# ----------------------------------------------------------------------------
class Handler(BaseHTTPRequestHandler):
    server_version = "SoftwareHub/1.1"
    protocol_version = "HTTP/1.1"

    # --- 基础工具 -----------------------------------------------------------
    def send_json(self, data, status=200):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def send_error_json(self, message, status=400):
        self.send_json({"error": message}, status)

    def read_body(self):
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b""
        if not raw:
            return {}
        ctype = (self.headers.get("Content-Type") or "").lower()
        if "application/json" in ctype:
            try:
                return json.loads(raw.decode("utf-8"))
            except json.JSONDecodeError:
                raise ValueError("请求数据格式不正确")
        raise ValueError("请求数据格式不正确")

    def client_ip(self):
        """取客户端 IP：优先反向代理头，其次直连地址（只用于 10 秒防刷，不落库）"""
        forwarded = (self.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
        if forwarded:
            return forwarded
        try:
            return self.client_address[0]
        except (IndexError, TypeError):
            return ""

    def send_file(self, path: Path):
        if not path.is_file():
            self.send_error_json("文件不存在", 404)
            return
        ctype = CONTENT_TYPES.get(path.suffix.lower(), "application/octet-stream")
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache" if path.parent == STATIC_DIR else "public, max-age=604800")
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        print("%s - %s" % (self.address_string(), fmt % args), flush=True)

    # --- 会话 ---------------------------------------------------------------
    def cookie_token(self):
        raw = self.headers.get("Cookie") or ""
        for part in raw.split(";"):
            if "=" not in part:
                continue
            key, value = part.split("=", 1)
            if key.strip() == SESSION_COOKIE:
                return value.strip()
        return None

    def current_user(self):
        return session_username(self.cookie_token())

    def require_auth(self):
        user = self.current_user()
        if not user:
            raise AuthError("请先登录")
        return user

    def set_session_cookie(self, token, hours):
        cookie = "%s=%s; Path=/; HttpOnly; SameSite=Lax; Max-Age=%d" % (
            SESSION_COOKIE, token, int(hours * 3600),
        )
        self.send_response(200)
        payload = json.dumps({"logged_in": True}, ensure_ascii=False).encode("utf-8")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Set-Cookie", cookie)

        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def clear_session_cookie(self):
        cookie = "%s=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" % SESSION_COOKIE
        self.send_response(200)
        payload = b'{"logged_in": false}'
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Set-Cookie", cookie)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    # --- 路由 ---------------------------------------------------------------
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        try:
            if path == "/api/health":
                return self.send_json({"status": "ok"})
            if path == "/api/categories":
                return self.send_json(list_categories())
            if path == "/api/software":
                return self.send_json(list_software(urllib.parse.parse_qs(parsed.query)))
            if path == "/api/hot":
                return self.send_json(hot_overview())
            if path == "/api/settings":
                return self.send_json(get_settings())
            if path == "/api/auth/me":
                user = self.current_user()
                return self.send_json({"logged_in": bool(user), "username": user or ""})
            if path == "/api/backup":
                self.require_auth()
                return self.send_backup()
            if path in ("/", "/index.html"):
                return self.send_file(STATIC_DIR / "index.html")
            if path.startswith("/static/"):
                return self.send_file(safe_join(STATIC_DIR, path[len("/static/"):]))
            if path.startswith("/uploads/"):
                return self.send_file(safe_join(UPLOAD_DIR, path[len("/uploads/"):]))
            if path == "/favicon.ico":
                return self.send_file(STATIC_DIR / "favicon.ico")
            return self.send_error_json("接口不存在", 404)
        except AuthError as exc:
            return self.send_error_json(str(exc), 401)
        except Exception as exc:  # noqa: BLE001
            print("GET %s failed: %s" % (path, exc), flush=True)
            self.send_error_json("服务器内部错误", 500)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        try:
            if path == "/api/auth/login":
                body = self.read_body()
                username = (body.get("username") or "").strip()
                user = find_user(username)
                if not user or not verify_password(body.get("password") or "", user["password_hash"]):
                    raise ValueError("用户名或密码错误")
                token, hours = create_session(user["id"], bool(body.get("remember")))
                return self.set_session_cookie(token, hours)
            if path == "/api/auth/logout":
                delete_session(self.cookie_token())
                return self.clear_session_cookie()
            if path == "/api/events":
                # 行为埋点：允许匿名浏览时也能统计；只做极轻量校验
                return self.send_json(record_event(self.read_body(), self.client_ip()))

            self.require_auth()
            if path == "/api/categories":
                return self.send_json(create_category(self.read_body()), 201)
            if path == "/api/categories/order":
                return self.send_json(reorder_categories(self.read_body()))
            if path == "/api/software":
                return self.send_json(create_software(self.read_body()), 201)
            if path == "/api/software/bulk_move":
                return self.send_json(bulk_move_software(self.read_body()))
            if path == "/api/software/bulk_copy":
                return self.send_json(bulk_copy_software(self.read_body()))
            if path == "/api/software/bulk_delete":
                return self.send_json(bulk_delete_software(self.read_body()))
            match_pin = re.fullmatch(r"/api/software/(\d+)/pin", path)
            if match_pin:
                body = self.read_body()
                return self.send_json(
                    set_pinned(int(match_pin.group(1)), bool(body.get("pinned")))
                )
            if path == "/api/upload":
                return self.handle_upload(urllib.parse.parse_qs(parsed.query))
            if path == "/api/restore":
                return self.handle_restore()
            return self.send_error_json("接口不存在", 404)
        except AuthError as exc:
            return self.send_error_json(str(exc), 401)
        except ValueError as exc:
            return self.send_error_json(str(exc), 400)
        except LookupError as exc:
            return self.send_error_json(str(exc), 404)
        except Exception as exc:  # noqa: BLE001
            print("POST %s failed: %s" % (path, exc), flush=True)
            self.send_error_json("服务器内部错误", 500)

    def do_PUT(self):
        path = urllib.parse.urlparse(self.path).path
        try:
            self.require_auth()
            match = re.fullmatch(r"/api/software/(\d+)", path)
            if match:
                return self.send_json(update_software(int(match.group(1)), self.read_body()))
            match = re.fullmatch(r"/api/categories/(\d+)", path)
            if match:
                return self.send_json(rename_category(int(match.group(1)), self.read_body()))
            if path == "/api/settings":
                return self.send_json(update_settings(self.read_body()))
            if path == "/api/auth/account":
                return self.handle_account()
            return self.send_error_json("接口不存在", 404)
        except AuthError as exc:
            return self.send_error_json(str(exc), 401)
        except ValueError as exc:
            return self.send_error_json(str(exc), 400)
        except LookupError as exc:
            return self.send_error_json(str(exc), 404)
        except Exception as exc:  # noqa: BLE001
            print("PUT %s failed: %s" % (path, exc), flush=True)
            self.send_error_json("服务器内部错误", 500)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        try:
            self.require_auth()
            match = re.fullmatch(r"/api/software/(\d+)", path)
            if match:
                raw_cat = (query.get("category_id", [""])[0] or "").strip()
                cat_id = None
                if raw_cat and raw_cat not in ("all", "uncategorized"):
                    try:
                        cat_id = int(raw_cat)
                    except ValueError:
                        cat_id = None
                return self.send_json(delete_software(int(match.group(1)), cat_id))
            match = re.fullmatch(r"/api/categories/(\d+)", path)
            if match:
                result = delete_category(int(match.group(1)))
                result["ok"] = True
                return self.send_json(result)
            return self.send_error_json("接口不存在", 404)
        except AuthError as exc:
            return self.send_error_json(str(exc), 401)
        except LookupError as exc:
            return self.send_error_json(str(exc), 404)
        except Exception as exc:  # noqa: BLE001
            print("DELETE %s failed: %s" % (path, exc), flush=True)
            self.send_error_json("服务器内部错误", 500)

    # --- 具体处理 -----------------------------------------------------------
    def handle_account(self):
        user = self.current_user()
        body = self.read_body()
        new_name = change_account(
            user,
            body.get("current_password") or "",
            body.get("username") or "",
            body.get("new_password") or "",
        )
        return self.send_json({"ok": True, "username": new_name})

    def handle_upload(self, query):
        filename = (query.get("filename", ["icon"])[0] or "icon")
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_UPLOAD_EXT:
            raise ValueError("只支持 png / jpg / gif / webp / svg 格式的图片")
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            raise ValueError("文件内容为空")
        if length > 5 * 1024 * 1024:
            raise ValueError("图片大小不能超过 5MB")
        raw = self.rfile.read(length)
        if not raw:
            raise ValueError("文件内容为空")
        name = uuid.uuid4().hex + ext
        (UPLOAD_DIR / name).write_bytes(raw)
        return self.send_json({"url": "/uploads/" + name}, 201)

    def handle_restore(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            raise ValueError("没有收到备份文件")
        if length > 100 * 1024 * 1024:
            raise ValueError("备份文件不能超过 100MB")
        raw = self.rfile.read(length)
        restore_backup(raw)
        return self.send_json({"ok": True})

    def send_backup(self):
        data = build_backup()
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        self.send_response(200)
        self.send_header("Content-Type", "application/zip")
        self.send_header("Content-Length", str(len(data)))
        self.send_header(
            "Content-Disposition", 'attachment; filename="software-hub-backup-%s.zip"' % stamp
        )
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)


def safe_join(root: Path, rel: str) -> Path:
    """防止 ../ 目录穿越"""
    rel = urllib.parse.unquote(rel)
    target = (root / rel.lstrip("/")).resolve()
    if root.resolve() not in target.parents and target != root.resolve():
        return root / "__forbidden__"
    return target


def main():
    init_db()
    print("数据目录: %s" % DATA_DIR, flush=True)
    print("服务已启动: http://0.0.0.0:%d" % PORT, flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
