import { drawBullet, drawShell, drawRocketProjectile } from './sprites.js';

let nextProjectileId = 1;

export class Projectile {
  constructor({ x, y, target, damage, damageType, splash, speed, visual }) {
    this.id = nextProjectileId++;
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.damageType = damageType;
    this.splash = splash;
    this.speed = speed;
    this.visual = visual; // 'bullet' | 'shell' | 'rocket'
    this.angle = 0;
    this.done = false;
    this.impact = null; // {x,y} set once it hits, consumed by game.js for splash/vfx
  }

  update(dt) {
    if (this.done) return;
    let aimX, aimY;
    if (this.target && this.target.alive) {
      aimX = this.target.x;
      aimY = this.target.y;
    } else if (this.lastKnown) {
      aimX = this.lastKnown.x;
      aimY = this.lastKnown.y;
    } else {
      this.done = true;
      return;
    }
    this.lastKnown = { x: aimX, y: aimY };

    const dx = aimX - this.x;
    const dy = aimY - this.y;
    const dist = Math.hypot(dx, dy);
    this.angle = Math.atan2(dy, dx);
    const step = this.speed * dt;

    if (dist <= step || dist < 4) {
      this.x = aimX;
      this.y = aimY;
      this.impact = { x: this.x, y: this.y };
      this.done = true;
      if (this.target && this.target.alive && this.splash === 0) {
        this.target.takeDamage(this.damage, this.damageType);
      }
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  draw(ctx) {
    if (this.done) return;
    if (this.visual === 'shell') drawShell(ctx, this.x, this.y);
    else if (this.visual === 'rocket') drawRocketProjectile(ctx, this.x, this.y, this.angle);
    else drawBullet(ctx, this.x, this.y, this.angle);
  }
}
