"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _tokenAuthService = _interopRequireDefault(require("./tokenAuthService"));

var _getExpirationTime = _interopRequireDefault(require("./getExpirationTime"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const loadThroughDi = function ({
  di,
  diMethodName,
  logger,
  events
}) {
  const injectionDict = {
    tokenAuthService: _tokenAuthService.default,
    getExpirationTime: _getExpirationTime.default
  };

  if (!logger && !di.has('logger')) {
    injectionDict.logger = require('./logger');
  }

  if (!events && !di.has('events')) {
    injectionDict.events = require('./events');
  }

  if (!diMethodName) {
    diMethodName = "addToLoadDict";
  }

  if (typeof di[diMethodName] !== 'function') {
    throw new Error(`Your di.${diMethodName} is not a function`);
  }

  di[diMethodName](injectionDict);
  return di;
};

var _default = loadThroughDi;
exports.default = _default;