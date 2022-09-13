function componentToHex(c) {
  var hex = Math.round(c * 256).toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgb(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
