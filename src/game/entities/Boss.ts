import { Container, Graphics } from 'pixi.js';
import { AABB } from '../systems/PhysicsSystem';
import { TILE_SIZE } from '../../utils/constants';

export interface BossAction {
  x: number; y: number; vx: number; vy: number; damage: number;
}

export interface Boss {
  id: string;
  aabb: AABB;
  hp: number;
  maxHp: number;
  damage: number;
  container: Container;
  alive: boolean;
  setFloorY(y: number): void;
  update(dt: number, playerX: number, playerY: number): void;
  getBullets(): BossAction[];
}

abstract class BaseBoss implements Boss {
  abstract id: string;
  aabb: AABB;
  hp: number;
  maxHp = 28;
  damage = 3;
  container = new Container();
  alive = true;
  protected sprite: Graphics;
  protected timer = 1;
  protected state = 0;
  protected pendingBullets: BossAction[] = [];
  protected vy = 0;
  protected vx = 0;
  protected onGround = true;
  protected floorY: number;

  constructor(x: number, y: number, w: number, h: number, color: number) {
    this.hp = this.maxHp;
    this.aabb = { x, y, w, h };
    this.floorY = y; // default floor at spawn position
    this.sprite = new Graphics();
    this.sprite.beginFill(color);
    this.sprite.drawRect(0, 0, w, h);
    this.sprite.endFill();
    this.container.addChild(this.sprite);
  }

  setFloorY(y: number) { this.floorY = y; }

  protected applyGravity(dt: number) {
    this.vy += 9.8 * TILE_SIZE * dt;
    this.aabb.y += this.vy * dt;
    if (this.aabb.y > this.floorY) { this.aabb.y = this.floorY; this.vy = 0; this.onGround = true; }
  }

  protected syncVisual() {
    this.container.x = Math.round(this.aabb.x);
    this.container.y = Math.round(this.aabb.y);
  }

  getBullets() { const b = [...this.pendingBullets]; this.pendingBullets = []; return b; }

  abstract update(dt: number, playerX: number, playerY: number): void;
}

// Cut Man: jump → throw cutter (boomerang) → wait
export class CutMan extends BaseBoss {
  id = 'cutman';
  constructor(x: number, y: number) { super(x, y, 32, 32, 0x888888); }

  update(dt: number, playerX: number) {
    this.timer -= dt;
    if (this.state === 0 && this.timer <= 0) {
      this.vy = -TILE_SIZE * 7;
      this.onGround = false;
      this.state = 1;
      this.timer = 0.4;
    } else if (this.state === 1 && this.timer <= 0) {
      const dir = playerX > this.aabb.x ? 1 : -1;
      this.pendingBullets.push({ x: this.aabb.x + 16, y: this.aabb.y, vx: dir * TILE_SIZE * 4, vy: 0, damage: 3 });
      this.state = 2;
      this.timer = 2;
    } else if (this.state === 2 && this.timer <= 0 && this.onGround) {
      this.state = 0;
      this.timer = 1;
    }
    this.applyGravity(dt);
    this.syncVisual();
  }
}

// Guts Man: jump (shake) → throw rock
export class GutsMan extends BaseBoss {
  id = 'gutsman';
  constructor(x: number, y: number) { super(x, y, 40, 40, 0xcc4400); }

  update(dt: number, playerX: number) {
    this.timer -= dt;
    if (this.state === 0 && this.timer <= 0) {
      this.vy = -TILE_SIZE * 6;
      this.onGround = false;
      this.state = 1;
      this.timer = 0.8;
    } else if (this.state === 1 && this.timer <= 0 && this.onGround) {
      // Earthquake effect (player stun handled externally)
      this.state = 2;
      this.timer = 0.5;
    } else if (this.state === 2 && this.timer <= 0) {
      const dir = playerX > this.aabb.x ? 1 : -1;
      this.pendingBullets.push({ x: this.aabb.x + 20, y: this.aabb.y - 16, vx: dir * TILE_SIZE * 3, vy: -TILE_SIZE * 3, damage: 4 });
      this.state = 0;
      this.timer = 2;
    }
    this.applyGravity(dt);
    this.syncVisual();
  }
}

// Ice Man: move left/right → shoot x3 → pause
export class IceMan extends BaseBoss {
  id = 'iceman';
  private shots = 0;
  private moveDir = -1;
  constructor(x: number, y: number) { super(x, y, 32, 32, 0x2244aa); }

  update(dt: number, playerX: number) {
    this.timer -= dt;
    if (this.state === 0) {
      this.aabb.x += this.moveDir * TILE_SIZE * dt;
      if (this.aabb.x < 32 || this.aabb.x > 200) this.moveDir *= -1;
      if (this.timer <= 0) { this.state = 1; this.timer = 0.4; this.shots = 0; }
    } else if (this.state === 1 && this.timer <= 0) {
      const dir = playerX > this.aabb.x ? 1 : -1;
      this.pendingBullets.push({ x: this.aabb.x + 16, y: this.aabb.y + 10, vx: dir * TILE_SIZE * 4, vy: 0, damage: 2 });
      this.shots++;
      if (this.shots >= 3) { this.state = 2; this.timer = 1.5; }
      else this.timer = 0.3;
    } else if (this.state === 2 && this.timer <= 0) {
      this.state = 0;
      this.timer = 2;
    }
    this.syncVisual();
  }
}

// Bomb Man: jump → throw bomb → jump evade
export class BombMan extends BaseBoss {
  id = 'bombman';
  constructor(x: number, y: number) { super(x, y, 32, 32, 0x44aa44); }

  update(dt: number, playerX: number) {
    this.timer -= dt;
    if (this.state === 0 && this.timer <= 0) {
      this.vy = -TILE_SIZE * 7;
      this.onGround = false;
      this.state = 1;
      this.timer = 0.3;
    } else if (this.state === 1 && this.timer <= 0) {
      const dir = playerX > this.aabb.x ? 1 : -1;
      this.pendingBullets.push({ x: this.aabb.x + 16, y: this.aabb.y, vx: dir * TILE_SIZE * 2.5, vy: -TILE_SIZE * 3, damage: 3 });
      this.state = 2;
      this.timer = 1;
    } else if (this.state === 2 && this.timer <= 0 && this.onGround) {
      this.vy = -TILE_SIZE * 5;
      this.vx = (playerX > this.aabb.x ? -1 : 1) * TILE_SIZE * 2;
      this.onGround = false;
      this.state = 3;
      this.timer = 1.5;
    } else if (this.state === 3 && this.onGround) {
      this.vx = 0;
      this.state = 0;
      this.timer = 1;
    }
    this.aabb.x += this.vx * dt;
    if (this.aabb.x < 16) this.aabb.x = 16;
    if (this.aabb.x > 208) this.aabb.x = 208;
    this.applyGravity(dt);
    this.syncVisual();
  }
}

// Fire Man: shoot → advance → shoot → retreat
export class FireMan extends BaseBoss {
  id = 'fireman';
  private moveDir = 1;
  constructor(x: number, y: number) { super(x, y, 32, 40, 0xff4400); }

  update(dt: number, playerX: number) {
    this.timer -= dt;
    if (this.state === 0 && this.timer <= 0) {
      const dir = playerX > this.aabb.x ? 1 : -1;
      this.pendingBullets.push({ x: this.aabb.x + 16, y: this.aabb.y + 10, vx: dir * TILE_SIZE * 5, vy: 0, damage: 3 });
      this.state = 1;
      this.timer = 1;
      this.moveDir = dir;
    } else if (this.state === 1) {
      this.aabb.x += this.moveDir * TILE_SIZE * 1.5 * dt;
      if (this.timer <= 0) { this.state = 2; this.timer = 0.5; }
    } else if (this.state === 2 && this.timer <= 0) {
      const dir = playerX > this.aabb.x ? 1 : -1;
      this.pendingBullets.push({ x: this.aabb.x + 16, y: this.aabb.y + 10, vx: dir * TILE_SIZE * 5, vy: 0, damage: 3 });
      this.state = 3;
      this.timer = 1;
      this.moveDir = -this.moveDir;
    } else if (this.state === 3) {
      this.aabb.x += this.moveDir * TILE_SIZE * 1.5 * dt;
      if (this.timer <= 0) { this.state = 0; this.timer = 1.5; }
    }
    if (this.aabb.x < 16) this.aabb.x = 16;
    if (this.aabb.x > 200) this.aabb.x = 200;
    this.syncVisual();
  }
}

// Elec Man: jump → Thunder Beam (3-way) → dash
export class ElecMan extends BaseBoss {
  id = 'elecman';
  constructor(x: number, y: number) { super(x, y, 32, 40, 0x222222); }

  update(dt: number, playerX: number) {
    this.timer -= dt;
    if (this.state === 0 && this.timer <= 0) {
      this.vy = -TILE_SIZE * 8;
      this.onGround = false;
      this.state = 1;
      this.timer = 0.3;
    } else if (this.state === 1 && this.timer <= 0) {
      const dir = playerX > this.aabb.x ? 1 : -1;
      this.pendingBullets.push({ x: this.aabb.x + 16, y: this.aabb.y + 20, vx: dir * TILE_SIZE * 5, vy: 0, damage: 3 });
      this.pendingBullets.push({ x: this.aabb.x + 16, y: this.aabb.y, vx: 0, vy: -TILE_SIZE * 5, damage: 3 });
      this.pendingBullets.push({ x: this.aabb.x + 16, y: this.aabb.y + 40, vx: 0, vy: TILE_SIZE * 5, damage: 3 });
      this.state = 2;
      this.timer = 0.8;
    } else if (this.state === 2 && this.timer <= 0 && this.onGround) {
      this.vx = (playerX > this.aabb.x ? 1 : -1) * TILE_SIZE * 4;
      this.state = 3;
      this.timer = 0.5;
    } else if (this.state === 3 && this.timer <= 0) {
      this.vx = 0;
      this.state = 0;
      this.timer = 1.5;
    }
    this.aabb.x += this.vx * dt;
    if (this.aabb.x < 16) { this.aabb.x = 16; this.vx = 0; }
    if (this.aabb.x > 200) { this.aabb.x = 200; this.vx = 0; }
    this.applyGravity(dt);
    this.syncVisual();
  }
}

export function createBoss(id: string, x: number, y: number): Boss {
  switch (id) {
    case 'cutman': return new CutMan(x, y);
    case 'gutsman': return new GutsMan(x, y);
    case 'iceman': return new IceMan(x, y);
    case 'bombman': return new BombMan(x, y);
    case 'fireman': return new FireMan(x, y);
    case 'elecman': return new ElecMan(x, y);
    default: return new CutMan(x, y);
  }
}
