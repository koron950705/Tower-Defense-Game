import { STAGES } from './stages.js';
import { TOWER_TYPES } from './tower.js';
import { drawTowerIcon } from './sprites.js';
import { pixelToTile } from './map.js';

export function setupUI(game) {
  const el = (id) => document.getElementById(id);

  const goldValue = el('goldValue');
  const livesValue = el('livesValue');
  const waveValue = el('waveValue');
  const waveStatus = el('waveStatus');
  const muteBtn = el('muteBtn');
  const speedBtn = el('speedBtn');
  const pauseBtn = el('pauseBtn');
  const canvas = el('gameCanvas');
  const gameArea = el('gameArea');
  const buildPanel = el('buildPanel');
  const towerInfoPanel = el('towerInfoPanel');
  const stageList = el('stageList');

  const overlays = {
    titleScreen: el('titleScreen'),
    stageSelectScreen: el('stageSelectScreen'),
    pauseScreen: el('pauseScreen'),
    gameOverScreen: el('gameOverScreen'),
    stageClearScreen: el('stageClearScreen'),
  };

  function showOnly(names) {
    Object.entries(overlays).forEach(([key, node]) => {
      node.classList.toggle('hidden', !names.includes(key));
    });
  }

  function refreshOverlaysForState(state) {
    if (state === 'title') showOnly(['titleScreen']);
    else if (state === 'stageSelect') showOnly(['stageSelectScreen']);
    else if (state === 'playing') showOnly([]);
    else if (state === 'paused') showOnly(['pauseScreen']);
    else if (state === 'gameover') {
      showOnly(['gameOverScreen']);
      el('gameOverStats').textContent = `${game.stage.name} - 第${game.waveManager.currentWave}波で基地が陥落した`;
    } else if (state === 'stageclear') {
      showOnly(['stageClearScreen']);
      el('stageClearStats').textContent = `${game.stage.name} クリア! 残りライフ: ${game.lives}`;
      const idx = STAGES.findIndex((s) => s.id === game.stage.id);
      const hasNext = idx >= 0 && idx + 1 < STAGES.length;
      el('nextStageBtn').classList.toggle('hidden', !hasNext);
    }
  }

  function buildTowerButtons() {
    buildPanel.innerHTML = '';
    Object.entries(TOWER_TYPES).forEach(([type, def]) => {
      const btn = document.createElement('button');
      btn.className = 'towerBtn';
      btn.dataset.type = type;
      btn.title = def.desc;

      const cv = document.createElement('canvas');
      cv.width = 40;
      cv.height = 40;
      drawTowerIcon(cv, type);

      const nameEl = document.createElement('div');
      nameEl.textContent = def.name;
      const costEl = document.createElement('div');
      costEl.className = 'cost';
      costEl.textContent = `$${def.cost}`;

      btn.appendChild(cv);
      btn.appendChild(nameEl);
      btn.appendChild(costEl);
      btn.addEventListener('click', () => {
        game.audio.ensureContext();
        game.setBuildSelection(type);
      });
      buildPanel.appendChild(btn);
    });
  }

  function refreshBuildPanel() {
    Array.from(buildPanel.children).forEach((btn) => {
      const type = btn.dataset.type;
      btn.classList.toggle('selected', game.selectedBuildType === type);
      btn.disabled = game.gold < TOWER_TYPES[type].cost;
    });
  }

  function refreshHud() {
    goldValue.textContent = game.gold;
    livesValue.textContent = game.lives;
    if (game.waveManager) waveValue.textContent = `${game.waveManager.currentWave}/${game.waveManager.totalWaves}`;
    waveStatus.textContent = game.getWaveStatusText();
    refreshBuildPanel();
  }

  function refreshTowerInfoPanel() {
    const t = game.selectedTower;
    if (game.selectedBuildType || !t) {
      towerInfoPanel.classList.add('hidden');
      return;
    }
    const stats = t.getStats();
    const def = TOWER_TYPES[t.type];
    let html = `<h3>${def.name} Lv.${t.level}</h3>`;
    html += `<p>ダメージ: ${Math.round(stats.damage)}</p>`;
    html += `<p>射程: ${Math.round(stats.range)}</p>`;
    html += `<p>連射速度: ${stats.fireRate.toFixed(1)}/秒</p>`;
    if (t.canUpgrade()) {
      html += `<button id="upgradeBtn" ${game.gold < t.upgradeCost() ? 'disabled' : ''}>強化 ($${t.upgradeCost()})</button>`;
    } else {
      html += `<p>最大レベル</p>`;
    }
    html += `<button id="sellBtn">売却 (+$${t.sellValue()})</button>`;
    towerInfoPanel.innerHTML = html;
    towerInfoPanel.classList.remove('hidden');

    // Canvas is CSS-scaled to fit the viewport, so convert tower coordinates
    // (in the canvas's internal 0-800/0-520 space) to on-screen CSS pixels.
    const scaleX = canvas.clientWidth / canvas.width;
    const scaleY = canvas.clientHeight / canvas.height;
    const screenX = t.x * scaleX;
    const screenY = t.y * scaleY;
    const panelWidth = 190;
    let left = screenX + 20 * scaleX;
    const maxLeft = gameArea.clientWidth - panelWidth;
    if (left > maxLeft) left = screenX - 20 * scaleX - panelWidth;
    towerInfoPanel.style.left = `${Math.max(4, left)}px`;
    towerInfoPanel.style.top = `${Math.max(4, screenY - 10 * scaleY)}px`;

    const upgradeBtn = document.getElementById('upgradeBtn');
    if (upgradeBtn) upgradeBtn.addEventListener('click', () => game.upgradeSelectedTower());
    document.getElementById('sellBtn').addEventListener('click', () => game.sellSelectedTower());
  }

  function buildStageList() {
    stageList.innerHTML = '';
    STAGES.forEach((s) => {
      const card = document.createElement('div');
      card.className = 'stageCard';
      card.innerHTML = `<h3>${s.name}</h3><p>${s.desc}</p><p>ウェーブ数: ${s.waveCount}</p><p>初期ライフ: ${s.startLives}</p>`;
      card.addEventListener('click', () => {
        game.audio.ensureContext();
        game.startStage(s.id);
      });
      stageList.appendChild(card);
    });
  }

  function canvasPoint(ev) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (ev.clientX - rect.left) * scaleX, y: (ev.clientY - rect.top) * scaleY };
  }

  canvas.addEventListener('mousemove', (ev) => {
    const { x, y } = canvasPoint(ev);
    game.hoverTile = pixelToTile(x, y);
  });
  canvas.addEventListener('mouseleave', () => {
    game.hoverTile = null;
  });
  canvas.addEventListener('click', (ev) => {
    game.audio.ensureContext();
    const { x, y } = canvasPoint(ev);
    game.handleCanvasClick(x, y);
  });
  canvas.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
    game.cancelBuildSelection();
  });

  muteBtn.addEventListener('click', () => {
    const muted = game.audio.toggleMuted();
    muteBtn.textContent = muted ? '🔇' : '🔊';
  });
  speedBtn.addEventListener('click', () => {
    game.toggleSpeed();
    speedBtn.textContent = `x${game.speedMultiplier}`;
  });
  pauseBtn.addEventListener('click', () => game.togglePause());

  el('titleStartBtn').addEventListener('click', () => {
    game.audio.ensureContext();
    game.setState('stageSelect');
  });
  el('stageSelectBackBtn').addEventListener('click', () => game.setState('title'));
  el('resumeBtn').addEventListener('click', () => game.resume());
  el('pauseToStageSelectBtn').addEventListener('click', () => game.setState('stageSelect'));
  el('retryBtn').addEventListener('click', () => game.retryStage());
  el('gameOverToStageSelectBtn').addEventListener('click', () => game.setState('stageSelect'));
  el('nextStageBtn').addEventListener('click', () => game.nextStage());
  el('stageClearToStageSelectBtn').addEventListener('click', () => game.setState('stageSelect'));

  game.on('hudUpdate', refreshHud);
  game.on('selectionChange', refreshTowerInfoPanel);
  game.on('stateChange', (state) => {
    refreshOverlaysForState(state);
    refreshHud();
    refreshTowerInfoPanel();
  });

  buildTowerButtons();
  buildStageList();
  refreshOverlaysForState(game.state);
  refreshHud();
}
