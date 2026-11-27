((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SoftwareImportParser = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const MAX_INPUT = 20000;
  const MAX_NAME = 60;
  const MAX_DESCRIPTION = 4000;
  const MAX_URL = 2000;
  const MAX_DOWNLOADS = 20;
  const MAX_EXTRA_LINKS = 20;

  const FIELD_ALIASES = {
    name: ['软件名称', '名称', '软件名', '软件', 'name', 'title', 'appname', 'application', 'product'],
    description: ['软件简介', '简介', '描述', '介绍', '说明', 'description', 'desc', 'summary', 'intro'],
    logo: ['图标', '图标url', '图标地址', 'logo', 'icon', 'image', '图片'],
    categories: ['分类', '分类名称', '分类标签', 'category', 'categories', 'tags', 'tag'],
    url_home: ['官网', '官方网站', '官网链接', '主页', '官方主页', 'website', 'home', 'homepage', 'officialwebsite', 'official', 'site'],
    url_github: ['github', 'github地址', 'github链接', 'githuburl', '仓库', 'repository', 'repo'],
    url_release: ['版本更新', '版本更新链接', '更新地址', '发布', '发布页', 'releases', 'release', 'changelog', '更新'],
    url_doc: ['官方文档', '文档', '文档链接', '文档地址', 'docs', 'doc', 'documentation', 'manual', 'wiki'],
    platforms: ['支持系统', '支持平台', '平台', '系统', 'platform', 'platforms', 'os', 'system'],
    licenses: ['授权方式', '授权', '许可证', '收费方式', 'license', 'licensing', 'pricing'],
    downloads: ['下载地址', '下载', '下载链接', 'download', 'downloads', 'downloadlink'],
    extra_links: ['其他链接', '其它链接', '相关链接', '其他地址', '链接', 'link', 'links', 'otherlink', 'otherlinks', 'relatedlinks'],
    card_color: ['卡片背景色', '背景色', '卡片颜色', '颜色', 'color', 'cardcolor', 'cardbackground', 'background'],
  };

  const FIELD_LOOKUP = new Map();
  Object.keys(FIELD_ALIASES).forEach((field) => {
    FIELD_ALIASES[field].forEach((alias) => FIELD_LOOKUP.set(normalizeKey(alias), field));
  });

  const PLATFORM_ALIASES = [
    ['windows', ['windows', 'win', 'win10', 'win11', 'win32', 'win64', 'win7', 'winxp']],
    ['mac', ['mac', 'macos', 'osx', 'darwin', 'macintosh']],
    ['linux', ['linux', 'ubuntu', 'debian', 'centos', 'fedora', 'arch', 'archlinux', 'linux64']],
    ['android', ['android', '安卓']],
    ['ios', ['ios', 'iphone', 'ipad', 'ipados']],
    ['harmonyos', ['harmonyos', 'harmony', '鸿蒙']],
  ];

  const LICENSE_RULES = [
    ['freemium', ['freemium', '免费增值', '基础免费', '免费+增值', '免费+收费', '免费加付费', 'free+paid', 'freepluspaid']],
    ['subscription', ['订阅', '订阅制', 'subscription', 'monthly', 'yearly', '年费', '月费']],
    ['onetime', ['买断', '一次性买断', '一次性', '永久', '终身', 'lifetime', 'one-time', 'onetime', 'perpetual']],
    ['metered', ['按量', '按量计费', '计量', 'usage', 'metered', 'payasyougo']],
    ['free', ['免费', '开源', 'free', 'opensource', 'oss']],
  ];

  const MD_LINK_RE = /\[([^\]]*)\]\(\s*(https?:\/\/[^)\s]+)\s*\)/gi;
  const BARE_URL_RE = /https?:\/\/[^\s<>"'`|｜）】]+/gi;

  function normalizeKey(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[\s*_`'"“”‘’().（）[\]【】<>《》:：,，、;；/\\|｜#-]/g, '');
  }

  function stripOuterQuotes(value) {
    return String(value || '').trim().replace(/^[“”"'‘’]+|[“”"'‘’]+$/g, '').trim();
  }

  function cleanLine(line) {
    return String(line || '')
      .replace(/^\uFEFF/, '')
      .replace(/^\s*>\s*/, '')
      .replace(/^\s*(?:[-*•]+|\d+[.)、])\s+/, '')
      .trim();
  }

  function splitLine(line) {
    const text = cleanLine(line);
    if (!text) return null;
    if (/^(```|~~~)/.test(text)) return null;

    if (/^\|.*\|$/.test(text)) {
      const cells = text.slice(1, -1).split('|').map((cell) => cell.trim());
      if (cells.length >= 2 && FIELD_LOOKUP.has(normalizeKey(cells[0]))) {
        return { field: FIELD_LOOKUP.get(normalizeKey(cells[0])), value: cells.slice(1).join(' | ') };
      }
    }

    const colon = text.match(/^([^:：]{1,24})\s*[:：]\s*(.*)$/);
    if (colon) {
      const field = FIELD_LOOKUP.get(normalizeKey(colon[1]));
      if (field) return { field, value: colon[2].trim() };
    }

    const space = text.match(/^([^\s:：]{1,12})\s+(.*)$/);
    if (space) {
      const field = FIELD_LOOKUP.get(normalizeKey(space[1]));
      if (field) return { field, value: space[2].trim() };
    }

    return { field: null, value: text };
  }

  function cleanUrl(value) {
    const url = stripOuterQuotes(value).replace(/[.,;:!?，。；：、）】]+$/g, '');
    if (!/^https?:\/\//i.test(url)) return '';
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
      return url;
    } catch (err) {
      return '';
    }
  }

  function canonicalUrl(value) {
    try {
      const parsed = new URL(value);
      parsed.hash = '';
      if (parsed.pathname === '/' && !parsed.search) return parsed.origin.toLowerCase();
      return parsed.href.replace(/\/$/, '').toLowerCase();
    } catch (err) {
      return String(value || '').trim().toLowerCase();
    }
  }

  function hostOf(url) {
    try {
      return new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
    } catch (err) {
      return '';
    }
  }

  function isImageUrl(url) {
    return /\.(png|jpe?g|gif|webp|svg|ico)(\?\S*)?$/i.test(url);
  }

  function isBinaryUrl(url) {
    return /\.(exe|msi|msix|dmg|pkg|apk|ipa|deb|rpm|appimage|zip|7z|rar|tar\.gz|tgz|iso|jar)(\?\S*)?$/i.test(url);
  }

  function uniquePush(list, value) {
    if (value && !list.includes(value)) list.push(value);
  }

  function splitValues(value) {
    return String(value || '')
      .split(/[,，、;；|｜/／]+/)
      .map((item) => stripOuterQuotes(item))
      .filter(Boolean);
  }

  function parsePlatforms(value, target) {
    splitValues(value).forEach((token) => {
      const key = normalizeKey(token);
      if (!key) return;
      let matched = '';
      if (key.startsWith('win')) matched = 'windows';
      PLATFORM_ALIASES.forEach(([platform, aliases]) => {
        if (matched) return;
        if (aliases.some((alias) => key === alias || key.includes(alias))) matched = platform;
      });
      if (matched) target[matched] = true;
    });
  }

  function parseLicenses(value, target) {
    splitValues(value).forEach((token) => {
      const key = normalizeKey(token);
      if (!key) return;
      for (const [license, aliases] of LICENSE_RULES) {
        if (aliases.some((alias) => key.includes(alias))) {
          uniquePush(target, license);
          break;
        }
      }
    });
  }

  function extractLinksFromText(value) {
    const source = String(value || '');
    const links = [];
    let text = source;

    text = text.replace(MD_LINK_RE, (match, label, url) => {
      const clean = cleanUrl(url);
      if (clean) links.push({ url: clean, text: stripOuterQuotes(label) });
      return ' ';
    });

    const bare = text.match(BARE_URL_RE) || [];
    bare.forEach((url) => {
      const clean = cleanUrl(url);
      if (clean) links.push({ url: clean, text: '' });
    });
    text = text.replace(BARE_URL_RE, ' ');

    return { links, text: text.replace(/\s+/g, ' ').trim() };
  }

  function parseLinkSpec(value) {
    const segments = String(value || '').split(/\s*[|｜]\s*/).map((item) => stripOuterQuotes(item)).filter(Boolean);
    const links = [];
    const textSegments = [];

    segments.forEach((segment, index) => {
      const extracted = extractLinksFromText(segment);
      if (extracted.links.length) {
        extracted.links.forEach((link) => links.push({ ...link, index, segmentText: extracted.text }));
      } else if (extracted.text) {
        textSegments.push({ text: extracted.text, index });
      }
    });

    if (!links.length) return { links: [], text: textSegments.map((item) => item.text).join(' ') };

    const first = links[0];
    const urlIndex = first.index;
    const before = textSegments.filter((item) => item.index < urlIndex).map((item) => item.text);
    const after = textSegments.filter((item) => item.index > urlIndex).map((item) => item.text);
    const fallback = first.segmentText || '';
    return {
      links,
      text: first.text || fallback || before[0] || after[0] || '',
      before,
      after,
    };
  }

  function inferLinkText(url) {
    try {
      const parsed = new URL(url);
      if (/github\.com$/i.test(parsed.hostname) && /\/releases\/download\//i.test(parsed.pathname)) {
        return 'GitHub Releases';
      }
      const name = decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() || '');
      if (name && /\./.test(name)) return name;
      return parsed.hostname.replace(/^www\./i, '') || '链接';
    } catch (err) {
      return '链接';
    }
  }

  function classifyUrl(url) {
    const host = hostOf(url);
    let path = '';
    try {
      path = new URL(url).pathname;
    } catch (err) {
      path = '';
    }
    if (isImageUrl(url)) return 'logo';
    if (isBinaryUrl(url)) return 'download';
    if (host === 'github.com' || host.endsWith('.github.com')) {
      if (/\/(releases|tags)(\/|$)/i.test(path)) return 'release';
      return 'github';
    }
    if (/(^|\/)(docs?|documentation|wiki|manual|faq)(\/|$)/i.test(path)) return 'doc';
    if (/(^|\/)(releases?|changelog|versions?)(\/|$)/i.test(path)) return 'release';
    return 'home';
  }

  function parseImportText(raw, options = {}) {
    const source = String(raw == null ? '' : raw).slice(0, MAX_INPUT);
    const state = {
      name: '',
      description: '',
      logo: '',
      categories: [],
      url_home: '',
      url_github: '',
      url_release: '',
      url_doc: '',
      url_home_text: '',
      url_github_text: '',
      url_release_text: '',
      url_doc_text: '',
      platforms: {},
      licenses: [],
      downloads: [],
      extra_links: [],
      card_color: '',
    };
    const warnings = [];
    const usedUrls = new Set();
    const looseLinks = [];
    const plainCandidates = [];
    const invalidLinks = [];
    let currentLineText = '';
    let currentField = '';
    let descriptionStarted = false;
    let invalidLinkCount = 0;
    let ignoredDownloadCount = 0;
    let ignoredExtraCount = 0;

    const addWarning = (code, params = {}) => {
      const existing = warnings.find((item) => item.code === code);
      if (existing) {
        existing.count = (existing.count || 1) + 1;
        Object.assign(existing.params, params);
      } else {
        warnings.push({ code, params, count: 1 });
      }
    };

    const noteInvalid = (fallback = '') => {
      invalidLinkCount += 1;
      const raw = cleanLine(currentLineText || fallback).replace(/\s+/g, ' ').trim();
      if (raw && !invalidLinks.includes(raw) && invalidLinks.length < 8) {
        invalidLinks.push(raw.slice(0, 160));
      }
    };

    const claim = (url) => {
      const key = canonicalUrl(url);
      if (!key || usedUrls.has(key)) return false;
      usedUrls.add(key);
      return true;
    };

    const addDownload = (text, link) => {
      if (state.downloads.length >= MAX_DOWNLOADS) {
        ignoredDownloadCount += 1;
        return;
      }
      const cleanLink = cleanUrl(link);
      if (!cleanLink) {
        noteInvalid(link);
        return;
      }
      if (state.downloads.some((item) => canonicalUrl(item.link) === canonicalUrl(cleanLink))) return;
      state.downloads.push({ text: (text || inferLinkText(cleanLink)).trim().slice(0, 60), link: cleanLink });
      claim(cleanLink);
    };

    const addExtraLink = (text, link, label = '') => {
      if (state.extra_links.length >= MAX_EXTRA_LINKS) {
        ignoredExtraCount += 1;
        return;
      }
      const cleanLink = cleanUrl(link);
      if (!cleanLink) {
        noteInvalid(link);
        return;
      }
      if (state.extra_links.some((item) => canonicalUrl(item.link) === canonicalUrl(cleanLink))) return;
      state.extra_links.push({
        text: (text || inferLinkText(cleanLink)).trim().slice(0, 30),
        link: cleanLink,
        label: (label || '').trim().slice(0, 60),
      });
      claim(cleanLink);
    };

    const setFixedLink = (field, value) => {
      const spec = parseLinkSpec(value);
      const validLinks = spec.links.map((item) => cleanUrl(item.url)).filter(Boolean);
      if (!validLinks.length) {
        noteInvalid(value);
        return;
      }
      if (!state[field] && claim(validLinks[0])) {
        state[field] = validLinks[0];
        state[`${field}_text`] = (spec.text || '').trim().slice(0, 60);
      }
    };

    let lines = source.replace(/\r\n?/g, '\n').split('\n');
    lines.forEach((rawLine) => {
      currentLineText = cleanLine(rawLine);
      const parsedLine = splitLine(rawLine);
      if (!parsedLine) {
        if (currentField === 'description' && state.description) state.description += '\n';
        return;
      }

      if (!parsedLine.field) {
        const extracted = extractLinksFromText(parsedLine.value);
        if (extracted.links.length) {
          extracted.links.forEach((item) => looseLinks.push(item));
          currentField = '';
          return;
        }
        if (currentField === 'description' && !/[：:]/.test(parsedLine.value)) {
          state.description = `${state.description ? `${state.description}\n` : ''}${parsedLine.value}`;
          descriptionStarted = true;
          return;
        }
        if (!plainCandidates.length && parsedLine.value.length <= 120) {
          plainCandidates.push(parsedLine.value);
        }
        return;
      }

      const field = parsedLine.field;
      const value = parsedLine.value;
      currentField = field;

      if (field === 'name') {
        if (!state.name) {
          const name = stripOuterQuotes(value);
          state.name = name.slice(0, MAX_NAME);
          if (name.length > MAX_NAME) addWarning('nameTooLong');
        }
        return;
      }

      if (field === 'description') {
        if (!descriptionStarted) {
          state.description = value;
          descriptionStarted = true;
        } else {
          state.description = `${state.description}\n${value}`;
        }
        return;
      }

      if (field === 'logo') {
        if (!state.logo) {
          const spec = parseLinkSpec(value);
          const link = spec.links.map((item) => cleanUrl(item.url)).find(Boolean);
          if (link) {
            state.logo = link;
            claim(link);
          } else {
            noteInvalid(value);
          }
        }
        return;
      }

      if (field === 'categories') {
        splitValues(value).forEach((item) => uniquePush(state.categories, item.slice(0, 30)));
        return;
      }

      if (field === 'platforms') {
        parsePlatforms(value, state.platforms);
        return;
      }

      if (field === 'licenses') {
        parseLicenses(value, state.licenses);
        return;
      }

      if (field === 'downloads') {
        const spec = parseLinkSpec(value);
        if (!spec.links.length) {
          noteInvalid(value);
          return;
        }
        spec.links.forEach((item) => {
          const beforeText = spec.before && spec.before[0];
          addDownload(spec.text || beforeText || item.text || '', item.url);
        });
        return;
      }

      if (field === 'extra_links') {
        const spec = parseLinkSpec(value);
        if (!spec.links.length) {
          noteInvalid(value);
          return;
        }
        spec.links.forEach((item) => {
          const name = item.text || (spec.before && spec.before[0]) || '';
          const label = (spec.after && spec.after[0]) || '';
          addExtraLink(name, item.url, label);
        });
        return;
      }

      if (field === 'card_color') {
        const color = String(value || '').trim().replace(/^#/, '');
        if (/^[0-9a-fA-F]{3,8}$/.test(color)) {
          state.card_color = `#${color}`;
        } else {
          addWarning('badColor');
        }
        return;
      }

      if (field in state) setFixedLink(field, value);
    });

    if (!state.name && plainCandidates.length) {
      const candidate = stripOuterQuotes(plainCandidates[0]).replace(/[。；;]+$/g, '');
      if (
        candidate.length <= MAX_NAME &&
        !/^(请|请按|填写|说明|格式|注意|提示|输出|要求|prompt|instruction)/i.test(candidate)
      ) {
        state.name = candidate;
      }
    }

    if (!state.name && !Object.keys(state).some((key) => {
      if (key === 'platforms') return Object.keys(state.platforms).length;
      if (Array.isArray(state[key])) return state[key].length;
      return Boolean(state[key]);
    })) {
      addWarning('noFields');
    } else if (!state.name) {
      addWarning('noName');
    }

    if (state.description.length > MAX_DESCRIPTION) {
      state.description = state.description.slice(0, MAX_DESCRIPTION);
      addWarning('descriptionTooLong');
    }

    const addLooseLink = (link) => {
      const clean = cleanUrl(link.url);
      if (!clean || canonicalUrl(clean) && usedUrls.has(canonicalUrl(clean))) return;
      const kind = classifyUrl(clean);
      if (kind === 'logo') {
        if (!state.logo && claim(clean)) state.logo = clean;
        return;
      }
      if (kind === 'download') {
        addDownload(link.text || '', clean);
        return;
      }
      if (kind === 'github' && !state.url_github && claim(clean)) {
        state.url_github = clean;
        state.url_github_text = (link.text || '').slice(0, 60);
        return;
      }
      if (kind === 'release' && !state.url_release && claim(clean)) {
        state.url_release = clean;
        state.url_release_text = (link.text || '').slice(0, 60);
        return;
      }
      if (kind === 'doc' && !state.url_doc && claim(clean)) {
        state.url_doc = clean;
        state.url_doc_text = (link.text || '').slice(0, 60);
        return;
      }
      if ((kind === 'home' || kind === 'github' || kind === 'release' || kind === 'doc') && !state.url_home && claim(clean)) {
        state.url_home = clean;
        state.url_home_text = (link.text || '').slice(0, 60);
        return;
      }
      addExtraLink(link.text || '', clean);
    };

    looseLinks.forEach(addLooseLink);

    if (invalidLinkCount) addWarning('invalidUrl', { count: invalidLinkCount, items: invalidLinks });
    if (ignoredDownloadCount) addWarning('downloadLimit', { count: ignoredDownloadCount });
    if (ignoredExtraCount) addWarning('extraLimit', { count: ignoredExtraCount });
    if (state.url_home && state.url_home.length > MAX_URL) state.url_home = state.url_home.slice(0, MAX_URL);

    return { fields: state, warnings };
  }

  return {
    MAX_INPUT,
    parseImportText,
    normalizeKey,
    classifyUrl,
    splitLine,
    extractLinksFromText,
    parseLinkSpec,
    parsePlatforms,
    parseLicenses,
  };
});
