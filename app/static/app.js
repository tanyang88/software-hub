(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const PLATFORMS = [
    { key: 'windows', label: 'Windows' },
    { key: 'mac', label: 'Mac' },
    { key: 'linux', label: 'Linux' },
    { key: 'android', label: 'Android' },
    { key: 'ios', label: 'iOS' },
    { key: 'harmonyos', label: 'HarmonyOS' },
  ];

  const LICENSES = ['free', 'subscription', 'onetime', 'metered', 'freemium'];

  const I18N = {
    'zh-CN': {
      'header.subtitle': '专属于你的软件收藏',
      'search.placeholder': '搜索软件名称或简介',
      'field.clear': '清空',
      'search.heading': '搜索结果',
      'btn.login': '登录',
      'btn.settings': '设置',
      'btn.logout': '退出登录',
      'btn.addSoftware': '＋ 添加软件',
      'sidebar.title': '分类',
      'sidebar.all': '全部',
      'sidebar.newCategory': '新分类名称',
      'sidebar.add': '添加',
      'sidebar.uncategorized': '未分类',
      'sidebar.tip': '分类可自定义，点分类右侧的 × 可删除',
      'filter.platform': '系统平台',
      'filter.license': '授权方式',
      'filter.allPlatform': '全部平台',
      'filter.allLicense': '全部授权',
      'license.free': '免费',
      'license.subscription': '订阅制',
      'license.onetime': '一次性买断',
      'license.metered': '按量计费',
      'license.freemium': '基础免费+增值收费',
      'content.perRow': '每行显示',
      'content.perPage': '每页显示',
      'content.sort': '排序',
      'content.moveTo': '移动至',
      'content.moveCard': '移动卡片',
      'content.copyCard': '复制卡片',
      'bulk.enter': '多选',
      'bulk.exit': '取消多选',
      'bulk.delete': '删除',
      'bulk.selected': '已选 {n} 个',
      'bulk.selectHint': '点卡片可勾选，已选 {n} 个',
      'bulk.moveTitle': '移动卡片',
      'bulk.moveText': '把选中的 {n} 个卡片移动到「{cat}」？该分类下已有的卡片保持不变。',
      'bulk.moveDone': '已把 {n} 个卡片移动到「{cat}」',
      'bulk.copyTitle': '复制卡片',
      'bulk.copyText': '把选中的 {n} 个卡片复制到「{cat}」？原分类下的卡片会保留，相当于给这些卡片增加一个新分类。',
      'bulk.copyDone': '已把 {n} 个卡片复制到「{cat}」',
      'bulk.copyNone': '这些卡片已经在「{cat}」里了',
      'bulk.deleteTitle': '删除卡片',
      'bulk.deleteText': '确定删除选中的 {n} 个卡片吗？只删除「{cat}」分类下的卡片，卡片在其他分类下仍然保留。',
      'bulk.deleteTextAll': '确定删除选中的 {n} 个卡片吗？这会删除这些卡片的所有分类，且无法恢复。',
      'bulk.deleteDone': '已删除 {n} 个卡片',
      'bulk.deleteDoneCat': '已从「{cat}」移除 {n} 个卡片',
      'bulk.noTarget': '请先选择一个分类',
      'bulk.noSelection': '请先勾选卡片',
      'bulk.chooseCategory': '选择分类',
      'confirm.ok': '删除',
      'confirm.cancel': '取消',
      'categoryDeleteTitle': '删除分类',
      'cat.renameTitle': '重命名分类',
      'cat.renameHint': '给分类「{name}」换一个新名字',
      'cat.renamePlaceholder': '分类名称',
      'cat.renameSave': '保存',
      'cat.renameEmpty': '分类名称不能为空',
      'toast.categoryRenamed': '分类已重命名为「{name}」',
      'categoryDeleteText': '确定删除分类「{name}」吗？分类下的卡片不会被删除。仍属于其他分类的卡片只从本分类移除；不再属于任何分类的卡片会归入「未分类」。',
      'categoryDeleteTextOne': '「{name}」下有 {n} 张卡片。删除后这些卡片不会被删除，会归入「未分类」。确定删除这个分类吗？',
      'count.total': '共 {n} 个软件',
      'option.one': '1 个卡片',
      'option.two': '2 个卡片',
      'option.icon': '只显示图标',
      'sort.default': '默认排序',
      'sort.updated': '最新更新',
      'sort.oldest': '最早上架',
      'sort.name_asc': 'A-Z 升序',
      'sort.name_desc': 'Z-A 降序',
      'sort.hot': '热门',
      'hot.open': '🔥 热门榜',
      'hot.title': '🔥 热门榜',
      'hot.topSoftware': '热门软件 Top 10',
      'hot.topSearches': '搜索词 Top 20',
      'hot.trend': '近 7 天趋势',
      'hot.empty': '还没有统计数据，点几次卡片链接或搜几个词就会出榜',
      'hot.emptySearch': '还没有搜索记录',
      'hot.window7': '统计窗口：近 7 天',
      'hot.window30': '统计窗口：近 30 天',
      'hot.windowOff': '热门统计已关闭（可在设置里开启）',
      'hot.events': '次行为',
      'pager.prev': '上一页',
      'pager.next': '下一页',
      'pager.jumpPrefix': '跳至',
      'pager.jumpSuffix': '页',
      'pager.go': 'GO',
      'empty.title': '这里还没有软件',
      'empty.all': '添加第一个软件卡片，开始整理你的软件库。',
      'empty.category': '当前分类下暂无软件，可以添加一个。',
      'empty.searchTitle': '没有找到结果',
      'empty.search': '没有匹配的软件，换个关键字试试。',
      'empty.add': '＋ 添加软件',
      'card.edit': '编辑',
      'card.pin': '置顶',
      'card.unpin': '取消置顶',
      'card.badgePin': '置顶',
      'card.copyTitleHint': '单击复制标题',
      'card.remove': '删除',
      'card.website': '🌐 官方网站：',
      'card.github': '🌐 GitHub 地址：',
      'card.release': '📌 版本更新：',
      'card.docs': '📖 官方文档：',
      'card.support': '💻 支持系统：',
      'card.license': '💰 授权方式：',
      'card.download': '📥 下载地址：',
      'card.viewRelease': '查看版本更新',
      'card.viewDocs': '查看文档',
      'modal.addTitle': '添加软件',
      'modal.editTitle': '编辑软件',
      'form.name': '软件名称',
      'form.category': '所属分类',
      'form.categoryHint': '（可多选，不选则为「未分类」）',
      'form.categoryAll': '全选',
      'form.categoryClear': '清空',
      'form.desc': '软件简介',
      'form.descriptionHint': '例如，这是一个免费开源软件，无广告',
      'form.logo': '图标',
      'form.logoUrl': '图标 URL，例如 https://.../logo.png',
      'form.upload': '上传本地图片',
      'form.clearLogo': '清除',
      'form.home': '官网链接',
      'form.github': 'GitHub 链接',
      'form.release': '版本更新链接',
      'form.doc': '文档链接',
      'form.linkText': '链接显示文字',
      'form.linksHead': '链接',
      'form.linksHint': '（左：卡片显示名称，中：链接地址，右：链接显示文字，留空则显示链接本身）',
      'form.labelDefaultHome': '🌐 官方网站',
      'form.labelDefaultGithub': '🌐 GitHub 地址',
      'form.labelDefaultRelease': '📌 版本更新',
      'form.labelDefaultDoc': '📖 官方文档',
      'form.downloads': '下载地址',
      'form.extraLinks': '其他链接',
      'form.extraHint': '（左：名称，中：链接，右：链接显示文字，留空显示链接；可添加多条；按住左侧手柄可拖曳排序）',
      'form.addExtraLink': '＋ 添加一条链接',
      'form.extraEmpty': '还没有其他链接',
      'form.exText': '名称，例如：镜像下载',
      'form.exLink': 'https://...',
      'form.exLabel': '链接显示文字',
      'form.licenses': '授权方式',
      'form.downloadEmpty': '暂无下载条目，点下方按钮添加',
      'form.addDownload': '＋ 添加一条下载',
      'form.dlText': '名称，如：Windows 版',
      'form.dlLink': '下载链接，如：https://xxx.exe',
      'form.rm': '移除',
      'form.dragHint': '按住拖曳调整顺序',
      'form.platforms': '支持系统',
      'form.cardColor': '卡片背景色',
      'form.cardColorHint': '#f5f6f8（留空为默认背景）',
      'form.colorClear': '恢复默认',
      'form.cancel': '取消',
      'form.save': '保存',
      'form.saving': '保存中…',
      'form.errorName': '请填写软件名称',
      'form.errorCategory': '请先创建并选择一个分类',
      'form.noCategories': '还没有分类，保存后这张卡片会归到「未分类」',
      'login.title': '登录',
      'login.username': '用户名',
      'login.password': '密码',
      'login.remember': '记住密码',
      'login.forgot': '忘记密码？',
      'login.submit': '登录',
      'login.submitting': '登录中…',
      'login.usernamePlaceholder': '请输入用户名',
      'login.passwordPlaceholder': '请输入密码',
      'forgot.title': '忘记密码',
      'forgot.body': '本站密码保存在服务器本地。请在服务器上执行下面的命令重置密码：',
      'forgot.hint': '不填新密码时，默认重置为 admin123，重置后请尽快在「设置 → 账号安全」里修改。',
      'forgot.close': '我知道了',
      'settings.title': '设置',
      'settings.siteSection': '站点设置',
      'settings.siteName': '站点名称',
      'settings.siteTitle': '网站标题',
      'settings.siteTagline': '站点副标题',
      'settings.siteTaglineHint': '专属于你的软件收藏',
      'settings.siteIcon': '网站图标',
      'settings.iconUpload': '上传图标',
      'settings.theme': '外观主题',
      'settings.themeLight': '浅色',
      'settings.themeDark': '深色',
      'settings.themeSystem': '跟随系统',
      'settings.language': '语言',
      'settings.hotSection': '热门统计',
      'settings.hotWindow': '统计时间窗',
      'settings.hotWindow7': '近 7 天（推荐）',
      'settings.hotWindow30': '近 30 天',
      'settings.hotWindowOff': '关闭热门排序',
      'settings.hotBoard': '显示热门榜',
      'settings.hotHint': '近 7 天 = 0.6×近 7 天 + 0.4×近 30 天衰减；近 30 天 = 单窗口衰减；关闭后排序里不再显示「热门排序」。',
      'settings.searchSection': '搜索',
      'settings.searchHighlight': '搜索结果高亮关键词显示',
      'settings.about': '关于',
      'settings.aboutVersion': '当前版本：2.4.1',
      'settings.account': '账号安全',
      'settings.currentPwd': '当前密码',
      'settings.newUsername': '新用户名',
      'settings.newPwd': '新密码（留空则不修改）',
      'settings.saveAccount': '保存账号设置',
      'settings.loginGuard': '登录防护',
      'settings.loginGuardHint': '服务模式专用：连续登录失败达到次数后，按设定时长锁定该账户；填 0 表示不限制。',
      'settings.loginMaxFail': '失败次',
      'settings.loginLockMinutes': '锁定时（分钟）',
      'settings.saveLoginGuard': '保存',
      'settings.loginGuardInvalid': '请填写 0 或正整数',
      'settings.backup': '备份与恢复',
      'settings.backupHint': '备份包含数据库和上传的图标；恢复会覆盖当前全部数据，请先下载备份。',
      'settings.download': '下载备份',
      'settings.restore': '恢复备份',
      'settings.save': '保存设置',
      'settings.close': '关闭',
      'toast.categoryAdded': '已添加分类「{name}」',
      'toast.categoryDeleted': '分类已删除',      'toast.saved': '已保存修改',
      'toast.added': '已添加软件',
      'toast.deleted': '已删除',
      'toast.uploading': '上传中…',
      'toast.uploaded': '图标已上传',
      'toast.loginSuccess': '登录成功',
      'toast.logout': '已退出登录',
      'toast.settingsSaved': '设置已保存',
      'toast.titleCopied': '已复制标题：{name}',
      'toast.copyFailed': '复制失败，请手动选择文字',
      'toast.loginGuardSaved': '登录防护设置已保存',
      'toast.accountSaved': '账号已更新',
      'toast.pinned': '已置顶「{name}」',
      'toast.categoryOrder': '分类顺序已更新',
      'toast.unpinned': '已取消置顶「{name}」',
      'toast.restoring': '正在恢复…',
      'toast.restored': '备份已恢复，请重新登录',
      'toast.needLogin': '请先登录',
      'toast.iconBig': '图片不能超过 5MB',
      'toast.pageRange': '请输入 1 到 {max} 之间的页码',
      'delete.title': '删除卡片',
      'delete.hint': '「{name}」属于 {n} 个分类：{cats}。请选择要执行的操作。',
      'delete.hintOne': '「{name}」目前只属于「{cat}」，选择「只删除该分类下的卡片」等于删除这张卡片。',
      'delete.hintNoCat': '「{name}」目前未归入任何分类（显示在「未分类」里），删除后这张卡片将从所有分类中移除。',
      'delete.onlyThis': '只删除「{cat}」下的卡片',
      'delete.all': '删除所有分类下的卡片',
      'delete.cancel': '取消',
      'toast.removedFrom': '已从「{cat}」移除该卡片',
      'confirm.deleteSoftware': '确定删除「{name}」吗？',
      'confirm.deleteCategory': '确定删除分类「{name}」吗？',
      'confirm.deleteCategoryItems': '分类「{name}」下有 {count} 张卡片。删除后，同时属于其他分类的卡片只从本分类移除；只属于本分类的卡片会转到「未分类」。确定继续吗？',
      'confirm.restore': '恢复备份会覆盖当前全部数据，确定继续吗？',
    },
    en: {
      'header.subtitle': 'Organize your software collection by category',
      'search.placeholder': 'Search name or description',
      'field.clear': 'Clear',
      'search.heading': 'Search results',
      'btn.login': 'Sign in',
      'btn.settings': 'Settings',
      'btn.logout': 'Sign out',
      'btn.addSoftware': '＋ Add software',
      'sidebar.title': 'Categories',
      'sidebar.all': 'All',
      'sidebar.newCategory': 'New category',
      'sidebar.add': 'Add',
      'sidebar.uncategorized': 'Uncategorized',
      'sidebar.tip': 'Categories are customizable. Click × to delete.',
      'filter.platform': 'Platform',
      'filter.license': 'License',
      'filter.allPlatform': 'All platforms',
      'filter.allLicense': 'All licenses',
      'license.free': 'Free',
      'license.subscription': 'Subscription',
      'license.onetime': 'One-time purchase',
      'license.metered': 'Usage-based',
      'license.freemium': 'Freemium',
      'content.perRow': 'Cards per row',
      'content.perPage': 'Per page',
      'content.sort': 'Sort',
      'content.moveTo': 'Move to',
      'content.moveCard': 'Move card',
      'content.copyCard': 'Copy card',
      'bulk.enter': 'Select',
      'bulk.exit': 'Cancel select',
      'bulk.delete': 'Delete',
      'bulk.selected': '{n} selected',
      'bulk.selectHint': 'Click cards to select, {n} selected',
      'bulk.moveTitle': 'Move cards',
      'bulk.moveText': 'Move the {n} selected cards to “{cat}”? Cards already in that category are kept.',
      'bulk.moveDone': 'Moved {n} cards to “{cat}”',
      'bulk.copyTitle': 'Copy cards',
      'bulk.copyText': 'Copy the {n} selected cards to “{cat}”? The cards stay in their current category — this adds one more category to them.',
      'bulk.copyDone': 'Copied {n} cards to “{cat}”',
      'bulk.copyNone': 'Those cards are already in “{cat}”',
      'bulk.deleteTitle': 'Delete cards',
      'bulk.deleteText': 'Delete the {n} selected cards? Only the cards in “{cat}” are removed; cards in other categories are kept.',
      'bulk.deleteTextAll': 'Delete the {n} selected cards? This removes them from every category and cannot be undone.',
      'bulk.deleteDone': 'Deleted {n} cards',
      'bulk.deleteDoneCat': 'Removed {n} cards from “{cat}”',
      'bulk.noTarget': 'Choose a category first',
      'bulk.noSelection': 'Select some cards first',
      'bulk.chooseCategory': 'Choose category',
      'confirm.ok': 'Delete',
      'confirm.cancel': 'Cancel',
      'categoryDeleteTitle': 'Delete category',
      'cat.renameTitle': 'Rename category',
      'cat.renameHint': 'Give category “{name}” a new name',
      'cat.renamePlaceholder': 'Category name',
      'cat.renameSave': 'Save',
      'cat.renameEmpty': 'Category name cannot be empty',
      'toast.categoryRenamed': 'Category renamed to “{name}”',
      'categoryDeleteText': 'Delete category “{name}”? Cards in it are not deleted: cards that still belong to other categories are only removed here, the rest move to Uncategorized.',
      'categoryDeleteTextOne': '“{name}” has {n} cards. They are not deleted — they move to Uncategorized. Delete this category?',
      'count.total': '{n} items',
      'option.one': '1 card',
      'option.two': '2 cards',
      'option.icon': 'Icons only',
      'sort.default': 'Default',
      'sort.updated': 'Recently updated',
      'sort.oldest': 'Oldest first',
      'sort.name_asc': 'Name A-Z',
      'sort.name_desc': 'Name Z-A',
      'sort.hot': 'Popular',
      'hot.open': '🔥 Popular',
      'hot.title': '🔥 Popular',
      'hot.topSoftware': 'Top 10 software',
      'hot.topSearches': 'Top 20 searches',
      'hot.trend': 'Last 7 days',
      'hot.empty': 'No data yet. Click a card link or search something to start.',
      'hot.emptySearch': 'No search records yet',
      'hot.window7': 'Window: last 7 days',
      'hot.window30': 'Window: last 30 days',
      'hot.windowOff': 'Popular stats are off (enable in Settings)',
      'hot.events': 'events',
      'pager.prev': 'Prev',
      'pager.next': 'Next',
      'pager.jumpPrefix': 'Go to',
      'pager.jumpSuffix': 'page',
      'pager.go': 'GO',
      'empty.title': 'No software here yet',
      'empty.all': 'Add the first card to start your library.',
      'empty.category': 'No software in this category yet.',
      'empty.searchTitle': 'No results found',
      'empty.search': 'No matches. Try another keyword.',
      'empty.add': '＋ Add software',
      'card.edit': 'Edit',
      'card.pin': 'Pin',
      'card.unpin': 'Unpin',
      'card.badgePin': 'Pinned',
      'card.copyTitleHint': 'Click to copy title',
      'card.remove': 'Delete',
      'card.website': '🌐 Website: ',
      'card.github': '🌐 GitHub: ',
      'card.release': '📌 Releases: ',
      'card.docs': '📖 Docs: ',
      'card.support': '💻 Platforms: ',
      'card.license': '💰 License: ',
      'card.download': '📥 Downloads: ',
      'card.viewRelease': 'View releases',
      'card.viewDocs': 'View docs',
      'modal.addTitle': 'Add software',
      'modal.editTitle': 'Edit software',
      'form.name': 'Name',
      'form.category': 'Category',
      'form.categoryHint': ' (multiple allowed, empty = Uncategorized)',
      'form.categoryAll': 'All',
      'form.categoryClear': 'Clear',
      'form.desc': 'Description',
      'form.descriptionHint': 'e.g. A free, open-source app with no ads',
      'form.logo': 'Icon',
      'form.logoUrl': 'Icon URL, e.g. https://.../logo.png',
      'form.upload': 'Upload image',
      'form.clearLogo': 'Clear',
      'form.home': 'Website URL',
      'form.github': 'GitHub URL',
      'form.release': 'Release URL',
      'form.doc': 'Docs URL',
      'form.linkText': 'Link text',
      'form.linksHead': 'Links',
      'form.linksHint': ' (left: name shown on the card, middle: URL, right: link text; empty shows the URL itself)',
      'form.labelDefaultHome': '🌐 Website',
      'form.labelDefaultGithub': '🌐 GitHub',
      'form.labelDefaultRelease': '📌 Releases',
      'form.labelDefaultDoc': '📖 Docs',
      'form.downloads': 'Downloads',
      'form.extraLinks': 'Other links',
      'form.extraHint': ' (left: name, middle: URL, right: link text; empty shows the URL; drag the left handle to reorder)',
      'form.addExtraLink': '＋ Add link',
      'form.extraEmpty': 'No extra links yet',
      'form.exText': 'Name, e.g. Mirror download',
      'form.exLink': 'https://...',
      'form.exLabel': 'Link text',
      'form.licenses': 'License',
      'form.downloadEmpty': 'No entries yet. Add one below.',
      'form.addDownload': '＋ Add download',
      'form.dlText': 'Name, e.g. Windows build',
      'form.dlLink': 'Link, e.g. https://...',
      'form.rm': 'Remove',
      'form.dragHint': 'Drag to reorder',
      'form.platforms': 'Platforms',
      'form.cardColor': 'Card background',
      'form.cardColorHint': '#f5f6f8 (blank = default)',
      'form.colorClear': 'Reset',
      'form.cancel': 'Cancel',
      'form.save': 'Save',
      'form.saving': 'Saving…',
      'form.errorName': 'Please enter a name',
      'form.errorCategory': 'Please create and select a category',
      'form.noCategories': 'No categories yet — the card will be saved as Uncategorized',
      'login.title': 'Sign in',
      'login.username': 'Username',
      'login.password': 'Password',
      'login.remember': 'Remember password',
      'login.forgot': 'Forgot password?',
      'login.submit': 'Sign in',
      'login.submitting': 'Signing in…',
      'login.usernamePlaceholder': 'Enter username',
      'login.passwordPlaceholder': 'Enter password',
      'forgot.title': 'Forgot password',
      'forgot.body': 'This site stores credentials locally. Reset the password on the server:',
      'forgot.hint': 'Without a new password it resets to admin123. Change it in Settings → Account security.',
      'forgot.close': 'Got it',
      'settings.title': 'Settings',
      'settings.siteSection': 'Site',
      'settings.siteName': 'Site name',
      'settings.siteTitle': 'Browser title',
      'settings.siteTagline': 'Site tagline',
      'settings.siteTaglineHint': 'Your personal software collection',
      'settings.siteIcon': 'Site icon',
      'settings.iconUpload': 'Upload icon',
      'settings.theme': 'Theme',
      'settings.themeLight': 'Light',
      'settings.themeDark': 'Dark',
      'settings.themeSystem': 'Follow system',
      'settings.language': 'Language',
      'settings.hotSection': 'Popular stats',
      'settings.hotWindow': 'Time window',
      'settings.hotWindow7': 'Last 7 days (recommended)',
      'settings.hotWindow30': 'Last 30 days',
      'settings.hotWindowOff': 'Turn off popular sorting',
      'settings.hotBoard': 'Show popular board',
      'settings.hotHint': '7 days = 0.6 × last 7 days + 0.4 × last 30 days (decayed); 30 days = single decayed window; off hides the Popular sort option.',
      'settings.searchSection': 'Search',
      'settings.searchHighlight': 'Highlight matched keywords',
      'settings.about': 'About',
      'settings.aboutVersion': 'Current version: 2.4.1',
      'settings.account': 'Account security',
      'settings.currentPwd': 'Current password',
      'settings.newUsername': 'New username',
      'settings.newPwd': 'New password (leave blank to keep)',
      'settings.saveAccount': 'Save account',
      'settings.loginGuard': 'Sign-in protection',
      'settings.loginGuardHint': 'Service mode only: lock the account for the configured duration after repeated failed sign-ins; set 0 for no limit.',
      'settings.loginMaxFail': 'Failures',
      'settings.loginLockMinutes': 'Lock (min)',
      'settings.saveLoginGuard': 'Save',
      'settings.loginGuardInvalid': 'Enter 0 or a positive whole number',
      'settings.backup': 'Backup & restore',
      'settings.backupHint': 'Backup includes the database and icons. Restoring overwrites all data, download a backup first.',
      'settings.download': 'Download backup',
      'settings.restore': 'Restore backup',
      'settings.save': 'Save settings',
      'settings.close': 'Close',
      'toast.categoryAdded': 'Category “{name}” added',
      'toast.categoryDeleted': 'Category deleted',
      'toast.saved': 'Changes saved',
      'toast.added': 'Software added',
      'toast.deleted': 'Deleted',
      'toast.uploading': 'Uploading…',
      'toast.uploaded': 'Icon uploaded',
      'toast.loginSuccess': 'Signed in',
      'toast.logout': 'Signed out',
      'toast.settingsSaved': 'Settings saved',
      'toast.titleCopied': 'Title copied: {name}',
      'toast.copyFailed': 'Copy failed, select the text manually',
      'toast.loginGuardSaved': 'Sign-in protection saved',
      'toast.accountSaved': 'Account updated',
      'toast.pinned': 'Pinned “{name}”',
      'toast.categoryOrder': 'Category order updated',
      'toast.unpinned': 'Unpinned “{name}”',
      'toast.restoring': 'Restoring…',
      'toast.restored': 'Restored. Please sign in again.',
      'toast.needLogin': 'Please sign in first',
      'toast.iconBig': 'Image must be under 5MB',
      'toast.pageRange': 'Enter a page between 1 and {max}',
      'delete.title': 'Delete card',
      'delete.hint': '“{name}” belongs to {n} categories: {cats}. Choose an action.',
      'delete.hintOne': '“{name}” only belongs to “{cat}”, so removing that card deletes it.',
      'delete.hintNoCat': '“{name}” is not in any category (shown as Uncategorized). Deleting removes this card everywhere.',
      'delete.onlyThis': 'Delete only the “{cat}” card',
      'delete.all': 'Delete all cards of this software',
      'delete.cancel': 'Cancel',
      'toast.removedFrom': 'Removed from “{cat}”',
      'confirm.deleteSoftware': 'Delete “{name}”?',
      'confirm.deleteCategory': 'Delete category “{name}”?',
      'confirm.deleteCategoryItems': 'Category “{name}” has {count} cards. Cards that also belong to other categories are only removed here; the rest move to Uncategorized. Continue?',
      'confirm.restore': 'Restoring overwrites all current data. Continue?',
    },
  };

  const PAGE_SIZES = [10, 20, 30, 50, 100];
  const COLS_OPTIONS = ['1', '2', 'icon'];

  function normalizePageSize(value) {
    const num = Number(value);
    return PAGE_SIZES.indexOf(num) >= 0 ? num : 20;
  }

  function normalizeCols(value) {
    const raw = String(value == null ? '' : value);
    if (raw === 'icon') return 'icon';
    return raw === '2' ? 2 : 1;
  }

  const state = {
    categories: [],
    categoryTotal: 0,
    uncategorizedCount: 0,
    activeCategory: 'all',
    q: '',
    platform: '',
    license: '',
    sort: localStorage.getItem('hub.sort') || 'default',
    page: 1,
    pageSize: normalizePageSize(localStorage.getItem('hub.pageSize')),
    cols: normalizeCols(localStorage.getItem('hub.cols')),
    items: [],
    total: 0,
    pages: 1,
    editingId: null,
    focused: null,
    selectMode: false,
    selected: new Set(),
    modalDownloads: [],
    modalExtraLinks: [],
    modalLogo: '',
    modalCardColor: '',
    user: '',
    settings: {
      site_name: '软件库',
      site_title: '软件库',
      site_tagline: '',
      site_icon: '/static/favicon.svg',
      theme: 'system',
      language: 'zh-CN',
    },
    lang: 'zh-CN',
    siteIconDraft: '',
  };

  const els = {
    categoryList: $('#categoryList'),
    allCount: $('#allCount'),
    currentCategory: $('#currentCategory'),
    countInfo: $('#countInfo'),
    cardGrid: $('#cardGrid'),
    pager: $('#pager'),
    pageNumbers: $('#pageNumbers'),
    prevPage: $('#prevPage'),
    nextPage: $('#nextPage'),
    jumpInput: $('#jumpInput'),
    pageSizeSelect: $('#pageSizeSelect'),
    colsSelect: $('#colsSelect'),
    sortSelect: $('#sortSelect'),
    searchInput: $('#searchInput'),
    searchClear: $('#searchClear'),
    modal: $('#softwareModal'),
    modalTitle: $('#modalTitle'),
    form: $('#softwareForm'),
    formCategories: $('#formCategories'),
    formError: $('#formError'),
    logoPreview: $('#logoPreview'),
    logoUrl: $('#logoUrl'),
    logoFile: $('#logoFile'),
    downloadRows: $('#downloadRows'),
    extraLinkRows: $('#extraLinkRows'),
    toast: $('#toast'),
    btnLogin: $('#btnLogin'),
    btnSettings: $('#btnSettings'),
    btnAddSoftware: $('#btnAddSoftware'),
    btnLogoutTop: $('#btnLogoutTop'),
    userName: $('#userName'),
    cardColorText: $('#cardColorText'),
    cardColorPicker: $('#cardColorPicker'),
    platformFilter: $('#platformFilter'),
    licenseFilter: $('#licenseFilter'),
    categoryForm: $('#categoryForm'),
    sidebarTip: $('#sidebarTip'),
    loginModal: $('#loginModal'),
    loginForm: $('#loginForm'),
    loginError: $('#loginError'),
    settingsModal: $('#settingsModal'),
    hotModal: $('#hotModal'),
    btnHotPanel: $('#btnHotPanel'),
    siteName: $('#siteName'),
    siteTagline: $('#siteTagline'),
    brandMark: $('#brandMark'),
    deleteModal: $('#deleteModal'),
    deleteHint: $('#deleteHint'),
    deleteOne: $('#deleteOne'),
    bulkTools: $('#bulkTools'),
    bulkMoveSelect: $('#bulkMoveSelect'),
    bulkDelete: $('#bulkDelete'),
    btnSelectMode: $('#btnSelectMode'),
    confirmModal: $('#confirmModal'),
    confirmTitle: $('#confirmTitle'),
    confirmText: $('#confirmText'),
    confirmOk: $('#confirmOk'),
    confirmAlt: $('#confirmAlt'),
    confirmInput: $('#confirmInput'),
    confirmInputWrap: $('#confirmInputWrap'),
  };

  // ---------------- 基础工具 ----------------
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeHref(url) {
    const trimmed = String(url || '').trim();
    if (trimmed.startsWith('//')) return '';
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed;
    return '';
  }

  // 支持基础的 Markdown（加粗 / 斜体 / 删除线 / 行内代码 / 链接 / 列表 / 小标题 / 换行）
  // 先整体转义，再按白名单重建标签，避免注入。
  function renderMarkdown(value) {
    let text = String(value == null ? '' : value).replace(/\r\n?/g, '\n').trim();
    if (!text) return '';
    const escaped = escapeHtml(text);

    const codes = [];
    let src = escaped.replace(/`([^`\n]+)`/g, (m, code) => {
      codes.push(`<code>${code}</code>`);
      return `\u0001${codes.length - 1}\u0002`;
    });

    const inline = (s) => s
      .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
      .replace(/~~([^~\n]+)~~/g, '<del>$1</del>');

    const restoreCodes = (s) => s.replace(/\u0001(\d+)\u0002/g, (m, i) => codes[Number(i)] || '');

    const out = [];
    let list = [];
    const flushList = () => {
      if (list.length) {
        out.push(`<ul>${list.join('')}</ul>`);
        list = [];
      }
    };
    src.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList();
        return;
      }
      const li = trimmed.match(/^[-*+]\s+(.*)$/);
      if (li) {
        list.push(`<li>${inline(li[1])}</li>`);
        return;
      }
      flushList();
      const head = trimmed.match(/^(#{1,3})\s+(.*)$/);
      if (head) {
        const level = head[1].length + 2;
        out.push(`<h${level}>${inline(head[2])}</h${level}>`);
        return;
      }
      out.push(`<p>${inline(trimmed)}</p>`);
    });
    flushList();
    return restoreCodes(out.join(''));
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // 在已经转义过的 HTML 里高亮关键词：只处理标签之间的文本，不动标签和属性
  function highlightHtml(html, keyword) {
    const raw = String(keyword || '').trim();
    if (!raw) return html;
    const escaped = escapeHtml(raw);
    const re = new RegExp(escapeRegExp(escaped), 'gi');
    return String(html)
      .split(/(<[^>]*>)/)
      .map((segment) => {
        if (!segment || segment.startsWith('<')) return segment;
        return segment.replace(re, (match) => `<mark class="search-hit">${match}</mark>`);
      })
      .join('');
  }

  function highlightNameHtml(name, keyword) {
    return highlightHtml(escapeHtml(name), keyword);
  }

  function searchHighlightKeyword() {
    const on = state.settings && state.settings.search_highlight !== '0';
    if (!on || !state.q || state.focused) return '';
    return state.q;
  }

  function t(key, vars) {
    const dict = I18N[state.lang] || I18N['zh-CN'];
    let text = dict[key] != null ? dict[key] : (I18N['zh-CN'][key] != null ? I18N['zh-CN'][key] : key);
    if (vars) {
      Object.keys(vars).forEach((k) => {
        text = text.split('{' + k + '}').join(String(vars[k]));
      });
    }
    return text;
  }

  let toastTimer = null;
  function toast(message, isError = false) {
    els.toast.textContent = message;
    els.toast.classList.toggle('error', isError);
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
  }

  // 复制到系统剪贴板：优先 Clipboard API；局域网 http 等非安全上下文回退到 execCommand
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      // 交给下面的兜底方案
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-9999px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }

  // ---------------- 输入框内置清空按钮 ----------------
  // 给除复选 / 文件 / 颜色等控件外的输入框包一层容器，右侧放一个 × 按钮，点击清空内容。
  const CLEAR_SKIP_TYPES = ['checkbox', 'radio', 'file', 'color', 'range', 'hidden', 'submit', 'button', 'reset', 'image'];

  function attachClearButton(field) {
    if (!field || field.nodeType !== 1) return;
    if (field.tagName !== 'INPUT' && field.tagName !== 'TEXTAREA') return;
    const type = (field.getAttribute('type') || 'text').toLowerCase();
    if (CLEAR_SKIP_TYPES.includes(type)) return;
    if (field.closest('.search-box') || field.closest('.clearable-field')) return;

    const wrap = document.createElement('span');
    wrap.className = 'clearable-field';
    field.parentNode.insertBefore(wrap, field);
    wrap.appendChild(field);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'field-clear';
    btn.tabIndex = -1;
    btn.textContent = '×';
    btn.title = t('field.clear');
    btn.setAttribute('aria-label', t('field.clear'));
    wrap.appendChild(btn);

    const syncState = () => {
      wrap.classList.toggle('has-value', String(field.value || '').length > 0);
    };
    field.addEventListener('input', syncState);
    field.addEventListener('change', syncState);
    syncState();

    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!field.value) {
        field.focus();
        return;
      }
      field.value = '';
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      syncState();
      field.focus();
    });
  }

  function setupClearButtons(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.tagName === 'INPUT' || root.tagName === 'TEXTAREA') {
      attachClearButton(root);
    }
    if (root.querySelectorAll) {
      root.querySelectorAll('input, textarea').forEach(attachClearButton);
    }
  }

  function watchClearButtons() {
    setupClearButtons(document.body);
    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === 1) setupClearButtons(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ---------------- 行为埋点（热门排序的数据来源） ----------------
  // 只上报最小信息：事件类型、软件 id、链接标识、关键词；3 秒内相同事件去重。
  const trackRecent = new Map();

  function trackEvent(type, payload = {}) {
    try {
      const key = [type, payload.software_id || '', payload.field || '', payload.keyword || ''].join('|');
      const now = Date.now();
      const last = trackRecent.get(key) || 0;
      if (now - last < 3000) return;
      trackRecent.set(key, now);
      if (trackRecent.size > 200) trackRecent.clear();

      const body = JSON.stringify({ type, ...payload });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/events', new Blob([body], { type: 'application/json' }));
      } else {
        fetch('/api/events', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch (err) {
      // 埋点失败绝不影响主流程
    }
  }

  async function api(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'same-origin',
      headers: options.body && !(options.body instanceof Blob) ? { 'Content-Type': 'application/json' } : {},
      ...options,
    });
    let data = null;
    try {
      data = await res.json();
    } catch (err) {
      data = null;
    }
    if (!res.ok) {
      const error = new Error((data && data.error) || `请求失败（${res.status}）`);
      error.status = res.status;
      throw error;
    }
    return data;
  }

  // ---------------- 语言 / 主题 / 站点 ----------------
  function applyI18n() {
    document.documentElement.lang = state.lang;
    $$('[data-i18n]').forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    $$('[data-i18n-ph]').forEach((node) => {
      node.placeholder = t(node.dataset.i18nPh);
    });
    $$('.field-clear').forEach((node) => {
      const label = t('field.clear');
      node.title = label;
      node.setAttribute('aria-label', label);
    });
  }

  let systemThemeQuery = null;
  const THEME_KEY = 'hub.theme';

  function preferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return (state.settings && state.settings.theme) || 'system';
  }

  function resolveTheme(theme) {
    if (theme === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    const chosen = theme || preferredTheme();
    document.documentElement.dataset.theme = resolveTheme(chosen);
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.querySelectorAll('[data-theme-value]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.themeValue === chosen);
      });
    }
    if (!systemThemeQuery && window.matchMedia) {
      systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      systemThemeQuery.addEventListener('change', () => {
        if (preferredTheme() === 'system') applyTheme('system');
      });
    }
  }

  function renderBrandMark(name, iconHref) {
    const mark = els.brandMark;
    const letter = (name || '').slice(0, 1) || '软';
    mark.innerHTML = '';
    mark.classList.remove('has-icon');
    if (!iconHref) {
      mark.textContent = letter;
      return;
    }
    const img = document.createElement('img');
    img.className = 'brand-icon';
    img.alt = '';
    img.decoding = 'async';
    img.addEventListener('error', () => {
      mark.classList.remove('has-icon');
      mark.textContent = letter;
    });
    img.src = iconHref;
    mark.classList.add('has-icon');
    mark.appendChild(img);
  }

  function applySite(settings) {
    state.settings = settings;
    state.lang = settings.language === 'en' ? 'en' : 'zh-CN';
    const name = settings.site_name || '软件库';
    const iconHref = safeHref(settings.site_icon) || '/static/favicon.svg';
    els.siteName.textContent = name;
    renderBrandMark(name, iconHref);
    document.title = settings.site_title || name;
    let icon = document.querySelector('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      document.head.appendChild(icon);
    }
    icon.href = iconHref;
    applyTheme();
    applyI18n();
    els.siteTagline.textContent = settings.site_tagline || t('header.subtitle');

    // 关闭热门统计时，排序下拉里隐藏「热门排序」
    const hotOption = els.sortSelect.querySelector('option[value="hot"]');
    const hotOn = (settings.hot_window || '7') !== 'off';
    if (hotOption) {
      hotOption.hidden = !hotOn;
      if (!hotOn && state.sort === 'hot') {
        state.sort = 'default';
        els.sortSelect.value = 'default';
      }
    }

    // 关闭「显示热门榜」时隐藏顶部操作栏的热门榜入口
    const boardOn = settings.hot_board !== '0';
    els.btnHotPanel.hidden = !boardOn;
    if (!boardOn && !els.hotModal.hidden) {
      els.hotModal.hidden = true;
    }
  }

  async function loadSettings() {
    const settings = await api('/api/settings');
    applySite(settings);
    $('#settingSiteName').value = settings.site_name || '';
    $('#settingSiteTitle').value = settings.site_title || '';
    $('#settingSiteTagline').value = settings.site_tagline || t('header.subtitle');
    $('#settingSiteIcon').value = settings.site_icon || '';
    $('#settingLanguage').value = settings.language === 'en' ? 'en' : 'zh-CN';
    $('#settingHotWindow').value = settings.hot_window === 'off'
      ? 'off'
      : (settings.hot_window === '30' ? '30' : '7');
    $('#settingSearchHighlight').checked = settings.search_highlight !== '0';
    $('#settingHotBoard').checked = settings.hot_board !== '0';
    $('#settingLoginMaxFail').value = settings.login_max_fail ?? '0';
    $('#settingLoginLockMinutes').value = settings.login_lock_minutes ?? '0';
    state.siteIconDraft = settings.site_icon || '';
    updateSiteIconPreview();
  }

  // ---------------- 登录状态 ----------------
  async function loadAuth() {
    const data = await api('/api/auth/me');
    state.user = data.logged_in ? data.username : '';
    renderAuthUI();
  }

  function renderAuthUI() {
    const loggedIn = !!state.user;
    els.btnLogin.hidden = loggedIn;
    els.btnAddSoftware.hidden = !loggedIn;
    els.btnSettings.hidden = !loggedIn;
    els.btnLogoutTop.hidden = !loggedIn;
    els.userName.hidden = !loggedIn;
    els.userName.textContent = loggedIn ? state.user : '';
    els.categoryForm.hidden = !loggedIn;
    els.sidebarTip.hidden = !loggedIn;
    updateBulkUI();
  }

  function openLogin() {
    els.loginError.textContent = '';
    const saved = loadRemembered();
    $('#loginUser').value = saved ? saved.username : '';
    $('#loginPass').value = saved ? saved.password : '';
    $('#rememberPass').checked = !!saved;
    els.loginModal.hidden = false;
    setTimeout(() => (saved ? $('#loginPass') : $('#loginUser')).focus(), 50);
  }

  async function submitLogin(event) {
    event.preventDefault();
    const username = $('#loginUser').value.trim();
    const password = $('#loginPass').value;
    if (!username || !password) {
      els.loginError.textContent = t('login.usernamePlaceholder');
      return;
    }
    const btn = $('#loginSubmit');
    btn.disabled = true;
    btn.textContent = t('login.submitting');
    try {
      await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, remember: $('#rememberPass').checked }),
      });
      if ($('#rememberPass').checked) {
        saveRemembered(username, password);
      } else {
        clearRemembered();
      }
      els.loginModal.hidden = true;
      await loadAuth();
      renderCategories();
      renderCards();
      toast(t('toast.loginSuccess'));
    } catch (err) {
      els.loginError.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = t('login.submit');
    }
  }

  function openSettings() {
    if (!state.user) return;
    $('#settingsError').textContent = '';
    $('#accountError').textContent = '';
    $('#backupError').textContent = '';
    $('#loginGuardError').textContent = '';
    $('#accCurrent').value = '';
    $('#accUsername').value = state.user;
    $('#accNewPass').value = '';
    els.settingsModal.hidden = false;
  }

  function readLoginGuardValues() {
    const read = (selector) => {
      const raw = $(selector).value.trim();
      if (raw === '') return '0';
      if (!/^\d+$/.test(raw)) throw new Error(t('settings.loginGuardInvalid'));
      return String(parseInt(raw, 10));
    };
    return {
      login_max_fail: read('#settingLoginMaxFail'),
      login_lock_minutes: read('#settingLoginLockMinutes'),
    };
  }

  async function saveLoginGuard() {
    const btn = $('#saveLoginGuard');
    const errorEl = $('#loginGuardError');
    errorEl.textContent = '';
    let payload;
    try {
      payload = readLoginGuardValues();
    } catch (err) {
      errorEl.textContent = err.message;
      return;
    }
    btn.disabled = true;
    try {
      await api('/api/settings', { method: 'PUT', body: JSON.stringify(payload) });
      toast(t('toast.loginGuardSaved'));
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  }

  async function saveSettings() {
    const payload = {
      site_name: $('#settingSiteName').value.trim(),
      site_title: $('#settingSiteTitle').value.trim(),
      site_tagline: $('#settingSiteTagline').value.trim(),
      site_icon: $('#settingSiteIcon').value.trim(),
      language: $('#settingLanguage').value,
      hot_window: $('#settingHotWindow').value,
      hot_board: $('#settingHotBoard').checked ? '1' : '0',
      search_highlight: $('#settingSearchHighlight').checked ? '1' : '0',
    };
    if (!payload.site_name) {
      $('#settingsError').textContent = t('settings.siteName');
      return;
    }
    try {
      Object.assign(payload, readLoginGuardValues());
    } catch (err) {
      $('#settingsError').textContent = err.message;
      return;
    }
    const btn = $('#saveSettings');
    btn.disabled = true;
    try {
      const saved = await api('/api/settings', { method: 'PUT', body: JSON.stringify(payload) });
      applySite(saved);
      renderCategories();
      await loadSoftware();
      state.siteIconDraft = saved.site_icon || '';
      updateSiteIconPreview();
      toast(t('toast.settingsSaved'));
    } catch (err) {
      $('#settingsError').textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  }

  // ---------------- 热门榜 ----------------
  function openHotPanel() {
    $('#hotError').textContent = '';
    els.hotModal.hidden = false;
    loadHotPanel();
  }

  async function loadHotPanel() {
    const hint = $('#hotWindowHint');
    const list = $('#hotList');
    const tags = $('#hotSearches');
    const trend = $('#hotTrend');
    try {
      const data = await api('/api/hot');
      const windowMode = data.window === 'off' ? 'off' : (data.window === '30' ? '30' : '7');
      hint.textContent = t('hot.window' + (windowMode === 'off' ? 'Off' : windowMode));

      const items = data.items || [];
      const positive = items.filter((it) => (it.hot_score || 0) > 0);
      const shown = positive.length ? positive : items;
      if (!positive.length) {
        list.innerHTML = `<li class="hot-empty">${escapeHtml(t('hot.empty'))}</li>`;
      } else {
        list.innerHTML = shown
          .map((it, index) => {
            const logo = safeHref(it.logo);
            const rank = index + 1;
            return `<li class="hot-row" data-rank="${rank}">
              <span class="hot-rank${rank <= 3 ? ' hot-rank-top' : ''}">${rank}</span>
              ${logo
                ? `<img class="hot-logo" src="${escapeHtml(logo)}" alt="">`
                : '<span class="hot-logo hot-logo-none">·</span>'}
              <span class="hot-name">${escapeHtml(it.name)}</span>
              <span class="hot-score">${(it.hot_score || 0).toFixed(2)}</span>
            </li>`;
          })
          .join('');
      }

      const searches = data.searches || [];
      tags.innerHTML = searches.length
        ? searches
            .map(
              (s) =>
                `<span class="hot-tag"><span class="hot-tag-term">${escapeHtml(s.term)}</span><span class="hot-tag-hits">${s.hits}</span></span>`
            )
            .join('')
        : `<span class="hot-empty">${escapeHtml(t('hot.emptySearch'))}</span>`;

      const days = data.trend || [];
      const maxTotal = Math.max(1, ...days.map((d) => d.total || 0));
      trend.innerHTML = days
        .map((d) => {
          const total = d.total || 0;
          const height = Math.max(4, Math.round((total / maxTotal) * 88));
          const label = d.date.slice(5).replace('-', '/');
          const tip = `${d.date} · ${t('hot.events')} ${total}（链接 ${d.link_clicks} / 图标 ${d.icon_clicks} / 聚焦 ${d.focus_views} / 搜索 ${d.search_hits}）`;
          return `<div class="hot-bar-col" title="${escapeHtml(tip)}">
            <span class="hot-bar-value">${total || ''}</span>
            <span class="hot-bar" style="height:${height}px"${total ? '' : ' data-empty="1"'}></span>
            <span class="hot-bar-label">${label}</span>
          </div>`;
        })
        .join('');
    } catch (err) {
      $('#hotError').textContent = err.message;
    }
  }

  async function saveAccount() {
    const current = $('#accCurrent').value;
    const username = $('#accUsername').value.trim();
    const newPassword = $('#accNewPass').value;
    $('#accountError').textContent = '';
    if (!current) {
      $('#accountError').textContent = t('settings.currentPwd');
      return;
    }
    const btn = $('#saveAccount');
    btn.disabled = true;
    try {
      const data = await api('/api/auth/account', {
        method: 'PUT',
        body: JSON.stringify({ current_password: current, username, new_password: newPassword }),
      });
      state.user = data.username;
      $('#accUsername').value = data.username;
      $('#accCurrent').value = '';
      $('#accNewPass').value = '';
      toast(t('toast.accountSaved'));
    } catch (err) {
      $('#accountError').textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  }

  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // 忽略退出接口错误
    }
    state.user = '';
    renderAuthUI();
    renderCategories();
    renderCards();
    els.settingsModal.hidden = true;
    toast(t('toast.logout'));
  }

  // 记住密码（仅存本机浏览器）
  function encodeStr(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function decodeStr(str) {
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch (err) {
      return '';
    }
  }
  function saveRemembered(username, password) {
    localStorage.setItem('hub.remember', JSON.stringify({ u: encodeStr(username), p: encodeStr(password) }));
  }
  function loadRemembered() {
    try {
      const raw = localStorage.getItem('hub.remember');
      if (!raw) return null;
      const data = JSON.parse(raw);
      const username = decodeStr(data.u || '');
      const password = decodeStr(data.p || '');
      return username ? { username, password } : null;
    } catch (err) {
      return null;
    }
  }
  function clearRemembered() {
    localStorage.removeItem('hub.remember');
  }

  // ---------------- 分类 ----------------
  function renderCategories() {
    const total = state.categoryTotal;
    els.allCount.textContent = t('count.total', { n: total });

    let html = `
      <div class="cat-item ${state.activeCategory === 'all' ? 'active' : ''}" data-id="all">
        <span class="cat-name">${t('sidebar.all')}</span>
        <span class="cat-del ghost" aria-hidden="true"></span>
        <span class="cat-count">${total}</span>
      </div>`;

    for (const cat of state.categories) {
      const active = String(state.activeCategory) === String(cat.id);
      const actions = state.user
        ? `<button class="cat-rename" data-rename="${cat.id}" title="${escapeHtml(t('cat.renameTitle'))}">✎</button>
           <button class="cat-del" data-del="${cat.id}" title="${escapeHtml(t('categoryDeleteTitle'))}">×</button>`
        : '<span class="cat-del ghost"></span>';
      html += `
        <div class="cat-item ${active ? 'active' : ''}" data-id="${cat.id}" data-name="${escapeHtml(cat.name)}" draggable="${state.user ? 'true' : 'false'}">
          <span class="cat-name" title="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</span>
          ${actions}
          <span class="cat-count">${cat.count || 0}</span>
        </div>`;
    }

    html += `
      <div class="cat-item ${state.activeCategory === 'uncategorized' ? 'active' : ''}" data-id="uncategorized">
        <span class="cat-name">${t('sidebar.uncategorized')}</span>
        <span class="cat-del ghost" aria-hidden="true"></span>
        <span class="cat-count">${state.uncategorizedCount}</span>
      </div>`;

    els.categoryList.innerHTML = html;
    refreshFormCategories();
  }

  async function loadCategories() {
    const data = await api('/api/categories');
    state.categories = data.items || [];
    state.categoryTotal = data.total || 0;
    state.uncategorizedCount = data.uncategorized || 0;
    renderCategories();
  }

  async function addCategory(name) {
    const item = await api('/api/categories', { method: 'POST', body: JSON.stringify({ name }) });
    await loadCategories();
    toast(t('toast.categoryAdded', { name: item.name }));
  }

  function removeCategory(id, name, count) {
    askConfirm({
      title: t('categoryDeleteTitle'),
      text: count > 0
        ? t('categoryDeleteTextOne', { name, n: count })
        : t('categoryDeleteText', { name }),
      okText: t('confirm.ok'),
      onOk: async () => {
        await api(`/api/categories/${id}`, { method: 'DELETE' });
        if (String(state.activeCategory) === String(id)) {
          state.activeCategory = 'all';
          state.page = 1;
        }
        await loadCategories();
        await loadSoftware();
        toast(t('toast.categoryDeleted'));
      },
    });
  }

  function renameCategoryAction(cat) {
    askConfirm({
      title: t('cat.renameTitle'),
      text: t('cat.renameHint', { name: cat.name }),
      okText: t('cat.renameSave'),
      tone: 'primary',
      input: { value: cat.name, placeholder: t('cat.renamePlaceholder'), maxlength: 20 },
      onOk: async (value) => {
        const name = (value || '').trim();
        if (!name) throw new Error(t('cat.renameEmpty'));
        if (name === cat.name) return;
        await api(`/api/categories/${cat.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name }),
        });
        await loadCategories();
        await loadSoftware();
        toast(t('toast.categoryRenamed', { name }));
      },
    });
  }

  // ---------------- 软件卡片 ----------------
  function logoHtml(item) {
    const logo = safeHref(item.logo);
    const letter = escapeHtml((item.name || '?').slice(0, 1));
    if (logo) {
      return `<img src="${escapeHtml(logo)}" alt="${escapeHtml(item.name)}" loading="lazy"
        onerror="this.style.display='none';this.parentNode.querySelector('.logo-fallback').style.display='grid';">
        <div class="logo-fallback" style="display:none;">${letter}</div>`;
    }
    return `<div class="logo-fallback">${letter}</div>`;
  }

  function linkRow(labelKey, url, textKey, customLabel, customText, hitField) {
    const href = safeHref(url);
    if (!href) return '';
    const label = (customLabel || '').trim();
    const text = (customText || '').trim() || (textKey ? t(textKey) : href);
    return `
      <div class="card-line">
        <span class="label">${label ? `${escapeHtml(label)}：` : escapeHtml(t(labelKey))}</span>
        <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"${hitField ? ` data-hit="${escapeHtml(hitField)}"` : ''}>${escapeHtml(text)}</a>
      </div>`;
  }

  function platformsLine(platforms) {
    const map = platforms || {};
    const checked = PLATFORMS.filter((p) => map[p.key]);
    if (!checked.length) return '';
    const parts = checked.map((p) => `<span>${p.label}</span>`);
    return `
      <div class="card-line">
        <span class="label">${escapeHtml(t('card.support'))}</span>
        ${parts.join('<span class="card-sep">|</span>')}
      </div>`;
  }

  function licenseLine(licenses) {
    const list = (licenses || []).filter((k) => LICENSES.includes(k));
    if (!list.length) return '';
    const parts = list.map((k) => `<span>${escapeHtml(t('license.' + k))}</span>`);
    return `
      <div class="card-line">
        <span class="label">${escapeHtml(t('card.license'))}</span>
        ${parts.join('<span class="card-sep">|</span>')}
      </div>`;
  }

  function downloadsLine(downloads) {
    const list = (downloads || []).filter((d) => d && d.text && safeHref(d.link));
    // 没有任何有效条目时整行不渲染
    if (!list.length) return '';
    const body = list
      .map((d) => `<a href="${escapeHtml(safeHref(d.link))}" target="_blank" rel="noopener noreferrer" data-hit="downloads">${escapeHtml(d.text)}</a>`)
      .join('<span class="card-sep">|</span>');
    return `
      <div class="card-line card-downloads">
        <span class="label">${escapeHtml(t('card.download'))}</span>
        ${body}
      </div>`;
  }

  // 自定义链接：每条一行「名称 ：链接」，紧跟在「文档链接」下方
  function extraLinksHtml(links) {
    return (links || [])
      .filter((l) => l && l.text && safeHref(l.link))
      .map((l) => `
      <div class="card-line">
        <span class="label">${escapeHtml(l.text)}：</span>
        <a href="${escapeHtml(safeHref(l.link))}" target="_blank" rel="noopener noreferrer" data-hit="extra_links">${escapeHtml((l.label || '').trim() || l.link)}</a>
      </div>`)
      .join('');
  }

  function contrastText(color) {
    const hex = String(color || '').replace('#', '');
    let r; let g; let b;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return '';
    }
    if ([r, g, b].some((v) => Number.isNaN(v))) return '';
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.55 ? '#ffffff' : '#1f2329';
  }

  function cardActionsHtml(item, compact) {
    if (!state.user) return '';
    const ico = (emoji) => `<span class="btn-ico">${emoji}</span>`;
    const txt = (text) => (compact ? '' : `<span class="btn-txt">${escapeHtml(text)}</span>`);
    const pinLabel = item.pinned ? t('card.unpin') : t('card.pin');
    return `<div class="card-actions">
        <button class="mini-btn pin ${item.pinned ? 'active' : ''}" data-pin="${item.id}" title="${escapeHtml(pinLabel)}">${ico('📌')}${txt(pinLabel)}</button>
        <button class="mini-btn" data-edit="${item.id}" title="${escapeHtml(t('card.edit'))}">${ico('✏️')}${txt(t('card.edit'))}</button>
        <button class="mini-btn danger" data-remove="${item.id}" title="${escapeHtml(t('card.remove'))}">${ico('❌')}${txt(t('card.remove'))}</button>
      </div>`;
  }

  function cardHtml(item) {
    const color = /^#[0-9a-fA-F]{3,8}$/.test(item.card_color || '') ? item.card_color : '';
    const style = color ? ` style="background-color:${color};color:${contrastText(color)};"` : '';
    const classes = ['card'];
    if (color) classes.push('card-custom');
    if (item.pinned) classes.push('is-pinned');
    if (state.selectMode && state.selected.has(String(item.id))) classes.push('selected');
    const check = state.selectMode
      ? `<span class="card-check"><input type="checkbox" data-sel="${item.id}" ${state.selected.has(String(item.id)) ? 'checked' : ''} aria-label="select"></span>`
      : '';
    const hitKw = searchHighlightKeyword();
    const nameHtml = hitKw ? highlightNameHtml(item.name, hitKw) : escapeHtml(item.name);
    if (state.cols === 'icon' && !state.focused) {
      classes.push('card-compact');
      return `
      <article class="${classes.join(' ')}" data-id="${item.id}"${style}>
        ${check}
        ${cardActionsHtml(item, true)}
        ${item.pinned ? `<span class="pin-flag" title="${escapeHtml(t('card.badgePin'))}">📌</span>` : ''}
        <div class="card-logo">${logoHtml(item)}</div>
        <h3 class="card-title" title="${escapeHtml(t('card.copyTitleHint'))}">${nameHtml}</h3>
      </article>`;
    }
    const descHtml = item.description
      ? `<div class="card-desc">${hitKw ? highlightHtml(renderMarkdown(item.description), hitKw) : renderMarkdown(item.description)}</div>`
      : '';
    return `
      <article class="${classes.join(' ')}" data-id="${item.id}"${style}>
        ${check}
        ${cardActionsHtml(item, false)}
        ${item.pinned ? `<span class="pin-flag" title="${escapeHtml(t('card.badgePin'))}">📌</span>` : ''}
        <div class="card-logo">${logoHtml(item)}</div>
        <div class="card-main">
          <div>
            <div class="card-title-row">
              <h3 class="card-title" title="${escapeHtml(t('card.copyTitleHint'))}">${nameHtml}</h3>
              ${(item.category_names || []).length && state.activeCategory === 'all'
                ? `<span class="card-cats">${(item.category_names || []).map((n) => `<span class="cat-tag">${escapeHtml(n)}</span>`).join('')}</span>`
                : ''}
            </div>
            ${descHtml}
          </div>
          <div class="card-links">
            ${linkRow('card.website', item.url_home, null, item.url_home_label, item.url_home_text, 'url_home')}
            ${linkRow('card.github', item.url_github, null, item.url_github_label, item.url_github_text, 'url_github')}
            ${linkRow('card.release', item.url_release, null, item.url_release_label, item.url_release_text, 'url_release')}
            ${linkRow('card.docs', item.url_doc, null, item.url_doc_label, item.url_doc_text, 'url_doc')}
            ${extraLinksHtml(item.extra_links)}
          </div>
          ${platformsLine(item.platforms)}
          ${licenseLine(item.licenses)}
          ${downloadsLine(item.downloads)}
        </div>
      </article>`;
  }

  function renderCards() {
    if (!state.items.length) {
      const searching = !!state.q;
      els.cardGrid.innerHTML = `
        <div class="empty-state">
          <div class="big">${escapeHtml(searching ? t('empty.searchTitle') : t('empty.title'))}</div>
          <div>${escapeHtml(searching ? t('empty.search') : (state.activeCategory === 'all' ? t('empty.all') : t('empty.category')))}</div>
          ${state.user ? `<button class="btn btn-primary" id="emptyAdd">${escapeHtml(t('empty.add'))}</button>` : ''}
        </div>`;
      const emptyAdd = $('#emptyAdd');
      if (emptyAdd) emptyAdd.addEventListener('click', () => openModal());
      return;
    }
    els.cardGrid.innerHTML = state.items.map(cardHtml).join('');
  }

  // ---------------- 多选批量操作 ----------------
  function updateBulkUI() {
    const loggedIn = !!state.user;
    els.btnSelectMode.hidden = !loggedIn;
    if (!loggedIn && state.selectMode) {
      state.selectMode = false;
      state.selected.clear();
    }
    if (!state.selectMode) {
      els.bulkTools.hidden = true;
      els.btnSelectMode.textContent = t('bulk.enter');
      els.btnSelectMode.classList.remove('active');
      return;
    }
    const keep = els.bulkMoveSelect.value;
    const options = state.categories
      .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
      .join('');
    els.bulkMoveSelect.innerHTML = `<option value="">${escapeHtml(t('bulk.chooseCategory'))}</option>${options}`;
    if (keep) els.bulkMoveSelect.value = keep;
    els.btnSelectMode.textContent = t('bulk.exit');
    els.btnSelectMode.classList.add('active');
    els.bulkTools.hidden = false;
    const n = state.selected.size;
    els.bulkDelete.disabled = n === 0;
    els.bulkMoveSelect.disabled = n === 0 || !state.categories.length;
  }

  function enterSelectMode(on) {
    state.selectMode = !!on;
    if (!on) state.selected.clear();
    updateBulkUI();
    renderCards();
  }

  function toggleSelect(id) {
    const key = String(id);
    if (state.selected.has(key)) state.selected.delete(key);
    else state.selected.add(key);
    const card = els.cardGrid.querySelector(`.card[data-id="${key}"]`);
    if (card) {
      card.classList.toggle('selected', state.selected.has(key));
      const box = card.querySelector('[data-sel]');
      if (box) box.checked = state.selected.has(key);
    }
    updateBulkUI();
  }

  function selectedIds() {
    return Array.from(state.selected);
  }

  function bulkFromCategory() {
    return (state.activeCategory === 'all' || state.activeCategory === 'uncategorized')
      ? ''
      : String(state.activeCategory);
  }

  async function bulkMove() {
    const ids = selectedIds();
    if (!ids.length) {
      toast(t('bulk.noSelection'), true);
      return;
    }
    const to = els.bulkMoveSelect.value;
    if (!to) {
      toast(t('bulk.noTarget'), true);
      return;
    }
    const cat = state.categories.find((c) => String(c.id) === String(to));
    const catName = cat ? cat.name : '';

    async function moveCards() {
      await api('/api/software/bulk_move', {
        method: 'POST',
        body: JSON.stringify({
          ids: ids.map(Number),
          to_category_id: Number(to),
          from_category_id: bulkFromCategory() || null,
        }),
      });
      state.selected.clear();
      els.bulkMoveSelect.value = '';
      await refreshAll();
      toast(t('bulk.moveDone', { n: ids.length, cat: catName }));
    }

    async function copyCards() {
      const res = await api('/api/software/bulk_copy', {
        method: 'POST',
        body: JSON.stringify({
          ids: ids.map(Number),
          to_category_id: Number(to),
        }),
      });
      state.selected.clear();
      els.bulkMoveSelect.value = '';
      await refreshAll();
      if (res && res.copied) {
        toast(t('bulk.copyDone', { n: res.copied, cat: catName }));
      } else {
        toast(t('bulk.copyNone', { cat: catName }), true);
      }
    }

    askConfirm({
      title: t('bulk.moveTitle'),
      text: t('bulk.moveText', { n: ids.length, cat: catName }),
      okText: t('content.moveCard'),
      altText: t('content.copyCard'),
      tone: 'primary',
      onOk: moveCards,
      onAlt: copyCards,
    });
  }

  async function bulkRemove() {
    const ids = selectedIds();
    if (!ids.length) {
      toast(t('bulk.noSelection'), true);
      return;
    }
    const cat = currentViewCategory();
    askConfirm({
      title: t('bulk.deleteTitle'),
      text: cat
        ? t('bulk.deleteText', { n: ids.length, cat: cat.name })
        : t('bulk.deleteTextAll', { n: ids.length }),
      okText: t('confirm.ok'),
      onOk: async () => {
        await api('/api/software/bulk_delete', {
          method: 'POST',
          body: JSON.stringify({ ids: ids.map(Number), category_id: cat ? cat.id : null }),
        });
        state.selected.clear();
        await refreshAll();
        toast(cat
          ? t('bulk.deleteDoneCat', { n: ids.length, cat: cat.name })
          : t('bulk.deleteDone', { n: ids.length }));
      },
    });
  }

  // ---------------- 通用确认弹窗 ----------------
  let confirmHandler = null;
  let confirmAltHandler = null;

  function askConfirm(options) {
    const opts = options || {};
    confirmHandler = opts.onOk || null;
    confirmAltHandler = opts.onAlt || null;
    els.confirmTitle.textContent = opts.title || t('confirm.ok');
    els.confirmText.textContent = opts.text || '';
    els.confirmOk.textContent = opts.okText || t('confirm.ok');
    els.confirmOk.classList.toggle('btn-danger', opts.tone !== 'primary');
    els.confirmOk.classList.toggle('btn-primary', opts.tone === 'primary');
    els.confirmOk.disabled = false;

    if (opts.altText) {
      els.confirmAlt.textContent = opts.altText;
      els.confirmAlt.hidden = false;
      els.confirmAlt.disabled = false;
    } else {
      els.confirmAlt.hidden = true;
    }

    if (opts.input) {
      els.confirmInputWrap.hidden = false;
      els.confirmInput.value = opts.input.value || '';
      els.confirmInput.placeholder = opts.input.placeholder || '';
      els.confirmInput.maxLength = opts.input.maxlength || 20;
    } else {
      els.confirmInputWrap.hidden = true;
      els.confirmInput.value = '';
    }

    els.confirmModal.hidden = false;
    if (opts.input) {
      setTimeout(() => {
        els.confirmInput.focus();
        els.confirmInput.select();
      }, 0);
    }
  }

  function closeConfirm() {
    els.confirmModal.hidden = true;
    confirmHandler = null;
    confirmAltHandler = null;
    els.confirmInput.value = '';
  }

  async function runConfirm(which) {
    const isAlt = which === 'alt';
    const fn = isAlt ? confirmAltHandler : confirmHandler;
    const btn = isAlt ? els.confirmAlt : els.confirmOk;
    if (!fn) {
      closeConfirm();
      return;
    }
    const hasInput = !els.confirmInputWrap.hidden;
    const value = hasInput ? els.confirmInput.value.trim() : '';
    btn.disabled = true;
    try {
      const keepOpen = await fn(value);
      btn.disabled = false;
      if (keepOpen !== false) closeConfirm();
    } catch (err) {
      btn.disabled = false;
      toast(err.message, true);
    }
  }

  function renderPager() {
    const pages = state.pages;
    els.pager.style.display = pages <= 1 ? 'none' : 'flex';
    if (pages <= 1) return;

    els.prevPage.disabled = state.page <= 1;
    els.nextPage.disabled = state.page >= pages;
    els.jumpInput.max = String(pages);
    els.jumpInput.value = String(state.page);

    const numbers = [];
    if (pages <= 7) {
      for (let i = 1; i <= pages; i++) numbers.push(i);
    } else if (state.page <= 4) {
      for (let i = 1; i <= 5; i++) numbers.push(i);
      numbers.push('...', pages);
    } else if (state.page >= pages - 3) {
      numbers.push(1, '...');
      for (let i = pages - 4; i <= pages; i++) numbers.push(i);
    } else {
      numbers.push(1, '...', state.page - 1, state.page, state.page + 1, '...', pages);
    }

    els.pageNumbers.innerHTML = numbers
      .map((n) => (n === '...'
        ? '<span class="page-num ellipsis">…</span>'
        : `<button class="page-num ${n === state.page ? 'active' : ''}" data-page="${n}">${n}</button>`))
      .join('');
  }

  async function loadSoftware() {
    const params = new URLSearchParams({
      page: String(state.page),
      page_size: String(state.pageSize),
      category_id: state.q ? 'all' : String(state.activeCategory),
      sort: state.sort,
    });
    if (state.q) params.set('q', state.q);
    if (state.platform) params.set('platform', state.platform);
    if (state.license) params.set('license', state.license);
    const data = await api(`/api/software?${params.toString()}`);
    state.items = data.items || [];
    state.total = data.total || 0;
    state.pages = data.pages || 1;
    if (data.page && data.page !== state.page) state.page = data.page;
    Array.from(state.selected).forEach((id) => {
      if (!state.items.some((i) => String(i.id) === id)) state.selected.delete(id);
    });

    const cat = state.categories.find((c) => String(c.id) === String(state.activeCategory));
    let title;
    if (state.q) title = t('search.heading');
    else if (state.activeCategory === 'all') title = t('sidebar.all');
    else if (state.activeCategory === 'uncategorized') title = t('sidebar.uncategorized');
    else title = cat ? cat.name : t('sidebar.all');
    els.currentCategory.textContent = title;
    els.countInfo.textContent = state.q
      ? `${state.q} · ${t('count.total', { n: state.total })}`
      : t('count.total', { n: state.total });

    renderCards();
    renderPager();
    updateBulkUI();
  }

  async function refreshAll() {
    await loadCategories();
    await loadSoftware();
  }

  // ---------------- 弹窗表单 ----------------
  function refreshFormCategories() {
    if (!state.categories.length) {
      els.formCategories.innerHTML = `<span class="hint-text">${escapeHtml(t('form.noCategories'))}</span>`;
      return;
    }
    els.formCategories.innerHTML = state.categories
      .map((c) => `<label class="cat-chip"><input type="checkbox" name="cats" value="${c.id}"><span>${escapeHtml(c.name)}</span></label>`)
      .join('');
  }

  function selectedCategoryIds() {
    return Array.from(els.formCategories.querySelectorAll('input[name="cats"]:checked'))
      .map((cb) => Number(cb.value))
      .filter((id) => id > 0);
  }

  function updateLogoPreview() {
    const url = safeHref(state.modalLogo);
    els.logoPreview.innerHTML = url
      ? `<img src="${escapeHtml(url)}" alt="logo" onerror="this.parentNode.innerHTML='<span>×</span>';">`
      : '<span>无</span>';
  }

  function updateSiteIconPreview() {
    const url = safeHref(state.siteIconDraft);
    $('#siteIconPreview').innerHTML = url
      ? `<img src="${escapeHtml(url)}" alt="icon" onerror="this.parentNode.innerHTML='<span>×</span>';">`
      : '<span>无</span>';
  }

  function renderDownloadRows() {
    if (!state.modalDownloads.length) {
      els.downloadRows.innerHTML = `<div class="hint-text">${escapeHtml(t('form.downloadEmpty'))}</div>`;
      return;
    }
    els.downloadRows.innerHTML = state.modalDownloads
      .map((row, i) => `
        <div class="download-row" data-index="${i}">
          <button type="button" class="drag-handle" data-drag="${i}" title="${escapeHtml(t('form.dragHint'))}" aria-label="${escapeHtml(t('form.dragHint'))}">
            <svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true" focusable="false">
              <circle cx="2.5" cy="3" r="1.3"></circle><circle cx="7.5" cy="3" r="1.3"></circle>
              <circle cx="2.5" cy="8" r="1.3"></circle><circle cx="7.5" cy="8" r="1.3"></circle>
              <circle cx="2.5" cy="13" r="1.3"></circle><circle cx="7.5" cy="13" r="1.3"></circle>
            </svg>
          </button>
          <input type="text" class="dl-text" value="${escapeHtml(row.text)}" placeholder="${escapeHtml(t('form.dlText'))}">
          <input type="text" class="dl-link" value="${escapeHtml(row.link)}" placeholder="${escapeHtml(t('form.dlLink'))}">
          <button type="button" class="btn btn-small btn-ghost rm" data-rm="${i}">${escapeHtml(t('form.rm'))}</button>
        </div>`)
      .join('');
  }

  function syncDownloadOrder() {
    const rows = Array.from(els.downloadRows.querySelectorAll('.download-row'));
    state.modalDownloads = rows.map((row) => ({
      text: row.querySelector('.dl-text').value.trim(),
      link: row.querySelector('.dl-link').value.trim(),
    }));
    rows.forEach((row, i) => {
      row.dataset.index = String(i);
      const handle = row.querySelector('.drag-handle');
      if (handle) handle.dataset.drag = String(i);
      const rm = row.querySelector('[data-rm]');
      if (rm) rm.dataset.rm = String(i);
    });
  }

  function collectDownloads() {
    return Array.from(els.downloadRows.querySelectorAll('.download-row')).map((row) => ({
      text: row.querySelector('.dl-text').value.trim(),
      link: row.querySelector('.dl-link').value.trim(),
    }));
  }

  function renderExtraRows() {
    if (!state.modalExtraLinks.length) {
      els.extraLinkRows.innerHTML = `<div class="hint-text">${escapeHtml(t('form.extraEmpty'))}</div>`;
      return;
    }
    els.extraLinkRows.innerHTML = state.modalExtraLinks
      .map((row, i) => `
        <div class="extra-row" data-index="${i}">
          <button type="button" class="drag-handle" data-drag="${i}" title="${escapeHtml(t('form.dragHint'))}" aria-label="${escapeHtml(t('form.dragHint'))}">
            <svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true" focusable="false">
              <circle cx="2.5" cy="3" r="1.3"></circle><circle cx="7.5" cy="3" r="1.3"></circle>
              <circle cx="2.5" cy="8" r="1.3"></circle><circle cx="7.5" cy="8" r="1.3"></circle>
              <circle cx="2.5" cy="13" r="1.3"></circle><circle cx="7.5" cy="13" r="1.3"></circle>
            </svg>
          </button>
          <input type="text" class="ex-text" value="${escapeHtml(row.text || '')}" placeholder="${escapeHtml(t('form.exText'))}">
          <input type="text" class="ex-link" value="${escapeHtml(row.link || '')}" placeholder="${escapeHtml(t('form.exLink'))}">
          <input type="text" class="ex-label" value="${escapeHtml(row.label || '')}" placeholder="${escapeHtml(t('form.exLabel'))}">
          <button type="button" class="btn btn-small btn-ghost rm" data-erm="${i}">${escapeHtml(t('form.rm'))}</button>
        </div>`)
      .join('');
  }

  function syncExtraOrder() {
    const rows = Array.from(els.extraLinkRows.querySelectorAll('.extra-row'));
    state.modalExtraLinks = rows.map((row) => ({
      text: row.querySelector('.ex-text').value.trim(),
      link: row.querySelector('.ex-link').value.trim(),
      label: row.querySelector('.ex-label').value.trim(),
    }));
    rows.forEach((row, i) => {
      row.dataset.index = String(i);
      const handle = row.querySelector('.drag-handle');
      if (handle) handle.dataset.drag = String(i);
      const rm = row.querySelector('[data-erm]');
      if (rm) rm.dataset.erm = String(i);
    });
    return state.modalExtraLinks;
  }

  function collectExtraLinks() {
    return Array.from(els.extraLinkRows.querySelectorAll('.extra-row')).map((row) => ({
      text: row.querySelector('.ex-text').value.trim(),
      link: row.querySelector('.ex-link').value.trim(),
      label: row.querySelector('.ex-label').value.trim(),
    })).filter((row) => row.text && row.link);
  }

  function openModal(item = null) {
    if (!state.user) {
      openLogin();
      toast(t('toast.needLogin'));
      return;
    }
    state.editingId = item ? item.id : null;
    state.modalLogo = item ? item.logo || '' : '';
    state.modalDownloads = item ? (item.downloads || []).map((d) => ({ ...d })) : [];
    state.modalExtraLinks = item ? (item.extra_links || []).map((d) => ({ ...d })) : [];
    state.modalCardColor = item ? item.card_color || '' : '';
    els.cardColorText.value = state.modalCardColor;
    syncColorPicker(state.modalCardColor);

    els.modalTitle.textContent = t(item ? 'modal.editTitle' : 'modal.addTitle');
    els.formError.textContent = '';
    els.form.reset();
    els.form.querySelector('[name="name"]').value = item ? item.name : '';
    els.form.querySelector('[name="description"]').value = item ? item.description || '' : '';
    ['url_home', 'url_github', 'url_release', 'url_doc'].forEach((key) => {
      els.form.querySelector(`[name="${key}"]`).value = (item && item[key]) || '';
      els.form.querySelector(`[name="${key}_label"]`).value = (item && item[`${key}_label`]) || '';
      els.form.querySelector(`[name="${key}_text"]`).value = (item && item[`${key}_text`]) || '';
    });
    els.logoUrl.value = state.modalLogo;

    refreshFormCategories();
    const preset = item
      ? (item.category_ids || []).map(String)
      : (state.activeCategory === 'all' || state.activeCategory === 'uncategorized' ? [] : [String(state.activeCategory)]);
    els.formCategories.querySelectorAll('input[name="cats"]').forEach((cb) => {
      cb.checked = preset.includes(cb.value);
    });

    const platforms = (item && item.platforms) || {};
    els.form.querySelectorAll('input[name="platform"]').forEach((cb) => {
      cb.checked = !!platforms[cb.value];
    });

    const licenses = (item && item.licenses) || [];
    els.form.querySelectorAll('input[name="license"]').forEach((cb) => {
      cb.checked = licenses.includes(cb.value);
    });

    renderDownloadRows();
    renderExtraRows();
    updateLogoPreview();
    els.modal.hidden = false;
  }

  function closeModal() {
    els.modal.hidden = true;
    state.editingId = null;
  }

  // 点遮罩空白处关闭弹窗：必须按下和抬起都在遮罩本身上，
  // 否则在输入框里按住拖选文字、拖到对话框外松手会被误判成点击而关掉弹窗。
  function bindMaskClose(mask, close) {
    if (!mask) return;
    let armed = false;
    mask.addEventListener('mousedown', (event) => {
      armed = event.target === mask;
    });
    mask.addEventListener('mouseup', (event) => {
      if (armed && event.target === mask) close();
      armed = false;
    });
  }

  async function submitSoftware(event) {
    event.preventDefault();
    els.formError.textContent = '';
    const name = els.form.querySelector('[name="name"]').value.trim();
    if (!name) {
      els.formError.textContent = t('form.errorName');
      return;
    }
    const body = {
      name,
      category_ids: selectedCategoryIds(),
      description: els.form.querySelector('[name="description"]').value.trim(),
      logo: els.logoUrl.value.trim(),
      url_home: els.form.querySelector('[name="url_home"]').value.trim(),
      url_github: els.form.querySelector('[name="url_github"]').value.trim(),
      url_release: els.form.querySelector('[name="url_release"]').value.trim(),
      url_doc: els.form.querySelector('[name="url_doc"]').value.trim(),
      url_home_label: els.form.querySelector('[name="url_home_label"]').value.trim(),
      url_home_text: els.form.querySelector('[name="url_home_text"]').value.trim(),
      url_github_label: els.form.querySelector('[name="url_github_label"]').value.trim(),
      url_github_text: els.form.querySelector('[name="url_github_text"]').value.trim(),
      url_release_label: els.form.querySelector('[name="url_release_label"]').value.trim(),
      url_release_text: els.form.querySelector('[name="url_release_text"]').value.trim(),
      url_doc_label: els.form.querySelector('[name="url_doc_label"]').value.trim(),
      url_doc_text: els.form.querySelector('[name="url_doc_text"]').value.trim(),
      downloads: collectDownloads(),
      extra_links: collectExtraLinks(),
      platforms: {},
      licenses: [],
      card_color: (els.cardColorText.value || '').trim(),
    };
    els.form.querySelectorAll('input[name="platform"]').forEach((cb) => {
      body.platforms[cb.value] = cb.checked;
    });
    els.form.querySelectorAll('input[name="license"]:checked').forEach((cb) => {
      body.licenses.push(cb.value);
    });

    const btn = $('#saveSoftware');
    btn.disabled = true;
    btn.textContent = t('form.saving');
    try {
      if (state.editingId) {
        await api(`/api/software/${state.editingId}`, { method: 'PUT', body: JSON.stringify(body) });
        toast(t('toast.saved'));
      } else {
        await api('/api/software', { method: 'POST', body: JSON.stringify(body) });
        state.page = 1;
        toast(t('toast.added'));
      }
      closeModal();
      await refreshAll();
    } catch (err) {
      els.formError.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = t('form.save');
    }
  }

  let deletingItem = null;

  function currentViewCategory() {
    if (state.activeCategory === 'all' || state.activeCategory === 'uncategorized') return null;
    return state.categories.find((c) => String(c.id) === String(state.activeCategory)) || null;
  }

  function openDeleteDialog(item) {
    if (!item) return;
    deletingItem = item;
    const names = item.category_names || [];
    const viewCat = currentViewCategory();
    const inView = viewCat
      ? (item.category_ids || []).map(String).includes(String(viewCat.id))
      : false;

    els.deleteOne.hidden = !viewCat;
    els.deleteOne.disabled = !inView;
    if (viewCat) els.deleteOne.textContent = t('delete.onlyThis', { cat: viewCat.name });

    if (names.length > 1) {
      els.deleteHint.textContent = t('delete.hint', {
        name: item.name, n: names.length, cats: names.join('、'),
      });
    } else if (names.length === 1) {
      els.deleteHint.textContent = t('delete.hintOne', { name: item.name, cat: names[0] });
    } else {
      els.deleteHint.textContent = t('delete.hintNoCat', { name: item.name });
    }
    els.deleteModal.hidden = false;
  }

  function closeDeleteDialog() {
    els.deleteModal.hidden = true;
    deletingItem = null;
  }

  async function confirmDelete(scope) {
    if (!deletingItem) return;
    const item = deletingItem;
    const viewCat = currentViewCategory();
    let url = `/api/software/${item.id}`;
    if (scope === 'category' && viewCat) url += `?category_id=${viewCat.id}`;
    try {
      await api(url, { method: 'DELETE' });
      closeDeleteDialog();
      await refreshAll();
      if (scope === 'category' && viewCat) {
        toast(t('toast.removedFrom', { cat: viewCat.name }));
      } else {
        toast(t('toast.deleted'));
      }
    } catch (err) {
      toast(err.message, true);
    }
  }

  async function uploadImage(file, onDone) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast(t('toast.iconBig'), true);
      return;
    }
    try {
      toast(t('toast.uploading'));
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.error) || '上传失败');
      onDone(data.url);
      toast(t('toast.uploaded'));
    } catch (err) {
      toast(err.message, true);
    }
  }

  // ---------------- 事件绑定 ----------------
  applyCols();
  els.pageSizeSelect.value = String(state.pageSize);
  els.sortSelect.value = state.sort;
  if (els.platformFilter) els.platformFilter.value = state.platform;
  if (els.licenseFilter) els.licenseFilter.value = state.license;

  els.platformFilter.addEventListener('change', async () => {
    state.platform = els.platformFilter.value;
    state.page = 1;
    await loadSoftware();
  });

  els.licenseFilter.addEventListener('change', async () => {
    state.license = els.licenseFilter.value;
    state.page = 1;
    await loadSoftware();
  });

  function applyCols() {
    els.cardGrid.dataset.cols = state.focused ? '1' : String(state.cols);
    els.colsSelect.value = state.focused ? '1' : String(state.cols);
  }

  els.btnSelectMode.addEventListener('click', () => {
    if (!state.user) {
      openLogin();
      toast(t('toast.needLogin'));
      return;
    }
    enterSelectMode(!state.selectMode);
  });

  els.bulkMoveSelect.addEventListener('change', () => {
    if (!els.bulkMoveSelect.value) return;
    bulkMove();
  });

  els.bulkDelete.addEventListener('click', () => {
    bulkRemove();
  });

  $('#confirmOk').addEventListener('click', () => runConfirm('ok'));
  $('#confirmAlt').addEventListener('click', () => runConfirm('alt'));
  $('#confirmCancel').addEventListener('click', closeConfirm);
  $('#confirmClose').addEventListener('click', closeConfirm);
  els.confirmInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runConfirm('ok');
    }
  });
  bindMaskClose(els.confirmModal, closeConfirm);

  els.colsSelect.addEventListener('change', async () => {
    state.cols = normalizeCols(els.colsSelect.value);
    state.focused = null;
    localStorage.setItem('hub.cols', String(state.cols));
    applyCols();
    renderCards();
  });

  els.pageSizeSelect.addEventListener('change', async () => {
    state.pageSize = normalizePageSize(els.pageSizeSelect.value);
    localStorage.setItem('hub.pageSize', String(state.pageSize));
    state.page = 1;
    await loadSoftware();
  });

  els.sortSelect.addEventListener('change', async () => {
    state.sort = els.sortSelect.value;
    localStorage.setItem('hub.sort', state.sort);
    state.page = 1;
    await loadSoftware();
  });

  let searchTimer = null;
  els.searchInput.addEventListener('input', () => {
    const value = els.searchInput.value.trim();
    els.searchClear.hidden = !value;
    if (state.focused && value !== state.focusName) {
      state.focused = null;
      applyCols();
    }
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      state.q = value;
      state.page = 1;
      await loadSoftware();
      // 只记录防抖后的最终关键词，且跳过聚焦视图自动带入的名称
      if (value && value !== state.focusName) trackEvent('search', { keyword: value });
    }, 320);
  });

  els.searchClear.addEventListener('click', async () => {
    els.searchInput.value = '';
    els.searchClear.hidden = true;
    state.q = '';
    state.focused = null;
    state.selectMode = false;
    state.selected.clear();
    applyCols();
    state.page = 1;
    await loadSoftware();
    els.searchInput.focus();
  });

  // 分类拖拽排序
  let dragRow = null;
  els.categoryList.addEventListener('dragstart', (event) => {
    const row = event.target.closest('.cat-item[draggable="true"]');
    if (!row) return;
    dragRow = row;
    row.classList.add('dragging');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      try { event.dataTransfer.setData('text/plain', row.dataset.id); } catch (_) { /* ignore */ }
    }
  });

  els.categoryList.addEventListener('dragover', (event) => {
    if (!dragRow) return;
    event.preventDefault();
    const row = event.target.closest('.cat-item');
    if (!row || row === dragRow) return;
    if (row.dataset.id === 'all' || row.dataset.id === 'uncategorized') return;
    const rect = row.getBoundingClientRect();
    const insertAfter = event.clientY - rect.top > rect.height / 2;
    els.categoryList.insertBefore(dragRow, insertAfter ? row.nextSibling : row);
  });

  els.categoryList.addEventListener('dragend', async () => {
    if (!dragRow) return;
    dragRow.classList.remove('dragging');
    dragRow = null;
    const ids = [...els.categoryList.querySelectorAll('.cat-item[draggable="true"]')]
      .map((row) => Number(row.dataset.id));
    try {
      await api('/api/categories/order', { method: 'POST', body: JSON.stringify({ ids }) });
      const map = new Map(state.categories.map((c) => [String(c.id), c]));
      state.categories = ids.map((id) => map.get(String(id))).filter(Boolean);
      renderCategories();
      toast(t('toast.categoryOrder'));
    } catch (err) {
      toast(err.message, true);
      await loadCategories();
      renderCategories();
    }
  });

  els.categoryList.addEventListener('click', async (event) => {
    const renameBtn = event.target.closest('[data-rename]');
    if (renameBtn) {
      event.stopPropagation();
      const cat = state.categories.find((c) => String(c.id) === String(renameBtn.dataset.rename));
      if (cat) renameCategoryAction(cat);
      return;
    }
    const delBtn = event.target.closest('[data-del]');
    if (delBtn) {
      event.stopPropagation();
      const cat = state.categories.find((c) => String(c.id) === String(delBtn.dataset.del));
      if (!cat) return;
      try {
        await removeCategory(cat.id, cat.name, cat.count || 0);
      } catch (err) {
        toast(err.message, true);
      }
      return;
    }
    const item = event.target.closest('.cat-item');
    if (!item) return;
    const id = item.dataset.id;
    if (state.activeCategory === id && !state.q) return;
    state.activeCategory = id;
    state.page = 1;
    state.focused = null;
    state.selectMode = false;
    state.selected.clear();
    applyCols();
    if (state.q) {
      state.q = '';
      els.searchInput.value = '';
      els.searchClear.hidden = true;
    }
    renderCategories();
    await loadSoftware();
  });

  els.categoryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.user) return;
    const input = $('#newCategoryInput');
    const name = input.value.trim();
    if (!name) return;
    try {
      await addCategory(name);
      input.value = '';
    } catch (err) {
      toast(err.message, true);
    }
  });

  els.cardGrid.addEventListener('click', async (event) => {
    if (state.selectMode && !event.target.closest('.card-actions')) {
      const card = event.target.closest('.card');
      if (card) toggleSelect(card.dataset.id);
      return;
    }
    // 单击软件标题：复制标题文字到系统剪贴板
    const titleEl = event.target.closest('.card-title');
    if (titleEl) {
      const titleCard = event.target.closest('.card');
      const item = titleCard
        ? state.items.find((i) => String(i.id) === String(titleCard.dataset.id))
        : null;
      if (item) {
        const ok = await copyToClipboard(item.name);
        toast(
          ok ? t('toast.titleCopied', { name: item.name }) : t('toast.copyFailed'),
          !ok
        );
      }
      return;
    }
    const pinBtn = event.target.closest('[data-pin]');
    if (pinBtn) {
      const item = state.items.find((i) => String(i.id) === String(pinBtn.dataset.pin));
      if (!item) return;
      const next = !item.pinned;
      pinBtn.disabled = true;
      try {
        await api(`/api/software/${item.id}/pin`, {
          method: 'POST',
          body: JSON.stringify({ pinned: next }),
        });
        state.page = 1;
        await loadSoftware();
        toast(t(next ? 'toast.pinned' : 'toast.unpinned', { name: item.name }));
      } catch (err) {
        pinBtn.disabled = false;
        toast(err.message, true);
      }
      return;
    }
    const editBtn = event.target.closest('[data-edit]');
    if (editBtn) {
      const item = state.items.find((i) => String(i.id) === String(editBtn.dataset.edit));
      if (item) openModal(item);
      return;
    }
    const removeBtn = event.target.closest('[data-remove]');
    if (removeBtn) {
      const item = state.items.find((i) => String(i.id) === String(removeBtn.dataset.remove));
      openDeleteDialog(item);
      return;
    }
    // 卡片内的外链点击：只记一次 link_click，不阻止新窗口打开
    const hitLink = event.target.closest('a[data-hit]');
    if (hitLink) {
      const hitCard = event.target.closest('.card');
      if (hitCard) {
        trackEvent('link_click', { software_id: hitCard.dataset.id, field: hitLink.dataset.hit });
      }
    }
    // 「只显示图标」模式下点卡片：按名称搜索并以单卡片方式聚焦显示
    const card = event.target.closest('.card');
    if (card && state.cols === 'icon' && !state.focused) {
      const id = card.dataset.id;
      const item = state.items.find((i) => String(i.id) === String(id));
      if (item) {
        trackEvent('icon_click', { software_id: item.id, field: 'icon' });
        trackEvent('focus_view', { software_id: item.id, field: 'focus' });
        await focusCard(item);
      }
    }
  });

  async function focusCard(item) {
    state.focused = item.id;
    state.focusName = item.name;
    state.selectMode = false;
    state.selected.clear();
    state.q = item.name;
    state.page = 1;
    els.searchInput.value = item.name;
    els.searchClear.hidden = false;
    applyCols();
    await loadSoftware();
  }

  els.pageNumbers.addEventListener('click', async (event) => {
    const btn = event.target.closest('[data-page]');
    if (!btn) return;
    const page = Number(btn.dataset.page);
    if (page === state.page) return;
    state.page = page;
    await loadSoftware();
  });

  els.prevPage.addEventListener('click', async () => {
    if (state.page <= 1) return;
    state.page -= 1;
    await loadSoftware();
  });

  els.nextPage.addEventListener('click', async () => {
    if (state.page >= state.pages) return;
    state.page += 1;
    await loadSoftware();
  });

  $('#jumpForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = Number(els.jumpInput.value);
    if (!Number.isInteger(value) || value < 1 || value > state.pages) {
      toast(t('toast.pageRange', { max: state.pages }), true);
      return;
    }
    if (value === state.page) return;
    state.page = value;
    await loadSoftware();
  });

  els.btnAddSoftware.addEventListener('click', () => {
    openModal();
  });

  els.btnLogin.addEventListener('click', openLogin);
  $('#closeLogin').addEventListener('click', () => { els.loginModal.hidden = true; });
  $('#cancelLogin').addEventListener('click', () => { els.loginModal.hidden = true; });
  bindMaskClose(els.loginModal, () => { els.loginModal.hidden = true; });
  els.loginForm.addEventListener('submit', submitLogin);
  $('#forgotLink').addEventListener('click', () => { $('#forgotModal').hidden = false; });
  $('#closeForgot').addEventListener('click', () => { $('#forgotModal').hidden = true; });
  $('#okForgot').addEventListener('click', () => { $('#forgotModal').hidden = true; });

  els.btnSettings.addEventListener('click', openSettings);
  $('#closeSettings').addEventListener('click', () => { els.settingsModal.hidden = true; });
  $('#cancelSettings').addEventListener('click', () => { els.settingsModal.hidden = true; });
  bindMaskClose(els.settingsModal, () => { els.settingsModal.hidden = true; });
  $('#saveSettings').addEventListener('click', saveSettings);
  $('#saveLoginGuard').addEventListener('click', saveLoginGuard);
  els.btnHotPanel.addEventListener('click', openHotPanel);
  $('#closeHot').addEventListener('click', () => { els.hotModal.hidden = true; });
  $('#closeHotFoot').addEventListener('click', () => { els.hotModal.hidden = true; });
  bindMaskClose(els.hotModal, () => { els.hotModal.hidden = true; });
  $('#saveAccount').addEventListener('click', saveAccount);
  els.btnLogoutTop.addEventListener('click', logout);

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-theme-value]');
      if (!btn) return;
      localStorage.setItem(THEME_KEY, btn.dataset.themeValue);
      applyTheme(btn.dataset.themeValue);
    });
  }

  // 滚动条：滚动时显示，静止 1.2s 后自动隐藏（卡片区 + 左侧分类）
  function bindAutoHideScrollbar(el) {
    if (!el) return;
    let hideTimer = 0;
    const markScrolling = () => {
      el.classList.add('is-scrolling');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => el.classList.remove('is-scrolling'), 1200);
    };
    el.addEventListener('scroll', markScrolling, { passive: true });
    el.addEventListener('wheel', markScrolling, { passive: true });
    el.addEventListener('touchmove', markScrolling, { passive: true });
    el.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) markScrolling();
    });
  }
  bindAutoHideScrollbar(document.getElementById('cardScroll'));
  bindAutoHideScrollbar(document.getElementById('categoryList'));

  function syncColorPicker(value) {
    const hex = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '';
    els.cardColorPicker.value = hex || '#ffffff';
  }

  els.cardColorText.addEventListener('input', () => {
    state.modalCardColor = els.cardColorText.value.trim();
    syncColorPicker(state.modalCardColor);
  });

  els.cardColorPicker.addEventListener('input', () => {
    state.modalCardColor = els.cardColorPicker.value;
    els.cardColorText.value = state.modalCardColor;
  });

  $('#clearCardColor').addEventListener('click', () => {
    state.modalCardColor = '';
    els.cardColorText.value = '';
    syncColorPicker('');
  });

  $('#settingSiteIcon').addEventListener('input', () => {
    state.siteIconDraft = $('#settingSiteIcon').value.trim();
    updateSiteIconPreview();
  });

  $('#siteIconFile').addEventListener('change', () => {
    const file = $('#siteIconFile').files && $('#siteIconFile').files[0];
    uploadImage(file, (url) => {
      $('#settingSiteIcon').value = url;
      state.siteIconDraft = url;
      updateSiteIconPreview();
    });
    $('#siteIconFile').value = '';
  });

  $('#downloadBackup').addEventListener('click', () => {
    window.location.href = '/api/backup';
  });

  $('#restoreFile').addEventListener('change', async () => {
    const file = $('#restoreFile').files && $('#restoreFile').files[0];
    $('#restoreFile').value = '';
    if (!file) return;
    if (!window.confirm(t('confirm.restore'))) return;
    $('#backupError').textContent = '';
    try {
      toast(t('toast.restoring'));
      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: file,
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.error) || '恢复失败');
      toast(t('toast.restored'));
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      $('#backupError').textContent = err.message;
    }
  });

  $('#closeModal').addEventListener('click', closeModal);
  $('#cancelModal').addEventListener('click', closeModal);
  bindMaskClose(els.modal, closeModal);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    [els.modal, els.loginModal, els.settingsModal, els.hotModal, $('#forgotModal'), els.deleteModal, els.confirmModal].forEach((m) => {
      if (m && !m.hidden) m.hidden = true;
    });
  });

  els.form.addEventListener('submit', submitSoftware);

  $('#deleteOne').addEventListener('click', () => confirmDelete('category'));
  $('#deleteAll').addEventListener('click', () => confirmDelete('all'));
  $('#deleteCancel').addEventListener('click', closeDeleteDialog);
  $('#closeDelete').addEventListener('click', closeDeleteDialog);
  bindMaskClose(els.deleteModal, closeDeleteDialog);

  els.logoUrl.addEventListener('input', () => {
    state.modalLogo = els.logoUrl.value.trim();
    updateLogoPreview();
  });

  els.logoFile.addEventListener('change', () => {
    const file = els.logoFile.files && els.logoFile.files[0];
    uploadImage(file, (url) => {
      state.modalLogo = url;
      els.logoUrl.value = url;
      updateLogoPreview();
    });
    els.logoFile.value = '';
  });

  $('#clearLogo').addEventListener('click', () => {
    state.modalLogo = '';
    els.logoUrl.value = '';
    updateLogoPreview();
  });

  $('#addDownload').addEventListener('click', () => {
    state.modalDownloads = collectDownloads();
    state.modalDownloads.push({ text: '', link: '' });
    renderDownloadRows();
  });

  els.downloadRows.addEventListener('click', (event) => {
    const rm = event.target.closest('[data-rm]');
    if (!rm) return;
    state.modalDownloads = collectDownloads();
    state.modalDownloads.splice(Number(rm.dataset.rm), 1);
    renderDownloadRows();
  });

  // 下载地址行拖曳排序：按住左侧手柄才能拖动整行，避免影响输入框选字
  function enableRowDrag(container, rowSelector, onSorted) {
    let dragging = null;
    container.addEventListener('mousedown', (event) => {
      const handle = event.target.closest('.drag-handle');
      if (!handle) return;
      const row = handle.closest(rowSelector);
      if (!row) return;
      row.draggable = true;
      // 没真正拖起来时（鼠标松开）自动收回 draggable，避免之后整行误拖
      const release = () => {
        document.removeEventListener('mouseup', release);
        if (!dragging) row.draggable = false;
      };
      document.addEventListener('mouseup', release);
    });
    container.addEventListener('dragstart', (event) => {
      const row = event.target.closest(rowSelector);
      if (!row) return;
      dragging = row;
      row.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      try { event.dataTransfer.setData('text/plain', row.dataset.index || ''); } catch (err) { /* 忽略 */ }
    });
    container.addEventListener('dragover', (event) => {
      if (!dragging) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const target = event.target.closest(rowSelector);
      if (!target || target === dragging) return;
      const box = target.getBoundingClientRect();
      const after = event.clientY > box.top + box.height / 2;
      container.insertBefore(dragging, after ? target.nextSibling : target);
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging.classList.remove('dragging');
      dragging.draggable = false;
      dragging = null;
      onSorted();
    };
    container.addEventListener('dragend', endDrag);
    container.addEventListener('drop', (event) => {
      if (!dragging) return;
      event.preventDefault();
      endDrag();
    });
  }

  enableRowDrag(els.downloadRows, '.download-row', syncDownloadOrder);
  enableRowDrag(els.extraLinkRows, '.extra-row', syncExtraOrder);

  $('#addExtraLink').addEventListener('click', () => {
    state.modalExtraLinks = syncExtraOrder() || [];
    state.modalExtraLinks.push({ text: '', link: '' });
    renderExtraRows();
    const inputs = els.extraLinkRows.querySelectorAll('.ex-text');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  els.extraLinkRows.addEventListener('click', (event) => {
    const rm = event.target.closest('[data-erm]');
    if (!rm) return;
    state.modalExtraLinks = syncExtraOrder() || [];
    state.modalExtraLinks.splice(Number(rm.dataset.erm), 1);
    renderExtraRows();
  });

  // ---------------- 启动 ----------------
  watchClearButtons();
  (async function boot() {
    try {
      await loadSettings();
    } catch (err) {
      applyI18n();
    }
    try {
      await loadAuth();
    } catch (err) {
      state.user = '';
      renderAuthUI();
    }
    await refreshAll().catch((err) => {
      els.cardGrid.innerHTML = `<div class="empty-state"><div class="big">加载失败</div><div>${escapeHtml(err.message)}</div></div>`;
    });
  })();
})();
