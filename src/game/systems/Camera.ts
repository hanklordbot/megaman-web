import { Container } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../../utils/constants';

export class Camera {
  readonly container = new Container();
  private targetX = 0;
  private targetY = 0;
  private _x = 0;
  private _y = 0;
  private levelWidth = GAME_WIDTH;
  private levelHeight = GAME_HEIGHT;

  setLevelBounds(w: number, h: number) {
    this.levelWidth = w;
    this.levelHeight = h;
  }

  follow(x: number, y: number) {
    this.targetX = x - GAME_WIDTH / 3;
    this.targetY = y - GAME_HEIGHT / 2;
  }

  update(_dt: number) {
    this._x = Math.max(0, Math.min(this.targetX, this.levelWidth - GAME_WIDTH));
    this._y = Math.max(0, Math.min(this.targetY, this.levelHeight - GAME_HEIGHT));
    this.container.x = -Math.round(this._x);
    this.container.y = -Math.round(this._y);
  }

  get x() { return this._x; }
  get y() { return this._y; }
}
