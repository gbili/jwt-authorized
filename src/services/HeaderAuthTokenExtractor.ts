import { IncomingMessage } from "http";

type Context = { [k: string]: any; }
type RequestProp = { req: IncomingMessage };

export default class HeaderAuthTokenExtractor {
  static getAsyncContextReqMethod(context: Context) {
    return async function ({ req }: RequestProp): Promise<Context & { token?: string; } & RequestProp> {

      if (!req.headers || !req.headers.authorization) {
        return {
          ...context,
          req,
        };
      }

      const parts = req.headers.authorization.split(' ');

      if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
        throw new Error('credentials_bad_scheme message: Format is Authorization: Bearer [token]');
      }

      return {
        ...context,
        token: parts[1],
        req,
      };
    };
  }
}