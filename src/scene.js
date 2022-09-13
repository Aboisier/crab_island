import { emit, on, Scene, Sprite } from "kontra";
import { DIALOG_CLOSE, DIALOG_OPEN, RESTART } from "./events";
import { Hud } from "./hud";
import { Map, MapObject as World } from "./map";
import { present } from "./modal.service";
import { Player } from "./player";

export class GameScene {
  constructor(config) {
    on(DIALOG_OPEN, () => (this.paused = true));
    on(DIALOG_CLOSE, () => (this.paused = false));

    this.scene = Scene({
      id: "game",
      objects: [],
    });

    this.map = new Map(config.tileSize);
    this.player = new Player(config, this.map);
    this.world = new World(config, this.map, this.player);
    this.hud = new Hud(config, this.player);

    const initialPosition = this.map.findSand();
    this.player.sprite.x = initialPosition.x;
    this.player.sprite.y = initialPosition.y;

    this.plane = Sprite({
      x: 300 + this.player.sprite.x + 240 * Math.random() - 120,
      y: 300 + this.player.sprite.y + 240 * Math.random() - 120,
      rotation: Math.random() * Math.PI * 2,
      width: config.tileSize,
      height: 4 * config.tileSize,
      color: "white",
    });

    this.plane.addChild(
      Sprite({
        x: config.tileSize / 2 - 35,
        y: config.tileSize * 1.5 + 10,
        rotation: Math.PI / 2 + 0.25,
        width: config.tileSize * 0.7,
        height: 2.3 * config.tileSize,
        color: "white",
      })
    );
    this.plane.addChild(
      Sprite({
        x: config.tileSize * 2.2 + config.tileSize / 2,
        y: config.tileSize * 1.5,
        rotation: Math.PI / 2 - 0.1,
        width: config.tileSize * 0.7,
        height: 2.6 * config.tileSize,
        color: "white",
      })
    );

    this.scene.add(
      ...this.world.tilesSprites,
      ...this.world.particlesSprites,
      ...this.world.crabsSprites,
      this.player.sprite,
      this.plane,
      ...this.world.treesSprites,
      ...this.world.smokeSprites
    );

    const instructionsModalFunc = () =>
      present(
        "How does this work?",
        'Use "wasd" to move. When you move, you lose energy. Use "space" to collect wood. Use "e" to drop a log and form a crab barrier of sorts. Walk on a crab to eat it. Crabs give you energy. Collect the most crabs to win eternal glory.',
        340,
        {
          label: "(Press enter to continue)",
          key: "enter",
          action: () => {},
        }
      );

    const hungryModalFunc = () =>
      present(
        "Welcome to Crab Island",
        "You're very hungry though. So, better not become too acquainted with those crabs, because you're going to have to eat them.",
        240,
        {
          label: "(Press enter to continue)",
          key: "enter",
          action: () => instructionsModalFunc(),
        }
      );

    present(
      "Welcome to the Island",
      'So your plane just crashed on this island. At least, you\'ve got an ax. The island has trees. And crabs! Actually, the island is called "Crab Island".',
      270,
      {
        label: "(Press enter to continue)",
        key: "enter",
        action: () => hungryModalFunc(),
      }
    );

    this.time = 0;
  }

  update() {
    this.time = (this.time + 1) % 10000;

    if (this.paused) return;

    this.scene.lookAt(this.player.sprite);
    this.scene.camera.setScale(1, 1);
    this.player.update();
    this.world.update();
    this.hud.update();

    if (this.time % 10 === 0) {
      this.world.popParticles(
        this.world.smokeSprites,
        this.plane.x,
        this.plane.y,
        1,
        "grey",
        0.5,
        this.plane.rotation,
        (Math.random() * Math.PI) / 3,
        1,
        0.999,
        10000
      );
    }

    if (this.player.health < 0) {
      present("DEATH", "Rip. You are dead. You starved to death.", 190, {
        label: "(Press enter to start again)",
        key: "enter",
        action: () => emit(RESTART),
      });
    }
  }

  render() {
    this.scene.render();
    this.hud.render();
  }
}
