# 软件库

一个自托管的软件资源导航站：左侧是自定义软件分类，右侧是软件信息卡片。前后端一体，数据保存在后端 SQLite，Docker 一条命令即可部署。

## 功能

### 内容浏览
- **分类管理**：侧栏固定提供「全部软件」和「未分类」两项，其余分类可自定义添加、删除；分类多时侧栏自动滚动（滚动条滚动时显示、静止 1.2 秒后自动淡出）。默认不预置任何自定义分类。登录后可直接拖动分类条目调整顺序（顺序保存在数据库 `sort_order`），右侧数量徽标统一贴右对齐。
- **分类计数**：每个分类右侧显示该分类下的软件数，数字统一右对齐、与卡片边框留固定距离。
- **多分类归属**：一个软件可以同时属于多个分类，添加 / 编辑时用标签多选；**不选任何分类则自动归入「未分类」**。
- **删除规则**：删除分类会先弹出确认弹窗（删除 / 取消两个按钮），确认后同时属于其他分类的卡片只从该分类移除；只属于该分类的卡片会自动转到「未分类」，卡片本身不会被删除。
- **软件卡片**：128px 图标（不放大、等比缩放），名称、简介、官方网站、GitHub 地址、版本更新、官方文档、支持系统、授权方式、下载地址，标签统一带冒号，平台用竖线分隔显示（如 Windows | macOS）；「全部软件」视图里会显示该卡片所属的分类标签；未勾选任何支持系统时不显示「支持系统」这一行。
- **简介支持 Markdown**：软件简介可写基础 Markdown（加粗 `**x**`、斜体 `*x*`、删除线 `~~x~~`、行内代码 `` `x` ``、链接 `[文字](https://…)`、`- ` 列表、`## ` 小标题、换行），卡片前端按 Markdown 渲染，内容先做 HTML 转义，链接只允许 http/https。
- **链接编辑**：官网、GitHub、版本更新、文档这四个链接统一为「名称 / 链接 / 显示文字」三列——名称留空就用默认名称（🌐 官方网站、🌐 GitHub 地址、📌 版本更新、📖 官方文档），链接留空则该行不显示，显示文字留空则卡片上直接显示链接地址本身。
- **其他链接**：编辑时在「版本更新链接 / 文档链接」下方可添加任意多条「名称 + 链接 + 显示文字」，行排版与「下载地址」一致（同样是三列 + 删除按钮，左右边界和列宽对齐），卡片上按填写顺序显示在「官方文档」下方，形如「镜像下载：高速镜像」；名称或链接留空的行保存时自动忽略。
- **下载地址**：保持「名称 + 链接」两列，可添加多条；卡片上显示为「📥 下载地址： 名称 | 名称」，点击名称即跳转到对应链接。
- **授权方式**：编辑时可多选「免费 / 订阅制 / 一次性买断 / 按量计费 / 基础免费+增值收费」，卡片在「下载地址」上一行显示为「💰 授权方式： 免费 | 订阅制」；不选则不显示该行。
- **布局可切换**：每行显示 1 个卡片、2 个卡片，或「只显示图标」（只显示图标 + 名称，图标在上、名称在下居中，每行 5 个等宽排列）；**默认每行 1 个卡片**，选择记在浏览器里。
- **点击图标卡片聚焦**：在「只显示图标」模式下点击某张卡片，会自动把该软件名称填入顶栏搜索框，并以「每行 1 个卡片」的完整卡片形式单独展示（相当于聚焦这个软件）；清空搜索或点分类即回到图标模式。
- **固定操作栏**：标题与「每行显示 / 每页显示 / 排序」固定在顶部，只有卡片区域独立滚动，翻页时无须滚回顶部；卡片区滚动条**滚动时显示、停止滚动 1.2 秒后自动淡出**，且滚动条占位固定，出现/隐藏不会让卡片宽度跳动。
- **多选批量操作**：点顶部「多选」进入选择模式，卡片左上角出现复选框，左侧多出「移动至」（分类下拉）和「删除」两个按钮。移动会把选中卡片加入目标分类（该分类下已有卡片不受影响）；在具体分类视图下同时从当前分类移出，相当于真正「移动」。删除只删当前分类下的卡片：卡片若还属于其他分类则保留，不再属于任何分类才归入「未分类」；在「全部软件 / 未分类」视图下则是彻底删除（会二次确认）。
- **卡片置顶**：卡片操作区有「📌 置顶」，置顶的卡片固定排在最前、不受排序影响，可再次点击取消置顶。
- **卡片背景色**：编辑卡片时可自定义背景色（色板或手填 `#rrggbb`），文字颜色按背景亮度自动切换黑白以保证可读。
- **分页浏览**：每页条数可切换（10 / 20 / 30 / 50 / 100），支持页码跳转。
- **搜索**：顶栏居中搜索框按名称 / 简介模糊匹配，输入即搜（320ms 防抖），点分类会自动清空搜索条件。
- **排序**：默认排序、最新更新、最早上架、A-Z 正序、Z-A 倒序；置顶卡片始终排在最前。A-Z / Z-A 对中文名按**拼音**排序（阿里 → 百度 → 长城 → 重启 → 钉钉 → 微软 → 微信），不是按 Unicode 码点乱序；拼音表内嵌在 `app/pinyin.py`，运行时不需要安装任何第三方库。
- **筛选**：左侧分类列表下方新增「系统平台」与「授权方式」两个下拉框，与分类、搜索、排序叠加生效，共同决定右侧展示的卡片。

### 登录与权限
- 右上角「登录」，弹窗内有用户名、密码、记住密码（30 天有效期，否则 12 小时）、忘记密码。
- **添加分类、添加软件、卡片置顶 / 编辑 / 删除、设置、备份恢复**都需要登录；未登录时这些入口直接不显示，接口层也会返回 401。
- 登录后右上角从左到右依次是「＋ 添加软件」「设置」「当前用户名」「退出登录」。
- 删除卡片时会弹出确认框，按当前所在分类提供三个选项：**只删除该分类下的卡片 / 删除所有分类下的卡片 / 取消**。
- 登录后右上角出现「设置」，包含：
  - **站点设置**：站点名称、站点副标题（品牌下方那行文案，默认「专属于你的软件收藏」）、网站标题、网站图标（支持上传，改完点「保存设置」即时生效，页面左上角图标和浏览器标签页图标会一起更新）、语言（简体中文 / English）。
  - **主题切换**：顶栏最右侧有「☀ 明亮 / ▢ 跟随系统 / ☾ 暗黑」三档切换（记住在当前浏览器），**默认「跟随系统」**；设置弹窗里不再单独提供外观主题。
  - **账号安全**：修改用户名、修改密码（需填当前密码）。
  - **备份与恢复**：一键下载备份 zip（数据库 + 上传的图标）；上传备份恢复，恢复会覆盖当前全部数据并强制重新登录。
- 「退出登录」在右上角，不在设置弹窗里。

### 数据
- 所有数据存在 `data/app.db`，上传的图标存在 `data/uploads/`，容器重建不丢。

## 首次启动与默认账号

首次启动会自动建库，并创建管理员账号：

- 用户名：`admin`
- 密码：`admin123`

**部署后请立即用右上角「设置 → 账号安全」改成自己的密码。**
（也支持环境变量覆盖：`ADMIN_USER`、`ADMIN_PASSWORD`。）

## 忘记密码怎么办

登录弹窗里的「忘记密码」会给出一条重置命令。实际重置有两种方式：

```bash
# 容器部署（compose）
docker compose exec software-hub python app/reset_password.py 新密码

# 本地直接运行
python app/reset_password.py 新密码
```

也可以用环境变量，适合在 `docker-compose.yml` 里临时加：

```bash
RESET_USERNAME=admin RESET_PASSWORD=新密码 python app/reset_password.py
```

重置会同时清掉所有登录会话，之前登录的设备需要重新登录。

## 技术栈

| 层 | 实现 |
|---|---|
| 后端 | Python 3.11 标准库（`http.server` + `sqlite3`），无任何第三方依赖 |
| 前端 | 原生 HTML / CSS / JS，无构建步骤 |
| 数据 | SQLite 单文件数据库 |
| 鉴权 | PBKDF2-SHA256（20 万次迭代）密码哈希 + HttpOnly Cookie 会话 |
| 部署 | Docker / Docker Compose，镜像基于 `python:3.11-slim`，构建时不需要联网装包 |

## 目录结构

```
software-hub/
├─ app/
│  ├─ server.py            # 后端服务：API + 静态资源 + 上传 + 鉴权
│  ├─ pinyin.py            # 内嵌拼音表：中文名按拼音排序（A-Z / Z-A）
│  ├─ reset_password.py    # 忘记密码时用的重置脚本
│  └─ static/
│     ├─ index.html        # 页面结构
│     ├─ styles.css        # 样式（含深色主题）
│     ├─ app.js            # 交互逻辑（含 i18n）
│     ├─ favicon.svg       # 站点图标（矢量，顶栏与标签页共用）
│     ├─ favicon.ico
│     ├─ favicon-16/32/48/64/192/512.png
│     └─ apple-touch-icon.png
├─ Dockerfile
├─ docker-compose.yml
├─ .dockerignore
├─ data/                   # 运行时生成：app.db + uploads/
└─ README.md
```

## Docker 部署（推荐）

前置：已安装 Docker（Windows / macOS 用 Docker Desktop，Linux 用 docker-ce）。

```bash
git clone https://github.com/tanyang88/software-hub.git
cd software-hub

# 构建并后台启动
docker compose up -d --build

# 查看状态与日志
docker compose ps
docker compose logs -f
```

浏览器打开：<http://localhost:8080>，用 `admin / admin123` 登录后先改密码。

停止 / 更新：

```bash
docker compose down          # 停止并移除容器（数据仍在 ./data）
docker compose up -d --build # 改了代码后重新构建
```

不想用 compose 也可以只用 Docker：

```bash
docker build -t software-hub:latest .
docker run -d --name software-hub -p 8080:8080 -v "$(pwd)/data:/app/data" --restart unless-stopped software-hub:latest
```

Windows PowerShell 里 `-v` 的路径写成绝对路径，例如：

```powershell
docker run -d --name software-hub -p 8080:8080 -v "D:\家庭网络\项目-我的应用软件大全\data:/app/data" --restart unless-stopped software-hub:latest
```

## 推送到 Docker Hub

把下面的 `yourname` 换成你的 Docker Hub 用户名（**必须全小写**）：

```bash
docker login

# 同时打 latest 和版本号两个标签
docker build -t yourname/software-hub:latest -t yourname/software-hub:1.0.0 .
docker push yourname/software-hub:latest
docker push yourname/software-hub:1.0.0
```

推送成功后，任何装了 Docker 的机器都能直接拉取运行，不需要源码：

```bash
docker run -d --name software-hub -p 8080:8080 \
  -v "$(pwd)/data:/app/data" -e TZ=Asia/Shanghai \
  --restart unless-stopped yourname/software-hub:latest
```

镜像内已固定 `DATA_DIR=/app/data`，只要挂载 `data` 目录数据就持久化；升级流程：`docker pull` → `docker rm -f software-hub` → 用同样命令重新 run（`data` 目录不动，数据不丢）。

## 本地直接运行（不装 Docker 也能用）

需要 Python 3.9+，无第三方依赖：

```bash
cd software-hub
python app/server.py
```

### Windows 一键启停

项目根目录自带四个脚本，免去记环境变量：

| 脚本 | 作用 |
|---|---|
| `start.bat` / `start.ps1` | 设置好 `PORT=8080`、`DATA_DIR=./data` 后隐藏窗口启动服务；若 8080 已有旧实例会先关掉再启动；失败时打印 `data/server.err.log` 最后几行 |
| `stop.bat` / `stop.ps1` | 停止监听 8080 的进程，数据目录不动 |

双击 `start.bat` 即可，浏览器打开 <http://127.0.0.1:8080>。日志写在 `data/server.out.log` 与 `data/server.err.log`。

默认监听 `0.0.0.0:8080`，数据写入项目下的 `data/`。

## 配置项

| 环境变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `8080` | 服务端口 |
| `HOST` | `0.0.0.0` | 监听地址 |
| `DATA_DIR` | 项目下 `data/`（镜像内 `/app/data`） | 数据库与上传文件目录 |
| `ADMIN_USER` | `admin` | 首次初始化时创建的管理员用户名 |
| `ADMIN_PASSWORD` | `admin123` | 首次初始化时创建的管理员密码 |

改端口：编辑 `docker-compose.yml` 的 `ports`，例如 `"9000:8080"` 表示宿主机 9000 映射容器 8080。

## 站点设置（存在数据库里）

登录后在「设置」里改，改完即时生效：

| 设置项 | 键 | 可选值 |
|---|---|---|
| 站点名称 | `site_name` | 任意文本（≤500 字） |
| 站点副标题 | `site_tagline` | 品牌下方那行文案；留空显示默认「专属于你的软件收藏」 |
| 网站标题 | `site_title` | 任意文本（≤500 字） |
| 网站图标 | `site_icon` | 图标 URL 或上传后的 `/uploads/xxx.png`；上传支持 **png / jpg / jpeg / gif / webp / svg**，单文件 ≤ 5MB。推荐 SVG（任意尺寸都清晰）或 512×512 透明底 PNG |
| 外观主题 | `theme` | `light` / `dark` / `system`（默认 `system`；页面以浏览器本地记住的主题切换为准） |
| 语言 | `language` | `zh-CN` / `en` |

## 数据备份与迁移

- 登录后「设置 → 备份与恢复 → 下载备份」，得到包含 `app.db` 和全部上传图标的 zip。
- 恢复：同一位置「恢复备份」上传该 zip（也接受单独的 `app.db`），会覆盖现有数据并强制重新登录。
- 手工备份：直接打包 `data/` 目录即可；迁移到新机器把 `data/` 放回同一位置再 `docker compose up -d`。
- 初始化：首次启动会自动建库并创建默认管理员；分类默认只有「全部软件」和「未分类」两项，不预置任何软件。想从空白开始，删掉 `data/app.db` 后重启即可。

## API 一览

公开接口（无需登录）：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查 |
| GET | `/api/categories` | 分类列表，返回 `{ items, total, uncategorized }`（`uncategorized` 为没有归入任何分类的软件数） |
| GET | `/api/software?category_id=all&page=1&page_size=20&sort=default&q=&platform=&license=` | 软件分页列表（`page_size` 默认 20、上限 120）；`category_id` 取 `all` / `uncategorized` / 具体分类 id；`q` 非空时按名称/简介搜索并忽略 `category_id`；`platform` 取 `windows`/`mac`/`linux`/`android`/`ios`/`harmonyos`，`license` 取 `free`/`subscription`/`onetime`/`metered`/`freemium`，留空即不过滤；各条件可叠加；置顶卡片始终排在最前 |
| GET | `/api/settings` | 站点设置 |
| GET | `/api/auth/me` | 当前登录状态 |

需要登录（否则 401）：

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/login` | 登录 `{ "username", "password", "remember" }`，成功后下发 `hub_session` Cookie |
| POST | `/api/auth/logout` | 退出登录 |
| PUT | `/api/auth/account` | 改用户名 / 密码 `{ "current_password", "username", "new_password" }` |
| POST | `/api/categories` | 新建分类 `{ "name": "游戏" }` |
| POST | `/api/categories/order` | 保存分类显示顺序 `{ "ids": [3, 1, 2] }`（按数组顺序重排 `sort_order`） |
| POST | `/api/software/bulk_move` | 批量移动卡片 `{ "ids": [1,2], "to_category_id": 3, "from_category_id": 2 }`（`from_category_id` 可省略） |
| POST | `/api/software/bulk_delete` | 批量删除卡片 `{ "ids": [1,2], "category_id": 3 }`（带 `category_id` 只移出该分类，不带则彻底删除） |
| PUT | `/api/categories/{id}` | 重命名分类 |
| DELETE | `/api/categories/{id}` | 删除分类：卡片若还属于其他分类只从本分类移除，只属于本分类的卡片转入「未分类」，返回 `{removed_memberships, to_uncategorized}` |
| POST | `/api/software` | 新建软件，`category_ids` 可为空数组（空即「未分类」） |
| PUT | `/api/software/{id}` | 更新软件（整条覆盖，`category_ids` 整体替换归属） |
| DELETE | `/api/software/{id}` | 删除软件（所有分类下的卡片） |
| DELETE | `/api/software/{id}?category_id=3` | 只删除该分类下的卡片；若该软件已不属于任何分类则整条删除 |
| POST | `/api/software/{id}/pin` | 置顶 / 取消置顶 `{ "pinned": true }` |
| POST | `/api/upload?filename=icon.png` | 上传图标，请求体为文件二进制 |
| PUT | `/api/settings` | 保存站点设置（只接受上表中的键） |
| GET | `/api/backup` | 下载备份 zip |
| POST | `/api/restore` | 恢复备份（zip 或裸 db 二进制） |

`sort` 白名单：`default`、`updated`（最新更新）、`oldest`（最早上架）、`name_asc`（A-Z）、`name_desc`（Z-A）。

软件对象字段：`name`、`category_ids`（所属分类 id 数组，可为空）、`category_names`（分类名称数组，只读返回）、`description`、`logo`、`url_home`、`url_github`、`url_release`、`url_doc`、`downloads`（`[{text, link}]`，`text` 为名称）、`extra_links`（自定义链接，`[{text, link, label?}]`，显示在官方文档下方）、`url_home_label` / `url_home_text`、`url_github_label` / `url_github_text`、`url_release_label` / `url_release_text`、`url_doc_label` / `url_doc_text`（四个固定链接的自定义名称与显示文字，留空则用内置默认）、`platforms`（`{windows, mac, linux, android, ios, harmonyos}` 布尔值）、`licenses`（授权方式字符串数组，取值 `free`/`subscription`/`onetime`/`metered`/`freemium`，空数组合法）、`pinned`（是否置顶）、`card_color`（卡片背景色，`#rgb` / `#rrggbb` / `#rrggbbaa`，空串为默认背景）。

## 常见问题

- **端口被占用**：改 `docker-compose.yml` 里 `ports` 的宿主机端口，或停掉占用 8080 的程序。
- **页面能打开但接口 500**：看 `docker compose logs`，一般是 `data/` 目录无写权限；Linux 上给目录赋权 `sudo chown -R 1000:1000 data`。
- **图标不显示**：外链图标可能被对方站点防盗链，建议用「上传本地图片」把图标存到自己服务器。
- **忘记密码 / 被自己锁在外面**：用上面的 `reset_password.py` 重置，不依赖网页登录。
- **想放到公网**：在容器前面加一层 Nginx / Caddy 做 HTTPS 反代到 `127.0.0.1:8080`。项目自带登录鉴权，但仍是单管理员模型，公网部署务必先改掉默认密码，必要时再叠加一层访问控制（如 Basic Auth 或 VPN）。
- **登录状态多久失效**：勾选「记住密码」为 30 天，不勾为 12 小时；改密码、恢复备份会让所有会话立即失效。
