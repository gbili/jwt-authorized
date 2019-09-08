import tokenAuthService from './tokenAuthService';
import getExpirationTime from './getExpirationTime';

const loadThroughDi = function({ di, diMethodName, logger, events }) {
  const injectionDict = {
    tokenAuthService,
    getExpirationTime,
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

export default loadThroughDi;
