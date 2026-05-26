import { Container, Graphics } from 'pixi.js';
import { PhysicsBody, PhysicsSystem } from '../systems/PhysicsSystem';
import { InputSystem } from '../systems/InputSystem';
import { TILE_SIZE } from '../../utils/constants';

const MOVE_SPEED = 1.5 * TILE_SIZE; // 1.5 tiles/s → pixels/s
const JUMP_VELOCITY = -5 * TILE_SIZE * 2; // tuned for ~5 tile jump height
const INVINCIBLE_TIME = 1.5;

export class Player {
  body: PhysicsBody;
  container = new Container();
  facingRight = true;
  shooting = false;
  shootTimer = 0;
  invincibleTimer = 0;
  dead = false;
  private sprite: Graphics;

  constructor(x: number, y: number, private physics: PhysicsSystem) {
    this.body = physics.createBody(x, y, 24, 32);
    this.sprite = new Graphics();
    this.drawSprite(0x4488ff);
    this.container.addChild(this.sprite);
  }

  private drawSprite(color: number) {
    this.sprite.clear();
    this.sprite.beginFill(color);
    this.sprite.drawRect(0, 0, 24, 32);
    this.sprite.endFill();
    // helmet
    this.sprite.beginFill(0x2266cc);
    this.sprite.drawRect(4, 0, 16, 10);
    this.sprite.endFill();
  }

  setColor(color: number) {
    this.drawSprite(color);
  }

  update(dt: number, input: InputSystem, tileSolid: (col: number, row: number) => boolean): boolean {
    if (this.dead) return false;

    // Movement
    this.body.vx = 0;
    if (input.isHeld('ArrowLeft') || input.isHeld('KeyA')) {
      this.body.vx = -MOVE_SPEED;
      this.facingRight = false;
    }
    if (input.isHeld('ArrowRight') || input.isHeld('KeyD')) {
      this.body.vx = MOVE_SPEED;
      this.facingRight = true;
    }

    // Jump (variable height)
    if ((input.justPressed('ArrowUp') || input.justPressed('KeyX') || input.justPressed('Space')) && this.body.onGround) {
      this.body.vy = JUMP_VELOCITY;
    }
    // Cut jump short
    if ((input.justReleased('ArrowUp') || input.justReleased('KeyX') || input.justReleased('Space')) && this.body.vy < 0) {
      this.body.vy *= 0.5;
    }

    // Shoot
    let wantsShoot = false;
    if (input.justPressed('KeyZ') || input.justPressed('ControlLeft') || input.justPressed('ControlRight')) {
      wantsShoot = true;
      this.shooting = true;
      this.shootTimer = 0.2;
    }
    if (this.shootTimer > 0) {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) this.shooting = false;
    }

    // Physics
    this.physics.update(this.body, dt, tileSolid);

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
    this.sprite.scale.x = this.facingRight ? 1 : -1;
    this.sprite.x = this.facingRight ? 0 : 24;

    return wantsShoot;
  }

  takeDamage(amount: number): number {
    if (this.invincibleTimer > 0) return 0;
    this.invincibleTimer = INVINCIBLE_TIME;
    return amount;
  }

  die() {
    this.dead = true;
    this.container.visible = false;
  }

  get x() { return this.body.aabb.x + 12; }
  get y() { return this.body.aabb.y + 16; }
}
