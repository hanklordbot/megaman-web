import { Container } from 'pixi.js';
import { InputSystem } from '../systems/InputSystem';

export interface Scene {
  container: Container;
  update(dt: number): void;
  enter?(): void;
  exit?(): void;
}

export class SceneManager {
  private stack: Scene[] = [];
  private stage: Container;
  readonly input: InputSystem;

  constructor(stage: Container, input: InputSystem) {
    this.stage = stage;
    this.input = input;
  }

  get current(): Scene | undefined {
    return this.stack[this.stack.length - 1];
  }

  push(scene: Scene) {
    this.current?.exit?.();
    this.stack.push(scene);
    this.stage.addChild(scene.container);
    scene.enter?.();
  }

  pop(): Scene | undefined {
    const old = this.stack.pop();
    if (old) {
      old.exit?.();
      this.stage.removeChild(old.container);
    }
    this.current?.enter?.();
    return old;
  }

  replace(scene: Scene) {
    this.pop();
    this.push(scene);
  }

  update(dt: number) {
    this.current?.update(dt);
  }
}
