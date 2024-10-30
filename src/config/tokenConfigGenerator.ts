import jws, { Algorithm } from 'jws';
import { Keys, canUsePublicKey, canUsePrivateKey } from '../utils/canUse';

export type JWS = typeof jws;
export type JSWAlgorithm = Algorithm;

export type TokenConfig = {
  requiredAud?: string;
  engine: JWS;
  expiresIn: () => number;
  now: () => number;
  algorithm: JSWAlgorithm;
  keys: Keys,
}

const nHoursFromNow = (n: number) => {
  return () => (Math.floor(Date.now() / 1000) + n * (60 * 60));
};

export default function({ expireTokensEveryNHours, algorithm, keys, requiredAud }: { expireTokensEveryNHours: number; algorithm: Algorithm; keys: Keys; requiredAud?: string; }): TokenConfig {
  if (!canUsePublicKey(algorithm, keys) && !canUsePrivateKey(algorithm, keys)) {
    throw new Error(`Bad configuration, not enough keys supplied to verify-only or sign and verify with the current algorithm`);
  }
  return {
    ...(requiredAud ? { requiredAud } : {}),
    engine: jws,
    expiresIn: nHoursFromNow(expireTokensEveryNHours),
    now: nHoursFromNow(0),
    algorithm,
    keys,
  };
};
