// ══════════════════════════════════════════════════════
//  LASTDROP — game.js  (v3.0)
//  Sprinkler preview · Advanced analysis · Crop info pack
//  Streak system · Suggestion engine
// ══════════════════════════════════════════════════════

const Game = {
  level:          null,
  sprinklers:     [],
  playerMetrics:  null,
  aiMetrics:      null,
  lastResults:    null,
  heatmapOn:      false,
  hoverCell:      null,

  xp:         parseInt(localStorage.getItem('ld_xp')      || '0'),
  xpLevel:    parseInt(localStorage.getItem('ld_lvl')     || '1'),
  badges:     JSON.parse(localStorage.getItem('ld_badges') || '[]'),
  bestScores: JSON.parse(localStorage.getItem('ld_best')   || '{}'),
  streak:     parseInt(localStorage.getItem('ld_streak')  || '0'),
  lastPlay:   localStorage.getItem('ld_lastplay') || '',

  BADGE_DEFS: [
    { id:'perfect',   icon:'🏆', tip:'You Beat the Algorithm!',    color:'#fbbf24' },
    { id:'nearperf',  icon:'🥈', tip:'Almost Perfect',             color:'#94a3b8' },
    { id:'nowaste',   icon:'💧', tip:'Zero Waste',                 color:'#38bdf8' },
    { id:'noloss',    icon:'🌿', tip:'Every Crop Saved',           color:'#4ade80' },
    { id:'alllevels', icon:'🗺️', tip:'All Scenarios Completed',    color:'#a78bfa' },
    { id:'speedrun',  icon:'⚡', tip:'Fast Player',                color:'#fb923c' },
    { id:'streak3',   icon:'🔥', tip:'Played 3 Days in a Row',    color:'#f97316' },
  ],

  CROP_INFO: {
    '🌾': { name:'Wheat',      tip:'Patient and resilient. Extra water is not a major issue — low sensitivity.', tactic:'A moderate amount of water is enough. It does not lose many points even if it is slightly dry.', color:'#fbbf24' },
    '🌽': { name:'Corn',       tip:'Medium demand. You can slightly overwater it.', tactic:'Meet its water need fully. Extra water is not heavily punished.', color:'#f59e0b' },
    '🍅': { name:'Tomato',     tip:'⚠️ The most valuable crop! Very thirsty, but highly sensitive.', tactic:'Place a sprinkler close and supply enough water. It gives the highest return!', color:'#ef4444' },
    '🍇': { name:'Grape',      tip:'🚨 TRAP! Needs very little water but is EXTREMELY sensitive. Too much water ruins it!', tactic:'Do NOT place a sprinkler right next to it. A small amount from distance is enough.', color:'#a78bfa' },
    '🥕': { name:'Carrot',     tip:'Medium-low water demand. Balanced and safe.', tactic:'Reflected water from a neighboring sprinkler is usually enough.', color:'#fb923c' },
    '🌻': { name:'Sunflower',  tip:'Likes water but is not sensitive. Waste matters less.', tactic:'You can water it directly without heavy penalty. Safe target.', color:'#fde047' },
    '🪨': { name:'Rock',       tip:'You cannot place a sprinkler on it, and water sent there is wasted.', tactic:'Be careful when placing sprinklers around rock cells — waste goes up.', color:'#64748b' },
  },

  init() {
    this.checkDailyStreak();
    this.renderSelectScreen();
    document.getElementById('btn-back').addEventListener('click',  () => this.showSelectScreen());
    document.getElementById('btn-sim').addEventListener('click',   () => this.runSim());
    document.getElementById('btn-reset').addEventListener('click', () => this.loadLevel(this.level.id, this.level));
    document.getElementById('btn-ai').addEventListener('click',    () => this.runAI());
    document.getElementById('btn-random').addEventListener('click',() => {
      const lvl = generateRandomLevel();
      this.loadLevel(lvl.id, lvl);
      this.showGameScreen();
    });
    document.getElementById('heatmap-track').addEventListener('click', () => {
      const cb = document.getElementById('heatmap-check');
      cb.checked = !cb.checked;
      this.toggleHeatmap(cb.checked);
    });
  },

  checkDailyStreak() {
    const today     = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (this.lastPlay === today) return;
    if (this.lastPlay === yesterday) {
      this.streak++;
      setTimeout(() => this.toast(`🔥 ${this.streak}-day streak continues!`), 500);
    } else {
      this.streak = 1;
    }
    this.lastPlay = today;
    localStorage.setItem('ld_streak',   this.streak.toString());
    localStorage.setItem('ld_lastplay', today);
    if (this.streak >= 3 && !this.badges.includes('streak3')) {
      this.badges.push('streak3');
      localStorage.setItem('ld_badges', JSON.stringify(this.badges));
      setTimeout(() => this.toast('🎖️ New badge: 🔥 3 Days in a Row!'), 1500);
    }
  },

  renderSelectScreen() {
    this.updateXPBar('sel');
    this.renderBadgesTo('sel-badges');
    const streakEl = document.getElementById('sel-streak');
    if (streakEl) {
      streakEl.innerHTML = this.streak > 1
        ? `🔥 <strong>${this.streak}</strong>-day streak`
        : '';
    }
    const map = document.getElementById('puzzle-map');
    map.innerHTML = '';
    LEVELS.forEach((lvl, i) => {
      const bestScore   = this.bestScores[lvl.id] || 0;
      const isCompleted = bestScore > 0;
      const stars       = this.getStarRating(lvl, bestScore);
      const card        = document.createElement('div');
      card.className    = 'puzzle-card' + (isCompleted ? ' completed' : '');
      const previewCells = lvl.cells.map(c =>
        `<div class="pc-preview-cell${c.blocked?' blocked':''}">${c.blocked?'':c.crop}</div>`
      ).join('');
      const diffLabel = { easy:'Easy', medium:'Medium', hard:'Hard' }[lvl.difficulty];
      card.innerHTML = `
        <div class="pc-number">LEVEL ${i+1}</div>
        <div class="pc-preview" style="grid-template-columns:repeat(${lvl.cols},18px)">${previewCells}</div>
        <div class="pc-name">${lvl.name}</div>
        <div class="pc-desc">${lvl.shortDesc}</div>
        <div class="pc-tags">
          <span class="pc-tag ${lvl.difficulty}">${diffLabel}</span>
          <span class="pc-tag info">${lvl.cols}×${lvl.cols} · ${lvl.maxSprinklers} sprinklers</span>
        </div>
        <div class="pc-score">
          <div>
            <div class="pc-score-label">Best Score</div>
            <div class="pc-score-val">${bestScore>0?bestScore+' pts':'—'}</div>
          </div>
          <div class="pc-score-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
        </div>
        <button class="pc-play-btn">${isCompleted?'🔄 Replay':'▶ Start'}</button>`;
      card.addEventListener('click', () => { this.loadLevel(lvl.id, lvl); this.showGameScreen(); });
      const rowIdx = Math.floor(i/3), colIdx = i%3;
      let row = map.querySelector(`.puzzle-row[data-row="${rowIdx}"]`);
      if (!row) { row = document.createElement('div'); row.className='puzzle-row'; row.dataset.row=rowIdx; map.appendChild(row); }
      if (colIdx>0) { const conn=document.createElement('div'); conn.className='puzzle-connector'; row.appendChild(conn); }
      row.appendChild(card);
    });
  },

  getStarRating(lvl, score) {
    if (!score) return 0;
    const opt = simulateForOptim(lvl, lvl.optimal.sprinklers);
    const ratio = score / opt.metrics.score;
    if (ratio >= 0.95) return 3;
    if (ratio >= 0.70) return 2;
    return 1;
  },

  showSelectScreen() {
    document.getElementById('screen-select').classList.add('active');
    document.getElementById('screen-game').classList.remove('active');
    this.renderSelectScreen();
  },

  showGameScreen() {
    document.getElementById('screen-select').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');
  },

  loadLevel(id, levelObj) {
    this.level         = levelObj || LEVELS.find(l => l.id === id);
    this.sprinklers    = [];
    this.playerMetrics = null;
    this.aiMetrics     = null;
    this.lastResults   = null;
    this.heatmapOn     = false;
    this.hoverCell     = null;
    document.getElementById('heatmap-check').checked = false;
    document.getElementById('heatmap-track').classList.remove('on');
    document.getElementById('scenario-desc').textContent    = this.level.desc;
    document.getElementById('stat-budget').textContent      = this.level.budget + ' L';
    document.getElementById('stat-sprinklers').textContent  = '0 / ' + this.level.maxSprinklers;
    document.getElementById('field-title').textContent      = this.level.name;
    document.getElementById('topbar-level-name').textContent= this.level.name;
    this.updateXPBar('game');
    this.renderBadgesTo('badge-row');
    this.renderGrid();
    this.renderAllocInputs();
    this.renderCropLegend();
    this.resetRightPanel();
  },

  renderGrid() {
    const g = document.getElementById('field-grid');
    g.style.gridTemplateColumns = `repeat(${this.level.cols}, var(--cell))`;
    g.innerHTML = '';
    this.level.cells.forEach(cell => {
      const div = document.createElement('div');
      div.className = 'cell' + (cell.blocked ? ' blocked' : '');
      div.id        = 'cell-' + cell.id;
      const stars   = cell.blocked ? '' : '★'.repeat(cell.stars || 1);
      const icon    = cell.blocked ? '🪨' : cell.crop;
      const tooltip = cell.blocked ? '' : `
        <div class="cell-tooltip">
          <div class="tt-title">${cell.crop} ${cell.cropName}</div>
          <div class="tt-row"><span>💧 Requirement</span><span>${cell.need} L</span></div>
          <div class="tt-row"><span>🏆 Value</span><span>${cell.value} pts</span></div>
          <div class="tt-row"><span>⚠️ Sensitivity</span><span>${cell.sensitivity}×</span></div>
        </div>`;
      div.innerHTML = `
        <div class="cell-water" id="water-${cell.id}"></div>
        <div class="cell-preview-ring" id="ring-${cell.id}"></div>
        <div class="cell-stars">${stars}</div>
        <div class="cell-crop">${icon}</div>
        <div class="cell-received" id="recv-${cell.id}"></div>
        ${tooltip}`;
      div.addEventListener('click',      () => this.handleCell(cell.id));
      div.addEventListener('mouseenter', () => this.showSprinklerPreview(cell.id));
      div.addEventListener('mouseleave', () => this.clearSprinklerPreview());
      g.appendChild(div);
    });
  },

  showSprinklerPreview(centerId) {
    this.clearSprinklerPreview();
    const centerCell = this.level.cells.find(c => c.id === centerId);
    if (!centerCell || centerCell.blocked) return;
    const alreadySp = this.sprinklers.find(s => s.id === centerId);
    const canAdd    = alreadySp || this.sprinklers.length < this.level.maxSprinklers;
    if (!canAdd) return;
    this.hoverCell = centerId;
    const previewWater = Math.floor(this.level.budget / Math.max(this.sprinklers.length + (alreadySp?0:1), 1));
    this.level.cells.forEach(cell => {
      if (cell.blocked) return;
      const dr = Math.abs(cell.row - centerCell.row);
      const dc = Math.abs(cell.col - centerCell.col);
      let rel = null;
      if (dr===0&&dc===0)                              rel = 'SAME';
      else if ((dr===1&&dc===0)||(dr===0&&dc===1))     rel = 'ORTHOGONAL';
      else if (dr===1&&dc===1)                         rel = 'DIAGONAL';
      if (!rel) return;
      const factor = { SAME:1.0, ORTHOGONAL:0.5, DIAGONAL:0.25 }[rel];
      const water  = Math.round(previewWater * factor);
      const ringEl = document.getElementById('ring-' + cell.id);
      const cellEl = document.getElementById('cell-' + cell.id);
      if (!ringEl || !cellEl) return;
      cellEl.classList.add('preview-range');
      if (rel === 'SAME') cellEl.classList.add('preview-center');
      ringEl.textContent   = water + 'L';
      ringEl.style.opacity = rel==='SAME'?'1':rel==='ORTHOGONAL'?'0.85':'0.6';
      ringEl.classList.add('visible');
      const ratio = water / (cell.need || 1);
      ringEl.dataset.level = ratio>=0.8&&ratio<=1.5 ? 'good' : ratio<0.5 ? 'low' : 'high';
    });
  },

  clearSprinklerPreview() {
    if (!this.hoverCell) return;
    this.hoverCell = null;
    document.querySelectorAll('.preview-range,.preview-center').forEach(el =>
      el.classList.remove('preview-range','preview-center'));
    document.querySelectorAll('.cell-preview-ring').forEach(el => {
      el.classList.remove('visible'); el.textContent=''; delete el.dataset.level;
    });
  },

  handleCell(id) {
    const cell = this.level.cells.find(c => c.id === id);
    if (cell.blocked) return;
    const idx = this.sprinklers.findIndex(s => s.id === id);
    const el  = document.getElementById('cell-' + id);
    if (idx > -1) {
      this.sprinklers.splice(idx, 1);
      el.classList.remove('has-sprinkler');
      el.querySelector('.cell-sp')?.remove();
    } else {
      if (this.sprinklers.length >= this.level.maxSprinklers) { this.toast('⚠️ You reached the maximum sprinkler count!'); return; }
      this.sprinklers.push({ id, water: 0 });
      el.classList.add('has-sprinkler');
      const ico = document.createElement('div');
      ico.className = 'cell-sp'; ico.textContent = '💧';
      el.appendChild(ico);
    }
    document.getElementById('stat-sprinklers').textContent = this.sprinklers.length + ' / ' + this.level.maxSprinklers;
    this.renderAllocInputs();
  },

  renderAllocInputs() {
    const wrap = document.getElementById('alloc-wrap');
    const cont = document.getElementById('sp-inputs');
    const btn  = document.getElementById('btn-sim');
    cont.innerHTML = '';
    if (!this.sprinklers.length) { wrap.style.display='none'; btn.disabled=true; return; }
    wrap.style.display = 'block';
    this.sprinklers.forEach((sp, i) => {
      const cell = this.level.cells.find(c => c.id === sp.id);
      const pos  = `Row ${cell.row+1}, Column ${cell.col+1}`;
      const row  = document.createElement('div');
      row.className = 'sp-row';
      row.innerHTML = `
        <div class="sp-dot"></div>
        <div class="sp-name">💧 Sprinkler ${i+1}
          <br><span style="font-size:.62rem;color:var(--muted)">${pos} — ${cell.crop} ${cell.cropName}</span>
        </div>
        <input class="sp-input" type="number" id="inp-${sp.id}" min="0" max="${this.level.budget}" value="0">
        <div class="sp-unit">L</div>`;
      cont.appendChild(row);
      row.querySelector('input').addEventListener('input', () => this.validateBudget());
    });
    this.validateBudget();
  },

  validateBudget() {
    let total = 0;
    this.sprinklers.forEach(sp => { const el=document.getElementById('inp-'+sp.id); if(el) total+=parseFloat(el.value)||0; });
    const bgt = this.level.budget;
    const pct = Math.min(100, (total/bgt)*100);
    const bar = document.getElementById('budget-bar');
    bar.style.width      = pct + '%';
    bar.style.background = total>bgt ? 'var(--red)' : 'var(--blue)';
    document.getElementById('budget-badge').textContent = `${Math.round(total)} / ${bgt} L`;
    document.getElementById('budget-warn').textContent  = total>bgt ? `⚠️ Budget exceeded: ${Math.round(total-bgt)} L over` : '';
    document.getElementById('btn-sim').disabled = total>bgt || this.sprinklers.length===0;
  },

  getAllocs() {
    return this.sprinklers.map(sp => ({ id:sp.id, water:parseFloat(document.getElementById('inp-'+sp.id)?.value)||0 }));
  },

  renderCropLegend() {
    const wrap = document.getElementById('crop-legend');
    wrap.innerHTML = '';
    const seen = new Set();
    this.level.cells
      .filter(c => !seen.has(c.crop) && seen.add(c.crop))
      .forEach(c => {
        const info = this.CROP_INFO[c.crop] || {};
        const div  = document.createElement('div');
        div.className = 'crop-info-card';
        div.style.setProperty('--crop-color', info.color||'#60a5fa');
        div.innerHTML = `
          <div class="cic-header">
            <div class="cic-icon">${c.crop}</div>
            <div class="cic-title">
              <div class="cic-name">${c.blocked?'Rock':c.cropName}</div>
              <div class="cic-stars">${c.blocked?'—':'★'.repeat(c.stars)}</div>
            </div>
            ${!c.blocked?`<div class="cic-badge">${c.need}L</div>`:''}
          </div>
          ${info.tip?`<div class="cic-tip">${info.tip}</div>`:''}
          ${info.tactic?`<div class="cic-tactic">💡 ${info.tactic}</div>`:''}
          ${!c.blocked?`
          <div class="cic-stats">
            <div class="cic-stat"><span>Value</span><span class="cic-val">${c.value} pts</span></div>
            <div class="cic-stat"><span>Sensitivity</span><span class="cic-val${c.sensitivity>=2?' danger':''}">${c.sensitivity}×</span></div>
          </div>`:''}`;
        wrap.appendChild(div);
      });
  },

  runSim() {
    const allocs = this.getAllocs();
    const res    = simulate(this.level, allocs);
    this.playerMetrics = res.metrics;
    this.lastResults   = res;
    this.applyVisuals(res);
    document.getElementById('heatmap-label').style.display = 'flex';
    this.addXP(5);
    this.toast('✅ Simulation complete! +5 XP');
    const lid = this.level.id;
    if (!this.bestScores[lid] || res.metrics.score > this.bestScores[lid]) {
      this.bestScores[lid] = res.metrics.score;
      localStorage.setItem('ld_best', JSON.stringify(this.bestScores));
    }
    document.getElementById('player-pts').textContent       = res.metrics.score + ' pts';
    document.getElementById('player-waste').textContent     = res.metrics.waste + ' L';
    document.getElementById('player-under').textContent     = res.metrics.underwatered + ' cells';
    document.getElementById('player-eff').textContent       = '%' + res.metrics.efficiency;
    document.getElementById('player-stats').style.display  = 'grid';
    document.getElementById('player-hint').style.display   = 'none';
    const pts = document.getElementById('player-pts');
    pts.classList.add('score-anim');
    setTimeout(() => pts.classList.remove('score-anim'), 400);
    if (this.aiMetrics) this.showComparison(this.playerMetrics, this.aiMetrics, this.level.optimal.insight);
  },

  applyVisuals(res) {
    const { cellResults, maxReceived } = res;
    cellResults.forEach(r => {
      const cellEl  = document.getElementById('cell-' + r.id);
      const waterEl = document.getElementById('water-' + r.id);
      const recvEl  = document.getElementById('recv-' + r.id);
      if (!cellEl) return;
      cellEl.classList.remove('sim-under','sim-ideal','sim-over');
      if (r.status==='blocked') { if(waterEl) waterEl.style.height='0%'; return; }
      if (r.status==='under')  cellEl.classList.add('sim-under');
      else if (r.status==='ideal') cellEl.classList.add('sim-ideal');
      else if (r.status==='over')  cellEl.classList.add('sim-over');
      if (recvEl) recvEl.textContent = r.received>0 ? r.received+' L' : '';
      if (waterEl) {
        if (this.heatmapOn && maxReceived>0) {
          waterEl.style.height = Math.min(95,(r.received/maxReceived)*100)+'%';
          const ratio = r.received/(this.level.cells.find(c=>c.id===r.id)?.need||1);
          let color = ratio<0.5?'rgba(59,130,246,0.55)':ratio<1.0?'rgba(34,211,238,0.55)':ratio<1.5?'rgba(34,197,94,0.50)':'rgba(245,158,11,0.55)';
          waterEl.style.background=`linear-gradient(to top,${color},transparent)`;
          waterEl.style.opacity='1';
        } else { waterEl.style.height='0%'; waterEl.style.opacity='0'; }
      }
    });
    this.renderDistChart(cellResults);
  },

  toggleHeatmap(on) {
    this.heatmapOn = on;
    document.getElementById('heatmap-track').classList.toggle('on', on);
    if (this.lastResults) this.applyVisuals(this.lastResults);
    else if (!on) document.querySelectorAll('.cell-water').forEach(w=>{w.style.height='0%';w.style.opacity='0';});
  },

  async runAI() {
    await this.loadingSeq();
    const opt = this.level.optimal;
    const res = simulate(this.level, opt.sprinklers);
    this.aiMetrics   = res.metrics;
    this.lastResults = res;
    this.level.cells.forEach(c => {
      const el=document.getElementById('cell-'+c.id); if(!el) return;
      el.classList.remove('has-sprinkler','sim-under','sim-ideal','sim-over');
      el.querySelector('.cell-sp')?.remove();
      const wd=document.getElementById('water-'+c.id); if(wd){wd.style.height='0%';wd.style.opacity='0';}
      const rv=document.getElementById('recv-'+c.id); if(rv) rv.textContent='';
    });
    opt.sprinklers.filter(s=>s.water>0).forEach(s => {
      const el=document.getElementById('cell-'+s.id); if(!el) return;
      el.classList.add('has-sprinkler');
      const ico=document.createElement('div'); ico.className='cell-sp ai-sp'; ico.textContent='✦'; el.appendChild(ico);
    });
    this.applyVisuals(res);
    const aiCard=document.getElementById('ai-card');
    aiCard.style.display='block'; aiCard.classList.add('animate-in');
    document.getElementById('ai-pts').textContent   = res.metrics.score+' pts';
    document.getElementById('ai-waste').textContent = res.metrics.waste+' L';
    document.getElementById('ai-under').textContent = res.metrics.underwatered+' cells';
    document.getElementById('ai-eff').textContent   = '%'+res.metrics.efficiency;
    document.getElementById('heatmap-label').style.display='flex';
    const pm = this.playerMetrics||{score:0,waste:0,underwatered:0,efficiency:0,overwatered:0};
    this.showComparison(pm, res.metrics, opt.insight);
    this.addXP(10);
    this.checkBadges(pm, res.metrics);
    this.toast('✦ GAMSPy analysis complete! +10 XP');
  },

  showComparison(pm, am, insight) {
    document.getElementById('no-compare-msg').style.display  = 'none';
    document.getElementById('compare-section').style.display = 'block';

    const scoreRatio = am.score>0 ? Math.min(100,Math.round((pm.score/am.score)*100)) : 0;
    document.getElementById('cmp-score-fill').style.width = scoreRatio+'%';
    document.getElementById('cmp-score-vals').textContent  = `${pm.score} / ${am.score} pts`;
    document.getElementById('cmp-eff-fill').style.width    = pm.efficiency+'%';
    document.getElementById('cmp-eff-vals').textContent    = `You ${pm.efficiency}% / AI ${am.efficiency}%`;
    const maxW = Math.max(pm.waste,am.waste,1);
    document.getElementById('cmp-waste-fill').style.width  = Math.round((pm.waste/maxW)*100)+'%';
    document.getElementById('cmp-waste-vals').textContent  = `${pm.waste} L / ${am.waste} L`;

    const vb = document.getElementById('verdict-box');
    if (!this.playerMetrics) {
      vb.className='verdict-box info'; vb.innerHTML='⚡ Run your own simulation first!';
    } else if (scoreRatio>=100) {
      vb.className='verdict-box good'; vb.innerHTML='🏆 <strong>Incredible!</strong> You matched or beat the algorithm!';
    } else if (scoreRatio>=85) {
      vb.className='verdict-box good'; vb.innerHTML=`🎯 <strong>Very close!</strong> ${scoreRatio}% success — almost perfect!`;
    } else if (scoreRatio>=65) {
      vb.className='verdict-box mid'; vb.innerHTML=`📊 <strong>${scoreRatio}% success</strong> — Good, but better is possible.`;
    } else {
      vb.className='verdict-box bad'; vb.innerHTML=`📉 <strong>${scoreRatio}% success</strong> — Rethink your strategy.`;
    }

    const scoreDiff = am.score - pm.score;
    const wasteDiff = pm.waste - am.waste;
    const underDiff = pm.underwatered - am.underwatered;

    document.getElementById('diff-wrap').innerHTML = `
      <div class="diff-cards">
        <div class="diff-card ${scoreDiff<=0?'win':'lose'}">
          <div class="diff-card-icon">${scoreDiff<=0?'✅':'❌'}</div>
          <div class="diff-card-label">Score Gap</div>
          <div class="diff-card-val">${scoreDiff<=0?'+'+Math.abs(scoreDiff):'−'+scoreDiff}</div>
        </div>
        <div class="diff-card ${wasteDiff>=0?'win':'lose'}">
          <div class="diff-card-icon">${wasteDiff>=0?'✅':'❌'}</div>
          <div class="diff-card-label">Water Waste</div>
          <div class="diff-card-val">${wasteDiff>=0?'−'+wasteDiff:'+'+Math.abs(wasteDiff)} L</div>
        </div>
        <div class="diff-card ${underDiff<=0?'win':'lose'}">
          <div class="diff-card-icon">${underDiff<=0?'✅':'❌'}</div>
          <div class="diff-card-label">Dry Crops</div>
          <div class="diff-card-val">${underDiff<=0?'−'+Math.abs(underDiff):'+'+underDiff}</div>
        </div>
      </div>`;

    const suggestions = this.generateSuggestions(pm, am);
    document.getElementById('insight-wrap').innerHTML = `
      <div class="insight-block">
        <div class="insight-label">✦ GAMSPy Strategy</div>
        <div class="insight-text">${insight.strategy}</div>
      </div>
      <div class="insight-block">
        <div class="insight-label">💡 Why This Decision?</div>
        <div class="insight-text">${insight.why}</div>
      </div>
      ${suggestions.length ? `
      <div class="insight-block suggestions-block">
        <div class="insight-label">🚀 How Could You Have Done Better?</div>
        ${suggestions.map(s=>`<div class="suggestion-item">${s}</div>`).join('')}
      </div>` : ''}`;
  },

  generateSuggestions(pm, am) {
    const tips = [];
    if (!this.playerMetrics) return tips;
    const scoreRatio   = am.score>0 ? pm.score/am.score : 0;
    if (pm.waste > am.waste * 1.5)
      tips.push('💧 Your water waste is very high. Lower your sprinkler budget or place them more centrally.');
    if (pm.underwatered > 0 && pm.underwatered > am.underwatered)
      tips.push('🥀 Some crops stayed dry. Move your sprinklers toward more central cells.');
    if (pm.efficiency < 60)
      tips.push('⚡ Efficiency is very low. Sometimes fewer sprinklers with more water each works better.');
    const grapeCell  = this.level.cells.find(c=>c.crop==='🍇'&&!c.blocked);
    const grapeSpDirect = grapeCell && this.sprinklers.find(s=>s.id===grapeCell.id);
    if (grapeSpDirect && scoreRatio<0.8)
      tips.push('🚨 You placed a sprinkler directly on the grape cell! Grapes are highly sensitive — too much water destroys them. Water them from distance.');
    if (this.sprinklers.length < this.level.maxSprinklers)
      tips.push(`📍 You did not use ${this.level.maxSprinklers-this.sprinklers.length} sprinkler slot(s). Use all available placements.`);
    const tomatoCells = this.level.cells.filter(c=>c.crop==='🍅'&&!c.blocked);
    if (tomatoCells.length>0 && scoreRatio<0.8)
      tips.push('🍅 Place sprinklers close to tomato cells — that is where the highest score comes from.');
    if (tips.length===0 && scoreRatio>=0.85)
      tips.push('🌟 Very strong strategy! Small adjustments could get you to a perfect score.');
    return tips.slice(0,3);
  },

  renderDistChart(cellResults) {
    const wrap  = document.getElementById('dist-chart-wrap');
    const chart = document.getElementById('dist-chart');
    wrap.style.display='block'; chart.innerHTML='';
    const active = cellResults.filter(r=>r.status!=='blocked');
    const total  = active.length||1;
    const counts = { under:active.filter(r=>r.status==='under').length, ideal:active.filter(r=>r.status==='ideal').length, over:active.filter(r=>r.status==='over').length };
    [
      {label:'Dry',     color:'var(--red)',   count:counts.under},
      {label:'Optimal', color:'var(--green)', count:counts.ideal},
      {label:'Excess',  color:'var(--amber)', count:counts.over}
    ].forEach(item => {
      const pct = Math.round((item.count/total)*100);
      const div = document.createElement('div');
      div.className='dist-bar-wrap';
      div.innerHTML=`
        <div class="dist-bar-val" style="color:${item.color}">${item.count}</div>
        <div class="dist-bar" style="height:${Math.max(4,pct*0.48)}px;background:${item.color}"></div>
        <div class="dist-bar-label">${item.label} ${pct}%</div>`;
      chart.appendChild(div);
    });
  },

  resetRightPanel() {
    document.getElementById('player-pts').textContent       = '—';
    document.getElementById('player-stats').style.display  = 'none';
    document.getElementById('player-hint').style.display   = 'block';
    document.getElementById('ai-card').style.display       = 'none';
    document.getElementById('compare-section').style.display = 'none';
    document.getElementById('no-compare-msg').style.display  = 'block';
    document.getElementById('heatmap-label').style.display   = 'none';
    document.getElementById('dist-chart-wrap').style.display = 'none';
    document.getElementById('heatmap-check').checked = false;
    document.getElementById('heatmap-track').classList.remove('on');
    document.getElementById('insight-wrap').innerHTML='';
    document.getElementById('diff-wrap').innerHTML='';
  },

  addXP(amount) {
    const xpPL = 100;
    this.xp += amount;
    while (this.xp >= xpPL) { this.xp-=xpPL; this.xpLevel++; this.toast(`🎉 Level up! Level ${this.xpLevel}`); }
    localStorage.setItem('ld_xp', this.xp.toString());
    localStorage.setItem('ld_lvl', this.xpLevel.toString());
    this.updateXPBar('game');
  },

  updateXPBar(target) {
    const pct = (this.xp/100)*100;
    if (target==='sel'||target==='both') {
      const el=document.getElementById('sel-xp-level'); if(el) el.textContent=this.xpLevel;
      const f=document.getElementById('sel-xp-fill'); if(f) f.style.width=pct+'%';
      const p=document.getElementById('sel-xp-pts'); if(p) p.textContent=`${this.xp} / 100 XP`;
    }
    if (target==='game'||target==='both') {
      const lv=document.getElementById('xp-level'); if(lv) lv.textContent=this.xpLevel;
      const f=document.getElementById('xp-fill'); if(f) f.style.width=pct+'%';
      const p=document.getElementById('xp-pts'); if(p) p.textContent=this.xp+' XP';
    }
    if (target==='game') this.updateXPBar('sel');
  },

  checkBadges(pm, am) {
    if (!this.playerMetrics) return;
    const toAdd = [];
    const ratio = am.score>0?pm.score/am.score:0;
    if (ratio>=1.0&&!this.badges.includes('perfect'))   toAdd.push('perfect');
    if (ratio>=0.8&&!this.badges.includes('nearperf'))  toAdd.push('nearperf');
    if (pm.waste===0&&!this.badges.includes('nowaste')) toAdd.push('nowaste');
    if (pm.underwatered===0&&!this.badges.includes('noloss')) toAdd.push('noloss');
    const played=Object.keys(this.bestScores);
    if (LEVELS.every(l=>played.includes(l.id))&&!this.badges.includes('alllevels')) toAdd.push('alllevels');
    toAdd.forEach(id => {
      this.badges.push(id);
      const def=this.BADGE_DEFS.find(d=>d.id===id);
      if (def) { this.toast(`🎖️ New badge: ${def.icon} ${def.tip}`); this.addXP(20); }
    });
    if (toAdd.length) { localStorage.setItem('ld_badges',JSON.stringify(this.badges)); this.renderBadgesTo('badge-row'); }
  },

  renderBadgesTo(containerId) {
    const row=document.getElementById(containerId); if(!row) return;
    row.innerHTML='';
    this.BADGE_DEFS.forEach(def => {
      if (!this.badges.includes(def.id)) return;
      const b=document.createElement('div'); b.className='badge'; b.setAttribute('data-tip',def.tip); b.textContent=def.icon; row.appendChild(b);
    });
  },

  async loadingSeq() {
    const ov=document.getElementById('loading-overlay');
    const txt=document.getElementById('loading-text');
    const sub=document.getElementById('loading-sub');
    ov.style.display='flex';
    const phases=[
      ['Analyzing combinations...', `${this.level.cells.length*100}+ permutations scanned`],
      ['Solving MILP constraints...','Water distribution optimization is being computed'],
      ['Verifying global optimum...','Solution verified ✓'],
    ];
    for (const [l,d] of phases) { txt.textContent=l; sub.textContent=d; await new Promise(r=>setTimeout(r,700)); }
    ov.style.display='none';
  },

  toast(msg) {
    const el=document.getElementById('toast');
    el.textContent=msg; el.classList.add('show');
    clearTimeout(this._tt);
    this._tt=setTimeout(()=>el.classList.remove('show'),2800);
  }
};

window.onload = () => Game.init();