"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _TokenAuthService = _interopRequireDefault(require("../services/TokenAuthService"));

var _models = require("../models");

var _tokenConfigGenerator = _interopRequireDefault(require("../config/tokenConfigGenerator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const hoursBeforeExpire = process.env.JWT_HOURS_BEFORE_EXPIRE || 1;
var _default = {
  constructible: _TokenAuthService.default,
  deps: {
    models: {
      TokenUser: _models.TokenUser
    },
    tokenConfig: (0, _tokenConfigGenerator.default)({
      expireTokensEveryNHours: hoursBeforeExpire
    })
  },
  locateDeps: {
    events: 'events'
  }
};
exports.default = _default;