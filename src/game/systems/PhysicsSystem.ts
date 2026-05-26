import { TILE_SIZE } from '../../utils/constants';

export interface AABB {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PhysicsBody {
  aabb: AABB;
  vx: number;
  vy: number;
  onGround: boolean;
}

export class PhysicsSystem {
  gravity = 9.8 * TILE_SIZE; // pixels/s²

  createBody(x: number, y: number, w: number, h: number): PhysicsBody {
    return { aabb: { x, y, w, h }, vx: 0, vy: 0, onGround: false };
  }

  update(body: PhysicsBody, dt: number, tileSolid: (col: number, row: number) => boolean) {
    body.vy += this.gravity * dt;

    // Clamp displacement to TILE_SIZE to prevent tunneling
    const maxStep = TILE_SIZE;
    let dx = body.vx * dt;
    let dy = body.vy * dt;

    // Horizontal (step in increments)
    const stepsX = Math.ceil(Math.abs(dx) / maxStep);
    const stepDx = dx / stepsX;
    for (let i = 0; i < stepsX; i++) {
      body.aabb.x += stepDx;
      this.resolveX(body, tileSolid);
      if (body.vx === 0) break;
    }

    // Vertical (step in increments)
    const stepsY = Math.ceil(Math.abs(dy) / maxStep);
    const stepDy = dy / stepsY;
    for (let i = 0; i < stepsY; i++) {
      body.aabb.y += stepDy;
      this.resolveY(body, tileSolid);
      if (body.vy === 0) break;
    }
  }

  private resolveX(body: PhysicsBody, solid: (col: number, row: number) => boolean) {
    const { aabb } = body;
    const top = Math.floor(aabb.y / TILE_SIZE);
    const bot = Math.floor((aabb.y + aabb.h - 1) / TILE_SIZE);

    if (body.vx > 0) {
      const col = Math.floor((aabb.x + aabb.w) / TILE_SIZE);
      for (let row = top; row <= bot; row++) {
        if (solid(col, row)) {
          aabb.x = col * TILE_SIZE - aabb.w;
          body.vx = 0;
          return;
        }
      }
    } else if (body.vx < 0) {
      const col = Math.floor(aabb.x / TILE_SIZE);
      for (let row = top; row <= bot; row++) {
        if (solid(col, row)) {
          aabb.x = (col + 1) * TILE_SIZE;
          body.vx = 0;
          return;
        }
      }
    }
  }

  private resolveY(body: PhysicsBody, solid: (col: number, row: number) => boolean) {
    const { aabb } = body;
    const left = Math.floor(aabb.x / TILE_SIZE);
    const right = Math.floor((aabb.x + aabb.w - 1) / TILE_SIZE);
    body.onGround = false;

    if (body.vy > 0) {
      const row = Math.floor((aabb.y + aabb.h) / TILE_SIZE);
      for (let col = left; col <= right; col++) {
        if (solid(col, row)) {
          aabb.y = row * TILE_SIZE - aabb.h;
          body.vy = 0;
          body.onGround = true;
          return;
        }
      }
    } else if (body.vy < 0) {
      const row = Math.floor(aabb.y / TILE_SIZE);
      for (let col = left; col <= right; col++) {
        if (solid(col, row)) {
          aabb.y = (row + 1) * TILE_SIZE;
          body.vy = 0;
          return;
        }
      }
    }
  }

  static aabbOverlap(a: AABB, b: AABB): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
}
