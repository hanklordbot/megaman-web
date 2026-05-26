import { Container, Graphics } from 'pixi.js';
import { AABB, PhysicsSystem } from '../systems/PhysicsSystem';
import { WeaponType, WEAPON_DEFS } from '../GameState';
import { TILE_SIZE, GAME_WIDTH } from '../../utils/constants';

const BULLET_SPEED = 4 * TILE_SIZE; // 4 tiles/s

export interface Bullet {
  aabb: AABB;
  vx: number;
  vy: number;
  damage: number;
  weaponType: WeaponType;
  sprite: Graphics;
  alive: boolean;
  timer: number;
  piercing: boolean;
}

export class BulletSystem {
  bullets: Bullet[] = [];
  container = new Container();
  private pool: Bullet[] = [];
  private maxBuster = 3;

  get activeBusterCount(): number {
    return this.bullets.filter(b => b.alive && b.weaponType === WeaponType.MegaBuster).length;
  }

  canShootBuster(): boolean {
    return this.activeBusterCount < this.maxBuster;
  }

  shoot(x: number, y: number, facingRight: boolean, weaponType: WeaponType, damageMultiplier = 1): Bullet | null {
    if (weaponType === WeaponType.MegaBuster && !this.canShootBuster()) return null;

    const dir = facingRight ? 1 : -1;
    const def = WEAPON_DEFS[weaponType];
    let bullet: Bullet;

    switch (weaponType) {
      case WeaponType.RollingCutter:
        bullet = this.createBullet(x, y - 4, 12, 12, dir * BULLET_SPEED * 0.8, 0, def.damage * damageMultiplier, weaponType, 0x888888, true);
        bullet.timer = 1.5;
        break;
      case WeaponType.IceSlasher:
        bullet = this.createBullet(x, y - 4, 10, 8, dir * BULLET_SPEED, 0, def.damage * damageMultiplier, weaponType, 0x88ccff);
        break;
      case WeaponType.HyperBomb:
        bullet = this.createBullet(x, y - 8, 12, 12, dir * BULLET_SPEED * 0.6, -TILE_SIZE * 3, def.damage * damageMultiplier, weaponType, 0x44aa44);
        bullet.timer = 2;
        break;
      case WeaponType.FireStorm:
        bullet = this.createBullet(x, y - 4, 10, 10, dir * BULLET_SPEED, 0, def.damage * damageMultiplier, weaponType, 0xff6600);
        break;
      case WeaponType.ThunderBeam: {
        // Three directions: forward, up, down
        this.createBullet(x, y - 4, 8, 8, dir * BULLET_SPEED, 0, def.damage * damageMultiplier, weaponType, 0xffff00);
        this.createBullet(x, y - 4, 8, 8, 0, -BULLET_SPEED, def.damage * damageMultiplier, weaponType, 0xffff00);
        bullet = this.createBullet(x, y - 4, 8, 8, 0, BULLET_SPEED, def.damage * damageMultiplier, weaponType, 0xffff00);
        break;
      }
      case WeaponType.SuperArm:
        bullet = this.createBullet(x, y - 8, 16, 16, dir * BULLET_SPEED * 0.7, -TILE_SIZE * 2, def.damage * damageMultiplier, weaponType, 0xcc4444);
        bullet.timer = 2;
        break;
      default: // MegaBuster
        bullet = this.createBullet(x, y - 4, 8, 6, dir * BULLET_SPEED, 0, def.damage * damageMultiplier, weaponType, 0xffff88);
        break;
    }
    return bullet;
  }

  private createBullet(x: number, y: number, w: number, h: number, vx: number, vy: number, damage: number, weaponType: WeaponType, color: number, piercing = false): Bullet {
    let bullet = this.pool.pop();
    if (bullet) {
      bullet.aabb.x = x; bullet.aabb.y = y; bullet.aabb.w = w; bullet.aabb.h = h;
      bullet.vx = vx; bullet.vy = vy; bullet.damage = damage; bullet.weaponType = weaponType;
      bullet.alive = true; bullet.timer = 3; bullet.piercing = piercing;
      bullet.sprite.clear();
      bullet.sprite.beginFill(color);
      bullet.sprite.drawRect(0, 0, w, h);
      bullet.sprite.endFill();
      bullet.sprite.visible = true;
      this.container.addChild(bullet.sprite);
    } else {
      const sprite = new Graphics();
      sprite.beginFill(color);
      sprite.drawRect(0, 0, w, h);
      sprite.endFill();
      bullet = { aabb: { x, y, w, h }, vx, vy, damage, weaponType, sprite, alive: true, timer: 3, piercing };
      this.container.addChild(sprite);
    }
    this.bullets.push(bullet);
    return bullet;
  }

  update(dt: number, cameraX: number) {
    for (const b of this.bullets) {
      if (!b.alive) continue;
      b.aabb.x += b.vx * dt;
      b.aabb.y += b.vy * dt;
      // Gravity for bombs
      if (b.weaponType === WeaponType.HyperBomb || b.weaponType === WeaponType.SuperArm) {
        b.vy += 9.8 * TILE_SIZE * dt;
      }
      b.timer -= dt;
      // Off-screen or expired
      if (b.timer <= 0 || b.aabb.x < cameraX - 32 || b.aabb.x > cameraX + GAME_WIDTH + 32 || b.aabb.y > 300 || b.aabb.y < -100) {
        b.alive = false;
      }
      b.sprite.x = Math.round(b.aabb.x);
      b.sprite.y = Math.round(b.aabb.y);
      b.sprite.visible = b.alive;
    }
    // Compact dead bullets in-place (swap-remove)
    let i = 0;
    while (i < this.bullets.length) {
      if (!this.bullets[i].alive) {
        const b = this.bullets[i];
        this.container.removeChild(b.sprite);
        this.pool.push(b);
        this.bullets[i] = this.bullets[this.bullets.length - 1];
        this.bullets.pop();
      } else {
        i++;
      }
    }
  }

  clear() {
    for (const b of this.bullets) { this.container.removeChild(b.sprite); b.sprite.destroy(); }
    for (const b of this.pool) { b.sprite.destroy(); }
    this.bullets = [];
    this.pool = [];
  }
}
