import { Enemy } from './enemy.js';
import { generateWave } from './stages.js';

export class WaveManager {
  constructor(waypoints, totalWaves) {
    this.waypoints = waypoints;
    this.totalWaves = totalWaves;
    this.currentWave = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveActive = false;
  }

  hasNextWave() {
    return this.currentWave < this.totalWaves;
  }

  startNextWave() {
    if (!this.hasNextWave()) return false;
    this.currentWave++;
    const { groups, hpMultiplier, rewardMultiplier } = generateWave(this.currentWave);
    this.spawnQueue = [];
    let offset = 0;
    groups.forEach((g) => {
      for (let i = 0; i < g.count; i++) {
        this.spawnQueue.push({
          type: g.type,
          delay: offset + i * g.interval,
          hpMultiplier,
          rewardMultiplier,
        });
      }
      offset += g.count * g.interval + 1.5;
    });
    this.spawnTimer = 0;
    this.waveActive = true;
    return true;
  }

  update(dt, onSpawn) {
    if (!this.waveActive) return;
    this.spawnTimer += dt;
    while (this.spawnQueue.length && this.spawnQueue[0].delay <= this.spawnTimer) {
      const item = this.spawnQueue.shift();
      const enemy = new Enemy(item.type, this.waypoints, item.hpMultiplier, item.rewardMultiplier);
      onSpawn(enemy);
    }
    if (this.spawnQueue.length === 0) {
      this.waveActive = false;
    }
  }

  isSpawningDone() {
    return !this.waveActive;
  }

  isFinalWave() {
    return this.currentWave >= this.totalWaves;
  }
}
