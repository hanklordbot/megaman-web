import { Container, Graphics } from 'pixi.js';
import { AABB } from '../systems/PhysicsSystem';
import { TILE_SIZE } from '../../utils/constants';

export interface Enemy {
  aabb: AABB;
  hp: number;
  damage: number;
  container: Container;
  alive: boolean;
  isInvincible?: boolean;
  update(dt: number, playerX: number, playerY: number): void;
  getBullets?(): { x: number; y: number; vx: number; vy: number; damage: number }[];
}

// Met (hard hat) - hides, peeks to shoot, invincible while hiding
export class Met implements Enemy {
  aabb: AABB;
  hp = 1;
  damage = 2;
  container = new Container();
  alive = true;
  isInvincible = true;
  private hiding = true;
  private timer = 2;
  private shootCooldown = 0;
  private pendingBullets: { x: number; y: number; vx: number; vy: number; damage: number }[] = [];
  private sprite: Graphics;

  constructor(x: number, y: number) {
    this.aabb = { x, y, w: 16, h: 16 };
    this.sprite = new Graphics();
    this.draw();
    this.container.addChild(this.sprite);
  }

  private draw() {
    this.sprite.clear();
    this.sprite.beginFill(this.hiding ? 0x888800 : 0xcccc00);
    this.sprite.drawRect(0, 0, 16, 16);
    this.sprite.endFill();
  }

  update(dt: number, playerX: number) {
    this.pendingBullets = [];
    this.timer -= dt;
    if (this.hiding && this.timer <= 0) {
      this.hiding = false;
      this.isInvincible = false;
      this.timer = 1.5;
      this.shootCooldown = 0.3;
      this.draw();
    } else if (!this.hiding) {
      this.shootCooldown -= dt;
      if (this.shootCooldown <= 0 && this.timer > 0.5) {
        const dir = playerX > this.aabb.x ? 1 : -1;
        this.pendingBullets.push({ x: this.aabb.x + 8, y: this.aabb.y + 4, vx: dir * TILE_SIZE * 3, vy: 0, damage: this.damage });
        this.shootCooldown = 0.8;
      }
      if (this.timer <= 0) {
        this.hiding = true;
        this.isInvincible = true;
        this.timer = 2;
        this.draw();
      }
    }
    this.container.x = Math.round(this.aabb.x);
    this.container.y = Math.round(this.aabb.y);
  }

  getBullets() { return this.pendingBullets; }
}

// Sniper Joe - shield up (invincible), drops shield to shoot
export class SniperJoe implements Enemy {
  aabb: AABB;
  hp = 3;
  damage = 2;
  container = new Container();
  alive = true;
  isInvincible = true;
  private shielded = true;
  private timer = 2;
  private pendingBullets: { x: number; y: number; vx: number; vy: number; damage: number }[] = [];
  private sprite: Graphics;

  constructor(x: number, y: number) {
    this.aabb = { x, y, w: 24, h: 32 };
    this.sprite = new Graphics();
    this.draw();
    this.container.addChild(this.sprite);
  }

  private draw() {
    this.sprite.clear();
    this.sprite.beginFill(0x228822);
    this.sprite.drawRect(0, 0, 24, 32);
    this.sprite.endFill();
    if (this.shielded) {
      this.sprite.beginFill(0x666666);
      this.sprite.drawRect(2, 4, 8, 24);
      this.sprite.endFill();
    }
  }

  update(dt: number, playerX: number) {
    this.pendingBullets = [];
    this.timer -= dt;
    if (this.shielded && this.timer <= 0) {
      this.shielded = false;
      this.isInvincible = false;
      this.timer = 1.2;
      this.draw();
    } else if (!this.shielded && this.timer <= 0) {
      const dir = playerX > this.aabb.x ? 1 : -1;
      this.pendingBullets.push({ x: this.aabb.x + 12, y: this.aabb.y + 10, vx: dir * TILE_SIZE * 3, vy: 0, damage: this.damage });
      this.shielded = true;
      this.isInvincible = true;
      this.timer = 2;
      this.draw();
    }
    this.container.x = Math.round(this.aabb.x);
    this.container.y = Math.round(this.aabb.y);
  }

  getBullets() { return this.pendingBullets; }
}

// Blaster - fixed position, periodic shooting
export class Blaster implements Enemy {
  aabb: AABB;
  hp = 1;
  damage = 2;
  container = new Container();
  alive = true;
  private timer = 1.5;
  private pendingBullets: { x: number; y: number; vx: number; vy: number; damage: number }[] = [];

  constructor(x: number, y: number) {
    this.aabb = { x, y, w: 16, h: 16 };
    const s = new Graphics();
    s.beginFill(0xcc4444);
    s.drawRect(0, 0, 16, 16);
    s.endFill();
    this.container.addChild(s);
  }

  update(dt: number, playerX: number) {
    this.pendingBullets = [];
    this.timer -= dt;
    if (this.timer <= 0) {
      const dir = playerX > this.aabb.x ? 1 : -1;
      this.pendingBullets.push({ x: this.aabb.x + 8, y: this.aabb.y + 8, vx: dir * TILE_SIZE * 4, vy: 0, damage: this.damage });
      this.timer = 2;
    }
    this.container.x = Math.round(this.aabb.x);
    this.container.y = Math.round(this.aabb.y);
  }

  getBullets() { return this.pendingBullets; }
}

// Flea - random jumping
export class Flea implements Enemy {
  aabb: AABB;
  hp = 1;
  damage = 1;
  container = new Container();
  alive = true;
  private vy = 0;
  private vx: number;
  private onGround = true;
  private jumpTimer = 0.5;
  floorY: number;

  constructor(x: number, y: number) {
    this.aabb = { x, y, w: 16, h: 16 };
    this.floorY = y;
    this.vx = (Math.random() > 0.5 ? 1 : -1) * TILE_SIZE;
    const s = new Graphics();
    s.beginFill(0x44cc44);
    s.drawRect(0, 0, 16, 16);
    s.endFill();
    this.container.addChild(s);
  }

  update(dt: number) {
    if (this.onGround) {
      this.jumpTimer -= dt;
      if (this.jumpTimer <= 0) {
        this.vy = -TILE_SIZE * 6;
        this.vx = (Math.random() > 0.5 ? 1 : -1) * TILE_SIZE * (1 + Math.random());
        this.onGround = false;
        this.jumpTimer = 0.5 + Math.random();
      }
    } else {
      this.vy += 9.8 * TILE_SIZE * dt;
      this.aabb.x += this.vx * dt;
      this.aabb.y += this.vy * dt;
      if (this.aabb.y > this.floorY) {
        this.aabb.y = this.floorY;
        this.vy = 0;
        this.onGround = true;
      }
    }
    this.container.x = Math.round(this.aabb.x);
    this.container.y = Math.round(this.aabb.y);
  }
}

// ScrewBomber - flies and drops bombs
export class ScrewBomber implements Enemy {
  aabb: AABB;
  hp = 1;
  damage = 2;
  container = new Container();
  alive = true;
  private vx: number;
  private timer = 1.5;
  private pendingBullets: { x: number; y: number; vx: number; vy: number; damage: number }[] = [];

  constructor(x: number, y: number) {
    this.aabb = { x, y, w: 16, h: 16 };
    this.vx = -TILE_SIZE * 1.5;
    const s = new Graphics();
    s.beginFill(0x8844cc);
    s.drawRect(0, 0, 16, 16);
    s.endFill();
    this.container.addChild(s);
  }

  update(dt: number) {
    this.pendingBullets = [];
    this.aabb.x += this.vx * dt;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.pendingBullets.push({ x: this.aabb.x + 8, y: this.aabb.y + 16, vx: 0, vy: TILE_SIZE * 3, damage: this.damage });
      this.timer = 2;
    }
    this.container.x = Math.round(this.aabb.x);
    this.container.y = Math.round(this.aabb.y);
  }

  getBullets() { return this.pendingBullets; }
}

// Penguin - ground sliding
export class Penguin implements Enemy {
  aabb: AABB;
  hp = 1;
  damage = 1;
  container = new Container();
  alive = true;
  private vx: number;

  constructor(x: number, y: number) {
    this.aabb = { x, y, w: 16, h: 16 };
    this.vx = -TILE_SIZE * 2;
    const s = new Graphics();
    s.beginFill(0x4488cc);
    s.drawRect(0, 0, 16, 16);
    s.endFill();
    this.container.addChild(s);
  }

  update(dt: number) {
    this.aabb.x += this.vx * dt;
    this.container.x = Math.round(this.aabb.x);
    this.container.y = Math.round(this.aabb.y);
  }
}

// FootHolder - flying platform enemy
export class FootHolder implements Enemy {
  aabb: AABB;
  hp = 99; // effectively unkillable
  damage = 2;
  container = new Container();
  alive = true;
  private baseY: number;
  private time = 0;

  constructor(x: number, y: number) {
    this.aabb = { x, y, w: 24, h: 16 };
    this.baseY = y;
    const s = new Graphics();
    s.beginFill(0x666688);
    s.drawRect(0, 0, 24, 16);
    s.endFill();
    this.container.addChild(s);
  }

  update(dt: number) {
    this.time += dt;
    this.aabb.y = this.baseY + Math.sin(this.time * 2) * TILE_SIZE;
    this.container.x = Math.round(this.aabb.x);
    this.container.y = Math.round(this.aabb.y);
  }
}

export function createEnemy(type: string, x: number, y: number): Enemy {
  switch (type) {
    case 'met': return new Met(x, y);
    case 'sniper_joe': return new SniperJoe(x, y);
    case 'blaster': return new Blaster(x, y);
    case 'flea': return new Flea(x, y);
    case 'screw_bomber': return new ScrewBomber(x, y);
    case 'penguin': return new Penguin(x, y);
    case 'foot_holder': return new FootHolder(x, y);
    default: return new Met(x, y);
  }
}
