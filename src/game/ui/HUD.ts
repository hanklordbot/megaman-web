import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { GameState, WeaponType } from '../GameState';
import { AssetLoader } from '../systems/AssetLoader';
import { GAME_WIDTH } from '../../utils/constants';

export class HUD {
  container = new Container();
  private playerHpBar: Graphics;
  private bossHpBar: Graphics;
  private weaponBar: Graphics;
  private scoreText: Text;
  private livesText: Text;
  private bossHpVisible = false;
  private hpSprite: Sprite | null = null;
  private weaponSprite: Sprite | null = null;
  private bossHpSprite: Sprite | null = null;
  private livesIcon: Sprite | null = null;

  constructor() {
    this.playerHpBar = new Graphics();
    this.playerHpBar.position.set(8, 16);
    this.bossHpBar = new Graphics();
    this.bossHpBar.position.set(GAME_WIDTH - 16, 16);
    this.bossHpBar.visible = false;
    this.weaponBar = new Graphics();
    this.weaponBar.position.set(18, 16);

    this.scoreText = new Text('000000', { fontFamily: 'monospace', fontSize: 8, fill: 0xffffff });
    this.scoreText.position.set(GAME_WIDTH / 2 - 24, 4);

    this.livesText = new Text('x3', { fontFamily: 'monospace', fontSize: 8, fill: 0xffffff });
    this.livesText.position.set(GAME_WIDTH - 32, 4);

    // Try to load HUD element sprites as decorative backgrounds
    const hpTex = AssetLoader.getHudTexture('hp_bar');
    if (hpTex) {
      this.hpSprite = new Sprite(hpTex);
      this.hpSprite.position.set(8, 16);
      this.container.addChild(this.hpSprite);
    }
    const wpTex = AssetLoader.getHudTexture('weapon_bar');
    if (wpTex) {
      this.weaponSprite = new Sprite(wpTex);
      this.weaponSprite.position.set(18, 16);
      this.container.addChild(this.weaponSprite);
    }
    const bpTex = AssetLoader.getHudTexture('boss_hp_bar');
    if (bpTex) {
      this.bossHpSprite = new Sprite(bpTex);
      this.bossHpSprite.position.set(GAME_WIDTH - 16, 16);
      this.bossHpSprite.visible = false;
      this.container.addChild(this.bossHpSprite);
    }
    const lTex = AssetLoader.getHudTexture('lives_icon');
    if (lTex) {
      this.livesIcon = new Sprite(lTex);
      this.livesIcon.position.set(GAME_WIDTH - 44, 2);
      this.container.addChild(this.livesIcon);
    }

    this.container.addChild(this.playerHpBar, this.bossHpBar, this.weaponBar, this.scoreText, this.livesText);
  }

  showBossHp(show: boolean) {
    this.bossHpVisible = show;
    this.bossHpBar.visible = show;
    if (this.bossHpSprite) this.bossHpSprite.visible = show;
  }

  update(state: GameState, bossHp = 0, bossMaxHp = 28) {
    // Player HP (vertical bar, top-down)
    this.playerHpBar.clear();
    if (!this.hpSprite) {
      this.playerHpBar.beginFill(0x333333);
      this.playerHpBar.drawRect(0, 0, 6, 56);
      this.playerHpBar.endFill();
    }
    const hpRatio = state.hp / state.maxHp;
    this.playerHpBar.beginFill(hpRatio > 0.3 ? 0x44ff44 : 0xff4444);
    this.playerHpBar.drawRect(0, 56 - Math.round(56 * hpRatio), 6, Math.round(56 * hpRatio));
    this.playerHpBar.endFill();

    // Weapon energy
    this.weaponBar.clear();
    if (state.currentWeapon !== WeaponType.MegaBuster) {
      const ammo = state.getAmmo(state.currentWeapon);
      const maxAmmo = 28;
      if (!this.weaponSprite) {
        this.weaponBar.beginFill(0x333333);
        this.weaponBar.drawRect(0, 0, 4, 56);
        this.weaponBar.endFill();
      }
      this.weaponBar.beginFill(0x4488ff);
      this.weaponBar.drawRect(0, 56 - Math.round(56 * ammo / maxAmmo), 4, Math.round(56 * ammo / maxAmmo));
      this.weaponBar.endFill();
    }

    // Boss HP
    if (this.bossHpVisible) {
      this.bossHpBar.clear();
      if (!this.bossHpSprite) {
        this.bossHpBar.beginFill(0x333333);
        this.bossHpBar.drawRect(0, 0, 6, 56);
        this.bossHpBar.endFill();
      }
      const bRatio = bossHp / bossMaxHp;
      this.bossHpBar.beginFill(0xff8800);
      this.bossHpBar.drawRect(0, 56 - Math.round(56 * bRatio), 6, Math.round(56 * bRatio));
      this.bossHpBar.endFill();
    }

    // Score & lives
    this.scoreText.text = String(state.score).padStart(6, '0');
    this.livesText.text = `x${state.lives}`;
  }
}
