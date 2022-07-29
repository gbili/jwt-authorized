import 'dotenv/config';
import { TokenUser } from '../models';
import tokenConfigGenerator from '../config/tokenConfigGenerator';
import { LoadDictElement, GetInstanceType } from 'di-why/build/src/DiContainer';
import getValidAlgorithmAndKeysObject from '../utils/validateAlgorithAndKeys';
import TokenAuthCustomizableService from '../services/TokenAuthCustomizableService';

export default function callableLoadDictElement(
    algorithm: string = process.env.JWT_ALGORITHM || 'HS256',
    privateKey: string = process.env.JWT_KEY_PRIVATE || '',
    publicKey: string = process.env.JWT_KEY_PUBLIC || '',
    hoursBeforeExpire: string = process.env.JWT_HOURS_BEFORE_EXPIRE || '1',
  ) {
  const validHoursBeforeExpire = parseInt(hoursBeforeExpire);
  privateKey = privateKey.split('\\n').join("\n");
  publicKey = publicKey.split('\\n').join("\n");
  const algoAndKeys = getValidAlgorithmAndKeysObject(algorithm, privateKey, publicKey);

  const loadDictElement: LoadDictElement<GetInstanceType<typeof TokenAuthCustomizableService>> = {
    constructible: TokenAuthCustomizableService,
    deps: {
      models: {
        TokenUser
      },
      tokenConfig: tokenConfigGenerator({
        expireTokensEveryNHours: validHoursBeforeExpire,
        ...algoAndKeys,
      }),
    },
    locateDeps: {
      events: 'events',
    },
  };
  return loadDictElement;
}