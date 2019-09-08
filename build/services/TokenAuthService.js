"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class TokenAuthService {
  constructor({
    models,
    tokenConfig,
    events
  }) {
    this.models = models;
    this.tokenConfig = tokenConfig;
    this.events = events;
  }

  authenticateTokenStrategy({
    token
  }) {
    const {
      TokenUser
    } = this.models;
    const jsonPayload = this.verifyToken({
      token
    });

    if (!jsonPayload) {
      this.events.emit('AuthService:authenticateTokenStrategy:fail', token);
      throw new Error('AuthService:authenticateTokenStrategy() authentication fail', token);
    }

    const payload = JSON.parse(jsonPayload);

    if (!payload.exp || !payload.aud) {
      this.events.emit('AuthService:authenticateTokenStrategy:fail token was malformed by server', token);
      throw new Error('AuthService:authenticateTokenStrategy() authentication fail', token);
    }

    const {
      exp: expirationTime,
      aud: ID
    } = payload;

    if (expirationTime <= this.tokenConfig.now()) {
      this.events.emit('AuthService:authenticateTokenStrategy:fail expired token', token);
      throw new Error('AuthService:authenticateTokenStrategy() authentication fail, please login again', token);
    }

    const tokenUser = new TokenUser({
      userInfo: {
        ID
      },
      token
    });
    this.events.emit('AuthService:authenticateTokenStrategy:success', tokenUser);
    return tokenUser;
  }

  verifyToken({
    token
  }) {
    const {
      engine,
      expiresIn,
      algorithm,
      keys
    } = this.tokenConfig;
    let secret = null;

    if (!keys.privateKey) {
      throw new Error('AuthService:verifyToken() bad configuration, need at least a keys.privateKey', algorithm);
    }

    if (algorithm.charAt(0) === 'H') {
      secret = keys.privateKey;
    } else if (algorithm.charAt(0) === 'R') {
      if (!keys.publicKey) {
        throw new Error('AuthService:verifyToken() bad configuration, need a keys.publicKey with RSA algorithm', algorithm);
      }

      secret = keys.publicKey;
    } else {
      throw new Error('AuthService:verifyToken() unsupported encryption algorithm', algorithm);
    }

    const tokenMatchesSecret = engine.verify(token, algorithm, secret);

    if (!tokenMatchesSecret) {
      this.events.emit('AuthService:verifyToken:fail', token);
      return false;
    }

    const {
      payload
    } = engine.decode(token);
    this.events.emit('AuthService:verifyToken:success', payload);
    return payload;
  }
  /**
   * IMPORTANT: If you are going to verify from a different server than the one who signs,
   * and that server is to be managed by someone else than the signing server,
   * then it makes sense to switch to RSA in order to withhold the signing
   * power within the signing server owners.
   */


  generateToken({
    user
  }) {
    const {
      engine,
      expiresIn,
      algorithm,
      keys
    } = this.tokenConfig;
    const secret = keys.privateKey;
    const options = {
      header: {
        alg: algorithm
      },
      payload: {
        aud: user.ID,
        exp: expiresIn()
      },
      secret
    };
    const token = engine.sign(options);
    this.events.emit('AuthService:generateToken:success', token);
    return token;
  }

}

exports.default = TokenAuthService;