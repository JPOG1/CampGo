import { TokenPayload } from './auth/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
