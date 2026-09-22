import { STAGES, getStageById } from './stages.js';
import { TILE_SIZE, tileCenter, pathToWaypoints, computePathTiles, pixelToTile, drawGrid, generateDecorations, isBuildable } from './map.js';
import { Tower, TOWER_TYPES } from './tower.js';
import { Projectile } from './projectile.js';
import { WaveManager } from './wave.js';
import { drawExplosion, drawRangeCircle } from './sprites.js';
import { AudioManager } from './audio.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.audio = new AudioManager();

    this.state = 'title';
    this.stage = null;
    this.pathTiles = new Set();
    this.waypoints = [];
    this.decorations = [];
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.effects = [];
    this.waveManager = null;

    this.gold = 0;
    this.lives = 0;
    this.selectedBuildType = null;
    this.selectedTower = null;
    this.hoverTile = null;
    this.speedMultiplier = 1;
    this.interWaveTimer = null;
    this.lastTimestamp = null;

    this.listeners = {};
  }

  on(event, cb) {
    (this.listeners[event] = this.listeners[event] || []).push(cb);
  }

  emit(event, payload) {
    (this.listeners[event] || []).forEach((cb) => cb(payload));
  }

  setState(state) {
    this.state = state;
    this.emit('stateChange', state);
  }

  startStage(stageId) {
    const stage = getStageById(stageId);
    this.stage = stage;
    this.canvas.width = stage.cols * TILE_SIZE;
    this.canvas.height = stage.rows * TILE_SIZE;
    this.pathTiles = computePathTiles(stage.path);
    this.waypoints = pathToWaypoints(stage.path);
    this.decorations = generateDecorations(stage.cols, stage.rows, this.pathTiles, stage.theme);
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.effects = [];
    this.gold = stage.startGold;
    this.lives = stage.startLives;
    this.selectedBuildType = null;
    this.selectedTower = null;
    this.waveManager = new WaveManager(this.waypoints, stage.waveCount);
    this.interWaveTimer = 2;
    this.speedMultiplier = 1;
    this.setState('playing');
    this.audio.startBgm();
    this.emit('hudUpdate');
  }

  retryStage() {
    this.startStage(this.stage.id);
  }

  nextStage() {
    const idx = STAGES.findIndex((s) => s.id === this.stage.id);
    const next = STAGES[idx + 1];
    if (next) this.startStage(next.id);
    else this.setState('stageSelect');
  }

  pause() {
    if (this.state !== 'playing') return;
    this.setState('paused');
  }

  resume() {
    if (this.state !== 'paused') return;
    this.setState('playing');
  }

  togglePause() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
  }

  toggleSpeed() {
    this.speedMultiplier = this.speedMultiplier === 1 ? 2 : 1;
    this.emit('hudUpdate');
  }

  setBuildSelection(type) {
    this.selectedTower = null;
    this.selectedBuildType = this.selectedBuildType === type ? null : type;
    this.emit('selectionChange');
  }

  cancelBuildSelection() {
    if (this.selectedBuildType) {
      this.selectedBuildType = null;
      this.emit('selectionChange');
    }
  }

  handleCanvasClick(px, py) {
    if (this.state !== 'playing') return;
    const { col, row } = pixelToTile(px, py);
    if (this.selectedBuildType) {
      this.tryPlaceTower(col, row, this.selectedBuildType);
      return;
    }
    const tower = this.towers.find((t) => t.col === col && t.row === row);
    this.selectedTower = tower || null;
    this.emit('selectionChange');
  }

  tryPlaceTower(col, row, type) {
    if (!isBuildable(col, row, this.stage, this.pathTiles, this.towers)) {
      this.audio.playError();
      return;
    }
    const cost = TOWER_TYPES[type].cost;
    if (this.gold < cost) {
      this.audio.playError();
      return;
    }
    this.gold -= cost;
    const center = tileCenter(col, row);
    const tower = new Tower(type, col, row, center);
    this.towers.push(tower);
    this.selectedBuildType = null;
    this.audio.playClick();
    this.emit('hudUpdate');
    this.emit('selectionChange');
  }

  upgradeSelectedTower() {
    const t = this.selectedTower;
    if (!t || !t.canUpgrade()) return;
    const cost = t.upgradeCost();
    if (this.gold < cost) {
      this.audio.playError();
      return;
    }
    this.gold -= cost;
    t.upgrade();
    this.audio.playClick();
    this.emit('hudUpdate');
    this.emit('selectionChange');
  }

  sellSelectedTower() {
    const t = this.selectedTower;
    if (!t) return;
    this.gold += t.sellValue();
    this.towers = this.towers.filter((x) => x !== t);
    this.selectedTower = null;
    this.audio.playClick();
    this.emit('hudUpdate');
    this.emit('selectionChange');
  }

  spawnProjectile(opts) {
    this.projectiles.push(new Projectile(opts));
    let kind = 'mg';
    if (opts.visual === 'shell') kind = 'mortar';
    else if (opts.visual === 'rocket') kind = 'rocket';
    else if (opts.damageType === 'piercing') kind = 'sniper';
    else if (opts.damageType === 'antiTank') kind = 'at';
    this.audio.playShoot(kind);
  }

  getWaveStatusText() {
    if (!this.waveManager) return '';
    if (this.waveManager.waveActive) return `第${this.waveManager.currentWave}波 進行中`;
    if (!this.waveManager.hasNextWave() && this.enemies.length === 0) return 'クリア!';
    if (this.interWaveTimer !== null) return `次の波まで ${Math.ceil(this.interWaveTimer)}秒`;
    return '';
  }

  update(dt) {
    if (this.state !== 'playing') return;
    const scaledDt = dt * this.speedMultiplier;

    if (!this.waveManager.waveActive && this.enemies.length === 0 && this.waveManager.hasNextWave()) {
      if (this.interWaveTimer === null) this.interWaveTimer = 3;
      this.interWaveTimer -= scaledDt;
      if (this.interWaveTimer <= 0) {
        this.waveManager.startNextWave();
        this.interWaveTimer = null;
        this.audio.playWaveStart();
      }
    }

    this.waveManager.update(scaledDt, (enemy) => this.enemies.push(enemy));

    this.towers.forEach((t) => t.update(scaledDt, this.enemies, (opts) => this.spawnProjectile(opts)));

    this.projectiles.forEach((p) => p.update(scaledDt));
    this.projectiles.forEach((p) => {
      if (!p.done || !p.impact) return;
      if (p.splash > 0) {
        this.applySplashDamage(p.impact.x, p.impact.y, p.splash, p.damage, p.damageType);
        this.effects.push({ x: p.impact.x, y: p.impact.y, age: 0, duration: 0.35, maxRadius: p.splash });
        this.audio.playExplosion();
      } else {
        this.audio.playHit();
      }
    });
    this.projectiles = this.projectiles.filter((p) => !p.done);

    this.effects.forEach((fx) => (fx.age += scaledDt));
    this.effects = this.effects.filter((fx) => fx.age < fx.duration);

    let leaked = 0;
    this.enemies.forEach((e) => {
      if (e.alive) e.update(scaledDt);
      if (!e.alive && e.leaked) {
        leaked++;
      } else if (!e.alive && !e.rewarded) {
        e.rewarded = true;
        this.gold += e.reward;
      }
    });
    if (leaked > 0) this.lives -= leaked;
    this.enemies = this.enemies.filter((e) => e.alive);

    if (this.selectedTower && !this.towers.includes(this.selectedTower)) {
      this.selectedTower = null;
      this.emit('selectionChange');
    }

    if (this.lives <= 0) {
      this.lives = 0;
      this.audio.stopBgm();
      this.audio.playDefeat();
      this.setState('gameover');
      this.emit('hudUpdate');
      return;
    }

    if (this.waveManager.isFinalWave() && this.waveManager.isSpawningDone() && this.enemies.length === 0) {
      this.audio.stopBgm();
      this.audio.playVictory();
      this.setState('stageclear');
      this.emit('hudUpdate');
      return;
    }

    this.emit('hudUpdate');
  }

  applySplashDamage(x, y, radius, damage, damageType) {
    this.enemies.forEach((e) => {
      if (!e.alive) return;
      if (Math.hypot(e.x - x, e.y - y) <= radius) {
        e.takeDamage(damage, damageType);
      }
    });
  }

  render() {
    const ctx = this.ctx;
    if (!this.stage) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }
    drawGrid(ctx, {
      pathTiles: this.pathTiles,
      cols: this.stage.cols,
      rows: this.stage.rows,
      theme: this.stage.theme,
      decorations: this.decorations,
      startPoint: this.waypoints[0],
      endPoint: this.waypoints[this.waypoints.length - 1],
    });

    if (this.selectedTower) {
      drawRangeCircle(ctx, this.selectedTower.x, this.selectedTower.y, this.selectedTower.getStats().range);
    }

    this.towers.forEach((t) => t.draw(ctx));
    this.enemies.forEach((e) => e.draw(ctx));
    this.projectiles.forEach((p) => p.draw(ctx));
    this.effects.forEach((fx) => drawExplosion(ctx, fx.x, fx.y, fx.age / fx.duration, fx.maxRadius));

    if (this.hoverTile && this.selectedBuildType) {
      const { col, row } = this.hoverTile;
      const buildable =
        isBuildable(col, row, this.stage, this.pathTiles, this.towers) &&
        this.gold >= TOWER_TYPES[this.selectedBuildType].cost;
      const center = tileCenter(col, row);
      drawRangeCircle(ctx, center.x, center.y, TOWER_TYPES[this.selectedBuildType].baseRange);
      ctx.fillStyle = buildable ? 'rgba(120,255,120,0.35)' : 'rgba(255,80,80,0.35)';
      ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  loop(timestamp) {
    if (this.lastTimestamp === null) this.lastTimestamp = timestamp;
    let dt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    dt = Math.min(dt, 0.05);
    this.update(dt);
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    requestAnimationFrame((t) => this.loop(t));
  }
}
