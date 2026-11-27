const assert = require('assert');
const parser = require('../app/static/import-parser.js');

const full = `软件名称：7-Zip
简介：免费开源的文件压缩工具，支持 7z、ZIP 等格式。
官方网站：https://www.7-zip.org/
GitHub：https://github.com/ip7z/7zip
版本更新：https://www.7-zip.org/download.html
官方文档：https://7-zip.org/faq.html
图标：https://www.7-zip.org/7z.ico
支持系统：Windows, Linux
授权方式：免费
分类：压缩工具, 工具
下载地址：Windows 64位 | https://www.7-zip.org/a/7z2409-x64.exe
下载地址：Windows 32位 | https://www.7-zip.org/a/7z2408.exe
其他链接：SourceForge | https://sourceforge.net/projects/sevenzip/
卡片背景色：#f5f6f8`;

const parsed = parser.parseImportText(full);
assert.strictEqual(parsed.fields.name, '7-Zip');
assert.ok(parsed.fields.description.includes('免费开源'));
assert.strictEqual(parsed.fields.url_home, 'https://www.7-zip.org/');
assert.strictEqual(parsed.fields.url_github, 'https://github.com/ip7z/7zip');
assert.strictEqual(parsed.fields.url_release, 'https://www.7-zip.org/download.html');
assert.strictEqual(parsed.fields.url_doc, 'https://7-zip.org/faq.html');
assert.strictEqual(parsed.fields.platforms.windows, true);
assert.strictEqual(parsed.fields.platforms.linux, true);
assert.deepStrictEqual(parsed.fields.licenses, ['free']);
assert.deepStrictEqual(parsed.fields.categories, ['压缩工具', '工具']);
assert.strictEqual(parsed.fields.downloads.length, 2);
assert.strictEqual(parsed.fields.downloads[0].text, 'Windows 64位');
assert.strictEqual(parsed.fields.extra_links[0].text, 'SourceForge');
assert.strictEqual(parsed.fields.card_color, '#f5f6f8');
assert.strictEqual(parsed.fields.logo, 'https://www.7-zip.org/7z.ico');

const markdown = `- **软件名称**：Foo App
- **简介**：一个测试软件
- **GitHub**：[仓库](https://github.com/foo/bar)
- **支持系统**：Windows / macOS / 鸿蒙
- **授权方式**：免费增值
- **下载地址**：Windows 版 | https://example.com/Foo-Setup.exe
- **其他链接**：官网镜像 | https://example.com/mirror | 高速下载`;

const mdParsed = parser.parseImportText(markdown);
assert.strictEqual(mdParsed.fields.name, 'Foo App');
assert.strictEqual(mdParsed.fields.url_github, 'https://github.com/foo/bar');
assert.strictEqual(mdParsed.fields.platforms.windows, true);
assert.strictEqual(mdParsed.fields.platforms.mac, true);
assert.strictEqual(mdParsed.fields.platforms.harmonyos, true);
assert.deepStrictEqual(mdParsed.fields.licenses, ['freemium']);
assert.strictEqual(mdParsed.fields.downloads[0].text, 'Windows 版');
assert.strictEqual(mdParsed.fields.extra_links[0].text, '官网镜像');
assert.strictEqual(mdParsed.fields.extra_links[0].label, '高速下载');

const loose = `Bar Tool
https://bar.example.com/
https://github.com/bar/tool
https://github.com/bar/tool/releases
https://bar.example.com/Bar-1.0.dmg`;

const looseParsed = parser.parseImportText(loose);
assert.strictEqual(looseParsed.fields.name, 'Bar Tool');
assert.strictEqual(looseParsed.fields.url_home, 'https://bar.example.com/');
assert.strictEqual(looseParsed.fields.url_github, 'https://github.com/bar/tool');
assert.strictEqual(looseParsed.fields.url_release, 'https://github.com/bar/tool/releases');
assert.strictEqual(looseParsed.fields.downloads.length, 1);

const table = `| 软件名称 | Baz |
| 官方网站 | https://baz.example.com |
| 支持系统 | iOS, Android |
| 授权方式 | 订阅制 |`;

const tableParsed = parser.parseImportText(table);
assert.strictEqual(tableParsed.fields.name, 'Baz');
assert.strictEqual(tableParsed.fields.url_home, 'https://baz.example.com');
assert.strictEqual(tableParsed.fields.platforms.ios, true);
assert.strictEqual(tableParsed.fields.platforms.android, true);
assert.deepStrictEqual(tableParsed.fields.licenses, ['subscription']);

const bad = '软件名称：Bad\n官方网站：javascript:alert(1)\n下载地址：坏链接 | ftp://x';
const badParsed = parser.parseImportText(bad);
const invalid = badParsed.warnings.find((item) => item.code === 'invalidUrl');
assert.ok(invalid);
assert.ok(invalid.params.items.some((item) => item.includes('下载地址：坏链接 | ftp://x')));

const noColor = parser.parseImportText('软件名称：NoColor\n简介：没有背景色');
assert.strictEqual(noColor.fields.card_color, '');
assert.ok(!noColor.warnings.some((item) => item.code === 'badColor'));

const optionalLinks = parser.parseImportText('软件名称：OptionalLinks\nGitHub：\n版本更新：\n官方文档：\n图标：\n其他链接：\n卡片背景色：');
assert.ok(!optionalLinks.warnings.some((item) => item.code === 'badColor'));
const optionalInvalid = optionalLinks.warnings.find((item) => item.code === 'invalidUrl');
assert.strictEqual(optionalInvalid.params.count, 5);
assert.strictEqual(optionalInvalid.params.items.length, 5);

const badColor = parser.parseImportText('软件名称：BadColor\n卡片背景色：浅灰色');
assert.ok(badColor.warnings.some((item) => item.code === 'badColor'));

const fenced = parser.parseImportText('```text\n软件名称：Fenced\n```');
assert.strictEqual(fenced.fields.name, 'Fenced');

console.log('import-parser tests passed');
