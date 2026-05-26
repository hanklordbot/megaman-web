import { Container, Text } from 'pixi.js';
import { Scene, SceneManager } from './SceneManager';
import { InputSystem } from '../systems/InputSystem';
import { GAME_WIDTH, GAME_HEIGHT } from '../../utils/constants';

export class TitleScene implements Scene {
  container = new Container();
  private sceneManager: SceneManager;
  private input: InputSystem;

  constructor(sceneManager: SceneManager, input: InputSystem) {
    this.sceneManager = sceneManager;
    this.input = input;

    const title = new Text('MEGA MAN', {
      fontFamily: 'monospace',
      fontSize: 24,
      fill: 0x4488ff,
      align: 'center',
    });
    title.anchor.set(0.5);
    title.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 3);

    const prompt = new Text('PRESS ENTER', {
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0xffffff,
      align: 'center',
    });
    prompt.anchor.set(0.5);
    prompt.position.set(GAME_WIDTH / 2, GAME_HEIGHT * 0.65);

    this.container.addChild(title, prompt);
  }

  update(_dt: number) {
    if (this.input.justPressed('Enter')) {
      // Future: transition to stage select
    }
  }
}
