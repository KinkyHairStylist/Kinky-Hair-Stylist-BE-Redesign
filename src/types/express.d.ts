import 'express-session';
import { User } from '../user/user.entity';

declare module 'express-session' {
  interface Session {
    userId: string;
    isAuthenticated: boolean;
    user: Partial<User>;
  }
}