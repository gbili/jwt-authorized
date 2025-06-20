import { EventsInterface } from "../loaders/events";
import { TokenConfig } from "../config/tokenConfigGenerator";
import { TokenUserConstructor, UserInfoInstance } from "../models/TokenUser";
import { canUsePrivateKey, canUsePublicKey } from "../utils/canUse";

export type TokenPayload = {
  aud: string;
  exp: number;
}

export type TokenPayloadOverride = {
  [k: string]: string;
};

export type TokenConfigOverride = Partial<TokenConfig>;

export default class TokenAuthCustomizableService {

  public models: { TokenUser: TokenUserConstructor };
  public tokenConfig: TokenConfig;
  public events: EventsInterface;

  constructor({ models, tokenConfig, events }: { models: { TokenUser: TokenUserConstructor; }; tokenConfig: TokenConfig; events: EventsInterface }) {
    this.models = models;
    this.tokenConfig = tokenConfig;
    this.events = events;
  }

  authenticateTokenStrategy({ token, tokenConfig }: { token: string; tokenConfig: TokenConfigOverride; }) {
    const { TokenUser } = this.models;

    if (typeof token !== 'string') {
      throw new Error('TokenAuthService:authenticateTokenStrategy: no string token was provided, ensure that you pass a string token to this method');
    }

    const payload = this.verifyToken<TokenPayload & { UUID?: string; }>({ token, tokenConfig });

    if (!payload) {
      this.events.emit('TokenAuthService:authenticateTokenStrategy:fail wrong secret', token);
      throw new Error(`TokenAuthService:authenticateTokenStrategy() authentication fail, please login again ${token}`);
    }

    const { exp: expirationTime, UUID } = payload;

    if (!UUID) {
      this.events.emit('TokenAuthService:authenticateTokenStrategy:fail needs someone to authenticate', token);
      throw new Error(`TokenAuthService:authenticateTokenStrategy() authentication fail, ask your devs to pass a UUID in the token.`);
    }

    const finalTokenConfig = {
      ...this.tokenConfig,
      ...tokenConfig,
    }

    if (expirationTime <= finalTokenConfig.now()) {
      this.events.emit('TokenAuthService:authenticateTokenStrategy:fail expired token', token);
      throw new Error(`TokenAuthService:authenticateTokenStrategy() authentication fail, please login again ${token}`);
    }

    const tokenUser = new TokenUser({ userInfo: { UUID, ...payload }, token });
    this.events.emit('TokenAuthService:authenticateTokenStrategy:success', tokenUser);

    return tokenUser;
  }

  verifyToken<P extends TokenPayload = TokenPayload>({ token, tokenConfig }: { token: string; tokenConfig: TokenConfigOverride; }): P | false | never {
    if (token === undefined) {
      throw new Error('verifyToken({ token }), token param not provided (undefined)');
    }
    if (typeof token !== 'string' || token.split('.').length !== 3) {
      throw new Error('verifyToken({ token }), token param must be a string with two dots');
    }
    const { engine, algorithm, keys } = {
      ...this.tokenConfig,
      ...tokenConfig,
    };
    let secret = null;
    if (canUsePrivateKey(algorithm, keys)) {
      secret = keys.privateKey;
    } else if (canUsePublicKey(algorithm, keys)) {
      secret = keys.publicKey;
    } else {
      throw new Error(`TokenAuthService:verifyToken() unsupported encryption algorithm ${algorithm}`);
    }

    const tokenMatchesSecret = engine.verify(token, algorithm, secret);
    if (!tokenMatchesSecret) {
      this.events.emit('TokenAuthService:verifyToken:fail', token);
      throw new Error(`TokenAuthService:verifyToken() authentication fail bad secret`);
    }

    const signature = engine.decode(token);

    if (!signature) {
      this.events.emit('TokenAuthService:verifyToken:fail', token);
      throw new Error(`TokenAuthService:verifyToken() authentication fail unable to decode, token: ${token}`);
    }

    const { payload: jsonPayload } = signature

    this.events.emit('TokenAuthService:verifyToken:success', jsonPayload);

    if (!jsonPayload) {
      this.events.emit('TokenAuthService:verifyToken:fail', token);
      throw new Error(`TokenAuthService:verifyToken() authentication fail unable to get jsonPayload: ${token}`);
    }

    const payload: P = JSON.parse(jsonPayload);

    if (!payload.exp || !payload.aud) {
      this.events.emit('TokenAuthService:verifyToken:fail token was malformed by server', token);
      throw new Error(`TokenAuthService:verifyToken() authentication fail missing exp or aud, token: ${token}`);
    }

    if (tokenConfig.requiredAud && payload.aud !== tokenConfig.requiredAud) {
      this.events.emit('TokenAuthService:verifyToken:fail', token);
      throw new Error(`TokenAuthService:verifyToken() authentication fail service impersonation. requiredAud: ${this.tokenConfig.requiredAud}, aud: ${payload.aud}, token: ${token}`);
    }

    return payload;
  }

  generateToken<P extends TokenPayloadOverride>({ tokenConfig, payload }: { user?: UserInfoInstance, tokenConfig: TokenConfigOverride, payload: P }) {
    const finalConfig = {
      ...this.tokenConfig,
      ...tokenConfig,
    };
    const { engine, expiresIn, algorithm, keys } = finalConfig;
    if (!canUsePrivateKey(algorithm, keys)) {
      throw new Error(`In order to sign and generate tokens with the supported algorithms a "privateKey" is required`);
    }
    const secret = keys.privateKey;

    const secretOrPrivateKey = algorithm.charAt(0) === 'R'
      ? 'privateKey'
      : 'secret';

    if (!payload.aud) {
      throw new Error(`TokenAuthService:generateToken() Error: a param with prop { payload } must have been set and have aud property ${payload}`);
    }

    const enhancedPayload = payload || ({} as P);

    const finalPayload: TokenPayload & P = {
      aud: payload.aud,
      exp: expiresIn(),
      ...enhancedPayload,
    }

    const options = {
      header: {
        alg: algorithm
      },
      payload: finalPayload,
      [secretOrPrivateKey]: secret,
    };

    const token: string = engine.sign(options);
    this.events.emit('TokenAuthService:generateToken:success', token);

    return token;
  }

}
