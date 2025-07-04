import tokenAuthCustomizableServiceCallable from './tokenAuthCustomizableServiceCallable';
import DiContainer from 'di-why';
import { LoggerInterface, LoadDict } from 'di-why/build/src/DiContainer';
import { EventsInterface } from './events';

type CallableSingleArgLoadDictProp<T, S = keyof T> = S extends (keyof T)? (T[S] extends (arg: LoadDict) => any? S : never): never;
export type LoadThroughDiProps = {
  di: DiContainer;
  diMethodName?: CallableSingleArgLoadDictProp<DiContainer>
  logger?: LoggerInterface;
  events?: EventsInterface
};

const loadThroughDi = function({ di, diMethodName, logger, events }: LoadThroughDiProps) {
  const injectionDict: LoadDict = {
    tokenAuthCustomizableService: tokenAuthCustomizableServiceCallable(),
  };

  if (!logger && !di.hasLoaded('logger')) {
    injectionDict.logger = require('./logger');
  }

  if (!events && !di.hasLoaded('events')) {
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

export { loadThroughDi, tokenAuthCustomizableServiceCallable, }
export default loadThroughDi;
