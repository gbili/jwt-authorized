import { EventsInterface } from "../loaders/events";
import { TokenConfig } from "../config/tokenConfigGenerator";
import { TokenUserConstructor, UserInfoInstance } from "../models/TokenUser";

export type TokenPayload = {
  aud: string;
  exp: number;
}

export default class TokenAuthService {

  public models: { TokenUser: TokenUserConstructor };
  public tokenConfig: TokenConfig;
  public events: EventsInterface;

  constructor({ models, tokenConfig, events }: { models: { TokenUser: TokenUserConstructor; }; tokenConfig: TokenConfig; events: EventsInterface }) {
    this.models = models;
    this.tokenConfig = tokenConfig;
    this.events = events;
  }

  authenticateTokenStrategy({ token }: { token: string }) {
    const { TokenUser } = this.models;

    const payload = this.verifyToken({ token });

    if (!payload) {
      this.events.emit('TokenAuthService:authenticateTokenStrategy:fail wrong secret', token);
      throw new Error(`TokenAuthService:authenticateTokenStrategy() authentication fail, please login again ${token}`);
    }

    const { exp: expirationTime, aud: UUID, } = payload;

    if (expirationTime <= this.tokenConfig.now()) {
      this.events.emit('TokenAuthService:authenticateTokenStrategy:fail expired token', token);
      throw new Error(`TokenAuthService:authenticateTokenStrategy() authentication fail, please login again ${token}`);
    }

    const tokenUser = new TokenUser({ userInfo: { UUID }, token });
    this.events.emit('TokenAuthService:authenticateTokenStrategy:success', tokenUser);

    return tokenUser;
  }

  verifyToken({ token }: { token: string }): TokenPayload | false | never {
    const { engine, algorithm, keys } = this.tokenConfig;
    let secret = null;
    if (algorithm.charAt(0) === 'H' && typeof keys.privateKey === 'string') {
      secret = keys.privateKey;
    } else if (algorithm.charAt(0) === 'R' && typeof keys.publicKey === 'string') {
      secret = keys.publicKey;
    } else {
      if ((!keys.privateKey && algorithm.charAt(0) === 'H') || !keys.publicKey) {
        throw new Error(`TokenAuthService:verifyToken() bad configuration, need a keys.publicKey with RSA algorithm or keys.privateKey with HMAC ${algorithm}`);
      }
      throw new Error(`TokenAuthService:verifyToken() unsupported encryption algorithm ${algorithm}`);
    }

    const tokenMatchesSecret = engine.verify(token, algorithm, secret);
    if (!tokenMatchesSecret) {
      this.events.emit('TokenAuthService:verifyToken:fail', token);
      return false;
    }

    const { payload: jsonPayload } = engine.decode(token);
    this.events.emit('TokenAuthService:verifyToken:success', jsonPayload);

    if (!jsonPayload) {
      this.events.emit('TokenAuthService:verifyToken:fail', token);
      throw new Error(`TokenAuthService:verifyToken() authentication fail provided: ${token}`);
    }

    const payload: TokenPayload = JSON.parse(jsonPayload);

    if (!payload.exp || !payload.aud) {
      this.events.emit('TokenAuthService:verifytoken:fail token was malformed by server', token);
      throw new Error(`TokenAuthService:verifytoken() authentication fail ${token}`);
    }

    return payload;
  }

  /**
   * IMPORTANT: If you are going to verify from a different server than the one who signs,
   * and that server is to be managed by someone else than the signing server,
   * then it makes sense to switch to RSA in order to withhold the signing
   * power within the signing server owners.
   */
  generateToken(user: UserInfoInstance) {
    const { engine, expiresIn, algorithm, keys } = this.tokenConfig;
    const secret = keys.privateKey;

    const secretOrPrivateKey = algorithm.charAt(0) === 'R'
      ? 'privateKey'
      : 'secret';

    const userID = user && (user.UUID || user.ID || null);

    if (null === userID) {
      throw new Error(`TokenAuthService:generateToken() Error: a param with prop { user } must have either a UUID or ID property ${user}`);
    }

    const payload: TokenPayload = {
      aud: userID,
      exp: expiresIn(),
    };

    const options = {
      header: {
        alg: algorithm
      },
      payload,
      [secretOrPrivateKey]: secret,
    };
    const token = engine.sign(options);
    this.events.emit('TokenAuthService:generateToken:success', token);

    return token;
  }

}
