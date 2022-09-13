import { angleToTarget, collides, Sprite } from "kontra";
import { BLOCK } from "./map";

const CHILLING = 0;
const FLEEING = 1;

export class Crab {
  constructor(x, y) {
    this.age = 0;
    this.maxAge = 200 + 200 * Math.random();
    this.behavior = CHILLING;
    this.behaviorCooldown = 0;
    this.speed = 2;
    this.maxDistance = 75;
    this.angle = 2 * Math.PI * Math.random();
    this.sprite = Sprite({
      x,
      y,
      width: 8,
      height: 8,
      color: "red",
      isAlive: false,
      opacity: 0,
    });
  }

  spawn(x, y) {
    this.sprite.x = x;
    this.sprite.y = y;
  }

  update(player, time, map) {
    const distance = Math.sqrt(
      Math.pow(player.sprite.x - this.sprite.x, 2),
      Math.pow(player.sprite.y - this.sprite.y, 2)
    );

    if (
      (this.sprite.isAlive &&
        ++this.age > this.maxAge &&
        this.sprite.dx < 0.01 &&
        this.sprite.dy < 0.01) ||
      distance > 1500
    ) {
      this.sprite.opacity = 0;
      this.sprite.isAlive = false;
    } else if (Math.random() < 0.0005 && !this.sprite.isAlive) {
      this.maxAge = 600 + 600 * Math.random();
      this.sprite.isAlive = true;
      this.sprite.x = player.sprite.x + 2000 * Math.random() - 1000;
      this.sprite.y = player.sprite.y + 2000 * Math.random() - 1000;
      this.sprite.opacity = 1;
    }

    if (!this.sprite.isAlive) return;

    --this.behaviorCooldown;
    if (this.behaviorCooldown < 0) this.behavior = CHILLING;

    if (distance < this.maxDistance) {
      time = 0;
      this.behavior = FLEEING;
      this.behaviorCooldown = 200;
      this.angle =
        angleToTarget(player.sprite, this.sprite) +
        (Math.random() * Math.PI) / 4 -
        Math.PI / 8;
    }

    if (time % (20 + Math.round(20 * Math.random())) == 0) {
      if (this.behavior === FLEEING) {
        this.angle += (Math.random() * Math.PI) / 4 - Math.PI / 8;
        this.speed = 2.1;
      } else if (this.behavior === CHILLING) {
        const rand = Math.random();
        this.speed = rand < 0.7 ? 0 : Math.random() - 0.5;
        this.angle += (Math.random() * Math.PI) / 4 - Math.PI / 8;
      }

      this.sprite.dx = this.speed * Math.sin(this.angle);
      this.sprite.dy = this.speed * Math.cos(this.angle);
    }

    if (collides(this.sprite, player.sprite)) {
      this.sprite.isAlive = false;
      ++player.crab;
      ++player.health;
      this.sprite.opacity = 0;
    }

    if (map.tile(this.sprite.x, this.sprite.y) === BLOCK) {
      this.sprite.dx = -(0.5 * this.sprite.dx);
      this.sprite.dy = -(0.5 * this.sprite.dy);
    }

    this.sprite.update();
  }

  render() {
    this.sprite.render();
  }
}
