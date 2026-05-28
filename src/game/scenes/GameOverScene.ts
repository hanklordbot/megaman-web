import { Container, Text } from 'pixi.js';
import { Scene, SceneManager } from './SceneManager';
import { InputSystem } from '../systems/InputSystem';
import { AudioManager } from '../systems/AudioManager';
import { GameState } from '../GameState';
import { GAME_WIDTH, GAME_HEIGHT } from '../../utils/constants';
import { StageSelectScene } from './StageSelectScene';
import { GameplayScene } from './GameplayScene';

export class GameOverScene implements Scene {
  container = new Container();
  private sceneManager: SceneManager;
  private input: InputSystem;
  private gameState: GameState;
  private stageId: string;
  private cursor = 0;
  private options: Text[] = [];

  constructor(sceneManager: SceneManager, input: InputSystem, gameState: GameState, stageId: string) {
    this.sceneManager = sceneManager;
    this.input = input;
    this.gameState = gameState;
    this.stageId = stageId;

    const title = new Text('GAME OVER', { fontFamily: 'monospace', fontSize: 20, fill: 0xff4444 });
    title.anchor.set(0.5);
    title.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 3);
    this.container.addChild(title);

    const cont = new Text('> CONTINUE', { fontFamily: 'monospace', fontSize: 10, fill: 0xffffff });
    cont.position.set(80, 140);
    const stageSelect = new Text('  STAGE SELECT', { fontFamily: 'monospace', fontSize: 10, fill: 0xffffff });
    stageSelect.position.set(80, 160);

    this.options = [cont, stageSelect];
    this.container.addChild(cont, stageSelect);
  }

  enter() {
    AudioManager.playBGM('gameover', false);
  }

  update(_dt: number) {
    if (this.input.justPressed('ArrowDown') || this.input.justPressed('KeyS')) this.cursor = 1;
    if (this.input.justPressed('ArrowUp') || this.input.justPressed('KeyW')) this.cursor = 0;

    this.options[0].text = this.cursor === 0 ? '> CONTINUE' : '  CONTINUE';
    this.options[1].text = this.cursor === 1 ? '> STAGE SELECT' : '  STAGE SELECT';

    if (this.input.justPressed('Enter') || this.input.justPressed('KeyZ')) {
      this.gameState.lives = 3;
      this.gameState.reset();
      if (this.cursor === 0) {
        this.sceneManager.replace(new GameplayScene(this.sceneManager, this.input, this.gameState, this.stageId));
      } else {
        this.sceneManager.replace(new StageSelectScene(this.sceneManager, this.input, this.gameState));
      }
    }
  }
}
