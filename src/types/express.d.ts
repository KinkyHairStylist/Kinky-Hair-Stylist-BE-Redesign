import 'express-session';
import { User } from '../all_user_entities/user.entity';

declare module 'express-session' {
  interface Session {
    userId: string;
    isAuthenticated: boolean;
    user: Partial<User>;
  }
}