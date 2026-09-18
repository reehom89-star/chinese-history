#!/usr/bin/env node
/* 中国历史百科 · smoke 测试
 * 用法: node test-history.js [path/to/history]
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.argv[2] || __dirname);
const JS = p => path.join(ROOT, 'js', 'data', p);
const IMG = p => path.join(ROOT, 'images', p);

let errors = 0;
const err = m => { console.error('  ✗ ' + m); errors++; };
const ok = m => console.log('  ✓ ' + m);

console.log('== 1. JS 语法检查 ==');
for (const f of ['js/app.js', 'js/data/core.js', 'js/data/stage01-03.js', 'js/data/stage04-06.js', 'js/data/stage07-09.js', 'js/data/stage10-12.js', 'js/data/china.js']) {
  try { new Function(fs.readFileSync(path.join(ROOT, f), 'utf8')); ok(f); }
  catch (e) { err(`${f}: ${e.message}`); }
}

console.log('== 2. 数据完整性 ==');
global.window = {};
for (const f of ['core.js', 'stage01-03.js', 'stage04-06.js', 'stage07-09.js', 'stage10-12.js']) {
  try { require(JS(f)); } catch (e) { err(`require ${f}: ${e.message}`); }
}
const ST = global.window.HISTORY_STAGES;
ok(`共 ${ST.length} 个阶段`);
if (ST.length !== 12) err('应恰好 12 个阶段');

const required = ['id', 'name', 'era', 'range', 'emoji', 'color', 'tagline', 'summary', 'capital', 'stories', 'inventions', 'people', 'chengyu', 'mapSpots', 'quiz'];
for (const s of ST) {
  const id = s.id;
  const miss = required.filter(k => s[k] === undefined);
  if (miss.length) err(`${id} 缺少字段: ${miss.join(',')}`);
  if (!s.stories || s.stories.length < 5) err(`${id}: stories < 5`);
  if (!s.inventions || s.inventions.length < 5) err(`${id}: inventions < 5`);
  if (!s.people || s.people.length < 5) err(`${id}: people < 5`);
  if (!s.chengyu || s.chengyu.length < 5) err(`${id}: chengyu < 5`);
  if (!s.funFacts || s.funFacts.length < 1) err(`${id}: funFacts < 1`);
  if (!s.quiz || s.quiz.length < 6) err(`${id}: quiz < 6`);
  for (const q of (s.quiz || [])) {
    if (!q.q || !Array.isArray(q.options) || q.options.length !== 4) err(`${id}: 题目格式错误 ${q.q}`);
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3) err(`${id}: answer 越界`);
  }
  for (const sp of (s.mapSpots || [])) {
    if (typeof sp.lng !== 'number' || typeof sp.lat !== 'number') err(`${id}: 地图点位 ${sp.name} 坐标缺失`);
  }
  for (const st of s.stories) if (st.img && !fs.existsSync(IMG(st.img))) err(`${id}: 缺少故事图 ${st.img}`);
  for (const p of s.people) if (p.img && !fs.existsSync(IMG(p.img))) err(`${id}: 缺少人物图 ${p.img}`);
}
ok('字段/题目/地图点位检查完成');

console.log('== 3. HTML 引用一致性 ==');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
for (const s of scripts) {
  if (!fs.existsSync(path.join(ROOT, s))) err(`index.html 引用了不存在的 ${s}`);
  else ok(`script ${s}`);
}
const css = [...html.matchAll(/href="([^"]+\.css)"/g)].map(m => m[1]);
for (const c of css) {
  if (!fs.existsSync(path.join(ROOT, c))) err(`index.html 引用了不存在的 ${c}`);
  else ok(`css ${c}`);
}

console.log(errors ? `\n✗ 共 ${errors} 个问题` : '\n✓ 全部通过');
process.exit(errors ? 1 : 0);
