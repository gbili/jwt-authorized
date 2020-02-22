import 'dotenv/config';
import TokenAuthService from '../services/TokenAuthService';
import { TokenUser } from '../models';
import tokenConfigGenerator from '../config/tokenConfigGenerator';
import { LoadDictElement, GetInstanceType } from 'di-why/build/src/DiContainer';
import { Algorithm } from 'jws';
import { Keys, HSSignerAndVerifyerKeys, RSVerifyerOnlyKeys, RSSignerAndVerifyerKeys } from '../utils/canUse';

const hoursBeforeExpire = parseInt(process.env.JWT_HOURS_BEFORE_EXPIRE || '1');
const algorithm = ((algo: string): Algorithm | never => {
  const algos: Algorithm[] = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512', 'PS256', 'PS384', 'PS512', 'none'];
  if (algos.indexOf(algo as Algorithm) === -1) {
    throw new Error(`Unsupported algorithm value ${algo}`);
  }
  return algo as Algorithm;
})(process.env.JWT_ALGORITHM || 'HS256');

const keys: Keys = ((algorithm: string): Keys | never => {
  const privateKey = (process.env.JWT_KEY_PRIVATE || '').split('\\n').join("\n");
  const publicKey = (process.env.JWT_KEY_PUBLIC || '').split('\\n').join("\n");
  if (algorithm.charAt(0) === 'H') {
    if (privateKey.length <= 0) {
      throw new Error('The private key cannot be an empty string when using HMAC family');
    }
    const keys: HSSignerAndVerifyerKeys = {
      privateKey
    };
    return keys;
  }
  if (algorithm.charAt(0) === 'R') {
    if (publicKey.length <= 0) {
      throw new Error('One or more keys are missing for RS256 algorithm to work');
    }
    if (privateKey.length <= 0) {
      const keys: RSVerifyerOnlyKeys = {
        publicKey
      };
      return keys;
    }
    const keys: RSSignerAndVerifyerKeys = {
      publicKey,
      privateKey
    };
    return keys;
  }
  throw new Error(`Algorithm ${algorithm} is not supported, use HS256 or RS256`);
})(algorithm);

console.log('impimpimp: ', TokenAuthService);

const loadDictElement: LoadDictElement<GetInstanceType<typeof TokenAuthService>> = {
  constructible: TokenAuthService,
  deps: {
    models: {
      TokenUser
    },
    tokenConfig: tokenConfigGenerator({
      expireTokensEveryNHours: hoursBeforeExpire,
      algorithm,
      keys,
    }),
  },
  locateDeps: {
    events: 'events',
  },
};

export default loadDictElement;