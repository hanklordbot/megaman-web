import { Container, Graphics } from 'pixi.js';
import { AABB } from '../systems/PhysicsSystem';

export enum ItemType {
  SmallHP = 'smallHp',
  LargeHP = 'largeHp',
  SmallWeapon = 'smallWeapon',
  LargeWeapon = 'largeWeapon',
  OneUp = 'oneUp',
  Score = 'score',
}

const DROP_TABLE: { type: ItemType; weight: number }[] = [
  { type: ItemType.SmallHP, weight: 20 },
  { type: ItemType.LargeHP, weight: 5 },
  { type: ItemType.SmallWeapon, weight: 15 },
  { type: ItemType.LargeWeapon, weight: 5 },
  { type: ItemType.OneUp, weight: 2 },
  { type: ItemType.Score, weight: 10 },
];

const COLORS: Record<ItemType, number> = {
  [ItemType.SmallHP]: 0xff4444,
  [ItemType.LargeHP]: 0xff0000,
  [ItemType.SmallWeapon]: 0x4444ff,
  [ItemType.LargeWeapon]: 0x0000ff,
  [ItemType.OneUp]: 0x44ff44,
  [ItemType.Score]: 0xffff00,
};

export interface Item {
  aabb: AABB;
  type: ItemType;
  sprite: Graphics;
  alive: boolean;
  vy: number;
}

export class ItemSystem {
  items: Item[] = [];
  container = new Container();

  tryDrop(x: number, y: number): Item | null {
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (const entry of DROP_TABLE) {
      cumulative += entry.weight;
      if (roll < cumulative) {
        return this.spawn(x, y, entry.type);
      }
    }
    return null; // 43% chance no drop
  }

  spawn(x: number, y: number, type: ItemType): Item {
    const size = type === ItemType.LargeHP || type === ItemType.LargeWeapon ? 12 : 8;
    const sprite = new Graphics();
    sprite.beginFill(COLORS[type]);
    sprite.drawRect(0, 0, size, size);
    sprite.endFill();
    const item: Item = { aabb: { x, y, w: size, h: size }, type, sprite, alive: true, vy: -50 };
    this.items.push(item);
    this.container.addChild(sprite);
    return item;
  }

  update(dt: number) {
    for (const item of this.items) {
      if (!item.alive) continue;
      item.vy += 300 * dt;
      item.aabb.y += item.vy * dt;
      if (item.aabb.y > 260) item.alive = false;
      item.sprite.x = Math.round(item.aabb.x);
      item.sprite.y = Math.round(item.aabb.y);
      item.sprite.visible = item.alive;
    }
    this.items = this.items.filter(i => {
      if (!i.alive) { this.container.removeChild(i.sprite); i.sprite.destroy(); }
      return i.alive;
    });
  }

  clear() {
    for (const i of this.items) { this.container.removeChild(i.sprite); i.sprite.destroy(); }
    this.items = [];
  }

  static getEffect(type: ItemType): { hp?: number; ammo?: number; lives?: number; score?: number } {
    switch (type) {
      case ItemType.SmallHP: return { hp: 2 };
      case ItemType.LargeHP: return { hp: 10 };
      case ItemType.SmallWeapon: return { ammo: 2 };
      case ItemType.LargeWeapon: return { ammo: 10 };
      case ItemType.OneUp: return { lives: 1 };
      case ItemType.Score: return { score: 500 };
    }
  }
}
