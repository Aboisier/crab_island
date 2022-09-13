import { emit, GameLoop, initKeys, keyPressed, on } from "kontra";
import { RESTART } from "./events";
import { canvas } from "./init";
import { modals } from "./modal.service";
import { GameScene } from "./scene";

initKeys();

const config = {
  dimensions: { width: (4 / 3) * 800, height: (3 / 4) * 800 },
  tileSize: 32,
  maxSpeed: 0.5,
};

canvas.width = config.dimensions.width;
canvas.height = config.dimensions.height;

let scene = new GameScene(config);

on(RESTART, () => {
  scene = new GameScene(config);
  const modalsCount = modals.length;
  for (let i = 0; i < modalsCount; ++i) modals.pop();
});

let loop = GameLoop({
  update: function () {
    if (keyPressed("esc")) emit(RESTART);

    scene.update();
    for (const modal of modals) modal.update();
  },
  render: function () {
    scene.render();
    for (const modal of modals) modal.render();
  },
});

loop.start();
