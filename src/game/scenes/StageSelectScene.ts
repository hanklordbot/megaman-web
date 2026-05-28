import { Container, Graphics, Text } from 'pixi.js';
import { Scene, SceneManager } from './SceneManager';
import { InputSystem } from '../systems/InputSystem';
import { AudioManager } from '../systems/AudioManager';
import { GameState } from '../GameState';
import { GAME_WIDTH, GAME_HEIGHT } from '../../utils/constants';
import { GameplayScene } from './GameplayScene';

const BOSSES = [
  { id: 'cutman', name: 'CUT MAN', color: 0x888888 },
  { id: 'gutsman', name: 'GUTS MAN', color: 0xcc4400 },
  { id: 'iceman', name: 'ICE MAN', color: 0x2244aa },
  { id: 'bombman', name: 'BOMB MAN', color: 0x44aa44 },
  { id: 'fireman', name: 'FIRE MAN', color: 0xff4400 },
  { id: 'elecman', name: 'ELEC MAN', color: 0xffff00 },
];

export class StageSelectScene implements Scene {
  container = new Container();
  private sceneManager: SceneManager;
  private input: InputSystem;
  private gameState: GameState;
  private cursor = 0;
  private cursorSprite: Graphics;
  private bossSlots: Container[] = [];

  constructor(sceneManager: SceneManager, input: InputSystem, gameState: GameState) {
    this.sceneManager = sceneManager;
    this.input = input;
    this.gameState = gameState;

    // Title
    const title = new Text('SELECT STAGE', { fontFamily: 'monospace', fontSize: 10, fill: 0xffffff });
    title.anchor.set(0.5, 0);
    title.position.set(GAME_WIDTH / 2, 12);
    this.container.addChild(title);

    // 3x2 grid
    const startX = 40;
    const startY = 60;
    const gapX = 72;
    const gapY = 72;

    for (let i = 0; i < 6; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = startX + col * gapX;
      const y = startY + row * gapY;

      const slot = new Container();
      slot.position.set(x, y);

      const bg = new Graphics();
      const defeated = gameState.defeatedBosses.has(BOSSES[i].id);
      bg.beginFill(defeated ? 0x333333 : BOSSES[i].color);
      bg.drawRect(0, 0, 48, 48);
      bg.endFill();

      const label = new Text(BOSSES[i].name, { fontFamily: 'monospace', fontSize: 6, fill: defeated ? 0x666666 : 0xffffff });
      label.anchor.set(0.5, 0);
      label.position.set(24, 50);

      if (defeated) {
        const check = new Text('✓', { fontFamily: 'monospace', fontSize: 16, fill: 0x44ff44 });
        check.anchor.set(0.5);
        check.position.set(24, 24);
        slot.addChild(bg, check, label);
      } else {
        slot.addChild(bg, label);
      }

      this.bossSlots.push(slot);
      this.container.addChild(slot);
    }

    // Cursor
    this.cursorSprite = new Graphics();
    this.cursorSprite.lineStyle(2, 0xffffff);
    this.cursorSprite.drawRect(-2, -2, 52, 52);
    this.container.addChild(this.cursorSprite);
    this.updateCursor();

    // Check if all bosses defeated → show Wily message
    if (gameState.defeatedBosses.size >= 6) {
      const wilyText = new Text('DR. WILY AWAITS!', { fontFamily: 'monospace', fontSize: 8, fill: 0xff4444 });
      wilyText.anchor.set(0.5);
      wilyText.position.set(GAME_WIDTH / 2, GAME_HEIGHT - 20);
      this.container.addChild(wilyText);
    }
  }

  private updateCursor() {
    const slot = this.bossSlots[this.cursor];
    this.cursorSprite.position.set(slot.x, slot.y);
  }

  enter() {
    AudioManager.playBGM('stage_select');
  }

  update(_dt: number) {
    let moved = false;
    if (this.input.justPressed('ArrowRight') || this.input.justPressed('KeyD')) {
      if (this.cursor % 3 < 2) { this.cursor++; moved = true; }
    }
    if (this.input.justPressed('ArrowLeft') || this.input.justPressed('KeyA')) {
      if (this.cursor % 3 > 0) { this.cursor--; moved = true; }
    }
    if (this.input.justPressed('ArrowDown') || this.input.justPressed('KeyS')) {
      if (this.cursor < 3) { this.cursor += 3; moved = true; }
    }
    if (this.input.justPressed('ArrowUp') || this.input.justPressed('KeyW')) {
      if (this.cursor >= 3) { this.cursor -= 3; moved = true; }
    }
    if (moved) { this.updateCursor(); AudioManager.playSE('cursor'); }

    if (this.input.justPressed('Enter') || this.input.justPressed('KeyZ')) {
      const boss = BOSSES[this.cursor];
      if (!this.gameState.defeatedBosses.has(boss.id)) {
        this.gameState.reset();
        this.sceneManager.replace(new GameplayScene(this.sceneManager, this.input, this.gameState, boss.id));
      }
    }
  }
}
