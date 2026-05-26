import { Application } from 'pixi.js';
import { FIXED_DT } from '../utils/constants';
import { SceneManager } from './scenes/SceneManager';
import { InputSystem } from './systems/InputSystem';
import { TitleScene } from './scenes/TitleScene';

export class Game {
  private app: Application;
  private sceneManager: SceneManager;
  private input: InputSystem;
  private accumulator = 0;
  private lastTime = 0;

  constructor(app: Application) {
    this.app = app;
    this.input = new InputSystem();
    this.sceneManager = new SceneManager(app.stage, this.input);
  }

  start() {
    this.sceneManager.push(new TitleScene(this.sceneManager, this.input));
    this.lastTime = performance.now();
    this.app.ticker.add(() => this.loop());
  }

  private loop() {
    const now = performance.now();
    const frameTime = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.accumulator += frameTime;

    while (this.accumulator >= FIXED_DT) {
      this.sceneManager.update(FIXED_DT);
      this.input.endFrame();
      this.accumulator -= FIXED_DT;
    }
  }
}
