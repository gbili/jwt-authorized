import jws, { Algorithm } from 'jws';
import { Keys } from '../loaders/tokenAuthService';

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
  if (!algorithm || (!keys.publicKey && !keys.privateKey)) {
    throw new Error(`Bad configuration, not enough keys need RSA with either publicKey or privateKey, or HMAC with privateKey`);
  }
  return {
    engine: jws,
    expiresIn: nHoursFromNow(expireTokensEveryNHours),
    now: nHoursFromNow(0),
    algorithm,
    keys,
  };
};
