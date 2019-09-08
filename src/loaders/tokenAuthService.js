import TokenAuthService from '../services/TokenAuthService';
import { TokenUser } from '../models';
import tokenConfigGenerator from '../config/tokenConfigGenerator';

const hoursBeforeExpire = process.env.JWT_HOURS_BEFORE_EXPIRE || 1;

export default {
  constructible: TokenAuthService,
  deps: {
    models: {
      TokenUser
    },
    tokenConfig: tokenConfigGenerator({ expireTokensEveryNHours: hoursBeforeExpire }),
  },
  locateDeps: {
    events : 'events',
  },
};
