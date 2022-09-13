import { Sprite, keyPressed, collides } from "kontra";
import { Crab } from "./crab";
import { Perlin } from "./perlin";

export const DEEP_WATER = "DEEP_WATER";
export const SHALLOW_WATER = "SHALLOW_WATER";
export const SAND = "SAND";
export const DARK_SAND = "DARK_SAND";
export const DARKER_SAND = "DARKER_SAND";
export const BLOCK = "BLOCK";

let tilesOffset = 0.0;
let time = 0;

export class Map {
  constructor(tileSize) {
    this.tileSize = tileSize;
    this.blocks = {};
    this.mapPerlin = new Perlin(Math.random());
  }

  key(x, y) {
    return `${x}.${y}`;
  }

  tile(x, y, noOffset = false) {
    if (
      this.blocks[
        this.key(Math.round(x / this.tileSize), Math.round(y / this.tileSize))
      ] != null
    )
      return this.blocks[
        this.key(Math.round(x / this.tileSize), Math.round(y / this.tileSize))
      ];

    const value = this.mapPerlin.simplex2(x / 2000, y / 2000);
    const waterOffset = noOffset ? 0 : Math.sin(tilesOffset) / 15;
    if (value - waterOffset < -0.2) return DEEP_WATER; // Deep water
    if (value - waterOffset < 0) return SHALLOW_WATER; // Shallow water
    if (value < 0.4) return SAND; // Sand
    if (value < 0.6) return DARK_SAND; // Darker sand
    return DARKER_SAND; // Even darker sand
  }

  trees(x1, y1, x2, y2) {
    const trees = [];
    const granularity = 32;
    const treeSize = 40;
    const initialx = Math.round(x1) - (Math.round(x1) % granularity);
    const initialy = Math.round(y1) - (Math.round(y1) % granularity);

    for (let x = initialx; x < Math.round(x2); x += granularity) {
      for (let y = initialy; y < Math.round(y2); y += granularity) {
        const actualx = x + (this.simplex2(x, y, 100) * treeSize) / 2;
        const actualy = y + (this.simplex2(x, y, -100) * treeSize) / 2;

        const value = this.simplex2(actualx, actualy, 3000);

        if (value < 0.75) continue;

        const tile1 = this.tile(actualx + 4 * treeSize, actualy, true);
        const tile2 = this.tile(actualx - 4 * treeSize, actualy, true);
        const tile3 = this.tile(actualx, actualy + 4 * treeSize, true);
        const tile4 = this.tile(actualx, actualy - 4 * treeSize, true);
        if (
          tile1 === SHALLOW_WATER ||
          tile1 === DEEP_WATER ||
          tile2 === SHALLOW_WATER ||
          tile2 === DEEP_WATER ||
          tile3 === SHALLOW_WATER ||
          tile3 === DEEP_WATER ||
          tile4 === SHALLOW_WATER ||
          tile4 === DEEP_WATER
        )
          continue;

        trees.push({
          x: actualx,
          y: actualy,
          size:
            30 +
            32 * Math.abs(this.simplex2(actualx / 100, actualy / 100, 900)),
        });
      }
    }

    return trees;
  }

  findSand() {
    let x = 0;
    while (this.tile(x++, 0) != DARK_SAND) {}

    return { x, y: 0 };
  }

  simplex2(x, y, offset = 0) {
    return this.mapPerlin.simplex2(x + offset, y + offset);
  }
}

export class MapObject {
  constructor(config, map, player) {
    this.width = 39;
    this.height = 23;
    this.player = player;
    this.tileSize = config.tileSize;
    this.map = map;

    this.tilesSprites = [];
    this.tilesSpritesMap = [];
    for (let x = 0; x < this.width; ++x) {
      this.tilesSpritesMap[x] = [];
      for (let y = 0; y < this.height; ++y) {
        const s = Sprite();
        this.tilesSprites.push(s);
        this.tilesSpritesMap[x][y] = s;
      }
    }

    this.trees = {};
    this.treesSprites = [];
    this.particlesSprites = [];
    this.smokeSprites = [];
    this.crabs = [];
    this.crabsSprites = [];

    for (let i = 0; i < 200; ++i) {
      this.treesSprites.push(Sprite());
      this.particlesSprites.push(Sprite({ isAlive: false, ttl: 0 }));
      this.smokeSprites.push(Sprite({ isAlive: false, color: "grey", ttl: 0 }));
      const crab = new Crab(
        200 * Math.random() - 100,
        200 * Math.random() - 100
      );
      this.crabs.push(crab);
      this.crabsSprites.push(crab.sprite);
    }

    this.update();
  }

  toTile(value) {
    if (value === DEEP_WATER) return "#0b92da"; // Deep water
    if (value === SHALLOW_WATER) return "#1da7ef"; // Shallow water
    if (value === SAND) return "#eaca68"; // Sand
    if (value === DARK_SAND) return "#d4b557"; // Darker sand
    if (value === DARKER_SAND) return "#c2a651"; // Darker sand
    return "#594d29"; // Darker sand
  }

  update() {
    time = ++time % (60 * 60 * 60);
    tilesOffset += 0.01;

    this.updateTiles();
    this.updateTrees();

    if (
      Math.abs(this.player.sprite.dx) + Math.abs(this.player.sprite.dy) > 0.1 &&
      this.map.tile(this.player.sprite.x, this.player.sprite.y) ===
        SHALLOW_WATER
    ) {
      this.popParticles(
        this.particlesSprites,
        this.player.sprite.x + this.player.sprite.width / 2,
        this.player.sprite.y + this.player.sprite.height / 2,
        1,
        "#66c3f4",
        1
      );
    }

    this.updateParticles();
    this.updateCrabs();
    this.updateActions();
  }

  updateCrabs() {
    for (const crab of this.crabs) crab.update(this.player, time, this.map);
  }

  updateParticles() {
    for (const particle of this.particlesSprites) {
      if (!particle.isAlive) continue;

      particle.ttl -= 1;
      if (particle.ttl <= 0) particle.isAlive = false;

      if (particle.dxFunc) particle.dx = particle.dxFunc(particle);
      if (particle.dyFunc) particle.dy = particle.dyFunc(particle);
      if (particle.opacityFunc)
        particle.opacity = particle.opacityFunc(particle);

      particle.update();
    }

    for (const particle of this.smokeSprites) {
      if (!particle.isAlive) continue;

      particle.ttl -= 1;
      if (particle.ttl <= 0) particle.isAlive = false;

      if (particle.dxFunc) particle.dx = particle.dxFunc(particle);
      if (particle.dyFunc) particle.dy = particle.dyFunc(particle);
      if (particle.opacityFunc)
        particle.opacity = particle.opacityFunc(particle);

      particle.update();
    }
  }

  updateActions() {
    if (keyPressed("space")) {
      for (const tree of this.treesSprites.filter((x) => x.isAlive)) {
        if (!collides(tree, this.player.sprite)) continue;

        tree.properties.health -= 1.1;
        if (Math.round(tree.properties.health) % 20 == 0) {
          this.popParticles(
            this.particlesSprites,
            tree.x + tree.width / 2,
            tree.y + tree.height / 2,
            3,
            "#275c27",
            2
          );
        }

        if (tree.properties.health <= 0) {
          this.player.wood += 1 + Math.round(tree.width / 30);
        }
      }
    }

    if (keyPressed("e")) {
      if (this.player.wood >= 1) {
        const px = Math.round(this.player.sprite.x / this.tileSize);
        const py = Math.round(this.player.sprite.y / this.tileSize);
        const key = this.map.key(px, py);
        if (this.map.blocks[key] == null) {
          --this.player.wood;
          this.map.blocks[key] = BLOCK;
        }
      }
    }
  }

  updateTiles() {
    for (let x = 0; x < this.width; ++x) {
      for (let y = 0; y < this.height; ++y) {
        const posx =
          Math.round(
            (this.player.sprite.x +
              (this.width * this.tileSize) / 2 -
              x * this.tileSize -
              (Math.round(this.player.sprite.x) % this.tileSize)) /
              this.tileSize
          ) *
            this.tileSize -
          this.tileSize * 2;

        const posy =
          Math.round(
            (this.player.sprite.y +
              (this.height * this.tileSize) / 2 -
              y * this.tileSize -
              (Math.round(this.player.sprite.y) % this.tileSize)) /
              this.tileSize
          ) *
            this.tileSize -
          this.tileSize * 2;

        const value = this.map.tile(posx, posy);
        const s = this.tilesSpritesMap[x][y];
        s.x = posx;
        s.y = posy;
        s.width = this.tileSize + 1;
        s.height = this.tileSize + 1;
        s.color = this.toTile(value);
      }
    }
  }

  updateTrees() {
    const trees = this.map.trees(
      this.player.sprite.x - 600,
      this.player.sprite.y - 350,
      this.player.sprite.x + 600,
      this.player.sprite.y + 350
    );

    for (let i = 0; i < this.treesSprites.length; ++i) {
      const s = this.treesSprites[i];
      if (i >= trees.length) {
        s.isAlive = false;
      } else {
        const treePosition = trees[i];
        s.x = treePosition.x;
        s.y = treePosition.y;
        s.width = treePosition.size;
        s.height = treePosition.size;
        s.color = "green";

        const key = `${s.x}${s.y}`;
        if (!this.trees[key]) this.trees[key] = { health: 100 };

        s.properties = this.trees[key];
        s.isAlive = s.properties.health > 0;
        s.opacity = s.properties.health > 0 ? 1 : 0;
      }
      s.update();
    }
  }

  popParticles(
    particles,
    x,
    y,
    count,
    color,
    maxVelocity,
    direction,
    spread,
    speedDecline = 0.97,
    opacityDecline = 0.99,
    ttl = 300
  ) {
    for (let i = 0; i < count; ++i) {
      const s = particles.reduce(
        (prev, curr) => (curr.ttl < prev.ttl ? curr : prev),
        { ttl: Infinity }
      );

      s.rotation = Math.random() * 360;
      const size = 5 + Math.random() * 5;
      s.width = size;
      s.height = size;

      if (direction == null) {
        direction = Math.random() * Math.PI * 2;
      }

      if (spread) {
        direction += 2 * spread * Math.random() - spread;
      }

      const velocity = maxVelocity * Math.random();

      s.dx = Math.sin(direction) * velocity;
      s.dy = Math.cos(direction) * velocity;

      s.dxFunc = (s) => s.dx * speedDecline;
      s.dyFunc = (s) => s.dy * speedDecline;
      s.opacityFunc = (s) => s.opacity * opacityDecline;

      s.x = x;
      s.y = y;
      s.ttl = ttl;
      s.isAlive = true;
      s.color = color;
      s.opacity = Math.random();
    }
  }
}
