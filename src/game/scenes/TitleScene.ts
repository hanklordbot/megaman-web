import { Container, Text } from 'pixi.js';
import { Scene, SceneManager } from './SceneManager';
import { InputSystem } from '../systems/InputSystem';
import { GameState } from '../GameState';
import { GAME_WIDTH, GAME_HEIGHT } from '../../utils/constants';
import { StageSelectScene } from './StageSelectScene';

export class TitleScene implements Scene {
  container = new Container();
  private sceneManager: SceneManager;
  private input: InputSystem;
  private gameState: GameState;
  private blinkTimer = 0;
  private promptText: Text;

  constructor(sceneManager: SceneManager, input: InputSystem, gameState?: GameState) {
    this.sceneManager = sceneManager;
    this.input = input;
    this.gameState = gameState ?? new GameState();

    const title = new Text('MEGA MAN', {
      fontFamily: 'monospace',
      fontSize: 24,
      fill: 0x4488ff,
      align: 'center',
    });
    title.anchor.set(0.5);
    title.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 3);

    this.promptText = new Text('PRESS ENTER', {
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0xffffff,
      align: 'center',
    });
    this.promptText.anchor.set(0.5);
    this.promptText.position.set(GAME_WIDTH / 2, GAME_HEIGHT * 0.65);

    this.container.addChild(title, this.promptText);
  }

  update(dt: number) {
    this.blinkTimer += dt;
    this.promptText.visible = Math.floor(this.blinkTimer * 2) % 2 === 0;

    if (this.input.justPressed('Enter')) {
      this.sceneManager.replace(new StageSelectScene(this.sceneManager, this.input, this.gameState));
    }
  }
}
