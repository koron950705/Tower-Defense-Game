import { Game } from './game.js';
import { setupUI } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);
setupUI(game);
game.start();
