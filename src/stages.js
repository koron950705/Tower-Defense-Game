// Stage definitions. Paths are lists of [col, row] tile coordinates forming an
// orthogonal polyline; enemies walk from the first point to the last.
export const STAGES = [
  {
    id: 1,
    name: '平原の道',
    desc: '見通しの良い平原。まずは基本を試そう。',
    cols: 20,
    rows: 13,
    path: [[0, 6], [5, 6], [5, 2], [10, 2], [10, 10], [15, 10], [15, 6], [19, 6]],
    waveCount: 10,
    startGold: 110,
    startLives: 15,
    theme: {
      seed: 11,
      groundColor: '#3a4a26',
      roadColor: '#8a7a5a',
      roadEdge: '#6b5d43',
      decorKinds: ['grass', 'bush', 'rock'],
      density: 0.1,
    },
  },
  {
    id: 2,
    name: '渓谷ルート',
    desc: '曲がりくねった道。射程配置がカギ。',
    cols: 20,
    rows: 13,
    path: [[0, 2], [3, 2], [3, 10], [8, 10], [8, 4], [12, 4], [12, 11], [19, 11]],
    waveCount: 12,
    startGold: 120,
    startLives: 14,
    theme: {
      seed: 29,
      groundColor: '#5c4f34',
      roadColor: '#9c8a68',
      roadEdge: '#7a6a4c',
      decorKinds: ['rock', 'crack', 'bush'],
      density: 0.13,
    },
  },
  {
    id: 3,
    name: '市街地',
    desc: '戦車部隊が本格的に投入される激戦区。',
    cols: 20,
    rows: 13,
    path: [[0, 9], [4, 9], [4, 1], [9, 1], [9, 6], [13, 6], [13, 1], [19, 1]],
    waveCount: 14,
    startGold: 140,
    startLives: 12,
    theme: {
      seed: 47,
      groundColor: '#454a44',
      roadColor: '#3a3a3a',
      roadEdge: '#242424',
      decorKinds: ['rubble', 'crack', 'barrier'],
      density: 0.11,
    },
  },
];

export function getStageById(id) {
  return STAGES.find((s) => s.id === id);
}

// Procedurally generates the enemy composition for a given wave number (1-indexed).
// Keeps stage authoring simple while still ramping difficulty over time.
export function generateWave(waveNumber) {
  const groups = [];
  const infantryCount = 6 + Math.round(waveNumber * 2.6);
  groups.push({ type: 'infantry', count: infantryCount, interval: 0.45 });

  if (waveNumber >= 2) {
    const heavyCount = Math.floor(waveNumber / 1.5);
    if (heavyCount > 0) groups.push({ type: 'heavy', count: heavyCount, interval: 0.75 });
  }

  if (waveNumber >= 3) {
    const apcCount = Math.floor(waveNumber / 2);
    if (apcCount > 0) groups.push({ type: 'apc', count: apcCount, interval: 1.0 });
  }

  if (waveNumber >= 5) {
    const lightTankCount = Math.floor((waveNumber - 4) / 2) + 1;
    groups.push({ type: 'lightTank', count: lightTankCount, interval: 1.3 });
  }

  if (waveNumber >= 8) {
    const heavyTankCount = Math.floor((waveNumber - 7) / 3) + 1;
    groups.push({ type: 'heavyTank', count: heavyTankCount, interval: 1.8 });
  }

  // Compounding growth so late waves demand upgraded/mixed towers, not just
  // more level-1 spam - linear scaling let raw tower count outpace difficulty.
  const hpMultiplier = Math.pow(1.19, waveNumber - 1);
  const rewardMultiplier = 1 + (waveNumber - 1) * 0.035;
  return { groups, hpMultiplier, rewardMultiplier };
}
