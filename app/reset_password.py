"""重置管理员密码（忘记密码时使用）

用法：
    python app/reset_password.py                 # 重置为 admin123
    python app/reset_password.py 新密码           # 重置为指定密码
    RESET_PASSWORD=新密码 python app/reset_password.py
    RESET_USERNAME=someone python app/reset_password.py

容器内：
    docker compose exec software-hub python app/reset_password.py
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import server  # noqa: E402


def main():
    username = os.environ.get("RESET_USERNAME") or server.DEFAULT_ADMIN_USER
    password = os.environ.get("RESET_PASSWORD") or (sys.argv[1] if len(sys.argv) > 1 else server.DEFAULT_ADMIN_PASSWORD)

    server.init_db()
    conn = server.connect()
    try:
        row = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
        if row:
            conn.execute(
                "UPDATE users SET password_hash = ? WHERE id = ?",
                (server.hash_password(password), row["id"]),
            )
        else:
            conn.execute(
                "INSERT INTO users (username, password_hash) VALUES (?, ?)",
                (username, server.hash_password(password)),
            )
        conn.execute("DELETE FROM sessions")
        conn.commit()
    finally:
        conn.close()

    print("已重置账号 %s 的密码，所有登录会话已失效。" % username)


if __name__ == "__main__":
    main()
