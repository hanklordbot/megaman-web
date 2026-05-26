import { TILE_SIZE } from '../../utils/constants';

export interface LevelData {
  width: number;   // in tiles
  height: number;  // in tiles
  tiles: number[][]; // collision layer (0=empty, 1=solid)
  enemies: { type: string; x: number; y: number }[];
  bossId?: string;
  bossX?: number;
  bossY?: number;
  playerStart: { x: number; y: number };
  checkpoints: { x: number; y: number }[];
}

// Parse Tiled JSON format
export function parseTiledLevel(json: any): LevelData {
  const w = json.width as number;
  const h = json.height as number;
  const tiles: number[][] = [];

  // Find collision layer
  const collisionLayer = json.layers?.find((l: any) => l.name === 'collision' || l.name === 'Collision') ?? json.layers?.[0];
  if (collisionLayer?.data) {
    for (let row = 0; row < h; row++) {
      tiles[row] = [];
      for (let col = 0; col < w; col++) {
        tiles[row][col] = collisionLayer.data[row * w + col] > 0 ? 1 : 0;
      }
    }
  }

  // Find objects layer for enemies/spawns
  const enemies: { type: string; x: number; y: number }[] = [];
  let playerStart = { x: 32, y: 192 };
  let bossId: string | undefined;
  let bossX = 200;
  let bossY = 192;
  const checkpoints: { x: number; y: number }[] = [];

  const objLayer = json.layers?.find((l: any) => l.type === 'objectgroup');
  if (objLayer?.objects) {
    for (const obj of objLayer.objects) {
      if (obj.type === 'player_start' || obj.name === 'player_start') {
        playerStart = { x: obj.x, y: obj.y };
      } else if (obj.type === 'boss') {
        bossId = obj.name;
        bossX = obj.x;
        bossY = obj.y;
      } else if (obj.type === 'checkpoint') {
        checkpoints.push({ x: obj.x, y: obj.y });
      } else if (obj.type === 'enemy') {
        enemies.push({ type: obj.name || 'met', x: obj.x, y: obj.y });
      }
    }
  }

  return { width: w, height: h, tiles, enemies, bossId, bossX, bossY, playerStart, checkpoints };
}

// Generate a simple test level procedurally
export function generateTestLevel(bossId: string): LevelData {
  const w = 64; // 64 tiles wide = 4 screens
  const h = 15; // 15 tiles tall = 240px
  const tiles: number[][] = [];

  for (let row = 0; row < h; row++) {
    tiles[row] = [];
    for (let col = 0; col < w; col++) {
      // Floor
      if (row >= 13) tiles[row][col] = 1;
      // Walls at edges
      else if (col === 0 || col === w - 1) tiles[row][col] = 1;
      // Platforms
      else if (row === 9 && col >= 8 && col <= 12) tiles[row][col] = 1;
      else if (row === 7 && col >= 16 && col <= 20) tiles[row][col] = 1;
      else if (row === 10 && col >= 24 && col <= 28) tiles[row][col] = 1;
      else if (row === 8 && col >= 32 && col <= 36) tiles[row][col] = 1;
      // Boss room floor (last 16 tiles)
      else if (row >= 13 && col >= w - 17) tiles[row][col] = 1;
      // Boss room walls
      else if (col === w - 17 && row >= 1) tiles[row][col] = 1;
      else tiles[row][col] = 0;
    }
  }

  const enemies = [
    { type: 'met', x: 6 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'blaster', x: 14 * TILE_SIZE, y: 11 * TILE_SIZE },
    { type: 'sniper_joe', x: 22 * TILE_SIZE, y: 11 * TILE_SIZE },
    { type: 'flea', x: 30 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'screw_bomber', x: 38 * TILE_SIZE, y: 4 * TILE_SIZE },
  ];

  return {
    width: w,
    height: h,
    tiles,
    enemies,
    bossId,
    bossX: (w - 9) * TILE_SIZE,
    bossY: 11 * TILE_SIZE,
    playerStart: { x: 2 * TILE_SIZE, y: 11 * TILE_SIZE },
    checkpoints: [{ x: 20 * TILE_SIZE, y: 11 * TILE_SIZE }],
  };
}
