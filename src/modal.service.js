import { emit, offKey, onKey, Sprite, Text } from "kontra";
import { primary, secondary, textForeground } from "./colors";
import { DIALOG_CLOSE, DIALOG_OPEN } from "./events";
import { canvas } from "./init";

export const modals = [];

let isPresenting = false;

export function present(title, text, height, ...actions) {
  if (isPresenting) return;
  isPresenting = true;

  const width = canvas.width * 0.48;

  const modal = Sprite({
    x: (canvas.width - width) / 2,
    y: (canvas.height - height) / 2 - 40,
    width: width,
    height: height,
    color: secondary,
  });

  modal.addChild(
    Sprite({
      x: 6,
      y: 6,
      width: width - 12,
      height: height - 12,
      color: primary,
    })
  );

  const font = "px Arial";
  modal.addChild(
    Text({
      y: 20,
      text: title,
      textAlign: "center",
      font: `40${font}`,
      color: textForeground,
      width: width,
      lineHeight: 1.5,
    })
  );

  const margin = 16;
  modal.addChild(
    Text({
      x: margin,
      y: 78,
      text: text,
      textAlign: "center",
      font: `24${font}`,
      color: textForeground,
      width: width - 2 * margin,
      lineHeight: 1.5,
    })
  );

  modal.addChild(
    Text({
      y: height - 42,
      text: actions.map((x) => x.label).join(" | "),
      textAlign: "center",
      font: `20${font}`,
      color: textForeground,
      width: width,
      lineHeight: 1.5,
    })
  );

  for (const action of actions) {
    const callback = () => {
      emit(DIALOG_CLOSE);
      modals.pop();
      isPresenting = false;
      action.action();
    };

    onKey(action.key, () => {
      offKey(action.key);
      callback();
    });
  }

  modals.push(modal);
  emit(DIALOG_OPEN);
}
