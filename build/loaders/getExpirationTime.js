"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = {
  instance: function ({
    secondsTTL
  }) {
    const time = new Date().getTime() + 1000 * secondsTTL;
    return time;
  }
};
exports.default = _default;