const UI = {
    heatmapActive: false,

    initSelect() {
        const select = document.getElementById('level-select'); select.innerHTML = '';
        LEVELS.forEach(l => { const opt = document.createElement('option'); opt.value = l.id; opt.textContent = l.name; select.appendChild(opt); });
        select.addEventListener('change', (e) => Game.loadLevel(e.target.value));
    },

    renderLevelInfo(level) {
        document.getElementById('level-select').value = level.id;
        document.getElementById('level-desc').textContent = level.desc;
        document.getElementById('water-budget-display').textContent = level.budget + "u";
        document.getElementById('sprinklers-total').textContent = level.maxSprinklers;
        document.getElementById('field-grid').style.setProperty('--cols', level.cols);
        this.resetPanels();
    },

    renderGrid(level, onCellClick) {
        const grid = document.getElementById('field-grid'); grid.innerHTML = '';
        level.cells.forEach(cell => {
            const div = document.createElement('div');
            div.className = `cell ${cell.blocked ? 'blocked' : ''}`;
            div.id = `cell-${cell.id}`; div.onclick = () => onCellClick(cell.id);
            
            let icon = cell.blocked ? '🪨' : cell.crop;
            let starsHtml = cell.blocked ? '' : '⭐'.repeat(cell.stars || 1);
            
            div.innerHTML = `<div class="heatmap-overlay" id="heat-${cell.id}"></div><div class="stars">${starsHtml}</div><div class="emoji" id="emoji-${cell.id}">${icon}</div>`;
            grid.appendChild(div);
        });
    },

    updateSprinklerCount(count, max) { document.getElementById('sprinklers-left').textContent = count; },

    toggleSprinklerVisual(id, isPlaced) {
        const cell = document.getElementById(`cell-${id}`);
        if (isPlaced) cell.classList.add('has-sprinkler'); else cell.classList.remove('has-sprinkler');
    },

    renderWaterInputs(sprinklers, budget) {
        const sec = document.getElementById('water-allocation-section');
        const container = document.getElementById('sprinkler-inputs');
        const btnSimulate = document.getElementById('btn-simulate');
        container.innerHTML = '';
        
        if (sprinklers.length === 0) { sec.style.display = 'none'; btnSimulate.disabled = true; return; }
        sec.style.display = 'block'; btnSimulate.disabled = false;

        sprinklers.forEach((sp, index) => {
            const wrap = document.createElement('div');
            wrap.className = 'water-input-group';

            const label = document.createElement('label');
            label.textContent = `Sprinkler ${index + 1}`;

            const input = document.createElement('input');
            input.type = 'number'; input.id = `input-sp-${sp.id}`; 
            input.min = "0"; input.max = budget; input.value = "0";
            
            input.addEventListener('input', () => this.validateBudget(sprinklers, budget));

            wrap.appendChild(label);
            wrap.appendChild(input);
            container.appendChild(wrap);
        });
        this.validateBudget(sprinklers, budget);
    },

    validateBudget(sprinklers, budget) {
        let total = 0;
        sprinklers.forEach(sp => { total += parseFloat(document.getElementById(`input-sp-${sp.id}`).value) || 0; });
        const warning = document.getElementById('budget-warning');
        const progress = document.getElementById('budget-progress');
        const btnSimulate = document.getElementById('btn-simulate');
        
        let perc = (total / budget) * 100;
        progress.style.width = Math.min(perc, 100) + '%';

        if (total > budget) {
            warning.textContent = `OVER BUDGET! Reduce by ${total - budget}u`;
            progress.style.background = "#ef4444"; btnSimulate.disabled = true;
        } else {
            warning.textContent = `${total} / ${budget} units assigned`;
            progress.style.background = "var(--primary)"; btnSimulate.disabled = false;
        }
    },

    getWaterAllocations(sprinklers) { return sprinklers.map(sp => ({ id: sp.id, water: parseFloat(document.getElementById(`input-sp-${sp.id}`).value) || 0 })); },

    applySimulationVisuals(cellResults, maxReceived) {
        cellResults.forEach(res => {
            const cell = document.getElementById(`cell-${res.id}`);
            const heat = document.getElementById(`heat-${res.id}`);
            cell.className = cell.className.replace(/sim-\w+/g, ''); 
            
            if(!cell.classList.contains('blocked')) {
                if (res.status === 'under') { cell.classList.add('sim-under'); }
                else if (res.status === 'ideal') { cell.classList.add('sim-ideal'); }
                else if (res.status === 'over') { cell.classList.add('sim-over'); }
            }
            heat.style.setProperty('--water-level', this.heatmapActive ? '0.6' : 0);
        });
    },

    toggleHeatmap(cellResults) {
        this.heatmapActive = !this.heatmapActive;
        this.applySimulationVisuals(cellResults, null);
    },

    showPlayerResults(metrics) {
        document.getElementById('results-panel').style.display = 'block';
        document.getElementById('player-score').textContent = metrics.score + " pts";
        document.getElementById('player-waste').textContent = metrics.waste;
        document.getElementById('player-under').textContent = metrics.underwatered;
        document.getElementById('btn-heatmap').style.display = 'block';
    },

    showOptimizerResults(optMetrics, playerMetrics, insightStr) {
        document.getElementById('opt-results-box').style.display = 'block';
        
        const obj = document.getElementById("opt-score");
        let startTimestamp = null; const duration = 1000;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * optMetrics.score) + " pts"; 
            if (progress < 1) { window.requestAnimationFrame(step); }
        };
        window.requestAnimationFrame(step);

        document.getElementById('opt-waste').textContent = optMetrics.waste;
        document.getElementById('opt-under').textContent = optMetrics.underwatered;
        
        let successRate = 0;
        if (optMetrics.score > 0 && playerMetrics && playerMetrics.score > 0) {
            successRate = Math.round((playerMetrics.score / optMetrics.score) * 100);
        }
        
        let diffHtml = '';
        if (!playerMetrics) {
            diffHtml = `<div class="gap-badge">⚠️ Test Your Strategy First!</div>`;
        } else if (successRate < 100) { 
            diffHtml = `<div class="gap-badge">📉 Success Rate: %${successRate} (Better is possible)</div>`; 
        } else { 
            diffHtml = `<div class="gap-badge success">🏆 Perfect! You found the same result as the algorithm.</div>`; 
        }

        const insight = document.getElementById('ai-insight');
        insight.style.display = 'block'; insight.className = 'analysis-card';
        insight.innerHTML = `<div class="analysis-title">✨ GAMSPy Analysis Report</div>${diffHtml}<div class="insight-text">${insightStr}</div>`;
    },

    async runLoadingSequence() {
        const overlay = document.getElementById('loading-overlay');
        const text = document.getElementById('loading-text');
        overlay.style.display = 'flex';
        
        const phases = ["Analysing 3,400 placement combinations...", "Solving MILP Constraints...", "Global Optimum Target Acquired."];
        for(let phase of phases) { text.textContent = phase; await new Promise(r => setTimeout(r, 600)); }
        overlay.style.display = 'none';
    },

    resetPanels() {
        document.getElementById('results-panel').style.display = 'none';
        document.getElementById('opt-results-box').style.display = 'none';
        document.getElementById('ai-insight').style.display = 'none';
        document.getElementById('water-allocation-section').style.display = 'none';
        document.getElementById('btn-heatmap').style.display = 'none';
        document.getElementById('btn-simulate').disabled = true;
        this.heatmapActive = false;
    }
};