![code coverage](https://img.shields.io/codecov/c/github/gbili/jwt-authorized.svg)
![version](https://img.shields.io/npm/v/jwt-authorized.svg)
![downloads](https://img.shields.io/npm/dm/jwt-authorized.svg)
![license](https://img.shields.io/npm/l/jwt-authorized.svg)

# Auth JWT

Use Json Web Tokens to authorize requests via `Authorization: Bearer <your-token>`

## Usage

**IMPORTANT**: add the private key to your env, if you are using `HS256` (default)
```javascript
process.env.JWT_KEY_PRIVATE = 'mysecret key'
```
**IMPORTANT**: add the private plus public keys to your env, if you are using `HMAC` (*currently not supported*)
```javascript
process.env.JWT_KEY_PUBLIC = 'some generated public key'
```

### Header Authorization Token Extractor
If you are using apollo, you might want to insert the `token` authorization into `context`. This can be acheived like so:
```javascript
import HeaderAuthTokenExtractor from 'jwt-authorized';
import templateStatusMessages from '../config/templateStatusMessages';

// some context that you want
const context = {
  authService: await serviceLocator.get('authService'),
  templateStatusMessages,
};

ApolloServer({
  //...
  context: HeaderAuthTokenExtractor.getAsyncContextReqMethod(context)
});
```

### TokenAuthService

First of all you need to load it somehow, either:
Use `di-why` dependency injection
```javascript
import { TokenAuthService, TokenUser, tokenConfigGenerator } from 'jwt-authorized';

export default {
  constructible: TokenAuthService,
  deps: {
    models: {
      TokenUser
    },
    tokenConfig: tokenConfigGenerator({ expireTokensEveryNHours: 1 }),
  },
  locateDeps: {
    events : 'events',
  },
};
```
Or alternatively do it manually:
```javascript
import { TokenAuthService, TokenUser, tokenConfigGenerator } from 'jwt-authorized';
//import events from ...

const tokenAuthService = TokenAuthService({
  models: {
    TokenUser,
  },
  tokenConfig: tokenConfigGenerator({ expireTokensEveryNHours: 1 }),
  events,
};
```

Once it is loaded, you can authorize requests from **within** apollo resolvers:
```javascript
//within a resolver get the token from the context
const { token, tokenAuthService } = context;
const tokenPayload = tokenAuthService.verifyToken({token})
if (!tokenPayload) {
  throw new Errr('Hey you are not legit!');
}
// or
const { token, tokenAuthService } = context;
const tokenUser = tokenAuthService.authenticateTokenStrategy({token})
```
