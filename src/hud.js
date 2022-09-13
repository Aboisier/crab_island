import { Sprite, Text } from "kontra";
import { primary, secondary, textForeground } from "./colors";

export class Hud {
  constructor(config, player) {
    this.config = config;
    this.player = player;

    const hudHeight = 80;
    this.bg = Sprite({
      x: 0,
      y: config.dimensions.height - hudHeight,
      color: primary,
      width: config.dimensions.width,
      height: hudHeight,
    });

    this.healthLine = Sprite({
      x: 0,
      y: -7,
      width: config.dimensions.width * (this.player.health / 100),
      height: 7,
      color: secondary,
    });

    this.bg.addChild(this.healthLine);

    const colTemplate = {
      text: "",
      font: "20px Arial",
      color: textForeground,
      textAlign: "left",
      lineHeight: 1.5,
    };

    this.columns = [];
    for (let i = 0; i < 13; ++i) {
      const col = Text({
        ...colTemplate,
        x: 16 + i * 80,
        y: 16,
      });
      this.bg.addChild(col);
      this.columns.push(col);
    }
  }

  update() {
    this.healthLine.width =
      this.config.dimensions.width * (this.player.health / 100);
    this.columns[0].text = `🌴 ${this.player.wood}`;
    this.columns[1].text = `🦀 ${this.player.crab}`;

    this.columns[12].text = `❤️ ${Math.round(this.player.health)}`;
    this.bg.update();
  }

  render() {
    this.bg.render();
  }
}
