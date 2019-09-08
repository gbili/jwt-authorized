"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _TokenAuthService = _interopRequireDefault(require("../services/TokenAuthService"));

var _models = require("../models");

var _tokenConfigGenerator = _interopRequireDefault(require("../config/tokenConfigGenerator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = {
  constructible: _TokenAuthService.default,
  deps: {
    models: {
      TokenUser: _models.TokenUser
    },
    tokenConfig: (0, _tokenConfigGenerator.default)({
      expireTokensEveryNHours: 1
    })
  },
  locateDeps: {
    events: 'events'
  }
};
exports.default = _default;