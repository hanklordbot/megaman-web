export class InputSystem {
  private held = new Set<string>();
  private pressed = new Set<string>();
  private released = new Set<string>();

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (!this.held.has(e.code)) {
        this.pressed.add(e.code);
      }
      this.held.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.held.delete(e.code);
      this.released.add(e.code);
    });
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
}
