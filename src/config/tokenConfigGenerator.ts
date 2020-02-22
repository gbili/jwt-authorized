import jws, { Algorithm } from 'jws';
import { Keys, canUsePublicKey, canUsePrivateKey } from '../utils/canUse';

export type TokenConfig = {
  engine: typeof jws;
  expiresIn: () => number;
  now: () => number;
  algorithm: Algorithm;
  keys: Keys,
}

const nHoursFromNow = (n: number) => {
  return () => (Math.floor(Date.now() / 1000) + n * (60 * 60));
};

export default function({ expireTokensEveryNHours, algorithm, keys }: { expireTokensEveryNHours: number; algorithm: Algorithm; keys: Keys }): TokenConfig {
  if (!canUsePublicKey(algorithm, keys) && !canUsePrivateKey(algorithm, keys)) {
    throw new Error(`Bad configuration, not enough keys supplied to verify-only or sign and verify with the current algorithm`);
  }
  return {
    engine: jws,
    expiresIn: nHoursFromNow(expireTokensEveryNHours),
    now: nHoursFromNow(0),
    algorithm,
    keys,
  };
};
