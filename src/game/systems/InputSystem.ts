export class InputSystem {
  private held = new Set<string>();
  private pressed = new Set<string>();
  private released = new Set<string>();
  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;

  constructor() {
    this.onKeyDown = (e: KeyboardEvent) => {
      if (!this.held.has(e.code)) {
        this.pressed.add(e.code);
      }
      this.held.add(e.code);
    };
    this.onKeyUp = (e: KeyboardEvent) => {
      this.held.delete(e.code);
      this.released.add(e.code);
    };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  isHeld(code: string): boolean {
    return this.held.has(code);
  }

  justPressed(code: string): boolean {
    return this.pressed.has(code);
  }

  justReleased(code: string): boolean {
    return this.released.has(code);
  }

  endFrame() {
    this.pressed.clear();
    this.released.clear();
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
