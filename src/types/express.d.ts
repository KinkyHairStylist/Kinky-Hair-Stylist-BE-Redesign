import { Session } from 'express-session';
import { User } from '../user/user.schema';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    isAuthenticated: boolean;
    user: Partial<User>;
  }
}

// Extend express Request to include session
declare module 'express' {
  interface Request {
    session: Session & Partial<SessionData>;
  }
}