// Procedural, blocky "pixel-art style" rendering. No external image assets:
// everything is drawn with flat-colored rectangles on a non-antialiased canvas
// so it reads as retro dot-art even though it's just geometry.

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// ---------------- Enemies (drawn facing +x = direction of travel) ----------------

export function drawInfantry(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  px(ctx, -5, -8, 9, 5, '#33421f');   // helmet
  px(ctx, -2, -4, 4, 3, '#c8a06a');   // face
  px(ctx, -6, -1, 10, 6, '#55672f');  // body
  px(ctx, 3, -1, 7, 2, '#1a1a1a');    // rifle
  px(ctx, -5, 5, 3, 4, '#3c4a22');    // left leg
  px(ctx, 1, 5, 3, 4, '#3c4a22');     // right leg
  ctx.restore();
}

export function drawHeavyInfantry(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  px(ctx, -8, -2, 4, 7, '#7a3f22');    // backpack
  px(ctx, -6, -9, 10, 6, '#2c3a1c');   // helmet (bigger)
  px(ctx, -2, -5, 4, 3, '#c8a06a');    // face
  px(ctx, -7, -2, 12, 8, '#3f4a28');   // body (bulkier)
  px(ctx, 4, -1, 8, 3, '#111');        // heavy rifle
  px(ctx, -6, 6, 4, 4, '#2c3418');     // left leg
  px(ctx, 1, 6, 4, 4, '#2c3418');      // right leg
  ctx.restore();
}

export function drawAPC(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  px(ctx, -12, -7, 24, 14, '#6b6b45');  // boxy wheeled hull
  px(ctx, -12, -7, 24, 3, '#5a5a3a');   // hull shading
  px(ctx, -10, -9, 3, 3, '#1c1c1c');    // wheels
  px(ctx, -10, 6, 3, 3, '#1c1c1c');
  px(ctx, -2, -9, 3, 3, '#1c1c1c');
  px(ctx, -2, 6, 3, 3, '#1c1c1c');
  px(ctx, 6, -9, 3, 3, '#1c1c1c');
  px(ctx, 6, 6, 3, 3, '#1c1c1c');
  px(ctx, -2, -4, 8, 8, '#54542f');     // hatch
  px(ctx, 4, -1, 9, 2, '#161616');      // mg barrel
  ctx.restore();
}

export function drawLightTank(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  px(ctx, -14, -8, 28, 4, '#20201c');   // tracks
  px(ctx, -14, 4, 28, 4, '#20201c');
  px(ctx, -13, -5, 26, 10, '#516b34');  // hull
  px(ctx, -13, -5, 26, 3, '#455c2a');   // shading
  px(ctx, -4, -5, 11, 10, '#425828');   // turret
  px(ctx, 6, -1.5, 15, 3, '#161616');   // barrel
  ctx.restore();
}

export function drawHeavyTank(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  px(ctx, -18, -11, 36, 5, '#17170f');  // wide tracks
  px(ctx, -18, 6, 36, 5, '#17170f');
  px(ctx, -17, -7, 34, 14, '#3c4a26');  // hull
  px(ctx, -17, -7, 34, 4, '#333f20');   // shading
  px(ctx, -17, -7, 4, 14, '#20260f');   // front armor plate accent
  px(ctx, -6, -8, 16, 16, '#333d1f');   // big turret
  px(ctx, 9, -3, 20, 4, '#111');        // long thick barrel
  ctx.restore();
}

export function drawEnemy(ctx, type, x, y, angle) {
  if (type === 'infantry') drawInfantry(ctx, x, y, angle);
  else if (type === 'heavy') drawHeavyInfantry(ctx, x, y, angle);
  else if (type === 'apc') drawAPC(ctx, x, y, angle);
  else if (type === 'lightTank') drawLightTank(ctx, x, y, angle);
  else if (type === 'heavyTank') drawHeavyTank(ctx, x, y, angle);
}

export function drawHealthBar(ctx, x, y, width, hpRatio) {
  const h = 4;
  const yy = y - width / 2 - 8;
  px(ctx, x - width / 2, yy, width, h, '#111');
  const fillColor = hpRatio > 0.5 ? '#6ecf4a' : hpRatio > 0.25 ? '#e0c23a' : '#d94f3d';
  px(ctx, x - width / 2, yy, Math.max(0, width * hpRatio), h, fillColor);
}

// ---------------- Towers (drawn facing aimAngle) ----------------

export function drawTowerBase(ctx, x, y) {
  px(ctx, x - 17, y - 17, 34, 34, '#4a4f3c');
  px(ctx, x - 13, y - 13, 26, 26, '#5c624a');
}

export function drawTowerMG(ctx, x, y, angle) {
  drawTowerBase(ctx, x, y);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  px(ctx, -8, -9, 16, 18, '#6a7050');   // turret body
  px(ctx, 6, -6, 12, 3, '#161616');     // barrel 1
  px(ctx, 6, 3, 12, 3, '#161616');      // barrel 2
  ctx.restore();
}

export function drawTowerAT(ctx, x, y, angle) {
  drawTowerBase(ctx, x, y);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  px(ctx, -9, -10, 18, 20, '#565b46');  // turret body
  px(ctx, 4, -3, 18, 6, '#161616');     // thick barrel
  px(ctx, 12, -4, 4, 8, '#2a2a2a');     // muzzle brake
  ctx.restore();
}

export function drawTowerMortar(ctx, x, y, angle) {
  drawTowerBase(ctx, x, y);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  px(ctx, -9, -9, 18, 18, '#5c6248');   // turret body
  px(ctx, 2, -5, 14, 10, '#222');       // stubby wide tube
  ctx.restore();
}

export function drawTowerSniper(ctx, x, y, angle) {
  drawTowerBase(ctx, x, y);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  px(ctx, -6, -6, 12, 12, '#4a5c46');   // compact body
  px(ctx, -2, -8, 4, 4, '#8a9a5a');     // scope
  px(ctx, 2, -1.5, 22, 3, '#161616');   // long thin barrel
  ctx.restore();
}

export function drawTowerRocket(ctx, x, y, angle) {
  drawTowerBase(ctx, x, y);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  px(ctx, -9, -10, 18, 20, '#4f4f3a');  // body
  px(ctx, 4, -8, 14, 6, '#232323');     // tube 1
  px(ctx, 4, 2, 14, 6, '#232323');      // tube 2
  px(ctx, 16, -8, 3, 6, '#111');        // muzzle 1
  px(ctx, 16, 2, 3, 6, '#111');         // muzzle 2
  ctx.restore();
}

export function drawTower(ctx, type, x, y, angle) {
  if (type === 'mg') drawTowerMG(ctx, x, y, angle);
  else if (type === 'at') drawTowerAT(ctx, x, y, angle);
  else if (type === 'mortar') drawTowerMortar(ctx, x, y, angle);
  else if (type === 'sniper') drawTowerSniper(ctx, x, y, angle);
  else if (type === 'rocket') drawTowerRocket(ctx, x, y, angle);
}

export function drawLevelStars(ctx, x, y, level) {
  for (let i = 0; i < level; i++) {
    px(ctx, x - 14 + i * 7, y - 21, 5, 5, '#ffd27a');
  }
}

export function drawRangeCircle(ctx, x, y, range) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 210, 122, 0.6)';
  ctx.fillStyle = 'rgba(255, 210, 122, 0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, range, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ---------------- Projectiles & effects ----------------

export function drawBullet(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  px(ctx, -4, -1, 8, 2, '#ffd27a');
  ctx.restore();
}

export function drawShell(ctx, x, y) {
  px(ctx, x - 3, y - 3, 6, 6, '#2a2a2a');
}

export function drawRocketProjectile(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  px(ctx, -8, -1.5, 6, 3, '#ff8a3d');  // flame trail
  px(ctx, -2, -2, 9, 4, '#333');       // body
  px(ctx, 7, -1.5, 3, 3, '#c0392b');   // warhead
  ctx.restore();
}

export function drawExplosion(ctx, x, y, progress, maxRadius) {
  const radius = maxRadius * progress;
  const alpha = 1 - progress;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = alpha * 0.6;
  ctx.fillStyle = '#ff5a3d';
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------------- Terrain decoration (purely cosmetic map dressing) ----------------

export function drawGrassTuft(ctx, x, y) {
  px(ctx, x - 3, y + 2, 2, 5, '#4f6a34');
  px(ctx, x, y - 1, 2, 8, '#5c7a3c');
  px(ctx, x + 3, y + 3, 2, 4, '#4f6a34');
}

export function drawBush(ctx, x, y) {
  px(ctx, x - 6, y - 4, 12, 9, '#3f5a2c');
  px(ctx, x - 4, y - 7, 8, 5, '#4a6a34');
}

export function drawRock(ctx, x, y) {
  px(ctx, x - 6, y - 3, 12, 7, '#6b6b62');
  px(ctx, x - 4, y - 6, 7, 5, '#7d7d72');
  px(ctx, x - 5, y - 2, 3, 3, '#54544c');
}

export function drawRubble(ctx, x, y) {
  px(ctx, x - 7, y - 2, 6, 5, '#55524a');
  px(ctx, x - 1, y - 5, 6, 6, '#655f54');
  px(ctx, x + 3, y - 1, 5, 4, '#403d36');
}

export function drawCrack(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 5);
  ctx.lineTo(x - 2, y + 1);
  ctx.lineTo(x + 4, y - 3);
  ctx.lineTo(x + 8, y + 5);
  ctx.stroke();
  ctx.restore();
}

export function drawBarrier(ctx, x, y) {
  px(ctx, x - 8, y - 6, 16, 5, '#a8792f');
  px(ctx, x - 8, y - 6, 4, 5, '#3a3a3a');
  px(ctx, x + 4, y - 6, 4, 5, '#3a3a3a');
}

export function drawDecoration(ctx, kind, x, y) {
  if (kind === 'grass') drawGrassTuft(ctx, x, y);
  else if (kind === 'bush') drawBush(ctx, x, y);
  else if (kind === 'rock') drawRock(ctx, x, y);
  else if (kind === 'rubble') drawRubble(ctx, x, y);
  else if (kind === 'crack') drawCrack(ctx, x, y);
  else if (kind === 'barrier') drawBarrier(ctx, x, y);
}

export function drawSpawnMarker(ctx, x, y) {
  px(ctx, x - 1, y - 14, 2, 14, '#3a3a3a');
  ctx.save();
  ctx.fillStyle = '#d94f3d';
  ctx.beginPath();
  ctx.moveTo(x + 1, y - 14);
  ctx.lineTo(x + 13, y - 10);
  ctx.lineTo(x + 1, y - 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawBaseMarker(ctx, x, y) {
  px(ctx, x - 13, y - 13, 26, 26, '#33421f');
  px(ctx, x - 9, y - 9, 18, 18, '#4a5c2c');
  px(ctx, x - 3, y - 3, 6, 6, '#ffd27a');
}

// Small preview icon used on the build panel buttons (drawn on a mini canvas).
export function drawTowerIcon(canvas, type) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2;
  drawTower(ctx, type, cx, cy, -Math.PI / 4);
}
