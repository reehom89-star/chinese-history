/* ============ 中国历史百科 · 主逻辑 ============ */
(function () {
  'use strict';
  const STAGES = window.HISTORY_STAGES;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  const app = $('#app');
  let currentStageId = null;
  let quizState = null;
  let mapFilterStage = null;

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function emojiOf(id) { return (window.STAGE_BY_ID[id] || {}).emoji || '📜'; }
  function colorOf(id) { return (window.STAGE_BY_ID[id] || {}).color || '#C8452E'; }
  function imgWrap(src, ph, cls) {
    return `<div class="img-wrap ${cls || ''}">
      <span class="ph">${ph}</span>
      <img src="${esc(src)}" alt="" loading="lazy" onload="this.classList.add('loaded')" onerror="this.style.display='none'">
    </div>`;
  }

  /* ---------- 视图切换 ---------- */
  function showView(name, opts) {
    $$('.view').forEach(v => v.classList.remove('active'));
    $('#view-' + name).classList.add('active');
    $$('.nav a').forEach(a => a.classList.toggle('active', a.dataset.view === name));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (name === 'home') renderHome();
    if (name === 'map') renderMap(opts);
    if (name === 'quiz') renderQuiz();
    if (name === 'museum') renderMuseumPage();
  }

  /* ---------- 首页 ---------- */
  /* 朝代时间轴（年份比例，负数为公元前） */
  const DYN_YEARS = [
    ['stage01', -3000, -2070], ['stage02', -2070, -771], ['stage03', -770, -221],
    ['stage04', -221, -206], ['stage05', -202, 220], ['stage06', 220, 589],
    ['stage07', 581, 907], ['stage08', 907, 1279], ['stage09', 1271, 1368],
    ['stage10', 1368, 1644], ['stage11', 1644, 1912], ['stage12', 1912, 2026]
  ];
  function renderHome() {
    renderSideNav();
    renderAssistant();
    $('#home-list').innerHTML = STAGES.map((s, i) => `
      <div class="tl-item" id="tl-${s.id}" onclick="App.openStage('${s.id}')">
        <div class="tl-marker"><span class="tl-dot" style="--c:${esc(s.color)}"></span><span class="tl-seq">${i + 1}</span></div>
        <div class="tl-card">
          <div class="tl-img">${imgWrap('images/stage' + s.id.replace('stage', '') + '-hero.jpg', s.emoji)}</div>
          <div class="tl-body">
            <div class="tl-head">
              <span class="tl-name">${esc(s.name)}</span>
              <span class="tl-range">${esc(s.range)}</span>
            </div>
            <div class="tl-tagline">${esc(s.tagline)}</div>
            <p class="tl-summary">${esc(s.summary)}</p>
            <div class="tl-stats">
              <span class="sc-chip">📖 ${s.stories.length} 个故事</span>
              <span class="sc-chip">💡 ${s.inventions.length} 项成就</span>
              <span class="sc-chip">👥 ${s.people.length} 位人物</span>
              <span class="sc-chip">✒️ ${s.chengyu.length} 个成语</span>
            </div>
          </div>
        </div>
      </div>`).join('');
  }

  /* ---------- 阶段详情 ---------- */
  function openStage(id) {
    const s = window.STAGE_BY_ID[id];
    if (!s) return;
    currentStageId = id;
    learnRecordVisit(id); // 感知：记录本次浏览
    const idx = STAGES.findIndex(x => x.id === id);
    const prev = STAGES[idx - 1], next = STAGES[idx + 1];
    showView('stage');
    $('#stage-body').innerHTML = `
      <div class="back-row">
        <button class="btn-ghost" onclick="App.goHome()">← 返回时间轴</button>
        ${prev ? `<button class="btn-ghost" onclick="App.openStage('${prev.id}')">‹ ${prev.emoji} ${esc(prev.name)}</button>` : ''}
        ${next ? `<button class="btn-ghost" onclick="App.openStage('${next.id}')">${esc(next.name)} ${next.emoji} ›</button>` : ''}
        <button class="btn-ghost" style="margin-left:auto" onclick="App.openMap('${s.id}')">🗺️ 看地图</button>
      </div>
      <div class="stage-hero" style="--sc:${s.color}">
        <div class="sh-hero-img">${imgWrap('images/stage' + id.replace('stage', '') + '-hero.jpg', s.emoji)}</div>
        <div class="sh-overlay">
          <div class="sh-emoji">${esc(s.emoji)}</div>
          <h1 class="sh-name">${esc(s.name)}</h1>
          <div><span class="sh-range">${esc(s.range)}</span></div>
          <div class="sh-tagline">${esc(s.tagline)}</div>
        </div>
        <div class="sh-info">
          <p class="sh-summary">${esc(s.summary)}</p>
          <div class="sh-capital">📍 主要区域：<b>${esc(s.capital)}</b></div>
        </div>
      </div>

      <div class="sec">
        <div class="sec-title"><span class="st-icon">📖</span> 重点故事</div>
        <div class="story-grid">
          ${s.stories.map((st, i) => `
            <div class="story-card">
              <div class="img-box">${imgWrap('images/' + st.img, ['📜','🏮','⚔️'][i % 3] || '📜')}</div>
              <div class="body"><h4>${esc(st.title)}</h4><p>${esc(st.text)}</p></div>
            </div>`).join('')}
        </div>
      </div>

      <div class="sec">
        <div class="sec-title"><span class="st-icon">💡</span> 重大发明与成就</div>
        <div class="tile-grid">
          ${s.inventions.map(inv => `
            <div class="tile">
              <div class="t-icon">${esc(inv.icon)}</div>
              <div><h4>${esc(inv.title)}</h4><p>${esc(inv.text)}</p></div>
            </div>`).join('')}
        </div>
      </div>

      <div class="sec">
        <div class="sec-title"><span class="st-icon">👥</span> 重点人物</div>
        <div class="people-grid">
          ${s.people.map(p => `
            <div class="person-card">
              <div class="p-img">${imgWrap('images/' + p.img, '🧑‍🎓', '')}</div>
              <div class="p-body"><h4>${esc(p.name)}</h4><p>${esc(p.text)}</p></div>
            </div>`).join('')}
        </div>
      </div>

      <div class="sec">
        <div class="sec-title"><span class="st-icon">✒️</span> 成语故事</div>
        <div class="cy-grid">
          ${s.chengyu.map(c => `
            <div class="cy-card">
              <div class="cy-idiom">${esc(c.idiom)}</div>
              <div class="cy-pinyin">${esc(c.pinyin)}</div>
              <div class="cy-meaning">${esc(c.meaning)}</div>
              <div class="cy-source">${esc(c.source)}</div>
              <div class="cy-story">${esc(c.story)}</div>
            </div>`).join('')}
        </div>
      </div>

      ${s.funFacts ? `
      <div class="sec">
        <div class="sec-title"><span class="st-icon">🤔</span> 你知道吗</div>
        <div class="funfacts">
          ${s.funFacts.map(f => `<div class="fun-card"><span class="fc-icon">💡</span><span>${esc(f)}</span></div>`).join('')}
        </div>
      </div>` : ''}

      ${s.special ? `
      <div class="sec">
        <div class="sec-title"><span class="st-icon">👑</span> ${esc(s.special.title)}</div>
        <div class="sp-img">${imgWrap('images/' + s.special.img, '👑')}</div>
        <div class="sp-block">
          <div class="sp-sub"><span class="sp-sub-icon">⚔️</span> 春秋五霸</div>
          <div class="sp-intro">${esc(s.special.wuba.intro)}</div>
          <div class="wuba-grid">
            ${s.special.wuba.list.map(b => `
              <div class="wuba-card" style="--bc:${esc(b.color)}">
                <div class="wb-head">
                  <span class="wb-name">${esc(b.name)}</span>
                  <span class="wb-title">${esc(b.title)}</span>
                </div>
                <div class="wb-years">⏳ ${esc(b.years)}</div>
                <p class="wb-feat">${esc(b.feat)}</p>
                <p class="wb-story">${esc(b.story)}</p>
                <div class="wb-idiom">✒️ 成语：${esc(b.idiom)}</div>
              </div>`).join('')}
          </div>
        </div>
        <div class="sp-block">
          <div class="sp-sub"><span class="sp-sub-icon">🏰</span> 战国七雄</div>
          <div class="sp-intro">${esc(s.special.qixiong.intro)}</div>
          ${s.special.qixiong.img ? `<div class="sp-img">${imgWrap('images/' + s.special.qixiong.img, '🏰')}</div>` : ''}
          <div class="qixiong-grid">
            ${s.special.qixiong.list.map(q => `
              <div class="qixiong-card" style="--qc:${esc(q.color)}">
                <div class="qx-top"><span class="qx-name">${esc(q.name)}</span><span class="qx-pos">${esc(q.pos)}</span></div>
                <div class="qx-capital">🏯 都城：${esc(q.capital)}</div>
                <p class="qx-feat">${esc(q.feat)}</p>
                <div class="qx-figures">👥 名士：${esc(q.figures)}</div>
                <div class="qx-events">⚔️ ${esc(q.events)}</div>
                <div class="qx-end">🏳️ 结局：${esc(q.end)}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>` : ''}

      <div class="sec">
        <div class="sec-title"><span class="st-icon">🧭</span> 地理足迹</div>
        <p style="color:var(--text-light);font-size:13.5px;margin-bottom:14px;">这个时代的重要地点，点击可在地图中查看位置 👇</p>
        <div class="story-grid">
          ${s.mapSpots.map(sp => `
            <div class="story-card" style="cursor:pointer" onclick="App.openMap('${s.id}')">
              <div class="body"><h4>📍 ${esc(sp.name)}</h4><p>${esc(sp.desc)}</p></div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  /* ---------- 地图 ---------- */
  /* Albers 等积圆锥投影（中国常用标准纬线） */
  const DEG = Math.PI / 180;
  function albersProj(lng, lat) {
    const phi0 = 20, lambda0 = 80, phi1 = 20, phi2 = 55;
    const n = (Math.sin(phi1 * DEG) + Math.sin(phi2 * DEG)) / 2;
    const C = Math.cos(phi1 * DEG) ** 2 + 2 * n * Math.sin(phi1 * DEG);
    const rho0 = Math.sqrt(C - 2 * n * Math.sin(phi0 * DEG)) / n;
    const phi = lat * DEG, lambda = (lng - lambda0) * DEG;
    const rho = Math.sqrt(C - 2 * n * Math.sin(phi)) / n;
    const theta = n * lambda;
    return [rho * Math.sin(theta), rho0 - rho * Math.cos(theta)];
  }

  function walkCoords(geom, cb) {
    if (geom.type === 'Polygon') geom.coordinates.forEach(ring => ring.forEach(c => cb(c)));
    else if (geom.type === 'MultiPolygon') geom.coordinates.forEach(poly => poly.forEach(ring => ring.forEach(c => cb(c))));
  }

  let mapCache = null;
  function buildMapPaths() {
    if (mapCache) return mapCache;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let ssMinX = Infinity, ssMinY = Infinity, ssMaxX = -Infinity, ssMaxY = -Infinity;
    const mainlandRings = [];
    const southSeaRings = [];
    function addRings(features, opts) {
      (features || []).forEach(function(f) {
        if (!f.geometry) return;
        const fname = (f.properties && f.properties.name) || '';
        if (opts.extra && fname === '冰岛') return;
        const geoms = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
        geoms.forEach(function(rings0) {
          rings0.forEach(function(ring) {
            if (!ring.length) return;
            let latSum = 0, minLat = 90, maxLat = -90;
            ring.forEach(function(c) {
              latSum += c[1];
              minLat = Math.min(minLat, c[1]);
              maxLat = Math.max(maxLat, c[1]);
            });
            const avgLat = latSum / ring.length;
            if (opts.extra && (avgLat > 66 || minLat > 63.5)) return;
            const sea = opts.chinaSea && avgLat < 18;
            const pts = ring.map(function(c) {
              const p = albersProj(c[0], c[1]);
              if (sea) {
                ssMinX = Math.min(ssMinX, p[0]); ssMaxX = Math.max(ssMaxX, p[0]);
                ssMinY = Math.min(ssMinY, p[1]); ssMaxY = Math.max(ssMaxY, p[1]);
              } else {
                const lng = c[0], lat = c[1];
                const inFrame = !opts.extra || (lat <= 71 && lat >= -10 && lng >= -12 && lng <= 150);
                if (inFrame) {
                  minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
                  minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
                }
              }
              return p;
            });
            if (sea) southSeaRings.push(pts);
            else mainlandRings.push({ name: fname, pts: pts, extra: !!opts.extra });
          });
        });
      });
    }
    addRings((window.EURASIA_GEO && window.EURASIA_GEO.features) || [], { extra: true, chinaSea: false });
    addRings((window.CHINA_GEO && window.CHINA_GEO.features) || [], { extra: false, chinaSea: true });
    // 第二步：大陆 fit 到视口（albers y 轴向上，屏幕 y 向下，翻转 y 使北方朝上）
    const W = 980, H = 640, pad = 10;
    const scale = Math.min((W - pad * 2) / (maxX - minX), (H - pad * 2) / (maxY - minY));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const px = p => [(p[0] - cx) * scale + W / 2, H / 2 - (p[1] - cy) * scale];
    // 第三步：生成大陆 path（保留省名，供疆域按省着色）
    const paths = mainlandRings.map(r => ({
      name: r.name, extra: !!r.extra,
      d: 'M' + r.pts.map(p => px(p).map(v => v.toFixed(1)).join(',')).join(' ') + ' Z'
    }));
    // 第四步：南海诸岛小比例绘制在右下角（目标矩形，保持纵横比）
    const ssTarget = { x0: W - 196, y0: H - 186, x1: W - 26, y1: H - 26 }; // 右下角 170x160 区域
    const ssW = ssMaxX - ssMinX, ssH = ssMaxY - ssMinY;
    const ssScale = Math.min((ssTarget.x1 - ssTarget.x0) / ssW, (ssTarget.y1 - ssTarget.y0) / ssH) * 0.98;
    const ssCX = (ssMinX + ssMaxX) / 2, ssCY = (ssMinY + ssMaxY) / 2;
    const ssCXPx = (ssTarget.x0 + ssTarget.x1) / 2, ssCYPx = (ssTarget.y0 + ssTarget.y1) / 2;
    const ssPx = p => [ssCXPx + (p[0] - ssCX) * ssScale, ssCYPx - (p[1] - ssCY) * ssScale];
    const southSea = southSeaRings.map(ring => 'M' + ring.map(p => ssPx(p).map(v => v.toFixed(1)).join(',')).join(' ') + ' Z');
    const southSeaBox = { x0: ssTarget.x0, y0: ssTarget.y0, x1: ssTarget.x1, y1: ssTarget.y1 };
    mapCache = { paths, px, W, H, pad, southSea, southSeaBox };
    return mapCache;
  }

  /* ---------- 历史路线（精确途经点 + Google 地球坐标） ---------- */
  const GE = (lat, lng) => `https://earth.google.com/web/@${lat.toFixed(4)},${lng.toFixed(4)},0a,60000d,35y,0h,0t,0r`;
  const ROUTES = [
    { id: 'qinwall', name: '秦长城', emoji: '🧱', stage: 'stage04', color: '#7C4A1A',
      desc: '秦始皇把战国秦、赵、燕长城连成一线，西起临洮、北过阴山、东至辽东。它比今天游客走的明长城更靠北，位置并不重合。',
      stops: [
        { name: '临洮', place: '甘肃', lat: 35.38, lng: 103.86 },
        { name: '九原', place: '内蒙古 · 包头', lat: 40.65, lng: 110.00 },
        { name: '高阙', place: '内蒙古 · 狼山', lat: 41.10, lng: 107.00 },
        { name: '云中', place: '内蒙古 · 托克托', lat: 40.28, lng: 111.20 },
        { name: '造阳', place: '河北北部', lat: 41.20, lng: 115.80 },
        { name: '辽东', place: '辽宁 · 辽阳', lat: 41.27, lng: 123.17 }
      ] },
    { id: 'greatwall', name: '明长城', emoji: '🧱', stage: 'stage10', color: '#B0651D',
      desc: '今天我们看到的长城，主要是明朝修建的：东起山海关、西至嘉峪关。和秦长城不是同一条线。',
      stops: [
        { name: '山海关', place: '河北 · 秦皇岛', lat: 39.97, lng: 119.75 },
        { name: '金山岭', place: '北京 · 密云', lat: 40.68, lng: 117.23 },
        { name: '居庸关', place: '北京 · 昌平', lat: 40.29, lng: 116.07 },
        { name: '八达岭', place: '北京 · 延庆', lat: 40.36, lng: 116.02 },
        { name: '大同', place: '山西', lat: 40.08, lng: 113.30 },
        { name: '雁门关', place: '山西 · 代县', lat: 39.05, lng: 112.85 },
        { name: '偏关', place: '山西', lat: 39.44, lng: 111.50 },
        { name: '榆林', place: '陕西', lat: 38.29, lng: 109.73 },
        { name: '银川', place: '宁夏', lat: 38.49, lng: 106.23 },
        { name: '嘉峪关', place: '甘肃', lat: 39.82, lng: 98.22 }
      ] },
    { id: 'silk', name: '丝绸之路（陆上）', emoji: '🐫', stage: 'stage05', color: '#D9A441',
      desc: '张骞凿空西域后，驼队从长安出发，经河西走廊穿越塔里木盆地，翻越葱岭，抵达中亚、西亚直至地中海东岸，是古代连接东西方最著名的商路。',
      stops: [
        { name: '长安', place: '中国 · 西安', lat: 34.34, lng: 108.94 },
        { name: '天水', place: '中国 · 甘肃', lat: 34.58, lng: 105.72 },
        { name: '兰州', place: '中国 · 甘肃', lat: 36.06, lng: 103.83 },
        { name: '武威', place: '中国 · 甘肃', lat: 37.93, lng: 102.64 },
        { name: '张掖', place: '中国 · 甘肃', lat: 38.93, lng: 100.45 },
        { name: '敦煌', place: '中国 · 甘肃', lat: 40.14, lng: 94.66 },
        { name: '哈密', place: '中国 · 新疆', lat: 42.83, lng: 93.51 },
        { name: '吐鲁番', place: '中国 · 新疆', lat: 42.95, lng: 89.19 },
        { name: '库车', place: '中国 · 新疆', lat: 41.72, lng: 82.96 },
        { name: '喀什', place: '中国 · 新疆', lat: 39.47, lng: 75.99 },
        { name: '撒马尔罕', place: '乌兹别克斯坦', lat: 39.65, lng: 66.90 },
        { name: '巴格达', place: '伊拉克', lat: 33.32, lng: 44.37 },
        { name: '君士坦丁堡', place: '土耳其 · 伊斯坦布尔', lat: 41.01, lng: 28.98 }
      ] },
    { id: 'zhenghe', name: '海上丝路 · 郑和', emoji: '⛵', stage: 'stage10', color: '#2563EB',
      desc: '1405 年起郑和宝船队七下西洋：从太仓刘家港出发，经东南亚、印度洋，最远到达非洲东海岸，访问三十余国，是世界航海史上的壮举。',
      stops: [
        { name: '刘家港', place: '中国 · 江苏太仓', lat: 31.45, lng: 121.13 },
        { name: '泉州', place: '中国 · 福建', lat: 24.91, lng: 118.58 },
        { name: '广州', place: '中国 · 广东', lat: 23.13, lng: 113.26 },
        { name: '占城', place: '越南 · 岘港', lat: 16.07, lng: 108.20 },
        { name: '暹罗', place: '泰国 · 曼谷', lat: 13.75, lng: 100.50 },
        { name: '马六甲', place: '马来西亚 · 马六甲', lat: 2.19, lng: 102.25 },
        { name: '旧港', place: '印度尼西亚 · 巨港', lat: -2.99, lng: 104.75 },
        { name: '锡兰', place: '斯里兰卡 · 科伦坡', lat: 6.93, lng: 79.85 },
        { name: '古里', place: '印度 · 卡利卡特', lat: 11.25, lng: 75.77 },
        { name: '忽鲁谟斯', place: '伊朗 · 霍尔木兹海峡', lat: 27.06, lng: 56.28 },
        { name: '木骨都束', place: '索马里 · 摩加迪沙', lat: 2.04, lng: 45.32 },
        { name: '麻林迪', place: '肯尼亚 · 马林迪', lat: -3.22, lng: 40.10 }
      ] },
    { id: 'longmarch', name: '万里长征', emoji: '⭐', stage: 'stage12', color: '#E11D48',
      desc: '1934 年中央红军从瑞金出发，血战湘江、四渡赤水、巧渡金沙江、飞夺泸定桥，翻雪山过草地，行程两万五千里到达陕北。',
      stops: [
        { name: '瑞金', place: '江西', lat: 25.89, lng: 116.03 },
        { name: '湘江', place: '广西 · 兴安', lat: 25.70, lng: 111.00 },
        { name: '遵义', place: '贵州', lat: 27.73, lng: 106.93 },
        { name: '金沙江', place: '云南 · 皎平渡', lat: 26.70, lng: 102.70 },
        { name: '泸定桥', place: '四川', lat: 29.91, lng: 102.23 },
        { name: '夹金山', place: '四川 · 雪山', lat: 30.90, lng: 102.70 },
        { name: '松潘草地', place: '四川 · 若尔盖', lat: 33.60, lng: 102.90 },
        { name: '吴起镇', place: '陕西', lat: 36.90, lng: 108.20 },
        { name: '延安', place: '陕西', lat: 36.60, lng: 109.49 }
      ] },
    { id: 'canal', name: '京杭大运河', emoji: '🚢', stage: 'stage09', color: '#0F766E',
      desc: '隋朝开凿、元代贯通的京杭大运河，北起北京、南至杭州，全长 1794 公里，是古代南粮北运的黄金水道。',
      stops: [
        { name: '北京', place: '通州', lat: 39.90, lng: 116.40 },
        { name: '天津', place: '天津', lat: 39.13, lng: 117.19 },
        { name: '德州', place: '山东', lat: 37.44, lng: 116.36 },
        { name: '济宁', place: '山东', lat: 35.41, lng: 116.59 },
        { name: '淮安', place: '江苏', lat: 33.50, lng: 119.02 },
        { name: '扬州', place: '江苏', lat: 32.39, lng: 119.41 },
        { name: '苏州', place: '江苏', lat: 31.30, lng: 120.62 },
        { name: '杭州', place: '浙江', lat: 30.29, lng: 120.16 }
      ] }
  ];
  let activeRoute = null;
  let mapSnapYear = null;
  let mapCam = { x: 0, y: 0, w: 980, h: 640 };
  const STAGE_DEFAULT_YEAR = {
    stage01: -3000, stage02: -950, stage03: -260, stage04: -214,
    stage05: -60, stage06: 229, stage07: 669, stage08: 1111,
    stage09: 1330, stage10: 1582, stage11: 1760, stage12: 2026
  };
  const PAL = {
    red: '#E63946', amber: '#E07B00', green: '#1F9D55', olive: '#7A8B1E',
    teal: '#0E9F8A', cyan: '#1BA0C9', blue: '#3B6FD4', purple: '#7C3AED',
    magenta: '#C026A9', rose: '#E0528B', neutral: '#8A7A6B'
  };

  function snapsFor(stageId) {
    if (!stageId || !window.TERRITORIES) return [];
    return window.TERRITORIES.snapshots.filter(s => s.stage === stageId);
  }
  function snapOf(stageId) {
    const list = snapsFor(stageId);
    if (!list.length) return null;
    if (mapSnapYear != null) {
      const hit = list.find(s => s.year === mapSnapYear);
      if (hit) return hit;
    }
    const def = STAGE_DEFAULT_YEAR[stageId];
    return list.find(s => s.year === def) || list[list.length - 1];
  }
  function yearText(y) {
    return y < 0 ? '公元前 ' + (-y) + ' 年' : '公元 ' + y + ' 年';
  }
  function ringPath(ring, px) {
    return 'M' + ring.map(c => px(albersProj(c[0], c[1])).map(v => v.toFixed(1)).join(',')).join(' L') + ' Z';
  }
  function ringAreaKm2(ring) {
    const pts = ring.map(c => albersProj(c[0], c[1]));
    let a = 0;
    for (let i = 0, n = pts.length - 1; i < n; i++) a += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
    return Math.abs(a) / 2 * 6371 * 6371;
  }
  function fmtWanKm2(km2) {
    const wan = km2 / 10000;
    if (wan >= 100) return Math.round(wan) + ' 万平方公里';
    if (wan >= 10) return wan.toFixed(0) + ' 万平方公里';
    return wan.toFixed(1) + ' 万平方公里';
  }

  function normProv(n) {
    return String(n || "").replace(/特别行政区/g, "").replace(/壮族自治区/g, "").replace(/回族自治区/g, "")
      .replace(/维吾尔自治区/g, "").replace(/自治区/g, "").replace(/省/g, "").replace(/市/g, "");
  }
  function buildDynastyLayer(stageId, px, paths) {
    const snap = snapOf(stageId);
    if (!snap) return "";
    let out = "";
    snap.regimes.forEach(reg => {
      const color = PAL[reg.color] || PAL.neutral;
      const fillA = (reg.kind === "neighbor") ? "99" : "C2";
      const want = {};
      (reg.provinces || []).forEach(pn => { want[normProv(pn)] = true; });
      paths.forEach(p => {
        const ok = reg.fillAll ? (!p.extra || want[normProv(p.name)]) : !!want[normProv(p.name)];
        if (!ok) return;
        if (reg.fillAllExcept && reg.fillAllExcept.some(x => (p.name || "").indexOf(x) >= 0)) return;
        out += "<path d=\"" + p.d + "\" fill=\"" + color + fillA + "\" stroke=\"" + color + "\" stroke-width=\"1.8\" stroke-linejoin=\"round\"/>";
      });
      if (reg.capCoord && reg.capCoord.length === 2) {
        const q = px(albersProj(reg.capCoord[0], reg.capCoord[1]));
        out += "<circle cx=\"" + q[0] + "\" cy=\"" + q[1] + "\" r=\"6.5\" fill=\"" + color + "\" stroke=\"#fff\" stroke-width=\"2.4\"/>";
      }
      if (reg.label && reg.label.length === 2) {
        const q = px(albersProj(reg.label[0], reg.label[1]));
        out += "<text x=\"" + q[0] + "\" y=\"" + q[1] + "\" class=\"regime-label\" font-size=\"15\" stroke-width=\"3.2\" fill=\"" + color + "\">" + esc(reg.name) + "</text>";
      }
    });
    return out;
  }
  function insightHtml(stageId) {
    const snap = snapOf(stageId);
    if (!snap) {
      return stageId
        ? "<div class=\"insight-card\"><h4>🤖 智能解读</h4><p>这个时期还没有可以按省对照的国家疆域。底图是亚欧大陆。这个时期还没有按省对照的中原王朝疆域，点位标出故事发生的地方。</p></div>"
        : "<div class=\"insight-card\"><h4>🤖 智能解读</h4><p>浅色底图是亚欧大陆真实国界，中国部分再用省级政区叠上去。点上方朝代，我会按现代省界自动对照该年政权，没涂色的省仍留在底图上，方便看“当时到哪、还没到哪”。</p></div>";
    }
    const main = snap.regimes.find(r => (r.provinces || []).length === Math.max.apply(null, snap.regimes.map(x => (x.provinces || []).length))) || snap.regimes[0];
    const n = (main.provinces || []).length;
    const others = snap.regimes.filter(r => r !== main).map(r => r.name).join("、");
    return "<div class=\"insight-card\">"
      + "<h4>🤖 智能解读 · " + esc(main.name) + "</h4>"
      + "<p class=\"ins-year\">" + yearText(snap.year) + " · " + esc(snap.label) + "</p>"
      + "<p>底图是亚欧大陆。彩色是该年政权，按中国省级政区和邻国国界对照，大约覆盖 " + n + " 个省级政区。</p>"
      + (others ? "<p>同时并立：" + esc(others) + "。</p>" : "")
      + "<p class=\"ins-note\">" + esc(snap.note || "") + "</p>"
      + "<p class=\"ins-src\">省界只是对照网格，不是古代行政区划本身。</p></div>";
  }

  function mapK() { return mapCam.w / 980; }
  function userPx(svg, px) {
    const w = Math.max(240, (svg && svg.clientWidth) || 700);
    return px * mapCam.w / w;
  }
  function spotRadius(active, svg) {
    const r = userPx(svg, 4.8);
    return active ? r * 1.32 : r;
  }
  function applyMapCam() {
    const svg = document.querySelector('#map-svg svg');
    if (!svg) return;
    svg.setAttribute('viewBox', mapCam.x + ' ' + mapCam.y + ' ' + mapCam.w + ' ' + mapCam.h);
    const k = mapK();
    const showText = mapCam.w <= 980 * 0.40;
    const u = function (px) { return userPx(svg, px); };
    const sw = u(2);
    const fs = u(12);
    const halo = u(3);
    const lift = u(14);

    svg.querySelectorAll('.map-spot').forEach(function (g) {
      const on = g.classList.contains('active');
      const circles = g.querySelectorAll('circle');
      if (circles[0]) {
        circles[0].setAttribute('r', spotRadius(on, svg).toFixed(2));
        circles[0].setAttribute('stroke-width', sw.toFixed(2));
      }
      if (circles[1]) circles[1].setAttribute('r', u(14).toFixed(2));
      const t = g.querySelector('.spot-label');
      if (t && circles[0]) {
        t.setAttribute('font-size', fs.toFixed(2));
        t.setAttribute('stroke-width', halo.toFixed(2));
        const cy = parseFloat(circles[0].getAttribute('cy'));
        t.setAttribute('y', (cy - lift).toFixed(1));
      }
    });

    svg.querySelectorAll('.regime-label').forEach(function (el) {
      el.setAttribute('font-size', u(13).toFixed(2));
      el.setAttribute('stroke-width', u(3.2).toFixed(2));
    });

    svg.querySelectorAll('.route-line').forEach(function (el) {
      el.setAttribute('stroke-width', u(5).toFixed(2));
    });
    svg.querySelectorAll('.route-line-dash').forEach(function (el) {
      el.setAttribute('stroke-width', u(2).toFixed(2));
      el.setAttribute('stroke-dasharray', u(6).toFixed(1) + ' ' + u(8).toFixed(1));
    });
    svg.querySelectorAll('.route-dot').forEach(function (el) {
      const isEnd = el.getAttribute('data-end') === '1';
      el.setAttribute('r', u(isEnd ? 6 : 4.2).toFixed(2));
      el.setAttribute('stroke-width', u(2).toFixed(2));
    });
    svg.querySelectorAll('.route-end-label').forEach(function (el) {
      const cy = parseFloat(el.getAttribute('data-cy'));
      el.setAttribute('font-size', u(13).toFixed(2));
      el.setAttribute('stroke-width', halo.toFixed(2));
      if (!isNaN(cy)) el.setAttribute('y', (cy - lift * 1.05).toFixed(1));
    });
    svg.querySelectorAll('.route-stop-label').forEach(function (el) {
      const cy = parseFloat(el.getAttribute('data-cy'));
      el.setAttribute('font-size', fs.toFixed(2));
      el.setAttribute('stroke-width', halo.toFixed(2));
      if (!isNaN(cy)) el.setAttribute('y', (cy - lift).toFixed(1));
    });

    const minDist = u(36);
    const taken = [];
    function hit(x, y) {
      for (let i = 0; i < taken.length; i++) {
        const dx = taken[i][0] - x, dy = taken[i][1] - y;
        if (dx * dx + dy * dy < minDist * minDist) return true;
      }
      return false;
    }
    function take(x, y) { taken.push([x, y]); }

    svg.querySelectorAll('.route-end-label').forEach(function (el) {
      take(parseFloat(el.getAttribute('x')), parseFloat(el.getAttribute('y')));
      el.style.opacity = '1';
    });
    svg.querySelectorAll('.route-stop-label').forEach(function (el) {
      const x = parseFloat(el.getAttribute('x'));
      const y = parseFloat(el.getAttribute('y'));
      const vis = showText && !hit(x, y);
      el.style.opacity = vis ? '1' : '0';
      if (vis) take(x, y);
    });
    svg.querySelectorAll('.regime-label').forEach(function (el) {
      const x = parseFloat(el.getAttribute('x'));
      const y = parseFloat(el.getAttribute('y'));
      const vis = showText && !hit(x, y);
      el.style.opacity = vis ? '1' : '0';
      if (vis) take(x, y);
    });
    const routeOn = !!activeRoute;
    svg.querySelectorAll('.map-spot').forEach(function (g) {
      const t = g.querySelector('.spot-label');
      const c = g.querySelector('circle');
      if (!t || !c) { g.classList.remove('zoomed-label'); return; }
      const x = parseFloat(c.getAttribute('cx'));
      const y = parseFloat(t.getAttribute('y'));
      const force = g.classList.contains('active');
      let auto = false;
      if (force) take(x, y);
      else if (showText && !routeOn && !hit(x, y)) { auto = true; take(x, y); }
      g.classList.toggle('zoomed-label', auto);
    });
  }
  function clampCam() {
    const W = 980, H = 640;
    mapCam.w = Math.min(W, Math.max(90, mapCam.w));
    mapCam.h = mapCam.w * H / W;
    mapCam.x = Math.min(W - mapCam.w, Math.max(0, mapCam.x));
    mapCam.y = Math.min(H - mapCam.h, Math.max(0, mapCam.y));
  }
  function mapZoom(factor, cx, cy) {
    const W = 980, H = 640;
    const px = cx == null ? mapCam.x + mapCam.w / 2 : cx;
    const py = cy == null ? mapCam.y + mapCam.h / 2 : cy;
    const nw = Math.min(W, Math.max(90, mapCam.w * factor));
    const nh = nw * H / W;
    mapCam.x = px - (px - mapCam.x) * (nw / mapCam.w);
    mapCam.y = py - (py - mapCam.y) * (nh / mapCam.h);
    mapCam.w = nw; mapCam.h = nh;
    clampCam(); applyMapCam();
  }
  function mapReset() { mapCam = { x: 0, y: 0, w: 980, h: 640 }; applyMapCam(); }
  function svgPoint(svg, e) {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM();
    if (!m) return null;
    return pt.matrixTransform(m.inverse());
  }
  function bindMapZoom() {
    const svg = document.querySelector('#map-svg svg');
    if (!svg) return;
    svg.style.touchAction = 'none';
    svg.style.userSelect = 'none';
    svg.style.webkitUserSelect = 'none';
    svg.addEventListener('wheel', e => {
      e.preventDefault();
      const p = svgPoint(svg, e); if (!p) return;
      mapZoom(e.deltaY > 0 ? 1.12 : 0.88, p.x, p.y);
    }, { passive: false });
    let drag = null;
    svg.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      drag = { x: e.clientX, y: e.clientY, cx: mapCam.x, cy: mapCam.y, id: e.pointerId, moved: false };
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    });
    svg.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && dx * dx + dy * dy < 36) return;
      drag.moved = true;
      svg.style.cursor = 'grabbing';
      const k = mapCam.w / Math.max(1, svg.clientWidth);
      mapCam.x = drag.cx - dx * k;
      mapCam.y = drag.cy - dy * k;
      clampCam(); applyMapCam();
    });
    svg.addEventListener('click', e => {
      if (window.__mapSuppressClick) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    const end = e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved) {
        window.__mapSuppressClick = true;
        setTimeout(function () { window.__mapSuppressClick = false; }, 0);
      }
      drag = null;
      svg.style.cursor = 'grab';
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.style.cursor = 'grab';
  }


  function renderMap(opts) {
    const stageId = (opts && opts.stage) || null;
    const keepCam = opts && opts.keepCam;
    mapFilterStage = stageId;
    if (!keepCam) { mapSnapYear = (opts && opts.year != null) ? opts.year : (STAGE_DEFAULT_YEAR[stageId] || null); mapReset(); }
    const btns = [{ id: null, name: '🌟 全部' }].concat(STAGES.map(s => ({ id: s.id, name: s.emoji + ' ' + s.name })));
    $('#map-filters').innerHTML = btns.map(b =>
      '<button class="filter-btn ' + ((b.id === stageId) ? 'active' : '') + '" onclick="App.openMap(' + (b.id ? ("'" + b.id + "'") : 'null') + ')">' + esc(b.name) + '</button>'
    ).join('');
    const snaps = snapsFor(stageId);
    const cur = snapOf(stageId);
    $('#map-snaps').innerHTML = snaps.length
      ? ('<span class="route-label">📅 这一年：</span>' + snaps.map(s =>
          '<button class="filter-btn ' + ((cur && cur.year === s.year) ? 'active' : '') + '" onclick="App.openMapYear(\'' + stageId + '\',' + s.year + ')">' + yearText(s.year).replace('公元 ', '').replace('公元前 ', '前') + ' · ' + esc(s.era) + '</button>'
        ).join(''))
      : '';
    $('#map-routes').innerHTML =
      '<span class="route-label">🧭 历史路线：</span>' +
      ROUTES.map(r => '<button class="filter-btn route-btn ' + (activeRoute === r.id ? 'active' : '') + '" style="' + (activeRoute === r.id ? ('background:' + r.color + ';border-color:' + r.color) : '') + '" onclick="App.route(\'' + r.id + '\')">' + r.emoji + ' ' + r.name + '</button>').join('') +
      (activeRoute ? '<button class="filter-btn" onclick="App.route(null)">✖ 关闭路线</button>' : '');
    const { paths, px, W, H, southSea, southSeaBox } = buildMapPaths();
    const palette = ['#F6E7CF', '#EBDDC7', '#F2E3C9', '#EFE0C9', '#F5E9D2'];
    const hasSnap = !!cur;
    const baseOpacity = 0.95;
    const ssW2 = southSeaBox.x1 - southSeaBox.x0, ssH2 = southSeaBox.y1 - southSeaBox.y0;
    const fillSS = !!(cur && cur.regimes.some(r => r.fillSouthSea));
    const svg = '<svg viewBox="' + mapCam.x + ' ' + mapCam.y + ' ' + mapCam.w + ' ' + mapCam.h + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
      '<filter id="spotShadow" x="-80%" y="-80%" width="260%" height="260%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.6" flood-color="#C8452E" flood-opacity="0.55"/></filter>' +
      '<clipPath id="chinaClip">' + paths.map(p => '<path d="' + p.d + '"/>').join('') + '</clipPath>' +
      '</defs>' +
      paths.map((p, i) => '<path d="' + p.d + '" fill="' + (p.extra ? '#E3D2B0' : palette[i % palette.length]) + '" stroke="#B99B6C" stroke-width="1.1" stroke-linejoin="round" opacity="' + baseOpacity + '"/>').join('') +
      '<g id="map-southsea">' +
      southSea.map(d => '<path d="' + d + '" fill="' + (fillSS ? '#E63946B8' : '#E9D9BC') + '" stroke="#B99B6C" stroke-width="1" stroke-linejoin="round" opacity="0.95"/>').join('') +
      '<rect x="' + southSeaBox.x0 + '" y="' + southSeaBox.y0 + '" width="' + ssW2 + '" height="' + ssH2 + '" fill="none" stroke="#B99B6C" stroke-width="1.6" stroke-dasharray="7 5"/>' +
      '<text x="' + (southSeaBox.x0 + ssW2 / 2) + '" y="' + (southSeaBox.y1 + 20) + '" text-anchor="middle" font-size="13" font-weight="700" fill="#8A6D3B">南海诸岛</text>' +
      '</g>' +
      '<g id="map-dynasty" clip-path="url(#chinaClip)">' + buildDynastyLayer(stageId, px, paths) + '</g>' +
      '<g id="map-route-layer"></g>' +
      '<g id="map-spots">' + buildSpots(null, { px, W, H, stageId }) + '</g>' +

      '</svg>';
    $('#map-svg').innerHTML = '<div class="map-canvas" id="map-canvas">' +
      '<div class="map-zoom-btns">' +
      '<button type="button" onclick="App.mapZoom(0.8)" title="放大">＋</button>' +
      '<button type="button" onclick="App.mapZoom(1.25)" title="缩小">－</button>' +
      '<button type="button" onclick="App.mapReset()" title="复位" class="map-reset-btn">复位</button>' +
      '</div>' + svg + '<div class="map-hint">滚轮放大 · 拖动平移 · 双击复位</div></div>';
    bindMapZoom();
    const svgEl = document.querySelector('#map-svg svg');
    if (svgEl) svgEl.addEventListener('dblclick', () => mapReset());
    $('#map-side-title').textContent = stageId
      ? ((window.STAGE_BY_ID[stageId] ? window.STAGE_BY_ID[stageId].emoji + ' ' + window.STAGE_BY_ID[stageId].name : '') + ' · 疆域与足迹')
      : '🗺️ 全部地理足迹';
    const legendRegs = cur ? cur.regimes.map(r =>
      '<span class="lg"><span class="lg-dot" style="background:' + (PAL[r.color] || PAL.neutral) + '"></span>' + esc(r.name) + (r.kind === 'vassal' ? '（羁縻）' : r.kind === 'core' ? '（活动范围）' : '') + '</span>'
    ).join('') : '';
    $('#map-legend-dyn').innerHTML = legendRegs || '<span class="lg"><span class="lg-dot" style="background:#F6E7CF"></span> 今日中国轮廓</span>';
    $('#dynasty-note').innerHTML = insightHtml(stageId);
    if (activeRoute) {
      const route = ROUTES.find(r => r.id === activeRoute);
      if (route && (!stageId || stageId === route.stage)) renderRoute(activeRoute, true);
      else { activeRoute = null; const rl = $('#map-route-layer'); if (rl) rl.innerHTML = ''; $('#route-detail').innerHTML = ''; }
    }
    applyMapCam();
    renderSpotList(stageId);
    if (stageId) learnRecordVisit(stageId);
  }

  function renderMuseumPage() {
    const host = document.getElementById("museum-page");
    if (!host) return;
    const list = window.MUSEUMS || [];
    const filt = document.getElementById("museum-filters");
    if (filt && !filt.dataset.ready) {
      filt.dataset.ready = "1";
      filt.innerHTML = [{id:"all", name:"全部"}].concat(STAGES.map(function(st){ return {id:st.id, name: st.emoji + " " + st.name}; })).map(function(b){
        return '<button class="filter-btn" data-ms="' + b.id + '" onclick="App.filterMuseums(\'' + b.id + '\')">' + esc(b.name) + '</button>';
      }).join("");
    }
    const cur = (filt && filt.dataset.cur) || "all";
    $$("#museum-filters .filter-btn").forEach(b => b.classList.toggle("active", b.getAttribute("data-ms") === cur));
    const show = list.filter(m => cur === "all" || (m.stages || []).indexOf(cur) >= 0);
    host.innerHTML = show.map(m => {
      const st = (m.stages || []).map(id => (window.STAGE_BY_ID[id] || {}).name).filter(Boolean).join(" · ");
      return "<article class=\"museum-card\">"
        + "<div class=\"mc-badge\">🏛️</div>"
        + "<h3>" + esc(m.name) + "</h3>"
        + "<div class=\"mc-city\">" + esc(m.city) + "</div>"
        + (st ? "<div class=\"mc-stage\">" + esc(st) + "</div>" : "")
        + "<p>" + esc(m.desc) + "</p>"
        + "<a class=\"museum-link\" href=\"" + esc(m.url) + "\" target=\"_blank\" rel=\"noopener\">打开官网 ↗</a>"
        + "</article>";
    }).join("");
  }
  function filterMuseums(id) {
    const filt = document.getElementById("museum-filters");
    if (filt) filt.dataset.cur = id;
    renderMuseumPage();
  }
  function openMapYear(stageId, year) {
    mapSnapYear = year;
    renderMap({ stage: stageId, year: year, keepCam: true });
  }
  function toggleMuseums() { showMuseums = !showMuseums; renderMap({ stage: mapFilterStage, keepCam: true }); }

  function renderRoute(id, silent) {
    activeRoute = id;
    if (!id) { $('#map-route-layer').innerHTML = ''; $('#route-detail').innerHTML = ''; applyMapCam(); return; }
    const route = ROUTES.find(r => r.id === id);
    if (!route) return;
    const { px, W, H } = buildMapPaths();
    // 境内可视段：只画投影后落在视口（含边距）内的点
    const vis = route.stops
      .map(s => ({ s, p: px(albersProj(s.lng, s.lat)) }))
      .filter(({ p }) => p[0] >= -30 && p[0] <= W + 30 && p[1] >= -30 && p[1] <= H + 30);
    const d = 'M' + vis.map(({ p }) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
    const start = vis[0], end = vis[vis.length - 1];
    const stopsHtml = route.stops.map((s, i) => `
      <div class="stop-row">
        <span class="stop-no">${i + 1}</span>
        <div class="stop-main">
          <div class="stop-name">${esc(s.name)} <span class="stop-place">${esc(s.place)}</span></div>
          <div class="stop-coord">${s.lat.toFixed(2)}°N, ${s.lng.toFixed(2)}°E</div>
        </div>
        <a class="stop-ge" href="${GE(s.lat, s.lng)}" target="_blank" rel="noopener" title="在 Google 地球查看精确位置">🌍</a>
      </div>`).join('');
    const k0 = mapK();
    $('#map-route-layer').innerHTML = vis.length > 1 ? `
      <path class="route-line route-anim" d="${d}" fill="none" stroke="${route.color}" stroke-width="${Math.max(1.05, 2.9 * k0).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
      <path class="route-line-dash" d="${d}" fill="none" stroke="${route.color}" stroke-width="${Math.max(0.5, 1.2 * k0).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${(3.4 * k0).toFixed(1)} ${(5.2 * k0).toFixed(1)}" opacity="0.9"/>
      ${vis.map(({ p, s }, i) => {
        const isEnd = i === 0 || i === vis.length - 1;
        const r = isEnd ? Math.max(2.0, 3.7 * k0) : Math.max(1.4, 2.5 * k0);
        const stopLabel = isEnd ? '' : '<text class="route-stop-label" pointer-events="none" data-cy="' + p[1].toFixed(1) + '" x="' + p[0].toFixed(1) + '" y="' + (p[1] - 8).toFixed(1) + '" font-size="10" stroke-width="1.8">' + esc(s.name) + '</text>';
        return '<g class="route-stop"><circle class="route-dot" data-end="' + (isEnd ? '1' : '0') + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + r.toFixed(2) + '" fill="' + route.color + '" stroke="#fff" stroke-width="1.4"/>' + stopLabel + '</g>';
      }).join('')}
      ${start ? '<text class="route-end-label" pointer-events="none" data-cy="' + start.p[1].toFixed(1) + '" x="' + start.p[0].toFixed(1) + '" y="' + (start.p[1] - 12).toFixed(1) + '" font-size="11" stroke-width="1.8">起</text>' : ''}
      ${end ? '<text class="route-end-label" pointer-events="none" data-cy="' + end.p[1].toFixed(1) + '" x="' + end.p[0].toFixed(1) + '" y="' + (end.p[1] - 12).toFixed(1) + '" font-size="11" stroke-width="1.8">终</text>' : ''}` : '';

    $('#route-detail').innerHTML = `
      <div class="route-card" style="border-left-color:${route.color}">
        <div class="rc-head"><span class="rc-emoji">${route.emoji}</span>
          <div><div class="rc-name">${esc(route.name)}</div>
          <div class="rc-stage">${esc(window.STAGE_BY_ID[route.stage].name)} · ${esc(window.STAGE_BY_ID[route.stage].range)}</div></div>
        </div>
        <p class="rc-desc">${esc(route.desc)}</p>
        <div class="rc-stops-title">📍 途经点（${route.stops.length} 处）· 点击 🌍 在 Google 地球查看精确位置</div>
        <div class="rc-stops">${stopsHtml}</div>
        <button class="btn-ghost" style="width:100%;margin-top:12px;" onclick="App.openStage('${route.stage}')">📖 去看看这个时代 ›</button>
      </div>`;
    applyMapCam();
    if (!silent) { renderMap({ stage: mapFilterStage }); }
  }

  function collectSpots(stageId) {
    const list = [];
    STAGES.forEach(s => {
      if (stageId && s.id !== stageId) return;
      s.mapSpots.forEach(sp => list.push({ ...sp, stageId: s.id, stageName: s.name, color: s.color }));
    });
    return list;
  }

  function shortSpotName(n) {
    return String(n || '').replace(/（.*?）/g, '').replace(/\(.*?\)/g, '').trim();
  }
  function buildSpots(_, ctx) {
    const list = collectSpots(ctx.stageId);
    const showAll = false;
    return list.map((sp, i) => {
      const p = ctx.px(albersProj(sp.lng, sp.lat));
      const color = sp.color || '#C8452E';
      const label = shortSpotName(sp.name);
      return '<g class="map-spot' + (showAll ? ' show-label' : '') + '" data-stage="' + sp.stageId + '" data-idx="' + i + '" style="cursor:pointer" onclick="App.mapClick(\'' + sp.stageId + '\',' + i + ')">' +
        '<title>' + esc(sp.name) + ' · ' + esc(sp.stageName || '') + '</title>' +
        '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="6" fill="' + color + '" stroke="#fff" stroke-width="2"/>' +
        '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="14" fill="transparent"/>' +
        '<text class="spot-label" pointer-events="none" font-size="11" stroke-width="2.4" x="' + p[0] + '" y="' + (p[1] - 10) + '">' + esc(label) + '</text>' +
      '</g>';
    }).join('');
  }

  function renderSpotList(stageId) {
    const list = collectSpots(stageId);
    renderSpotEntry(null);
    $('#spot-list').innerHTML = list.map((sp, i) => `
      <div class="spot-item" id="spot-item-${i}" onclick="App.mapClick('${sp.stageId}',${i})">
        <div><span class="si-name">📍 ${esc(sp.name)}</span><span class="si-stage">${esc(sp.stageName)}</span></div>
        <div class="si-desc">${esc(sp.desc)}</div>
      </div>`).join('');
  }

  function renderSpotEntry(sp) {
    const host = document.getElementById('spot-entry');
    if (!host) return;
    if (!sp) { host.innerHTML = ''; return; }
    const stage = window.STAGE_BY_ID[sp.stageId] || {};
    const q = encodeURIComponent(shortSpotName(sp.name) || sp.name);
    host.innerHTML =
      '<article class="spot-entry-card">' +
        '<div class="se-kicker">地名词条</div>' +
        '<h4 class="se-name">' + esc(sp.name) + '</h4>' +
        '<div class="se-meta">' + esc(stage.emoji || '') + ' ' + esc(sp.stageName || '') +
          (stage.range ? ' · ' + esc(stage.range) : '') +
          (sp.lat != null ? ' · ' + sp.lat.toFixed(2) + '°N, ' + sp.lng.toFixed(2) + '°E' : '') + '</div>' +
        '<p class="se-desc">' + esc(sp.desc || '这个地点还没有单独介绍，可以先去它所在的时代页看看。') + '</p>' +
        '<div class="se-actions">' +
          '<button type="button" class="btn-ghost se-btn" onclick="App.openStage(\'' + sp.stageId + '\')">📖 打开时代页</button>' +
          '<a class="se-link" href="https://baike.baidu.com/item/' + q + '" target="_blank" rel="noopener">百度百科 ↗</a>' +
          '<a class="se-link" href="' + GE(sp.lat, sp.lng) + '" target="_blank" rel="noopener">🌍 地球定位</a>' +
        '</div>' +
      '</article>';
  }
  function mapClick(stageId, idx) {
    if (window.__mapSuppressClick) return;
    const list = collectSpots(mapFilterStage);
    const sp = list[idx];
    $$('.map-spot').forEach(g => {
      const on = g.dataset.stage === String(stageId) && String(g.dataset.idx) === String(idx);
      g.classList.toggle('active', on);
      const c = g.querySelector('circle');
      if (c) c.setAttribute('r', spotRadius(on, g.ownerSVGElement).toFixed(2));
    });
    const item = $('#spot-item-' + idx);
    if (item) {
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      $$('.spot-item').forEach(x => x.classList.remove('active'));
      item.classList.add('active');
    }
    renderSpotEntry(sp);
  }

  /* ================= 学习小助手：感知 → 分析 → 自动反馈 ================= */
  const LEARN_KEY = 'history_learning_v1';
  function learnData() {
    try {
      const d = JSON.parse(localStorage.getItem(LEARN_KEY));
      if (d && Array.isArray(d.answers)) {
        d.visits = d.visits || {};
        return d;
      }
    } catch (e) { /* ignore */ }
    return { answers: [], visits: {}, start: Date.now() };
  }
  function learnSave(d) {
    try { localStorage.setItem(LEARN_KEY, JSON.stringify(d)); } catch (e) { /* ignore */ }
  }
  /* 感知①：记录一次答题结果 */
  function learnRecordAnswer(stageId, qText, correct) {
    const d = learnData();
    d.answers.push({ stage: stageId, q: qText, ok: !!correct, t: Date.now() });
    if (d.answers.length > 800) d.answers = d.answers.slice(-800);
    learnSave(d);
  }
  /* 感知②：记录一次朝代浏览 */
  function learnRecordVisit(stageId) {
    const d = learnData();
    d.visits[stageId] = (d.visits[stageId] || 0) + 1;
    learnSave(d);
  }
  /* 分析：各朝代掌握度、薄弱点、错题本 */
  function learnAnalyze() {
    const d = learnData();
    const byStage = {};
    d.answers.forEach(a => {
      const b = byStage[a.stage] || (byStage[a.stage] = { total: 0, correct: 0 });
      b.total++;
      if (a.ok) b.correct++;
    });
    const lastOf = {};
    d.answers.forEach(a => { lastOf[a.stage + '|' + a.q] = a; });
    const wrong = Object.keys(lastOf).map(k => lastOf[k]).filter(a => !a.ok);
    const rows = Object.keys(byStage).map(id => ({
      id, total: byStage[id].total, correct: byStage[id].correct,
      rate: byStage[id].correct / byStage[id].total
    })).sort((a, b) => a.rate - b.rate);
    const total = d.answers.length;
    const correct = d.answers.filter(a => a.ok).length;
    return {
      rows, wrong, total, correct,
      rate: total ? correct / total : 0,
      weak: rows[0] || null,
      best: rows[rows.length - 1] || null,
      visits: d.visits
    };
  }

  /* 自动反馈①：首页学习小助手面板 */
  function renderAssistant() {
    const box = $('#assistant');
    if (!box) return;
    const ana = learnAnalyze();
    const visited = Object.keys(ana.visits).length;
    if (!ana.total && !visited) {
      box.innerHTML = `
        <div class="as-card">
          <div class="as-head">🤖 学习小助手</div>
          <div class="as-empty">还没有学习记录～ 先去挑战几道题、逛逛各个朝代，我就能自动为你分析学习情况、推荐复习内容啦！</div>
        </div>`;
      return;
    }
    const rate = Math.round(ana.rate * 100);
    const weakest = ana.weak && ana.weak.total >= 2 ? window.STAGE_BY_ID[ana.weak.id] : null;
    const bestS = ana.best && ana.best.total >= 2 ? window.STAGE_BY_ID[ana.best.id] : null;
    let advice;
    if (!ana.total) {
      advice = `你已经探索过 <b>${visited}</b> 个朝代，去<a class="as-link" onclick="App.showQuiz()">做几道题</a>，我就能分析你的掌握情况～`;
    } else if (weakest && ana.weak.rate < 0.6) {
      advice = `我发现你在 <b class="as-weak">${esc(weakest.emoji + ' ' + weakest.name)}</b> 的正确率只有 <b class="as-weak">${Math.round(ana.weak.rate * 100)}%</b>，建议先回去复习这个朝代的故事和成语哦～`;
    } else if (weakest && ana.weak.rate < 1) {
      advice = `整体表现很棒！<b class="as-weak">${esc(weakest.emoji + ' ' + weakest.name)}</b> 的正确率（${Math.round(ana.weak.rate * 100)}%）相对最低，可以再巩固一下～`;
    } else {
      advice = `太厉害了！你答过的题目<strong>全部正确</strong> 🎉 去挑战更多朝代，或者试试综合挑战保持状态吧！`;
    }
    box.innerHTML = `
      <div class="as-card">
        <div class="as-head">🤖 学习小助手</div>
        <div class="as-stats">
          <span class="as-chip">📝 累计答题 <b>${ana.total}</b> 题</span>
          <span class="as-chip">🎯 正确率 <b>${rate}%</b></span>
          <span class="as-chip">🧭 探索过 <b>${visited}</b> 个朝代</span>
          ${bestS ? `<span class="as-chip">🏆 最擅长 <b>${esc(bestS.name)}</b></span>` : ''}
        </div>
        <div class="as-advice">${advice}</div>
        <div class="as-actions">
          ${weakest ? `<button class="btn-main as-btn" onclick="App.goWeak('${weakest.id}')">📖 去复习 ${esc(weakest.name)}</button>` : ''}
          ${ana.wrong.length ? `<button class="btn-ghost as-btn" onclick="App.quizMode('wrong')">✏️ 错题重练（${ana.wrong.length} 题）</button>` : ''}
          ${ana.total >= 5 ? `<button class="btn-ghost as-btn" onclick="App.showQuiz()">🎯 智能挑战</button>` : ''}
        </div>
      </div>`;
  }
  function goWeak(stageId) {
    openStage(stageId);
  }

  /* ---------- 问答 ---------- */
  function renderQuiz() {
    buildQuizFilters();
    startQuiz('all');
  }

  function buildQuizFilters() {
    const all = [{ id: 'all', name: '🌟 智能挑战' }].concat(STAGES.map(s => ({ id: s.id, name: s.emoji + ' ' + s.name })));
    const ana = learnAnalyze();
    let html = all.map(m => `
      <button class="filter-btn ${m.id === 'all' ? 'active' : ''}" data-qmode="${m.id}" onclick="App.quizMode('${m.id}')">${esc(m.name)}</button>`).join('');
    if (ana.wrong.length) {
      html += `<button class="filter-btn wrong-btn" data-qmode="wrong" onclick="App.quizMode('wrong')">✏️ 错题重练（${ana.wrong.length}）</button>`;
    }
    $('#quiz-modes').innerHTML = html;
  }

  function quizMode(id) {
    $$('#quiz-modes .filter-btn').forEach(b => b.classList.toggle('active', b.dataset.qmode === id));
    startQuiz(id);
  }

  function startQuiz(mode) {
    let questions = [];
    if (mode === 'wrong') {
      // 错题重练：从错题本重建题目
      learnAnalyze().wrong.forEach(a => {
        const s = window.STAGE_BY_ID[a.stage];
        if (!s) return;
        const q = s.quiz.find(x => x.q === a.q);
        if (q) questions.push({ ...q, stageId: s.id, stageName: s.name });
      });
      if (!questions.length) return;
    } else if (mode === 'all') {
      // 智能挑战：按掌握度加权抽题（薄弱朝代出题更多）
      const ana = learnAnalyze();
      const rateOf = {};
      ana.rows.forEach(r => { rateOf[r.id] = r.rate; });
      if (ana.total >= 8 && ana.rows.length >= 2) {
        const pool = STAGES.map(s => ({ s, w: Math.max(1, Math.round((1.1 - (rateOf[s.id] !== undefined ? rateOf[s.id] : 0.6)) * 10)) }));
        const seen = {};
        const target = 12;
        let guard = 0;
        while (questions.length < target && guard < 300) {
          guard++;
          const totalW = pool.reduce((a, p) => a + p.w, 0);
          let r = Math.random() * totalW, pick = pool[0].s;
          for (const p of pool) { r -= p.w; if (r <= 0) { pick = p.s; break; } }
          const q = pick.quiz[Math.floor(Math.random() * pick.quiz.length)];
          const key = pick.id + '|' + q.q;
          if (seen[key]) continue;
          seen[key] = 1;
          questions.push({ ...q, stageId: pick.id, stageName: pick.name });
        }
      }
      if (!questions.length) {
        STAGES.forEach(s => s.quiz.forEach(q => questions.push({ ...q, stageId: s.id, stageName: s.name })));
      }
    } else {
      const s = window.STAGE_BY_ID[mode];
      if (!s) return;
      s.quiz.forEach(q => questions.push({ ...q, stageId: s.id, stageName: s.name }));
    }
    if (!questions.length) return;
    // 打乱顺序
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    quizState = { questions, idx: 0, score: 0, correct: 0, mode };
    $('#quiz-result').classList.remove('show');
    $('#quiz-result').innerHTML = '';
    $('#quiz-card-wrap').style.display = '';
    showQuestion();
  }

  function showQuestion() {
    const st = quizState;
    const q = st.questions[st.idx];
    const total = st.questions.length;
    $('#quiz-bar-fill').style.width = ((st.idx) / total * 100) + '%';
    $('#quiz-progress').textContent = `第 ${st.idx + 1} / ${total} 题 · 得分 ${st.score}`;
    $('#quiz-card').innerHTML = `
      <span class="quiz-stage-tag">${esc(q.stageName)}</span>
      <div class="quiz-q">${esc(q.q)}</div>
      <div class="quiz-opts">
        ${q.options.map((o, i) => `<button class="q-opt" data-i="${i}" onclick="App.answer(${i})">
          <span class="qk">${'ABCD'[i]}</span><span>${esc(o)}</span>
        </button>`).join('')}
      </div>
      <div class="quiz-explain" id="quiz-explain"></div>
      <div class="quiz-actions">
        <button class="btn-main" id="quiz-next" onclick="App.nextQ()" disabled>下一题 →</button>
      </div>`;
  }

  function answer(i) {
    const st = quizState;
    const q = st.questions[st.idx];
    if (st.locked) return;
    st.locked = true;
    learnRecordAnswer(q.stageId, q.q, i === q.answer); // 感知：记录本次作答
    const opts = $$('#quiz-card .q-opt');
    opts.forEach(b => b.classList.add('disabled'));
    if (i === q.answer) {
      opts[i].classList.add('correct');
      st.score += 10;
      st.correct++;
      $('#quiz-explain').innerHTML = `✅ <b>答对啦！</b> +10 分<br>${esc(q.explain)}`;
    } else {
      opts[i].classList.add('wrong');
      opts[q.answer].classList.add('correct');
      $('#quiz-explain').innerHTML = `❌ <b>答错啦</b>，正确答案是 <b>${'ABCD'[q.answer]}</b>。<br>${esc(q.explain)}`;
    }
    $('#quiz-explain').classList.add('show');
    $('#quiz-progress').textContent = `第 ${st.idx + 1} / ${st.questions.length} 题 · 得分 ${st.score}`;
    const btn = $('#quiz-next');
    btn.disabled = false;
    btn.textContent = st.idx === st.questions.length - 1 ? '查看成绩 🏁' : '下一题 →';
  }

  function nextQ() {
    const st = quizState;
    st.idx++;
    st.locked = false;
    if (st.idx >= st.questions.length) return finishQuiz();
    showQuestion();
  }

  function finishQuiz() {
    const st = quizState;
    const total = st.questions.length;
    const pct = Math.round(st.correct / total * 100);
    const stars = pct >= 90 ? '⭐⭐⭐' : pct >= 70 ? '⭐⭐' : pct >= 50 ? '⭐' : '💪';
    const msg = pct >= 90 ? '太厉害了，历史小学霸！' : pct >= 70 ? '很棒的发挥！' : pct >= 50 ? '不错，继续加油！' : '别灰心，多读几遍故事再来！';
    saveScore(st.score, pct);
    $('#quiz-card-wrap').style.display = 'none';
    $('#quiz-result').innerHTML = `
      <div class="big-emoji">🏆</div>
      <h3>${esc(msg)}</h3>
      <div class="stars">${stars}</div>
      <div class="score">${st.score} 分</div>
      <p>答对 ${st.correct} / ${total} 题</p>
      <div class="quiz-actions" style="justify-content:center;margin-top:18px;">
        <button class="btn-main" onclick="App.quizMode('${st.mode}')">🔄 再玩一次</button>
        <button class="btn-ghost" onclick="App.openStage('${st.questions[0].stageId}')">📖 去复习</button>
      </div>
      <div id="quiz-records"></div>`;
    $('#quiz-result').classList.add('show');
    renderRecords();
    $('#quiz-card').innerHTML = '';
    quizState = null; // 防御：防止残留 DOM 上的按钮被误触发
  }

  function saveScore(score, pct) {
    const key = 'history_quiz_best';
    const best = Number(localStorage.getItem(key) || 0);
    if (score > best) localStorage.setItem(key, String(score));
    const recs = JSON.parse(localStorage.getItem('history_quiz_records') || '[]');
    recs.push({ score, pct, date: new Date().toLocaleDateString('zh-CN') });
    localStorage.setItem('history_quiz_records', JSON.stringify(recs.slice(-8)));
  }

  function renderRecords() {
    const best = Number(localStorage.getItem('history_quiz_best') || 0);
    const recs = JSON.parse(localStorage.getItem('history_quiz_records') || '[]');
    $('#quiz-records').innerHTML = `
      <div style="margin-top:20px;padding-top:14px;border-top:1px dashed rgba(200,160,100,.4);">
        <div style="font-size:15px;color:var(--indigo);font-weight:700;margin-bottom:8px;">🏅 最佳成绩：${best} 分</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
          ${recs.slice().reverse().map(r => `<span style="font-size:12px;background:rgba(217,164,65,.14);color:#A0771F;padding:4px 12px;border-radius:999px;">${esc(r.date)} · ${r.score}分 (${r.pct}%)</span>`).join('')}
        </div>
      </div>`;
  }

  /* ---------- 全站搜索 ---------- */
  function search(q) {
    const box = $('#search-result');
    q = (q || '').trim().toLowerCase();
    if (!q) { box.innerHTML = ''; box.classList.remove('show'); return; }
    const results = [];
    STAGES.forEach(s => {
      (s.stories || []).forEach(st => {
        if ((st.title + st.text).toLowerCase().includes(q)) results.push({ icon: '📖', stage: s, title: st.title, text: st.text.slice(0, 42) });
      });
      (s.inventions || []).forEach(inv => {
        if ((inv.title + inv.text).toLowerCase().includes(q)) results.push({ icon: '💡', stage: s, title: inv.title, text: inv.text.slice(0, 42) });
      });
      (s.people || []).forEach(p => {
        if ((p.name + p.text).toLowerCase().includes(q)) results.push({ icon: '👥', stage: s, title: p.name, text: p.text.slice(0, 42) });
      });
      (s.chengyu || []).forEach(c => {
        if ((c.idiom + c.pinyin + c.meaning + c.story).toLowerCase().includes(q)) results.push({ icon: '✒️', stage: s, title: c.idiom + '（成语）', text: c.meaning.slice(0, 42) });
      });
    });
    results.sort((a, b) => a.title.length - b.title.length);
    box.innerHTML = results.slice(0, 12).map(r => `
      <div class="sr-item" onmousedown="App.searchJump('${r.stage.id}')">
        <span class="sr-icon">${r.icon}</span>
        <div class="sr-main"><div class="sr-title">${esc(r.title)}</div><div class="sr-text">${esc(r.text)}</div></div>
        <span class="sr-stage">${esc(r.stage.name)}</span>
      </div>`).join('') || '<div class="sr-empty">没有找到相关内容 🙈 换个词试试～</div>';
    box.classList.add('show');
  }
  function searchClose() { $('#search-result').classList.remove('show'); }
  function searchJump(id) { searchClose(); openStage(id); }

  /* ---------- 侧边快速导航时间轴 ---------- */
  function renderSideNav() {
    $('#side-nav').innerHTML = STAGES.map((s, i) => `
      <div class="sn-item" data-i="${i}" onclick="App.scrollToStage(${i})" title="${esc(s.name)}（${esc(s.range)}）">
        <span class="sn-seq">${i + 1}</span><span class="sn-name">${esc(s.name)}</span>
      </div>`).join('');
    updateSideNav(0);
  }
  function scrollToStage(i) {
    const el = document.querySelectorAll('.tl-item')[i];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    updateSideNav(i);
  }
  function updateSideNav(i) {
    $$('#side-nav .sn-item').forEach((n, j) => n.classList.toggle('active', j === i));
  }
  function initSideNavScroll() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (document.getElementById('view-home').classList.contains('active')) {
          const items = $$('.tl-item');
          const mid = window.scrollY + window.innerHeight * 0.4;
          let cur = 0;
          items.forEach((el, i) => {
            if (el.offsetTop <= mid) cur = i;
          });
          updateSideNav(cur);
        }
      });
    }, { passive: true });
  }

  /* ---------- 导出 API ---------- */
  window.App = {
    goHome: () => showView('home'),
    openStage,
    scrollToStage,
    goWeak,
    openMap: (stageId) => showView('map', { stage: stageId }),
    showMap: () => showView('map', {}),
    showQuiz: () => showView('quiz'),
    mapClick,
    openMapYear,
    showMuseum: () => showView('museum'),
    filterMuseums,
    mapZoom: (f) => mapZoom(f),
    mapReset,
    route: (id) => { renderRoute(id); },
    search, searchClose, searchJump,
    answer,
    nextQ,
    quizMode,
  };

  /* ---------- 初始化 ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initSideNavScroll();
    showView('home');
  });
})();
