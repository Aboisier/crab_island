import { keyPressed, Sprite } from "kontra";
import { DEEP_WATER } from "./map";

export class Player {
  constructor(config, map) {
    this.wood = 0;
    this.crab = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.tileSize = config.tileSize;
    this.maxSpeed = config.maxSpeed;

    this.map = map;
    this.sprite = Sprite({
      x: 200,
      y: 200,
      width: this.tileSize * 0.55,
      height: this.tileSize * 0.55,
      color: "#DA61D0",
    });
  }

  render() {
    this.sprite.render();
  }

  update() {
    this.updatePosition();
    this.sprite.update();

    this.health -= Math.sqrt(
      Math.pow(this.sprite.dx / 62, 2) + Math.pow(this.sprite.dy / 62, 2)
    );
    this.health -= 0.01;
  }

  updatePosition() {
    if (
      this.isMoveRight() &&
      this.canMove(
        this.sprite.x + this.sprite.dx + this.tileSize / 2,
        this.sprite.y
      )
    )
      this.sprite.ddx = 1;
    else if (
      this.isMoveLeft() &&
      this.canMove(
        this.sprite.x + this.sprite.dx - this.tileSize / 2,
        this.sprite.y
      )
    )
      this.sprite.ddx = -1;
    else {
      this.sprite.ddx /= 1.2;
      this.sprite.dx = 0;
    }

    if (
      this.isMoveUp() &&
      this.canMove(
        this.sprite.x,
        this.sprite.y + this.sprite.dy - this.tileSize / 2
      )
    )
      this.sprite.ddy = -1;
    else if (
      this.isMoveDown() &&
      this.canMove(
        this.sprite.x,
        this.sprite.y + this.sprite.dy + this.tileSize / 2
      )
    )
      this.sprite.ddy = 1;
    else {
      this.sprite.ddy /= 1.2;
      this.sprite.dy = 0;
    }

    if (this.sprite.dx > 1) this.sprite.dx = this.maxSpeed;
    if (this.sprite.dx < -1) this.sprite.dx = -this.maxSpeed;
    if (this.sprite.dy > 1) this.sprite.dy = this.maxSpeed;
    if (this.sprite.dy < -1) this.sprite.dy = -this.maxSpeed;
  }

  isMoveLeft() {
    return keyPressed("a");
  }

  isMoveRight() {
    return keyPressed("d");
  }

  isMoveUp() {
    return keyPressed("w");
  }

  isMoveDown() {
    return keyPressed("s");
  }

  isAction() {
    return keyPressed("space");
  }

  canMove(x, y) {
    return this.map.tile(x, y) !== DEEP_WATER;
  }
}
