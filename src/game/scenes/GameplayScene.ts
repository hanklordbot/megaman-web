import { Container, Graphics } from 'pixi.js';
import { Scene, SceneManager } from './SceneManager';
import { InputSystem } from '../systems/InputSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { Camera } from '../systems/Camera';
import { Player } from '../entities/Player';
import { BulletSystem } from '../entities/BulletSystem';
import { Enemy, createEnemy } from '../entities/Enemy';
import { Boss, createBoss } from '../entities/Boss';
import { ItemSystem } from '../entities/ItemSystem';
import { HUD } from '../ui/HUD';
import { GameState, WeaponType } from '../GameState';
import { LevelData, generateTestLevel } from '../levels/LevelLoader';
import { TILE_SIZE, GAME_WIDTH, GAME_HEIGHT } from '../../utils/constants';
import { GameOverScene } from './GameOverScene';
import { StageSelectScene } from './StageSelectScene';

export class GameplayScene implements Scene {
  container = new Container();
  private sceneManager: SceneManager;
  private input: InputSystem;
  private physics = new PhysicsSystem();
  private camera: Camera;
  private player: Player;
  private bullets: BulletSystem;
  private enemies: Enemy[] = [];
  private boss: Boss | null = null;
  private items: ItemSystem;
  private hud: HUD;
  private gameState: GameState;
  private level: LevelData;
  private tileContainer = new Container();
  private enemyBullets: { aabb: { x: number; y: number; w: number; h: number }; vx: number; vy: number; damage: number; sprite: Graphics }[] = [];
  private enemyBulletContainer = new Container();
  private bossActive = false;
  private deathTimer = 0;
  private bossDefeatedTimer = 0;
  private stageId: string;

  constructor(sceneManager: SceneManager, input: InputSystem, gameState: GameState, stageId: string) {
    this.sceneManager = sceneManager;
    this.input = input;
    this.gameState = gameState;
    this.stageId = stageId;
    this.level = generateTestLevel(stageId);

    this.camera = new Camera();
    this.camera.setLevelBounds(this.level.width * TILE_SIZE, this.level.height * TILE_SIZE);

    this.player = new Player(this.level.playerStart.x, this.level.playerStart.y, this.physics);
    this.bullets = new BulletSystem();
    this.items = new ItemSystem();
    this.hud = new HUD();

    // Build tile visuals
    this.buildTiles();

    // Spawn enemies
    for (const e of this.level.enemies) {
      const enemy = createEnemy(e.type, e.x, e.y);
      this.enemies.push(enemy);
      this.camera.container.addChild(enemy.container);
    }

    // Assemble scene graph
    this.camera.container.addChild(this.tileContainer);
    this.camera.container.addChild(this.player.container);
    this.camera.container.addChild(this.bullets.container);
    this.camera.container.addChild(this.items.container);
    this.camera.container.addChild(this.enemyBulletContainer);
    this.container.addChild(this.camera.container);
    this.container.addChild(this.hud.container);
  }

  private buildTiles() {
    const g = new Graphics();
    for (let row = 0; row < this.level.height; row++) {
      for (let col = 0; col < this.level.width; col++) {
        if (this.level.tiles[row]?.[col] === 1) {
          g.beginFill(0x444466);
          g.drawRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          g.endFill();
        }
      }
    }
    this.tileContainer.addChild(g);
  }

  private tileSolid = (col: number, row: number): boolean => {
    if (row < 0 || row >= this.level.height || col < 0 || col >= this.level.width) return true;
    return this.level.tiles[row]?.[col] === 1;
  };

  update(dt: number) {
    if (this.bossDefeatedTimer > 0) {
      this.bossDefeatedTimer -= dt;
      if (this.bossDefeatedTimer <= 0) this.onBossDefeated();
      return;
    }

    if (this.player.dead) {
      this.deathTimer += dt;
      if (this.deathTimer > 2) this.handleDeath();
      return;
    }

    // Player update
    const wantsShoot = this.player.update(dt, this.input, this.tileSolid);
    if (wantsShoot) this.tryShoot();

    // Check boss room entry
    if (!this.bossActive && this.level.bossId && this.player.x > (this.level.width - 17) * TILE_SIZE) {
      this.activateBoss();
    }

    // Bullets
    this.bullets.update(dt, this.camera.x);

    // Enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.update(dt, this.player.x, this.player.y);
      // Enemy bullets
      const eBullets = e.getBullets?.() ?? [];
      for (const eb of eBullets) this.spawnEnemyBullet(eb);
    }

    // Boss
    if (this.boss?.alive) {
      this.boss.update(dt, this.player.x, this.player.y);
      const bBullets = this.boss.getBullets();
      for (const bb of bBullets) this.spawnEnemyBullet(bb);
    }

    // Items
    this.items.update(dt);

    // Collisions
    this.checkBulletEnemyCollisions();
    this.checkBulletBossCollisions();
    this.checkPlayerEnemyCollisions();
    this.checkPlayerItemCollisions();
    this.checkEnemyBulletPlayerCollisions(dt);

    // Pit death
    if (this.player.body.aabb.y > this.level.height * TILE_SIZE) {
      this.gameState.hp = 0;
      this.player.die();
    }

    // Camera
    this.camera.follow(this.player.x, this.player.y);
    this.camera.update(dt);

    // HUD
    this.hud.update(this.gameState, this.boss?.hp ?? 0, this.boss?.maxHp ?? 28);
  }

  private tryShoot() {
    const wt = this.gameState.currentWeapon;
    if (wt === WeaponType.MegaBuster) {
      if (!this.bullets.canShootBuster()) return;
    } else {
      if (!this.gameState.useAmmo(wt)) return;
    }
    const x = this.player.facingRight ? this.player.body.aabb.x + 24 : this.player.body.aabb.x;
    const y = this.player.body.aabb.y + 12;
    this.bullets.shoot(x, y, this.player.facingRight, wt);
  }

  private activateBoss() {
    if (!this.level.bossId) return;
    this.bossActive = true;
    this.boss = createBoss(this.level.bossId, this.level.bossX!, this.level.bossY!);
    this.boss.setFloorY(this.level.bossY!);
    this.camera.container.addChild(this.boss.container);
    this.hud.showBossHp(true);
  }

  private spawnEnemyBullet(b: { x: number; y: number; vx: number; vy: number; damage: number }) {
    const sprite = new Graphics();
    sprite.beginFill(0xff6666);
    sprite.drawCircle(3, 3, 3);
    sprite.endFill();
    const eb = { aabb: { x: b.x, y: b.y, w: 6, h: 6 }, vx: b.vx, vy: b.vy, damage: b.damage, sprite };
    this.enemyBullets.push(eb);
    this.enemyBulletContainer.addChild(sprite);
  }

  private checkBulletEnemyCollisions() {
    for (const b of this.bullets.bullets) {
      if (!b.alive) continue;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        // Check invincibility
        if (e.isInvincible) continue;
        if (PhysicsSystem.aabbOverlap(b.aabb, e.aabb)) {
          e.hp -= b.damage;
          if (!b.piercing) b.alive = false;
          if (e.hp <= 0) {
            e.alive = false;
            e.container.visible = false;
            this.gameState.score += 100;
            this.items.tryDrop(e.aabb.x, e.aabb.y);
          }
        }
      }
    }
  }

  private checkBulletBossCollisions() {
    if (!this.boss?.alive) return;
    for (const b of this.bullets.bullets) {
      if (!b.alive) continue;
      if (PhysicsSystem.aabbOverlap(b.aabb, this.boss.aabb)) {
        const dmg = this.gameState.getDamage(b.weaponType, this.boss.id);
        this.boss.hp -= dmg;
        if (!b.piercing) b.alive = false;
        if (this.boss.hp <= 0) {
          this.boss.alive = false;
          this.boss.container.visible = false;
          this.gameState.score += 1000;
          this.gameState.defeatedBosses.add(this.stageId);
          this.awardWeapon();
          this.bossDefeatedTimer = 2;
        }
      }
    }
  }

  private awardWeapon() {
    const weaponMap: Record<string, WeaponType> = {
      cutman: WeaponType.RollingCutter,
      gutsman: WeaponType.SuperArm,
      iceman: WeaponType.IceSlasher,
      bombman: WeaponType.HyperBomb,
      fireman: WeaponType.FireStorm,
      elecman: WeaponType.ThunderBeam,
    };
    const wt = weaponMap[this.stageId];
    if (wt) this.gameState.addWeapon(wt);
  }

  private checkPlayerEnemyCollisions() {
    const pAABB = this.player.body.aabb;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (PhysicsSystem.aabbOverlap(pAABB, e.aabb)) {
        const dmg = this.player.takeDamage(e.damage);
        this.gameState.hp -= dmg;
        if (this.gameState.hp <= 0) { this.gameState.hp = 0; this.player.die(); }
      }
    }
    if (this.boss?.alive && PhysicsSystem.aabbOverlap(pAABB, this.boss.aabb)) {
      const dmg = this.player.takeDamage(this.boss.damage);
      this.gameState.hp -= dmg;
      if (this.gameState.hp <= 0) { this.gameState.hp = 0; this.player.die(); }
    }
  }

  private checkPlayerItemCollisions() {
    const pAABB = this.player.body.aabb;
    for (const item of this.items.items) {
      if (!item.alive) continue;
      if (PhysicsSystem.aabbOverlap(pAABB, item.aabb)) {
        item.alive = false;
        const effect = ItemSystem.getEffect(item.type);
        if (effect.hp) this.gameState.hp = Math.min(this.gameState.hp + effect.hp, this.gameState.maxHp);
        if (effect.ammo) this.gameState.restoreAmmo(effect.ammo);
        if (effect.lives) this.gameState.lives += effect.lives;
        if (effect.score) this.gameState.score += effect.score;
      }
    }
  }

  private checkEnemyBulletPlayerCollisions(dt: number) {
    const pAABB = this.player.body.aabb;
    this.enemyBullets = this.enemyBullets.filter(eb => {
      eb.aabb.x += eb.vx * dt;
      eb.aabb.y += eb.vy * dt;
      eb.sprite.x = Math.round(eb.aabb.x);
      eb.sprite.y = Math.round(eb.aabb.y);
      // Off screen
      if (eb.aabb.x < this.camera.x - 32 || eb.aabb.x > this.camera.x + GAME_WIDTH + 32 || eb.aabb.y < -32 || eb.aabb.y > GAME_HEIGHT + 32) {
        this.enemyBulletContainer.removeChild(eb.sprite);
        eb.sprite.destroy();
        return false;
      }
      // Hit player
      if (PhysicsSystem.aabbOverlap(pAABB, eb.aabb)) {
        const dmg = this.player.takeDamage(eb.damage);
        this.gameState.hp -= dmg;
        if (this.gameState.hp <= 0) { this.gameState.hp = 0; this.player.die(); }
        this.enemyBulletContainer.removeChild(eb.sprite);
        eb.sprite.destroy();
        return false;
      }
      return true;
    });
  }

  private handleDeath() {
    this.gameState.lives--;
    if (this.gameState.lives <= 0) {
      this.sceneManager.replace(new GameOverScene(this.sceneManager, this.input, this.gameState, this.stageId));
    } else {
      this.gameState.reset();
      this.sceneManager.replace(new GameplayScene(this.sceneManager, this.input, this.gameState, this.stageId));
    }
  }

  private onBossDefeated() {
    this.sceneManager.replace(new StageSelectScene(this.sceneManager, this.input, this.gameState));
  }

  exit() {
    this.bullets.clear();
    this.items.clear();
  }
}
