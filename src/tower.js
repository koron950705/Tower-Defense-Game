import { drawTower, drawLevelStars } from './sprites.js';

export const TOWER_TYPES = {
  mg: {
    name: '機関銃',
    cost: 50,
    baseDamage: 8,
    baseRange: 110,
    baseFireRate: 5,
    damageType: 'normal',
    splash: 0,
    projectileSpeed: 500,
    visual: 'bullet',
    desc: '連射力が高く歩兵に強い',
  },
  at: {
    name: '対戦車砲',
    cost: 110,
    baseDamage: 45,
    baseRange: 150,
    baseFireRate: 0.9,
    damageType: 'antiTank',
    splash: 0,
    projectileSpeed: 600,
    visual: 'bullet',
    desc: '装甲を無視する徹甲弾。戦車に特効',
  },
  mortar: {
    name: '迫撃砲',
    cost: 130,
    baseDamage: 28,
    baseRange: 140,
    baseFireRate: 0.7,
    damageType: 'normal',
    splash: 55,
    projectileSpeed: 260,
    visual: 'shell',
    desc: '着弾地点周辺に範囲ダメージ',
  },
  sniper: {
    name: '狙撃兵',
    cost: 160,
    baseDamage: 70,
    baseRange: 230,
    baseFireRate: 0.55,
    damageType: 'piercing',
    splash: 0,
    projectileSpeed: 900,
    visual: 'bullet',
    desc: '超長射程の精密射撃。装甲を半減して貫通',
  },
  rocket: {
    name: 'ロケット砲',
    cost: 220,
    baseDamage: 60,
    baseRange: 160,
    baseFireRate: 0.5,
    damageType: 'antiTank',
    splash: 65,
    projectileSpeed: 300,
    visual: 'rocket',
    desc: '装甲無視の範囲爆撃。戦車部隊の天敵',
  },
};

// Index 0 unused; index = target level being upgraded to.
const LEVEL_MULTIPLIERS = {
  1: { damage: 1, range: 1, fireRate: 1 },
  2: { damage: 1.6, range: 1.15, fireRate: 1.2 },
  3: { damage: 2.4, range: 1.3, fireRate: 1.45 },
};
const UPGRADE_COST_MULTIPLIER = { 2: 0.9, 3: 1.4 };
const MAX_LEVEL = 3;

export class Tower {
  constructor(type, col, row, center) {
    this.type = type;
    this.col = col;
    this.row = row;
    this.x = center.x;
    this.y = center.y;
    this.level = 1;
    this.cooldown = 0;
    this.aimAngle = -Math.PI / 4;
    this.target = null;
    this.totalInvested = TOWER_TYPES[type].cost;
  }

  getStats() {
    const base = TOWER_TYPES[this.type];
    const mult = LEVEL_MULTIPLIERS[this.level];
    return {
      damage: base.baseDamage * mult.damage,
      range: base.baseRange * mult.range,
      fireRate: base.baseFireRate * mult.fireRate,
    };
  }

  canUpgrade() {
    return this.level < MAX_LEVEL;
  }

  upgradeCost() {
    if (!this.canUpgrade()) return null;
    const base = TOWER_TYPES[this.type].cost;
    return Math.round(base * UPGRADE_COST_MULTIPLIER[this.level + 1]);
  }

  upgrade() {
    if (!this.canUpgrade()) return;
    this.totalInvested += this.upgradeCost();
    this.level++;
  }

  sellValue() {
    return Math.round(this.totalInvested * 0.6);
  }

  findTarget(enemies) {
    const stats = this.getStats();
    let best = null;
    let bestProgress = -1;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d <= stats.range && e.distanceTraveled > bestProgress) {
        bestProgress = e.distanceTraveled;
        best = e;
      }
    }
    return best;
  }

  update(dt, enemies, spawnProjectile) {
    this.cooldown -= dt;
    const stats = this.getStats();

    if (!this.target || !this.target.alive || Math.hypot(this.target.x - this.x, this.target.y - this.y) > stats.range) {
      this.target = this.findTarget(enemies);
    }
    if (this.target) {
      this.aimAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
    }
    if (this.target && this.cooldown <= 0) {
      const base = TOWER_TYPES[this.type];
      spawnProjectile({
        x: this.x,
        y: this.y,
        target: this.target,
        damage: stats.damage,
        damageType: base.damageType,
        splash: base.splash,
        speed: base.projectileSpeed,
        visual: base.visual,
      });
      this.cooldown = 1 / stats.fireRate;
    }
  }

  draw(ctx) {
    drawTower(ctx, this.type, this.x, this.y, this.aimAngle);
    drawLevelStars(ctx, this.x, this.y, this.level);
  }
}
