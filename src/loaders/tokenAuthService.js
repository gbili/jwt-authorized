import 'dotenv/config';
import TokenAuthService from '../services/TokenAuthService';
import { TokenUser } from '../models';
import tokenConfigGenerator from '../config/tokenConfigGenerator';

const hoursBeforeExpire = process.env.JWT_HOURS_BEFORE_EXPIRE || 1;
const algorithm = process.env.JWT_ALGORITHM || 'HS256';
const privateKey = (process.env.JWT_KEY_PRIVATE || '').split('\\n').join("\n");
const publicKey = (process.env.JWT_KEY_PUBLIC || '').split('\\n').join("\n");

const keys = {};

if (algorithm.charAt(0) === 'H' && privateKey.length > 0) {
  keys.privateKey = privateKey;
}
if (algorithm.charAt(0) === 'R') {
  if (privateKey.length > 0) {
    keys.privateKey = privateKey;
  }
  if (publicKey.length > 0) {
    keys.publicKey = publicKey;
  }
}

export default {
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
