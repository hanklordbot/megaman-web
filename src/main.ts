import { Application, SCALE_MODES, BaseTexture } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT } from './utils/constants';
import { Game } from './game/Game';

BaseTexture.defaultOptions.scaleMode = SCALE_MODES.NEAREST;

const app = new Application({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: 0x000000,
  resolution: 1,
  antialias: false,
});

function resize() {
  const scale = Math.max(1, Math.min(
    Math.floor(window.innerWidth / GAME_WIDTH),
    Math.floor(window.innerHeight / GAME_HEIGHT)
  ));
  const canvas = app.view as HTMLCanvasElement;
  canvas.style.width = `${GAME_WIDTH * scale}px`;
  canvas.style.height = `${GAME_HEIGHT * scale}px`;
  canvas.style.position = 'absolute';
  canvas.style.left = `${(window.innerWidth - GAME_WIDTH * scale) / 2}px`;
  canvas.style.top = `${(window.innerHeight - GAME_HEIGHT * scale) / 2}px`;
}

document.body.appendChild(app.view as HTMLCanvasElement);
window.addEventListener('resize', resize);
resize();

const game = new Game(app);
game.start().catch((err) => {
  console.error('Game start failed:', err);
});
