"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _jws = _interopRequireDefault(require("jws"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const nHoursFromNow = n => {
  return _ => Math.floor(Date.now() / 1000) + n * (60 * 60);
};

function _default({
  expireTokensEveryNHours
}) {
  return {
    engine: _jws.default,
    expiresIn: nHoursFromNow(expireTokensEveryNHours),
    now: nHoursFromNow(0),
    algorithm: 'HS256',
    keys: {
      privateKey: process.env.JWT_KEY_PRIVATE
    }
  };
}

;