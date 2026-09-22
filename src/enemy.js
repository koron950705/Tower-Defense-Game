import { drawEnemy, drawHealthBar } from './sprites.js';

export const ENEMY_TYPES = {
  infantry: { name: '歩兵', baseHp: 32, speed: 72, armor: 0, reward: 5, radius: 10 },
  heavy: { name: '重歩兵', baseHp: 95, speed: 46, armor: 5, reward: 10, radius: 12 },
  apc: { name: '装甲車', baseHp: 120, speed: 58, armor: 6, reward: 13, radius: 13 },
  lightTank: { name: '軽戦車', baseHp: 230, speed: 36, armor: 9, reward: 21, radius: 14 },
  heavyTank: { name: '重戦車', baseHp: 420, speed: 20, armor: 16, reward: 36, radius: 17 },
};

let nextEnemyId = 1;

export class Enemy {
  constructor(type, waypoints, hpMultiplier, rewardMultiplier) {
    this.id = nextEnemyId++;
    this.type = type;
    const def = ENEMY_TYPES[type];
    this.def = def;
    this.waypoints = waypoints;
    this.waypointIndex = 1;
    this.x = waypoints[0].x;
    this.y = waypoints[0].y;
    this.maxHp = Math.round(def.baseHp * hpMultiplier);
    this.hp = this.maxHp;
    this.speed = def.speed;
    this.armor = def.armor;
    this.reward = Math.round(def.reward * rewardMultiplier);
    this.radius = def.radius;
    this.alive = true;
    this.leaked = false;
    this.distanceTraveled = 0;
    this.angle = 0;
  }

  update(dt) {
    if (!this.alive) return;
    let remaining = this.speed * dt;
    while (remaining > 0 && this.waypointIndex < this.waypoints.length) {
      const target = this.waypoints[this.waypointIndex];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= remaining) {
        this.x = target.x;
        this.y = target.y;
        this.distanceTraveled += dist;
        remaining -= dist;
        this.waypointIndex++;
      } else {
        this.angle = Math.atan2(dy, dx);
        this.x += (dx / dist) * remaining;
        this.y += (dy / dist) * remaining;
        this.distanceTraveled += remaining;
        remaining = 0;
      }
    }
    if (this.waypointIndex >= this.waypoints.length) {
      this.leaked = true;
      this.alive = false;
    }
  }

  takeDamage(amount, damageType) {
    let dmg;
    if (damageType === 'antiTank') {
      dmg = amount;
    } else if (damageType === 'piercing') {
      dmg = Math.max(1, amount - this.armor * 0.5);
    } else {
      dmg = Math.max(1, amount - this.armor);
    }
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  draw(ctx) {
    drawEnemy(ctx, this.type, this.x, this.y, this.angle);
    if (this.hp < this.maxHp) {
      drawHealthBar(ctx, this.x, this.y, this.radius * 2, this.hp / this.maxHp);
    }
  }
}
