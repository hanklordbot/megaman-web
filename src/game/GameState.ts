export enum WeaponType {
  MegaBuster = 'megaBuster',
  RollingCutter = 'rollingCutter',
  SuperArm = 'superArm',
  IceSlasher = 'iceSlasher',
  HyperBomb = 'hyperBomb',
  FireStorm = 'fireStorm',
  ThunderBeam = 'thunderBeam',
}

export interface WeaponData {
  type: WeaponType;
  ammo: number;
  maxAmmo: number;
  damage: number;
}

export const WEAPON_DEFS: Record<WeaponType, { damage: number; maxAmmo: number }> = {
  [WeaponType.MegaBuster]: { damage: 1, maxAmmo: Infinity },
  [WeaponType.RollingCutter]: { damage: 2, maxAmmo: 28 },
  [WeaponType.SuperArm]: { damage: 4, maxAmmo: 28 },
  [WeaponType.IceSlasher]: { damage: 2, maxAmmo: 28 },
  [WeaponType.HyperBomb]: { damage: 3, maxAmmo: 28 },
  [WeaponType.FireStorm]: { damage: 2, maxAmmo: 28 },
  [WeaponType.ThunderBeam]: { damage: 3, maxAmmo: 28 },
};

export const WEAKNESS_MAP: Record<string, WeaponType> = {
  cutman: WeaponType.SuperArm,
  gutsman: WeaponType.HyperBomb,
  iceman: WeaponType.ThunderBeam,
  bombman: WeaponType.FireStorm,
  fireman: WeaponType.IceSlasher,
  elecman: WeaponType.RollingCutter,
};

export class GameState {
  hp = 28;
  maxHp = 28;
  lives = 3;
  score = 0;
  currentWeapon = WeaponType.MegaBuster;
  lastSpecialWeapon = WeaponType.RollingCutter;
  weapons: Map<WeaponType, number> = new Map([[WeaponType.MegaBuster, Infinity]]);
  defeatedBosses: Set<string> = new Set();

  addWeapon(type: WeaponType) {
    this.weapons.set(type, WEAPON_DEFS[type].maxAmmo);
  }

  switchWeapon(type: WeaponType) {
    if (type !== WeaponType.MegaBuster) this.lastSpecialWeapon = type;
    this.currentWeapon = type;
  }

  useAmmo(type: WeaponType): boolean {
    if (type === WeaponType.MegaBuster) return true;
    const ammo = this.weapons.get(type) ?? 0;
    if (ammo <= 0) return false;
    this.weapons.set(type, ammo - 1);
    return true;
  }

  getAmmo(type: WeaponType): number {
    return this.weapons.get(type) ?? 0;
  }

  restoreAmmo(amount: number) {
    // When using MegaBuster, restore last special weapon
    const target = this.currentWeapon === WeaponType.MegaBuster ? this.lastSpecialWeapon : this.currentWeapon;
    if (target === WeaponType.MegaBuster) return;
    const max = WEAPON_DEFS[target].maxAmmo;
    const cur = this.weapons.get(target) ?? 0;
    this.weapons.set(target, Math.min(cur + amount, max));
  }

  getDamage(weaponType: WeaponType, bossId?: string): number {
    const base = WEAPON_DEFS[weaponType].damage;
    if (bossId && WEAKNESS_MAP[bossId] === weaponType) return base * 4;
    return base;
  }

  reset() {
    this.hp = this.maxHp;
  }
}
