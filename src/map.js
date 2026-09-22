import { drawDecoration, drawSpawnMarker, drawBaseMarker } from './sprites.js';

export const TILE_SIZE = 40;

export function tileCenter(col, row) {
  return { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 };
}

export function pixelToTile(x, y) {
  return { col: Math.floor(x / TILE_SIZE), row: Math.floor(y / TILE_SIZE) };
}

export function pathToWaypoints(path) {
  return path.map(([col, row]) => tileCenter(col, row));
}

// Walks the orthogonal waypoint list and returns the set of "col,row" tile keys
// the path physically occupies, so towers cannot be built on top of it.
export function computePathTiles(path) {
  const tiles = new Set();
  for (let i = 0; i < path.length - 1; i++) {
    const [c1, r1] = path[i];
    const [c2, r2] = path[i + 1];
    if (r1 === r2) {
      const lo = Math.min(c1, c2), hi = Math.max(c1, c2);
      for (let c = lo; c <= hi; c++) tiles.add(`${c},${r1}`);
    } else if (c1 === c2) {
      const lo = Math.min(r1, r2), hi = Math.max(r1, r2);
      for (let r = lo; r <= hi; r++) tiles.add(`${c1},${r}`);
    }
  }
  return tiles;
}

export function isInsideGrid(col, row, cols, rows) {
  return col >= 0 && col < cols && row >= 0 && row < rows;
}

// Deterministic 0..1 pseudo-random value for a tile, so decoration/texture
// placement is stable across frames without having to store per-pixel state.
function hash(col, row, seed) {
  let h = Math.imul(col, 374761393) ^ Math.imul(row, 668265263) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Scatters cosmetic props (grass/rock/rubble/etc, per the stage theme) across
// buildable tiles. Computed once per stage start, not re-rolled every frame.
export function generateDecorations(cols, rows, pathTiles, theme) {
  const decor = [];
  const density = theme.density ?? 0.1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pathTiles.has(`${c},${r}`)) continue;
      const roll = hash(c, r, theme.seed);
      if (roll < density) {
        const kindRoll = hash(c, r, theme.seed + 1000);
        const kind = theme.decorKinds[Math.floor(kindRoll * theme.decorKinds.length)];
        decor.push({ col: c, row: r, kind });
      }
    }
  }
  return decor;
}

export function drawGrid(ctx, { pathTiles, cols, rows, theme, decorations, startPoint, endPoint }) {
  ctx.fillStyle = theme.groundColor;
  ctx.fillRect(0, 0, cols * TILE_SIZE, rows * TILE_SIZE);

  // subtle two-tone ground speckle for texture
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pathTiles.has(`${c},${r}`)) continue;
      if (hash(c, r, theme.seed + 500) < 0.22) {
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  decorations.forEach((d) => {
    const { x, y } = tileCenter(d.col, d.row);
    drawDecoration(ctx, d.kind, x, y);
  });

  // road surface
  ctx.fillStyle = theme.roadColor;
  pathTiles.forEach((key) => {
    const [c, r] = key.split(',').map(Number);
    ctx.fillRect(c * TILE_SIZE + 2, r * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
  });
  ctx.fillStyle = theme.roadEdge;
  pathTiles.forEach((key) => {
    const [c, r] = key.split(',').map(Number);
    ctx.fillRect(c * TILE_SIZE + 2, r * TILE_SIZE + 2, TILE_SIZE - 4, 4);
  });
  // worn track dots down the middle of each road tile
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  pathTiles.forEach((key) => {
    const [c, r] = key.split(',').map(Number);
    const { x, y } = tileCenter(c, r);
    ctx.fillRect(x - 2, y - 2, 4, 4);
  });

  // subtle grid lines on top
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * TILE_SIZE + 0.5, 0);
    ctx.lineTo(c * TILE_SIZE + 0.5, rows * TILE_SIZE);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * TILE_SIZE + 0.5);
    ctx.lineTo(cols * TILE_SIZE, r * TILE_SIZE + 0.5);
    ctx.stroke();
  }

  if (startPoint) drawSpawnMarker(ctx, startPoint.x, startPoint.y);
  if (endPoint) drawBaseMarker(ctx, endPoint.x, endPoint.y);
}

export function isBuildable(col, row, stage, pathTiles, towers) {
  if (!isInsideGrid(col, row, stage.cols, stage.rows)) return false;
  if (pathTiles.has(`${col},${row}`)) return false;
  if (towers.some((t) => t.col === col && t.row === row)) return false;
  return true;
}
