import { Container, AnimatedSprite, Graphics, Texture } from 'pixi.js';
import { PhysicsBody, PhysicsSystem } from '../systems/PhysicsSystem';
import { InputSystem } from '../systems/InputSystem';
import { AssetLoader } from '../systems/AssetLoader';
import { AudioManager } from '../systems/AudioManager';
import { WeaponType } from '../GameState';
import { TILE_SIZE } from '../../utils/constants';

const MOVE_SPEED = 1.5 * TILE_SIZE;
const JUMP_VELOCITY = -5 * TILE_SIZE * 2;
const INVINCIBLE_TIME = 1.5;

const WEAPON_SHEET_MAP: Record<WeaponType, string> = {
  [WeaponType.MegaBuster]: 'megaman_mega_buster',
  [WeaponType.RollingCutter]: 'megaman_rolling_cutter',
  [WeaponType.SuperArm]: 'megaman_super_arm',
  [WeaponType.IceSlasher]: 'megaman_ice_slasher',
  [WeaponType.HyperBomb]: 'megaman_hyper_bomb',
  [WeaponType.FireStorm]: 'megaman_fire_storm',
  [WeaponType.ThunderBeam]: 'megaman_thunder_beam',
};

export class Player {
  body: PhysicsBody;
  container = new Container();
  facingRight = true;
  shooting = false;
  shootTimer = 0;
  invincibleTimer = 0;
  dead = false;
  private anim: AnimatedSprite | null = null;
  private fallback: Graphics;
  private currentAnim = '';
  private currentSheet = '';

  constructor(x: number, y: number, private physics: PhysicsSystem) {
    this.body = physics.createBody(x, y, 24, 32);
    this.fallback = new Graphics();
    this.fallback.beginFill(0x4488ff);
    this.fallback.drawRect(0, 0, 24, 32);
    this.fallback.endFill();
    this.container.addChild(this.fallback);
    this.setWeaponSprite(WeaponType.MegaBuster);
  }

  setWeaponSprite(weapon: WeaponType) {
    const sheetKey = WEAPON_SHEET_MAP[weapon];
    if (sheetKey === this.currentSheet) return;
    this.currentSheet = sheetKey;
    this.currentAnim = '';
    this.playAnim('idle');
  }

  private playAnim(name: string) {
    if (name === this.currentAnim) return;
    const textures = AssetLoader.getAnimationTextures(this.currentSheet, name);
    if (textures.length === 0) return;
    this.currentAnim = name;
    if (this.anim) { this.container.removeChild(this.anim); this.anim.destroy(); }
    this.anim = new AnimatedSprite(textures);
    this.anim.animationSpeed = 0.15;
    this.anim.play();
    this.anim.anchor.set(0.5, 1);
    this.anim.position.set(12, 32);
    this.container.addChild(this.anim);
    this.fallback.visible = false;
  }

  update(dt: number, input: InputSystem, tileSolid: (col: number, row: number) => boolean): boolean {
    if (this.dead) return false;

    this.body.vx = 0;
    if (input.isHeld('ArrowLeft') || input.isHeld('KeyA')) {
      this.body.vx = -MOVE_SPEED;
      this.facingRight = false;
    }
    if (input.isHeld('ArrowRight') || input.isHeld('KeyD')) {
      this.body.vx = MOVE_SPEED;
      this.facingRight = true;
    }

    if ((input.justPressed('ArrowUp') || input.justPressed('KeyX') || input.justPressed('Space')) && this.body.onGround) {
      this.body.vy = JUMP_VELOCITY;
      AudioManager.playSE('jump');
    }
    if ((input.justReleased('ArrowUp') || input.justReleased('KeyX') || input.justReleased('Space')) && this.body.vy < 0) {
      this.body.vy *= 0.5;
    }

    let wantsShoot = false;
    if (input.justPressed('KeyZ') || input.justPressed('ControlLeft') || input.justPressed('ControlRight')) {
      wantsShoot = true;
      this.shooting = true;
      this.shootTimer = 0.2;
      AudioManager.playSE('shoot');
    }
    if (this.shootTimer > 0) {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) this.shooting = false;
    }

    this.physics.update(this.body, dt, tileSolid);

    // Animation selection
    if (!this.body.onGround) {
      this.playAnim(this.shooting ? 'shoot_jump' : 'jump');
    } else if (this.body.vx !== 0) {
      this.playAnim(this.shooting ? 'shoot_walk' : 'walk');
    } else {
      this.playAnim(this.shooting ? 'shoot_stand' : 'idle');
    }

    // Invincibility
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
      this.container.visible = Math.floor(this.invincibleTimer * 10) % 2 === 0;
    } else {
      this.container.visible = true;
    }

    // Sync visual
    this.container.x = Math.round(this.body.aabb.x);
    this.container.y = Math.round(this.body.aabb.y);
    const scaleX = this.facingRight ? 1 : -1;
    if (this.anim) this.anim.scale.x = scaleX;
    this.fallback.scale.x = this.facingRight ? 1 : -1;
    this.fallback.x = this.facingRight ? 0 : 24;

    return wantsShoot;
  }

  takeDamage(amount: number): number {
    if (this.invincibleTimer > 0) return 0;
    this.invincibleTimer = INVINCIBLE_TIME;
    AudioManager.playSE('hurt');
    return amount;
  }

  die() {
    this.dead = true;
    this.container.visible = false;
    AudioManager.playSE('death');
  }

  get x() { return this.body.aabb.x + 12; }
  get y() { return this.body.aabb.y + 16; }
}
